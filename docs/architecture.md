---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - 'docs/prd.md'
  - 'docs/ux-design-specification.md'
workflowType: 'architecture'
lastStep: 8
status: 'complete'
project_name: 'myLoyaltyCards'
user_name: 'Ifero'
date: '2025-12-28'
validationDate: '2025-12-31'
completedAt: '2025-12-31'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
74 functional requirements organized into 13 categories:

- Card Management (FR1-9): Core CRUD operations with barcode scanning
- Barcode Display (FR10-13): Multi-format rendering for phone and wearables
- Italian Brand Catalogue (FR14-20): JSON-based catalogue with offline caching
- Smart Card Sorting (FR21-24): Intelligent ordering algorithm
- User Authentication (FR25-33): Optional accounts with guest mode support
- Data Synchronization (FR34-42): Bidirectional sync across devices and cloud
- Wearable Experience (FR43-47): Standalone watch app functionality
- Offline Functionality (FR48-52): Complete offline operation
- Privacy & GDPR (FR53-58): EU compliance requirements
- User Feedback (FR59-65): Error handling and status indicators
- App Settings (FR66-69): User preferences and configuration
- Onboarding (FR72-74): First-time user guidance

**Non-Functional Requirements:**

- Performance: ≤3s wearable card display, <1s phone cold start, <2s watch cold start, 60fps UI
- Security: AES-256 encryption at rest, TLS 1.2+, bcrypt password hashing
- Privacy: Full GDPR compliance including data export, deletion, and consent
- Reliability: 100% offline functionality, zero data loss during sync
- Usability: Cross-platform consistency, light/dark mode, internationalization
- Maintainability: Open-source quality standards, MIT license

**Scale & Complexity:**

- Primary domain: Cross-platform Mobile + Wearable
- Complexity level: Medium-High
- Estimated architectural components: 8-12 major modules

### Technical Constraints & Dependencies

**Platform Constraints:**

- React Native + Expo as development framework
- 4 target platforms: iOS, Android, watchOS, Wear OS
- **Web is explicitly not a target.** The app is portrait phone + wearable only; its JS entry
  reaches native-only modules with no web implementation (`react-native-watch-connectivity`,
  `expo-sqlite`, `react-native-image-code-scanner`, `expo-brightness`, `burnt`), so a web
  bundle is not buildable without shimming each one. `app.json` therefore declares no
  `expo.web` block. `react-native-web`/`react-dom` remain installed **for Storybook only**
  (`.storybook/`, Chromatic — Story 16.5), which bundles via Vite and never loads the app entry.
- Wearable storage limits (~100MB for app + data)
- Expo dev client with custom native modules for wearable features

**Technology Stack (Pre-decided):**

- React Native + Expo SDK (latest)
- NativeWind (Tailwind CSS) for styling ⚠️ **Under evaluation** — see ADR-2026-04-11-001
- Native components for wearable apps, embedded via `@bacons/apple-targets` (CNG)

**Market Constraints:**

- Italy-only catalogue for MVP
- EU GDPR compliance required
- Open-source MIT license

### Cross-Cutting Concerns Identified

1. **Offline Data Persistence**
   - Every feature must work without network
   - Local storage required on both phone and wearable
   - Catalogue caching for offline brand browsing

2. **Sync Orchestration**
   - Phone ↔ Watch: Bluetooth sync for guest mode
   - Phone ↔ Cloud: HTTP sync for authenticated users
   - Delta sync for efficiency
   - Last-write-wins conflict resolution

3. **Performance Optimization**
   - Cold start targets: <1s phone, <2s watch
   - Barcode rendering: <100ms
   - 60fps UI interactions
   - Battery efficiency on wearables

4. **Security & Privacy**
   - Encryption at rest (AES-256)
   - Secure transport (TLS 1.2+)
   - GDPR data rights (access, export, deletion)
   - No tracking or analytics

5. **Multi-Platform Consistency**
   - Single React Native codebase
   - Platform-adaptive UI patterns
   - Feature parity across all 4 platforms

6. **Error Handling & Resilience**
   - Graceful offline degradation
   - Sync retry with queued operations
   - Clear user feedback for all error states

## Starter Template Evaluation

### Primary Technology Domain

Cross-platform Mobile + Wearable application requiring:

- Phone apps via React Native + Expo (iOS, Android)
- Wearable apps via native development (watchOS, Wear OS)

### Existing Foundation Evaluated

Project initialized with `npx create-expo-app@latest` providing:

- Expo SDK 54.0.0 (December 2024 release)
- React 19.1.0 with React Native 0.81.5
- Expo Router 6.0.15 (file-based navigation)
- TypeScript 5.6.0
- New Architecture enabled (Fabric + TurboModules)

### Wearable Architecture Decision (Tree of Thoughts Analysis)

**Options Evaluated:**

1. **Expo + Native Wearable Companions** - Native Swift/Kotlin for watches
2. **React Native + Custom Native Modules** - JS bridges to native watch APIs
3. **Flutter Rewrite** - Complete stack change

**Key Finding:** All paths promising "shared wearable code" are illusions. React Native and Flutter lack true standalone wearable support. Both alternative paths eventually require native development anyway, but add complexity layers first.

**Decision: Expo + Native Wearable Companions (Phased Approach)**

### Selected Approach: iOS-First Phased Development

**Phase 1: iOS-First MVP**

- Phone: Expo/React Native (existing setup)
- Apple Watch: Native Swift/SwiftUI
- Goal: Validate "wrist raise → 3 seconds" with real users
- Rationale: Apple Watch is the primary wearable use case; validate concept before expanding

**Phase 2: Android Expansion**

- Phone: Same Expo codebase (already cross-platform)
- Wear OS: Native Kotlin/Compose
- Apply learnings from watchOS development

**Rationale for Phased Approach:**

1. Reduces risk by validating on ONE wearable platform first
2. Apple Watch has larger market share for standalone apps
3. Learning Swift/SwiftUI provides foundation for quality native development
4. Single wearable focus enables faster time to validation
5. Expo phone app already supports both iOS and Android

### watchOS Distribution Architecture (Updated 2026-04-11)

> **ADR-2026-04-11-002: watchOS apps must be embedded in the iOS app archive**
>
> Apple requires ALL watchOS apps — including "independent" ones (watchOS 6+) — to be distributed embedded inside the iOS app's IPA archive. There is no standalone watchOS binary upload to App Store Connect or TestFlight. The watch binary is discovered by watchOS via the "Embed Watch Content" build phase within the iOS archive.
>
> **Previous approach (pre-Sprint 12):** Standalone Xcode project at `watch-ios/MyLoyaltyCardsWatch.xcodeproj`, completely disconnected from the Expo-generated iOS project. This could not produce distributable builds.
>
> **Current approach:** Use `@bacons/apple-targets` (Expo Config Plugin by Evan Bacon, Expo team) to embed the watchOS target in the iOS Xcode project during `expo prebuild`. Source files live at `targets/watch/` outside the `ios/` directory, surviving `expo prebuild --clean`. The plugin generates:
>
> - A native watchOS target with correct build settings (`SDKROOT: watchos`, `TARGETED_DEVICE_FAMILY: 4`)
> - An "Embed Watch Content" copy files build phase on the main iOS target
> - Source file references linked from `targets/watch/`
>
> **Result:** A single `fastlane ios beta` command archives both iOS + watchOS into one IPA → one TestFlight upload → both apps distributed.
>
> **Signing:** Fastlane lanes (`beta`, `adhoc`, `upload_release`) call `match` and `update_code_signing_settings` for BOTH bundle IDs: `com.iferoporefi.myloyaltycards` (iOS) and `com.iferoporefi.myloyaltycards.watch` (watchOS).

