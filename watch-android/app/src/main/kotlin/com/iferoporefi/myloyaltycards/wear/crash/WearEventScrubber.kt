package com.iferoporefi.myloyaltycards.wear.crash

import io.sentry.Breadcrumb
import io.sentry.SentryEvent
import io.sentry.protocol.App
import io.sentry.protocol.Device
import io.sentry.protocol.Message
import java.util.IdentityHashMap

/**
 * The Wear app's `beforeSend` and `beforeBreadcrumb` (Story 24.5), trimmed exactly as Story 24-1
 * trims the phone's (`core/observability/sentry.ts`: `scrubEvent` and `scrubBreadcrumb`), so the
 * privacy policy's "limited in the same way as the phone's" stays true.
 *
 * [scrub] (the `beforeSend`), as the phone's `scrubEvent`:
 *
 * - drops `user` (which the Android SDK fills with the installation id when the app sets no user),
 *   `request` and `server_name`;
 * - keeps only the allow-listed `device` and `app` context fields, which drops `device.id` (the
 *   installation id again), locale, timezone, memory, battery, screen, boot time, `device_app_hash`
 *   and the start time; drops any `culture` context and the `app.device` tag. Every other context,
 *   the OS one included, passes through;
 * - masks every UUID ([UUID_MASK]) in the exception values, the message and the breadcrumbs, which
 *   also go through [scrubBreadcrumb];
 * - redacts `extra` and `contexts` by [SENSITIVE_KEY_PATTERN] and masks UUIDs in `extra`'s strings.
 *
 * [scrubBreadcrumb] (the `beforeBreadcrumb`), as the phone's: drops `console`, `touch` and `ui`
 * breadcrumbs and their dotted children (`ui.lifecycle` included), strips the query and fragment
 * from a `url` data value, masks UUIDs in the message and string data.
 *
 * Unlike the phone's JS hooks, these DO run for crashes: the Android SDK applies `beforeSend` to an
 * uncaught exception before it writes the envelope to disk.
 *
 * Both trim in place and return what they were given (or `null` to drop a breadcrumb), the
 * convention of the Java SDK's callbacks.
 */
object WearEventScrubber {

    /** Placeholder substituted for a redacted (sensitive-keyed) value. Same as the phone's. */
    const val REDACTED = "[Redacted]"

    /** Placeholder substituted for every UUID in free text. Same as the phone's. */
    const val UUID_MASK = "[uuid]"

    /** The phone's `SENSITIVE_KEY_PATTERN`, verbatim: matched case-insensitively within the key. */
    private val SENSITIVE_KEY_PATTERN = Regex(
        "barcode|card.?number|raw.?value|password|secret|token|email|api.?key|authorization|cookie|" +
            "phone|first.?name|last.?name|full.?name|display.?name|user.?name|nick.?name",
        RegexOption.IGNORE_CASE,
    )

    /** The phone's `UUID_PATTERN`: card row ids and account ids. */
    private val UUID_PATTERN =
        Regex("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", RegexOption.IGNORE_CASE)

    /** The query string and fragment of a URL. */
    private val QUERY_AND_FRAGMENT = Regex("[?#][\\s\\S]*$")

    /** Guard against pathological or cyclic payloads, as the phone's `MAX_REDACT_DEPTH`. */
    private const val MAX_REDACT_DEPTH = 10

    /** The phone's `DROPPED_BREADCRUMB_CATEGORIES`. */
    private val DROPPED_BREADCRUMB_CATEGORIES = listOf("console", "touch", "ui")

    /** Breadcrumb `data` keys that hold URLs. */
    private val URL_DATA_KEYS = setOf("url")

    private const val CULTURE_CONTEXT = "culture"
    private const val INSTALL_HASH_TAG = "app.device"

    private fun maskUuids(text: String): String = UUID_PATTERN.replace(text, UUID_MASK)

    private fun cleanUrl(url: String): String = maskUuids(QUERY_AND_FRAGMENT.replace(url, ""))

    private fun isDroppedCategory(category: String?): Boolean =
        category != null &&
            DROPPED_BREADCRUMB_CATEGORIES.any { category == it || category.startsWith("$it.") }

