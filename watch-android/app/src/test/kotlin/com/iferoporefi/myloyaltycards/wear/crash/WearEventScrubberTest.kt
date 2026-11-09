package com.iferoporefi.myloyaltycards.wear.crash

import io.sentry.Breadcrumb
import io.sentry.SentryEvent
import io.sentry.protocol.App
import io.sentry.protocol.Device
import io.sentry.protocol.Message
import io.sentry.protocol.OperatingSystem
import io.sentry.protocol.Request
import io.sentry.protocol.SentryException
import io.sentry.protocol.User
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Story 24.5, matrix row "Event content (Wear)": no user, no `device.id`, no installation id and
 * nothing an IP-derived location could come from. Mirrors the phone's `scrubEvent` tests in
 * `core/observability/sentry.test.ts`.
 */
class WearEventScrubberTest {

    private fun fullEvent(): SentryEvent =
        SentryEvent().apply {
            user = User().apply {
                id = "installation-id-1234"
                ipAddress = "{{auto}}"
                email = "someone@example.com"
            }
            request = Request().apply { url = "https://example.com/?user_id=eq.abc" }
            serverName = "watch-host"
            exceptions = listOf(SentryException().apply { type = "IllegalStateException"; value = "boom" })
            contexts.setDevice(
                Device().apply {
                    id = "installation-id-1234"
                    model = "sdk_gwear_x86_64"
                    family = "sdk_gwear"
                    manufacturer = "Google"
                    brand = "google"
                    setSimulator(true)
                    locale = "it_IT"
                    timezone = java.util.TimeZone.getTimeZone("Europe/Rome")
                    memorySize = 2_000_000_000L
                    batteryLevel = 80f
                    screenDensity = 2.0f
                    bootTime = java.util.Date(0)
                },
            )
            contexts.setApp(
                App().apply {
                    appVersion = "1.0.0"
                    appBuild = "2000040"
                    appName = "Cardì"
                    appIdentifier = "com.iferoporefi.myloyaltycards"
                    deviceAppHash = "install-hash"
                    appStartTime = java.util.Date(0)
                },
            )
            contexts.setOperatingSystem(OperatingSystem().apply { name = "Android"; version = "13" })
            contexts.put("culture", mapOf("locale" to "it-IT", "timezone" to "Europe/Rome"))
            setTag("app.device", "install-hash")
            setTag("kept", "yes")
        }

    @Test
    fun `removes the user, the request and the server name`() {
        val scrubbed = WearEventScrubber.scrub(fullEvent())

        assertNull(scrubbed.user)
        assertNull(scrubbed.request)
        assertNull(scrubbed.serverName)
    }

    @Test
    fun `keeps only the allow-listed device fields, so no device id`() {
        val device = assertNotNullAndGet(WearEventScrubber.scrub(fullEvent()).contexts.device)

        assertNull(device.id)
        assertNull(device.locale)
        assertNull(device.timezone)
        assertNull(device.memorySize)
        assertNull(device.batteryLevel)
        assertNull(device.screenDensity)
        assertNull(device.bootTime)
        assertEquals("sdk_gwear_x86_64", device.model)
        assertEquals("sdk_gwear", device.family)
        assertEquals("Google", device.manufacturer)
        assertEquals("google", device.brand)
        assertEquals(true, device.isSimulator)
    }

    @Test
    fun `keeps only the allow-listed app fields, so no install hash`() {
        val app = assertNotNullAndGet(WearEventScrubber.scrub(fullEvent()).contexts.app)

        assertNull(app.deviceAppHash)
        assertNull(app.appStartTime)
        assertEquals("1.0.0", app.appVersion)
        assertEquals("2000040", app.appBuild)
        assertEquals("Cardì", app.appName)
        assertEquals("com.iferoporefi.myloyaltycards", app.appIdentifier)
    }

    @Test
    fun `drops the culture context and the install-hash tag, keeps the OS, the error and other tags`() {
        val scrubbed = WearEventScrubber.scrub(fullEvent())

        assertNull(scrubbed.contexts.get("culture"))
        assertNull(scrubbed.getTag("app.device"))
        assertEquals("yes", scrubbed.getTag("kept"))
        assertEquals("Android", scrubbed.contexts.operatingSystem?.name)
        assertEquals("13", scrubbed.contexts.operatingSystem?.version)
        assertEquals("boom", scrubbed.exceptions?.single()?.value)
    }

    @Test
    fun `an event with no contexts or tags passes through unharmed`() {
        val bare = SentryEvent()

        val scrubbed = WearEventScrubber.scrub(bare)

        assertSame(bare, scrubbed)
        assertNull(scrubbed.contexts.device)
        assertNull(scrubbed.contexts.app)
        assertNull(scrubbed.user)
    }

    private val cardId = "3f2b9c1e-8a4d-4f6e-9b7a-1c2d3e4f5a6b"
    private val accountId = "A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D"

    private fun breadcrumb(category: String?, message: String? = null): Breadcrumb =
        Breadcrumb().apply {
            this.category = category
            this.message = message
        }

    @Test
    fun `masks every UUID in the exception values and the message`() {
        val event = SentryEvent().apply {
            exceptions = listOf(
                SentryException().apply { value = "Card $cardId failed to sync for $accountId" },
                SentryException().apply { value = null },
            )
            message = Message().apply {
                formatted = "Card $cardId not found"
                this.message = "Card %s not found ($accountId)"
                params = listOf(cardId, "plain")
            }
        }

        val scrubbed = WearEventScrubber.scrub(event)

        assertEquals("Card [uuid] failed to sync for [uuid]", scrubbed.exceptions!![0].value)
        assertNull(scrubbed.exceptions!![1].value)
        assertEquals("Card [uuid] not found", scrubbed.message?.formatted)
        assertEquals("Card %s not found ([uuid])", scrubbed.message?.message)
        assertEquals(listOf("[uuid]", "plain"), scrubbed.message?.params)
    }