### Project Structure

```
myLoyaltyCards/
├── .github/                # GitHub Actions CI/CD
│   └── workflows/
│       ├── ci-quality-gates.yml    # PR quality gates (lint, typecheck, test, coverage)
│       ├── ios-release.yml         # AdHoc iOS build on push to main (app paths)
│       ├── android-release.yml     # AdHoc Android build on push to main (app paths)
│       ├── beta-releases.yml       # TestFlight + beta on v*.*.*-rc.* tags (iOS+watchOS+Android)
│       ├── store-upload.yml        # App Store + Play Store on v*.*.* tags
│       └── watchos-tests.yml       # watchOS tests on PR/push (targets/watch/**)
├── fastlane/               # Build automation
│   ├── Fastfile            # Build lanes (adhoc, beta, upload_release) — signs iOS + watchOS
│   ├── Appfile             # App identifiers
│   └── Matchfile           # iOS + watchOS code signing (match)
├── app/                    # Expo Router (thin routing layer)
│   ├── _layout.tsx         # Root layout with header (+/⚙️ buttons)
│   ├── index.tsx           # → features/cards
│   ├── card/[id].tsx       # → features/cards (detail view)
│   ├── add.tsx             # → features/add-card
│   ├── settings.tsx        # → features/settings
│   └── auth/               # Optional auth flows
├── features/               # Self-contained feature modules
│   ├── cards/              # Card list & detail
│   ├── add-card/           # Add card flow (scan/manual/catalogue)
│   ├── settings/           # User preferences
│   └── auth/               # Authentication (optional)
├── shared/                 # Cross-feature utilities
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Shared hooks
│   └── utils/              # Utilities
├── core/                   # Platform-agnostic business logic
│   ├── db/                 # Database layer
│   ├── sync/               # Sync logic
│   ├── stores/             # Zustand stores
│   ├── schemas/            # Zod schemas (data validation)
│   └── types/              # TypeScript-only types (navigation, utilities)
├── catalogue/              # Italian brand catalogue (source of truth)
│   └── italy.json
├── test-fixtures/          # Cross-platform test data
│   ├── card-valid.json
│   └── sync-message-v1.json
├── targets/                # Apple native targets (CNG-managed via @bacons/apple-targets)
│   └── watch/              # watchOS companion app (Swift/SwiftUI)
│       ├── expo-target.config.js  # Target config (type, bundle ID, frameworks)
│       ├── MyLoyaltyCardsWatchApp.swift  # @main entry point
│       ├── ContentView.swift
│       ├── CardListView.swift
│       ├── BarcodeFlashView.swift
│       ├── BarcodeGenerator.swift
│       ├── ColorHelpers.swift
│       ├── ComplicationProvider.swift
│       ├── WatchCardEntity.swift  # SwiftData model
│       └── Assets.xcassets/       # Watch app icon, AccentColor
├── watch-android/          # Native Wear OS (Kotlin/Compose) — STANDALONE Gradle project
│   ├── README.md           # ⚠️ Documents this is native Kotlin, not RN
│   └── app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/
│       └── Generated/
│           └── Brands.kt   # Generated from /catalogue/italy.json — COMMITTED,
│                           # drift-gated by `yarn wear:catalogue:check`. The generator
│                           # is scripts/generate-wear-catalogue.mjs (Node, not a .kts),
│                           # and Gradle never runs it. See Story 10.2.
├── app.json                # Expo config with @bacons/apple-targets plugin
└── .env.example            # Template for local development
```

**Watch App Documentation Strategy:**

- Root `README.md`: Overview table showing which folders are React Native vs Native
- `targets/watch/`: Source lives here, but Xcode project is generated by `expo prebuild` inside `ios/`. No standalone Xcode project — developers open `ios/Cardi.xcworkspace` and select the watch scheme.
- `watch-android/README.md` (future): Kotlin/Compose build instructions, Android Studio setup

Key documentation points for watchOS:

1. Clear statement: "This is native Swift/SwiftUI, NOT React Native"
2. Source location: `targets/watch/` (survives `expo prebuild --clean`)
3. Build: `npx expo prebuild --platform ios` → Xcode → watch scheme → run on simulator
4. Distribution: Embedded in iOS IPA — `fastlane ios beta` ships both apps
5. Relationship to phone app: WatchConnectivity (`react-native-watch-connectivity` on iOS side)

### Architectural Decisions Provided by Starter

**Language & Runtime:**

- TypeScript 5.6 with strict mode (phone)
- Swift 5.9+ with SwiftUI (watchOS - Phase 1)
- Kotlin with Jetpack Compose (Wear OS - Phase 2)

**Navigation Solution:**

- Expo Router 6.x with file-based routing (phone)
- NavigationStack (watchOS)
- Navigation Compose (Wear OS)

**Build Tooling:**

- GitHub Actions for CI/CD (free for OSS, transparent to contributors)
- Fastlane for build automation (iOS, Android — watchOS embedded in iOS archive)
- `@bacons/apple-targets` Config Plugin for Continuous Native Generation of watchOS target
- Xcode for iOS + embedded watchOS builds (via macOS GitHub runners)
- Android Studio / Gradle for Wear OS builds (Phase 2)
- Expo Development Build to bridge phone and native code

**Data Synchronization:**

- WatchConnectivity framework (iOS ↔ watchOS)
- Wearable Data Layer API (Android ↔ Wear OS)
- JSON schemas shared across all platforms for consistency

### Additional Dependencies Required

**Phone App (React Native/Expo):**

- `nativewind` + `tailwindcss` - Styling per UX spec
- `expo-camera` - Barcode scanning
- `expo-sqlite` - Offline data persistence
- `expo-secure-store` - Encrypted credential storage
- `expo-auth-session` - OAuth flows

**watchOS App (Swift/SwiftUI):**

- WatchConnectivity - Phone sync
- SwiftData or CoreData - Local persistence
- Native barcode rendering

**Wear OS App (Kotlin/Compose - Phase 2):**

- Wearable Data Layer API - Phone sync
- Room Database - Local persistence
- ZXing or native barcode rendering

### Risk Mitigation

**Learning Curve (Swift/SwiftUI):**

- SwiftUI is declarative like React - transferable mental model
- Apple's documentation is excellent
- watchOS apps are small in scope (card list + barcode display)

**Phased Approach Benefits:**

- Validate core concept before multi-platform investment
- Can ship iOS + Apple Watch to App Store while Wear OS in development
- Real user feedback informs Android wearable design

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Local database strategy (expo-sqlite)
- Cloud backend selection (Supabase)
- Phone-Watch sync framework (WatchConnectivity / Wearable Data Layer)
- CI/CD platform (GitHub Actions + Fastlane)

**Important Decisions (Shape Architecture):**

- State management (Zustand)
- Data fetching (TanStack Query)
- Authentication flow (Supabase Auth)
- Catalogue distribution (Bundled + OTA)

**Deferred Decisions (Post-MVP):**

- Advanced caching strategies
- Analytics integration
- Push notification infrastructure

### Data Architecture