    /**
     * The phone's `redactValue`: a sensitive key's value becomes [REDACTED] at any depth of a map or
     * list; cycles and excessive depth collapse to [REDACTED]. Maps and lists are copied; any other
     * value (strings, numbers, the SDK's typed context objects) is returned as is.
     */
    private fun redact(value: Any?, depth: Int, seen: IdentityHashMap<Any, Unit>): Any? {
        if (value !is Map<*, *> && value !is Collection<*> && value !is Array<*>) return value
        if (depth >= MAX_REDACT_DEPTH || seen.containsKey(value)) return REDACTED
        seen[value] = Unit
        return when (value) {
            is Map<*, *> -> LinkedHashMap<String, Any?>().also { result ->
                value.forEach { (key, nested) ->
                    val name = key.toString()
                    result[name] =
                        if (SENSITIVE_KEY_PATTERN.containsMatchIn(name)) REDACTED else redact(nested, depth + 1, seen)
                }
            }
            is Collection<*> -> value.map { redact(it, depth + 1, seen) }
            else -> (value as Array<*>).map { redact(it, depth + 1, seen) }
        }
    }

    /** The phone's `maskUuidsDeep`, over an already-redacted (so acyclic) structure. */
    private fun maskUuidsDeep(value: Any?, depth: Int = 0): Any? =
        when {
            value is String -> maskUuids(value)
            depth >= MAX_REDACT_DEPTH -> value
            value is Map<*, *> -> value.entries.associate { (key, nested) ->
                key.toString() to maskUuidsDeep(nested, depth + 1)
            }
            value is Collection<*> -> value.map { maskUuidsDeep(it, depth + 1) }
            value is Array<*> -> value.map { maskUuidsDeep(it, depth + 1) }
            else -> value
        }

    /** Mirrors `DEVICE_CONTEXT_ALLOW_LIST` in `core/observability/sentry.ts`. */
    private fun trimDevice(source: Device): Device =
        Device().also { trimmed ->
            trimmed.model = source.model
            trimmed.family = source.family
            trimmed.manufacturer = source.manufacturer
            trimmed.brand = source.brand
            trimmed.setSimulator(source.isSimulator)
        }

    /** Mirrors `APP_CONTEXT_ALLOW_LIST` in `core/observability/sentry.ts`. */
    private fun trimApp(source: App): App =
        App().also { trimmed ->
            trimmed.appVersion = source.appVersion
            trimmed.appBuild = source.appBuild
            trimmed.appName = source.appName
            trimmed.appIdentifier = source.appIdentifier
        }

    /** The `beforeBreadcrumb` hook, also applied to an event's breadcrumbs by [scrub]. */
    fun scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb? {
        if (isDroppedCategory(breadcrumb.category)) return null

        breadcrumb.message?.let { breadcrumb.message = maskUuids(it) }
        // A snapshot: setData writes back into the same map.
        breadcrumb.data.entries.toList().forEach { (key, value) ->
            val cleaned = when {
                value is String && key in URL_DATA_KEYS -> cleanUrl(value)
                value is String -> maskUuids(value)
                else -> maskUuidsDeep(value)
            }
            breadcrumb.setData(key, cleaned)
        }
        return breadcrumb
    }

    private fun scrubMessage(message: Message) {
        message.formatted?.let { message.formatted = maskUuids(it) }
        message.message?.let { message.message = maskUuids(it) }
        message.params?.let { params -> message.params = params.map(::maskUuids) }
    }

    /** Trims [event] in place and returns it, as a Sentry `beforeSend` callback does. */
    fun scrub(event: SentryEvent): SentryEvent {
        event.user = null
        event.request = null
        event.serverName = null

        val contexts = event.contexts
        contexts.remove(CULTURE_CONTEXT)
        contexts.device?.let { contexts.setDevice(trimDevice(it)) }
        contexts.app?.let { contexts.setApp(trimApp(it)) }
        event.removeTag(INSTALL_HASH_TAG)

        event.exceptions?.forEach { exception -> exception.value?.let { exception.value = maskUuids(it) } }
        event.message?.let(::scrubMessage)
        event.breadcrumbs?.let { breadcrumbs -> event.breadcrumbs = breadcrumbs.mapNotNull(::scrubBreadcrumb) }

        event.extras?.let { extras ->
            @Suppress("UNCHECKED_CAST")
            event.extras = maskUuidsDeep(redact(extras, 0, IdentityHashMap())) as Map<String, Any>
        }
        contexts.entrySet().toList().forEach { (key, value) ->
            contexts.put(
                key,
                if (SENSITIVE_KEY_PATTERN.containsMatchIn(key)) REDACTED else redact(value, 1, IdentityHashMap()),
            )
        }
        return event
    }
}