    @Test
    fun `redacts sensitive keys in extra at any depth and masks UUIDs in its strings`() {
        val event = SentryEvent().apply {
            extras = mapOf(
                "context" to "sync failed for card $cardId",
                "barcodeValue" to "1234567890",
                "nested" to mapOf("accessToken" to "abc", "count" to 3, "ids" to listOf(cardId)),
                "userEmail" to "someone@example.com",
            )
        }

        val extras = assertNotNullAndGet(WearEventScrubber.scrub(event).extras)

        assertEquals("sync failed for card [uuid]", extras["context"])
        assertEquals(WearEventScrubber.REDACTED, extras["barcodeValue"])
        assertEquals(WearEventScrubber.REDACTED, extras["userEmail"])
        assertEquals(
            mapOf("accessToken" to WearEventScrubber.REDACTED, "count" to 3, "ids" to listOf("[uuid]")),
            extras["nested"],
        )
    }

    @Test
    fun `redacts a key for every alternative of the phone's sensitive-key pattern and keeps a plain one`() {
        val sensitiveKeys = listOf(
            "barcode", "cardNumber", "card_number", "rawValue", "password", "clientSecret", "accessToken",
            "userEmail", "apiKey", "api_key", "Authorization", "cookie", "phoneNumber", "firstName",
            "lastName", "fullName", "displayName", "userName", "nickName",
        )
        val event = SentryEvent().apply {
            extras = sensitiveKeys.associateWith { "value" } + ("storeName" to "Tesco")
        }

        val extras = assertNotNullAndGet(WearEventScrubber.scrub(event).extras)

        sensitiveKeys.forEach { key -> assertEquals(key, WearEventScrubber.REDACTED, extras[key]) }
        assertEquals("Tesco", extras["storeName"])
    }

    @Test
    fun `masks UUIDs inside an array in breadcrumb data`() {
        val crumb = breadcrumb("http").apply { setData("ids", arrayOf(cardId, "plain")) }

        val scrubbed = assertNotNullAndGet(WearEventScrubber.scrubBreadcrumb(crumb))

        assertEquals(listOf("[uuid]", "plain"), scrubbed.getData("ids"))
    }

    @Test
    fun `a cyclic extra collapses to the redaction marker instead of recursing forever`() {
        val cyclic = HashMap<String, Any>()
        cyclic["self"] = cyclic
        val event = SentryEvent().apply { extras = mapOf("loop" to cyclic) }

        val extras = assertNotNullAndGet(WearEventScrubber.scrub(event).extras)

        assertEquals(mapOf("self" to WearEventScrubber.REDACTED), extras["loop"])
    }

    @Test
    fun `redacts sensitive keys in custom contexts, and a sensitive context key whole`() {
        val event = SentryEvent().apply {
            contexts.put("sync", mapOf("cardNumber" to "4111", "phase" to "push"))
            contexts.put("authToken", mapOf("value" to "abc"))
        }

        val contexts = WearEventScrubber.scrub(event).contexts

        assertEquals(mapOf("cardNumber" to WearEventScrubber.REDACTED, "phase" to "push"), contexts.get("sync"))
        assertEquals(WearEventScrubber.REDACTED, contexts.get("authToken"))
    }

    @Test
    fun `drops console, touch and ui breadcrumbs, their dotted children included`() {
        listOf("console", "touch", "ui", "ui.lifecycle", "ui.click", "touch.tap").forEach { category ->
            assertNull(category, WearEventScrubber.scrubBreadcrumb(breadcrumb(category)))
        }
    }

    @Test
    fun `keeps other breadcrumbs, a category merely starting with ui included`() {
        listOf(null, "navigation", "http", "app.lifecycle", "uikit", "device.event").forEach { category ->
            assertNotNull(category, WearEventScrubber.scrubBreadcrumb(breadcrumb(category)))
        }
    }

    @Test
    fun `strips the query and fragment from a breadcrumb url and masks UUIDs in its message and data`() {
        val crumb = breadcrumb("http", "Fetched card $cardId").apply {
            setData("url", "https://api.example.com/cards/$cardId?user_id=eq.$accountId#top")
            setData("note", "for $accountId")
            setData("ids", listOf(cardId))
            setData("status_code", 500)
        }

        val scrubbed = assertNotNullAndGet(WearEventScrubber.scrubBreadcrumb(crumb))

        assertEquals("Fetched card [uuid]", scrubbed.message)
        assertEquals("https://api.example.com/cards/[uuid]", scrubbed.getData("url"))
        assertEquals("for [uuid]", scrubbed.getData("note"))
        assertEquals(listOf("[uuid]"), scrubbed.getData("ids"))
        assertEquals(500, scrubbed.getData("status_code"))
    }

    @Test
    fun `cleans an event's breadcrumbs the same way`() {
        val event = SentryEvent().apply {
            breadcrumbs = mutableListOf(
                breadcrumb("ui.lifecycle", "MainActivity created"),
                breadcrumb("console", "log line"),
                breadcrumb("navigation", "Opened card $cardId"),
            )
        }

        val breadcrumbs = assertNotNullAndGet(WearEventScrubber.scrub(event).breadcrumbs)

        assertEquals(1, breadcrumbs.size)
        assertEquals("navigation", breadcrumbs.single().category)
        assertEquals("Opened card [uuid]", breadcrumbs.single().message)
        assertTrue(breadcrumbs.none { it.category == "ui.lifecycle" })
    }

    private fun <T> assertNotNullAndGet(value: T?): T {
        assertNotNull(value)
        return value!!
    }
}