| Component           | Technology            | Version | Rationale                                 |
| ------------------- | --------------------- | ------- | ----------------------------------------- |
| Phone Local DB      | expo-sqlite           | Latest  | Structured queries for smart sorting      |
| watchOS Storage     | SwiftData             | iOS 18+ | Modern Swift-native persistence           |
| Wear OS Storage     | Room                  | Latest  | Kotlin-native, Jetpack standard           |
| Cloud Database      | Supabase (PostgreSQL) | Latest  | Structured data, built-in auth, free tier |
| Sync Strategy       | Delta sync            | —       | Timestamp-based, changed cards only       |
| Conflict Resolution | Last-write-wins       | —       | Simple, predictable behavior              |

### Authentication & Security

| Component        | Technology        | Rationale                            |
| ---------------- | ----------------- | ------------------------------------ |
| Auth Provider    | Supabase Auth     | Email, Apple, Google out-of-box      |
| Token Storage    | expo-secure-store | Keychain (iOS) / Keystore (Android)  |
| API Security     | Supabase RLS      | Row-level security policies          |
| Transport        | TLS 1.2+          | Supabase default                     |
| Local Card Data  | Plain SQLite      | Barcodes aren't secrets; performance |
| Password Hashing | bcrypt            | Supabase default                     |

### API & Communication Patterns

| Pattern           | Technology              | Notes                          |
| ----------------- | ----------------------- | ------------------------------ |
| Phone ↔ Cloud     | Supabase REST API       | Via @supabase/supabase-js      |
| iOS ↔ watchOS     | WatchConnectivity       | Apple's native framework       |
| Android ↔ Wear OS | Wearable Data Layer API | Google's native framework      |
| Catalogue Updates | Bundled + OTA           | No runtime fetch, Expo Updates |
| Offline Queue     | Local queue + retry     | Operations queued when offline |

### Frontend Architecture

| Component        | Technology      | Version | Rationale                            |
| ---------------- | --------------- | ------- | ------------------------------------ |
| State Management | Zustand         | ^4.x    | Minimal boilerplate, hooks-based     |
| Data Fetching    | TanStack Query  | ^5.x    | Caching, offline, background sync    |
| Form Handling    | React Hook Form | ^7.x    | Performant, minimal re-renders       |
| Validation       | Zod             | ^3.x    | Shared schemas, TypeScript inference |
| Styling          | NativeWind      | ^4.x    | Tailwind CSS for React Native        |

### Infrastructure & Deployment

| Component          | Technology                          | Rationale                           |
| ------------------ | ----------------------------------- | ----------------------------------- |
| CI/CD Platform     | GitHub Actions                      | Free for OSS, transparent workflows |
| Build Automation   | Fastlane                            | Industry standard for iOS/Android   |
| Phone Builds       | GitHub Actions + Fastlane           | Expo prebuild + native builds       |
| watchOS Builds     | GitHub Actions (macOS) + Fastlane   | Native Swift builds                 |
| Wear OS Builds     | GitHub Actions + Fastlane           | Native Kotlin builds                |
| Environment Config | app.config.ts + GitHub Environments | Per-environment switching           |
| Error Tracking     | Sentry                              | Free tier, crash reporting          |
| OTA Updates        | Expo Updates                        | JS-only updates without app store   |

### Environment Strategy (Dev + Production)

| Aspect                   | Dev                        | Production                     |
| ------------------------ | -------------------------- | ------------------------------ |
| **Purpose**              | Testing, PR previews       | App Store releases             |
| **Supabase**             | `myloyaltycards-dev`       | `myloyaltycards-prod`          |
| **iOS Distribution**     | TestFlight                 | App Store                      |
| **Android Distribution** | Internal Track             | Google Play                    |
| **Trigger**              | Push to main, PRs          | Published GitHub Release (v\*) |
| **Approval**             | None                       | Required (GitHub Environment)  |
| **Logging**              | Verbose (console + Sentry) | Errors only (Sentry)           |

> **Implemented, as of Story 16.36 — and note what "Trigger" now means.** The Dev row above was
> specified when this architecture was written and went unbuilt for a long time: the pipeline
> drifted to Play's `alpha` track, and no push-to-main trigger ever shipped anything to a tester.
> [`nightly-builds.yml`](../.github/workflows/nightly-builds.yml) implements it as a **nightly
> cron plus a manual dispatch** rather than a literal push trigger, because a build per push to
> `main` would spend the 10× macOS multiplier re-shipping identical bytes — most pushes to `main`
> are the `[skip ci]` sprint-status commit. The delivered behaviour is the intent of this row:
> internal testers get the latest `main` on TestFlight and Play `internal` (plus `wear:internal` for
> Wear OS), with **no approval**, and nothing is built on a night when nothing that reaches a
> binary has changed. See [docs/cicd.md](cicd.md#nightly-internal-builds).
>
> ⚠️ **The "CI/CD Workflow Files" tree below is stale** — none of `dev-phone.yml`,
> `dev-watch-ios.yml`, `dev-watch-android.yml`, `prod-release.yml` or `test-schemas.yml` exists.
> `docs/cicd.md` carries the real list.

**CI/CD Workflow Files:**

```
.github/workflows/
├── dev-phone.yml           # Build on PR/push → TestFlight/Internal
├── dev-watch-ios.yml       # Build on PR/push → TestFlight
├── dev-watch-android.yml   # Build on PR/push → Internal Track
├── prod-release.yml        # Manual trigger → App Store/Google Play
└── test-schemas.yml        # Cross-platform validation on all PRs
```

**Fastlane Structure:**

```
fastlane/
├── Fastfile                # Build lanes (ios:build_dev, ios:release, etc.)
├── Appfile                 # App identifiers per environment
└── Matchfile               # Code signing (match for iOS)
```

**GitHub Secrets per Environment:**

| Secret                 | Dev         | Production        |
| ---------------------- | ----------- | ----------------- |
| `SUPABASE_ANON_KEY`    | Dev project | Prod project      |
| `MATCH_PASSWORD`       | Shared      | Shared            |
| `ASC_API_KEY`          | —           | App Store Connect |
| `PLAY_SERVICE_ACCOUNT` | Internal    | Production        |

**Expo Environment Configuration:**

```typescript
// app.config.ts
const ENV = process.env.APP_ENV || 'dev';

const envConfig = {
  dev: {
    name: 'myLoyaltyCards (Dev)',
    bundleIdentifier: 'com.myloyaltycards.dev',
    supabaseUrl: process.env.SUPABASE_URL_DEV
  },
  production: {
    name: 'myLoyaltyCards',
    bundleIdentifier: 'com.iferoporefi.myloyaltycards',
    supabaseUrl: process.env.SUPABASE_URL_PROD
  }
};
```

**Watch App Environment Handling:**

- Build-time configuration via preprocessor flags (`DEBUG` / `RELEASE`)
- Dev builds connect to dev Supabase, production to prod
- Same pattern for both Swift and Kotlin

### Decision Impact Analysis

**Implementation Sequence:**

1. Expo project setup with NativeWind, Zustand, TanStack Query
2. Local database schema (expo-sqlite)
3. Card management UI (React Hook Form + Zod)
4. Supabase project + auth integration
5. Cloud sync implementation
6. watchOS companion app (Phase 1)
7. WatchConnectivity bridge
8. GitHub Actions + Fastlane CI/CD pipeline
9. Wear OS companion app (Phase 2)

**Cross-Component Dependencies:**

- Zod schemas shared between phone validation and Supabase types
- Card data model consistent across SQLite, SwiftData, Room, and Supabase
- Sync timestamps used by all platforms for delta sync
- GitHub Environments manage secrets per environment (Supabase keys, code signing)

## Implementation Patterns & Consistency Rules

_Patterns refined through 7 advanced elicitation methods: Code Review Gauntlet, Devil's Advocate, Pre-mortem Analysis, Failure Mode Analysis, Cross-Functional War Room, and Occam's Razor Application._

### Pattern Categories Defined

**Critical Conflict Points Addressed:** 45+ areas where AI agents could make different choices

### Naming Patterns

**Database Naming (Supabase/PostgreSQL):**

- Tables: `snake_case` plural (e.g., `loyalty_cards`, `users`)
- Columns: `snake_case` (e.g., `card_name`, `created_at`)
- Foreign keys: `{table}_id` (e.g., `user_id`)

**TypeScript/JavaScript Naming:**

- Variables/Functions: `camelCase` (e.g., `getUserCards()`)
- Components: `PascalCase` (e.g., `CardList`)
- Component Files: `PascalCase.tsx` (e.g., `CardList.tsx`)
- Utility Files: `camelCase.ts` (e.g., `syncHelpers.ts`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_CARDS`)
- Types/Interfaces: `PascalCase` (e.g., `LoyaltyCard`)
- Zod Schemas: `camelCase` + `Schema` suffix (e.g., `loyaltyCardSchema`)

**Swift/Kotlin Naming:**

- Follow platform conventions (camelCase vars, PascalCase types)

### TypeScript Configuration (Required)

All agents MUST ensure these compiler options:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### API & Data Formats

**API Response Format:**

- Use Supabase default: `{ data, error, count }`
- No custom wrappers

**JSON Field Naming:**

- Database/API: `snake_case`
- Client/TypeScript: `camelCase`
- Transform at client boundary

**Date/Time Format:**

- Always UTC timezone
- ISO 8601 with milliseconds: `2025-12-24T10:30:00.123Z`
- Compare as strings (lexicographic sort works for ISO 8601)
- `updatedAt` is set by the device making the change

**UUID Generation Strategy:**

- Client-generated on all platforms (collision risk is negligible: 1 in 2^122)
- Phone: `crypto.randomUUID()` or `uuid` package
- watchOS: `UUID().uuidString`
- Wear OS: `UUID.randomUUID().toString()`
- Supabase: Accepts client UUIDs, does not auto-generate

**Card Data Schema (Source of Truth):**

```typescript
const loyaltyCardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(50),
  barcode: z.string(),
  barcodeFormat: z.enum(['CODE128', 'EAN13', 'EAN8', 'QR', 'CODE39', 'UPCA']),
  brandId: z.string().nullable(),
  color: z.enum(['blue', 'red', 'green', 'orange', 'grey']),
  isFavorite: z.boolean().default(false),
  lastUsedAt: z.string().datetime().nullable(),
  usageCount: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
```

### Type Location Guidelines (Hybrid Approach)

**Principle:** Zod for data that needs validation, pure TypeScript for structural types.

| Type Category                                | Location                   | Example                                   |
| -------------------------------------------- | -------------------------- | ----------------------------------------- |
| **Data types** (cards, users, sync payloads) | `core/schemas/`            | `z.infer<typeof loyaltyCardSchema>`       |
| **Navigation params**                        | `core/types/navigation.ts` | `RootStackParamList`                      |
| **Utility types**                            | `core/types/utilities.ts`  | `DeepPartial<T>`, `Nullable<T>`           |
| **Component props**                          | Co-located with component  | `ButtonProps` in `Button.tsx`             |
| **Feature-specific types**                   | Inside the feature folder  | `AddCardFormData` in `features/add-card/` |

**Structure:**

```
core/
├── schemas/              # Zod schemas (runtime validation)
│   ├── card.ts           # loyaltyCardSchema → export type LoyaltyCard
│   ├── sync.ts           # syncMessageSchema → export type SyncMessage
│   └── index.ts
└── types/                # Pure TypeScript (no runtime)
    ├── navigation.ts     # RootStackParamList, screen params
    ├── utilities.ts      # DeepPartial, Nullable, etc.
    └── index.ts
```

**Decision Rule:**

- "Will this be validated at runtime?" → **Zod schema** in `core/schemas/`
- "Is this just for TypeScript type checking?" → **Pure TS** in `core/types/`
- "Is this only used by one component?" → **Co-locate** with the component

### Cross-Platform Data Type Rules

**Date/Time Storage:**
All platforms store dates as ISO 8601 strings, NOT native date types:

- Swift: `let createdAt: String` (not `Date`)
- Kotlin: `val createdAt: String` (not `Instant`)
- TypeScript: `createdAt: string`

Parse to native date only at display time using platform formatters.

**JSON Null Handling:**
All JSON payloads MUST include ALL fields:

- Present but empty: `"brandId": null` ✅
- Field omitted: `{}` ❌ FORBIDDEN

This ensures Swift Codable and Kotlin Serialization work without special handling.

### Enum Serialization Patterns

**TypeScript (Source):**

```typescript
const barcodeFormatSchema = z.enum(['CODE128', 'EAN13', 'EAN8', 'QR', 'CODE39', 'UPCA']);
```

**Swift:**

```swift
enum BarcodeFormat: String, Codable {
  case code128 = "CODE128"
  case ean13 = "EAN13"
  case ean8 = "EAN8"
  case qr = "QR"
  case code39 = "CODE39"
  case upca = "UPCA"
}
```

**Kotlin:**

```kotlin
@Serializable
enum class BarcodeFormat {
  @SerialName("CODE128") CODE128,
  @SerialName("EAN13") EAN13,
  @SerialName("EAN8") EAN8,
  @SerialName("QR") QR,
  @SerialName("CODE39") CODE39,
  @SerialName("UPCA") UPCA,
}
```

### Zod Parsing Pattern (Critical)

Always log parse failures to catch cross-platform schema mismatches:

```typescript
function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, context: string): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    logger.error(`Schema validation failed: ${context}`, {
      errors: result.error.issues,
      data: JSON.stringify(data).slice(0, 500)
    });
    return null;
  }
  return result.data;
}
```

### Project Structure Patterns

**ADR: Feature-First Structure Selected**

Rationale: Maximizes AI agent clarity ("find add-card code" → `features/add-card/`), scales naturally, and keeps related code together while maintaining Expo Router compatibility.

**Phone App (Feature-First with Expo Router):**

```
app/                        # Thin routing layer (delegates to features)
├── _layout.tsx             # Root layout, header with +/⚙️ buttons
├── index.tsx               # export { default } from '@/features/cards'
├── card/[id].tsx           # export { default } from '@/features/cards/CardDetail'
├── add.tsx                 # export { default } from '@/features/add-card'
├── settings.tsx            # export { default } from '@/features/settings'
└── auth/
    ├── sign-in.tsx
    └── sign-up.tsx

features/                   # Self-contained feature modules
├── cards/
│   ├── components/         # Feature-specific components
│   │   ├── CardItem.tsx
│   │   └── CardList.tsx
│   ├── hooks/              # Feature-specific hooks
│   │   └── useCards.ts
│   ├── index.tsx           # Main screen (CardListScreen)
│   └── CardDetail.tsx      # Detail screen
├── add-card/
│   ├── components/
│   │   ├── BarcodeScanner.tsx
│   │   ├── ManualEntry.tsx
│   │   └── CatalogueSearch.tsx
│   ├── hooks/
│   │   └── useAddCard.ts
│   └── index.tsx           # Main flow (AddCardFlow)
├── settings/
│   ├── components/
│   └── index.tsx
└── auth/
    ├── components/
    └── index.tsx

shared/                     # Cross-feature utilities
├── components/             # Reusable UI (buttons, inputs, modals)
│   ├── ui/                 # Primitive components
│   └── layout/             # Layout components
├── hooks/                  # Shared hooks (useNetwork, useTheme)
└── utils/                  # Utilities (formatting, validation)

core/                       # Platform-agnostic business logic
├── db/                     # Database layer
├── sync/                   # Sync logic
├── stores/                 # Zustand stores
├── schemas/                # Zod schemas (source of truth)
└── types/                  # Shared TypeScript types

catalogue/                  # Brand catalogue JSON (bundled)
```

**Route → Feature Mapping:**
Routes are thin wrappers that re-export feature screens:

```typescript
// app/add.tsx
export { default } from '@/features/add-card';
```

**Test Location:** Co-located with source files within features:

```
features/cards/components/CardItem.tsx
features/cards/components/CardItem.test.tsx  ← Next to source
```

**Barrel Export Pattern:**

```
core/stores/index.ts            ✅ Export all stores
core/db/index.ts                ✅ Export public queries
core/schemas/index.ts           ✅ Export all schemas + inferred types
core/types/index.ts             ✅ Export all types
shared/components/ui/           ❌ NO barrel (many small files)
```

**Feature Export Pattern (Default + Named Sub-Screens):**

```typescript
// features/cards/index.tsx
export { default } from './CardListScreen'; // Main screen (default)
export { CardDetail } from './CardDetail'; // Sub-screen (named)

// DO NOT export internal components, hooks, or utilities
```

```typescript
// app/index.tsx (route file)
export { default } from '@/features/cards';

// app/card/[id].tsx (route file)
import { CardDetail } from '@/features/cards';
export default CardDetail;
```

**Feature Export Rules:**

| Type        | Export from index? | Reason                                |
| ----------- | ------------------ | ------------------------------------- |
| Main screen | ✅ `default`       | Primary entry point                   |
| Sub-screens | ✅ Named           | Routes need access                    |
| Components  | ❌ Never           | Internal to feature                   |
| Hooks       | ❌ Never           | Internal to feature                   |
| Utilities   | ❌ Never           | Move to `shared/` if needed elsewhere |

**Feature Boundaries:**

- Features MUST NOT import from other features directly
- Features import from: `@/shared/*`, `@/core/*`, `@/catalogue`
- If code is needed by 2+ features, move it to `shared/` or `core/`

**Import Convention (Relative Within, Absolute Across):**

```typescript
// ✅ Same feature - use RELATIVE (max 2 levels deep)
import { CardItem } from './CardItem';
import { useCards } from '../hooks/useCards';

// ✅ Cross-boundary - use ABSOLUTE
import { Button } from '@/shared/components/ui';
import { useCardsStore } from '@/core/stores';
import { LoyaltyCard } from '@/core/schemas';

// ❌ TOO DEEP - switch to absolute if more than 2 "../"
import { something } from '../../../other/thing'; // BAD

// ✅ FIXED
import { something } from '@/features/cards/other/thing';
```

**Rules:**

1. Within same feature folder → Relative imports
2. Cross-boundary (shared, core, other features) → Absolute imports
3. Depth limit: Max 2 levels (`../`) for relative imports
4. If path needs 3+ levels, restructure or use absolute

**Path Aliases (tsconfig.json):**

Use Expo's default single catch-all alias:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Valid Path Patterns:**

| Pattern         | Maps To         | Use For                                  |
| --------------- | --------------- | ---------------------------------------- |
| `@/app/*`       | `./app/*`       | Route files (rarely imported)            |
| `@/features/*`  | `./features/*`  | Feature modules                          |
| `@/shared/*`    | `./shared/*`    | Cross-feature UI & hooks                 |
| `@/core/*`      | `./core/*`      | Business logic, DB, sync, schemas, types |
| `@/catalogue/*` | `./catalogue/*` | Brand catalogue JSON                     |

**Why single catch-all:**

- Expo default, zero config
- ESLint `no-restricted-imports` already enforces layer boundaries
- Consistent `@/` prefix everywhere

### Database Patterns

**Transaction Pattern (expo-sqlite):**

```typescript
async function saveCard(card: LoyaltyCard) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT OR REPLACE INTO loyalty_cards (...) VALUES (...)',
      [card.id, card.name, ...]
    )
  })
}
```

**Migration Pattern:**
Handle both fresh installs and upgrades:

```typescript
const DB_VERSION = 2;

async function initializeDatabase(db: SQLiteDatabase) {
  const currentVersion = await getDbVersion(db); // Returns 0 if not set

  // Fresh install: Create current schema directly
  if (currentVersion === 0) {
    await createCurrentSchema(db);
    await setDbVersion(db, DB_VERSION);
    return;
  }

  // Upgrade path: Run incremental migrations
  if (currentVersion < 2) {
    await migrateV1toV2(db);
  }
  // Add future migrations here

  await setDbVersion(db, DB_VERSION);
}
```

### State & Communication Patterns

**Zustand with Immer:**

```typescript
import { immer } from 'zustand/middleware/immer';

const useCardsStore = create<CardsState>()(
  immer((set) => ({
    cards: [],
    addCard: (card) =>
      set((state) => {
        state.cards.push(card);
      })
  }))
);
```

**TanStack Query Configuration (Offline-First):**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        logger.error('Mutation failed', error);
        showToast('Action failed. Please try again.');
      }
    }
  }
});
```

**TanStack Query Keys:**

```typescript
const queryKeys = {
  cards: {
    all: ['cards'] as const,
    detail: (id: string) => ['cards', id] as const
  },
  catalogue: { all: ['catalogue'] as const },
  sync: { status: ['sync', 'status'] as const }
};
```

### Sync Patterns

**Cloud Sync (Phone ↔ Supabase) - Persistent Throttling:**

```typescript
const CLOUD_SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

async function syncWithCloud() {
  const lastSyncStr = await AsyncStorage.getItem('lastCloudSync');
  const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;
  const now = Date.now();

  if (lastSync && now - lastSync < CLOUD_SYNC_COOLDOWN_MS) {
    logger.log('Cloud sync skipped: cooldown active');
    return { skipped: true };
  }

  await supabase.from('loyalty_cards').upsert(cards);
  await AsyncStorage.setItem('lastCloudSync', now.toString());
  return { skipped: false };
}

// Manual "Force Sync" bypasses throttle
async function forceSyncWithCloud() {
  await supabase.from('loyalty_cards').upsert(cards);
  await AsyncStorage.setItem('lastCloudSync', Date.now().toString());
}
```

**Watch Sync (Phone ↔ Watch) - No Throttling:**

```typescript
async function syncWithWatch(cards: LoyaltyCard[]) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await WatchConnectivity.sendMessage({
        version: 1,
        type: 'CARDS_UPDATED',
        payload: cards
      });
      return;
    } catch {
      await delay(1000 * (attempt + 1));
    }
  }
  logger.log('Watch sync failed after 3 attempts');
}
```

**Sync Message Versioning:**

```typescript
type SyncMessage = {
  version: number;
  // All phone → watch, EXCEPT CARD_USED which is watch → phone (usage telemetry). See ADR-2026-06-09-001.
  type:
    | 'CARDS_UPDATED'
    | 'CARD_ADDED'
    | 'CARD_DELETED'
    | 'REQUEST_FULL_SYNC'
    | 'SYNC_COMPLETE'
    | 'CARD_USED';
  payload: unknown;
};

// CARD_USED (watch → phone) — usage event, NOT a card-data edit (ADR-2026-06-09-001):
//   payload: { id: string; usedAt: string /* ISO-8601 UTC, millisecond precision */ }
//   Phone applies commutatively: usageCount += 1; lastUsedAt = max(lastUsedAt, usedAt).
//   Dedup by stable event id "<id>:<usedAt>". Delivered via transferUserInfo (queued). Implemented in Story 9.6.

// Watch MUST handle unknown versions gracefully:
// - If version > supported: Log warning, ignore, request full sync
// - Never crash on unknown message format
```

**Watch App Editing Policy** _(refined by [ADR-2026-06-09-001](adr-2026-06-09-watch-usage-events.md), 2026-06-09):_

- Watch is **READ-ONLY for card _data_** — create/edit/delete/favourite happen only on the phone.
- The watch **MAY emit usage events** (`CARD_USED`, card-opened); the phone applies them as **commutative** updates (`usageCount += 1`, `lastUsedAt = max`), so no card-data edit conflict is introduced.
- This preserves the original "prevents sync conflicts" guarantee: usage is an append-only commutative signal, disjoint from the user-editable card-data surface.
- Add field-level merge for card _data_ in v2 only if user feedback requires it.

### Error & Loading Patterns

**Error Shape:**

```typescript
interface AppError {
  code: string; // Machine-readable
  message: string; // User-friendly
  details?: unknown; // Debug info
}
```

**Loading State Names:**

- `isLoading` - Initial load
- `isRefreshing` - Background refresh
- `isSyncing` - Sync in progress
- `isPending` - Mutation pending

**Simplified Logging:**

```typescript
const logger = {
  log: (msg: string, data?: object) => {
    if (__DEV__) console.log(msg, data);
  },
  error: (msg: string, error: unknown) => {
    console.error(msg, error);
    if (!__DEV__) Sentry.captureException(error);
  }
};
```

### Auth Pattern

Let Supabase SDK handle token refresh:

```typescript
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    clearLocalData();
    router.replace('/welcome');
  }
});
```

### Barcode Scanner Pattern

Always-visible manual entry option:

```typescript
// Scan screen layout:
// ┌─────────────────────┐
// │   Camera Viewfinder │
// │   (auto-detects)    │
// ├─────────────────────┤
// │ [Enter Manually]    │  ← Always visible
// └─────────────────────┘
// No timeout logic - user decides when to give up
```

**Barcode Round-Trip Test (CI Required):**

```typescript
test('barcode round-trip for all formats', () => {
  const formats = ['CODE128', 'EAN13', 'EAN8', 'QR', 'CODE39', 'UPCA'];
  for (const format of formats) {
    const testData = getTestDataForFormat(format);
    const image = BarcodeGenerator.generate(testData, format);
    const decoded = BarcodeScanner.decode(image);
    expect(decoded).toBe(testData);
  }
});
```

### Environment Configuration

**Phone App:**

- Use `expo-constants` + `app.config.ts` for environment switching
- Supabase URL/Key bundled in app (not secret - RLS protects data)

**Watch Apps:**

- Build-time configuration only (no runtime env vars)
- Supabase credentials embedded at compile time

### Catalogue Distribution Pattern

**Strategy: Single Source + Build-Time Generation**

**Source of Truth:** `/catalogue/italy.json` (root level, first-class concept)

**Phone App (React Native):**

- Imports JSON directly: `import catalogue from '@/catalogue/italy.json'`
- Updates pushed via Expo OTA (no app store review needed)
- NO runtime network fetch for catalogue

**Watch Apps (Build-Time Code Generation):**

- Build scripts read `/catalogue/italy.json` at compile time
- Generate native-compatible code (not runtime JSON parsing)
- watchOS: Generates `Brands.swift` (brand catalogue) plus, for **each** watch target, the logo + dark-chip sets derived from the bundled `BrandLogo-*` imagesets (`BrandLogoCatalog.generated.swift`). The watch app and the watch-widget extension are separate bundles, so the generator also mirrors the widget's imagesets and its `BrandLogoCatalog` resolver into `targets/watch/` — one authored copy of the logic, drift caught by `--check` (Story 16.29)
- Wear OS: Generates `Brands.kt` (data class with static data)
- Generated files are **committed**, and a drift check keeps them honest: `yarn wear:catalogue:check`
  (pure Node) runs in pre-push **and** CI; `yarn check:catalogue-generated` needs `xcrun swift`, so it
  runs in CI only, against the pristine checkout before anything regenerates

**Build Script Locations:**

```
watch-ios/Scripts/generate-catalogue.swift   # Reads JSON + logo assets → Brands.swift, BrandLogoCatalog.generated.swift (per target), the watch app's BrandLogoCatalog.swift mirror, and the watch app's BrandLogo-* imagesets
watch-android/scripts/generate-catalogue.kts # Reads JSON → Brands.kt
```

**Consistency Guarantee:**

- Single source = all platforms always in sync
- No manual duplication, no drift possible
- CI validates catalogue format before every deploy

**Why Root Level:**

- Visible, easy to find ("where's the brand list?" → `/catalogue/`)
- Build scripts from any subfolder can reference `../catalogue/`
- Clear separation from code (it's data, not logic)

### Wearable Quick Launch (MVP)

**watchOS Complication:**

- Type: a non-configurable WidgetKit widget in all four accessory families (circular, corner,
  rectangular, inline), drawn to `docs/design/cardi/cardi-watch-grammar.md` §10 (Story 23.4)
- Data: the Cardì mark and the top card's name, read from the App Group snapshot the watch app
  writes after every sync; with no card, the mark and the open-app strings
- Tap action: the families that name a card (corner, rectangular, inline) open the app on that
  card's barcode (`cardi://watch-card?id=<id>`, the watch app writing the top card's id beside its
  name); circular, which names none, and every family with no card open the card list
  (`cardi://watch`)

**Wear OS Tile:**

- Deferred to Phase 2
- Focus on standalone app launch first

### Localization Pattern

**Phone App:**

- Library: `i18next` + `react-i18next`
- Error messages use translation keys: `AppError.messageKey`
- Structure for i18n from start, English-only for MVP

**Watch Apps:**

- iOS: `String(localized:)` with Localizable.strings
- Wear OS: `stringResource()` with strings.xml

**MVP Scope:** English only, but code structured for future localization

### Cross-Platform Validation (CI)

```typescript
// CI test: Verify all platforms can parse same test data
test('cross-platform schema compatibility', () => {
  const testCard = generateTestCard();
  const json = JSON.stringify(testCard);

  // This test file is also used by Swift/Kotlin tests
  writeFileSync('test-fixtures/card.json', json);
});
```

**Color Palette (Virtual Logos):**

- Blue: `#3B82F6`
- Red: `#EF4444`
- Green: `#22C55E`
- Orange: `#F97316`
- Grey: `#6B7280`

### Enforcement Guidelines

**All AI Agents MUST:**

1. Follow naming conventions exactly as specified
2. Use Zod schema as source of truth for data structures
3. Use `parseWithLogging` for all cross-platform data parsing
4. Place new files in correct directories per structure patterns
5. Use established error and loading state patterns
6. Ensure watch app models match phone app schemas
7. Generate UUIDs client-side (never rely on server)
8. Use UTC timestamps with millisecond precision
9. Apply offline-first query defaults for TanStack Query
10. Use logger wrapper instead of raw console.log
11. Include sync message version in all phone↔watch messages
12. Apply cloud sync throttling (5 min, persistent)
13. Handle fresh installs AND upgrades in database migrations
14. Use transactions for all database writes
15. Include ALL fields in JSON (use null, never omit)

**Pattern Verification:**

- TypeScript compiler catches type mismatches (strict mode required)
- ESLint rules enforce naming conventions
- CI validates cross-platform schema compatibility
- CI validates catalogue format
- CI runs barcode round-trip tests

## Structural Safeguards

_Added via Failure Mode Analysis to prevent common architectural violations._

### ESLint Rules for Feature Boundaries

**Feature Isolation Rule:**

```javascript
// .eslintrc.js
module.exports = {
  overrides: [
    {
      // Prevent features from importing each other
      files: ['features/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@/features/*/*', '../../../features/*'],
                message:
                  'Features cannot import from other features. Move shared code to @/shared or @/core.'
              }
            ]
          }
        ]
      }
    },
    {
      // Prevent React imports in core/ (except stores)
      files: ['core/**/*.ts', '!core/stores/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react',
                message: 'core/ should not import React. Use shared/ for React code.'
              },
              {
                name: 'react-native',
                message: 'core/ should not import React Native. Use shared/ for UI code.'
              }
            ]
          }
        ]
      }
    },
    {
      // Route files must only re-export (no hooks/state)
      files: ['app/**/*.tsx', '!app/**/_layout.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react',
                importNames: ['useState', 'useEffect', 'useCallback', 'useMemo'],
                message: 'Route files should only re-export from features. No hooks allowed.'
              }
            ]
          }
        ]
      }
    }
  ]
};
```

### Dependency Direction Enforcement

**Allowed Import Directions:**

```
app/ → features/ → shared/ → core/
         ↓
       shared/ → core/
```

**Forbidden Directions:**

- `core/` → `features/` ❌
- `core/` → `shared/` ❌ (except importing types)
- `shared/` → `features/` ❌
- `features/X` → `features/Y` ❌

**CI Check - Circular Dependency Detection:**

```json
// package.json
{
  "scripts": {
    "lint:circular": "madge --circular --extensions ts,tsx ."
  }
}
```

### Shared Test Fixtures

**Cross-Platform Schema Validation:**

```
/test-fixtures/
├── card-valid.json           # Standard card, all platforms must parse
├── card-all-formats.json     # All barcode formats
├── card-nullable-fields.json # Tests null handling
└── sync-message-v1.json      # Sync protocol example
```

**CI Pipeline - Schema Compatibility:**

```yaml
# .github/workflows/test-schemas.yml
name: Cross-Platform Schema Tests

on:
  pull_request:
    paths:
      - 'core/schemas/**'
      - 'test-fixtures/**'
      - 'watch-ios/**'
      - 'watch-android/**'

jobs:
  typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test -- --testPathPattern=schema

  swift:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - run: |
          cd watch-ios
          xcodebuild test -scheme WatchApp \
            -destination 'platform=watchOS Simulator,name=Apple Watch Series 9 (45mm)'

  kotlin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          cd watch-android
          ./gradlew :app:testDebugUnitTest --tests "*SchemaTest*"
```

### Layer Definitions (Reference)

_Refined via First Principles Analysis - the split provides useful guardrails with minimal overhead._

| Layer       | Contains                                      | File Types    | Imports From     |
| ----------- | --------------------------------------------- | ------------- | ---------------- |
| `app/`      | Route files (re-exports), layouts             | `.tsx`        | features, shared |
| `features/` | Screens, feature-specific components/hooks    | `.tsx`, `.ts` | shared, core     |
| `shared/`   | **Code that renders UI or uses React hooks**  | `.tsx`, `.ts` | core             |
| `core/`     | **Code that manages data and business rules** | `.ts` only\*  | Nothing (leaf)   |

**Key Distinction:**

- `shared/` = Has `.tsx` files OR imports `react`
- `core/` = Only `.ts` files, manages data not UI

\*Exception: Zustand stores live in `core/stores/` because they're state management (business logic), even though Zustand uses React internally. This is the only permitted React import in `core/`.

**Decision Rationale:** Keeping both folders prevents React components from appearing in database/sync code. Even if imperfect (Zustand exception), the split provides useful friction and clear AI agent guidance.

### Route File Template

All route files MUST follow this pattern:

```typescript
// app/add.tsx
export { default } from '@/features/add-card';

// That's it. No other code allowed in route files.
// Layouts (_layout.tsx) are the exception - they define navigation chrome.
```

### Feature Growth Guidelines

**When to split a feature:**

- More than 20 files in the feature folder
- More than 3 distinct "sub-screens"
- Clear sub-domain emerges (e.g., `add-card/scan/` vs `add-card/manual/`)

**How to split:**

1. Create sub-folders within the feature: `features/add-card/scan/`
2. OR promote to separate feature if truly independent

## Architecture Validation Results

_Validated on 2025-12-31 through comprehensive analysis including 4 advanced elicitation methods and Code Review Gauntlet with 6 topics resolved._

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts:

- Expo SDK 54 + React Native 0.81 + TypeScript 5.6 (latest, compatible)
- Zustand 4.x + TanStack Query 5.x (complementary state management)
- React Hook Form 7.x + Zod 3.x (designed to work together)
- NativeWind 4.x compatible with Expo SDK 54
- expo-sqlite + Supabase (local-first with cloud sync)
- Native watch stacks (Swift/SwiftUI, Kotlin/Compose) are platform standards

**Pattern Consistency:**

- Naming conventions consistent across DB (snake_case), TS (camelCase), Swift/Kotlin (platform conventions)
- Data formats unified: ISO 8601 dates, client-generated UUIDs, explicit null handling
- Sync protocol versioned with message types defined
- Error handling patterns consistent across platforms

**Structure Alignment:**

- Feature-first organization supports all architectural decisions
- Layer boundaries enforced via ESLint (app → features → shared → core)
- Test co-location supports feature isolation
- Catalogue at root with build-time generation for cross-platform consistency

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All 74 functional requirements across 13 categories have architectural support:

- Card Management (FR1-9): expo-sqlite, Zustand, React Hook Form
- Barcode Display (FR10-13): Native rendering on all platforms
- Italian Brand Catalogue (FR14-20): Bundled JSON + OTA + build-time generation
- Smart Card Sorting (FR21-24): SQLite queries, Zustand derived state
- User Authentication (FR25-33): Supabase Auth, guest mode, expo-secure-store
- Data Synchronization (FR34-42): WatchConnectivity, Supabase, delta sync
- Wearable Experience (FR43-47): Native Swift/Kotlin standalone apps
- Offline Functionality (FR48-52): Local SQLite, offline-first TanStack Query
- Privacy & GDPR (FR53-58): Supabase RLS, data export, deletion APIs
- User Feedback (FR59-65): Error patterns, logging, Sentry
- App Settings (FR66-69): Zustand stores, AsyncStorage
- Onboarding (FR72-74): Feature-first structure

**Non-Functional Requirements Coverage:**
All NFRs addressed:

- Performance: ≤3s wearable (native apps), <1s phone cold start, 60fps UI
- Security: AES-256 at rest (Supabase), TLS 1.2+, bcrypt passwords
- Privacy: GDPR export/deletion via Supabase, no tracking
- Reliability: 100% offline capability, transaction-based writes
- Usability: Cross-platform consistency via shared schemas

### Implementation Readiness Validation ✅

**Decision Completeness:**

- All technology versions specified
- Database schema defined (Zod source of truth)
- API patterns documented (Supabase REST, sync message types)
- Auth flow complete (guest mode, Supabase Auth, token storage)
- CI/CD pipeline defined (GitHub Actions + Fastlane, Dev/Prod environments)

**Structure Completeness:**

- Complete directory structure with all folders defined
- File naming conventions documented
- Feature organization specified (cards, add-card, settings, auth)
- Watch app structure with build scripts and generated folders
- Test fixtures location defined

**Pattern Completeness:**

- 45+ conflict points addressed through advanced elicitation
- Database transactions, migrations, and versioning patterns
- State management patterns (Zustand with Immer, TanStack Query offline defaults)
- Sync patterns with throttling and retry logic
- Cross-platform enum serialization examples

### Gap Analysis Results

**Critical Gaps:** None identified ✅

**Issues Resolved During Elicitation:**

- Feature boundary enforcement → ESLint rules added
- Circular dependency detection → madge CI check added
- shared/ vs core/ confusion → First Principles Analysis clarified
- Type location ambiguity → Hybrid approach documented
- Import conventions → Relative within, absolute across
- Catalogue sync for watches → Build-time generation
- Feature export pattern → Default + named sub-screens
- CI/CD for OSS → GitHub Actions + Fastlane (free)
- Environment separation → Dev + Production with GitHub Environments

**Nice-to-Have (Future Enhancement):**

- Accessibility patterns for screen readers
- Performance monitoring hooks
- Feature flags for gradual rollouts

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed (74 FRs, 30+ NFRs)
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (4 platforms)
- [x] Cross-cutting concerns mapped (6 areas)

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined (phone↔cloud, phone↔watch)
- [x] Performance considerations addressed

**✅ Implementation Patterns**

- [x] Naming conventions established (DB, TS, Swift, Kotlin)
- [x] Structure patterns defined (feature-first)
- [x] Communication patterns specified (sync protocol)
- [x] Process patterns documented (error handling, logging)

**✅ Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established (ESLint enforced)
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

**✅ CI/CD & Environments**

- [x] GitHub Actions workflows defined
- [x] Fastlane build automation specified
- [x] Dev/Production environments separated
- [x] Secrets management via GitHub Environments

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**

1. Comprehensive patterns with 45+ conflict points addressed
2. Cross-platform consistency via shared schemas and CI validation
3. Enforced boundaries through ESLint rules
4. Offline-first architecture with clear sync patterns
5. Feature-first structure optimized for AI agent navigability
6. Phased iOS-first approach reduces risk
7. OSS-friendly CI/CD with GitHub Actions (free, transparent)
8. Clear environment separation (Dev/Production)

**Areas for Future Enhancement:**

- Accessibility patterns (post-MVP)
- Performance monitoring integration
- Feature flag system for gradual rollouts

### Implementation Handoff

**AI Agent Guidelines:**

All AI agents implementing this architecture MUST:

1. Follow naming conventions exactly as specified
2. Use Zod schema as source of truth for data structures
3. Use `parseWithLogging` for all cross-platform data parsing
4. Place new files in correct directories per structure patterns
5. Use established error and loading state patterns
6. Ensure watch app models match phone app schemas
7. Generate UUIDs client-side (never rely on server)
8. Use UTC timestamps with millisecond precision
9. Apply offline-first query defaults for TanStack Query
10. Use logger wrapper instead of raw console.log
11. Include sync message version in all phone↔watch messages
12. Apply cloud sync throttling (5 min, persistent)
13. Handle fresh installs AND upgrades in database migrations
14. Use transactions for all database writes
15. Include ALL fields in JSON (use null, never omit)
16. Respect feature boundaries (ESLint will catch violations)
17. Use relative imports within features, absolute across

**First Implementation Priority:**

```bash
# 1. Project setup
- Configure tsconfig.json with strict options
- Add ESLint rules from architecture doc
- Set up path aliases in app.config.ts

# 2. Core foundation
- Create core/schemas/card.ts with Zod schema
- Set up Zustand store with Immer middleware
- Initialize expo-sqlite with migration pattern

# 3. Feature scaffold
- Create features/cards/ with basic structure
- Create features/add-card/ scaffold
- Set up shared/components/ui/ primitives

# 4. CI/CD setup
- Create .github/workflows/ files
- Set up fastlane/Fastfile
- Configure GitHub Environments (dev, production)
```

**Architecture Document Complete** ✅

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2025-12-31
**Document Location:** docs/architecture.md

### Final Architecture Deliverables

**📋 Complete Architecture Document**

- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**

- 25+ architectural decisions made
- 45+ implementation patterns defined
- 4 platform targets specified (iOS, Android, watchOS, Wear OS)
- 74 functional requirements fully supported
- 30+ non-functional requirements addressed

**📚 AI Agent Implementation Guide**

- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Development Sequence

1. Initialize project using documented Expo setup
2. Configure TypeScript strict mode and ESLint rules
3. Set up core/ foundation (schemas, stores, db)
4. Create feature scaffolds (cards, add-card, settings)
5. Set up GitHub Actions + Fastlane CI/CD
6. Build features following established patterns
7. Implement watchOS companion app (Phase 1)
8. Implement Wear OS companion app (Phase 2)

### Quality Assurance Checklist

**✅ Architecture Coherence**

- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**

- [x] All functional requirements are supported
- [x] All non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**

- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

---

## Revision History

| Date       | Section(s)                                              | Change                                                                                                                                                                                                                                                                                                                                                     | Decision Ref                         |
| ---------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 2026-04-11 | Wearable Architecture, Project Structure, Build Tooling | **watchOS distribution model updated.** watchOS apps must be embedded in iOS IPA (Apple requirement). Adopted `@bacons/apple-targets` for CNG-based watchOS embedding. Source migrated from `watch-ios/` to `targets/watch/`. Fastlane lanes updated for multi-target signing. No separate watchOS CI/CD pipeline — single iOS archive includes both apps. | ADR-2026-04-11-002, Story 11-6       |
| 2026-04-11 | Technical Constraints                                   | **NativeWind under evaluation.** Sprint 11 (Epic 13 — UI Implementation) showed ~23% fix/rework commits caused by NativeWind interactions (Pressable style callbacks, dark mode inconsistencies, scroll behavior). Decision to evaluate alternatives (StyleSheet + design tokens, Unistyles, Tamagui) before next UI-heavy epic.                           | DEC-S11-RETRO-001                    |
| 2026-04-11 | (Process)                                               | **Definition of Ready / Definition of Done adopted.** 7-gate DoR and 8-gate DoD as mandatory process gates for all stories. Party mode is default for story refinement and complex problem-solving.                                                                                                                                                        | DEC-S11-RETRO-002, DEC-S11-RETRO-003 |
| 2026-04-11 | Project Structure, CI/CD                                | **GitHub Actions workflow names corrected** to match actual implementation: `ci-quality-gates.yml`, `ios-release.yml`, `android-release.yml`, `beta-releases.yml`, `store-upload.yml`, `watchos-tests.yml`.                                                                                                                                                | Sprint 12 planning                   |
