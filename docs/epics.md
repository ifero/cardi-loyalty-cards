---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - 'docs/prd.md'
  - 'docs/architecture.md'
  - 'docs/ux-design-specification.md'
workflowType: 'epics-stories'
lastStep: 4
workflowComplete: true
completedDate: '2025-01-03'
project_name: 'myLoyaltyCards'
user_name: 'Ifero'
date: '2025-01-03'
totalEpics: 23
totalStories: 207 # counted from `### Story` headings on 2026-10-30
aligned_with_tracker: '2026-08-02'
authoritative_source: 'docs/sprint-artifacts/sprint-status.yaml'
---

> [!NOTE]
> **Story catalogue — aligned with the tracker on 2026-07-21.** This file is the human-readable
> epic/story catalogue; `docs/sprint-artifacts/sprint-status.yaml` remains the **authoritative
> source of truth** for live status and the sprint blocks (`last_sprint`/`current_sprint`/
> `next_sprint`/`waves`). Every `### Story N.M` here maps 1:1 to a tracker `development_status`
> key, so `create-story` reads correct content. `bmad-sprint-planning` is safe to run **only**
> with the `_bmad/custom/bmad-sprint-planning.toml` guard, which preserves the tracker's sprint
> blocks (vanilla regeneration would strip them).
>
> **Epics 21–23 were corrected against the working tree on 2026-09-14**, during the `create-story`
> pass that refined all nine Sprint 20 stories. Eighteen acceptance criteria were amended across
> the three epics — three of them had been **unsatisfiable as written** (a store-metadata directory
> that does not exist, an asset colour that was never set, a file count that included a
> load-bearing file). Those epics were authored from the design side on 2026-09-13 and described
> intent; the code had moved underneath them. Nothing gates a catalogue AC against the tree, so the
> corrections are marked inline with their date, and **each story's own file under
> `docs/sprint-artifacts/stories/` is the refined brief** — this catalogue is the summary.

## Overview

This document provides the complete epic and story breakdown for myLoyaltyCards, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Epic Conventions & Dependency Map

### Conventions

- **Epic Type:** Each epic is labeled as **User-Facing** or **Enabling**. Enabling epics/stories are permitted only when they directly unlock a user-facing outcome in the same phase.
- **Enabling Stories:** Stories written from a developer perspective are explicitly tagged as **Enabling** and must map to a specific user-facing outcome.
- **Post-MVP Items:** Any requirement tagged post-MVP must be listed in **Future Enhancements** and referenced in the FR coverage map.

### Dependency Map (Phase 1)

1. Epic 1 → Foundation for all Phase 1 epics
2. Epic 2 → Core card flows (prereq for Epic 5)
3. Epic 3 → Catalogue (prereq for Epic 4)
4. Epic 4 → Onboarding (depends on Epic 3)
5. Epic 5 → Apple Watch app (depends on Epics 2–3)
6. Epic 6 → Authentication (prereq for Epic 7)
7. Epic 7 → Cloud Sync (depends on Epic 6)
8. Epic 8 → Settings & Help (depends on Epic 4)

## Requirements Inventory

### Functional Requirements

**Card Management (FR1-FR9)**

- FR1: Users can add a loyalty card by selecting a brand from the Italian catalogue
- FR2: Users can add a custom loyalty card by manually entering card details
- FR3: Users can scan a barcode using the device camera to capture loyalty card information
- FR4: Users can manually enter a barcode number as an alternative to scanning
- FR5: Users can view a list of all their stored loyalty cards
- FR6: Users can edit existing loyalty card information (name, barcode)
- FR7: Users can delete loyalty cards they no longer need
- FR8: Users can mark loyalty cards as favorites to pin them at the top of the list
- FR9: Users can view detailed information about a specific loyalty card

**Barcode Display (FR10-FR13)**

- FR10: Users can display a loyalty card's barcode in a scannable format
- FR11: The system can render barcodes in multiple formats (Code 128, EAN-13, EAN-8, QR Code, CODE39, UPCA)
- FR12: Users can display barcodes on wearable devices (Apple Watch, Android Wear)
- FR13: The system can optimize barcode brightness and contrast for scanner readability

**Italian Brand Catalogue (FR14-FR20)**

- FR14: Users can browse the Italian loyalty card catalogue on a dedicated screen
- FR15: The system can display catalogue brands with their names, logos, and aliases
- FR16: The system can fetch the latest catalogue from cloud storage
- FR17: The system can cache the catalogue locally for offline browsing
- FR18: The system can check for catalogue updates using ISO date-based versioning
- FR19: The system can automatically refresh the catalogue when users add a card
- FR20: The system can detect if local catalogue is outdated based on last sync timestamp

**Smart Card Sorting (FR21-FR24)**

- FR21: The system can automatically sort cards based on usage frequency
- FR22: The system can display most recently used cards at the top of the list
- FR23: Users can pin favorite cards to remain at the top regardless of usage
- FR24: The system can apply alphabetical sorting as a fallback for unused cards

**User Authentication & Account Management (FR25-FR33)**

- FR25: Users can use the app in guest mode without creating an account with full feature access
- FR26: Users can create an account using email and password
- FR27: Users can sign in using Sign in with Apple
- FR28: Users can sign in using Sign in with Google
- FR29: Users can log in to an existing account
- FR30: Users can log out of their account
- FR31: Users can reset their password if forgotten
- FR32: Users can delete their account and all associated cloud data
- FR33: Users can upgrade from guest mode to authenticated mode without losing data

**Data Synchronization (FR34-FR42)**

- FR34: The system can sync cards between phone and watch via Bluetooth in guest mode
- FR35: The system can sync cards to cloud backend when user is authenticated
- FR36: The system can sync cards across multiple devices for authenticated users
- FR37: The system can perform background synchronization automatically
- FR38: The system can detect network connectivity status for sync operations
- FR39: The system can queue sync operations when offline and retry when connection available
- FR40: The system can resolve sync conflicts using last-write-wins strategy
- FR41: The system can perform delta sync (only changed cards) for efficiency
- FR42: The system can sync bidirectionally (phone ↔ watch, phone ↔ cloud)

**Wearable Experience (FR43-FR47)**

- FR43: Users can open the wearable app and access cards without phone connection
- FR44: The system can store loyalty cards locally on the wearable device
- FR45: Users can navigate through their card list on the wearable interface
- FR46: Users can tap a card on the wearable to display its barcode
- FR47: The system can automatically sync new/edited/deleted cards between phone and watch

**Offline Functionality (FR48-FR52)**

- FR48: Users can access all core features without network connectivity
- FR49: Users can add, edit, and delete cards while offline
- FR50: Users can display barcodes while offline
- FR51: The system can store user cards and cached catalogue locally for offline access
- FR52: The system can function on wearables without phone or network connection

**Privacy & Data Management - GDPR (FR53-FR58)**

- FR53: Users can view what personal data is collected and stored
- FR54: Users can export all their loyalty card data in JSON format
- FR55: Users can request deletion of all their data from cloud storage
- FR56: The system can encrypt user data at rest in the cloud database
- FR57: Users can access the privacy policy from within the app
- FR58: Users can provide consent before account creation and data collection

**User Feedback & Error Handling (FR59-FR65)**

- FR59: The system can display loading indicators during data operations
- FR60: The system can show sync status indicators to users
- FR61: The system can display confirmation messages for successful operations
- FR62: The system can display error messages with clear explanations when operations fail
- FR63: The system can show overlay messages when sync fails
- FR64: The system can provide appropriate error messages when camera permission is denied
- FR65: The system can provide recovery options for failed operations

**App Settings & Preferences (FR66-FR69)**

- FR66: Users can select their preferred language for the app interface
- FR67: Users can toggle between light mode and dark mode
- FR68: Users can access app settings from a dedicated settings screen
- FR69: Users can view app version and build information

**Data Validation - Post-MVP (FR70-FR71)**

- FR70: The system can validate barcode format based on brand requirements
- FR71: The system can provide validation feedback when manually entering barcodes

**Onboarding & Help (FR72-FR74)**

- FR72: New users can view a welcome screen explaining the app concept
- FR73: Users can access help documentation or FAQs
- FR74: The system can provide onboarding guidance for first-time card addition

**Personal Cloud Sync — Bring-Your-Own Storage (FR77-FR84)**

- FR77: Users can connect a folder in their own cloud storage (iCloud Drive, Dropbox, Google Drive, OneDrive) as a sync target without creating an account
- FR78: The system can sync cards bidirectionally through the connected folder
- FR79: The system can converge one user's multiple devices on a single card set through the folder
- FR80: The system can converge multiple people sharing one folder on a common card set
- FR81: Users can disconnect the sync folder while retaining all cards on the device
- FR82: Users can view folder-sync status, the last-synced time, and which folder is connected
- FR83: The system can enforce exactly one active sync backend (local, account, or folder) and switch between them without data loss
- FR84: The system can degrade gracefully when the folder is unreachable and resume syncing when access is restored

> **Note on the FR74 → FR77 gap:** FR75 and FR76 exist in `docs/prd.md` only — they were assigned to Smart Card Sorting (sort-mode selection and usage recording) by the 2026-06-09 correct-course and never backfilled into this inventory. They are listed here for numbering continuity, not as new scope: **FR75** users can select the card sort mode per surface; **FR76** card usage is recorded whenever a barcode is displayed on any surface. See the note in the PRD's Smart Card Sorting section.

### NonFunctional Requirements

**Performance (NFR-P1 to NFR-P9)**

- NFR-P1: Card display on wearable devices must complete in ≤3 seconds from wrist raise to barcode visible
- NFR-P2: Mobile app cold start must complete in ≤1 second
- NFR-P3: Wearable app cold start must complete in ≤2 seconds
- NFR-P4: Barcode rendering must complete in ≤100ms
- NFR-P5: Phone-to-watch sync operations must complete within 30 seconds when devices are connected
- NFR-P6: UI interactions (scrolling, navigation) must maintain 60fps for smooth user experience
- NFR-P7: Wearable app must minimize battery impact during standby mode
- NFR-P8: Background sync operations must not noticeably impact device battery life
- NFR-P9: Catalogue caching must optimize storage usage without degrading performance

**Security & Privacy (NFR-S1 to NFR-S14)**

- NFR-S1: All user data must be encrypted at rest in cloud database using AES-256
- NFR-S2: All API communication must use HTTPS/TLS 1.2 or higher
- NFR-S3: User passwords must be hashed using bcrypt or equivalent
- NFR-S4: Authentication tokens must expire after reasonable timeframes and support secure refresh
- NFR-S5: System must comply with GDPR requirements for EU users
- NFR-S6: No user tracking, analytics, or advertising is permitted
- NFR-S7: User data export must be available in machine-readable JSON format
- NFR-S8: User account deletion must remove all associated data within 30 days
- NFR-S9: Privacy policy must be accessible before and after account creation
- NFR-S10: Guest mode users must have full feature access with data stored locally only
- NFR-S11: Authenticated users' cloud data must be accessible only by the account owner
- NFR-S12: Social login must follow platform security best practices
- NFR-S13: Folder-sync data must never transit or be stored on myLoyaltyCards-controlled infrastructure
- NFR-S14: Because folder-sync files are written in plaintext into storage the user already trusts with their files, the app must disclose that the storage provider can read them

**Reliability & Availability (NFR-R1 to NFR-R12)**

- NFR-R1: 100% of core features must function without network connectivity
- NFR-R2: Offline data operations must succeed with zero data loss
- NFR-R3: Wearable app must function independently without phone or network connection
- NFR-R4: Sync conflict resolution must preserve user data integrity using last-write-wins
- NFR-R5: All error conditions must provide clear, actionable error messages
- NFR-R6: Failed sync operations must retry automatically when connectivity is restored
- NFR-R7: System must gracefully handle edge cases (low storage, permission denials, network interruptions)
- NFR-R8: No data loss during app updates or device sync operations
- NFR-R9: Local data must persist across app restarts and device reboots
- NFR-R10: Sync operations must maintain data consistency across devices
- NFR-R11: Concurrent writers sharing one sync folder must converge on the same card set without any writer losing data
- NFR-R12: Switching the active sync backend must never delete or orphan cards held on the device

**Usability (NFR-U1 to NFR-U8)**

- NFR-U1: User experience must be consistent across iOS and Android mobile platforms
- NFR-U2: Wearable apps must provide adapted but consistent UX for screen size constraints
- NFR-U3: All platforms must achieve feature parity within MVP scope
- NFR-U4: Error messages must be clear and avoid technical jargon
- NFR-U5: Loading indicators must be present for all operations exceeding 500ms
- NFR-U6: User interface must support both light mode and dark mode
- NFR-U7: App interface must support user-selectable languages
- NFR-U8: Text labels and messages must be externalized for localization

**Maintainability & Code Quality (NFR-M1 to NFR-M8)**

- NFR-M1: Codebase must follow React Native and Expo best practices
- NFR-M2: Code must be well-documented with clear comments for complex logic
- NFR-M3: Project structure must be organized for easy navigation by contributors
- NFR-M4: Repository must include comprehensive README with setup instructions
- NFR-M5: Contribution guidelines must be clearly documented
- NFR-M6: Code must be released under MIT License with proper attribution
- NFR-M7: Critical user flows must have automated tests
- NFR-M8: Performance targets must be validated through testing on actual devices

**Accessibility - Post-MVP (NFR-A1 to NFR-A3)**

- NFR-A1: Future versions should support screen reader compatibility
- NFR-A2: Future versions should support voice control on supported platforms
- NFR-A3: Future versions should provide high contrast modes for visual accessibility

### Additional Requirements

**From Architecture - Starter Template & Foundation:**

- ARCH-1: Project initialized with Expo SDK 54.0.0, React 19.1.0, React Native 0.81.5, Expo Router 6.0.15, TypeScript 5.6.0
- ARCH-2: Phased development approach - Phase 1: iOS + watchOS; Phase 2: Android + Wear OS
- ARCH-3: Feature-first project structure with app/, features/, shared/, core/ directories
- ARCH-4: ESLint rules enforcing feature boundaries (features cannot import from other features)

**From Architecture - Data Layer:**

- ARCH-5: Phone Local DB using expo-sqlite with migration pattern
- ARCH-6: watchOS Storage using SwiftData (iOS 18+)
- ARCH-7: Cloud Database using Supabase (PostgreSQL) with Row-Level Security
- ARCH-8: Zod schemas as source of truth for data structures across all platforms
- ARCH-9: Card data schema: id, name, barcode, barcodeFormat, brandId, color, isFavorite, lastUsedAt, usageCount, createdAt, updatedAt
- ARCH-10: Client-generated UUIDs on all platforms (crypto.randomUUID, UUID().uuidString, UUID.randomUUID)
- ARCH-11: UTC timestamps with millisecond precision (ISO 8601)
- ARCH-12: JSON payloads must include ALL fields (use null, never omit)

**From Architecture - State & Communication:**

- ARCH-13: State Management using Zustand with Immer middleware
- ARCH-14: Data Fetching using TanStack Query with offline-first defaults (staleTime: Infinity)
- ARCH-15: Form Handling using React Hook Form with Zod validation
- ARCH-16: Phone ↔ Cloud sync via Supabase REST API with 5-minute throttling
- ARCH-17: iOS ↔ watchOS sync via WatchConnectivity framework (no throttling)
- ARCH-18: Android ↔ Wear OS sync via Wearable Data Layer API (Phase 2)
- ARCH-19: Sync Message Protocol with version field and typed messages (CARDS_UPDATED, CARD_ADDED, etc.)
- ARCH-20: Watch is READ-ONLY for card data (create/edit/delete/favourite only on phone); usage events (`CARD_USED`, card-opened) are permitted and applied commutatively on the phone — refined by ADR-2026-06-09-001 (2026-06-09)

**From Architecture - Infrastructure:**

- ARCH-21: CI/CD using GitHub Actions + Fastlane
- ARCH-22: Two environments: Dev (TestFlight/Internal Track) and Production (App Store/Google Play)
- ARCH-23: Error tracking using Sentry
- ARCH-24: OTA updates using Expo Updates for JS-only changes
- ARCH-25: expo-secure-store for token storage (Keychain/Keystore)
- ARCH-26: Supabase Auth for authentication (Email, Apple, Google)

**From Architecture - Catalogue:**

- ARCH-27: Single source catalogue at /catalogue/italy.json
- ARCH-28: Phone imports JSON directly, updates via Expo OTA
- ARCH-29: Watch apps use build-time code generation (Brands.swift, Brands.kt)
- ARCH-30: Generated files in .gitignore (never committed)

**From Architecture - Cross-Platform Patterns:**

- ARCH-31: Database naming: snake_case for tables/columns
- ARCH-32: TypeScript naming: camelCase for variables/functions, PascalCase for components/types
- ARCH-33: parseWithLogging function for all cross-platform data parsing
- ARCH-34: Enum serialization patterns for Swift and Kotlin matching TypeScript
- ARCH-35: Test fixtures at /test-fixtures/ for cross-platform validation

**From UX Design - Design System:**

- UX-1: NativeWind (Tailwind CSS) for React Native styling
- UX-2: 8px base grid for all spacing
- UX-3: Touch targets: minimum 44x44px on phone, 32x32px on watch
- UX-4: System Sans-Serif typeface (San Francisco/Roboto)

**From UX Design - Visual Design:**

- UX-5: Theme: Accessible Sage Minimalist
- UX-6: Primary Accent: Accessible Sage (#73A973) with 4.5:1 contrast ratio
- UX-7: Backgrounds: OLED Black (#000000) for watch, Off-White (#F8F9F8) for barcode display
- UX-8: 5-color palette for custom cards: Blue (#3B82F6), Red (#EF4444), Green (#22C55E), Orange (#F97316), Grey (#6B7280)
- UX-9: Semantic colors with double-encoding (color + icon for accessibility)

**From UX Design - Watch Experience:**

- UX-10: Carbon Utility approach: OLED-black, high-contrast, minimal styling
- UX-11: Vertical infinite scroll list with Digital Crown support
- UX-12: Single tap to display barcode (NO confirmation dialogs)
- UX-13: Haptic feedback on tap
- UX-14: Barcode Flash: full-screen white background with max brightness
- UX-15: Watch complication for quick launch (graphic circular type) **(Post-MVP)**

**From UX Design - Phone Experience:**

- UX-16: Soft Sage Grid approach with brand logos prominently displayed
- UX-17: Responsive grid: 2 columns (standard phones), 3+ columns (larger phones/tablets)
- UX-18: Landscape support: 4-5 columns with orientation lock option in settings **(orientation lock Post-MVP)**
- UX-19: Tab-based navigation: Dashboard, Add, Settings

**From UX Design - Custom Components:**

- UX-20: Virtual Logo Card: 1-3 initials + color background for cards without official logo
- UX-21: Barcode Flash Overlay: full-screen, white background, centered barcode
- UX-22: Carbon Watch Card: OLED-optimized list item with thin borders
- UX-23: Zippy Scanner Interface: viewfinder + fast save flow **(auto-save Post-MVP)**

**From UX Design - Interaction Patterns:**

- UX-24: Zero-Confirmation Policy: taps lead directly to actions
- UX-25: Catalogue-First Onboarding: lead with familiar brand visuals, not empty states
- UX-26: Button hierarchy: Primary (Sage Green), Secondary (outline), Destructive (red text)
- UX-27: Feedback patterns: haptic + checkmark for success, vibration + red border for errors
- UX-28: Inline form validation with auto-focus on primary field
- UX-29: Numeric keypad default for barcode entry

**From UX Design - Accessibility:**

- UX-30: WCAG 2.1 AA Compliance for contrast and touch targets
- UX-31: Dynamic Type support (respect system font size)
- UX-32: Screen reader navigation support for Add Card flow

### FR Coverage Map

| FR Range        | Epic                | Description                                          |
| --------------- | ------------------- | ---------------------------------------------------- |
| FR1-FR7, FR9    | Epic 2              | Card Management (add, view, edit, delete)            |
| FR8             | Epic 9              | Mark favorites (Phase 2)                             |
| FR10-FR13       | Epic 2              | Barcode Display (multi-format rendering, brightness) |
| FR14-FR20       | Epic 3              | Italian Brand Catalogue (browse, cache, update)      |
| FR21-FR24       | Epic 9              | Smart Card Sorting (Phase 2)                         |
| FR25-FR33       | Epic 6              | User Authentication & Account Management             |
| FR34            | Epic 5              | Phone-Watch Bluetooth Sync                           |
| FR35-FR42       | Epic 7              | Cloud Synchronization                                |
| FR43-FR47       | Epic 5              | Wearable Experience (watchOS)                        |
| FR48-FR51       | Epic 2              | Offline Functionality                                |
| FR52            | Epic 5              | Wearable Offline Operation                           |
| FR53, FR55-FR58 | Epic 6              | Privacy & GDPR                                       |
| FR54            | Epic 8              | Data Export (Settings)                               |
| FR59-FR65       | Epic 2              | User Feedback & Error Handling                       |
| FR66-FR69       | Epic 8              | App Settings & Preferences                           |
| FR70-FR71       | Future Enhancements | Data Validation (Post-MVP, not in scope)             |
| FR72-FR74       | Epic 4              | Onboarding & Help                                    |
| FR75-FR76       | Epic 9              | Sort-mode selection & usage recording (PRD-only)     |
| FR77-FR84       | Epic 19             | Personal Cloud Sync — Bring-Your-Own Storage         |

**Coverage Summary:**

- Phase 1 (Epics 1-8): 68 FRs covered
- Phase 2 (Epics 9-10): 4 FRs (FR21-24 sorting) + FR43-47/FR52 for Wear OS
- Phase 3 (Epic 19): 8 FRs (FR77-FR84 personal cloud sync)
- Post-MVP: FR70-FR71 (data validation)

## Epic List

| Epic | Title                                  | Phase | Status                                            |
| ---- | -------------------------------------- | ----- | ------------------------------------------------- |
| 1    | Project Foundation & App Shell         | 1     | done                                              |
| 2    | Card Management & Barcode Display      | 1     | done                                              |
| 3    | Italian Brand Catalogue                | 1     | done                                              |
| 4    | Onboarding Experience                  | 1     | done                                              |
| 5    | Apple Watch App                        | 1     | done                                              |
| 6    | User Authentication & Privacy          | 1     | in-progress (6-12/6-13 social sign-in backlog)    |
| 7    | Cloud Synchronization                  | 1     | done                                              |
| 8    | Settings & Preferences                 | 1     | absorbed → Epic 13                                |
| 9    | Smart Card Sorting                     | 2     | done                                              |
| 10   | Wear OS App                            | 2     | in-progress (Sprint 18)                           |
| 11   | CI/CD & Quality Gates                  | 1     | done                                              |
| 12   | App-Wide Design Overhaul (Figma)       | 2     | done                                              |
| 13   | UI Implementation                      | 2     | done                                              |
| 14   | Household Collaboration                | 3     | in-progress (14-5a UX gates impl; 14-2 → Epic 18) |
| 15   | Internationalisation & Public Presence | 2     | done                                              |
| 16   | Platform & Tech Debt (standing bucket) | —     | in-progress (16-22 in Sprint 18)                  |
| 17   | Apple Wallet Pass Support              | 3     | backlog (parked — spike first)                    |
| 18   | Card Sharing & Web Handoff             | 3     | backlog (absorbs 14-2)                            |
| 19   | Personal Cloud Sync (BYO Storage)      | 3     | backlog (gated on 19-1 spike)                     |

---

## Epic 1: App Foundation & First Launch Experience

**Goal:** Users can launch the app quickly, navigate core screens, and trust that data persists offline from the first run.

**Phase:** 1 (MVP)

**Epic Type:** Enabling (directly supports Epic 2 user flows)

**FRs Covered:** Foundation enabling FR48 (offline access), FR51 (local storage)

**Scope:**

- Extend existing Expo SDK 54 setup with required dependencies
- Configure NativeWind with Sage Green theming (light/dark mode)
- Set up expo-sqlite database with Zod schemas
- Create app shell with header navigation (+/⚙️ buttons)
- Configure ESLint rules for feature boundaries
- Set up Zustand stores and TanStack Query with offline-first defaults

**Enabling Note:** Stories 1.1–1.4 are enabling tasks that unlock the first user-facing experience in Epic 2.

**Technical Notes:**

- Project already initialized with `npx create-expo-app@latest`
- Dependencies to add: NativeWind, Zustand, TanStack Query, React Hook Form, Zod, expo-sqlite, expo-camera
- Feature-first project structure: app/, features/, shared/, core/

---

### Story 1.1: Configure Development Environment [Enabling]

**As a** developer,
**I want** a properly configured TypeScript and ESLint environment,
**So that** I can write consistent, type-safe code with enforced feature boundaries.

**Acceptance Criteria:**

**Given** the existing Expo SDK 54 project
**When** I open the project in my IDE
**Then** TypeScript strict mode is enabled with `noUncheckedIndexedAccess`, `noImplicitReturns`, and `noFallthroughCasesInSwitch`
**And** ESLint rules enforce feature boundaries (features cannot import from other features)
**And** path aliases are configured (`@/features/*`, `@/shared/*`, `@/core/*`, `@/catalogue/*`)
**And** the feature-first folder structure is created (app/, features/, shared/, core/, catalogue/)

---

### Story 1.2: Implement Design System Foundation

**As a** user,
**I want** a visually polished app with consistent theming,
**So that** the interface feels premium and responds to my system preferences.

**Acceptance Criteria:**

**Given** I launch the app
**When** the app renders any screen
**Then** NativeWind (Tailwind CSS) is configured with the 8px base grid
**And** the Accessible Sage color palette is available (#73A973 primary, OLED black, Off-white)
**And** the 5-color card palette is defined (Blue #3B82F6, Red #EF4444, Green #22C55E, Orange #F97316, Grey #6B7280)
**And** light/dark mode themes are configured respecting system preferences
**And** minimum touch targets are enforced (44x44px)

---

### Story 1.3: Create Core Data Schema ✅ [Enabling]

**Status:** Complete

**As a** developer,
**I want** a single source of truth for data structures,
**So that** all platforms use consistent card data with runtime validation.

**Acceptance Criteria:**

**Given** I need to work with loyalty card data
**When** I import from `@/core/schemas`
**Then** the `loyaltyCardSchema` Zod schema is available with all fields:

- id (UUID), name (string max 50), barcode (string), barcodeFormat (enum)
- brandId (nullable string), color (enum of 5 colors), isFavorite (boolean)
- lastUsedAt (nullable ISO datetime), usageCount (integer), createdAt, updatedAt
  **And** TypeScript types are inferred from Zod schemas
  **And** `parseWithLogging` utility function is available for safe parsing
  **And** test fixtures exist at `/test-fixtures/card-valid.json`

---

### Story 1.4: Set Up Local Database ✅ [Enabling]

**Status:** Complete

**As a** user,
**I want** my cards stored reliably on my device,
**So that** they persist across app restarts and work offline.

**Acceptance Criteria:**

**Given** I am using the app for the first time
**When** I open the card list for the first time
**Then** expo-sqlite database is initialized with the loyalty_cards table
**And** the migration pattern handles both fresh installs and future upgrades
**And** database version tracking is implemented
**And** all database writes use transactions
**And** the database works completely offline

**Given** I have existing cards in the database
**When** I restart the app
**Then** all my cards are preserved exactly as I left them

---

### Story 1.5: Build App Shell with Header Navigation

**As a** user,
**I want** quick access to add cards and settings from any screen,
**So that** my card list has maximum screen space and I can navigate efficiently.

**Acceptance Criteria:**

**Given** I launch the app
**When** the main screen loads
**Then** I see my card list as the primary screen (placeholder/empty state is acceptable)
**And** the header displays the app name
**And** the header has a "+" button that navigates to the Add Card screen
**And** the header has a "⚙️" (settings) button that navigates to Settings
**And** navigation uses Expo Router file-based routing
**And** transitions are smooth (60fps target)

### Story 1.6: Extend Semantic Error Color Tokens

**As a** developer, **I want** consistent error/destructive color tokens (background, text, border) in the design system, **So that** components don't hardcode hex values and the palette stays consistent across the app.

**Acceptance Criteria:**

- Semantic tokens exist for error background, error text, and error border in `shared/theme/colors.ts`, available in both light and dark themes.
- Dark-mode error colours meet WCAG AA contrast (4.5:1 for text).
- `MigrationBanner.tsx` (Story 6.14) and future error states (delete-account, sync errors, form validation) consume the tokens instead of local hardcoded constants.

_Follow-up surfaced during the Story 6.14 review; owned by Sally (UX). Status: drafted._

---

## Epic 2: Card Management & Barcode Display

**Goal:** Users can add their loyalty cards and display their barcodes at checkout — the core product value.

**Phase:** 1 (MVP)

**Epic Type:** User-Facing

**Dependencies:** Epic 1 (foundation)

**FRs Covered:** FR1-FR7, FR9-FR13, FR48-FR51, FR59-FR65 (FR8 favorites moved to Epic 9)

**Scope:**

- Card list screen (Soft Sage Grid, responsive 2-3 columns)
- Add card flow with camera barcode scanning (primary) and manual entry (fallback)
- Card detail view with edit and delete functionality
- Virtual Logo system (1-3 initials + 5-color palette) for cards without logos
- Static catalogue logo lookup (import italy.json for brand logo display)
- Barcode Flash overlay (full-screen white, max brightness, centered barcode)
- Multi-format barcode rendering (Code128, EAN-13, EAN-8, QR, CODE39, UPCA)
- Complete offline functionality (all CRUD operations work offline)
- User feedback: loading indicators, success confirmations, error messages

**Technical Notes:**

- Card schema includes sorting fields (lastUsedAt, usageCount, isFavorite) but they remain inactive until Phase 2
- Phase 1 list order: newest first (createdAt descending)
- Barcode round-trip testing required in CI

---

### Story 2.1: Display Card List

**As a** user,
**I want** to see all my loyalty cards in a clean grid,
**So that** I can quickly find and access any card.

**Acceptance Criteria:**

**Given** I have no cards saved
**When** I view the main screen
**Then** I see a friendly empty state encouraging me to add my first card
**And** the empty state includes a prominent "Add Card" call-to-action

**Given** I have cards saved
**When** I view the main screen
**Then** I see my cards in a responsive grid (2 columns on standard phones, 3 on larger screens)
**And** each card shows its name and visual identifier (logo or Virtual Logo)
**And** cards are ordered by creation date (newest first)
**And** the list scrolls smoothly at 60fps
**And** the list works completely offline

---

### Story 2.2: Add Card Manually

**As a** user,
**I want** to add a loyalty card by entering its details,
**So that** I can digitize any card even without scanning.

**Acceptance Criteria:**

**Given** I tap the "+" button in the header
**When** I choose to add a card manually
**Then** I see a form with fields for: card name (required, max 50 chars), barcode number (required)
**And** I can select a barcode format from a picker (Code128, EAN-13, EAN-8, QR, CODE39, UPCA)
**And** I can select a color for the card from the 5-color palette
**And** the barcode field shows a numeric keypad by default
**And** inline validation shows errors for empty required fields

**Given** I submit a valid card
**When** the save completes
**Then** the card is saved to the local database with a client-generated UUID
**And** I am returned to the card list showing my new card
**And** I see a brief success confirmation (haptic + checkmark)

---

### Story 2.3: Scan Barcode with Camera

**As a** user,
**I want** to scan a barcode using my camera,
**So that** I can add cards quickly without typing.

**Acceptance Criteria:**

**Given** I tap the "+" button and choose to scan
**When** I grant camera permission
**Then** I see a camera viewfinder with barcode detection active
**And** there is always a visible "Enter Manually" button below the viewfinder

**Given** the camera detects a valid barcode
**When** detection completes
**Then** the barcode value is automatically captured
**And** the detected format is identified (Code128, EAN-13, etc.)
**And** I am taken to a form pre-filled with the scanned barcode to enter a name
**And** I can save the card immediately

**Given** camera permission is denied
**When** I try to scan
**Then** I see a clear error message explaining why the camera is needed
**And** I am offered the manual entry option as fallback

---

### Story 2.4: Display Virtual Logo

**As a** user,
**I want** cards without official brand logos to show a distinctive visual,
**So that** I can quickly recognize any card in my list.

**Acceptance Criteria:**

**Given** a card does not have a brand logo (brandId is null)
**When** the card is displayed in the list
**Then** it shows a Virtual Logo: 1-3 initials from the card name on a colored background
**And** the background color is the color selected when the card was created
**And** the initials use high-contrast white text
**And** the Virtual Logo has the same dimensions as brand logos for consistent grid layout

---

### Story 2.5: Display Barcode (Barcode Flash)

**As a** user,
**I want** to display my card's barcode in a format optimized for scanning,
**So that** the cashier can scan it quickly at checkout.

**Acceptance Criteria:**

**Given** I tap on a card in my list
**When** the barcode displays
**Then** I see the Barcode Flash overlay: full-screen white background with centered barcode
**And** the barcode is rendered in the correct format (Code128, EAN-13, QR, etc.)
**And** barcode rendering completes in ≤100ms
**And** the barcode number is displayed as text below the barcode
**And** screen brightness is maximized automatically
**And** I can dismiss the overlay by tapping anywhere or swiping

**Given** I am in a location with no network
**When** I tap on a card
**Then** the barcode displays identically (100% offline)

---

### Story 2.6: View Card Details

**As a** user,
**I want** to view all details of a card,
**So that** I can see the full barcode number and manage the card.

**Acceptance Criteria:**

**Given** I am viewing the Barcode Flash
**When** I tap a "Details" button or swipe up
**Then** I see the card detail screen showing:

- Card name
- Barcode (displayed and as text for copying)
- Barcode format
- Card color
- Date added
  **And** I see options to Edit or Delete the card
  **And** I can return to the card list easily

---

### Story 2.7: Edit Card

**As a** user,
**I want** to update my card's information,
**So that** I can fix mistakes or update details.

**Acceptance Criteria:**

**Given** I am viewing a card's details
**When** I tap "Edit"
**Then** I see a form pre-filled with the card's current values
**And** I can update the name, barcode, format, and color
**And** validation rules are the same as when adding

**Given** I save my changes
**When** the update completes
**Then** the card is updated in the database with a new `updatedAt` timestamp
**And** I see the updated card details
**And** I see a brief success confirmation

---

### Story 2.8: Delete Card

**As a** user,
**I want** to remove a card I no longer need,
**So that** my card list stays clean and relevant.

**Acceptance Criteria:**

**Given** I am viewing a card's details
**When** I tap "Delete"
**Then** I see a confirmation dialog asking "Delete [Card Name]?"
**And** the dialog has Cancel and Delete buttons
**And** the Delete button is styled as destructive (red text)

**Given** I confirm deletion
**When** the delete completes
**Then** the card is removed from the database
**And** I am returned to the card list
**And** the deleted card no longer appears

### Story 2.9: Scan Cards from Image or Screenshot

**As a** user who has a loyalty card image or screenshot, **I want** to scan the barcode or QR code from that image, **So that** I can add the card without retyping it.

**Acceptance Criteria:**

- A "Scan from image" option is available in the add-card flow.
- The app imports an image or screenshot and detects a barcode or QR code from it, supporting the same formats as the camera scanner.
- Detected values preserve leading zeros exactly as captured (including EAN-13 leading-zero recovery from UPC-A results via `normalizeBarcode`).
- The detected code and inferred format prefill the existing `/add-card/setup` flow.
- If multiple readable codes are found in one image, the user can pick the correct one.
- If no code is found, a clear retry/error message is shown and manual entry remains available.
- The feature reuses the existing scan and card-setup routing without a separate workflow.

### Story 2.10: Fix Barcode and QR Readability + Quiet-Zone Padding

**As a** shopper presenting my loyalty card at checkout, **I want** generated barcodes and QR codes to be scanner-readable on the first try, **So that** I can complete checkout quickly without retrying scans.

**Acceptance Criteria:**

- QR code readability is reliable across all phone display surfaces (`CardDetails`, fullscreen barcode, barcode flash), passing 5/5 scans per surface on the QA sample payload.
- The renderer applies explicit quiet-zone padding for both QR and linear formats via generator options (not just container spacing).
- Symbols are never clipped at supported sizes and remain high-contrast black on white, with a scanner-safe minimum QR render size.
- Barcode value and format mapping remain unchanged; no stored card data is mutated.
- Automated coverage asserts the scanner-safety options and dimensions for the QR and linear generation paths.
- A QA validation matrix confirms one QR sample and one linear sample (EAN13 or CODE128) pass 5/5 consecutive on-screen scans in checkout-like conditions.

---

## Epic 3: Italian Brand Catalogue

**Goal:** Users can quickly add cards from popular Italian brands with recognizable logos.

**Phase:** 1 (MVP)

**Epic Type:** User-Facing

**Dependencies:** Epic 1 (foundation)

**FRs Covered:** FR14-FR20

**Scope:**

- Catalogue browsing screen with brand logos grid
- Brand selection flow: tap logo → camera scanner → pre-filled form → Save
- Catalogue caching for offline browsing
- ISO date-based versioning for catalogue updates
- OTA catalogue updates via Expo Updates

**Technical Notes:**

- Source of truth: /catalogue/italy.json
- Top 20 Italian brands with logos (SVG preferred, PNG fallback)
- Build-time generation for watchOS (Brands.swift) occurs during Epic 5
- Catalogue updates delivered via OTA

**Enabling Note:** Story 3.1 is an enabling task that unlocks user-facing catalogue browsing.

---

### Story 3.1: Create Italian Catalogue Data [Enabling]

**As a** developer,
**I want** a structured catalogue of Italian loyalty brands,
**So that** users can add cards with recognizable logos.

**Acceptance Criteria:**

**Given** the project needs brand data
**When** I access `/catalogue/italy.json`
**Then** it contains at least 20 popular Italian retail brands
**And** each brand entry includes: id, name, aliases (alternative names), logoUrl
**And** logos are SVG format (preferred) or optimized PNG
**And** the file includes a version field with ISO date (e.g., "2025-12-31")
**And** the JSON schema is validated and documented

_Example brands: Esselunga, Conad, Coop, Carrefour, Lidl, Eurospin, Pam, Despar, etc._

---

### Story 3.2: Browse Catalogue Grid

**As a** user,
**I want** to browse Italian brands with their logos,
**So that** I can quickly find and add my loyalty cards.

**Acceptance Criteria:**

**Given** I tap the "+" button in the header
**When** the Add Card screen loads
**Then** I see the Italian Catalogue as the primary view (catalogue-first)
**And** brands are displayed in a visual grid with their logos
**And** each brand shows its name below the logo
**And** the grid scrolls smoothly at 60fps
**And** there is a "Add Custom Card" option visible for cards not in catalogue

**Given** I am offline
**When** I view the catalogue
**Then** the cached catalogue displays correctly

---

### Story 3.3: Add Card from Catalogue

**As a** user,
**I want** to select a brand and scan my card,
**So that** my card is saved with the official brand logo.

**Acceptance Criteria:**

**Given** I tap on a brand in the catalogue (e.g., Esselunga)
**When** the brand is selected
**Then** the camera scanner opens automatically
**And** the brand name is shown at the top confirming my selection

**Given** I scan a barcode successfully
**When** the scan completes
**Then** I see a form pre-filled with:

- Name pre-filled with the brand name (editable)
- The scanned barcode and detected format
- The brandId linking to the catalogue entry
  **And** I can tap Save to create the card
  **And** the card displays with the official brand logo (not Virtual Logo)
  **And** I see a success confirmation and return to the card list

**Given** I cannot scan the barcode
**When** I tap "Enter Manually"
**Then** I can type the barcode number and save the card with the brand logo

---

### Story 3.4: Cache Catalogue for Offline

**As a** user,
**I want** the catalogue to work without internet,
**So that** I can add cards from known brands anywhere.

**Acceptance Criteria:**

**Given** I have launched the app at least once with internet
**When** I am subsequently offline
**Then** the full Italian catalogue is available from local cache
**And** all brand logos display correctly
**And** I can add cards from the catalogue normally

**Given** the app is installed fresh
**When** I launch without internet
**Then** the bundled catalogue is available immediately (no network required)

---

### Story 3.5: Update Catalogue via OTA

**As a** user,
**I want** to receive new brands without updating the app,
**So that** my catalogue stays current.

**Acceptance Criteria:**

**Given** a new version of the catalogue is published
**When** the app checks for updates
**Then** the catalogue is updated in the background
**And** new brands appear in the catalogue on next app launch
**And** the update does not interrupt my current session

**Given** the local catalogue version is "2025-12-31"
**When** a newer version "2026-01-15" is available
**Then** the app detects the update using ISO date comparison
**And** downloads and applies the new catalogue

---

## Epic 4: Onboarding Experience

**Goal:** Users understand the app and can add their first card in under 60 seconds.

**Phase:** 1 (MVP)

**Epic Type:** User-Facing

**Dependencies:** Epic 3 (catalogue)

**FRs Covered:** FR72-FR74

**Scope:**

- Welcome screen explaining the 'Fumble-Free Flash' concept
- Catalogue-first onboarding (lead with familiar brands, not empty state)
- First card guidance with scanner
- Help documentation / FAQs accessible from settings

**Technical Notes:**

- Onboarding showcases the Italian catalogue (requires Epic 3)
- Silent watch sync in background if Apple Watch is paired

---

### Story 4.1: Welcome Screen

**As a** new user,
**I want** to understand what this app does,
**So that** I know its value before I start.

**Acceptance Criteria:**

**Given** I launch the app for the first time
**When** the app opens
**Then** I see a welcome screen explaining the core concept:

- "Your loyalty cards, instantly on your wrist"
- Highlight: offline, fast, Apple Watch support
  **And** there is a single prominent "Get Started" button
  **And** the welcome screen only appears once (first launch)
  **And** the design uses the Sage Green accent color

**Given** I have used the app before
**When** I launch the app
**Then** I go directly to the card list (no welcome screen)

---

### Story 4.2: First Card Guidance

**As a** new user,
**I want** to be guided to add my first card,
**So that** I experience value quickly.

**Acceptance Criteria:**

**Given** I tap "Get Started" on the welcome screen
**When** the guidance begins
**Then** I am taken directly to the Italian Catalogue (catalogue-first)
**And** I see a brief prompt: "Tap a brand to add your first card"
**And** the prompt is dismissible and non-blocking

**Given** I successfully add my first card
**When** I return to the card list
**Then** I see a celebratory moment (subtle animation or message)
**And** the onboarding is marked complete
**And** I can now use the app normally

**Given** I dismiss the guidance without adding a card
**When** I navigate away
**Then** the guidance does not reappear (respects user choice)

---

### Story 4.3: Help & FAQ Access

**As a** user,
**I want** to access help when I'm confused,
**So that** I can learn how to use features.

**Acceptance Criteria:**

**Given** I am in the Settings screen
**When** I tap "Help & FAQ"
**Then** I see a list of common questions and answers:

- "How do I add a card?"
- "How does the Apple Watch work?"
- "What if my brand isn't in the catalogue?"
- "Is my data safe?"
  **And** each FAQ expands to show the answer
  **And** the content works offline (bundled, not fetched)

---

## Epic 5: Apple Watch App

**Goal:** Users can access their cards on their Apple Watch without needing their phone — the 'Fumble-Free Flash' experience.

**Phase:** 1 (MVP)

**Epic Type:** User-Facing (with enabling tasks)

**Dependencies:** Epic 2 (card data), Epic 3 (catalogue generation)

**FRs Covered:** FR12, FR34, FR43-FR47, FR52

**Scope:**

- Native Swift/SwiftUI watchOS app
- Carbon Utility design (OLED-black, high-contrast, minimal)
- Vertical infinite scroll list with Digital Crown support
- Single-tap to display barcode (NO confirmation dialogs)
- Haptic feedback on card tap
- Barcode Flash: full-screen white background for scanning
- WatchConnectivity for phone ↔ watch sync
- Local SwiftData storage for standalone operation
- Build-time catalogue generation (Brands.swift from italy.json)

**Technical Notes:**

- Watch is READ-ONLY for card data (card editing only on phone); usage events permitted, applied commutatively on phone (ADR-2026-06-09-001)
- Card list order matches phone (newest first / alphabetical)
- Sync protocol uses versioned messages (CARDS_UPDATED, CARD_ADDED, etc.)

**Enabling Note:** Stories 5.1–5.2 are enabling tasks required for the watch user experience.

---

### Story 5.1: Create watchOS Project Structure [Enabling]

**As a** developer,
**I want** a properly structured watchOS project,
**So that** I can build the Apple Watch companion app.

**Acceptance Criteria:**

**Given** the existing Expo/React Native project
**When** I set up the watchOS project
**Then** the `/watch-ios/` folder contains a native watch app project
**And** the project targets the required watchOS version for local persistence
**And** the project structure follows Apple's recommended patterns
**And** a README documents that this is native Swift (not React Native)
**And** the project builds successfully with standard watchOS tooling

---

### Story 5.2: Generate Catalogue for watchOS [Enabling]

**As a** developer,
**I want** the Italian catalogue available as Swift code,
**So that** the watch app has brand data without JSON parsing at runtime.

**Acceptance Criteria:**

**Given** the `/catalogue/italy.json` file exists
**When** I run the catalogue generation step
**Then** it generates `Brands.swift` in the `/watch-ios/Generated/` folder
**And** the generated file contains a Swift struct with all brand data
**And** the generated file is in `.gitignore` (never committed)
**And** the build process runs this generation step before compiling

---

### Story 5.3: Implement Card List (Carbon UI)

**As a** user,
**I want** to see my cards in a clean list on my watch,
**So that** I can quickly find and select a card.

**Acceptance Criteria:**

**Given** I open the myLoyaltyCards app on my Apple Watch
**When** the app launches
**Then** I see my cards in a vertical list (Carbon Utility design)
**And** the background is OLED black (#000000) for battery efficiency
**And** each card shows: name and visual identifier (logo or initials + color)
**And** the list supports Digital Crown scrolling
**And** the app launches in ≤2 seconds (cold start)
**And** scrolling is smooth at 60fps

**Given** I have no cards synced
**When** the app opens
**Then** I see a message: "Open the iPhone app to add cards"

---

### Story 5.4: Display Barcode on Watch

**As a** user,
**I want** to display a barcode on my watch,
**So that** the cashier can scan it at checkout.

**Acceptance Criteria:**

**Given** I see my card list on the watch
**When** I tap a card
**Then** the barcode displays immediately (no confirmation dialog)
**And** the screen shows a white background with centered barcode
**And** I feel haptic feedback confirming the tap
**And** the barcode is rendered in the correct format
**And** the card name is shown above or below the barcode
**And** the total time from tap to barcode visible is ≤1 second

**Given** the barcode is displayed
**When** I tap the screen or press the Digital Crown
**Then** I return to the card list

**Given** I have no network connection
**When** I tap a card
**Then** the barcode displays identically (100% offline)

---

### Story 5.5: Store Cards Locally on Watch

**As a** user,
**I want** my cards stored on my watch,
**So that** they're available even without my phone nearby.

**Acceptance Criteria:**

**Given** cards have been synced to my watch
**When** I restart my watch or the app
**Then** all my cards are still available
**And** cards persist across app updates

**Given** my phone is not nearby (out of Bluetooth range)
**When** I open the watch app
**Then** I can still access all previously synced cards
**And** I can display any card's barcode

**Technical Note:** Uses SwiftData for persistence on watchOS 10+.

---

### Story 5.6: Sync Cards from Phone

**As a** user,
**I want** my cards to sync automatically to my watch,
**So that** new cards appear without manual action.

**Acceptance Criteria:**

**Given** I add a card on my phone
**When** my watch is connected via Bluetooth
**Then** the card syncs to my watch automatically (background)
**And** the sync completes within 30 seconds
**And** the card appears in my watch card list

**Given** I edit a card on my phone
**When** sync occurs
**Then** the updated card data appears on my watch

**Given** I delete a card on my phone
**When** sync occurs
**Then** the card is removed from my watch

**Given** sync fails (watch disconnected)
**When** the watch reconnects
**Then** sync retries automatically
**And** the watch receives all pending changes

**Technical Note:** Uses WatchConnectivity framework. Sync messages include version field for future compatibility.

### Story 5.6a: WatchConnectivity Payload Hardening

**As an** Apple Watch user, **I want** phone-to-watch sync payloads to respect WatchConnectivity's transport contract and preserve sorting metadata, **So that** my cards sync reliably and stay ordered by usage and recency.

**Acceptance Criteria:**

- Outbound phone-side messages are sanitized to property-list-safe values before `sendMessage`, `updateApplicationContext`, or `transferUserInfo`; `null`, `undefined`, and unsupported nested values are omitted.
- Both snapshot pushes (`type: 'cards'`) and nested one-shot messages (e.g. `syncCard`) are sanitized consistently.
- `WatchCard` decodes `usageCount`, `lastUsedAt`, and `createdAt` when present, remains backward compatible with legacy payloads that omit them, and re-encodes them in ISO 8601 form.
- `CardStore.migrateUserDefaults(to:)` preserves `usageCount`, `lastUsedAt`, and `createdAt`, and legacy fallback data remains importable without crashes.
- JS tests cover outbound sanitization for snapshot and nested payloads; watchOS unit tests cover decoding, encoding, and migration preservation.
- The targeted `core/watch-connectivity.test.ts` suite, the full JS suite, and watchOS validation all pass.

### Story 5.7: Create Watch Complication

**As an** Apple Watch user, **I want** a home screen complication showing my most relevant loyalty card or sync status, **So that** I can launch the app or check card readiness quickly without opening it.

**Acceptance Criteria:**

- A complication is implemented for at least one supported family (e.g. Circular Small or Modular Large).
- The complication provides a glanceable card title or sync status and, when tapped, opens the watch app to the card list or active card screen.
- The complication updates with the latest card data when the watch app syncs or the timeline reloads.
- The complication gracefully falls back to a static icon or "No cards" state (localized EN/IT) when no card is synced yet.
- The complication is included in the watch target build and passes watchOS compile/validation.

### Story 5.8: Incremental catalogue generation

**As a** developer, **I want** the watch catalogue code generator to run incrementally, **So that** iterative Xcode builds are fast while the committed generated file stays correct.

**Acceptance Criteria:**

- Given a clean repo and a previously-generated `watch-ios/Generated/Brands.swift`, a local watch build does not re-run the generator and build time is reduced (deterministic input hashing + `.xcfilelist` inputs/outputs).
- When `catalogue/italy.json` or the generator script changes, the watch build regenerates `Brands.swift` and the change is visible.
- CI runs a `check:catalogue-generated` job that regenerates and compares against the committed file, failing if they differ.
- The generated `Brands.swift` remains committed; any regenerating automation must update the committed artifact or fail CI.
- Unit and integration tests cover input hashing, regeneration on change, and stale-output detection.

### Story 5.9: Remove legacy UserDefaults fallback (watch.cards)

**As a** product engineer, **I want** the watch app to use SwiftData only, removing the legacy `UserDefaults` key `watch.cards` and its migration fallback, **So that** storage is consistent, tests use a single data surface, and dead legacy paths are gone before public release.

**Acceptance Criteria:**

- No `watch-ios` source references the `UserDefaults.standard` key `watch.cards`.
- Tests that previously used `UITEST_CARDS` are updated to seed an in-memory SwiftData ModelContainer (seeding moved to app launch) rather than the env-var → CardStore shim.
- `CardStore.migrateUserDefaults(to:)` and its UserDefaults-based unit tests are removed or archived/disabled.
- `CardListView` no longer reads or writes `watch.cards`; debug import inserts into `ModelContext`.
- All watchOS unit and UI tests pass locally and in CI.
- The PR includes the updated story file and `sprint-status.yaml` entry.

### Story 5.10: Watch Barcode Legibility and List Density Polish

**As a** watch user, **I want** a larger barcode, the card name shown as the screen title, and denser list rows, **So that** I can find a card faster and present a scan-ready code with less friction.

**Acceptance Criteria:**

- The barcode render area is increased for both linear and QR formats (target at least 80% of container width) while keeping scanner-safe contrast and no clipping.
- The barcode screen displays the selected card name as title-level context.
- Card list row padding/spacing is reduced to improve density on 41mm screens (target at least +1 visible row versus baseline) without truncation regressions.
- Row tap targets remain watch-usable and accessibility-safe (44pt minimum, VoiceOver labels preserved).
- Existing interaction behaviour is intact: tapping a row opens the barcode view; tapping the barcode or using the crown dismisses back to the list.
- Watch tests and validation artifacts are updated for any changed identifiers/layout assumptions, including a native Core Image QR render path plus a phone-synced pre-rendered QR image fallback, and automated checks pass.

---

## Epic 6: User Authentication & Privacy

**Goal:** Users can optionally create an account to enable cloud backup, with full control over their data (guest mode stays fully functional).

**Phase:** 1 (MVP) · **Epic Type:** User-Facing (with enabling tasks) · **Dependencies:** Epic 1

**FRs Covered:** FR25-FR33, FR53, FR55-FR58

### Story 6.1: Create Supabase Project (Production Only)

**As a** team, **I want** a single Production Supabase project provisioned with secure credentials, **So that** the app has a backend for cloud storage and authentication.

**Acceptance Criteria:**

- Supabase project exists, accessible, with the Production environment configured (no Dev) in the correct region
- Environment URL and API key documented and stored securely (never committed to the repo)
- Row-Level Security is enabled by default across tables
- Project setup steps are documented for the team

### Story 6.2: Define Cloud Schema & Row-Level Security

**As a** developer, **I want** a Supabase schema for loyalty cards and users protected by Row-Level Security, **So that** each user's cloud data is private and owner-scoped.

**Acceptance Criteria:**

- `loyalty_cards` table matches the Zod schema (id, name, barcode, etc.); `users` table holds profiles
- RLS policies restrict all access to the owning user only
- Schema, policies, and any migration scripts are documented

### Story 6.3: Configure App Client for Supabase

**As a** developer, **I want** the Expo/React Native app wired to Supabase via env vars and secure client init, **So that** the app can talk to the backend reliably.

**Acceptance Criteria:**

- Supabase client initialized in the app from environment variables for URLs and keys
- Connection-failure error handling implemented
- Credentials held in secure storage (expo-secure-store); setup and usage documented

### Story 6.4: Privacy Policy & Consent Flow

**As a** user, **I want** to view the privacy policy and give explicit consent before creating an account, **So that** my data is handled in a GDPR-compliant, transparent way.

**Acceptance Criteria:**

- Privacy policy accessible in onboarding and settings, with content available offline
- Consent checkbox required before account creation, and consent is stored and auditable
- GDPR compliance documented

### Story 6.5: Implement Guest Mode

**As a** user, **I want** to use every app feature without creating an account, **So that** I can manage cards locally with no sign-in friction.

**Acceptance Criteria:**

- No login required for core features; all card management and watch sync work in guest mode
- Data stored only on device (not cloud), with no account-creation prompts during normal use
- An upgrade path to account creation is visible in settings

### Story 6.6: Create Account with Email

**As a** user, **I want** to register with email and password, **So that** I can create an account for cloud backup.

**Acceptance Criteria:**

- Registration form (email, password, confirm password) with password requirements displayed and validated
- Secure token storage (expo-secure-store); automatic sign-in and success confirmation
- Error handling for invalid input

### Story 6.7: Sign In with Email

**As a** user, **I want** to authenticate with my email and password, **So that** I can access my account and its cloud data.

**Acceptance Criteria:**

- Login form with email and password; error messages for invalid credentials and success feedback
- Session persistence via secure storage
- Logout option available

### Story 6.8: Password Reset

**As a** user who forgot my password, **I want** to reset it via email, **So that** I can regain access without losing my data.

**Acceptance Criteria:**

- "Forgot Password?" link on the Sign In screen; user requests a reset by entering their email
- Clear feedback for success and error cases; reset email deep-links to an in-app new-password form
- User signed in automatically after reset, with no change to locally stored cards
- (Superseded by Story 6.19 — the deep-link recovery never lands on device)

### Story 6.9: Logout

**As a** signed-in user, **I want** to sign out on this device and return to guest mode, **So that** I keep my local cards while ending my session.

**Acceptance Criteria:**

- "Sign Out" clearly visible in Settings when signed in, with a confirmation dialog ("Your cards will remain on this device")
- Auth token removed from SecureStore; user returned to guest mode with local cards still accessible
- Settings updates to reflect guest mode (shows "Sign In" / "Create Account")

### Story 6.10: Delete Account

**As a** signed-in user, **I want** to permanently delete my cloud account and all associated data, **So that** my GDPR right to erasure is fulfilled and I control my data.

**Acceptance Criteria:**

- Destructive "Delete Account" entry in Settings, visible only when authenticated, behind a multi-step confirm (typing "DELETE")
- An Edge Function fully erases cloud data (loyalty_cards, users profile, privacy_log, auth.users) as a full GDPR erasure
- Local SQLite cards preserved; auth token cleared and state transitions to guest, navigating to the card list
- Loading feedback and clear error handling with retry; failures leave no partial state

### Story 6.11: Privacy & Consent

**As a** user, **I want** to review the Privacy Policy before signing up and see a summary of collected data in Settings, **So that** GDPR transparency obligations are met.

**Acceptance Criteria:**

- Privacy Policy link on the Create Account screen before submission, with required acknowledgement of terms before registering
- Privacy Policy reachable from Settings at any time (same content as the existing `app/privacy-policy.tsx`)
- Settings shows a read-only "What We Collect" summary; any "Download My Data" CTA is a labelled placeholder (export belongs to Epic 8)

### Story 6.12: Sign In with Apple

**As a** user, **I want** to create an account or sign in with my Apple ID, **So that** I get fast, private social sign-in and Apple's App Store requirement is satisfied.

**Acceptance Criteria:**

- "Sign in with Apple" button on both the Sign In and Create Account screens; the Apple authentication sheet appears on tap
- Account created or linked in Supabase on success; user signed in automatically with the auth token stored securely
- Apple private relay (hide-my-email) supported
- iOS only — button hidden on Android and Web
- Requires a provisioned physical iOS device from day one (Apple Sign In does not work on the Simulator)

### Story 6.13: Sign In with Google

**As a** user, **I want** to create an account or sign in with my Google account, **So that** I get one-tap sign-in on both iOS and Android.

**Acceptance Criteria:**

- "Sign in with Google" button on the Sign In and Create Account screens across iOS and Android
- Google account picker appears on tap
- Account created or linked in Supabase on success; user signed in automatically with the auth token stored securely
- Works on both iOS and Android

### Story 6.14: Upgrade Guest to Account

**As a** guest user, **I want** my local cards migrated to the cloud automatically when I first create an account (via any method), **So that** I transition to an authenticated session with no data loss.

**Acceptance Criteria:**

- All local cards uploaded to the cloud immediately after first successful authentication, staying visible and usable throughout
- Migration is idempotent (no duplicates if triggered more than once); guest session replaced by an authenticated session seamlessly
- User sees a backup confirmation; migration errors shown clearly with a retry option

### Story 6.15: Migration Banner Polish

**As a** developer, **I want** to clear the three low-severity polish items deferred from the Story 6.14 code review, **So that** the migration banner code is clean and the copy matches the UX with no functional change.

**Acceptance Criteria:**

- Remove the redundant `!message` guard in `MigrationBanner.tsx` (the hook always nulls `message` when idle), leaving only the `status === 'idle'` check
- Fix the error-banner copy in `useGuestMigration.ts` to drop the misleading "Tap to retry" (the banner has a distinct Retry button and is not tappable)
- Remove the unused `uuid` mock from `guest-migration.test.ts` (dead setup — the service never imports `uuid`)
- All 43 migration tests still passing and the full suite green

### Story 6.16: User Profile Creation on Signup

**As** the system, **I want** a `public.users` profile row created automatically whenever a new auth user registers, **So that** every authenticated user has a profile entry to anchor future features (e.g. Epic 14 household collaboration).

**Acceptance Criteria:**

- Migration `002_user_profile_trigger.sql` adds nullable `display_name` and `avatar_url` to `public.users` and creates an idempotent `handle_new_user()` function plus an `AFTER INSERT ON auth.users` trigger (`ON CONFLICT (id) DO NOTHING`)
- Existing `001_initial_schema.sql` RLS policies already cover the new columns (no new policies needed)
- `signUp()` in `shared/supabase/auth.ts` does a defensive idempotent upsert fallback (never fails signup on profile-insert error) and passes consent metadata through so it can be persisted
- `auth.test.ts` asserts the users upsert payload and conflict-safe behaviour

### Story 6.17: Design — OTP Email Verification Screen

**As a** designer, **I want** to design the in-app OTP email verification screen that follows account creation, **So that** developers have approved, pixel-accurate Figma frames for Story 6.18 and users verify without leaving the app.

**Acceptance Criteria:**

- Full screen layout: app icon, "Verify your email" heading, "We sent a 6-digit code to {email}" subtitle, 6 OTP cells, disabled-until-complete Confirm CTA, "Resend code" with 60s countdown, "Wrong email? Go back" link, auto-submit annotation
- Every state designed (empty, filling, complete, loading, wrong OTP, expired OTP, verification unavailable, resend success/failure, transition-only success) in both light and dark, reusing Story 13.5 auth tokens
- Frames delivered to the Figma "OTP Verification" page with consistent naming and prototype annotations (auto-advance, backspace, resend cooldown, wrong-email nav, keyboard-open, success handoff)
- Ifero approved the frames (2026-04-28) before Story 6.18 moved to ready-for-dev

### Story 6.18: OTP Email Verification Flow

**As a** new user who just created an account, **I want** to verify my email by entering a 6-digit OTP sent to my inbox, **So that** I can confirm my account without leaving the app or relying on unreliable magic links.

**Acceptance Criteria:**

- Replaces magic-link confirmation: after signup the user is routed to `/verify-email`, enters the emailed code, and on success is signed in and routed to the main app
- `enable_confirmations = true` set in `supabase/config.toml` and the production dashboard; OTP email template uses `{{ .Token }}`
- New `verifyEmailOtp()` and `resendVerificationEmail()` in `shared/supabase/auth.ts` expose stable error codes so UI and tests don't branch on raw Supabase strings
- Auto-submit on the 6th digit / full paste; success is transition-only (no terminal screen); built against the approved 6.17 handoff

### Story 6.18a: OTP Verification Follow-up — Single Field + 8-Digit Alignment

**As a** new user verifying my email, **I want** the app to accept the real 8-digit OTP in a single text field, **So that** verification succeeds reliably and entry stays readable on mobile.

**Acceptance Criteria:**

- Figma "OTP Verification" page updated first: OTP cell row replaced by a single text field, subtitle reads "We sent an 8-digit code to {email}", auto-submit annotation moved to the 8th digit (light and dark)
- `supabase/config.toml` sets `auth.email.otp_length = 8`; template stays OTP-based; stale 6-digit docs corrected
- `verifyEmailOtp(email, token)` uses the current `verifyOtp({ email, token, type: 'email' })` contract; UI error normalization (`invalid_otp`, `expired_otp`, `network_error`, `unknown_error`) preserved
- `VerifyEmailScreen` uses one digits-only field capped at 8, full paste works, auto-submits on the 8th digit, CTA disabled until exactly 8; regression coverage plus lint/typecheck/Jest green, dev review at 0 comments before QA

### Story 6.19: Password reset via OTP (replace the dead deep-link recovery)

**As a** user who forgot my password, **I want** to reset it with an emailed one-time code entered in the app, **So that** I can regain access without relying on a deep link that never lands.

**Acceptance Criteria:**

- Recovery email is OTP-based (8-digit `{{ .Token }}`, not a link): new `[auth.email.template.recovery]` + `recovery.html`, and the production dashboard recovery template switched to OTP
- New shared plumbing in `shared/supabase/auth.ts`: `sendPasswordResetOtp(email)` (no `redirectTo`, no user enumeration), `verifyPasswordResetOtp(email, token)` via `verifyOtp({ type: 'recovery' })` with normalized errors, reusing `updatePassword` and a renamed shared `normalizeOtpError`
- `ForgotPasswordScreen` sends and navigates to a reused OTP-verify screen (8-digit, parametrized `purpose: 'signup' | 'recovery'`) then a shared new-password screen; success routes to `/` via `router.replace`, clearing the back stack
- No redirect allowlist / `setSession` / deep-link handling; copy localized in en + it; tests ≥80% co-located (no `__tests__`); regression tests prove the signup path is unchanged

### Story 6.20: Change password in Settings (OTP-gated)

**As a** signed-in user, **I want** to change my password from Settings gated by an emailed OTP, **So that** I can rotate my password securely without signing out.

**Acceptance Criteria:**

- Non-destructive "Change Password" `ActionRow` between Sign Out and Delete Account (lock icon, testID, localized accessibilityLabel), hidden for guests
- Tapping it calls `sendPasswordResetOtp(currentUserEmail)` (email from `getSession`) and reuses the 6-19 recovery OTP-verify and shared new-password screens
- On success, route back to `/settings` (not `/`) with a success toast; the new-password screen takes a success-destination param
- OTP wrong/expired/network reuse the 6.18/6-19 inline states; `updatePassword` failure shows a localized error; copy localized (en + it); tests ≥80% co-located (no `__tests__`)
- Depends on and sequenced after 6.19 (reuses its plumbing); OTP gate is an app-level defense-in-depth decision, not a Supabase requirement

---

## Epic 7: Cloud Synchronization

**Goal:** Users' cards sync across all their devices when signed in.

**Phase:** 1 (MVP)

**Epic Type:** User-Facing

**Dependencies:** Epic 6 (authentication)

**FRs Covered:** FR35-FR42

**Scope:**

- Supabase REST API integration for phone ↔ cloud sync
- Background synchronization (automatic)
- Delta sync (only changed cards)
- 5-minute cloud sync throttling (persistent)
- Offline queue with retry on reconnect
- Last-write-wins conflict resolution
- Multi-device sync for authenticated users
- Sync status indicators
- Error handling with overlay messages for sync failures

**Technical Notes:**

- Network connectivity detection
- Bidirectional sync: phone ↔ cloud, propagates to watch via Epic 5

---

### Story 7.1: Upload Cards to Cloud

**As a** user,
**I want** my local cards uploaded to the cloud when I sign in,
**So that** they're backed up and available on other devices.

**Acceptance Criteria:**

**Given** I sign in to my account for the first time
**When** authentication succeeds
**Then** all my local cards are uploaded to the cloud backend
**And** the upload respects the configured sync throttle window
**And** I see a subtle sync indicator during upload
**And** cards remain accessible during the upload process

**Given** I have many cards (e.g., 50+)
**When** upload occurs
**Then** cards are uploaded in batches for efficiency
**And** the process completes without timeout

---

### Story 7.2: Download Cards from Cloud

**As a** user,
**I want** my cloud cards downloaded to a new device,
**So that** I can access them everywhere.

**Acceptance Criteria:**

**Given** I sign in on a new device
**When** authentication succeeds
**Then** all my cards from the cloud backend are downloaded
**And** the cards appear in my card list
**And** brand logos display correctly (using bundled catalogue)
**And** I can use the cards immediately after download

**Given** I already have local cards on the new device (guest mode)
**When** I sign in and download
**Then** cloud cards are merged with local cards
**And** duplicate cards (same barcode) are handled gracefully

---

### Story 7.3: Sync Card Changes

**As a** user,
**I want** card changes to sync automatically,
**So that** all my devices stay up to date.

**Acceptance Criteria:**

**Given** I am signed in
**When** I add a new card
**Then** the card is uploaded to the cloud backend in the background
**And** the sync occurs within the configured throttle window

**Given** I am signed in
**When** I edit a card
**Then** the updated card is synced to the cloud backend
**And** the `updatedAt` timestamp is refreshed

**Given** I am signed in
**When** I delete a card
**Then** the card is marked as deleted in the cloud backend
**And** the deletion syncs to other devices

---

### Story 7.4: Implement Delta Sync

**As a** user,
**I want** only changed cards to sync,
**So that** sync is fast and data-efficient.

**Acceptance Criteria:**

**Given** I have 100 cards and edit 1
**When** sync occurs
**Then** only the 1 changed card is uploaded (not all 100)
**And** the sync uses `updatedAt` timestamps to detect changes

**Given** my device syncs after being offline
**When** sync resumes
**Then** only cards changed since last sync are transferred
**And** the sync completes quickly

---

### Story 7.5: Handle Offline Queue

**As a** user,
**I want** my changes saved when offline,
**So that** nothing is lost when I'm in a basement or on a plane.

**Acceptance Criteria:**

**Given** I am signed in but offline
**When** I add, edit, or delete a card
**Then** the operation is queued locally
**And** my local data reflects the change immediately

**Given** I have queued operations
**When** network connectivity is restored
**Then** queued operations are synced automatically
**And** I see a brief sync indicator
**And** no user intervention is required

**Given** a queued sync fails repeatedly
**When** max retries are exceeded
**Then** I see an error notification
**And** I can manually trigger a retry

---

### Story 7.6: Resolve Sync Conflicts

**As a** user,
**I want** sync conflicts resolved automatically,
**So that** I don't have to manually fix data issues.

**Acceptance Criteria:**

**Given** I edit a card on Device A
**And** I edit the same card on Device B before sync
**When** both devices sync
**Then** the card with the latest `updatedAt` wins (last-write-wins)
**And** the losing edit is overwritten
**And** no user prompt or manual resolution is required

**Given** conflicts are resolved
**When** I view the card on both devices
**Then** both devices show the same data

---

### Story 7.7: Display Sync Status

**As a** user,
**I want** to see if my data is synced,
**So that** I know my cards are backed up.

**Acceptance Criteria:**

**Given** I am signed in
**When** sync is in progress
**Then** I see a subtle sync indicator (spinning icon or pulse)
**And** the indicator does not block my interaction

**Given** sync completes successfully
**When** I look at the UI
**Then** the sync indicator disappears or shows a checkmark briefly

**Given** sync fails
**When** the error occurs
**Then** I see an overlay message: "Sync failed. Changes saved locally."
**And** I can tap to retry or dismiss
**And** the error is clear (not technical jargon)

---

> [!NOTE]
> **Epic 8 is ABSORBED into Epic 13 (DEC-S10-001).** Stories 8.1–8.5 were not built
> separately — the Settings screen shipped via Story 13.6. Retained for traceability.

## Epic 8: Settings & Preferences

**Goal:** Users can customize the app to their preferences and access their data.

**Phase:** 1 (MVP)

**Epic Type:** User-Facing

**Dependencies:** Epic 4 (Help/FAQ content)

**FRs Covered:** FR54, FR57, FR66-FR69, FR73

**Scope:**

- Settings screen with organized sections
- Theme toggle (light/dark mode, respects system default)
- Language selection (English for MVP, externalized for future localization)
- JSON data export (GDPR data portability)
- Privacy policy link
- Help / FAQs link
- App version and build information
- Open source licenses

**Technical Notes:**

- Settings persisted in AsyncStorage
- Theme preference syncs with system but allows manual override

---

### Story 8.1: Create Settings Screen

**As a** user,
**I want** a dedicated settings screen,
**So that** I can find and adjust all app preferences.

**Acceptance Criteria:**

**Given** I tap the ⚙️ button in the header
**When** the Settings screen opens
**Then** I see organized sections:

- **Account** (if signed in: email, Sign Out, Delete Account)
- **Account** (if guest: Create Account, Sign In)
- **Appearance** (Theme)
- **Language**
- **Data** (Export Data)
- **About** (Help, Privacy Policy, App Info)
  **And** each section has clear headings
  **And** the screen matches the app's design system

---

### Story 8.2: Toggle Theme (Light/Dark)

**As a** user,
**I want** to choose between light and dark mode,
**So that** the app matches my preference or environment.

**Acceptance Criteria:**

**Given** I am in Settings > Appearance
**When** I see the Theme option
**Then** I can choose: System (default), Light, or Dark
**And** the current selection is highlighted

**Given** I select "System"
**When** my device is in dark mode
**Then** the app uses dark mode
**And** when my device switches to light mode, the app follows

**Given** I select "Dark" explicitly
**When** my device is in light mode
**Then** the app still uses dark mode (override)

**Given** I change the theme
**When** I return to other screens
**Then** the theme change is applied immediately
**And** my preference persists across app restarts

---

### Story 8.3: Select Language

**As a** user,
**I want** to choose my preferred language,
**So that** the app displays text in my language.

**Acceptance Criteria:**

**Given** I am in Settings > Language
**When** I see the Language option
**Then** I can choose from available languages (English for MVP)
**And** the current language is highlighted

**Given** I select a different language
**When** the change is applied
**Then** all app text updates to the selected language
**And** my preference persists across app restarts

**Technical Note:** MVP supports English only. UI is externalized via i18next for future localization.

---

### Story 8.4: Export Data as JSON

**As a** user,
**I want** to export all my card data,
**So that** I can have a portable backup (GDPR data portability).

**Acceptance Criteria:**

**Given** I am in Settings > Data
**When** I tap "Export Data"
**Then** a JSON file is generated containing all my cards
**And** each card includes: name, barcode, barcodeFormat, color, brandId, dates

**Given** the export is ready
**When** the file is generated
**Then** the system share sheet opens
**And** I can save the file, send via email, or share to other apps

**Given** I am offline
**When** I tap "Export Data"
**Then** the export still works (local data only)

---

### Story 8.5: Display App Info

**As a** user,
**I want** to see app information,
**So that** I know the version and can access legal info.

**Acceptance Criteria:**

**Given** I am in Settings > About
**When** I view the About section
**Then** I see:

- App version and build number
- "Help & FAQ" link (opens FAQ from Epic 4)
- "Privacy Policy" link (opens privacy policy)
- "Open Source Licenses" link (shows MIT license and dependencies)

**Given** I tap "Privacy Policy"
**When** the policy loads
**Then** I see the full privacy policy text (bundled or webview)

**Given** I tap "Open Source Licenses"
**When** the licenses load
**Then** I see the MIT license and a list of open source dependencies used

---

## Epic 9: Smart Card Sorting

**Goal:** Users' most-used cards are always at the top for quick access.

**Phase:** 2 (Enhancement)

**Epic Type:** User-Facing

**Dependencies:** Epic 2 (card list + display)

**FRs Covered:** FR8, FR21-FR24

**Scope:**

- Usage tracking: increment usageCount and update lastUsedAt on card display
- Sorting algorithm: favorites first → frequency → recency → alphabetical
- Favorites/pinning functionality (long-press to pin)
- Visual indicator for pinned cards
- Sorting applies to both phone and watch lists

**Technical Notes:**

- Schema fields already exist from Epic 2 (just inactive)
- Activate tracking and sorting logic
- Target: correct card in top 3 positions 95% of time

---

### Story 9.1: Track Card Usage

**As a** user,
**I want** the app to remember which cards I use most,
**So that** they can be surfaced quickly.

**Acceptance Criteria:**

**Given** I tap a card to display its barcode
**When** the barcode is shown
**Then** the card's `usageCount` is incremented by 1
**And** the card's `lastUsedAt` is updated to the current timestamp
**And** this tracking works offline

---

### Story 9.2: Mark Card as Favorite

**As a** user,
**I want** to pin my most important cards,
**So that** they always appear at the top.

**Acceptance Criteria:**

**Given** I am viewing a card's details
**When** I tap the favorite/star icon
**Then** the card's `isFavorite` is toggled
**And** the icon reflects the current state (filled = favorite)
**And** the change persists and syncs to cloud if signed in

**Given** a card is marked as favorite
**When** I view my card list
**Then** the card shows a visual indicator (star badge)

---

### Story 9.3: Implement Sorting Algorithm

**As a** user,
**I want** my cards automatically sorted by relevance,
**So that** the right card is near the top when I need it.

**Acceptance Criteria:**

**Given** I have multiple cards with varying usage
**When** I view my card list
**Then** cards are sorted by:

1. Favorites first (isFavorite = true)
2. Then by usage frequency (usageCount descending)
3. Then by recency (lastUsedAt descending)
4. Then alphabetically by name (fallback)

**Given** I have 10 cards with usage data
**When** I visit my usual store
**Then** the correct card appears in the top 3 positions at least 95% of the time

---

### Story 9.4: Sync Sorting to Watch

**As a** user,
**I want** my watch to use the same card order,
**So that** my most-used cards are on top there too.

**Acceptance Criteria:**

**Given** cards are sorted on my phone
**When** the watch syncs
**Then** the watch card list uses the same sort order
**And** usage data (usageCount, lastUsedAt, isFavorite) syncs to the watch
**And** favourite cards show a star/pin indicator on the watch _(AC added 2026-06-09 — C3 folded in via correct-course; see `sprint-artifacts/sprint-change-proposal-2026-06-09.md`)_

---

### Story 9.5: Selectable Watch Sort

_Added 2026-06-09 via correct-course (`sprint-artifacts/sprint-change-proposal-2026-06-09.md`)._

**As a** user,
**I want** to choose how my cards are sorted on the Watch,
**So that** the order matches how I think about my cards.

**Acceptance Criteria:**

**Given** I am on the Watch card list
**When** I open the sort control (toolbar button → picker)
**Then** I can choose Frequently used / Recently added / A‑Z (the same modes as the phone)
**And** the default is A‑Z
**And** my choice persists on the Watch across launches, independently of the phone's selected mode

**Dependencies:** Story 9.4. **Needs:** PRD FR25, UX watch-picker spec.

---

### Story 9.6a: Watch Usage-Event Architecture (Spike / ADR) [Enabling]

_Added 2026-06-09 via correct-course. Gates Story 9.6 (spike-first per Sprint 14 retro)._

**As an** architect,
**I want** a validated design for watch→phone usage events,
**So that** counting watch card opens never reintroduces edit conflicts.

**Acceptance Criteria:**

**Given** the watch read-only-for-data invariant
**When** the ADR is produced
**Then** it specifies a `CARD_USED` (watch → phone) message in the versioned sync protocol
**And** proves conflict-free reconciliation (commutative usageCount increments; lastUsedAt = max)
**And** refines the "watch read-only" wording to "read-only for card data; usage events permitted"
**And** confirms Wear OS (Epic 10) can adopt the same protocol

---

### Story 9.6: Count Card Opens on the Watch

_Added 2026-06-09 via correct-course. Depends on the 9.6a ADR + PM scope confirmation._

**As a** user,
**I want** opening a card on my Watch to count toward usage,
**So that** "most used" is accurate on both Watch and phone.

**Acceptance Criteria:**

**Given** I open a card on the Watch
**When** the phone is (or becomes) reachable
**Then** the phone increments that card's usageCount and updates lastUsedAt
**And** events queue offline on the Watch and flush on reachability
**And** the Watch remains read-only for card data (no create/edit/delete/favourite from the watch)

---

## Epic 10: Wear OS App

**Goal:** Users can access their cards on their Android smartwatch.

**Phase:** 2 (Enhancement)

**Epic Type:** User-Facing (with enabling tasks)

**Dependencies:** Epic 2 (card data), Epic 3 (catalogue generation)

**FRs Covered:** FR12, FR43-FR47, FR52 (Wear OS specific)

**Scope:**

- Native Kotlin/Compose Wear OS app
- Carbon Utility design (same as watchOS)
- Wearable Data Layer API for phone ↔ watch sync
- Room database for local storage
- Build-time catalogue generation (Brands.kt from italy.json)
- Apply learnings from watchOS development

**Technical Notes:**

- Same sync protocol as watchOS (versioned messages)
- Watch is READ-ONLY for card data (consistent with watchOS). A usage-event channel (`CARD_USED`, card-opened → phone) is **ratified** for Epic 9 Story 9.6 by **ADR-2026-06-09-001** (Accepted 2026-06-09) — Wear OS mirrors it via the Wearable Data Layer (`MessageClient`/`DataClient`): same `{ id, usedAt }` payload + commutative reconciliation (`usageCount += 1`, `lastUsedAt = max`). _(Updated 2026-06-09 via correct-course; ratified 2026-06-09.)_

**Parity scope added 2026-06-09 (correct-course — mirror the watchOS Epic 9 changes):**

- Per-surface selectable sort (Frequently used / Recently added / A‑Z), persisted independently (mirror Story 9.5)
- Favourite (pin) indicator on rows (mirror Story 9.4 / C3)
- Usage-event emission for card opens (mirror Story 9.6, per ADR-2026-06-09-001 — Accepted)

**Enabling Note:** Stories 10.1–10.2 are enabling tasks required for the Wear OS experience.

---

### Story 10.1: Create Wear OS Project Structure [Enabling]

**As a** developer,
**I want** a properly structured Wear OS project,
**So that** I can build the Android watch companion app.

**Acceptance Criteria:**

**Given** the existing project
**When** I set up the Wear OS project
**Then** the `/watch-android/` folder contains a native Kotlin/Compose project
**And** the project targets Wear OS 3+ (API 30+)
**And** a README documents that this is native Kotlin (not React Native)
**And** the project builds successfully in Android Studio

---

### Story 10.2: Generate Catalogue for Wear OS [Enabling]

**As a** developer,
**I want** the Italian catalogue available as Kotlin code,
**So that** the watch app has brand data without JSON parsing at runtime.

**Acceptance Criteria:**

**Given** the `/catalogue/italy.json` file exists
**When** I run the build script `/watch-android/scripts/generate-catalogue.kts`
**Then** it generates `Brands.kt` in the generated folder
**And** the generated file contains a Kotlin data class with all brand data
**And** the generated file is in `.gitignore`
**And** the build process runs this script before compiling

---

### Story 10.3: Implement Card List (Carbon UI)

**As a** user,
**I want** to see my cards on my Wear OS watch,
**So that** I can access them from my Android wearable.

**Acceptance Criteria:**

**Given** I open myLoyaltyCards on my Wear OS watch
**When** the app launches
**Then** I see my cards in a vertical list (Carbon Utility design)
**And** the background is OLED black
**And** the list supports touch scrolling and rotary input (if available)
**And** the app launches in ≤2 seconds

---

### Story 10.4: Display Barcode on Wear OS

**As a** user,
**I want** to display a barcode on my Wear OS watch,
**So that** I can use it at checkout.

**Acceptance Criteria:**

**Given** I see my card list
**When** I tap a card
**Then** the barcode displays immediately (no confirmation)
**And** the screen shows white background with centered barcode
**And** haptic feedback confirms the tap
**And** the display works offline

---

### Story 10.5: Store Cards Locally

**As a** user,
**I want** my cards stored on my Wear OS watch,
**So that** they work without my phone.

**Acceptance Criteria:**

**Given** cards have been synced
**When** my phone is not nearby
**Then** I can still access and display all synced cards

**Technical Note:** Uses Room database for persistence.

---

### Story 10.6: Sync Cards from Phone

**As a** user,
**I want** cards to sync from my Android phone,
**So that** my watch stays up to date.

**Acceptance Criteria:**

**Given** I add a card on my phone
**When** sync occurs via Wearable Data Layer API
**Then** the card appears on my Wear OS watch
**And** edits and deletes also sync

---

## Epic 11: CI/CD & Quality Gates

**Goal:** Establish automated CI/CD pipelines and quality gates that block bad merges, build efficiently, ship iOS/watchOS/Android to TestFlight and the stores, and keep the project contribution-ready.

**Phase:** 1 · **Epic Type:** Enabling · **Dependencies:** Epic 1

### Story 11.1: Block PR on Quality Gates

**As a** maintainer, **I want** PR merges blocked when lint, typecheck, tests, or coverage fail, **So that** only quality-verified code reaches `main`.

**Acceptance Criteria:**

- CI (`ci-quality-gates.yml`) runs ESLint, TypeScript, and Jest on every PR
- Merge is blocked and a clear report is shown on GitHub when any check fails
- Minimum 80% line/statement coverage enforced via `jest.config.js` (scoped to `features/` and `core/`)
- CI + coverage badges in `README.md`; pipeline left ready for future visual-regression checks

### Story 11.2: Build on main only if app code changes

**As a** maintainer, **I want** main-branch builds to trigger only when app or native code changes, **So that** CI resources aren't wasted on docs/config/test edits.

**Acceptance Criteria:**

- Build runs only on changes in `app/`, `core/`, `features/`, `shared/`, `android/`, `ios/`
- No build on `docs/`, `config/`, `test/`, `assets/`, `scripts/`, `.github/` changes
- Native (`android/`/`ios/`) changes always trigger the build
- Path filters documented in `docs/cicd.md` and easy to update

### Story 11.3: Notify on Build Status

Consciously cancelled — GitHub shows build status natively, so dedicated Slack/email build notifications are not needed.

### Story 11.4: Rollback on Failed Deploy

Consciously cancelled — rollback does not apply to mobile app-store binaries, so a rollback strategy is not applicable.

### Story 11.5: Document CI/CD Pipeline

**As a** developer or maintainer, **I want** complete, accurate CI/CD documentation, **So that** anyone can ship to TestFlight or production without tribal knowledge.

**Acceptance Criteria:**

- Remove inaccurate claims (Slack/email notifications, rollback strategy) so every statement reflects what's implemented
- Add a Mermaid pipeline-architecture diagram covering PR gates, watchOS tests, main-branch builds, RC-tag beta releases, and release-tag store uploads (iOS, Android, watchOS)
- Include release runbooks: ship to TestFlight, release to production, and manual/ad-hoc builds
- Document watchOS CI/CD, `fastlane match` provisioning/certificates, a troubleshooting section, and a maintainable structure (TOC, "last updated", relative workflow links)

### Story 11.6: Embed watchOS App in iOS Build via @bacons/apple-targets

**As a** developer, **I want** the watchOS app embedded in the iOS archive via Expo Continuous Native Generation, **So that** one `fastlane ios beta` run produces a TestFlight build containing both apps.

**Acceptance Criteria:**

- Install and register `@bacons/apple-targets`; migrate watch source from `watch-ios/` to `targets/watch/` with an `expo-target.config.js`
- `expo prebuild --clean` regenerates an iOS project with a native `watch` target (bundle ID `com.iferoporefi.myloyaltycards.watch`) and an "Embed Watch Content" phase
- Fastlane `beta`, `adhoc`, and `upload_release` lanes sign both the iOS and watch targets (separate match + `update_code_signing_settings` calls)
- `watchos-tests.yml` and `package.json` scripts updated to the new path; old `watch-ios/` removed with no lingering references; TestFlight smoke test shows the watch companion

### Story 11.7: Open-Source Contribution Infrastructure & Story-Status Automation

**As a** maintainer and prospective contributor, **I want** accurate docs, a license, GitHub templates, and automated story-status bookkeeping, **So that** contributions follow the BMAD spec-first process and sprint tracking stays accurate automatically.

**Acceptance Criteria:**

- Rewrite `README.md` (accurate paths, tech stack, architecture) and add a BMAD-SDD-enforcing `CONTRIBUTING.md` plus an MIT `LICENSE`
- Add GitHub PR template, bug/feature/brand-catalogue issue forms with `config.yml`, and supporting labels
- On PR merge, `scripts/mark-story-done.mjs` sets the referenced story to `done` in both `sprint-status.yaml` and the story file, committed with `[skip ci]`
- CI (`pr-conventions.yml` / `check-pr-conventions.mjs`) fails PRs with non-Conventional-Commit titles, off-convention branches, or code changes lacking a story reference (docs/chore and catalogue PRs exempt)

---

## Epic 12: App-Wide Design Overhaul (Figma)

**Goal:** Produce the full Figma design system and per-screen designs that Epic 13 implements in code.

**Phase:** 2 · **Epic Type:** Design/Enabling

### Story 12.1: Design System Foundation

**As a** designer and developer, **I want** a complete design system defined in Figma with reusable tokens and components, **So that** all subsequent screen designs are consistent and developers have clear specs to implement against.

**Acceptance Criteria:**

- Color palette for light + dark modes (primary `#1A73E8` / `#4DA3FF`, surfaces, text hierarchy, semantic + interactive colors), all WCAG 2.1 AA compliant; dark mode purposefully designed on true black.
- Typography scale (11 levels, Large Title 34pt → Caption 2 11pt) with weights, line-heights, and letter-spacing for iOS (SF Pro) and watchOS (SF Compact).
- Button system (Primary/Secondary/Tertiary/Destructive) with default/pressed/disabled/loading states and 44pt minimum touch targets; the primary CTA is never washed out.
- Card component system (catalogue brand-color + logo, custom color + letter avatar), icon set (MI/MCI via `@expo/vector-icons`), form inputs, and a 7-step spacing/layout token scale.

### Story 12.1a: Source Real Brand Logos

**As a** designer, **I want** real official-quality SVG logos for all 20 Italian catalogue brands, **So that** card tiles show authentic, instantly recognizable brand identity instead of approximations.

**Acceptance Criteria:**

- Each brand's `assets/images/brands/{brand}.svg` is the real logo, sourced from official/high-quality vector sources and cleanly vectorized (not rasterized).
- Logos on transparent background, 200×200px centered canvas, in the correct color variant for the brand background (white for dark backgrounds, dark for light like Esselunga yellow / Douglas teal).
- Figma Design System AC4 cards updated to use the real logos.

### Story 12.2: Home Screen (Card List)

**As a** user opening the app, **I want** to see my loyalty cards in a visually appealing, scannable grid with real brand identities, **So that** I can quickly find and tap the card I need at checkout.

**Acceptance Criteria:**

- 2-column grid of Klarna-style brand-colored tiles (catalogue logo / custom letter avatar) with card names, scrollable, light + dark.
- Header with centered app name and clearly visible, high-contrast add and settings icons (28pt+, 44pt touch targets).
- Search bar ("Search loyalty cards") with empty and active states, shown only when multiple cards exist.
- Dedicated empty state, single-card state, and a card count + sort control ("Frequently used").

### Story 12.3: Card Detail Screen

**As a** user at checkout, **I want** to see my card's barcode large and clear with brand identity, **So that** the cashier can scan it quickly and I can manage the card easily.

**Acceptance Criteria:**

- Brand-colored hero header with logo (catalogue) or color + letter avatar (custom), brand name prominent.
- Large barcode on white background (white even in dark mode for scanner readability), spaced number, "Tap to enlarge" hint / fullscreen state.
- Card info section as clean secondary rows (barcode number with copy action, color for custom cards, date added).
- "Manage" section using icon + label + chevron rows: Edit as primary action, Delete de-emphasized and positioned last; branded nav header with back arrow.

### Story 12.4: Add Card Flow

**As a** user adding a new loyalty card, **I want** a smooth flow to pick from the catalogue, scan a barcode, or enter details manually, **So that** adding a card is fast, intuitive, and covers all scenarios.

**Acceptance Criteria:**

- Full-screen push card-type selection: searchable catalogue with "Popular cards", "All cards" (alphabetical), real logos, and an "Other card" custom option.
- Catalogue brand → scanner-first flow; barcode format auto-detected and never shown to the user.
- Full-bleed camera scanner with brand context and an "Enter card number manually" alternative; card auto-added on detection.
- Card setup (pre-filled number for catalogue; store name + inline scan CTA + color picker for custom), confirmed by a home-screen toast + highlighted new card (no dedicated success screen).

### Story 12.5: Auth Screens

**As a** user creating an account or signing in, **I want** clear, trustworthy auth screens with obvious CTAs, **So that** I feel confident providing my credentials and can complete the flow without confusion.

**Acceptance Criteria:**

- Sign Up screen: app icon, email field with validation, password field with show/hide toggle + strength indicator, bold "Create Account" CTA, and a sign-in link.
- Sign In screen: "Welcome Back", email/password fields, "Forgot password?", human-readable error banner + red field borders.
- Password reset flow with instruction copy, "Send Reset Link", and a "Check your email" confirmation screen.
- Guest mode upgrade banner (home screen) framed as an invitation, plus consistent inline/form-level validation states; all icons MI/MCI (DEC-12.5-004), light + dark.

### Story 12.6: Settings Screen

**As a** user managing my app preferences, **I want** a well-organized, visually clear settings screen with discoverable options, **So that** I can customize the app and manage my account without hunting for hidden options.

**Acceptance Criteria:**

- Account section (signed-in: email, status, Sign Out, de-emphasized Delete Account; guest: indicator + Create Account / Sign In CTAs).
- Preferences (Theme Light/Dark/System, Language) and Data section (Export/Import JSON, sync status) using icon + label + value/chevron rows.
- About section (app version, catalogue version, visible Help & FAQ, Privacy Policy) at the bottom.
- Grouped, scrollable layout with dedicated frames for every sub-screen, confirmation bottom sheet, and error/empty state (light + dark).

### Story 12.7: Onboarding Flow

**As a** first-time user, **I want** a welcoming, engaging onboarding experience, **So that** I understand the app's value and can add my first card with confidence.

**Acceptance Criteria:**

- Welcome screen with app icon, value proposition, fanned-card illustration, "Get Started" CTA, and an "I already have an account" sign-in link (no device detection — DEC-12.7-004).
- Outcome-based mode selection ("Keep cards on this device" recommended vs "Sync across all devices"), replacing "guest mode" language (DEC-12.7-001/002), with a "What's the difference?" info tooltip.
- Three swipeable feature highlights (including "Your data, your rules") with Skip affordance and bottom-pinned CTAs.
- First-card guidance screen transitioning into the Add Card flow; all screens use 12-1 design system, light + dark.

### Story 12.8: Sync & Status Indicators

**As a** signed-in user with cloud sync enabled, **I want** clear, non-intrusive sync status indicators, **So that** I know my cards are backed up and can trust the sync state.

**Acceptance Criteria:**

- Non-blocking inline "Syncing..." strip above the card grid and a brief auto-dismissing success confirmation.
- Actionable inline error banner with Retry + dismiss using semantic error colors (not a modal).
- Reassuring offline strip ("Offline • N changes will sync when online"), informational rather than alarming.
- Calm conflict-resolution dialog with side-by-side local-vs-cloud comparison and Keep local / Keep cloud / Keep both choices; light + dark.

### Story 12.9: Apple Watch Screens

**As an** Apple Watch user, **I want** my loyalty cards in a clear, glanceable format optimized for the small screen, **So that** I can show my barcode at checkout without pulling out my phone.

**Acceptance Criteria:**

- Scrollable card list with small brand logo + name, brand-color accents (catalogue) / color + letter avatar (custom), sorted by frequency/recency.
- Barcode display maximized to screen width on white background, with brand context header and boosted brightness for scanner readability.
- Watch-adapted brand identity consistent with the phone app, readable at arm's length.
- Complication variants (small: app/most-used card icon; medium: most-used card + name) following watchOS guidelines; designed for 41mm/45mm/49mm using SF Compact.

### Story 12.IC: Update Icon References in Story Docs 12-1 through 12-4

_Tracker key: `12-icon-doc-cleanup` (non-numeric `IC` identifier — does not derive from the title; keep in sync manually)._

**As a** developer preparing to implement Epic 13, **I want** Epic 12 story docs 12-1 through 12-4 to reference the correct MI/MCI icon system, **So that** implementation specs are accurate and I don't build against stale legacy-icon references.

**Acceptance Criteria:**

- All legacy icon-family references in 12-1, 12-2, 12-3, 12-4 replaced with MI/MCI equivalents per the agreed mapping table.
- Import pattern updated to `import { MaterialIcons } from '@expo/vector-icons'` and `import { MaterialCommunityIcons } from '@expo/vector-icons'`.
- Grep for the legacy cleanup pattern across all `12-*.md` returns zero matches.

### Story 12.FI: Update Figma Design System Page — Icon Section

_Tracker key: `12-figma-icon-update` (non-numeric `FI` identifier — does not derive from the title; keep in sync manually)._

**As a** developer implementing Epic 13, **I want** the Figma design system page to show MI/MCI icons instead of the legacy icon family, **So that** the design source of truth matches the implementation icon system.

**Acceptance Criteria:**

- Legacy icon section on the Design System page replaced with MI/MCI vector shapes; labels match `@expo/vector-icons` names exactly.
- Icon section includes the complete inventory used across stories 12-1 through 12-9, visually consistent with the 12-5+ pages.
- `MI: star` and `MI: error-outline` clearly visible with AA contrast in both light and dark; no remaining legacy/`FA:` labels anywhere in the file.

---

## Epic 13: UI Implementation

**Goal:** Implement the Figma designs in code across every screen; absorbs Epic 8 (Settings) via Story 13.6.

**Phase:** 2 · **Epic Type:** Feature/Implementation

### Story 13.1: Implement Design System Tokens & Components

**As a** user of myLoyaltyCards, **I want** the app's visual foundation to match the approved Figma designs, **So that** every screen has consistent, polished colors, typography, spacing, and component styles.

**Acceptance Criteria:**

- Replace the sage-green palette with the new light/dark color tokens (primary `#1A73E8` / `#4DA3FF`), add brand-color lookup from `italy.json`, wire into Tailwind, with WCAG AA maintained.
- Implement the 11-level typography scale and spacing/layout tokens matching Figma.
- Build reusable shared UI components in `shared/components/ui/` (Button, CardShell, TextField, ToggleSwitch, ColorPicker, ActionRow) with dark variants and unit tests.
- Establish the MI/MCI icon pattern, update ThemeProvider backward-compatibly, and keep all tests passing at the 80% coverage threshold.

### Story 13.2: Restyle Home Screen (Card List)

**As a** user opening myLoyaltyCards, **I want** my cards in a polished 2-column grid with real brand logos on brand-colored tiles, **So that** I can quickly find and tap the card I need at checkout speed.

**Acceptance Criteria:**

- Fixed 2-column grid of 171×140pt brand-colored tiles (catalogue logo / custom letter avatar) with names, drop shadows, and dark-mode borders on black brands.
- Redesigned header with MI add/settings icons (centered title, 44pt targets) and a real-time search bar shown when 2+ cards exist.
- Dedicated empty state (wallet illustration + shared Button CTA) and enlarged centered single-card state.
- Sort/filter controls (card count + persisted "Frequently used"/"Recently added"/"A-Z"), full dark-mode + accessibility compliance, tests passing.

### Story 13.3: Restyle Card Detail Screen

**As a** user viewing my loyalty card at checkout, **I want** a branded hero, a large clear barcode, and clean management actions, **So that** I can quickly scan my card and easily manage it.

**Acceptance Criteria:**

- Brand hero (catalogue color + logo / custom color + letter avatar) and a large barcode on a white background (white even in dark mode) with spaced number and enlarge hint.
- Secondary info section (barcode number + copy, color for custom only, date added; format row removed) and a "Manage" section with ActionRow Edit + de-emphasized destructive Delete.
- Branded condensing nav header, fullscreen barcode overlay with close + brightness hint, and a brightness hint on the detail screen.
- Legacy `SAGE_COLORS`/emoji cleanup, full dark-mode support, tests passing at threshold.

### Story 13.4: Restyle Add Card Flow

**As a** user adding a new loyalty card, **I want** the add-card flow to feel polished, fast, and consistent with the redesigned app, **So that** picking a brand, scanning a barcode, or entering details manually is intuitive.

**Acceptance Criteria:**

- Full-screen push card-type selection with search, Popular/All cards sections (real logo circles), and an "Other card" option.
- Scanner-first flow for all paths: full-bleed camera with floating back button + brand pill, "Enter manually" ActionRow, barcode format auto-detected and hidden.
- Card setup screens — catalogue (pre-filled number) and custom (store name + inline scan CTA + 8-color picker) — with a "Done" primary button.
- Home toast + fading green highlight confirmation (no success screen), full dark-mode parity, accessibility, and 80% test coverage.

### Story 13.5: Restyle Auth Screens

**As a** user creating an account, signing in, or resetting my password, **I want** the auth screens to feel polished, trustworthy, and visually consistent, **So that** I feel confident providing my credentials and can complete every auth flow without confusion.

**Acceptance Criteria:**

- Restyle Sign Up (app icon, TextField email, PasswordInput + strength indicator, primary CTA), Sign In ("Welcome Back", error banner + red borders, forgot-password link), and password reset + confirmation screens.
- Add a home-screen Guest Mode Banner (shield icon, "Protect your cards", Create Account / Sign In, dismiss persisted) per DEC-12.5-001.
- Inline + form-level validation with human-readable Supabase error mapping; MI/MCI icons only; no auth logic changes.
- Full dark-mode parity (14 frames), accessibility, and co-located tests at 80% coverage.

### Story 13.6: Implement Settings Screen (Absorbs Epic 8)

**As a** user managing my app preferences and account, **I want** a polished settings screen with theme, language, data export, sync, and account management, **So that** I can customize my experience and manage my account from one unified location.

**Acceptance Criteria:**

- Sectioned, scrollable screen (Account, Preferences, Data Management, About) built on ActionRow/Button/BottomSheet, with signed-in and guest account variants.
- Theme picker (Light/Dark/System, persisted, ThemeProvider override) and language picker via bottom sheets.
- Export Data as JSON (confirmation + empty-state sheets, share sheet), Import entry-point scaffold (full flow deferred to 13-7a), and a manual sync trigger with relative timestamp.
- Sign Out and multi-step Delete Account confirmation bottom sheets (inverted destructive CTA order), replacing `Alert.alert`/`Modal`; dark mode, accessibility, and tests.

### Story 13.7: Restyle Onboarding Flow

**As a** first-time user, **I want** a polished, visually engaging onboarding with clear outcome-based storage choices, **So that** I understand the app's value, feel confident about privacy, and can add my first card within seconds.

**Acceptance Criteria:**

- Restyled welcome screen (branded icon, fanned-card illustration, "Get Started", sign-in link — no device detection).
- Mode selection with outcome-based options ("Keep cards on this device" recommended vs "Sync across all devices"), a "What's the difference?" info tooltip, and internal guest-mode mapping (no "guest" label in UI).
- Three swipeable feature highlights with Skip and bottom-pinned CTAs, plus a first-card guidance screen leading into the Add Card flow.
- Full navigation wiring, dark-mode parity, accessibility, and 80% test coverage.

### Story 13.7a: Import Data from JSON

**As a** user who previously exported my card data, **I want** to import cards from a JSON file, **So that** I can restore my data on a new device or recover from data loss without re-entering every card.

**Acceptance Criteria:**

- Import entry point in Settings Data Management triggers the system document picker filtered to JSON.
- Valid file → preview bottom sheet (file name, card count, duplicate note) with Cancel/Import; successful import inserts via transaction, skips duplicates (barcode + brandId), and triggers cloud sync when signed in.
- Invalid/empty file → clear error/empty bottom sheets with no data modified; Zod schema validation with partial-import reporting of skipped entries.
- All new and existing tests pass at the 80% coverage threshold.

### Story 13.7b: Fix Onboarding Welcome Redirect Loop for Account Users

**As a** user who creates an account or signs in, **I want** the app to open straight to my card list every time, **So that** I am not repeatedly thrown back to the welcome/onboarding screen on every launch.

**Acceptance Criteria:**

- On cold start, a user with a persisted Supabase session always lands on the card list (never `/welcome`), across all account/sign-in/restored-session paths; the `first_launch` flag is cleared for signed-in users.
- Genuinely new signed-out users still see welcome; the session check resolves during boot with no wrong-screen flash.
- Remove dead onboarding code (unrouted `FirstCardGuidanceScreen`, `useOnboardingFlow`, stale exports, orphaned i18n keys).
- Regression test `welcome-redirect.test.tsx` added; suite, typecheck, and lint pass.

### Story 13.8: Restyle Sync & Status Indicators

**As a** user who syncs loyalty cards across devices, **I want** polished non-intrusive sync indicators, a clear offline reassurance strip, and a calm conflict dialog, **So that** I always understand my data's sync state without being alarmed or blocked.

**Acceptance Criteria:**

- Restyle the syncing-active strip (animated glyph, tokens) and add an auto-dismissing success strip, both above the card grid.
- Restyle the inline error banner (semantic tokens, Retry + dismiss) and the offline strip (neutral reassurance, shown only when offline with pending changes).
- New conflict-resolution modal with side-by-side local/cloud comparison cards and Keep local / Keep cloud / Keep both / Decide later actions.
- Strip priority orchestration (error > syncing > offline > success), zero hardcoded colors, accessibility, and co-located tests at threshold.

### Story 13.9: Update Apple Watch UI

**As an** Apple Watch user, **I want** the watch app to match the new design language from Story 12-9, **So that** I can find and display my loyalty card barcode quickly and confidently at checkout.

**Acceptance Criteria:**

- Native Swift/SwiftUI restyle of the card list (OLED-black, brand-color accents, SF Compact, usage/recency sort) and barcode display (maximized width, white background, brand header).
- Full hex color parsing with contrast/black-brand handling, restyled empty state, and adaptive layout across 41mm/45mm/49mm.
- WidgetKit complication support (small: app icon; medium: most-used card) with timeline reload and graceful no-cards fallback.
- Performance targets (launch and card→barcode under budget), accessibility labels, and passing unit/UI tests.

### Story 13.10: Fix Dark Mode System Preference

**As a** user who has configured my phone to use dark mode, **I want** the app to honour my system preference automatically, **So that** the app looks native instead of always showing a bright white interface.

**Acceptance Criteria:**

- Add `darkMode: 'media'` to `tailwind.config.js` so NativeWind `dark:` classes activate with system preference, with no light-mode regressions.
- Fix the pre-ThemeProvider loading screen to use a mode-independent brand token instead of `LIGHT_THEME.primary`.
- ThemeProvider is the single source of truth: `'system'` resolves to and reacts to the device scheme at runtime; explicit `'light'`/`'dark'` overrides win and sync into NativeWind.
- ThemeProvider tests updated, including `dark:` class activation coverage; all existing tests pass.

---

## Epic 14: Household Collaboration

Let users share loyalty cards and shopping lists within a household, building on the cloud-sync foundation.

Epic 14 evolves myLoyaltyCards from a single-user loyalty card manager into a lightweight collaborative tool, split into two phases. Phase A ships single-user features that work fully in local mode with no account (card sharing via deeplink, a local shopping list). Phase B adds the cloud household layer (membership, household card visibility, shopping list sync) as an additive experience that never gates the single-user flows. Bill splitting is explicitly descoped and may return as its own epic. Story 14.5a is a UX-design prerequisite that gates 14.5.

> **Scope change, 2026-08-02:** Story 14.2 (card sharing via deeplink) is **absorbed into [Epic 18: Card Sharing & Web Handoff](#epic-18-card-sharing--web-handoff)** and is not delivered here. Its custom-scheme-only design does nothing for a recipient without the app installed, and Epic 18 replaces it with an HTTPS link plus a web fallback that renders the barcode. Epic 14 retains the household and shopping-list scope. The 14.2 specification below is kept for history, not for implementation.

### Story 14.1: Household Collaboration — Epic Scoping & Discovery

**As a** product owner, **I want** to define and align on the scoped Epic 14 plan covering card sharing, shopping list, and the household layer, **So that** the team has clear phases, resolved caveats, and ready-to-refine stories before any implementation begins.

**Acceptance Criteria:**

- Team has reviewed and aligned on the Phase A / Phase B split and the story map (14-1 through 14-6).
- PRD updated to reflect the revised Epic 14 scope (Phase A + Phase B; bill splitting explicitly descoped).
- Sprint backlog contains Epic 14 with stories 14-2 through 14-6 estimated and prioritised.
- All Phase A caveats (deeplink payload design, SQLite schema, local-to-cloud migration path) captured and assigned to stories.
- All Phase B caveats (privacy rules, household ownership transfer, invite token, GDPR) captured and assigned to stories.
- Deeplink HTTPS-fallback decision recorded: silent failure accepted; a "Copy card code" plain-text fallback is included in the share sheet.

### Story 14.2: Card Sharing via Deeplink — SUPERSEDED by Epic 18

> **Not for implementation.** Absorbed into Epic 18 on 2026-08-02 (`absorbed-into-epic-18`). Retained verbatim below so the reasoning that led to Epic 18 stays legible. Epic 18 keeps the versioned-payload and duplicate-detection ideas from these criteria and replaces the custom-scheme-only transport.

**As a** user, **I want** to share a loyalty card with someone via a link, **So that** they can add it to their own myLoyaltyCards app without scanning the card manually.

**Acceptance Criteria:**

- Tapping "Share card" on a card detail screen opens the native share sheet with the deeplink URL and a "Copy card code" plain-text option.
- The deeplink URL encodes the card payload as base64 JSON following the versioned schema (`v`, `name`, `barcodeValue`, `barcodeFormat`, `brandId?`, `color?`); image data is never included and the payload stays under ~800 bytes.
- Opening the deeplink while the app is already running navigates to the card import preview screen.
- Opening the deeplink from a cold start (app closed) navigates to the card import preview screen after launch.
- The import preview screen shows the card name, barcode value, and brand logo (resolved from the catalogue by `brandId`) before saving.
- Tapping "Add to my cards" creates the card in local storage and navigates to the card detail or list.
- If the recipient already has a card with the same `barcodeValue`, a conflict UI is shown; a duplicate is only created on explicit confirmation.
- A malformed, truncated, or tampered payload shows a user-facing error ("This link is invalid or expired") and never crashes; unknown `barcodeFormat` values are rejected.
- The feature works in both local mode (no account) and cloud mode, with no auth check on import.
- The "Copy card code" fallback copies the raw base64 payload to the clipboard with a toast confirmation.
- `myloyaltycards://` deeplink routing is validated end-to-end on a real iOS device (cold start and in-app) before refinement; Android `intentFilters` and `assetlinks.json` provisioning are confirmed.

### Story 14.3: Shopping List — Single User

**As a** user, **I want** a simple shopping list I can add items to and tick off, **So that** I can plan my shopping alongside my loyalty cards in one app.

**Acceptance Criteria:**

- A shopping list screen is accessible from the main app navigation.
- The screen shows an input field and "Add" button at the top, with the item list below.
- Adding an item prepends it to the top of the list; duplicate item names are allowed.
- Tapping an item toggles its ticked state, shown via strikethrough or check state; ticked items stay visible until deleted.
- Swiping an item left reveals a delete action; confirming removes it.
- The list persists across app restarts, stored in `expo-sqlite`.
- Empty state: a friendly message is shown when no items exist (no blank screen).
- Item name is limited to 100 characters; input prevents exceeding the limit.
- The schema uses UUID primary keys plus nullable `household_id`, `synced_at`, and timestamp columns so it is forward-compatible with Phase B cloud sync without a destructive migration.
- The feature works in both local mode (no account) and cloud mode.
- When a local-mode user upgrades to a cloud account, shopping list items migrate via the existing guest-migration pattern (`core/auth/guest-migration.ts`).
- The shopping list is out of scope for the watch app in Phase A.

### Story 14.4: Household Membership

**As a** signed-in user, **I want** to create or join a household, **So that** I can share cards and shopping lists with the people I live with.

**Acceptance Criteria:**

- Household entry points (create / join) are hidden in local mode; a "Create an account to use household features" prompt is shown instead.
- A signed-in user can create a named household and becomes its owner.
- The owner can generate an invite link containing a cryptographically random, opaque, single-use token, shareable via the native share sheet.
- Invite tokens expire after 48 hours; an expired token shows an "Invite link expired" error.
- A used token cannot be reused; a second join attempt shows an error.
- Membership is capped at 6 (owner + 5), enforced server-side in the join Edge Function; joining a full household shows a "Household is full" error.
- A member can leave a household; their membership row is deleted without affecting other members.
- The household screen lists current members with their roles (`owner` | `member`; no guest tier).
- When an owner initiates account deletion and the household has other members: prompt 1 (nominate a successor) blocks deletion until a member is selected; prompt 2 (shared card disposition — transfer to nominee or remove from household) must be completed before deletion proceeds. Personal cards are deleted with the account (GDPR), with no per-card prompting.
- If the owner's household has no other members, account deletion dissolves the household silently with no prompts.
- All household operations (create, invite, join, leave) are reflected in the UI without a manual refresh.
- Informed GDPR consent is shown at join time, and a leaving member can delete their contributed data without breaking the household for others.

### Story 14.5a: Household Cards UX Design

**As a** UX designer, **I want** to define the placement, layout, and interaction patterns for household cards in the card list, **So that** the implementation team has a clear, approved design before building story 14-5.

**Acceptance Criteria:**

- Wireframes or Figma screens cover: the card list with household cards present, the empty household-cards state, and the household card detail view a non-owner sees.
- All six open design questions are explicitly answered in the design or its annotations: placement (inline vs separate tab), visual treatment, empty state, owner attribution, actions available to a non-owner, and behaviour when a card is unshared mid-session.
- The visual treatment for household cards is consistent with the existing design system and NativeWind styling conventions.
- The design is reviewed and approved by Ifero before story 14-5 moves to refinement (this story blocks 14-5).
- The approved design is linked from story 14-5 and stored in `docs/ux-designs/` or the Figma file.

### Story 14.5: Household Card Sharing

**As a** household member, **I want** to share a loyalty card with my household, **So that** other members can use it when they shop.

**Acceptance Criteria:**

- A "Visible to household" toggle is shown on the card detail screen for signed-in household members, and hidden in local mode or when the user has no household.
- Card sharing is explicit opt-in per card (private by default); enabling the toggle immediately marks the card household-visible with no extra confirmation, and disabling it immediately removes visibility.
- Only the card owner can toggle their own card; a member cannot change the visibility of another member's card.
- Household members see shared cards in a distinct "Household cards" section or tab, separate from their own cards, using the shared card component.
- Each household-visible card shows the owner's name or avatar as an attribution badge.
- When a member who shared cards leaves the household, their shared cards are removed from the household view for all remaining members.
- Household card changes (share, unshare, member departure) are reflected without a manual refresh (within the Realtime/sync cycle).
- Cards shared to the household are not duplicated on members' devices; they render from a server-side snapshot (`name`, `barcode_value`, `barcode_format`, `brand_id`, `color`) stored alongside the visibility row, updated when the owner edits the card.
- This mechanism coexists with the Phase A deeplink share (14-2) without interfering with it.
- Storage uses a `household_card_visibility` table with RLS scoped to household membership: readable by any member, insertable/deletable only by the card owner.

### Story 14.6: Household Shopping List Sync

**As a** household member, **I want** my shopping list to sync with my household, **So that** anyone in the household can add, tick, or remove items and we all see the same list.

**Acceptance Criteria:**

- When a member adds an item, it appears on all other members' lists within the sync cycle.
- When a member ticks an item, the ticked state is reflected for all other members within the sync cycle.
- When a member deletes an item, it is removed from all members' lists within the sync cycle.
- Offline: a member can add, tick, and delete items while offline; changes are queued locally (`pending_sync` flag) and flushed when connectivity is restored.
- Concurrent offline edits: if two members add items offline and both sync, both items appear for everyone (duplicates acceptable — no data lost).
- Concurrent tick conflicts resolve deterministically via last-write-wins on `updated_at`, with no error shown to the user.
- A member who leaves the household retains their local list state but no longer sends or receives sync updates; a removed member loses sync access without a crash or error loop.
- A subtle pending-sync indicator is shown while items are unsynced and cleared once sync completes.
- Local-mode users are unaffected: their personal shopping list continues to work and household sync simply does not activate.
- The Phase A SQLite schema (UUID keys, nullable `household_id`, timestamps) is extended additively (`pending_sync`) with no destructive migration; sync uses a Supabase Realtime channel per household plus foreground polling against `household_shopping_list_items` with RLS scoped to current members.
- The watch app is out of scope for this story.

---

## Epic 15: Internationalisation & Public Presence

**Goal:** Reach a wider audience — a public landing page and full Italian localisation of the app and watch.

**Phase:** 1 · **Epic Type:** User-Facing · **Dependencies:** Epic 1

### Story 15.1: GitHub Pages Landing Page (EN + IT)

**As a** developer or potential user discovering myLoyaltyCards, **I want** a polished landing page at `ifero.github.io/myLoyaltyCards`, **So that** I can understand the app, see its features, and find the store links.

**Acceptance Criteria:**

- Pure HTML/CSS page served from `docs/` (`index.html` + `style.css`), no frameworks, build tools, or CDN dependencies
- Locked section order: Header, Hero, Features (2×2), How it works, Screenshots, Footer — with official App Store / Google Play badges as the hero CTAs showing bilingual "Coming soon" alerts
- Accessible EN/IT language toggle: `navigator.language` default detection, `localStorage` persistence, English-first raw HTML, and assistive-tech-safe inactive-language hiding
- Responsive light/dark design via CSS variables (44px touch targets, no horizontal scroll), replaceable screenshot placeholders, OG/meta tags, and Ifero-approved Italian copy

### Story 15.2: Italian Language In-App

**As an** Italian user, **I want** the app UI available in Italian, **So that** I can use the product in my native language with consistent localized copy.

**Acceptance Criteria:**

- Italian translations for all visible UI strings across the main flows (home, add card, auth, settings, card details)
- Users can switch to or auto-detect Italian without UI breakage, with a persisted `system | en | it` preference in Settings
- No hard-coded English strings remain in translated screens; Italian copy reviewed against the English source
- Localization built on a consistent i18n implementation (`i18next` / `react-i18next` / `expo-localization`) with translation files (`shared/i18n/locales/en.ts`, `it.ts`) in source control plus regression tests

---

## Epic 16: Platform & Tech Debt

**Goal:** A durable home for cross-cutting platform, foundation, and tech-debt work that doesn't map to a feature epic. A standing bucket that accumulates stories over time.

**Phase:** 2 · **Epic Type:** Enabling / Tech-Debt

### Story 16.1: Migrate Styling Engine — NativeWind → Unistyles [Enabling]

**As a** developer maintaining myLoyaltyCards, **I want** to replace NativeWind (Tailwind) with react-native-unistyles as the styling engine, **So that** styling is faster (no React re-render on theme/breakpoint changes), type-safe, and unified with the existing `shared/theme` token system — with zero visual regression for users.

**Acceptance Criteria:**

- `react-native-unistyles` v3.x (+ Nitro/edge-to-edge native deps) is installed and configured, with light + dark themes registered via `StyleSheet.configure` sourced from the existing `shared/theme/` tokens.
- `shared/theme/` remains the single source of truth — Unistyles themes are derived from it, not duplicated — and system/in-app theme switching (Story 13-10) is preserved.
- All 31 `className`-using files are migrated to Unistyles `StyleSheet.create`; NativeWind + Tailwind deps and config files (`tailwind.config.js`, `global.css`, `nativewind-env.d.ts`) are fully removed.
- Zero visual regression (value-level pixel/colour parity) and green gates: full suite, coverage ≥ 80%, `tsc` + ESLint clean.

### Story 16.2: Implement logger/Sentry wrapper and migrate console.\* call sites

**As a** maintainer, **I want** a single logging wrapper that gates debug output on `__DEV__` and routes errors to Sentry in production, **So that** production error reporting actually fires and logging is consistent across the codebase.

**Acceptance Criteria:**

- `core/utils/logger.ts` keeps its `info`/`warn`/`error` API: `info`/`warn` are `__DEV__`-gated; `error` always logs and, in production, calls `Sentry.captureException`.
- Sentry is installed and initialised per environment with a `beforeSend` PII/card-data scrub (GDPR) so no PII leaves the device.
- All ~30 `console.*` call sites across `features/`, `core/`, `shared/`, `app/` (incl. `consent-logger.ts`) are migrated to the wrapper.
- An ESLint `no-console` rule (wrapper-allowed) enforces the convention; lint/typecheck/test all pass with coverage maintained.

### Story 16.3: Establish a design-in-code contribution workflow (docs + GitHub scaffolding)

**As a** maintainer of an open-source project, **I want** a documented, PR-based path for anyone to propose UX/UI changes against the git repo, **So that** design contributors aren't gated behind Figma seats and every design change is versioned and reviewed like code.

**Acceptance Criteria:**

- A new `docs/design/CONTRIBUTING-DESIGN.md` documents the three design layers (tokens / components / flows), the per-layer PR path, and a story-vs-no-story decision table (token/visual polish → `design`-label fast-path; new screen/component/behavior → spec-first story).
- A `design` issue template and PR-template updates exist (Storybook/Chromatic preview option with a native-watch-UI screenshot carve-out); `CONTRIBUTING.md` gains a Design/UI pointer.
- A `design` PR label is created and `scripts/check-pr-conventions.mjs` is extended so `design`-labelled PRs are story-exempt (no new Conventional-Commit type introduced).
- The two hardcoded Figma node-ID comments are re-anchored to the repo as canonical, and `docs/design/` is established as the home for versionable diagram sources.

### Story 16.4: Make design tokens a portable DTCG source via Style Dictionary

**As a** design contributor, **I want** the design tokens available in a portable, human-diffable JSON format that generates the existing TypeScript, **So that** token changes are easy to review in a PR and the tokens are portable to other tools (Figma Tokens, Penpot) — without breaking the app.

**Acceptance Criteria:**

- `tokens/*.json` (DTCG format) author the primitive + semantic color/spacing/layout maps (MVP; typography tuple + sync-tokens deferred).
- A Style Dictionary config generates a committed `shared/theme/tokens.generated.ts` with the exact existing constant names and `as const` shapes (no build step for Metro/Jest/tsc).
- `colors.ts`/`spacing.ts` import the generated primitives while keeping derived/runtime exports hand-authored; all public `@/shared/theme` exports stay byte-stable.
- `tokens:build`/`tokens:check` scripts exist with a CI drift guard; typecheck + tests pass and the WCAG contrast canary stays green.

### Story 16.5: Component preview gallery — Storybook + Chromatic [Blocked by 16-1]

**As a** reviewer or design contributor, **I want** a public component gallery with visual-regression review on every PR, **So that** UI/design changes are reviewable without building the app locally or holding a Figma seat.

**Acceptance Criteria:**

- A web Storybook (`react-native-web-vite`) renders the 7 `shared/components/ui` primitives in light and dark via a real-`ThemeProvider` decorator (built against Unistyles, after 16-1).
- Stories exist for all 7 primitives; `storybook`/`build-storybook`/`chromatic` scripts are added.
- A separate, path-filtered `chromatic.yml` publishes per-PR previews + visual diffs using `onlyChanged`/TurboSnap, kept off the merge critical path (no-ops until the human Chromatic-token prereq is met).
- An ESLint override for `*.stories.tsx` keeps `yarn lint` green.

### Story 16.6: Stand up an open Penpot design space for visual designers

**As a** maintainer who wants non-coding visual designers to contribute, **I want** an open, no-seat-limit Penpot instance set up as a shared design space, **So that** designers can explore and propose UI/UX visually without a Figma seat — while the git repo (tokens + Storybook components) remains the single canonical source of truth.

**Acceptance Criteria:**

- The cloud-vs-self-host decision is made and recorded (ADR-style note or a section in `docs/design/CONTRIBUTING-DESIGN.md`); default recommendation is Penpot cloud (zero-ops, no seat cost).
- An open, no-seat-limit Penpot workspace exists with access open to contributors (open team / invite link, or open registration if self-hosted).
- The repo-is-canonical relationship is documented in `docs/design/CONTRIBUTING-DESIGN.md`, including a one-line "how to take a Penpot exploration to a repo PR" path, and the Figma deprecation note is updated to point at Penpot as the open exploration surface.
- The current palette/typography/spacing from `shared/theme/*.ts` are represented in Penpot as a lightweight starter reference (manual/one-off — no automated token sync).
- No change to the canonical pipeline: tokens, Storybook, and `docs/ux-designs/` remain the source of truth; nothing in the app build depends on Penpot.
- Demand-triggered: work starts only when a real visual (non-coding) designer actually wants to contribute — not speculatively.

### Story 16.7: Fix Android beta (alpha) Play upload — authoritative versionCode through Expo prebuild

**As a** maintainer/release engineer, **I want** the Android RC build to upload to Google Play with a correct, monotonically-incrementing versionCode (and to be signed with the real upload key), **So that** the beta (alpha-track) upload stops failing with "Version code 1 has already been used" and RC builds reliably reach testers.

**Acceptance Criteria:**

- An Android RC upload succeeds without the "Version code N has already been used" error — the AAB manifest versionCode is strictly greater than the highest code across all Play tracks.
- The versionCode is set in a prebuild-safe way (a new `app.config.ts` extending `app.json`, sourced from `GITHUB_RUN_NUMBER`), never by editing gitignored native files; the production lane uses a distinct offset band (`+1_000_000`) to avoid cross-workflow collision, and the same fix is applied there.
- The release build is signed with the real upload key, not the debug-keystore fallback (a signing-env guard / prebuild-safe `release` signingConfig removes the unguarded fallback).
- `docs/cicd.md` is corrected to reflect the actual alpha track, and the built AAB's versionCode is verified before upload.

### Story 16.8: Fix cloud sync failure on cold app open (auth/network readiness race)

**As a** signed-in user, **I want** cloud sync to reliably run when I open the app — and to recover on its own if the first attempt hits a cold-start hiccup, **So that** my cards sync on every open instead of failing until I manually pull-to-refresh.

**Acceptance Criteria:**

- Root cause: the `useCloudSync` auto-trigger latch (`autoTriggeredRef`) is set only after a successful sync, so a failed first attempt no longer permanently suppresses auto-sync — it re-attempts on the next auth/network event.
- A transient first cold-start failure auto-retries and recovers (reaching the same healthy state a manual pull-to-refresh reaches) with no manual action.
- The auto-trigger fires only once the session is restored and the network is confirmed reachable (not on the optimistic default), and transient failures are retried with backoff before surfacing the error banner.
- Guest-mode (no auto-sync) and manual `forceSync` behaviour are preserved; tests cover latch-on-success, auto-recovery, and auth+network gating, with gates green.

### Story 16.9: Relocate screens from the app/ routing layer into features/

**As a** maintainer of myLoyaltyCards, **I want** every screen implementation (and its tests) moved out of the `app/` routing layer into the correct `features/` module, with the documented-but-missing route-file lint rule implemented, **So that** `app/` stays a thin, enforceably re-export-only routing boundary and this debt cannot silently recur.

**Acceptance Criteria:**

- The four fat screens (`HomeScreen`, `CardDetailScreen`, `CardEditScreen`, `BarcodeScreen`) are moved verbatim into a new `features/cards/screens/`, and their route files become thin re-exports.
- A documented `cards → auth` boundary exception and the route-file `no-restricted-imports` rule (banning `useState`/`useEffect`/`useCallback`/`useMemo` in `app/**/*.tsx` except `_layout.tsx`) are added to `eslint.config.mjs`, with `yarn lint` green as the migration's done-signal.
- `app/scan.tsx` is refactored to a hook-free declarative `<Redirect>`; `app/__tests__/` is removed with its tests relocated/co-located (no `__tests__` folder introduced).
- Green gates, zero behavioral/visual regression; coverage restored to ≥ 80% via co-located screen tests.

### Story 16.10: Fix offline cold-start hang (app stuck on the loading spinner with no connectivity)

**As a** user opening the app with no internet connection, **I want** the app to boot into my cached cards instead of hanging on the loading spinner, **So that** the "offline-first" promise actually holds — my loyalty cards are usable in a shop with no signal.

**Acceptance Criteria:**

- Offline cold-start reaches the main UI with cached cards within a bounded time and never hangs — no blocking network call gates `isReady` (auth state is derived storage-only, no network round-trip).
- Signed-in users (online or offline, incl. an expired-but-persisted token) are not flashed/bounced to the welcome screen — auth state is known before first paint.
- When connectivity returns, the session recovers via background auto-refresh / `onAuthStateChange` (no restart); the Expo update check is bounded so it can't stall boot.
- A defensive safety timeout guarantees `isReady` flips to a safe default even if the auth listener never fires; tests cover offline boot, no-flash, recovery, and the timeout, with gates green.

### Story 16.11: Fix card-deletion cloud resurrection (deletion-aware cloud sync)

**As a** signed-in user who deletes a loyalty card, **I want** the deletion to persist through cloud sync, **So that** deleted cards never reappear on the next cold open or pull-to-refresh.

**Acceptance Criteria:**

- Root cause: the download path is made deletion-aware by reviving the previously-dead `mergeWithDeletions`, so a pending-deletion card is not re-added locally on cold-open auto-sync or pull-to-refresh.
- Drained cloud deletions are removed from the cloud via `deleteCardFromCloud`; on success their ids are cleared from the queue (targeted, per-id), and on failure they are retained for retry while the local merge still excludes them.
- Back-compatible by construction (`mergeWithDeletions(local, cloud, [])` ≡ `mergeCards`); guest mode and 16-8's singleton store (latch, dedup, force semantics, cooldown) are preserved.
- Both sync engines are unified on the deletion-aware merge (closing the Engine B blind-clear race); a real-SQLite regression test proves no resurrection, with gates green and coverage ≥ 80%.

### Story 16.12: Bound the OTA update download at boot so a stalled fetch can't hang the app

**As a** user launching the app on a poor/flaky connection while an OTA update is available, **I want** the app to boot within a bounded time even if the update download stalls, **So that** a degraded network can never leave me stuck on the loading spinner.

**Acceptance Criteria:**

- `Updates.fetchUpdateAsync()` is bounded by a separate generous budget (`UPDATE_FETCH_TIMEOUT_MS`, 30s) via `withTimeout`; on timeout the app boots the current bundle, `reloadAsync` is not called, and any staged download applies on a later cold start.
- The healthy happy path is unchanged (a slow-but-completing download within budget still fetches then reloads); a fetch timeout/error is logged via `logger.warn` and boot continues (no crash, no `dbError`).
- `reloadAsync` is deliberately not wrapped in `withTimeout` (network-free, terminal), with the rationale documented; 16.10's offline path is unchanged.
- Reuses `core/utils/with-timeout.ts` — single-file change plus tests; gates green.

### Story 16.13: Widen the Jest coverage gate to `shared/**`

**As a** developer relying on the coverage gate to catch untested code, **I want** `shared/**` included in Jest's coverage collection, **So that** safety-critical logic in `shared/` (Supabase auth/session, sync hooks) is held to the same 80% threshold as `core/` and `features/`.

**Acceptance Criteria:**

- `collectCoverageFrom` in `jest.config.js` includes `'shared/**/*.{ts,tsx}'`, retaining the `d.ts`/`index.ts` excludes.
- `yarn test:coverage` passes the global 80% threshold on all four metrics with `shared/` collected, without lowering any threshold.
- `shared/toast.ts` (the only untested logic file) gets a co-located test to ≥ 80%; each new `shared/`-scoped exclude (`!shared/types/**`, `!shared/theme/spacing.ts`) is enumerated with a one-line justification.
- The CI Quality-gates job stays green with no flaky suites.

### Story 16.14: Surface boot-time OTA update failures in production telemetry

**As a** maintainer who ships fixes via OTA updates, **I want** boot-time OTA update failures (manifest check and bundle download) to be visible in production telemetry, **So that** I can measure how often real users hit flaky-network update stalls and confirm the 16.12 download budget is well-calibrated — instead of the failures being silently swallowed.

**Acceptance Criteria:**

- A production build emits a non-fatal Sentry warning-level event on a boot-time OTA manifest-check failure (timeout or error), where today `logger.warn` is a prod no-op.
- The same non-fatal warning-level event is emitted on a boot-time OTA download/reload failure.
- The signal is strictly non-fatal: it MUST NOT set `dbError`, render the boot-error screen, or `captureException`/crash — boot proceeds on the current bundle exactly as in 16.10 / 16.12.
- No PII / card data leaves the device: the event carries only the stable message + error and passes through `beforeSend`/`scrubEvent` (GDPR); assert nothing sensitive is attached.
- Dev behaviour is preserved (`__DEV__` still logs to console only, no Sentry transmit), and the mechanism (a new non-fatal `logger.notify` → `Sentry.captureMessage('warning')`) is applied centrally — one logger method reused by both call sites, not duplicated.
- Unit tests cover the new logger method (prod → `captureMessage('warning')` with scrubbable context; dev → console only, no capture); `logger.error`/`warn`/`info` behaviour is unchanged; the `_layout` boot tests stay green with coverage maintained (`core/utils/logger.ts` is measured).

### Story 16.15: Fix `formatRelativeTime` crash on Hermes (`Intl.RelativeTimeFormat` unsupported)

**As a** user opening the Settings sync indicator, **I want** the "last synced" relative-time label to render without crashing, **So that** the app does not throw an unhandled `TypeError` (and, on the interval path, a fatal error) on production Hermes builds.

**Acceptance Criteria:**

- `core/utils/relative-time.ts` no longer references `Intl.RelativeTimeFormat` (nor any `Intl.*` API) — the root cause of the Hermes crash (Hermes ships no `RelativeTimeFormat`).
- Italian output is unchanged vs the previous `Intl.RelativeTimeFormat(..., { numeric: 'always' })` behaviour (verified byte-for-byte against Node ICU), and English output is unchanged.
- The Italian locale path gains explicit test coverage including the singular↔plural boundaries (1 vs N) for minutes/hours/days — the gap that let this ship.
- Typecheck, lint on the changed files, and the `relative-time` suite all pass; no new dependency added.

### Story 16.16: Adopt a Hermes-safe `Intl` polyfill (FormatJS) and enforce it via lint

**As a** developer adding internationalised formatting (relative time, numbers, dates, plurals), **I want** `Intl` to be reliably available on every runtime the app ships to — including iOS Hermes — **So that** using a standard `Intl.*` API can never again ship a green build that crashes fatally in production (the 16.15 class), and future i18n work has a safe, standard formatting foundation instead of hand-rolled per-locale strings.

**Acceptance Criteria:**

- The FormatJS polyfill chain (`intl-getcanonicallocales`, `intl-locale`, `intl-pluralrules`, `intl-relativetimeformat`) is installed and imported in dependency order via a single dedicated module (`shared/i18n/intl-polyfill.ts`) loaded before any `Intl` consumer runs.
- Every import uses the `/polyfill-force` variant (not the auto-detecting entry, which may no-op over Hermes' broken partial `Intl`), and only `en` + `it` locale data are registered for `intl-pluralrules` and `intl-relativetimeformat` (no world dataset).
- On a real iOS Hermes build, `new Intl.RelativeTimeFormat('it', { numeric: 'always' }).format(-5, 'minute')` returns the correct Italian string (verified on device/sim, not only Jest), and the measured bundle-size delta is recorded.
- A lint rule (`no-restricted-properties`) fails on any not-yet-polyfilled `Intl.*` API (e.g. `Intl.ListFormat`, `Intl.DisplayNames`, `Intl.Segmenter`) with a message pointing to this story, proven to fail on an offending line and pass once removed.
- A startup/guard test asserts `Intl.RelativeTimeFormat`/`Intl.PluralRules` are defined at runtime, so removing the polyfill entry import fails CI.
- Existing behaviour is preserved: current `relative-time` EN/IT tests stay green and no user-facing copy changes unless a UX-copy sign-off explicitly approves migrating `relative-time.ts` (default: leave 16.15's tested implementation as-is); a grep audit confirms no unguarded `Intl` consumer remains, with all gates green.

### Story 16.17: Redesign the app launch experience — one continuous, branded, theme-aware surface

**As a** user opening the app in a checkout queue, **I want** the launch to be a single calm branded surface instead of a stack of flashing placeholder screens, **So that** the app reads as instantly ready — and as _ours_ — rather than as something still assembling itself.

**Acceptance Criteria:**

- The stretched placeholder is gone: `assets/splash-icon.png` (today a 1×1 `#00FF00`@50% pixel that `resizeMode: 'contain'` scales into a full-screen-width green square) is **generated** from `assets/images/app-icon-variant-aurora-transparent.svg` by `yarn splash:build`, with `yarn splash:check` failing in pre-push and CI if the raster drifts from the SVG. (Revised 2026-07-28: an earlier byte-copy of the shipped icon raster shipped a hard-edged blue _square_, because app icons are deliberately opaque and full-bleed — the OS applies the squircle mask itself, and a splash image gets no such treatment.)
- The deprecated `expo.splash` key is removed and `expo-splash-screen` (not currently installed at all) is adopted as a config plugin with `imageWidth` and a brand `backgroundColor`, and deliberately **no** `dark` variant — the launch field is scheme-independent, so there is no scheme for it to get wrong.
- The hardcoded `'#171717'` background that Story 13.10 left behind is retired: the `dbError` branch moves onto theme tokens, and the launch field becomes **one scheme-independent brand colour** in both the native and JS layers. (Revised 2026-07-28: the surface originally resolved its scheme from the **system** appearance to match the native layer. Measured on device, that produced ~1.75 s of white followed by black content on every cold start for a user whose persisted preference differs from their system scheme — and no theme-aware field can avoid it, because the native background is baked at build time from `userInterfaceStyle: "automatic"` and can never read a runtime preference.)
- The native→JS handoff is visually invisible: one shared `SPLASH_LOGO_WIDTH` constant (width **and** height) drives both the plugin config and the component, and both layers paint the same single field colour — since `SplashScreen.setOptions({ fade })` is iOS-only, that agreement is the sole mechanism concealing Android's hard cut, and it no longer depends on two scheme resolvers matching.
- `preventAutoHideAsync()` is called at module scope and `hideAsync()` on the launch surface's first paint (not on `isReady`), so the wait happens on a surface the app controls — with `.catch()` on both and an unconditional fallback timer, so a rejected promise or a missing `onLayout` can never strand the native splash.
- The app's own logo (the aurora artwork, matching the shipped icon) renders at runtime for the first time — eight brand SVGs exist today referenced by zero code, and the current "brand" is a `MaterialIcons` `credit-card` glyph.
- Progressive disclosure per the folded-in motion spec: no motion for the first 600ms, then a breathing opacity on the mark until ready (never a third spinner), a 250ms cross-fade out, and reduced motion fully honoured.
- Boot semantics are unchanged — `isReady`, both OTA budgets, the `dbError` branch, and Story 16.14's `logger.notify`/`otaFailureKind` sites are untouched, and `testID="boot-loading"` is preserved so all existing offline-boot assertions pass unmodified.
- Verified on a **release build** on iOS and Android in both schemes (Expo's docs state the splash does not render faithfully in Expo Go or a dev build); a passing CI run does not satisfy this.

### Expo SDK 57 upgrade thread (Stories 16.18 – 16.21)

**Sequencing decision (ifero, 2026-07-28):** this thread starts **only after Story 16.17 is done**. Story
16.16 (FormatJS `Intl` polyfill) **rides with this thread** rather than shipping separately, because SDK
56+ makes **Hermes v1 the default engine** and the 16.15 production crash was caused by Hermes' partial
`Intl` — the polyfill must be in place before the engine changes underneath it.

**Target is SDK 57, not 56.** SDK 57 (2026-06-30, RN 0.86, React 19.2 — unchanged from 56) is described
by Expo as "the easiest Expo SDK upgrade you've ever made", and the 56→57 diff is package.json-only.
Routing via 56 would cost a second Reanimated migration and a second device-RC pass for no benefit.

**Why the cost is lower than it looks:** the project is pure CNG (`android/`, `ios/` gitignored), so every
native diff in the upgrade guide is regenerated rather than hand-applied; and the toolchain floors are
already met (Xcode 26.6 local / 26.4.1 in CI, Node 24.16, `minimumOsVersion: 18.0` already above the new
iOS 16.4 requirement).

### Story 16.18: Upgrade to Expo SDK 57 — JS dependencies and Jest preset

**As a** maintainer, **I want** the JS/dependency half of the SDK 57 upgrade landed with a green test suite, **So that** the native work in 16.19 starts from a known-good JavaScript baseline instead of debugging both halves at once.

**Acceptance Criteria:**

- `expo` → `^57`, all `expo-*` packages → `~57.x`, `react`/`react-dom` → 19.2.3, `react-native` → 0.86.x, via `npx expo install expo@latest --fix`.
- **Hard build blockers cleared together:** `react-native-reanimated` `4.2.1` → `4.5.1` and `react-native-worklets` `0.7.4` → `0.10.1`. These must move as a pair — 4.2.1 hard-pins worklets to `0.7.x`, and each independently fails the build (Reanimated's podspec `raise`s on an unsupported RN version; worklets throws a `GradleException` wired to `preBuild`).
- Community bumps to Expo's pins: `react-native-gesture-handler` → `~2.32.0`, `react-native-screens` → `~4.26.0`, `react-native-safe-area-context` → `~5.7.0` (**not** 5.8.0 — outside the pin, trips `expo-doctor`), `@react-native-community/netinfo` → `12.0.1`. Stay on `@shopify/flash-list` 2.0.2, `@react-native-async-storage/async-storage` 2.x, `@react-native-picker/picker` 2.11.4, and `react-native-edge-to-edge` ^1.8.1 (a `react-native-unistyles@3` peer — do not remove).
- **The `react-native-screens` bump also closes a latent fatal Android crash** present on the current `~4.23.0` pin (upstream #4311 — `Screen.onLayout` → `IllegalArgumentException: [RNScreens] DecorView is required for applying inset correction, but was null`, fixed in 4.25.0). It is invisible in Sentry only because the project has **zero Android telemetry** (10 events/90 days, 100 % iOS), not because it is safe.
- `@expo/vector-icons` is an **explicit** dependency — `expo@57` no longer depends on it and 54 files import it. Migrating those imports to `@react-native-vector-icons/*` is explicitly **out of scope**.
- `jest.config.js` `preset: 'react-native'` → `'@react-native/jest-preset'` (RN 0.85 moved the preset to its own package, a declared peer of `react-native`); add it as a devDependency and re-audit `transformIgnorePatterns`, which currently lists neither `react-native-reanimated` nor `react-native-worklets`.
- `StyleSheet.absoluteFillObject` → `absoluteFill` (removed in RN 0.85) in `MultiCodePickerSheet.tsx` and `ScannerOverlay.tsx`. Safe to land ahead of this story — in RN 0.83.6 both names reference the same frozen object.
- `newArchEnabled: true` removed from `app.json` (now the default).
- All gates green from the main checkout, with the test count recorded before and after.

### Story 16.19: SDK 57 native unblock — apple-targets v5, burnt, and watch connectivity

**As a** maintainer, **I want** the three non-Expo native blockers resolved and proven by a real build, **So that** the SDK 57 upgrade can actually compile for iOS and the watchOS target still ships.

**Acceptance Criteria:**

- `@bacons/apple-targets` → `^5.0.0`, required for two independent SDK 56+ breakages: its `ExtensionStorage.podspec` iOS floor moves 15.1 → 16.4, and `@expo/prebuild-config` moves to a runtime dependency (it is no longer hoisted, so `expo config`/`prebuild` otherwise throws `Cannot find module '@expo/prebuild-config/build/plugins/icons/AssetContents'`). Its peer range is `expo: ">=52"`, so **there is no install warning** for being on the broken version.
- The v5 relocation of `generated.entitlements` into `ios/<productName>/` is handled in both `targets/watch/expo-target.config.js` and `targets/watch-widget/expo-target.config.js` (both declare app-group entitlements), and the regenerated watchOS target + widget build and run.
- **`burnt` is unblocked.** Its podspec declares iOS 13.0 while its Swift does `import ExpoModulesCore` (16.4 floor) → compile error. `expo-build-properties`' `deploymentTarget: 18.0` does **not** rescue it: pods normalise to `min_ios_version_supported`, still 15.1 in RN 0.86. Fix via a one-line `yarn patch` (upstream PR #60 is unmerged and the package is ~16 months stale) **or** replace it with an `@expo/ui` equivalent. If patched, add a CI guard so a dependency refresh cannot silently drop the patch.
- **`react-native-watch-connectivity` 1.1.0 is proven by a build, not by inspection.** Keep 1.1.0 — it is pure Objective-C legacy-bridge (no Swift ⇒ immune to the 16.4 floor) and RN 0.86 still ships the `ObjCInteropTurboModule` machinery it needs. Do **not** blind-bump to 2.0.0: it renames its pod to `WatchConnectivity`, shadowing Apple's framework and breaking its own `#import <WatchConnectivity/WCSession.h>` (upstream #134, open and unanswered for ~4 months) — and `targets/watch/expo-target.config.js` explicitly lists `WatchConnectivity` in `frameworks`.
- Phone ↔ watch sync verified end to end on a real device: card push, `requestCards`, and `CARD_USED` usage events.

### Story 16.20: Migrate @sentry/react-native v7 → v8

**As a** maintainer, **I want** Sentry on a version that actually supports RN 0.86, **So that** crash reporting and symbol upload keep working after the upgrade instead of failing silently.

**Acceptance Criteria:**

- `@sentry/react-native` → `~8.20.0` (floor 8.15.1: Expo-SDK-56-validated and clear of the 8.14.0 Android regression). The 7.x line was abandoned on 2026-02-12, three months before SDK 56, and 7.11.0 requires Metro internals at module top level — fixed only in 8.8.0 and never backported.
- Expo's own bundled pin still says `~7.11.0` in both the 56 and 57 branches (it also still lists the deprecated `sentry-expo`), so an `expo.install.exclude` entry is added for `@sentry/react-native` and the deviation is documented.
- `metro.config.js` needs **no change** — `getSentryExpoConfig`'s implementation and type signature are byte-identical between v7 and v8. Confirm rather than assume.
- CI symbol upload re-proven end to end (`sentry.gradle` → `sentry.gradle.kts` with a back-compat shim; the `SENTRY_DISABLE_AUTO_UPLOAD` guard across the release workflows). v8 adds a native Debug-configuration skip and a first-class `disableAutoUpload` plugin prop, so the env-var guard can be narrowed to release-only.
- A release/staging build produces a **symbolicated** event in `andrea-pacino/react-native`.
- **Known open upstream issue documented, with a decision recorded:** #6514 — `Sentry.wrap` breaks Fast Refresh on RN 0.85+/React 19.2 (whole-tree remount on save). `app/_layout.tsx` ends in `export default Sentry.wrap(RootLayout)`, so this degrades the dev loop; the workaround is gating `Sentry.wrap` to release builds.

### Story 16.21: SDK 57 CI and on-device release validation

**As a** maintainer, **I want** CI and a real-device pass to prove the upgraded app before it reaches users, **So that** an SDK jump cannot repeat the 16.15 class of failure where CI was green and production crashed.

**Acceptance Criteria:**

- Workflow cache-key salts move `sdk55` → `sdk57` in `ci-quality-gates.yml` and `watchos-tests.yml`; otherwise `restore-keys` would restore a stale SDK-55 `node_modules`.
- `scripts/ensure-expo-sqlite-vendor-files.mjs` still resolves against `expo-sqlite@57` — it runs in `postinstall` and sets a failing exit code if the vendored sqlite sources move, so a layout change would **fail `yarn install` in CI**.
- Fastlane build + three-identity match (app / `.watch` / `.watch.widget`) re-proven — it is downstream of apple-targets v5's project generation, so this is where a v5 regression surfaces.
- **Hermes v1 verification (this is the point of the story):** with Story 16.16's polyfill in place, `Intl.RelativeTimeFormat` and `Intl.PluralRules` are confirmed working on a **real iOS Hermes build**, not on Node/Jest. `useHermesV1: false` in `expo-build-properties` is documented as the rollback lever.
- **Android memory validated.** A known SDK 57 issue raises Android memory ~25–30 % with Hermes v1 + Reanimated; measure it and record the result, since Epic 10 (Wear OS) builds directly on this.
- Full on-device RC pass per the project's established gate: watch app + complication, camera/scanner, offline cold start, cloud sync, OTA update, Sentry symbolication, and Android edge-to-edge.

### Story 16.22: Fix card-grid tile overlap on narrow screens — derive tile width from the grid cell

**As a** user opening my card list on a standard Android phone, **I want** the card tiles to stay inside their own columns instead of colliding in the middle of the screen, **So that** I can read and tap the right card at a checkout counter without squinting at overlapping artwork.

**Acceptance Criteria:**

- The grid tile width is **derived from the window width**, not hardcoded. `TILE_WIDTH = 171` (`features/cards/components/CardTile.tsx:35`) is a frozen derivation of `(390 − 32 − 16) / 2` — the tile width on Figma's default 390 dp iPhone frame — so it stops being a function of the viewport and exceeds its cell on narrower screens.
- **Overlap becomes arithmetically impossible.** FlashList v2 assigns each grid cell an exact width (`GridLayoutManager.getWidth()` returns `boundedSize / maxColumns`) and does not negotiate with the child, so an oversized tile paints outside its cell rather than reflowing. Measured: tiles overlap whenever the window is **narrower than 374 dp** — 14 dp of overlap at 360 dp (the most common Android portrait width), 54 dp at 320 dp. iOS never showed it because the narrowest shipped iPhone is 375 dp, one dp above the cliff.
- **16 pt screen margins and 16 pt gutters hold at every width**, finally satisfying Story 13.2 AC1's two clauses (`:24` "171x140pt with 16pt gutters", `:31` "16pt horizontal screen margins") simultaneously — today they can only both hold at exactly 390 dp, and the oversized tile has been silently eating the gutter everywhere (a 390 dp iPhone actually renders 20 dp margins and an 8 dp gutter).
- **Zero visual change at the design reference width:** the tile is exactly 171 × 140 pt at 390 dp. Aspect ratio `140 / 171` is preserved at other widths; `TILE_RADIUS` stays a fixed 16 pt.
- A co-located **layout contract test** (modelled on `targets/watch/__tests__/watch-layout-contract.test.ts`) asserts the geometry across a device-width table and sweeps the no-overlap invariant across 280–1024 dp.
- Verified on a real narrow Android device/emulator at 360 dp and 320 dp in both themes. Android's **Display size** setting lowers the effective dp width, so a device that is fine at default settings can cross below the 374 dp cliff.
- The exported constants keep their values and are re-documented as **design reference dimensions at 390 dp**, so the existing `CardTile.test.tsx:142-144` assertions and the `CardList.test.tsx:92-97` module mock keep passing unchanged.
- Out of scope, flagged for separate stories: responsive column counts (the UX spec asks for 2–3 columns at `:61`/`:414-415`; Story 13.2 deliberately shipped a fixed 2-column grid, and `CatalogueGrid.tsx:27-29` already implements the responsive pattern in the same folder), the orientation-locked landscape guidance (`app.json:6` is `"portrait"`), and a `CardTile` → `CardShell` migration.

### Story 16.23: Fix silent barcode-scan failures on iOS — reported as "PENNY Card EAN-13 not recognised"

**As a** user adding a loyalty card by scanning a photo or screenshot of it, **I want** the app to tell me **why** the scan failed rather than always claiming the image contains no barcode, **So that** a scan failure is recoverable and diagnosable — and so the next field report can actually be investigated.

**Root cause (established):** the PENNY card artwork's barcode is **under-rasterised**. It was drawn at roughly half the size it needed (module ≈ 2.83 px) and upscaled 2×, so 1-module elements render as **4 or 6 px against a 5.66 px ideal — a 1.50× spread**. Apple Vision rejects that narrow-element variation; Google ML Kit tolerates it, which is why a Samsung device reads the same card via both camera and image. Proven by A/B on the real file: the measured bar geometry rendered crisply **misses**, an ideal module grid at the identical span and height **hits**; modelling a 269 px render upscaled 2× predicts 57 of 59 element widths exactly. Upscaling to 4836 px, hard binarisation and all four `VNDetectBarcodesRequest` revisions were tested and all fail.

**But there is a fix: resampling.** The iOS _camera_ reads that exact image perfectly — it uses AVFoundation, not Vision, and its optics low-pass the quantised edges for free. Reproducing that in software works: downscaling the file to anywhere in **0.85×–0.25×** makes Vision decode it, robustly and strictly additively. This also explains why only this card fails — `scaleImageIfNeeded(maxDimension: 2048)` already resamples anything wider than 2048 px, so most images get the correction for free, while this 806 px file sails through untouched. Alongside that, the app's own defect stands: it reports "No barcode found in this image" — untrue, since Android reads it — with no route forward and no telemetry.

**Acceptance Criteria:**

- **Device verification, not investigation.** On a real iOS device (never the simulator) confirm the failure is a Vision miss rather than a rejection, and confirm the **physical** card scans via the add-card camera — that is the recovery the new copy recommends, so it must be verified rather than assumed.
- `useImageScan` **separates** "decoder returned zero results" from "the native call threw" — the bare `catch {}` at `useImageScan.ts:152` currently discards the reason — and the user-facing copy differentiates the two in **both** `en.ts` and `it.ts`.
- Both failure paths emit `logger.notify` (Story 16.14's production-visible channel; `logger.warn` is a `__DEV__`-only no-op). **The barcode value, image URI, and file name never reach Sentry** — tag values are not scrubbed by the PII filter.
- The `?? 'CODE128'` fallback in `useImageScan.ts:51` and `useBarcodeScanner.ts:31` becomes observable, so a decoder format outside the map can no longer silently mislabel a stored card.
- **The 6 supported symbologies are unchanged by decision** (`barcodeFormatSchema` is a cross-platform sync contract shared with watchOS/Wear OS); only the unbacked `DATAMATRIX` locale key at `en.ts:526` / `it.ts:529` is removed.
- `penny-market` (`catalogue/italy.json:293-298`) declares `defaultFormat: "EAN13"`, restoring the `applyExpectedFormat` safety net for the brand.
- **A resample retry makes the image decode:** a downscaled second attempt (≈0.6×, measured window 0.85×–0.25×) after a zero-result pass, preferably by extending the library's existing retry ladder, which tries greyscale, contrast and rotations but never rescaling. Manual entry stays reachable for the images it does not rescue. Fixed-radius blur, upscaling, sharpening, binarising, alternate Vision revisions, crop-and-retry and ML Kit on iOS are all explicitly rejected with measured reasons.
- **Android must not regress** — it is the known-good platform and is re-verified after any change to the shared JS path.

**Notes:** the payload `2095110257978` was verified to be a **valid EAN-13** (check digit 8 confirmed) that `bwip-js` renders correctly, that `inferBarcodeFormat` classifies correctly, and that every scan surface already requests — so the defect is in the decode step, not in format support. An earlier suspicion about the library's Android 1024 px downscale cap was **reversed** by the Samsung result: Android downscales harder than iOS (1024 vs 2048) and still succeeds. **Reintroducing ML Kit on iOS is structurally blocked** — Google ships it as a `.framework` with an iOS-Device-only arm64 slice, so CocoaPods excludes arm64 for simulators and every Apple-Silicon simulator build breaks (`2-9…md:124-134`). The observability half is OTA-eligible; the resample retry is a **native** change (library patch or a new `expo-image-manipulator` dependency) and needs a new binary, so the two halves can ship separately.

### Story 16.24: Clear the `exhaustive-deps` backlog and promote the rule to `error`

**As a** developer changing a React component in this codebase, **I want** `react-hooks/exhaustive-deps` to **fail** the build rather than print an advisory warning, **So that** a narrowed dependency array cannot reach `main` — the defect class that caused the card-grid tile overlap and survived until manual review caught it.

**Why `warn` is not protection:** PR #185 enabled `eslint-plugin-react-hooks` for the first time; before it neither `rules-of-hooks` nor `exhaustive-deps` had ever run, so the ~178 dependency-array hook call sites across 66 files carried zero automated assurance. That PR deliberately set `exhaustive-deps` to `warn`, because three pre-existing violations would otherwise have turned the merge gate red. **ESLint exits 0 when only warnings are present**, so CI's `lint` step passes and a reintroduced narrow dep array prints a line nobody reads and merges anyway. Verified against the merged Story 16.22 code: narrowing `renderItem`'s `useCallback` deps back to `[highlightCardId]` makes the rule report the missing `gridTile.height` and `gridTile.width` — and block nothing. **Depends on PR #185 landing**; none of the warnings below exist until it does.

**Two of the three fixes must not follow the rule's suggestion,** which is the whole reason this is a story rather than someone running `eslint --fix`: one autofix causes a camera-permission loop, the other re-runs database initialisation on every language change.

**Acceptance Criteria:**

- **`BarcodeScanner` — wrap, don't add.** `features/cards/components/BarcodeScanner.tsx:84` stops warning about the missing `handlePermissionDenied` dependency by memoising the helper defined at `:56` in `useCallback` (deps `[t, onManualEntry]`) and then adding it to `handleRequestPermission`'s dep array — **not** by adding the bare per-render function. The naive fix is actively harmful: a fresh identity every render makes `handleRequestPermission` change every render, which re-runs the `:87`–`:91` effect whose only guard is `if (permission === null)`, firing `requestCameraPermission()` repeatedly while permission is unresolved.
- **The real defect underneath is fixed.** `handleRequestPermission` is recreated only when `onError`, `requestCameraPermission` or `t` change, so a parent passing a **new `onManualEntry`** leaves a stale `handlePermissionDenied` captured and the permission-denied alert's "Manual entry" action invokes the _previous_ callback. After the fix the current one runs, and `handleRequestPermission`'s identity is stable across re-renders with unchanged props — asserted by a test that fails if the helper is left un-memoised.
- **`app/_layout.tsx` — remove the dependency, don't add it.** `app/_layout.tsx:530` flags a missing `t` on the mount-only effect beginning at `:394`. `[]` is the correct array: `t`'s identity changes on language change, so adding it would tear down the watch subscriptions and re-run database initialisation every time the user switches language. Instead `dbError` state holds a translation **key or error code** and is translated at render, so the effect no longer closes over `t` and the empty array becomes honest.
- The boot-failure message — `t('common.errors.initializationFailed')`, called exactly once at `:475` — renders in the **current** language, including after a language change following a failed initialisation. That staleness is the real smell the rule was pointing at.
- The app-initialisation effect still runs **exactly once per mount**, with database initialisation and `subscribeToWatchUserInfo` subscribe/unsubscribe behaviour unchanged, and a language change must not re-run it. This is the largest-risk change in the story — it is the app's root layout and boot path, and its auth plus local-infrastructure gating is load-bearing and must not be reduced.
- **`CreateAccountScreen` is genuinely trivial.** `features/auth/CreateAccountScreen.tsx:124` drops the unnecessary `fieldErrors` dependency, which appears in the callback body only in a type position (`:99`, `const errors: typeof fieldErrors = {}`) that TypeScript erases. Today the effect is benign over-invalidation; confirm `validateFields` is absent from **every** effect dependency array before removing it, because `validateFields` calls `setFieldErrors` itself and the pair would become an infinite loop. Included only because the rule cannot be promoted while any warning remains.
- `react-hooks/exhaustive-deps` is promoted from `'warn'` to `'error'` in `eslint.config.mjs`, the adjacent comment (which currently explains the `warn` choice as temporary) is rewritten to match reality, and `yarn lint` reports **0 errors and 0 warnings** from `react-hooks/*`. `eslint.config.mjs` is prettier-clean as of #180/#181 and gated by `yarn format:check`; keep it that way and do not reformat unrelated regions.
- The full pre-push gate sequence passes from a checkout with dependencies installed — `yarn typecheck`, `yarn tokens:check`, `yarn splash:check`, `yarn lint`, `yarn format:check`, `yarn test` — with no `--no-verify`. The identity-stability and once-per-mount assertions both test the _absence_ of churn, which is easy to write non-falsifiably, so each new test must be confirmed to fail against the unfixed code first (the #171 precedent). Tests live beside their subject as `*.test.ts(x)`; `app/` holds no test files, so an `app/_layout.tsx` test belongs in the top-level `test/` directory, imported via `@/app/...`.
- Out of scope, flagged for separate stories: the ~30 React Compiler lints that `eslint-plugin-react-hooks` v7 also ships (`purity`, `immutability`, `set-state-in-effect`, `preserve-manual-memoization`, `static-components`, …) — PR #185 registered only `rules-of-hooks` and `exhaustive-deps` on purpose, and adopting the `recommended` config is a much larger migration; `additionalHooks` configuration, unnecessary while all three `useFocusEffect` call sites use the canonical `useFocusEffect(useCallback(…))` form that the rule already checks; and a `--max-warnings` ceiling, redundant once the rule is an `error`.

**Notes:** Story 16.23 also edits `BarcodeScanner.tsx`, but only the symbology list at `:206`–`:208`, plus `useBarcodeScanner.ts` and `useImageScan.ts` — different concern, same file, so parallel-safe in principle with a likely trivial rebase if both are in flight. Land 16.23 first where sequencing is free: it is a user-facing bug fix and this is tech debt. Silencing any of the three sites with `// eslint-disable-next-line` is a failure to do the story — all three have real fixes. The Story 16.15 lesson transfers directly: green tests on Node do not prove runtime safety, and here the analogue is that a green `yarn lint` at `warn` level does not prove hook correctness, which is precisely the gap this story closes.

### Story 16.25: Map UPC-E instead of storing it as Code 128

**As a** user adding a loyalty card whose barcode is UPC-E, **I want** the card stored with its real format, **So that** it renders and scans correctly instead of being silently relabelled as Code 128.

**The defect, traced in source rather than inferred:** a UPC-E barcode detected by **scan-from-image** is stored with `barcodeFormat: 'CODE128'` and re-rendered as Code 128 for the rest of the card's life — no error, no warning to the user. The chain is: `features/add-card/hooks/useImageScan.ts` always requests `UPC_A` as part of `SUPPORTED_IMAGE_SCAN_FORMATS`; the iOS decoder maps a requested `"UPC_A"` to **two** Vision symbologies, `symbologies.append(contentsOf: [.ean13, .upce])` (`node_modules/react-native-image-code-scanner/ios/ImageCodeScanner.swift:273`), so `.upce` is registered with Vision whenever `UPC_A` is requested — which is always; on detection the same file reports the format back to JS as the string `"UPC_E"` (`:361`); `BARCODE_FORMAT_MAP` has **no `upc_e` key**, so `mapFormat` falls through to `?? 'CODE128'`; and `normalizeBarcode` cannot rescue it, because all three of its rules need a 12- or 13-digit payload and a UPC-E payload is **8 digits**. Those line numbers are for the **patched** `ImageCodeScanner.swift` (Story 16.23 adds ~50 lines via `patches/react-native-image-code-scanner+1.1.3.patch`) — grep for the symbol, not the line.

**Already observable — size it from Sentry before sizing it from the code.** Story 16.23 shipped exactly the telemetry that measures how often this happens: `mapFormat` emits `logger.notify('Barcode format fell back to CODE128')` with `context: [{ unmappedFormat }]`, so a UPC-E detection surfaces as `unmappedFormat: 'UPC_E'`. The real-world frequency was unknown when this story was drafted and is knowable now — if the answer is "never", option (b) below is a ten-line change; if it is "often", it justifies the wider option (a). The camera path has the same gap (`mapBarcodeFormat` in `features/cards/hooks/useBarcodeScanner.ts`) and is also instrumented; `expo-camera`'s `barcodeTypes` lists do **not** include `upc_e`, so the camera is less exposed, but whether it still reports a UPC-E detection when `upc_a` is requested is worth confirming on device rather than assuming.

**Open decision — this story deliberately presents three approaches and picks none.** **(b) Normalise UPC-E → EAN-13 is the recommendation and should be evaluated first:** expand the 8-digit UPC-E to its 12-digit UPC-A parent and let the **existing** `normalizeBarcode` Rule 1 carry it to EAN-13 — no schema change, no protocol change, no native app work, no new locale keys. It is the precedent Rule 1 already sets for UPC-A (a UPC-E is a compressed UPC-A, so this is the same argument applied one step earlier), it is lossless because UPC-E zero-suppression is a defined and reversible GS1 encoding, and it **shrinks rather than grows** the format surface. Its cost is one well-tested pure function — the expansion has six defined cases keyed on the last digit of the 6-digit body — handled inside `normalizeBarcode` so **both** scanner hooks get it for free. **(a) Add `UPCE` as a full schema member** is truthful to the source symbology and the right answer if UPC-E cards turn out common enough that users care about seeing "UPC-E" in the format picker, but it is a **cross-platform sync-contract change** spanning seven files plus watchOS and Wear OS: `core/schemas/card.ts`, `BarcodeRenderer.tsx`, `FormatPicker.tsx`, `ScannerOverlay.tsx`, `BarcodeScanner.tsx`, `useImageScan.ts` and both locale files. `bwip-js` support for it is **verified, not assumed** — `toSVG({ bcid: 'upce', text: '04252614' })` and `text: '01234565'` both render against the installed `@bwip-js/react-native` — so it would not hit the `invalidA11y` fallback at `BarcodeRenderer.tsx:164`. **(c) Stop requesting `UPC_A` is rejected:** it would stop `.upce` being registered, but would also break genuine UPC-A scanning, which real cards use.

**Acceptance Criteria:**

- **The decision above is recorded in the story before implementation starts**, with the Sentry `unmappedFormat: 'UPC_E'` frequency noted as the evidence behind it. Confirming on a device whether `expo-camera` also reports `UPC_E` when only `upc_a` is requested belongs to the same step.
- **A UPC-E detection is no longer stored as `CODE128`.** Whichever option is chosen, scanning a UPC-E barcode from an image produces a card whose stored value and format render and re-scan correctly.
- **The chosen path is unit-tested at the seam that failed.** For option (b): the expansion function covers all six UPC-E zero-suppression cases plus an invalid input, and `useImageScan.test.ts` asserts a `UPC_E` decoder result resolves to the expected value and format. For option (a): the schema, both format maps, both `barcodeTypes` lists and both locale files are updated together, with a test asserting `BWIPJS_FORMAT_MAP` renders the new member without error — do not land a partial schema.
- **The 16.23 telemetry stops firing for `UPC_E`.** `mapFormat` must no longer reach its `'Barcode format fell back to CODE128'` branch for a `UPC_E` label, asserted in a test, since that is the observable proof the gap is closed. `useImageScan.test.ts` already contains a `UPC_E` fallback test from 16.23 that asserts the current **wrong** behaviour — it must be updated, not deleted.
- **No regression to existing formats.** `normalizeBarcode` / `applyExpectedFormat` semantics for UPC-A, EAN-13, CODE128-carrying-EAN-13 and the Conad leading-zero case are unchanged, and their existing tests still pass untouched — those tests encode the Story 2.9 regression, so add to them, never rewrite them.
- **Round-trip verified on a real device:** render a UPC-E card in the app and scan it back with a second device or a physical scanner, recording device, OS version and build type. Bars that a decoder rejects are invisible to a unit test — Jest never runs `bwip-js` against a real scanner — which is the Story 16.15 / 16.23 lesson and the only evidence that counts for a rendering change.
- Regression-safe: `yarn lint`, `typecheck`, `test`, `tokens:check`, `format:check`, `check:native-patches` and `check:native-strings` all pass.

**Notes:** **not urgent and not blocking anything** — this is a latent data-correctness defect found while implementing Story 16.23 and deliberately scoped out of it, because the fix is a schema question while the report that triggered 16.23 was about a format already supported. It also **corrects a stale claim in Story 10.4**, whose notes state that `EAN8`, `CODE39` and `UPCA` fall through leaving `modules` nil so an EAN-8 card shows nothing on Apple Watch: `targets/watch/BarcodeGenerator.swift:57-59` now falls back to `encodeCode128` for all three, so they **do** render — as Code 128 bars carrying the same digits, readable by a scanner but not the declared symbology. That cuts both ways here: option (a) would inherit the same fallback for `UPCE` unless watchOS is updated too, which should be a conscious choice rather than a surprise, while **option (b) sidesteps it entirely** since an EAN-13 value renders natively on the watch. Two of option (a)'s seven files are **compile-enforced** — `BWIPJS_FORMAT_MAP` and `FormatPicker`'s `formatLabels` are both `Record<BarcodeFormat, string>`, so adding a schema member is a type error until both are updated — but the locale files are **not** (there is no i18next module augmentation), so those stay manual. A barcode number is **PII** and must never reach Sentry as a message, tag or context value; note that the scrubber matches by **key name** and its pattern includes `barcode`, so a context key containing that word is redacted to `[Redacted]` and the signal is lost, which is exactly why 16.23 named its key `unmappedFormat`. Do not widen the symbology set as a side effect: if option (b) is chosen, the six supported formats stay six. Out of scope and flagged rather than fixed: the pre-existing `exhaustive-deps` warnings, which Story 16.24 owns — note `BarcodeScanner.tsx` sits on both that list and option (a)'s file table — and every other unmapped decoder format, since `CODE_93`, `ITF`, `CODABAR`, `PDF_417`, `DATA_MATRIX` and `AZTEC` are never requested and therefore cannot be returned, leaving `UPC_E` the only reachable-but-unmapped one.

### Story 16.26: Hold the Apple Watch display at full luminance while a barcode is shown

**As a** user paying at a checkout with my Apple Watch, **I want** the barcode to stay at full screen luminance for as long as the scanner needs it, **So that** the cashier's scanner reads it on the first pass instead of me raising my wrist repeatedly while the display dims.

**Context:** the phone maximises brightness for exactly this reason — `useBrightness` (`features/cards/hooks/useBrightness.ts`) calls `Brightness.setBrightnessAsync(1.0)` on the barcode flash and restores the previous level on dismiss (Story 2.5). **The watch has no equivalent, and cannot have the same one:** `expo-brightness` wraps `UIScreen.brightness`, and `UIScreen` does not exist on watchOS — `WKInterfaceDevice` exposes no brightness property. A grep across `targets/` returns zero hits for `brightness`, `ExtendedRuntime` or `isLuminanceReduced`, so today `BarcodeFlashView` does nothing at all about luminance. This story delivers the closest achievable behaviour, not a literal brightness call.

**Acceptance Criteria:**

- **AC1 — establish which mechanism is legitimately available, before writing UI code.** Determine whether `WKExtendedRuntimeSession` can be used here. It requires a `WKBackgroundModes` entry in `targets/watch/Info.plist`, and the permitted values (`self-care`, `mindfulness`, `physical-therapy`, `alarm`, `workout-processing`, `location`) **do not describe a loyalty barcode** — claiming one risks App Review rejection and is not to be shipped on a guess. Record the finding and take the branch below that it supports. Timebox this; it is a determination, not a spike epic.
- **AC2 — the display does not drop to the dimmed Always-On state while the barcode is on screen**, for the duration the chosen mechanism allows. If AC1 clears an extended runtime session, start it in the existing `.task(id: card.id)` block at `targets/watch/BarcodeFlashView.swift:104` (which already handles focus, haptic and the Story 9.6 usage event) and invalidate it in `.onDisappear` at `:139` alongside the focus reset — the session must never outlive the view.
- **AC3 — if AC1 rules out an extended runtime session, the fallback ships instead** and the story still closes: observe `@Environment(\.isLuminanceReduced)` and, while luminance is reduced, keep the barcode at maximum contrast and suppress anything that would compete with it. No user-facing copy, no new locale keys — the barcode is already pure black on pure white, so this is a rendering-state fix, not a messaging one.
- **AC4 — no regression to the existing dismissal gestures.** Tap-to-dismiss (`:43`) and the single-shot Digital Crown dismissal (`:93-100`) keep working, and the crown's `crownTriggered` latch is unaffected by any new session lifecycle.
- **AC5 — measured on a real Apple Watch, never the simulator.** The simulator does not model Always-On dimming or wake duration, so a green build proves nothing (the 16.15 lesson). Record the before/after behaviour when the wrist lowers mid-scan.
- **AC6 — the system Wake Duration setting is documented in the story's findings.** watchOS defaults to a 15-second wake and the user can raise it to 70 seconds; the app cannot change it. Whether that is worth surfacing to users is **out of scope here** and flagged for a separate decision, since it is app-wide guidance rather than a barcode-screen behaviour.

**Notes:** native change to the watch target → **not OTA-eligible**, needs a new binary. Touches `BarcodeFlashView.swift`, which Story 16.27 also edits — land one then rebase the other; the edits are in different regions (lifecycle blocks here, layout there) so the conflict should be trivial. Explicitly **not** in scope: any attempt to set brightness through a private API.

### Story 16.27: Fix Apple Watch barcode geometry — uniform module width, spec quiet zones, adaptive rotation

**As a** user presenting my Apple Watch to a checkout scanner, **I want** the barcode drawn with bars of consistent, correctly-sized width, **So that** the scanner decodes it instead of rejecting a symbol whose narrow bars vary by 50 %.

**Root cause (derived from the render path, not yet measured on device):** `BarcodeGenerator.renderCGImage` (`targets/watch/BarcodeGenerator.swift:313-364`) disables antialiasing (`:335`) and lays out each module boundary with `Int(round(acc))` (`:342`, `:349-350`), so every bar snaps to a whole pixel. Because the module width is not itself an integer, **1-module elements render at two different widths.** The available width is squeezed further by `quietZoneModules: 10` per side (`:74`), which is measured in modules and therefore consumes a fixed **17.4 % of the symbol's width** — an EAN-13 is 95 modules but 115 units. Computed across the supported watch sizes at `boxInnerPadding: 2` (`WatchPresentationLayout.swift:59`) and `@2x`:

| Watch | Width  | Content px | px/module (EAN-13) | Narrow bar renders as        |
| ----- | ------ | ---------- | ------------------ | ---------------------------- |
| 40 mm | 162 pt | 316        | 2.75               | 2 px **or** 3 px — **1.50×** |
| 41 mm | 176 pt | 344        | 2.99               | 2 px or 3 px                 |
| 44 mm | 184 pt | 360        | 3.13               | 3 px or 4 px — 1.33×         |
| 45 mm | 198 pt | 388        | 3.37               | 3 px or 4 px                 |
| 46 mm | 208 pt | 408        | 3.55               | 3 px or 4 px                 |

**This is the mechanism Story 16.23 already proved** — but only the mechanism. Its investigation established that the narrow element is "the measurement every digit's classification normalises against", and pinned _Apple Vision_ failing at ≈2.83 px/module. **That number does not govern a checkout scanner** and must not be quoted as if it does: a supermarket lane runs Datalogic/Zebra firmware reading an analog reflectance waveform, not pixels, and is far more tolerant than Vision. What transfers is the physics — integer snapping produces genuinely unequal _physical_ bar widths, and every 1D decoder normalises against the narrow element, so a 50 % error there is out of tolerance for any of them.

**Magnification: the symbol is undersized on every watch, and that cannot be fixed.** Apple Watch displays are ≈326 ppi ≈ **12.8 px/mm** (cross-checked: 41 mm is 352 × 430 px over a 904 mm² display → 12.9 px/mm), so 1 px ≈ 0.078 mm. Against the EAN-13 nominal 0.33 mm module, an integer snap gives 3 px = 0.234 mm = **71 %** or 4 px = 0.312 mm = 95 %; the ISO 15420 floor is 80 %, and hitting it needs 115 × 4 = **460 px**, which **no watch has on its short axis and only 45/46/49 mm have on the long axis.** So a spec-compliant EAN-13 is physically impossible on most Apple Watches. That is not a reason to refuse to draw: the 80 % floor is a **print** specification calibrated for ink spread on paper scanned by laser at distance, and an emissive high-contrast screen read at 10 cm is a different regime — which is why scanning barcodes off phone screens works routinely at sizes print would reject. **Uniformity and contrast are the levers available here; size is not.**

**Acceptance Criteria:**

- **AC1 — the module width is an integer number of device pixels.** Compute `module = floor(availablePx / totalUnits)`, render every element as an exact multiple of it, and centre the remainder in the quiet zone. Bar-width variance across the whole symbol becomes **zero by construction**, not by tuning. **Follow the QR path, which already does exactly this** — `renderQRCodeImage` computes `floor(min(widthPx / extent, heightPx / extent))` and centres the result (`BarcodeGenerator.swift:392-395`, `:425-431`). The linear renderer is the odd one out; this is a consistency fix with a working in-repo precedent, not a new design.
- **AC2 — maximise the integer module, and never refuse to draw.** Choose the largest integer module the available space affords and record the magnification achieved; do **not** gate on the 80 % print floor, which (see above) would blank the barcode on most of the supported line-up. A smaller uniform symbol decodes; a larger jittery one does not.
- **AC3 — linear barcodes rotate 90° only when the long axis yields a strictly larger integer module,** per the decision on 2026-08-02. Horizontal stays the default; rotation is the fallback the geometry forces, not a style choice. The predicate is a computed consequence of AC1, not a hardcoded device list, and it must be **stable**: key it off a value that cannot oscillate during layout (or apply hysteresis), because a fractional wobble in `geometry.size` flipping orientation mid-view is worse than either orientation.
- **AC4 — quiet zones follow the symbology, not a single constant.** EAN-13 requires 11 modules leading and 7 trailing (18 total), not the current symmetric 20; Code128 requires 10 each side. `quietZoneModules: 10` is passed as one literal for every format today.
- **AC5 — unit counts are computed per symbol.** A 13-digit Code128 encodes to ≈123 modules against EAN-13's 95, so it needs ≈24 % more width and will cross the rotation threshold on more devices. Nothing may assume EAN-13's geometry.
- **AC6 — the margin reclaim is taken, including the toolbar.** Drop `boxInnerPadding` from 2 to 0 (outer padding is already 0, `WatchPresentationLayout.swift:57-58`) **and hide the navigation bar on this screen** — `BarcodeFlashView.swift:102` sets `.navigationTitle(titleText)`, and the `GeometryReader` does not ignore the safe area, so the title bar is consuming exactly the long-axis height that AC3's rotation depends on. This is the cheapest space win in the story and directly answers the original "use as much space as possible" request.
- **AC7 — the generated image and its frame agree exactly.** `updateBarcodeTargetSize` rounds the target **down** (`BarcodeFlashView.swift:146-149`) while the `.frame()` at `:40` uses the **unrounded** `layout.barcodeSize`, so SwiftUI rescales by a fraction of a pixel and `.interpolation(.none)` resolves it by **duplicating a pixel column — reintroducing the exact ±1 px jitter this story exists to remove.** Integer-snapping the generator is worthless unless the seam holds; assert the parity, do not assume it.
- **AC8 — a layout contract test covers the geometry** across the full supported device table, following the existing `targets/watch/__tests__/watch-layout-contract.test.ts` pattern, asserting: integer module width, correct per-symbology quiet zone, the rotation predicate **and its stability**, and the AC7 frame/image parity. The existing `widthFillRatio` (`WatchPresentationLayout.swift:85`) already exists so fill can be measured rather than eyeballed — extend that idea rather than replacing it.
- **AC9 — the boundaries are defined, not discovered in the field.** An oversized payload (a 20-character alphanumeric Code128 is ≈250 modules and is illegible at any orientation) gets a **defined** behaviour rather than an unreadable smear; a short payload (EAN-8 is 67 modules) **grows** its module to use the space rather than leaving it blank; and the hardcoded `barcodeTargetSize` default of `156 × 88` (`BarcodeFlashView.swift:13`) no longer causes a first render at the wrong size — with rotation added that becomes a visible orientation flip on appear.
- **AC10 — validated against a real scanner, not a screenshot.** Module width, contrast and quiet zone are all invisible in a simulator capture. Verify on a physical Apple Watch at a real supermarket lane for both a rotated and a non-rotated device, and record which sizes were covered. Note the rotation assumption being tested: flatbed lanes (Datalogic Magellan, Zebra MP7000) are omnidirectional and genuinely do not care, but a **single-line handheld laser does** — if the field result contradicts AC3, the predicate is what changes.
- **AC11 — the QR path is untouched.** QR keeps its existing square-fit branch and 112 pt floor (`WatchPresentationLayout.swift:66-71`) and its phone-pre-rendered `barcodeImageBase64` fast path (`BarcodeFlashView.swift:118-124`); it is 2D and does not share this failure mode.

**Notes:** the barcode **image cache key already includes the target size** (`BarcodeGenerator.swift:45`) and `cacheVersion` is `watch-barcode-v2` — bump it so no device serves a stale pre-fix image. Native change → **not OTA-eligible**. Touches `BarcodeGenerator.swift` (shared with 16.28) and `BarcodeFlashView.swift` (shared with 16.26). ⚠️ **The px/module table is computed from source, not measured on hardware** — unlike Story 16.22's and 16.23's numbers — and it assumes `geometry.size.width` approximates the full screen width, which the safe area and the (soon-removed, AC6) nav bar make **optimistic**. Treat the table as a lower bound on the problem and re-measure on device as the first implementation task; AC10 is what converts it into evidence. Out of scope and flagged: Story 10.4 plans to port `WatchBarcodeLayoutMetrics.make` to Wear OS and should inherit this fix rather than the current maths.

### Story 16.28: Render EAN-8, UPC-A and Code39 with their real symbologies on Apple Watch

**As a** user whose loyalty card is an EAN-8, UPC-A or Code39 barcode, **I want** my watch to show that card in the symbology it actually is, **So that** a checkout scanner accepts it instead of reading a barcode that claims to be something my card is not.

**Defect:** `BarcodeGenerator.generateImage` maps three of the six supported formats onto a fourth — `case .EAN8, .UPCA, .CODE39: modules = encodeCode128(value: value)` (`targets/watch/BarcodeGenerator.swift:57-59`), commented "pragmatic fallback: render as Code128 so scanners can still read it". Introduced 2026-02-16 in `1d6cf7f` and unchanged since. The watch therefore draws a **valid Code128 symbol carrying the right digits under the wrong symbology**. A POS lane that expects EAN-8 and has Code128 disabled for loyalty rejects it outright; one that accepts it reports a different symbology identifier than the same card scanned from the physical plastic. The file's own doc comment concedes the gap — "Supports EAN-13, Code128, and QR" (`:37-38`) — while the enum advertises six (`:15-22`).

**Acceptance Criteria:**

- **AC1 — EAN-8, UPC-A and Code39 each get a real encoder** in `BarcodeGenerator`, alongside the existing `encodeEAN13` (`:95`) and `encodeCode128` (`:164`). EAN-8 is 8 digits with its own check-digit weighting; UPC-A is 12 digits and is **not** EAN-13 with a leading zero at the module level even though it decodes as such; Code39 is alphanumeric with `*` delimiters and a different module structure.
- **AC2 — check digits are validated the way EAN-13 already is.** `encodeEAN13` accepts 12 digits and computes the check, or 13 and validates it, returning `nil` on mismatch (`:95-107`). The new encoders follow the same contract so a corrupt payload fails visibly rather than rendering a wrong-but-plausible symbol.
- **AC3 — an unsupported or unencodable value returns `nil`** and the view falls back to the existing value-text placeholder (`BarcodeFlashView.swift:167-183`), which shows the human-readable number for manual keying. Silently substituting a different symbology is exactly the defect being removed and must not survive anywhere in the switch.
- **AC4 — encoder output is unit-tested against known-good module sequences** in `watch-ios/Tests/BarcodeGeneratorTests.swift`, which already covers the existing encoders. Test vectors come from published reference symbols, not from this implementation's own output.
- **AC5 — validated on a real scanner per symbology.** One card of each of the three formats is scanned at a physical lane. This is the only AC that can prove the fix, and it cannot be met in a simulator.
- **AC6 — the six-format contract is unchanged.** `barcodeFormatSchema` (`core/schemas/card.ts:16-23`) is a cross-platform sync contract shared with watchOS and Wear OS; Story 16.23 already fixed the supported set by decision. This story implements three of the six properly, it does not add or remove any.
- **AC7 — inherits Story 16.27's geometry.** These symbologies have different module counts from EAN-13, so they must go through the same integer-snap, per-symbology quiet zone and rotation predicate rather than carrying their own maths.

**Notes:** **written down explicitly at ifero's request on 2026-08-02 so it does not get lost** — found while investigating the watch scannability reports, not reported from the field. **Corrects a stale claim in the tracker:** Story 10.4's research note states these formats "fall through leaving `modules` nil and generateImage returns nil", so "an EAN-8 card shows NOTHING on Apple Watch today". That was true before `1d6cf7f`; the current behaviour is the Code128 substitution above, which is harder to notice and arguably worse, since the user sees a plausible barcode that the lane may refuse. Wear OS (Story 10.4) sidesteps this entirely by using ZXing, which covers all six natively — this story closes the watchOS side of the same gap. Native change → **not OTA-eligible**. Shares `BarcodeGenerator.swift` with 16.27; land 16.27 first so the new encoders are written against the corrected renderer.

⚠️ **Watch Story 16.25 (map UPC-E instead of storing it as Code 128), drafted concurrently on `docs/16-25-map-upce-story`.** It is the phone-side sibling of this defect — a UPC-E scan is _stored_ with `barcodeFormat: CODE128` because `BARCODE_FORMAT_MAP` has no `upc_e` key — where this story is about correct _rendering_ of formats already stored correctly. They are complementary, not duplicates, but the option 16.25 picks changes this story's scope: its **option (a)** adds `UPCE` to `barcodeFormatSchema`, which would require a **fourth encoder here**; its recommended **option (b)** expands UPC-E to its 12-digit UPC-A parent and needs nothing extra from this story. Confirm which option landed before sizing. Both stories independently found and corrected the same stale Story 10.4 claim, which is corroboration rather than duplication.

### Story 16.29: Show brand logos instead of initials in the Apple Watch card list

**As a** user scrolling my cards on the watch at a checkout, **I want** to see each retailer's logo rather than two letters, **So that** I can pick the right card at a glance instead of reading text on a 40 mm screen.

**Context — most of this already exists in the wrong target.** The watch **complication** renders real brand logos: `targets/watch-widget/Assets.xcassets` ships **56 `BrandLogo-*.imageset` assets covering all 56 catalogue brands**, resolved through `BrandLogoCatalog` (`targets/watch-widget/BrandLogoCatalog.swift`) with `assetName(for:)` and a `prefersDarkBacking(for:)` helper for light artwork, backed by `BrandLogoCatalogData.knownBrandIds` / `lightLogoBrandIds` in `Generated/BrandLogoCatalog.generated.swift`. Both generated files come from `watch-ios/Scripts/generate-catalogue.swift`, which reads `catalogue/italy.json` **and** the imageset folder so the two cannot drift. The watch **app** has none of it: `targets/watch/Assets.xcassets` contains only `AccentColor.colorset` and `AppIcon.appiconset`, and `CardRowView.logoView` (`targets/watch/CardListView.swift:369-393`) draws `initials(from:)` on a brand-coloured circle. This is an asset- and target-membership problem, not a design problem.

**Acceptance Criteria:**

- **AC1 — a card whose `brandId` resolves to a known brand shows that brand's logo** in the 30 pt row avatar (`WatchCardRowLayoutMetrics.compact.avatarSize`, `WatchPresentationLayout.swift:31`), clipped to the existing `Circle()` (`CardListView.swift:334-335`).
- **AC2 — initials remain the fallback, on two distinct paths:** a custom card (`brandId` nil, the `else` branch at `:381-392`) and a catalogue brand with no bundled imageset. `BrandLogoCatalog.normalized(_:)` already gates on `knownBrandIds` membership and returns `nil` for unknown brands, so the second path is a real branch even at today's 56-of-56 coverage — a brand added to `catalogue/italy.json` without a PNG must degrade to initials, not to an empty circle.
- **AC3 — light and white logos stay legible** via the existing `prefersDarkBacking(for:)` dark chip. The row background is `#1C1C1F` (`:359`), so a white-on-transparent logo would otherwise vanish. Reuse the widget's decision rather than re-deriving it.
- **AC4 — the brand accent bar and favourite star are unchanged.** The 5 × 28 pt accent rectangle (`:329-331`) and the trailing star (`:347-352`) keep their current behaviour and colours; only the avatar's content changes.
- **AC5 — accessibility is unchanged.** The row stays a single combined element labelled by `cardRowAccessibilityKey(isFavorite:)` (`:283-287`, `:366`). The logo is decorative — it must not introduce a second VoiceOver element or replace the card name in the label.
- **AC6 — the assets reach the watch app target without a second source of truth.** The watch app and the widget are separate targets with separate asset catalogues, and `@bacons/apple-targets` generates the Xcode project from the folder layout, so membership follows the files. Extend `watch-ios/Scripts/generate-catalogue.swift` to emit for both targets rather than hand-copying 56 imagesets, and make `BrandLogoCatalog` reachable from both without duplicating its logic.
- **AC7 — the watch app's binary size increase is measured and recorded.** 56 imagesets are being added to a target that has none; the watch app is size-sensitive and the number belongs in the story record.
- **AC8 — the add-a-brand checklist is updated** to name the new asset location, so a future brand does not ship with a complication logo and an initials-only list row.
- **AC9 — verified on device in both a light and a dark watch face context,** with at least one dark-backing brand, one normal-logo brand, and one custom card visible in the same list.

**Notes:** native change → **not OTA-eligible**. **Independent of Stories 16.26–16.28** — it touches `CardListView.swift`, the asset catalogues and the generator script, none of which those three edit, so it can run in parallel or ship first. ⚠️ `expo prebuild` rewrites tracked files inside the watch target's asset catalogue (the `AppIcon` `Contents.json` is a known case and is `.prettierignore`d for exactly this reason) — confirm which files under `targets/watch/Assets.xcassets` are prebuild-owned before adding generated content next to them. Out of scope: changing the logo artwork itself, and bringing logos to the barcode flash screen.

### Story 16.34: Fix the `encodeEAN13` crash on non-ASCII numerals

**As a** user whose card number contains a character that merely looks like a digit, **I want** the watch to fall back to the readable number, **So that** opening the card does not crash the app.

**Root cause, reproduced not inferred.** `encodeEAN13` (`targets/watch/BarcodeGenerator.swift`) parses digits with `value.filter { $0.isWholeNumber }.map { Int(String($0))! }`. `Character.isWholeNumber` is `true` for numerals outside ASCII, but `Int(String(_:))` returns `nil` for them, so the force-unwrap traps. The shipped encoder, compiled standalone on Swift 6.3.3, exits **133 (SIGTRAP)** for `٣901234123457`, `590123412345Ⅷ` and `㉈901234123457`, while returning the correct module array for `5901234123457`. Reachable through manual entry, not through scanning: `core/schemas/card.ts:45` types `barcode` as a bare `z.string()`, `features/cards/components/CardForm.tsx:42` validates only `.min(1)`, and `keyboardType="number-pad"` is a soft keyboard hint that blocks neither paste nor an IME. The OS decoders emit ASCII, so a scanned card cannot reach it. Found during **Story 16.28**, which fixed this exact defect in the two encoders it introduced but was forbidden by its own guardrails from touching `encodeEAN13`.

**⚠️ Parsing more leniently is the wrong repair.** Three different wrong readings hide behind `isWholeNumber`: `Int(String("٣"))` is `nil` and traps; `"Ⅷ".wholeNumberValue` is `8`, which would encode a digit the card does not contain; `"㉈"` is `10`, which would index past the ten-entry pattern tables. Silently dropping such a character is no better — it encodes a **shorter number than the one stored**, the silent-wrongness class Story 16.28 exists to remove.

**Acceptance Criteria:**

- **AC1 — `encodeEAN13` no longer traps.** It uses the same `asciiDigits(of:)` helper as `encodeEAN8` and `encodeUPCA`, so a value carrying a non-ASCII numeral returns `nil` and the view falls back to the human-readable placeholder.
- **AC2 — no behaviour change for any value that works today.** Separator tolerance survives (`"5901234-123457"` still encodes), 12 digits still computes the check digit, 13 still validates it, and a bad checksum still returns `nil`.
- **AC3 — byte-identical output for valid input.** `encodeEAN13("5901234123457")` produces exactly the module array it produced before the change, cross-checked against BWIPP.
- **AC4 — CI enforces it.** `encodeEAN13` joins the executed-Swift contract harness in `targets/watch/__tests__/watch-barcode-symbology-contract.test.ts`, with reference symbols covering the 13-digit validate path, the 12-digit compute path and separator tolerance. Reintroducing the force-unwrap must fail the suite. ⚠️ The 12-digit vector must **discriminate**: `ean13CheckDigit` weights 12 data digits `1,3,1,…` and `upcEANCheckDigit` weights odd-length data `3,1,3,…`, and the two agree whenever `(sum of even-index digits − sum of odd-index digits) % 5 == 0` — so the obvious `590123412345` cannot detect the helpers being swapped.
- **AC5 — all five linear formats are then trap-free.** No `Int(String($0))!` remains anywhere in `BarcodeGenerator.swift`.

**Notes:** native change → **not OTA-eligible**. **Depends on Story 16.28**, which introduces `asciiDigits(of:)` and the executed-Swift harness — land it first. **Out of scope and flagged:** phone-side input validation, which is _why_ this is reachable but is a product decision about the phone UI rather than a watch fix (the phone already fails these values gracefully — bwip-js throws and `BarcodeRenderer` catches it — so the watch was the only crash surface). **`encodeCode128` was checked and does not share the defect:** it validates `ch.asciiValue` for every character up front and returns `nil` on failure, so its later `asciiValue!` uses are unreachable when `nil`.

### Story 16.38: Give the Wear OS barcode the whole screen, as watchOS now does

**As a** user presenting my Wear OS watch at a checkout, **I want** the barcode drawn as large as the display allows, **So that** the scanner reads it as reliably as it does from the Apple Watch.

**Raised by ifero while reviewing Story 16.27:** _"this is also valid for android, which I recall made the same mistake as you did by making it too narrow."_ Confirmed from source rather than from memory. `watch-android/app/src/main/kotlin/com/iferoporefi/myloyaltycards/wear/barcode/BarcodeLayoutMetrics.kt` states in its own doc comment that it is _"ported from watchOS's `WatchBarcodeLayoutMetrics.make`"_ and that _"the linear `0.52`-of-height / 88–110 clamp are reproduced verbatim"_ — so it inherited every sizing decision Story 16.27 has now reversed: `BOX_INNER_PADDING = 2`, `LINEAR_HEIGHT_RATIO = 0.52`, `LINEAR_MIN_HEIGHT = 88`, `LINEAR_MAX_HEIGHT = 110`.

It is **narrower still** than watchOS was. On a round display it additionally inscribes the entire box — title, symbol and value — in the circle (`boxW² + boxH² ≤ D²`), and its own documentation concedes the fill ratio can fall below 0.8 under roughly 181 dp of diameter.

**What Story 16.27 established and this should inherit:**

1. Bar height is the **whole cross axis**, not 52 % of it clamped to 88–110. Bar height costs the module nothing — the module divides the length axis — and a taller bar is strictly easier for a scanner to intersect and to aim at.
2. `boxInnerPadding` is 0: an invisible white inset inside a white card that cost real width.
3. Reclaim every safe-area edge the system does not draw into, and only those.
4. **The largest lever:** size the module against the **symbol's** modules, not the symbol plus its quiet zone. A quiet zone is white space; making it compete for pixels at a bar's price is what held the symbol narrow. The leftover becomes the quiet zone, split in the symbology's own ratio with a guaranteed floor per side. On watchOS this alone took a 40 mm from 2 px per module to 3 (0.156 mm → 0.234 mm, **+50 %**) and a 46 mm from 3 to 4 (**+33 %**), measured on device.

**⚠️ Establish before sizing, do not assume.** Wear encodes with ZXing's `MultiFormatWriter` into a `BitMatrix` at a requested pixel size (`WearBarcodeGenerator.kt`, rasterised by `BarcodeBitmap.toBarcodeImageBitmap`). The **module-quantisation** half of Story 16.27 — every bar an exact whole number of device pixels — may already be handled by ZXing's own scaling, or may not be. Check what ZXing produces at an arbitrary requested width before porting the integer snap. The **sizing** half above applies either way.

**Acceptance Criteria:**

- **AC1 — the symbol is sized against its own modules.** The module divides the symbol's bars and spaces; the quiet zone takes the remainder, in the symbology's ratio, never below a documented floor per side.
- **AC2 — the bar spans the whole cross axis,** and `boxInnerPadding` is 0.
- **AC3 — every safe-area edge the system does not draw into is reclaimed,** and the ones it does are kept, with the reason recorded at the call site as on watchOS.
- **AC4 — round screens get their own answer.** The inscribed-circle clamp is a real constraint watchOS does not have, so "use the whole screen" is not the same instruction; whatever replaces it must still guarantee the symbol is not clipped.
- **AC5 — module uniformity is established, not assumed.** Either ZXing is shown to produce whole-pixel modules at the requested size, or the integer snap is ported.
- **AC6 — the improvement is measured, not asserted.** Record the module width achieved on a round and a square emulator, the way `BarcodeGeometry` does on watchOS.

**Notes:** native Kotlin → **not OTA-eligible**. Independent of Story 16.37 — different platform, no shared file. Story 16.27 is the reference implementation and its Dev Agent Record carries the measurements.

### Story 16.35: Ship the Wear OS APK to Play — the watch app has never been delivered to any track

**As an** internal tester who installed the newest RC on my phone, **I want** the Wear OS companion app to arrive on my watch with it, **So that** the watch app Epic 10 built is actually testable — and so that a released phone build can never again ship without the watch half nobody notices is missing.

**Root cause, established not inferred — this is not a regression.** The Wear OS app has no release or upload path at all, and never has. `beta-releases.yml` contains exactly two jobs (`ios-testflight-beta`, `android-beta`) and neither mentions `watch-android`. The Wear project's only pipeline, `wear-os-build.yml`, runs `./gradlew testDebugUnitTest assembleDebug` — debug, unsigned, never uploaded — and is path-filtered to `watch-android/**`, so it does not even run on an RC tag. `WEAR_VERSION_CODE`, the variable `watch-android/app/build.gradle.kts` reads to compute the Wear `versionCode`, appears in exactly two places in the repository: that build file and the README table describing it. No workflow sets it. Epic 10 closed with the release path parked in `watch-android/README.md` § Signing, Play and Asset Links, which says in its own words "Documented here, not configured here."

**⚠️ The Wear APK does NOT go on the phone's Play track.** Play requires a dedicated Wear OS **form-factor track**, whose id is `wear:` + the mobile track name (`wear:alpha`, `wear:production`), and it rejects an artifact declaring `uses-feature android.hardware.type.watch` uploaded to a mobile track — _"you must use dedicated Wear OS tracks and create new releases on these tracks"_ ([support.google.com/googleplay/android-developer/answer/13295490](https://support.google.com/googleplay/android-developer/answer/13295490); id rule at [developers.google.com/android-publisher/tracks](https://developers.google.com/android-publisher/tracks)). This requires a **one-time manual Play Console step** (Advanced settings → Form factors → Wear OS → Manage → "Use a dedicated release track for Wear OS"), without which every Wear upload fails with `Track not found`. Two consequences: the upload is still a **second `supply` call** (`:apk`/`:apk_paths` are declared `conflicting_options` with `:aab`/`:aab_paths`, and the phone ships an AAB while Wear ships an APK), but it needs **no `version_codes_to_retain`** — a separate track is a separate release, so the Wear upload cannot disturb the phone's. `versionCode` does remain globally unique per `applicationId` across form factors, so the band scheme still applies.

**Acceptance Criteria:**

- **AC1 — the RC pipeline builds and uploads the Wear OS release APK.** `beta-releases.yml`'s `android-beta` job produces a signed `watch-android` release APK and uploads it to the Play alpha track alongside the phone AAB, with `WEAR_VERSION_CODE` set from `GITHUB_RUN_NUMBER`.
- **AC2 — the production pipeline does the same** against the production track in `store-upload.yml`. Shipping AC1 alone would create a new trap: a production release that silently drops the watch app testers already have — a downgrade with no crash and no telemetry.
- **AC3 — the Wear APK is uploaded to its own `wear:` form-factor track, and both artifacts are built before either is uploaded.** Order: build phone AAB → build and signing-verify the Wear APK → upload phone → upload Wear, all in one job, so every non-Play failure happens while nothing has been uploaded. `skip_upload_aab: true` on the Wear call; **no** `version_codes_to_retain` (a separate track has nothing of the phone's to preserve). A `Track not found` failure must be translated into the Play Console steps that fix it rather than surfaced raw. The reason for each constraint is written into the Fastfile, not left to review memory.
- **AC4 — a fourth versionCode band, with no possible collision.** `GITHUB_RUN_NUMBER` is per workflow file, so wiring both pipelines to the same expression would make beta run 40 and production run 40 both compute `2000040`. Wear alpha/beta stays `2_000_000 + run`; Wear production becomes `3_000_000 + run`. The `1_000_000` offset is a named constant in `watch-android/app/build.gradle.kts` (mirroring `PRODUCTION_VERSION_CODE_OFFSET` in `app.config.ts`) applied as arithmetic in the workflow, matching the phone's own precedent. The existing positive-integer validation and `2_100_000_000` ceiling check must still apply to the larger value.
- **AC5 — the Wear APK's signing certificate is verified against the phone's before upload.** Inject the phone's keystore via the `android.injected.signing.*` properties the phone lane already uses, then assert with `apksigner verify --print-certs` that the two certificate SHA-256 fingerprints match, failing the job on mismatch. An unsigned APK fails loudly at Play; a wrong-key APK uploads cleanly and breaks the Wearable Data Layer silently, with no Android telemetry to surface it. The fingerprint is echoed to the log because the Digital Asset Links entry needs it.
- **AC6 — a missing Wear artifact fails the release** with a named error rather than degrading to a phone-only upload, the same stance as `android-release.yml`'s `if-no-files-found: error`.
- **AC7 — the Wear release variant is built in CI on every PR that touches it.** `wear-os-build.yml` gains `assembleRelease`. `watch-android/app/proguard-rules.pro` already records the hazard in its header: CI builds only the debug variant, so nothing would catch R8 mis-optimising the barcode path in the release APK — the build users receive. AC1 makes that untested variant the shipped one.
- **AC8 — the documentation stops lying.** `watch-android/README.md` § Signing, Play and Asset Links describes the real wiring instead of "Documented here, not configured here", the band table gains its fourth row, and § CI's "no release build" bullet is corrected. `docs/cicd.md` gains the Wear artifact in its pipeline description and post-release checklist.
- **AC9 — verified on a real release.** No local run can exercise the Play Console, so the story is not done until an RC has been cut, the alpha track release is confirmed to list two version codes, and the watch app is confirmed to install on a paired Wear OS device. Record both version codes and the certificate fingerprint in the Dev Agent Record.

## **Notes:** delivery only — no change to the Wear app's behaviour, UI or dependencies. **Out of scope and flagged:** the Digital Asset Links publication (a Play Console + hosted-file task owned by @ifero; AC5 produces the fingerprint it needs), Play Console store-listing assets for the Wear form factor, promoting the draft release (the beta lane keeps `release_status: "draft"` and promotion stays a deliberate human action), `./gradlew lintDebug` in CI, and the monochrome launcher icon — the last two already recorded under the README's Known gaps. **Toolchain cost accepted deliberately:** AC3's same-job requirement merges Node + `expo prebuild` with JDK 17 + Android SDK 36 in one job; that is slower than two parallel jobs and is the price of not racing a Play track edit. **The one thing that cannot be proven from this repository** is whether `version_codes_to_retain` composes cleanly with an existing _draft_ release on the same track — that is Play Console behaviour, and AC9 is the gate. **Retro material:** Epic 10's definition of done stopped at `assembleDebug` while its own README predicted this exact failure in prose; a gap recorded only in Markdown has no CI status check and is indistinguishable, at release time, from a gap nobody noticed.

### Story 16.36: Nightly internal-track builds for all four apps, skipped when nothing that ships has changed

**As** ifero, distributing myLoyaltyCards to internal testers, **I want** a nightly build of all four apps pushed automatically to the internal tracks — iOS + Apple Watch to TestFlight, Android phone + Wear OS to Play — and skipped entirely on nights when nothing that can reach a binary has changed, **So that** testers always have yesterday's `main` on every device without anyone cutting an RC by hand, and a quiet week costs no CI minutes.

**This implements a ratified decision, it does not make a new one.** `docs/architecture.md:414-426` has specified the Dev distribution posture from the start — iOS → **TestFlight**, Android → **Internal Track**, Trigger → push to main, Approval → **none** — and `docs/project-context.md:412-419` repeats it. The implementation drifted to Play's `alpha` track and the Dev trigger was never built at all: `grep -rn "schedule\|cron" .github/` returns **zero** matches across all 11 workflow files. Justification for the CI spend is the Epic 16 retro's own finding (`epic-16-retro-2026-07-11.md:68`) that "the CI sandbox can't run native/browser/release paths, so a class of defect only appears at the device gate" — and `runtimeVersion.policy` is `appVersion`, so **no native change can ship OTA**; a binary is the only way a native, watchOS or Wear OS change reaches a tester.

**⚠️ `paths:` filters do not work on a `schedule:` trigger.** GitHub applies `paths`/`paths-ignore` only to `push` and `pull_request`. The repo's "did code change?" logic exists twice already, as `on.push.paths` allow-lists in `ios-release.yml:10-45` and `android-release.yml:10-42` (Story 11.2's legacy), and a cron run gets none of it — so the decision must be computed in-job from a git diff against a remembered baseline. Copying the list in would make a **third** divergent copy, and the two that exist have already diverged: **`modules/**`is missing from both**, so a change to the tracked local Expo module`modules/wear-data-layer/` triggers no build today. That is already an open Epic 10 retro action item, and the Epic 10 retro (§6) explicitly parked widening as "a CI-policy change" needing its own story.

**⚠️ A new workflow file is a fifth `GITHUB_RUN_NUMBER` counter, and it collides.** Run numbers are scoped per workflow file — the reason `watch-android/app/build.gradle.kts` carries a four-band `versionCode` scheme. `nightly-builds.yml` run 40 would compute `versionCode 40` for the phone and `2_000_040` for Wear, colliding with RC run 40 on both. Two new bands are required (`4_000_000` phone nightly, `5_000_000` Wear nightly), and `WEAR_RELEASE_TRACK` — binary today, mapping anything but the literal `production` to the beta band — must become three-state.

**✅ Dependency discharged — PR #218 merged as `fe0febc` (2026-09-03), and this story is baselined on it.** `wear_play_track(phone_track)` (`fastlane/Fastfile:372-378`) reads `ENV['WEAR_PLAY_TRACK']` and only falls back to `wear:<phone_track>`; `available_play_tracks` lists the app's real tracks on `Track not found`. So the nightly needs **no Fastfile change** for the track — it needs no `WEAR_PLAY_TRACK` at all — the derived `wear:internal` is correct. ⛔ **CORRECTED 2026-09-07: this paragraph previously asserted that `wear:qa` is the well-known internal-testing name and that `wear:internal` does not exist. Both halves are wrong for this listing, and acting on them cost three nightlies.** [Google's docs](https://developers.google.com/android-publisher/tracks) really do document the internal-testing track as `qa`; the Play API disagrees, and the API is authoritative. **✅ This app's real Wear track inventory, read live from the Play Publishing API on 2026-09-07:** `wear:internal`, `wear:alpha`, `wear:beta`, `wear:production`. This **supersedes** the 2026-09-03 "confirmed by ifero" entry, which recorded `qa` + `alpha` — that reading came from Play Console _display names_ rather than API _identifiers_, and `wear:qa` does not exist. All four derive correctly from their phone counterparts, so no lane needs an override. **That retires an earlier draft's claim that Wear delivery was still broken on the release lanes:** the derived fallback is correct for the RC lane, which therefore needs no override. rc.21's `Track not found: wear:alpha` was true when it happened; the track was created afterwards. The derivation is still not a general rule, which is why the override must stay — the phone's `internal` has no counterpart, because the Wear internal track is named `qa`, and that single gap is the whole reason this story sets `WEAR_PLAY_TRACK`.

**The Apple Watch needs no new upload path and must not get one** — ADR-2026-04-11-002 (`docs/architecture.md:171-187`): there is no standalone watchOS upload to App Store Connect or TestFlight; the watch app and complication are embedded targets wired by `apply_distribution_signing` for every lane. One TestFlight upload delivers all three.

**Acceptance Criteria:**

- **AC1 — one new workflow, with two first-class entry points.** `.github/workflows/nightly-builds.yml`: a single daily cron at an off-peak minute, plus a `workflow_dispatch` that is a supported way to use the pipeline rather than an escape hatch (full input contract in AC13), a concurrency group so cron and dispatch cannot double-upload, and `timeout-minutes` on **every** job — the existing release workflows set none, and an unbounded `macos-latest` job is the most expensive failure mode in the repo. Documented constraint: `schedule:` only ever runs the default branch's copy of the file, so a dispatch is the only way to exercise this workflow before it merges.
- **AC2 — a preflight job decides per platform, and both decisions are visible.** One `preflight` job resolves a per-platform baseline, diffs it against `HEAD`, and emits `build_ios` / `build_android` outputs the build jobs gate on. `force` sets both. The job summary states each platform's baseline SHA, decision, and triggering paths — a skipped night must be legible in the Actions UI without opening logs, because a silent green is indistinguishable from a broken cron.
- **AC3 — the "can this reach a binary?" definition becomes a single source of truth, checked in CI.** The allow-list moves into one committed config the nightly reads, and a new drift guard (`yarn check:build-path-filters`) fails when `ios-release.yml` / `android-release.yml`'s `on.push.paths` disagree with it. `on.push.paths` cannot reference an external file, so the duplication is irreducible and must instead be made loud. Per `CONTRIBUTING.md:270` the guard goes into `.husky/pre-push`, `ci-quality-gates.yml` **and** both ordered lists in `CONTRIBUTING.md:272-300`.
- **AC4 — the path lists gain what they are missing.** `modules/**` added to both existing release workflows; `watch-android/**` added to the nightly's Android set (its absence from `android-release.yml` is correct there — `fastlane android adhoc` builds no Wear artifact — but the nightly ships the Wear AAB); the nightly workflow file and the AC3 config added to the set. The negative patterns and their load-bearing order stay.
- **AC5 — the baseline is durable and fails OPEN.** Two moving lightweight git tags, `nightly/ios` and `nightly/android`, force-pushed with the default `GITHUB_TOKEN` (`permissions: contents: write`) only **after** a successful upload. Chosen over `actions/cache` (evicted after 7 unused days) and over Actions-API reconstruction (a skipped run is also `conclusion: success`). No baseline → build. **⚠️ Verify — do not reason — that the tag names match no existing `push: tags` pattern**; `store-upload.yml` fires on `v*.*.*`, and a nightly tag that matched would trigger a production store upload every night. `GITHUB_TOKEN` rather than `STORY_BOT_TOKEN` is a second guard: its pushes trigger no workflow runs.
- **AC6 — two new versionCode bands.** `4_000_000` phone nightly (workflow arithmetic, matching `store-upload.yml`, because `app.config.ts` reads one env var at prebuild) and `5_000_000` Wear nightly (applied **in `build.gradle.kts`**, whose comment forbids the alternative: "Do not 'restore consistency' with the phone by moving the arithmetic into YAML"). `WEAR_RELEASE_TRACK` becomes three-state, with a typo still landing on the beta band. The positive-integer validation and `2_100_000_000` ceiling must still hold, verified against real builds. Document the consequence: nightly codes are **higher** than production codes, so a device on a nightly never receives a production build as an update.
- **AC7 — Android goes to Play `internal`, and Wear to `wear:internal`.** ⛔ **CORRECTED 2026-09-07 — this AC previously read `wear:qa` and explicitly ruled out `wear:internal`; it had it backwards.** `wear:internal` is exactly what this listing has, and `wear:` + the phone's track name derives correctly for all four tracks. No override is needed at all: this listing's Wear form factor has `internal`, `alpha`, `beta` and `production`, so every phone track derives correctly. The `WEAR_PLAY_TRACK` seam (on `main` via #218) stays for a future hand-named **closed** track, and `ensure_wear_track_exists!` now validates the derived destination against Play's live track list before anything is built. **Do not add a second override, a lane parameter or a `WEAR_TRACK_PREFIX` variant** — `Fastfile:369-370` names the env var as the sanctioned seam. Confirm `available_play_tracks`' diagnostic is reached from the nightly lane rather than assuming it.
- **AC8 — nightly uploads are `completed`, not `draft`, and the reason is in the Fastfile.** The RC lane's `draft` is deliberate so promotion stays human; a nightly whose purpose is unattended delivery cannot require a nightly click. This divergence is the most likely thing for a future reader to "fix" back.
- **AC9 — iOS reuses the existing TestFlight path unchanged.** Same semantics as `fastlane ios beta`, including `latest_testflight_build_number + 1` — the only build number in the repo derived from remote state, therefore workflow-independent, therefore needing no band. `upload_to_testflight` is called bare today (no `groups:`), which delivers to App Store Connect **internal** users only — already exactly "the internal track" for iOS, so **do not add a tester group**. The prebuild + `watch-ios/Scripts/generate-catalogue.swift` step must be present or the watch ships a stale brand catalogue.
- **AC10 — a failed nightly is loud, a skipped one is not a failure.** Reuse `ci-quality-gates.yml`'s optional-`SLACK_WEBHOOK_URL` pattern. A skip is a green run with an explanatory summary — never a red X and never a warning annotation, or the common case trains everyone to ignore the signal.
- **AC11 — the documentation describes the real pipeline.** `docs/cicd.md` gains the nightly in its diagram, workflow list, a change-gate/baseline-tag section and a "the nightly did not ship" runbook (Epic 11 retro action #2 makes this a standing obligation). `watch-android/README.md` gains the two band rows **and** has its APK-era wording corrected (`build_wear_apk!`/`upload_wear_apk!` and the "No Fastlane lane for the watch APK" known gap are both superseded). `CONTRIBUTING.md` gets the AC3 gate-list entries plus a note that changes outside the path set produce no nightly.
- **AC12 — verified on real runs, recorded in the Dev Agent Record.** The cron fires; a `[skip ci]`-only night skips both platforms; a real-change night ships both; TestFlight carries the Apple Watch; Play `internal` shows `4_000_000 + N`; **`wear:internal` shows `5_000_000 + N` and installs on a paired device** (⛔ this was the story's highest-risk item and it FAILED: the shipped value was `wear:qa`, which does not exist, and three nightlies died on it. The track inventory is no longer "unverifiable from the repo" — `ensure_wear_track_exists!` reads it from the API before anything is built); both baseline tags advanced and triggered no `v*` workflow.
- **AC13 — `workflow_dispatch` is a real testing tool, with four inputs and one hard rule.** Asked for explicitly by ifero ("I would also like the nightly to be manually triggered too if I need to run some tests"); a `force`-only boolean is not enough, because the expensive half (iOS, 10× `macos-latest`) and the irreversible half (a burnt TestFlight build number / Play `versionCode`, a build pushed to real testers) are separable and a tester needs them independently. Inputs: **`platform`** (choice `both`/`ios`/`android`), **`force`** (boolean, **default true** on dispatch — a manual run's point is to build regardless, and a dispatch that silently skipped would be indistinguishable from a broken trigger), **`dry_run`** (build and verify everything, upload nothing — the input that makes this safe to experiment with), and **`ref`** (build a branch or tag). **⛔ The hard rule: a dispatch must NEVER move a baseline tag** — a `platform: ios` run knows nothing about the Android diff so would silently consume an unshipped change, a `force` run ships what the gate would have skipped, and a `dry_run` uploads nothing for a baseline to attest to. Implement as `if: github.event_name == 'schedule'` on the tag-move step — a one-event allow-list, not a chain of input checks a future fifth input could accidentally satisfy. A dry run must still leave signed artifacts behind: mirror #218's existing `if: always()` `wear-os-bundle-${{ github.run_id }}` upload (`beta-releases.yml:236-247`) for the IPA and phone AAB. Both entry points must reach the same code — nothing downstream branches on `github.event_name` except that tag-move step, or the thing tested by hand is not the thing that runs at 3am.

**Notes:** delivery infrastructure only — no change to app behaviour, UI or dependencies. **Enabling-story user outcome** (required by `docs/epics.md:35-39`): internal testers receive and can use yesterday's `main` on phone and watch, both platforms, with nobody cutting a release. **No FR/NFR assigned, per convention** — Epic 11 carried none and Story 16.35 added none; FR85 and NFR-M9 are free if an anchor is later wanted, and `docs/epics.md:180` records an existing FR-numbering desync, so do not assign one speculatively. **"Nightly" already means something else here:** `wear-os-build.yml:22-24` uses it for a cost-reduction downgrade of a PR job; this story inverts it into a distribution trigger. **Retired 2026-09-03 — an earlier draft flagged this as urgent and it is not:** setting `WEAR_PLAY_TRACK` on the RC lane. ifero confirmed a Wear closed track literally named `alpha` exists, so the release lanes' derived value is correct and nothing is owed. The one name still unconfirmed is `wear:production` for `store-upload.yml` — a well-known name Play provisions with the form factor, so very likely present, but confirm it before the next production release rather than mid-upload, since that lane commits the phone AAB first and a Wear failure there is a live phone-only release. Out of scope either way: this story never touches `production`. **Also out of scope:** unifying the versionCode counter onto a repo-global monotonic value (which would delete the band scheme — its own story; two new bands is the conservative move on purpose), extracting the four-times-duplicated setup preamble into a reusable `workflow_call`, adding `timeout-minutes` to the _existing_ release jobs, discharging the Epic 10 Wear-CI-paths item in full (AC4 fixes the release workflows, not `wear-os-build.yml`'s test trigger), downgrading `wear-os-build.yml` itself to nightly, TestFlight/Play tester-group management, nightly changelogs, and OTA/EAS Update as a cheaper channel (there is no `eas.json` in this repo, and OTA cannot deliver the native watchOS or Wear OS halves at all). **Fires DEC-E10-RETRO-002** — the four-sprint-parked Epic 5 generic-complication story's trigger is "when the Wear APK is published to Play". **Retro material:** every hazard in this story's banner was already written down somewhere in the repo — run-number scoping in three comments, the Wear track name in an open PR, the `modules/**` gap in an open action item — and none of it had a CI status check. AC3 is the first attempt in this family to answer 16.35's own retro note with a guard instead of a paragraph.

### Story 16.37: Fix the Apple Watch Code 128 stop pattern — every symbol ends two modules short

**As a** user who shows a Code 128 loyalty card on my Apple Watch, **I want** the symbol to carry its complete stop pattern, **So that** the checkout scanner can terminate the read instead of rejecting it.

**Root cause, confirmed by execution not inferred.** `encodeCode128` (`targets/watch/BarcodeGenerator.swift`) holds a local `widthsTable` mapping Code 128 code words to element widths. Index **106**, the STOP character, was `"233111"` — six elements, 11 modules. Code 128 specifies **`"2331112"`** — seven elements, 13 modules. The terminating 2-module bar was absent, so every Code 128 symbol the watch drew ended on a **space**. The shipped encoder, lifted verbatim and run under `xcrun --sdk macosx swift`, returned **121 modules** for `5901234123457`; BWIPP returns **123**, and the arrays are identical up to that missing trailing `2`. Four independent sources agree on the correct pattern: BWIPP's vendored source (`node_modules/@bwip-js/react-native/barcode.ps`, whose `code128` `encs` table has exactly 107 entries and ends `(211232) (2331112)`), bwip-js 4.10.1's `raw()` output, the executed Swift, and the width formula 11 × code words + 13.

**⚠️ The dead entries were not harmless.** The table held **110** entries where Code 128 defines code words 0…106. Indices 107-109 (`"211214"`, `"233111"`, `"211214"`) were unreachable — `encodeCode128` guards `c < widthsTable.count` and never appends above 106 — but they pushed the STOP out of the table's last slot, where a six-character entry stops looking wrong among six-character neighbours. A correct 107-entry table would have made the truncation visible.

**A third, independent cause** of the reported "most of the checkout scanners don't recognise the barcodes from the apple watch", separate from Story 16.27 (module quantisation) and Story 16.28 (wrong symbology for EAN-8/UPC-A/Code39). Code 128 is the **default fallback format** for manually entered cards, so its blast radius is the widest of the three.

**Acceptance Criteria:**

- **AC1 — the stop pattern is complete.** `widthsTable[106]` is `"2331112"`; every Code 128 symbol gains its terminating 2-module bar.
- **AC2 — the table has exactly 107 entries**, indices 0…106 with the stop last. The three unreachable duplicates are removed.
- **AC3 — no other change to any encoded symbol.** For every value, the fixed output equals the pre-fix output with `2` appended: the code-set decisions, the checksum and all preceding elements are untouched.
- **AC4 — output matches BWIPP.** `encodeCode128("5901234123457")` produces 67 elements / 123 modules, byte-identical to `bwipjs.raw({ bcid: 'code128', text })`.
- **AC5 — CI enforces it, permanently.** `encodeCode128` joins `HARNESS_DECLARATIONS` in the executed-Swift contract test, with BWIPP `REFERENCE_SYMBOLS` rows spanning every code-set branch and `UNENCODABLE` rows for the ASCII gate. ⚠️ A candidate vector must be **checked, not assumed**: Code 128's code-set switches are an optimisation, so several encodings of one text are valid, and this encoder's heuristics are simpler than BWIPP's — they diverge on `A12345` and `CARD 12345 ABC`, both of which still decode correctly.
- **AC6 — devices stop serving the short symbol.** `cacheVersion` is bumped past `watch-barcode-v3`; the cache key carries no renderer version of its own, so without a bump a cached card keeps returning the two-modules-short image.

**Notes:** native change → **not OTA-eligible**. **Sequencing:** shares `BarcodeGenerator.swift` and the `cacheVersion` bump with Story 16.27, which had not started when this was drafted (its branch pointed at `main` with no commits); the code regions do not overlap — 16.27 changes `renderCGImage` and `quietZone(for:)` — so whichever lands second takes a trivial rebase. **16.27 should inherit the corrected 123-module width**: its note that "a 13-digit Code128 is ≈123 modules" is right, but the shipped encoder produced 121, so a `modules.count`-driven layout would have been two units short. **Out of scope and flagged:** the encoder's non-minimal code-set switching (`A12345` costs one code word more than needed; both divergent values decode correctly, so this is symbol width, not correctness); `encodeCode128("")` returning a valid empty-payload symbol rather than `nil` (BWIPP does the same, and `CardForm.tsx:42` requires `.min(1)`, so it is unreachable). **Verified while confirming the defect and recorded so no one re-audits it:** all 107 shipped values at indices 0-106 match BWIPP exactly including the three start codes; twenty values encoded by the shipped Swift, given the missing element, decode back to their exact input text with a valid modulo-103 check; and the ASCII 32…126 gate still makes the encoder's later `asciiValue!` uses unreachable, as Story 16.34 established.

### Story 16.39: Full brightness on the card detail screen — by setting or by button

**As a** user holding my phone up to a checkout scanner, **I want** to put the card detail screen at full brightness with one tap, or automatically if I have asked for that, **So that** the scanner reads the barcode without me reaching into Control Centre — and without the app changing my screen brightness when I never asked it to.

**Reported by ifero, 2026-09-05**, while reviewing Story 16.26 (the watchOS half of the same complaint): _"the phone card details screen needs to be fully bright, not only the full screen one."_ Story 16.26 explicitly scoped the phone **out** on the grounds that "`useBrightness` already works there" — true of the hook, false of the screen.

**Measured state, not assumed.** `CardDetails.tsx` never called `useBrightness`; a repo-wide grep found its only non-test importers were `FullscreenBarcode.tsx` and `BarcodeFlash.tsx`, making the detail screen the one barcode surface that never maximised. **A second, wider defect surfaced while scoping:** `FullscreenBarcode` already contradicted itself — it maximises brightness _and_ rendered an "Increase brightness for scanning" hint. Both rows shared one key, `cards.details.brightnessHint`.

**⚠️ REDESIGNED MID-FLIGHT, 2026-09-07, BEFORE SHIPPING.** The first implementation maximised brightness on every visit, for everyone. ifero replaced that with user control: _"what if we add a button to increase the brightness? like 'on and off' … and add a setting toggle to automatically set brightness to 100% in card details (default is off)."_ The unconditional version passed two code reviews and three QA rounds and was still the wrong product — reviews ask whether the code matches the story, not whether the story is right. No released build ever carried it. Story 13.3's hint is therefore **replaced** by the button rather than merely deleted: removing it while shipping a default-OFF setting would have left the screen with neither advice nor control.

**Acceptance Criteria:**

- **AC1 — a Settings toggle governs the automatic behaviour, OFF by default.** Persisted beside the theme and language preferences. ⚠️ Only an explicit stored `'true'` enables it, so never-set, cleared or corrupted values read as off. **This inverts `isFirstLaunch`'s convention** (where unset means "yes") on purpose: being treated as a first launch is harmless, silently changing someone's screen brightness is not.
- **AC2 — a button on the card detail screen turns the boost on and off**, shows its state, and works in both directions — including turning the boost _off_ on a card while the setting has it on. **Icon-only, and a light bulb** (ifero, 2026-09-08 — _"isn't it faster to understand?"_): `lightbulb` filled means on, `lightbulb-outline` means off, so the state needs no caption. ⚠️ Dropping the caption makes two things load-bearing that it used to prop up — `accessibilityLabel` becomes the only thing a screen reader has for the control, and the tap target must be sized explicitly, since a circle around a 24 pt glyph is otherwise about half `TOUCH_TARGET.min`.
- **AC3 — the button lasts for that visit only.** Not persisted: the standing choice is the setting's job, and two sources of truth for one preference is how they drift. Returning to a card starts from the setting again, in both directions.
- **AC4 — FOCUS-scoped, not mount-scoped, and it survives backgrounding.** ⚠️ Expo Router keeps a pushed-under screen **mounted**, so a `useEffect` cleanup would never run when the user opens `/card/[id]/edit`. ⚠️ And `expo-brightness` documents that on iOS the level "will persist until the device is locked", so backgrounding must restore and returning must re-apply — `AppState` **`background` only**, never `inactive`, which iOS fires transiently while the app is still frontmost (a Control Centre pull) and where restoring would drop the brightness mid-scan.
- **AC5 — the fullscreen overlay is left exactly as it is.** It has maximised since Story 2.5, and enlarging a barcode is an explicit "I am about to scan this" gesture carrying its own consent. The setting governs the passive detail screen only.
- **AC6 — the stale hint is replaced on the detail screen and removed from the overlay**, and `cards.details.brightnessHint` deleted from both locales. New keys are added for the two controls, which **reverses the original story's "no new locale keys" constraint** — written when the change was a pure rendering-state change, and no longer applicable to a story whose point is two new controls.
- **AC7 — no regression** to tap-to-enlarge, copy, favourite, delete, the condensing header, or Story 9.1 usage tracking.
- **AC8 — brightness failure stays non-fatal.** Simulators and some devices reject the call outright.
- **AC9 — no new permission and no native change.** Activity-scoped `setBrightnessAsync` only; `setSystemBrightnessAsync` would need `WRITE_SETTINGS` and is banned here.

**Notes:** JS only → **OTA-eligible**, unlike its watchOS sibling Story 16.26 which needed a new binary because watchOS exposes no brightness API at all. First consumer of the shared `ToggleSwitch`, which has been exported with a `label` prop and no caller in the app. ⚠️ **A trap worth reading before touching the hook:** `useFocusEffect` runs its cleanup whenever its callback identity changes, not only on blur, so an implementation that clears the per-visit override in that cleanup makes the button undo itself — the two effects are split for this reason. **Out of scope and flagged:** a pre-existing race inside `useBrightness` where an in-flight `getBrightnessAsync()` can strand `originalBrightnessRef`; `BarcodeFlash.tsx` (`/barcode/[id]`), which still maximises unconditionally on the same argument as AC5 but has never been asked about; and making the boost configurable per card.

### Story 16.40: `BarcodeScanner`'s camera-error state is unreachable, so a failed permission request strands the user

**As a** user whose camera permission request fails outright — the OS never answers, as opposed to denying — **I want** the app to tell me and offer a way forward, **So that** I am not left staring at "Checking camera permission..." with no button to press.

**Found 2026-09-14 while implementing Story 16.24**, where the error branch's Retry button was the only call site that could have exercised a stale-callback path. Recorded there as out of scope and carried here.

**Confirmed by test, not by reading.** `BarcodeScanner` renders four branches in order: `permission === null` (a loading string with **no buttons at all**), `permission.granted === false` (Camera Access Needed + Open Settings), `error && !isReady` (Camera Error + Retry), then the camera. `isReady` is `permission?.granted === true && enabled` with `enabled` hardcoded true, so by the third branch `granted` is not `false`, and if it is `true` then `!isReady` is false. Reaching it requires a permission object whose `granted` is neither `true` nor `false` — a shape `expo-camera` does not produce. Forcing exactly that shape is the only way the branch was made to render.

**The state it serves is real.** `requestCameraPermission` sets `error` both on a denial and in its `catch` when `requestPermission()` **rejects** — a different failure with a different fix, which leaves `permission` at `null`. The loading branch then wins indefinitely. `ScannerOverlay`, the scanner the app actually renders, has no such early return above its error branch and is already correct; this aligns `BarcodeScanner` with it.

**Acceptance Criteria:**

- A permission request that **rejects** renders the camera-error UI, not the loading string.
- That state offers both escapes: Retry re-requests permission, and manual entry invokes `onManualEntry`.
- An unresolved permission with **no** error still renders the loading string.
- A **denied** permission still renders the permission-denied UI rather than the generic error UI, because only that branch offers Open Settings — a denial sets `error` too, so branch order is load-bearing here.
- No new locale keys: `addCard.scanner.cameraErrorTitle` / `cameraErrorFallback` already exist and are already used by `ScannerOverlay`.
- Each new test is shown failing against the unfixed code.

**Notes:** ⛔ **Depends on Story 16.24** — without its `requestCameraPermission` memoisation the mount effect re-runs and the `setError(null)` at the top of each call wipes the error, so the screen oscillates with the loading string; two of the four tests fail on an un-memoised hook. Fixed with two guards (`permission === null && !error`, and `permission?.granted === false`) rather than by reordering the JSX, which would regress the denial case. **Out of scope and flagged:** `BarcodeScanner` has **no consumer** — its only reference is the barrel re-export at `features/cards/index.ts:33`, and that barrel has zero importers. Whether to delete the component or wire it up is left to an explicit decision.

### Story 16.41: watchOS scores the raw palette key, so every card row draws the near-black hairline and the beam-yellow accent gets unreadable initials

**As a** person with loyalty cards on an Apple Watch, **I want** each row to show the colour I actually picked and to draw the near-black hairline only when the accent really is near-black, **So that** the list is not a wall of identically-bordered rows and my yellow card's initials are legible.

**Found 2026-09-17 while scoping Story 21.2a** (card accents), and deliberately kept out of it — a different mechanism, and it changes visible watch behaviour.

**One bad default, reached by a mislabelled field.** `relativeLuminance(hex:)` guards `h.count == 6` and returns **`0.0`** for anything else — and `0.0` is the luminance of BLACK, so its invalid-input default is the strongest possible claim about the colour rather than a neutral one. `WatchCard.colorHex` is named for a hex and carries a palette KEY: `core/watch-connectivity.ts:252` sends `colorHex: card.color`, and `card.color` is a required `cardColorSchema` enum, so the field is ALWAYS a key. `test-fixtures/sync-message-v1.json:31` shows it — `"colorHex": "green"` on a `conad` card. Two call sites fed that raw key to a hex-only helper: `isNearBlack(hex:)` scored `0.0` and drew the hairline on **every** row, catalogue and custom alike; `shouldUseWhiteText(onBackgroundHex:)` scored `0.0` and painted **white initials on the yellow accent** — **1.52:1** on the Cardì `#FCCC0C`, where black is 13.78:1. Measured by executing the shipped Swift, all five keys returned `hairline=true` and `whiteInitials=true`. (On the pre-21.2a amber `#F59E0B` the same defect was 2.15:1 vs 9.78:1 — the palette migration made this half materially worse, not better.)

**The root cause is that watchOS resolved the key differently from every other surface.** `WidgetCardPalette.swift` and `CardVisuals.kt` both map `blue` → `#1A73E8`; `ColorHelpers.swift` mapped it to SwiftUI's **system** blue — so the same card rendered one colour in the watch app and another in its own complication on the same wrist. `CardVisuals.kt` had already recorded this, calling its own table "more faithful than watchOS, which approximated with system colours."

**Acceptance Criteria:**

- `ColorHelpers.swift` gains ONE resolver, `resolvedCardHex(_:)`, turning a key or a hex into a normalized `"#RRGGBB"` or `nil` — mirroring `WidgetCardPalette.hex(for:)` and Wear's `resolveCardColor`.
- `mapColor` resolves through it too, so no second key→hex answer can exist in the file. ⚠️ The visible colour change on all five accents comes from the ROW — `accentColor` now paints `resolvedAccentHex` — not from `mapColor`, which ends up with no production callers. This is the wider of two scopes, chosen by ifero on 2026-09-17.
- The row derives one `resolvedAccentHex` and feeds fill, hairline and initials from it, mirroring Wear's `CardPresentation`. No call site scores a raw wire value.
- Unresolvable input defaults the DECISION, never the string — `?? ""` is the same trap, since `""` scores `0.0`.
- The near-black hairline still fires for an accent that genuinely is near-black.
- The three native palette tables are pinned to the generated tokens in a test that is **not** path-filtered. ⚠️ `watchos-tests.yml` filters to `targets/watch/**`, `targets/watch-widget/**`, `catalogue/**`, `watch-ios/**` and `ios/**`, and two of the gate's inputs (`tokens/color.json`, `CardVisuals.kt`) sit outside all of them. Satisfied after the rebase by Story 21.2a's gate in `core/wear-sync-contract.test.ts` — same invariant, same non-path-filtered job — with its watchOS extractor repointed at this story's table.
- Behaviour is EXECUTED, not described: the shipped declarations run under `xcrun swift`, and each new test is shown failing against the unfixed code.

**Notes:** ⚠️ **Two claims in the original report were wrong, both making it look smaller.** Catalogue cards are NOT unaffected — `resolvedColorHex` only fell back to the brand-id hash when `colorHex` was nil, which never happens, so the brand-hash fallback is dead code and every row took the hairline. And at the time the defect was found, Story 21.2a had NOT landed, so the palette was still the shipped one and NONE of the five keys was near-black (lowest `grey`, `L=0.171`) — the hairline would have disappeared from every row, not four of five. 21.2a has since merged and moved `blue` to `#0C3C84` (`L=0.049758`, `0.00024` under the threshold — that figure from the report is correct), so the reported picture is now the real one. The cited Android test `deepBlueAccent_sitsJustInsideTheNearBlackThreshold` does not exist on any ref; the real assertions are in `CardVisualsTest.luminanceAndContrastExtremes`. **Sequenced AFTER Story 21.2a (`wave_1c`), decided by ifero on 2026-09-17 on a live collision, and REBASED once it merged** as `f4782ee` (#240) on its freeze branch. 21.2a had independently fixed the same system-colour root cause in a different shape and built its own parity gate, but ⚠️ it does NOT fix this defect — its `CardListView.swift` is untouched, so **the bug is live on `main` today**. The rebase kept this story's `namedCardHex` + `resolvedCardHex(_:)` structure carrying 21.2a's Cardì hexes, deleted this story's own parity gate in favour of 21.2a's, and repointed that gate's watchOS extractor from `mapColor`'s switch to the table (one line, reusing 21.2a's own `swiftHexMap`). ⚠️ The merge also changed what the fix LOOKS like: `blue` `#0C3C84` is genuinely near-black (`L=0.049758`), so blue now KEEPS its hairline and the other four lose theirs — the table the original report predicted — while on `main` all five still draw it for the original wrong reason, which is harder to spot now that one of them looks right. ⛔ The risk is release timing, not merge order: this must merge before the 21.7 gate cuts the rebrand release, because `runtimeVersion.policy` is `appVersion` and no OTA can repair it afterwards.

### Story 16.43: Android lint never runs in CI, so the one check `lint.xml` deliberately left visible is only ever cleared by hand

**As a** maintainer of the Wear OS app, **I want** Android lint to run as a real gate in CI, **So that** a check the repository deliberately left unsuppressed cannot be satisfied once and then silently regress.

**Found 2026-09-20 during the QA review of Story 21.4.** That story added a `<monochrome>` layer specifically to satisfy `MonochromeLauncherIcon` — a check `watch-android/app/lint.xml` leaves **unsuppressed on purpose** so the gap stays visible. It was cleared once, locally, and nothing re-verifies it. Drop the layer and every gate stays green.

**⚠️ THE OBVIOUS FIX GATES NOTHING, and that is measured rather than argued.** `wear-os-build.yml` runs no `lint*` task, so "add `lintDebug`" looks like the whole story. It is not: `watch-android/app/build.gradle.kts` has **no `lint {}` block**, so all defaults apply, and `./gradlew -p watch-android lintDebug` exits **0** with findings present — `abortOnError` fails on _errors_, and every finding here is a _warning_. `MonochromeLauncherIcon` is a warning. So adding the task alone buys ~15s of CI time and changes no outcome, which is exactly the trap `watch-android/README.md` § CI warns about in its own words: _"an absent job is easily mistaken for coverage."_ A non-gating gate is worse, because it also looks like coverage.

**⚠️ AND THE GAP IS NARROWER THAN "NO LINT IN CI".** `lintVitalRelease` is already in `bundleRelease`'s task graph — confirmed with `--dry-run` — and the workflow runs `bundleRelease`. So **fatal-severity** lint does run in CI today. What does not run is everything below fatal, which is where `MonochromeLauncherIcon` lives.

**Acceptance Criteria:**

- `MonochromeLauncherIcon` is promoted to `severity="fatal"` in `watch-android/app/lint.xml`, so it can actually fail a build. Its existing comment explains why it is unsuppressed; it now explains why it is an error.
- `lintDebug` runs in `.github/workflows/wear-os-build.yml`, and the workflow comment states what it does and does not gate.
- **`AndroidGradlePluginVersion` is NOT suppressed**, and the story says why not. It consults the network, so it is non-reproducible in the way `GradleDependency` and `NewerVersionAvailable` are — but under a targeted promotion it stays a _warning_, never fails a build, and suppressing it would be dead config. ⛔ It MUST be suppressed first if anyone later reaches for `warningsAsErrors`, which is the broader alternative this story deliberately does not take.
- The promotion is proven to bite: `lintDebug` is shown FAILING with the `<monochrome>` layer removed and passing with it present.
- `watch-android/README.md` § CI is corrected. It currently claims the workflow runs `assembleRelease`; it runs `bundleRelease`. Its "❌ No lint in CI" bullet becomes accurate for whatever this story lands.
- The added CI duration is measured and the workflow's own timing comment updated if it moves materially. Measured locally at ~15s warm.

**Notes:** ⛔ **Sequenced AFTER Story 21.4**, and that is a hard dependency rather than a preference: `main` has no `<monochrome>` layer today, so promoting the check to `fatal` turns the Wear job red on `main` until 21.4 merges. Measured by removing the layer and re-running lint — it reports `MonochromeLauncherIcon` plus, if the generated PNGs are present without the reference, `UnusedResources`, which is a second free guard on the same coupling. ⚠️ **The follow-up note that spawned this story overstated the problem** — it claimed adding `lintDebug` as-is would hand CI a gate that "can go red on a day nobody touched the repo". It cannot; warnings never fail. The nondeterminism only bites under `warningsAsErrors`. The correction is recorded here so the next reader does not suppress a check for a reason that does not apply. Note also that `.github/build-path-filters.json` governs which changes reach a RELEASE build and deliberately excludes `watch-android/**` from both platform sets; this story does not touch it.

## Epic 17: Apple Wallet Pass Support

Evaluate (feasibility-first) letting users add loyalty cards to Apple Wallet. Parked until a spike de-risks it.

This epic is parked. Before any build story is written, a feasibility spike must resolve the signing, native-integration, and App Store review unknowns below. No implementation work should begin until the spike reports back and the epic is un-parked.

### Story 17.1: Spike — Apple Wallet Feasibility

**As a** product engineer, **I want** to investigate what adding loyalty cards to Apple Wallet actually requires, **So that** we can decide whether to build it before committing any implementation effort.

**Acceptance Criteria:**

- The spike documents that pass signing requires an Apple Pass Type ID and certificate, and that signing must happen server-side (e.g. an EAS API route) rather than in-app.
- The spike confirms Expo has no first-party Wallet support: adding a pass needs a config plugin plus a native module wrapping `PKAddPassesViewController`, and estimates that effort.
- The spike records that the app can only generate GENERIC passes (not trademarked brand passes) and assesses the resulting App Store review risk.
- The spike verifies that PassKit barcode formats (QR, PDF417, Aztec, Code128) cover the loyalty-card formats the app uses.
- The spike identifies the entitlements the feature likely touches and any provisioning implications.
- The spike concludes with a go / no-go recommendation and, if go, a proposed breakdown of build stories; the epic stays parked until that recommendation is reviewed.

---

## Epic 18: Card Sharing & Web Handoff

**Goal:** Let a user share any loyalty card as a single HTTPS link. Recipients with the app land on a pre-filled add-card screen; recipients without it see a scannable barcode on the web. Links stay readable by app versions older than the brands and formats they carry.

**Phase:** 3 · **Epic Type:** User-Facing · **Dependencies:** Epic 2 (cards + barcode rendering), Epic 3 (catalogue), Epic 15 (public site) · **Absorbs:** Story 14.2

Adding a card today means scanning a physical card or typing a barcode by hand; there is no way to pass a card to a partner or a housemate. Story 14.2 proposed a `myloyaltycards://` custom-scheme deeplink for this, but a custom scheme is a dead end for real-world sharing: it does nothing for a recipient without the app installed, and messaging apps generally will not linkify it. Epic 18 supersedes and absorbs 14.2 with an HTTPS link that degrades gracefully — app installed, app absent, or app too old to understand the payload.

**Design decisions taken up front (ifero, 2026-08-02):**

| Decision         | Choice                                                                                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token in the URL | Fragment — `https://<domain>/card/#<token>`. Everything after `#` is never transmitted to the server, so barcode numbers never reach an access log, a `Referer` header, or an analytics beacon. Universal/App Links still match, because they match on the `/card/` path. |
| Hosting          | Custom domain on a European host, chosen by the Story 18.1 spike across Netsons, Namecheap, Spaceship, Infomaniak and OVHcloud. Hard constraints: servers in Europe, maximum reliability.                                                                                 |
| Story 14.2       | Absorbed into this epic (`absorbed-into-epic-18` in `sprint-status.yaml`).                                                                                                                                                                                                |
| Forward-compat   | Covers unknown **brand IDs** and unknown **barcode formats**, on the reasoning that they are the same defect one layer apart.                                                                                                                                             |

**The token is encoded, not hashed.** A cryptographic hash is one-way — the barcode could never be recovered from it, and the web page has no server to look it up against. The token is an opaque base64url payload, which means anyone holding the link can decode the card: it is a **bearer link**. Every surface that produces or renders one says so.

**Zero backend.** The card details travel inside the link. Nothing is stored server-side, which keeps the epic consistent with the app's offline-first architecture and with Epic 15's zero-build static site. The trade-off, accepted deliberately, is that a shared link cannot be revoked or expired.

**Dependency order.** Wave 1 (parallel): 18.1, 18.2, 18.3. Wave 2: 18.4, 18.5, 18.6. Wave 3: 18.7, 18.8. Wave 4: 18.9 then 18.10. Only 18.9 and 18.10 depend on the hosting spike — everything else can be built and tested before a domain exists.

### Story 18.1: Spike — European Hosting & Custom Domain for the Share Page

**As a** developer, **I want** a decided European host and registered domain, **So that** Universal Links and App Links can be verified at a domain root we control, on infrastructure we trust to stay up.

Vendors to evaluate, specified by ifero: **Netsons**, **Namecheap**, **Spaceship**, **Infomaniak**, **OVHcloud**. The incumbent (GitHub Pages) is scored as the baseline to beat, not as a candidate — it structurally cannot serve `/.well-known/` from a project page.

**Residency rule, decided by ifero 2026-08-02: EU/EEA only.** Not "geographic Europe". A desk check of the five vendors on the day the epic was written gives the following starting position — the spike **re-verifies each one**, because hosting footprints and product-by-product region availability both change:

| Vendor         | EU/EEA hosting                                        | Standing under the rule                                                                                                                                              |
| -------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Netsons**    | Milan, Italy — Data4 Tier IV campus, plus Seeweb      | In. Italian company, Italian datacentres.                                                                                                                            |
| **OVHcloud**   | France, Germany, Poland                               | In. Strongest EU-sovereignty story of the five; carries the SBG2 caveat below.                                                                                       |
| **Namecheap**  | Amsterdam, NL — **shared hosting only**, small uplift | In on location, but the EU region must be **explicitly selected** (the default is US, and the UK option is not EEA post-Brexit). US parent ⇒ CLOUD Act caveat below. |
| **Spaceship**  | Amsterdam, NL (also Farnborough, UK — **not EEA**)    | Same as Namecheap: EU region must be pinned, never UK. Same US parent.                                                                                               |
| **Infomaniak** | **None — Switzerland only** (Geneva, Zurich)          | **Excluded by the residency rule.** Recorded rather than dropped, so it is not re-proposed later.                                                                    |

Excluding Infomaniak has a real cost worth stating: Switzerland holds a GDPR adequacy decision, and Infomaniak is the only pure-play independent European provider on the list, with the strongest privacy and sustainability posture. The exclusion is a **digital-sovereignty preference, not a compliance necessity** — ifero's call, made deliberately.

**Acceptance Criteria:**

- Each surviving candidate's actual datacentre location **for the specific product being bought** is re-verified against its marketing and recorded; a vendor having an EU region somewhere does not mean the plan under consideration runs there.
- The **CLOUD Act caveat** is assessed for Namecheap and Spaceship, which share a US parent: post-_Schrems II_, a US-incorporated processor carries exposure even when the servers sit in the EEA, so "Amsterdam datacentre" is not sufficient on its own. The ADR records the contracting entity, not just the server location.
- The assessment is weighed against a mitigating fact the fragment design supplies: **no personal data ever reaches the host** — the token stays in the browser, and the site is otherwise public marketing content. If the ADR concludes the residency rule should be relaxed for a specific candidate on that basis, it says so explicitly and routes the decision back to ifero rather than deciding unilaterally.
- Reliability is scored on published uptime **SLA percentage and whether it carries service credits**, public status-page history over the last 12 months, backup and restore guarantees, and redundancy across more than one facility.
- **The SLA is per plan tier, not per vendor, and the cheap tier is often much weaker than the brand suggests.** Netsons illustrates the trap: its shared hosting advertises 99.50% (≈3.6 hours of permitted downtime a month), while its dedicated Classic tier is 99.90% annual and Premium is 99.99% monthly. Score the tier actually being bought, and convert every percentage into permitted downtime per month so the numbers are comparable.
- The ADR states plainly that **no host is "exempt from downtime"** — that is not a purchasable property. The achievable goal is a credited SLA plus architectural redundancy.
- **OVHcloud's March 2021 Strasbourg SBG2 fire** — which destroyed a datacentre and permanently lost data for customers without their own backups — is recorded, along with what has changed since and which facility the candidate plan would land in. OVH is not disqualified by it; it is Europe's largest cloud provider with a strong EU-sovereignty story.
- The spike evaluates "modest EU host + CDN in front" against "premium hosting plan" on both cost and real-world availability **before** recommending spend. The share page is fully static and, because of the fragment design, the token never reaches the server at all — so it can be cached at an edge or mirrored with no correctness risk and no personal data leaving the browser.
- Universal Links serving requirements are verified per candidate: `/.well-known/apple-app-site-association` served with `Content-Type: application/json` (achievable via `.htaccess` or nginx config on a traditional host, but **not** reliably on GitHub Pages, which serves the extensionless file as `application/octet-stream`), and `/.well-known/assetlinks.json` reachable at the domain root.
- The ADR records that Apple fetches the AASA through its own CDN (`app-site-association.cdn-apple.com`) and caches it, so brief origin downtime does not immediately break existing installs — this lowers, but does not remove, the availability requirement.
- For each candidate, the concrete CI deploy mechanism from GitHub Actions is identified — SFTP/rsync, git-push-to-deploy, or an API — including where credentials live as repository secrets. This is the main thing traditional hosting gives up versus GitHub Pages, and the ADR must show it solved rather than hand-waved. **No build step may be introduced** (Epic 15 AC1).
- Registrar and host are evaluated as separable choices; all five candidates sell both, and the recommendation may split them provided it says why.
- Total annual cost, renewal-price cliffs (registrars routinely discount year one), free-TLS auto-renewal, control-panel and DNS quality, and support responsiveness are also scored.
- A redirect strategy from `ifero.github.io/myLoyaltyCards` to the new domain is specified — that URL already ships in `og:url` metadata in the wild.
- Output is an ADR at `docs/adr-<date>-share-page-hosting.md` containing the scored comparison matrix, one recommendation for registrar and one for host, and the rejected alternatives with reasons.
- A domain name is shortlisted and agreed with ifero; registration and payment are an ifero action item tracked in `sprint-status.yaml`.
- **Gates 18.9 and 18.10 only.** Does not gate 18.2 through 18.8.

### Story 18.2: Share-Link Payload Codec (Enabling)

**As a** developer, **I want** one versioned encoder and decoder for share tokens, **So that** the app, the web page, and any future platform agree byte-for-byte on what a link means.

Payload v1 uses compact keys, with all fields always present (`null`, never omitted, per the project's JSON rules): `v` schema version, `n` name (≤50), `b` barcode value, `f` barcode format, `i` brandId or null, `c` colour key or null. The token is `base64url(JSON)` + `.` + a CRC-32 checksum as 8 lowercase hex characters — roughly 127 characters, giving a full URL around 160.

**Acceptance Criteria:**

- The codec lives in `core/sharing/` as pure TypeScript with **no React import**, so the existing ESLint layer boundary permits it.
- `encodeShareToken` and `decodeShareToken` round-trip losslessly for every field, including a `null` `brandId` and a 50-character name.
- The checksum is **CRC-32 or FNV-1a implemented in plain TypeScript — not SHA-256**. Hermes has no WebCrypto and `expo-crypto` is not a dependency, and the identical code must run in Hermes, Node/Jest and a browser. This is the Story 16.15 lesson applied in advance: a green Jest run on Node proves nothing about Hermes.
- `decodeShareToken` never throws; it returns a typed result distinguishing valid, malformed base64, checksum mismatch, unsupported version, and missing required field.
- Forward-compatibility is built into the codec: `f` and `i` are decoded as **plain strings**, not validated against the current enum or catalogue, so an unrecognised value survives the round-trip intact. This is the mechanism stories 18.6 and 18.7 rely on.
- Unknown top-level keys in a future payload version are ignored rather than rejected, so a v1 reader stays forward-tolerant where it safely can.
- A `v` greater than the reader's supported version yields the unsupported-version result, and callers show "Update the app to open this link" — never a silent failure.
- The codec has no dependencies (no compression, no crypto library) so the browser can run the identical logic with no build step.
- A cross-platform fixture `test-fixtures/share-link-v1.json` is added alongside `card-valid.json` and `card-all-formats.json`, holding canonical token ⇄ payload pairs including an unknown-brand and an unknown-format case.
- The checksum is documented as **corruption detection, not tamper-proofing** — anyone can recompute it. Unforgeable links would require a server secret, which this architecture deliberately does not have.
- Unit tests are co-located as `core/sharing/*.test.ts` and meet the 80% global coverage gate.

### Story 18.3: UX Design — Share, Import Preview & Web Share Page

**As a** UX designer, **I want** approved designs for the three new surfaces, **So that** stories 18.4, 18.5 and 18.8 build against a settled design rather than inventing one.

**Acceptance Criteria:**

- The design covers the "Share card" entry point on the card detail screen, the in-app import preview screen including its duplicate and error states, and the public web share page in both light and dark, EN and IT.
- It answers explicitly: where the share action lives on card detail; how the bearer-link warning is worded and placed; what an unknown brand looks like in the preview; what an unknown barcode format looks like; and what the web page shows when the token is corrupt.
- It is consistent with the existing design system — Unistyles theme tokens for the app, the `docs/style.css` CSS-variable palette for the web page.
- It is reviewed and approved by ifero. **This story blocks 18.4, 18.5 and 18.8.**
- The approved design is stored under `docs/ux-designs/` and linked from each dependent story.

### Story 18.4: Share a Card from the App

**As a** user, **I want** to share one of my cards as a link, **So that** someone else can add it without typing the number.

**Acceptance Criteria:**

- A "Share card" action is available on the card detail screen, matching the 18.3 design.
- Tapping it builds `https://<domain>/card/#<token>` via `core/sharing` and opens the **native share sheet** using React Native's `Share.share({ message, url })`. Note that `expo-sharing`, despite being a dependency, shares _files_ and is the wrong API here.
- A "Copy link" action copies the same URL via `expo-clipboard` (already a dependency) with a toast confirmation.
- A plain-language bearer-link warning accompanies the share action: anyone with the link can see and use this card number. Exact copy per 18.3.
- The feature works identically in local mode and cloud mode, with no auth check.
- Cards with a `null` `brandId` (custom cards) share correctly, carrying `name` and `color` so the recipient sees a sensible virtual logo.
- New strings are added to **both** `shared/i18n/locales/en.ts` and `it.ts`.
- Tests cover URL construction, the clipboard path, share-sheet invocation, and a custom brand-less card.

### Story 18.5: Import a Shared Card in the App

**As a** recipient, **I want** a tapped share link to open my app on a pre-filled add-card screen, **So that** I only have to confirm.

**Acceptance Criteria:**

- A new route `app/card/import.tsx` is added as a thin re-export per the project's route-file rule, with all logic in `features/`.
- It accepts the token from **both** `myloyaltycards://card/import#<token>` (which works today) and `https://<domain>/card/#<token>` (live after 18.10). The HTTPS path is wired now and simply inert until the domain is verified.
- Warm launch (app already running) and cold start are both handled; cold-start routing is validated on a **real device**, not a simulator.
- The preview screen shows name, brand logo resolved by `brandId`, colour, barcode value, and a rendered barcode before anything is saved.
- "Add to my cards" creates the card through the existing `useAddCard` hook, generating a fresh client-side UUID and current timestamps — the sender's IDs and dates are never copied.
- If a card with the same barcode value already exists, a conflict prompt is shown ("You already have this card"); the duplicate is created only on explicit confirmation.
- A malformed token, checksum mismatch, or unsupported version shows a specific user-facing message matching the 18.2 result type, and never crashes.
- The flow works in local mode and cloud mode with no auth check.
- Cancelling leaves no partial state.
- Strings are added to `en.ts` and `it.ts`; tests cover each decode-failure branch and the duplicate path.

### Story 18.6: Tolerate Unknown Brand IDs

**As a** user on an older app version, **I want** a card for a brand my app doesn't know to still save correctly, **So that** the real logo appears by itself once my catalogue updates.

Most of this behaviour already exists and this story's job is largely to fix one real bug and lock the rest with tests. `brand_id` is unconstrained `TEXT` in both SQLite (`core/database/migrations.ts`) and Supabase (`001_initial_schema.sql`), so an unknown ID already persists and cloud-syncs; `useBrandLogo` re-resolves the brand from the catalogue on every render, so the logo appears automatically after a catalogue OTA; and `CardTile` already falls back to the virtual logo when the brand does not resolve.

**Acceptance Criteria:**

- A card imported with a `brandId` absent from the bundled catalogue is stored with the **real brand ID preserved verbatim** — never nulled, never rewritten to a placeholder.
- Such a card renders with the generic virtual logo (initials plus the shared colour) everywhere it appears: card list tile, card detail, and barcode screen.
- **Bug fix:** `features/add-card/screens/CardSetupScreen.tsx` currently saves `name: brand?.name ?? ''` and `brandId: brand?.id`, so an unknown brand yields an **empty card name and a silently dropped brand ID**. Both are fixed — the shared `name` becomes the fallback, and the brand ID always persists.
- A regression test proves the auto-upgrade: a card saved with an unknown `brandId`, then a catalogue that gains that brand, renders the real logo with **no migration and no user action**.
- Cloud sync round-trips an unknown brand ID unchanged (already unconstrained `text`; the test asserts it rather than assuming it).
- Watch sync tolerates an unknown brand ID and degrades to a generic tile; the watch already receives a pre-rendered barcode image, so no watch change is needed.
- **No schema migration is required.** If the implementation appears to need one, stop and re-scope.

### Story 18.7: Tolerate Unknown Barcode Formats

**As a** user on an older app version, **I want** a card using a barcode format my app cannot draw yet to still be saved, **So that** I don't lose the card number and it starts rendering after an update.

This is the same defect as 18.6 one layer down, but it lands on the opposite side of the type system: `barcodeFormat` is enum-locked (`z.enum` in `core/schemas/card.ts`, feeding a `Record<BarcodeFormat, string>` in `BarcodeRenderer`), so tolerance requires a real schema change rather than a bug fix.

**Acceptance Criteria:**

- `loyaltyCardSchema.barcodeFormat` is relaxed from a strict `z.enum` to a validated `string`, with an exported `KNOWN_BARCODE_FORMATS` constant and an `isKnownBarcodeFormat()` type guard used at every render site. The `BarcodeFormat` union is retained for code that legitimately requires a known format.
- An imported card with an unrecognised format saves with the **format string preserved verbatim**.
- `BarcodeRenderer` renders a graceful placeholder for an unknown format — the barcode number as large selectable text plus "Update the app to display this code" — instead of throwing or rendering blank.
- After an app update that adds the format, the existing card renders normally with no migration.
- The blast radius is enumerated and each site handled: `core/schemas/card.ts`, `BarcodeRenderer`'s `BWIPJS_FORMAT_MAP`, `FormatPicker`, `core/sync/mappers.ts`, and `core/watch-connectivity.ts`. **The format picker still offers only known formats** — this story adds tolerance on read, not new choices on write.
- The watch path is confirmed safe without watch changes: `buildWatchQRCodeBase64` pre-renders the barcode on the phone, so an unknown format sends no image rather than crashing the watch.
- **Architect sign-off is required before implementation** — relaxing the core schema is the widest-blast-radius change in this epic.
- Tests cover an unknown format saved, the placeholder rendered, known formats unaffected, the sync round-trip, and the watch payload.

### Story 18.8: Public Share Page Renders the Barcode

**As a** recipient without the app, **I want** the link to show me a scannable barcode, **So that** the card is usable at the till right away.

**Acceptance Criteria:**

- A new `docs/card/index.html` (plus any assets) is served at `/card/`, decoding the token from `location.hash` entirely **client-side**. The token is never sent to the server, never logged, and never placed in a network request.
- The page renders the card name, the shared colour, and the barcode using a **locally vendored `bwip-js` browser build** — no CDN and no npm build step, honouring Story 15.1 AC1. All six current formats are supported.
- No brand logos are shown on the web page: the token carries the display name and colour, so no catalogue lookup is needed and `docs/` stays free of a build step.
- An "Open in myLoyaltyCards" button fires `myloyaltycards://card/import#<token>`. This makes the page useful **before** Universal Links exist (18.10) and remains the fallback afterwards.
- App Store and Google Play badges appear below, reusing the existing landing-page badge treatment.
- A corrupt, truncated, or missing token renders a friendly error page — never a blank screen or a JavaScript console error.
- EN/IT uses the **exact existing mechanism** from `docs/index.html`: `data-active-language`, `data-language-button`, `localStorage['mlc-landing-language']`, and `navigator.language` detection.
- The page is responsive with light and dark support via the existing `docs/style.css` CSS variables, and the barcode is legible and high-contrast on a phone screen at arm's length.
- A bearer-link notice is visible on the page.
- Note the prettier boundary: `.prettierignore` excludes `docs/*.html` only, which does **not** match `docs/card/index.html`. Either author the new page prettier-clean or extend the ignore pattern deliberately, with the reason recorded — `prettier --check` has been a CI gate since PR #181.

### Story 18.9: Migrate the Public Site to the Custom Domain (Enabling)

**As a** developer, **I want** the site on the domain chosen in 18.1, **So that** `/.well-known/` is under our control.

**Acceptance Criteria:**

- The existing `docs/` site is deployed to the host recommended by the 18.1 ADR, on the registered domain, with automatic TLS — **byte-identical content, no build step introduced**.
- `ifero.github.io/myLoyaltyCards` redirects to the new domain; that URL ships in `og:url` metadata already in the wild.
- Deploys are automated on merge to `main` via the mechanism the ADR selected, with credentials held as GitHub Actions secrets and **no secrets in the repository**. The process is documented in `docs/cicd.md`.
- If the ADR recommended a CDN in front of the origin, it is configured here with cache invalidation on deploy, so a published change is actually visible.
- **Uptime monitoring** is set up against `/` and `/.well-known/apple-app-site-association` with alerts to ifero — the reliability requirement is worth nothing if an outage goes unnoticed.
- `og:url` and any hard-coded site URLs are updated across `docs/` and the app's Help screen.
- A rollback path is documented and exercised once.

### Story 18.10: Universal Links & Android App Links

**As a** recipient with the app installed, **I want** tapping a share link to open the app directly, **So that** I never see the web page at all.

**Acceptance Criteria:**

- `/.well-known/apple-app-site-association` is served from the domain root with `Content-Type: application/json`, declaring appID `7KU8K25XK5.com.iferoporefi.myloyaltycards` and path `/card/*`.
- `/.well-known/assetlinks.json` is served with the release **and** debug SHA-256 signing fingerprints for `com.iferoporefi.myloyaltycards`.
- `ios.associatedDomains: ["applinks:<domain>"]` and Android `intentFilters` for the domain are added to `app.json`.
- **A new native binary is required.** `runtimeVersion.policy` is `appVersion`, so this cannot ship as an OTA update; the story is sprint-planned against a release.
- Verified on **real devices** on both platforms for: warm tap, cold-start tap, tap from a messaging app, and tap when the app is not installed (which must fall through to the web page).
- The custom-scheme path from 18.5 keeps working — this is additive, not a replacement.
- A recipient on an app version predating the associated-domain entitlement still gets the web page, and its "Open in app" button still works.

---

## Epic 19: Personal Cloud Sync (Bring-Your-Own Storage)

Let users sync their cards through a folder in their **own** cloud storage — no account, no data on our servers — and, when a household shares that folder, share one card set across the family.

Today the app offers only two postures: local-only (guest mode + phone↔watch Bluetooth) or our cloud (a Supabase account, Epics 6–7). A user who wants their cards on a second device has to hand us their data. Epic 19 adds a third posture: the user points the app at one folder in iCloud Drive, Dropbox, Google Drive or OneDrive, and that folder becomes the sync channel. Because a shared folder is just a folder, a family that already shares one converges on a common card set for free.

**Architecture spine (decided 2026-08-02, validated by story 19-1):**

- **One OS file-provider folder, not four SDKs.** The user picks a folder through the system file UI, where all four providers already appear. No OAuth, no API keys, no per-provider SDK to maintain, and nothing for a provider to revoke. This is the decision that keeps the epic small.
- **Per-device files.** Device `D` only ever writes `mlc-<D>.json`; every device reads all `mlc-*.json` and merges N-way. Dropbox/Drive/OneDrive resolve concurrent writes to one file by keeping a "conflicted copy", never by merging — writing per-device makes that failure mode structurally impossible.
- **Plaintext JSON**, a sibling of the existing export format (`core/settings/importCards.ts`, `EXPORT_FORMAT_VERSION`). Portable, inspectable, no key management, and family setup is just "share the folder".
- **Mutually exclusive backends.** Exactly one of `local` / `account` / `folder` is active, so two engines never race on the same SQLite rows.
- **Complements Epic 14, does not replace it.** Folder sync serves no-account families; Epic 14 households serve account users with realtime and per-card visibility. Both ship.

**Reuse, not reinvention:** the merge brain already exists. `mergeWithDeletions` in `core/sync/cloud-sync.ts` does LWW-on-`updatedAt` with delete-wins and is pure; `processPendingSync` in `core/sync/sync-trigger.ts` already models the download→merge→persist→upload→drain pipeline behind injected dependencies. Epic 19 generalises those rather than adding a second sync engine.

Story 19-1 is a feasibility gate: 19-3 onward must not start until it reports. Story 19-2 is pure `core/` logic with no I/O and deliberately runs in parallel, so the spike is not the sole critical path.

### Story 19.1: Spike — Persistent Folder Handle Feasibility (iOS + Android) [Enabling]

**As a** product engineer, **I want** to establish whether the app can hold a durable read/write handle to a user-picked cloud folder on both platforms, **So that** we know the real cost and provider coverage before committing to the epic.

**Acceptance Criteria:**

- The spike proves or disproves, on a throwaway build, that a folder handle picked once survives an app restart with read, write and list access still working — separately on iOS and Android.
- Android is assessed against `StorageAccessFramework.requestDirectoryPermissionsAsync()` from `expo-file-system/legacy` (present in SDK 55): the spike confirms whether it still grants persistable URI permission, and records the migration risk of depending on the **legacy** API.
- iOS is assessed against a custom Expo module wrapping `UIDocumentPickerViewController` in folder mode plus `bookmarkData(.withSecurityScope)` persistence, since `expo-document-picker` offers no directory mode and no bookmark persistence; the spike sizes that module in engineer-days.
- Each of the four providers is tested for **write** through the picker, not just read: iCloud Drive (including `.icloud` placeholder / download-on-demand behaviour), Dropbox, Google Drive and OneDrive. The result is a go / no-go grid of provider × platform.
- Propagation latency is measured for a folder shared between two different accounts on two physical devices, and the observed worst case is recorded.
- The spike confirms or revises the per-device-file model, including what happens when a provider writes its own "conflicted copy" file into the folder.
- Findings land in a standalone ADR under `docs/` (following `docs/adr-2026-06-09-watch-usage-events.md`), with a go / no-go recommendation and any revision to stories 19-2 through 19-9.
- The epic stays gated until the ADR is reviewed by Ifero; stories 19-3 onward do not start before that.

### Story 19.2: Folder-Sync Data Contract & N-Way Merge [Enabling]

**As a** developer, **I want** a versioned file format and an N-source merge function, **So that** any number of devices writing into one folder converge on the same card set with no data loss.

**Acceptance Criteria:**

- A Zod schema defines the per-device file `mlc-<deviceId>.json`: format version, device id, human-readable device label, written-at timestamp, the full card set, and tombstones. All fields are present with explicit `null` rather than omitted, per the project's JSON rules.
- `mergeWithDeletions` is extended (not duplicated) to fold N sources: last-write-wins on `updatedAt`, delete-wins over update, deterministic tie-break, and the existing malformed / future-timestamp handling from `normalizeTimestamp` preserved unchanged.
- Merging is proven commutative and associative by test — the same N files in any order produce the same result.
- **`usageCount` merges commutatively, not by last-write-wins.** A card used twice on one device and twice on another must end at four, not two; the approach follows `docs/adr-2026-06-09-watch-usage-events.md`. `lastUsedAt` takes the maximum.
- Tombstones carry a retention window (proposed 90 days) with the rationale documented, so a deletion survives long enough for a family member's device that has been offline for weeks to observe it; expired tombstones are pruned.
- A file with an unknown future format version is skipped safely with a `logger.notify` signal, never partially applied and never fatal.
- A truncated, malformed or non-JSON file in the folder is skipped without failing the whole merge.
- The module lives in `core/` with no React and no platform imports, and is covered by unit tests; cross-platform fixtures are added under `test-fixtures/`.

### Story 19.3: FolderStore Port & Platform Adapters [Enabling]

**As a** developer, **I want** a narrow storage port with per-platform adapters behind it, **So that** the sync engine stays platform-agnostic and testable in the same way the Supabase path already is.

**Acceptance Criteria:**

- A `FolderStore` port is defined in `core/sync/folder/` exposing `list()`, `read(name)`, `write(name, contents)`, `remove(name)` and `isAvailable()`, with zero platform imports — mirroring how `CloudUpsertFn` / `CloudFetchSinceFn` keep `core/` backend-agnostic today.
- An Android adapter implements the port over the Storage Access Framework, and an iOS adapter implements it over the mechanism story 19-1 selected. Both live in `shared/` and respect the ESLint layer boundaries (`core/` must not import them).
- The persisted folder handle is stored and restored across launches, and its resolved provider name and display path are readable for the UI.
- A revoked, moved or deleted folder produces a typed error (`AppError` shape) that callers can act on — never an unhandled throw and never a crash.
- Partial writes are avoided: a write either lands completely or leaves the previous file intact.
- An in-memory fake implementation of the port ships alongside, so stories 19-5 through 19-8 are unit-testable without touching a real filesystem.

### Story 19.4: Connect and Disconnect a Sync Folder

**As a** user who does not want an account, **I want** to point the app at a folder in my own cloud storage, **So that** my cards sync between my devices without giving my data to anyone else.

**Acceptance Criteria:**

- A "Sync folder" entry point is added to the existing `DataManagementSection` on the Settings screen, alongside export and import.
- Choosing it opens the system folder picker; on success the screen shows which provider and folder are connected.
- Connecting to a folder that **already contains** card data shows a preview of what will be merged before anything is written, following the existing `ImportPreviewSheet` preview-then-commit pattern — no silent merge on first connect.
- Connecting to an empty folder seeds it with this device's file and reports how many cards were published.
- Disconnecting always leaves every card on the device untouched, and the confirmation sheet says so explicitly before the user commits.
- Disconnecting does not delete this device's file from the folder; the user is told the file remains in their storage and how to remove it themselves.
- If folder access has been revoked or the folder has been moved or deleted, the row shows a clear reconnect affordance instead of failing silently or looping on errors.
- All new copy is added to **both** `shared/i18n/locales/en.ts` and `it.ts`.
- The visual treatment follows the existing design system and Unistyles conventions; screens or annotations are captured in `docs/ux-designs/` before implementation.

### Story 19.5: Folder Sync Engine — Pull, Merge, Push

**As a** user with a connected sync folder, **I want** my card changes to travel through that folder, **So that** every device of mine ends up with the same cards.

**Acceptance Criteria:**

- A sync run reads every `mlc-*.json` in the folder, merges them N-way with local state per story 19-2, persists the result through the existing `batchUpsertCards`, and then writes **only this device's own file**.
- The engine reuses the existing dirty-flag semantics (`markDirty` / `isDirty` / `clearDirty`) and a throttle consistent with the cloud path, so idle app use does not thrash the provider.
- Adding, editing and deleting a card on device A appears on device B after B's next sync run.
- Deleting a card writes a tombstone that persists for the retention window rather than draining on first success — the current `deletion-tracker` drain-on-success behaviour is explicitly **not** sufficient here and the story documents why.
- A deleted card never resurrects, including when a peer file still contains an older copy of it.
- With the folder unreachable (offline, provider signed out, permission revoked), the run is a no-op that leaves local data intact and retries later; it does not surface as a hard error.
- A corrupt or partially written peer file is skipped with `logger.notify` and the rest of the merge still completes.
- The state after a run is idempotent: an immediate second run with no changes writes nothing new and reports no work.
- Verified end-to-end on at least real iCloud Drive **and** real Dropbox on physical devices — not only against a local folder.

### Story 19.6: Folder-Sync Triggers and Status

**As a** user, **I want** folder sync to run on its own and tell me where it stands, **So that** I can trust my cards are current without thinking about it.

**Acceptance Criteria:**

- Sync runs automatically on app foreground / resume and after local card mutations, subject to the throttle from story 19-5.
- Status is surfaced through the **existing** `SyncIndicator`, `SyncErrorBanner` and `SyncStatusContainer` components and the `shared/types/sync-ui.ts` types — no parallel set of status components is introduced.
- The Settings screen shows the last successful sync time and which folder is connected.
- A manual "Sync now" action bypasses the throttle, matching the existing force-sync behaviour.
- Failures show an actionable message (reconnect, check connectivity) rather than a raw error string, per NFR-U4.
- Repeated failures do not produce a retry storm or a permanently stuck spinner; the retry policy reuses `retryWithBackoff`.
- Sync state is consistent across every screen that shows it, following the single-store approach already used in `shared/hooks/useCloudSync.ts`.

### Story 19.7: Shared-Folder Family Sync

**As a** member of a household that already shares a cloud folder, **I want** our loyalty cards to live in that shared folder, **So that** everyone at home can use the same cards without anyone creating an account.

**Acceptance Criteria:**

- Two devices belonging to different people, both pointed at the same shared folder, converge on the same card set.
- A third device joining a folder that already holds data adopts the existing cards without duplicating them.
- Concurrent edits made on different devices while offline all survive and resolve per story 19-2, with no member's change silently lost.
- A device that stops syncing leaves a stale file behind that ages out under the retention rules; its cards do not resurrect after being deleted by another member.
- A provider-generated "conflicted copy" file appearing in the folder is ignored or handled explicitly, never merged as if it were a peer device.
- The practical device count and the folder's file-count growth over time are documented, along with the point at which performance degrades.
- **The watch is verified unaffected:** phone↔watch remains the transport, and `CARD_USED` usage events still reconcile correctly when several family phones sync usage through the folder (per ADR-2026-06-09-001).
- Documentation explains the trust model plainly — anyone with access to the folder can see and change every card in it, and there are no per-card permissions in this mechanism (that is Epic 14's job).

### Story 19.8: Sync-Backend Exclusivity and Switching

**As a** user, **I want** one obvious answer to "where are my cards syncing", **So that** I can change my mind without risking my data.

**Acceptance Criteria:**

- The active backend is exactly one of `local`, `account` or `folder`, persisted through `core/settings/settings-repository.ts`, and the Settings screen makes the current choice unambiguous.
- Enabling one backend provably stops the other: no double-sync, no echo loop, and only one engine writes the local card rows at a time.
- Every transition — `local→folder`, `account→folder`, `folder→account`, `folder→local` — preserves all cards held on the device, each covered by a test.
- Switching away from account sync does not delete the user's cloud data; switching away from folder sync does not delete their folder file. Removing either is a separate, explicit user action.
- Choosing folder sync while signed in explains what will happen to account sync before the user commits.
- Where the guest-to-account path already solves an equivalent problem, `core/auth/guest-migration.ts` is reused rather than reimplemented.
- An interrupted switch (app killed mid-transition) leaves a consistent state on next launch — never two active backends and never none with cards stranded.

### Story 19.9: Privacy, GDPR and Documentation for Folder Sync

**As a** privacy-conscious user, **I want** to understand exactly where my cards go when I use folder sync, **So that** I can make an informed choice.

**Acceptance Criteria:**

- The privacy policy and an in-app disclosure state plainly that folder-sync data is written into storage the user controls and never transits or rests on myLoyaltyCards infrastructure (NFR-S13).
- The plaintext trade-off is disclosed honestly: the storage provider can technically read the file, and anyone with folder access can read every card in it (NFR-S14).
- The disclosure is shown at the point of connecting a folder, not buried in a policy document.
- Folder sync does not weaken the existing data-export right (FR54) or the account-deletion right (FR55); the story confirms both still behave correctly when folder sync is the active backend.
- The GDPR position is recorded for the case where a user syncs another household member's data into a folder they control.
- `docs/project-context.md` gains folder sync in its Sync Patterns section, and the README describes the feature and its trust model.
- Copy is provided in **both** `en.ts` and `it.ts`.

---

## Epic 20: Cardì Identity & Design System

Establish **Cardì** as an identity: a design system, a mark, and a reference drawing of every
screen the phone app has — so that Epics 21–23 implement against a decided thing rather than
negotiating taste per screen.

**Phase:** 3 · **Epic Type:** Design/Enabling · **Status:** in progress: 20.1–20.5 done (written up retroactively 2026-09-01), 20.6 added 2026-10-30

This epic is documented after the fact. The work was done on `docs/cardi-redesign-carry-over`
across August 2026 and is complete; it simply never had an epic around it, which left Epics
21–23 referencing artefacts that appeared from nowhere and left `create-story` with nothing to
hang the rest of the rebrand off.

**The thesis, and it outranks the palette: _the content is the colour._** The home grid already
carries ~45 third-party brand colours that arrive with the data. Our chrome stays quiet so the
brands can be loud, which makes playfulness a **layout** decision — tile size, logo scale, grid
rhythm — and never a palette one. Three hard rules fall out of it and are enforced in
`cardi-design-system.md`: never tint, wash or recolour a branded card tile; never replace the
two-column grid with single-column rows; and never put a large yellow chrome surface near the
grid, because Esselunga is `#FFCC00` and beam is `#FCCC0C` — three points apart, and the
most-used card would vanish into the furniture.

**Also forbidden, and each one cost an argument:** bottom tab bars · floating action buttons ·
coral/salmon/terracotta · drop shadows · gradients · glassmorphism · **anything overlaying a
barcode, especially a drawn beam** · an accent that rises to the right.

### Story 20.1: The Cardì Design System [Enabling]

**As a** designer and developer, **I want** one written system covering colour, type, spacing and
the things we refuse to draw, **So that** every screen design and every implementation decision
has a source of truth that is not a conversation.

**Acceptance Criteria:**

- `docs/design/cardi/cardi-design-system.md` defines the **Ink & Beam** palette: ink `#181824`
  as structure and light-mode actions, beam `#FCCC0C` as signature and dark-mode actions
  (a deliberate inversion), cream `#F0F0E8` as the light ground, white cards on it.
- Typography is fixed: Space Grotesk for headlines, Inter for body, JetBrains Mono for card
  numbers.
- The five logo-bar accents are declared **data only** — virtual-logo tiles for cards with no
  official brand — and never chrome.
- A **Forbidden** section lists every rejected pattern with its reason, so the same argument is
  not had twice.
- The beam rule is written in both directions: the ì carries the beam as the brand's promise;
  the real beam belongs to the scanner at the till, so nothing is ever drawn over a barcode and
  the barcode surround stays neutral.
- The accent's **direction** is specified mechanically, not just typographically: `rotate(35)`
  is the grave, `rotate(-35)` is an acute and spells a different word. (Added after every one of
  the first 50 drawn accents used the negative angle.)

### Story 20.2: Nine Screen Patterns, Drawn [Enabling]

**As a** developer implementing the redesign, **I want** every screen in the app drawn as a
reference frame, **So that** implementation is a transcription rather than a design exercise.

**Acceptance Criteria:**

- Forty-one frames across nine patterns exist under `docs/design/cardi/frames/`: wallet (4),
  card-detail (4), barcode (3), capture (5), form (4 states), settings (6), document (3),
  auth (6) and onboarding (6).
- Every one of the app's 21 routes maps onto a pattern, including the two that are not obvious:
  `data-summary` is covered by the document prompts, and `recovery-otp` reuses
  `VerifyEmailScreen` rather than having a frame of its own.
- Each frame is 393 × 852 and includes the states that actually break layouts — empty, single
  item, no results, error, saving, permission refused, offline.
- A matching Stitch prompt file exists per pattern, each block standalone: a prompt may not
  refer to anything outside itself, including a shared preamble.
- Colours in prompts are literal hexes, never token names — the project theme resolves `primary`
  to `#000000`, so a semantic name silently produces the wrong screen.

### Story 20.3: The Mark — 35°, Grave, Contained [Enabling]

**As a** brand owner, **I want** a mark that is genuinely ours and survives every size it ships
at, **So that** the app is recognisable without a wordmark next to it.

**Acceptance Criteria:**

- The mark is the Italian **ì** of _Cardì_: a barcode stem and a beam-yellow accent, and nothing
  else — no card, no wallet, no shield.
- The accent is **35°**, a **grave** (descending left to right), and **contained** within the
  letter's own advance in the wordmark, so it never collides with the `d`.
- Its vertical placement is measured, not eyeballed: the accent tops out at 0.7007em, matching
  both the `d` ascender and Space Grotesk's own `ì` at 0.700em.
- For the square icon the beam **crosses** the bars high rather than floating above them —
  chosen from six alternatives because the Android 13 themed layer redraws the icon in one
  wallpaper-derived colour, where a floating tick becomes a speck and a crossing beam survives
  as a shape.
- The baseline anchoring ships inline on the `<svg>` (`vertical-align: -0.30em`, derived as
  `(100 − BASELINE) / 100`) and never as a stylesheet rule, because a stylesheet rule was
  dropped twice and floated the glyph above the word.

### Story 20.4: One Generator, Every Icon [Enabling]

**As a** developer, **I want** every shipped icon rendered from a single geometry definition and
checked in CI, **So that** the app icon, the launch mark and the in-app glyph cannot drift apart.

**Acceptance Criteria:**

- `scripts/build-brand-icons.mjs` renders eight artefacts — three SVGs and five PNGs — from one
  set of constants. `yarn icons:build` writes them; `yarn icons:check` regenerates and compares
  hashes in pre-push and CI.
- It is dependency-free: the repo has no rasteriser at all (sharp, rsvg-convert, ImageMagick,
  Inkscape and pyobjc are absent), so primitives are drawn with signed distance fields and the
  PNG is written by hand.
- The Android adaptive-foreground scale is **derived** from the artwork's bounding radius
  (`33 / radius` = ×0.873), never hardcoded, and is clamped at 1.0 so it can only ever shrink.
- `assets/icon.png` is written **without an alpha channel** (colour type 2) because iOS rejects
  an app icon that carries one, while the splash and Android foreground are RGBA because the
  platform paints their field. `constants.test.ts` asserts the split.
- The splash `backgroundColor` in `app.json` and `LAUNCH_FIELD_COLOR` are identical, and a test
  asserts it: the native splash background is baked at build time and cannot read a runtime
  theme, so any disagreement is a full luminance inversion on every cold start.
- The in-app mark draws its stem in `currentColor` so one asset serves a cream surface and an
  ink one; the beam stays literal, because it is the signature and never themes.
- The two stock Material glyphs standing in for the brand — `card-account-details-outline` in
  `AppIconHeader` and `credit-card` in `BrandedIcon` — are replaced by the real mark.

### Story 20.5: The Design Frames Become Reproducible Source [Enabling]

**As a** future maintainer, **I want** the specimen sheets to be built by committed scripts with
a check that they still match, **So that** a stale generator cannot silently revert corrected
artwork.

**Acceptance Criteria:**

- `docs/design/cardi/tools/` holds the generators that verifiably rebuild their frame, named
  after what they build, resolving their output path from `__file__` so they work in any
  checkout.
- `tools/verify.py` reruns every generator into a temporary directory and asserts byte-identical
  output. It redirects writes at `pathlib.Path.write_text` rather than by rewriting paths in the
  source, because the generators build paths from concatenated literals and a string-replace
  sandbox silently wrote to the real directory and compared a file against itself.
- `docs/design/cardi/frames/*.html` is `.prettierignore`d, because Prettier reflows the HTML and
  a formatted frame could never match its generator again. The pre-existing
  `docs/design/cardi/*.html` entry does **not** cover it — a single `*` does not cross a
  directory separator.
- The frames with no working generator are named in `tools/README.md` with the reason, rather
  than left to be rediscovered.

### Story 20.6: The Tessera Mark

**As a** user, **I want** the Cardì icon to look like what the app holds, a loyalty card,
**So that** it reads naturally on my home screen instead of as an abstract barcode crossed by a
stroke.

Added 2026-10-30. ifero rejected the barcode-stem mark of Story 20.3 as unnatural and chose
**3C Tessera** from a two-round exploration: the ì of Cardì, whose accent is a loyalty card with a
barcode. The reference is `docs/design/cardi/logo-concepts/final/`, with the rounds beside it.

**Acceptance Criteria:**

- The mark is a cream capsule stem under a beam ID-1 card turned **+35°** (a grave, descending
  left to right), the card carrying five ink bars set low under a plain band. In the 1024 icon
  space: stem 156 × 400 at (456, 462), fully rounded; card 264 × 166, radius 28, centred on
  (512, 270); bars 26 / 40 / 18 / 32 / 22 wide with 18 between, under a 62 band and inside a 26
  margin. It replaces the three bars and the beam everywhere the mark is drawn.
- `scripts/build-brand-icons.mjs` draws it from one set of constants and regenerates every
  artefact it owns: app icon, Android adaptive foreground and themed layer, favicon, splash,
  watchOS app icon and complication, Wear OS foreground and themed layers, and the in-app SVGs.
  In every transparent artefact the bars are **holes** through the card, not ink paint. The
  Android scale stays derived from the artwork, and `yarn icons:check` passes.
- The drawn ì in the wordmark (`scripts/lib/brand-wordmark.mjs`) takes the same card as its
  accent, scaled to its 12-unit stem with the same five bars, and everything drawn from the
  wordmark is regenerated.
- Brand moment D on Welcome becomes "scan, then settle" for this mark: the stem stands alone; the
  beam cuts on at the card's left edge at 0.12 s and sweeps at a steady pace to 0.50 s while the
  card is drawn in behind it; the card turns to 38.5° and settles at 35° by 0.84 s. The length is
  unchanged, so the Welcome drawing keeps its timing; the file stays inside the Lottie subset
  both platforms draw, and `build-onboarding-lottie.py --check` passes.
- The design system's mark section and the brand docs describe the new mark, and every test that
  pins the old geometry is updated rather than deleted.
- Welcome, the launch screen and the authentication header show the new mark on iOS and Android,
  in light and dark.

---

## Epic 21: Cardì Rebrand — Native Identity

Finish making the app _Cardì_ everywhere the operating system shows it: the name under the icon,
the colours inside it, and the four separate icon sets across phone, watch and wear.

**Phase:** 3 · **Epic Type:** Feature/Implementation

**The release constraint is the whole shape of this epic.** Every item here is a **native** asset
or a build-time value. `runtimeVersion.policy` is `appVersion`, so none of it can ship as an OTA
update — each needs a store build. That means the pieces cannot be sequenced independently
without buying a store review to put users into a mismatch and another to get them out. **Epic 21
ships as one release**, and story 21.7 is the gate that enforces it.

Story 20.4 already delivered the phone icon, the Android foreground, the themed layer, the
favicon and the splash mark. Everything below points that same generator at the surfaces it did
not cover, or changes a value it does not own.

### Story 21.1: Rename the App to Cardì

**As a** user, **I want** the app to be called what its icon says it is, **So that** the name on
my home screen matches the brand.

**Acceptance Criteria:**

- `expo.name` becomes `Cardì`, and the name renders correctly with its grave accent on both
  platforms' home screens, in the app switcher, and in Settings.
- `expo.slug` is **deliberately unchanged** — it binds the EAS project, and renaming it is a
  migration rather than a rename.
- ✅ **`expo.scheme` DOES change, to `cardi`** (decided by ifero, 2026-09-14 — this reverses the
  original criterion). ⚠️ The reason given for freezing it was **factually wrong**: it claimed the
  scheme is _"referenced by the Supabase redirect allowlist and every OAuth callback"_. It is not.
  `shared/supabase/auth.ts` calls password reset **without a `redirectTo`**, using a `{{ .Token }}`
  OTP flow, and the repository contains no `makeRedirectUri`, no `createURL` and no deep-link
  callback of any kind. No user-facing deep link has shipped — Epic 18's share links are still
  `backlog` — so no public URL carries the scheme yet.
- **The scheme has FIVE sites and they move in the same commit**, or the watch complication
  silently stops opening the app: **`targets/watch/Info.plist:14`, the `CFBundleURLSchemes`
  registration — without it the scheme does not resolve at all**;
  `WatchComplicationWidget.swift`'s `.widgetURL(URL(string: "myloyaltycards://watch"))` (shipped
  and live); `CardListView.swift`'s `WatchComplicationDeepLink` scheme constant (its per-card route
  is dormant, but the parser gates the live one); and **both** assertions in
  `watch-complication-contract.test.ts` — the `widgetURL` string and the Info.plist string, the
  second of which goes red exactly when the registration is correctly updated. `Info.plist`'s
  `CFBundleURLName` is an identifier and stays. The complication is **verified on a device**: a
  scheme mismatch between the widget extension and the app resolves to nothing and logs nothing.
- `ios.bundleIdentifier` and `android.package` are unchanged, so the store listing keeps its
  reviews, ratings and install base.
- **The copy audit spans four surfaces, not one.** Refinement (2026-09-14) measured **44
  user-visible sites across 18 files**: the phone (i18n `en`/`it`, `help-data.json` +
  `help-data.it.json`, `help-fallback.ts`, both privacy policies), **watchOS** (four
  `Localizable.strings`, `Info.plist`, `expo-target.config.js`, the complication's
  `configurationDisplayName`), **Wear OS** (`strings.xml` `app_name`) and the **Supabase
  transactional emails** (two templates plus two `config.toml` subject lines, which reach users
  only on a Supabase deploy, not in the store build).
- **The audit grep must be CASE-INSENSITIVE, and cover the spaced variant.** Three casings ship:
  `myLoyaltyCards`, `MyLoyaltyCards` (nine sites, including all four in `help-data.json`) and the
  spaced `"My Loyalty Cards"` (the onboarding welcome title and the create-account subtitle, both
  locales). A case-sensitive search reports `help-data.json` as clean while every one of its sites
  still reads the old name. Use `grep -rni "loyaltycards\|loyalty cards"`.
- ⛔ **The prebuild question is answered before anything else is changed.** `expo prebuild` derives
  the generated Xcode project and scheme name from `expo.name`, and eighteen references to
  `ios/myLoyaltyCards.xcodeproj` / `scheme: "myLoyaltyCards"` are hardcoded in `fastlane/Fastfile`,
  `package.json`, `scripts/lib/watch-xcodebuild.sh` and `.github/workflows/watchos-tests.yml`.
  Expo's sanitisation of the non-ASCII `ì` is **not known** and has never been run. If the name
  moves, those eighteen move with it in the same story.
- The iOS permission strings use `$(PRODUCT_NAME)`, which is derived from `expo.name`, so the
  camera and photo-library prompts change with no edit. Verify rather than assume.
- **Two identifiers that contain the name destroy user data if renamed** and are out of scope
  alongside `slug` and `scheme`: `DB_NAME` (`core/database/migrations.ts`) orphans every existing
  card database, and `'@myLoyaltyCards/sortPreference'` (`features/cards/hooks/useCardSort.ts`)
  silently resets every user's sort preference.
- Accent handling is verified on a device with a non-Latin keyboard locale, and in Android's
  launcher label truncation at the narrowest supported density.

### Story 21.2: Migrate the Colour Tokens to Ink & Beam

**As a** user, **I want** the app I open to look like the icon I tapped, **So that** the identity
is not a promise the first screen breaks.

**Acceptance Criteria:**

- `PRIMARY_COLORS` stops being the Google Blue ramp. The Cardì palette becomes the app's colours,
  flowing through `tokens/color.json` → Style Dictionary → `tokens.generated.ts` → Unistyles.
- `IDENTITY_COLORS` (added additively in 20.4 so the icon work could land without recolouring the
  app) is reconciled with the migrated palette rather than left as a parallel truth.
- **This is a big bang, by design.** Tokens funnel into all three apps, so there is no supported
  half-migrated state; the migration lands in one change rather than screen by screen.
- Light and dark are both verified: ink structure on cream in light, beam actions on true black
  in dark.
- Every WCAG contrast assertion in `shared/theme/colors.contrast.test.ts` still passes, and beam
  `#FCCC0C` always carries dark text.
- No branded card tile is tinted, washed or recoloured by the migration. The catalogue holds
  **57 brands carrying 44 distinct colours** — 45 distinct literal strings, since the file has a case-inconsistent duplicate (`#ffffff` ×5 vs `#FFFFFF` ×4) — corrected 2026-09-14 from "~45 brands"; they are
  content and must survive untouched. Verified safe by construction — every tile path applies
  `brand.color` verbatim with no theme token interposed. ⚠️ The one change at `CardDetailScreen.tsx:188` — the
  **detail header for cards with no brand** falling back to `theme.primary` — is a **DEFECT to fix,
  not a pass-through to bless** (corrected 2026-09-15). After this migration `theme.primary` is ink,
  so a custom card gets a near-black header above a hero painted in its own accent, while the
  card-detail spec requires inset, header and hero to be **one filled region**. It becomes
  `CARD_COLORS[card.color] ?? <the default>` — **keep the `??` guard**, or an unmapped colour renders
  transparent. ⛔ This also needs an explicit amendment to the design system, which forbids
  "card accent colours used as chrome": a card accent is legal as the card's own full-bleed detail
  field and illegal everywhere else.
- 📌 **`CARD_COLORS` MOVED to Story 21.2a on 2026-09-15.** The five custom-card accents, the
  `CardColor` union and its persisted-data migration, the key-producing `mapHexToCardColor`, the
  runtime fallbacks, both pickers, the colour labels and the phone→watch wire contract are that
  story's scope. This story still _consumes_ `CARD_COLORS` but changes none of its values.

- ⚠️ **`theme.warning` is also the favourite star** (`CardTile`, `CardDetailScreen`), not only a
  warning colour. Changing it repaints **every favourited card tile**. The design system has
  already ruled on this: the badge becomes an ink `#181824` plate carrying a beam `#FCCC0C` star.
- ⚠️ **`shared/theme/sync-tokens.ts` is a third token family outside `tokens/`** — 13 hand-authored
  `{light, dark}` pairs from Figma, carrying oranges and greens this system bans by name. It is not
  reached by the pipeline and needs a recorded decision, not silence.
- **Four hardcoded literals will not come with the migration** and must be handled explicitly:
  `luminance.ts`'s `#1F1F24` (the old `textPrimary`, applied as text colour on brand surfaces) and
  its duplicate in the tile components; and a Material green in the tile's highlight border.
  `BARCODE_FLASH`'s white/black stays hardcoded **on purpose** — the barcode screen ignores theme.
- **Keep every token value 6-digit hex.** At least four sites build colours by string-concatenating
  hex alpha onto a token; an 8-digit or `rgba()` value silently produces an invalid colour.

### Story 21.2a: Migrate the Card Accents and the Colour Keys

**As a** user with custom cards, **I want** my card colours to be the brand's own five accents,
**So that** a card I coloured myself looks like it belongs to the same app as the rest of the
redesign.

📌 **Split out of Story 21.2 on 2026-09-15**, on evidence: eight review rounds put roughly half of
that story's defects in its `CARD_COLORS` clause alone. What had read as one bullet in a token
migration turned out to span two union definition sites, a function that **produces** the keys, four
runtime fallbacks, two pickers, two locale files, nine test files, three per-platform watch colour
maps, and a cross-device wire contract with no test coverage.

**Acceptance Criteria:**

- ⛔ **The central question is a DECISION, taken before any code changes: are the five `CardColor`
  keys NAMES or a WIRE CONTRACT?** Freezing them changes only hex values — no persisted row is
  invalidated, no watch map moves, no wire break is possible — at the cost of two permanently
  misnamed keys (`orange` rendering a beam yellow, `grey` rendering a colour that is not grey).
  Migrating them means every consumer below moves in this same release, plus a data migration for
  persisted rows. Everything else branches on the answer, and it ships in the one release with no
  OTA remedy.
- `CARD_COLORS` in `tokens/color.json` carries the five Cardì accents
  (`#E42424` · `#0C3C84` · `#0C84CC` · `#0C843C` · `#FCCC0C`), regenerated and committed;
  `tokens.generated.test.ts` updated in the same commit. Two shipped keys have **no** equivalent:
  `orange` is banned from this system entirely, and none of the five is a neutral.
- `core/utils/mapHexToCardColor.ts`'s RGB-dominance buckets are **re-derived, not renamed** — it
  runs on every catalogue-brand card creation, and the target palette has two blues, no neutral and
  a yellow.
- The four `?? CARD_COLORS.grey` runtime fallbacks resolve to a named default, with the `??` guard
  kept at every site — an unguarded lookup renders transparent, not recoloured.
- Both locale files' colour labels are re-worded on **either** branch: a renamed key leaks the raw
  key into the picker's accessibility label, and a frozen key would announce a beam-yellow swatch
  as "Orange".
- Both 5-swatch pickers render the new accents.
- **The wire contract is honoured and, for the first time, tested.** The keys cross to both watches
  as `colorHex` and resolve three different ways there. Pin the whole key set in
  `core/wear-sync-contract.test.ts` — not by growing the canonical fixture, which would trip two
  hard-coded card counts on a PR that runs no Kotlin at all.
- **No branded tile is touched.** The 44 distinct catalogue colours across 57 brands are content;
  this story changes only the custom-card palette.
- Verified on device in both schemes, with a custom card in each accent — and, if the keys were
  migrated, a card created **before** the change still rendering after it.

### Story 21.3: watchOS App and Widget Icons

**As an** Apple Watch user, **I want** the watch app to carry the same mark as the phone, **So
that** one glance at both devices does not show two different brands.

**Acceptance Criteria:**

- `targets/watch/AppIcon.png` and `targets/watch/Assets.xcassets/AppIcon.appiconset/` carry the
  Cardì mark, rendered by `scripts/build-brand-icons.mjs` rather than by hand.
- The watch-widget set is complete: all fifteen `App-Icon-*` sizes, `ItunesArtwork@2x.png`, and
  the `OpenAppIcon` imageset in `targets/watch-widget/Assets.xcassets/`. ⚠️ **Every one of those
  fifteen PNGs is currently a flat `#80FF80` placeholder** (verified 2026-09-14 by decoding the
  IDAT) — the `@bacons/apple-targets` default, never replaced because
  `targets/watch-widget/expo-target.config.js` has **no `icon:` key**. Whether that key is even
  supported for a `watch-widget` target is unverified and needs a spike.
- ⚠️ **That appiconset declares iPhone, iPad and ios-marketing idioms and NO watchOS idiom.**
  Either correct it or record, with a source, why an iOS-idiom set is right here.
- ⚠️ **`OpenAppIcon` is a third stale surface, and the one users actually see** — it is the artwork
  the complication renders on the watch face, and it still carries the old blue wallet mark. It was
  absent from this epic until refinement found it (2026-09-14). Note its **76 px** ceiling:
  `ComplicationImage` downsamples at `maxPoint 38, scale 2`, and exceeding `accessoryCorner`'s
  ≈81.6 px budget renders the slot as a grey placeholder — `.frame` and `.scaledToFit` do not help.
- watchOS masks its icon to a **circle**, so the mark is verified against a circular crop, not
  only the squircle the phone uses.
- ⚠️ **`AccentColor.colorset` on both watch targets is ADDED, not updated.** Corrected 2026-09-14:
  both files are byte-identical **empty Xcode stubs** — `{"colors":[{"idiom":"universal"}],…}` with
  no `color` key, no components, no colour space — so `Color.accentColor` (used by the watch sort
  picker) resolves to **system default blue**, not a stale brand colour. There is nothing to change
  and something to define. The generator's own constants are ink `#181824` and beam `#FCCC0C`.
- `AppIcon.appiconset/Contents.json` is left to `expo prebuild`, which owns and rewrites it
  (it is `.prettierignore`d for exactly this reason). It is not hand-edited.
- `yarn icons:check` covers the new artefacts, so the watch icons cannot drift from the phone's.
  **This is the criterion that fixes the bug**; the rest only fix today's symptom. No CI job
  validates any watch icon today — `watchos-tests.yml` would fail on a _missing_ icon but never on
  a stale or placeholder one.
- **The generator renders from constants, not from an SVG.** There is no source file to point at;
  adding an output means adding an entry to its artefact arrays. It knows two primitives (rounded
  rect, rotated rounded rect) and will not silently approximate a third.
- ⚠️ **Not parallel-safe with Story 21.4** — both extend `scripts/build-brand-icons.mjs`. The
  collision is additive, so it is a trivial rebase; land 21.3 first.

### Story 21.4: Wear OS Launcher Icons

**As a** Wear OS user, **I want** the watch app to carry the Cardì mark, **So that** the
identity is consistent across every device the app runs on.

**Acceptance Criteria:**

- `ic_launcher_foreground.png` is generated for all four densities under
  `watch-android/app/src/main/res/mipmap-{h,xh,xxh,xxxh}dpi/`.
- `mipmap-anydpi-v26/ic_launcher.xml` declares the correct foreground and a background matching
  the phone's `adaptiveIcon.backgroundColor`. ⚠️ **This is a live drift bug, not just a stale
  icon:** `watch-android/app/src/main/res/values/colors.xml` declares
  `ic_launcher_background` as `#FFFFFFFF` under a comment claiming it matches `app.json` — which
  now reads `#181824`. Fix the value **and** the comment, which is currently a false assurance.
- ⚠️ **This story does NOT depend on 21.2.** `adaptiveIcon.backgroundColor` is already `#181824`
  (shipped by 20.4), so the value to match is stable today and does not wait on the colour
  migration. Only the shared generator sequences it, behind 21.3.
- **A `<monochrome>` layer is added, or its absence is re-justified.** There is none today, and
  `lint.xml` deliberately leaves `MonochromeLauncherIcon` unsuppressed so the gap stays visible.
  ⚠️ `watch-android/README.md` says the blocking asset "does not exist in this repo" — **it does**,
  as `assets/adaptive-icon-monochrome.png`, generated by Story 20.4. Correct that claim either way.
- The mark is verified against Wear OS's **circular** launcher mask and at the smallest
  launcher size on a 384px round device.
- Rendering is verified on both a round and a square AVD, since Wear OS ships both.
- The generator produces these too, so there is one definition of the mark and not two, **and
  `yarn icons:check` covers them** — hand-copying is exactly what let these drift past the rebrand.
  The README's "faithful downscale of `assets/adaptive-icon.png`" provenance note is corrected with
  them.

### Story 21.5: Store Artwork

**As a** prospective user browsing the store, **I want** the listing to show Cardì, **So that**
what I install matches what I was shown.

**Acceptance Criteria:**

- `assets/store/android-app-icon-512x512.png` and its `-alpha` variant carry the new mark.
- `assets/store/android-store-banner-1024x500.png` is redrawn, and its source
  `assets/images/android-store-banner.svg` is updated with it.
- `assets/store/google-developer-banner-4096x2304.jpg` is redrawn.
- iOS App Store artwork and any screenshots showing the old identity are refreshed, including
  the Wear OS store screenshots under `docs/design/wear-store-screenshots/`. ⚠️ **Those two are
  placeholders from a DEBUG build** — their own README says so, and one of them shows debug-seeder
  fixtures named `Aztec (unsupported)` and `Bad Checksum (invalid)`. They need regenerating from a
  release build regardless of the rebrand; shipping them ships test data to a store listing.
- ⛔ **Listing TEXT has no artefact in this repository, and no file change or CI check can prove it
  was updated.** Corrected 2026-09-14: there is **no `fastlane/metadata/` directory and no
  `eas.json`** anywhere, and every metadata and image upload path is explicitly disabled in the
  Fastfile (`skip_metadata`, `skip_screenshots` on iOS; `skip_upload_metadata`, `_changelogs`,
  `_images`, `_screenshots` on both Android lanes). Title, subtitle, description and keywords are
  maintained **by hand in App Store Connect and Play Console**. Carry the exact new copy in the PR
  body, for both stores and both locales, and say plainly that it is a console task. **Do not
  create a `fastlane/metadata/` tree to satisfy this** — an unuploaded shadow copy of the listing
  looks authoritative and is never read.
- **Decide whether `assets/store/` joins `yarn icons:check`.** Nothing generates, references or
  gates these four files — not a script, not a config, not a workflow — which is why they sat three
  and a half months stale. If they are generated from the mark (the `-alpha` variant is exactly the
  RGB/RGBA split the generator already implements), gating them is nearly free.

### Story 21.6: Bundle and Adopt the Brand Typefaces

**As a** user, **I want** the app set in the brand's own typefaces, **So that** it reads as Cardì
rather than as a default.

The app ships **no custom font at all** — no font files, `expo-font` is not a dependency, and
`TypographyToken` has no `fontFamily` field — so everything renders in the system face while the
design system specifies Space Grotesk, Inter and JetBrains Mono. Every frame in
`docs/design/cardi/frames/` is drawn in a typeface the app has never rendered.

This is **one story, not two**, for the same reason the colour migration is a big bang: bundling
the faces without re-deriving the scale ships something visibly worse than today, because the
current tracking is SF Pro's.

**Acceptance Criteria:**

- Space Grotesk, Inter and JetBrains Mono are bundled at the weights actually used, and no
  others. Licences are confirmed and recorded (all three are OFL) and the bundle-size cost is
  measured, not assumed.
- Fonts load before first paint. This touches the **boot path**, which is the risk: story 16.17
  spent its budget making the native→JS launch handoff seamless, and a face that is not ready at
  first paint reflows text exactly where that work was done. The launch surface must show no
  reflow on a cold start.
- `TypographyToken` gains `fontFamily`, **and its `fontWeight` union widens to admit `'800'`** —
  today it stops at `'700'`, so the design system's `display-lg` is **not representable** and the
  scale cannot land without the type change. (`'500'` is already in the union and used by no token;
  `mono-code` will be its first user.)
- **`expo-font` is added to `dependencies`.** It is installed at 55.0.6 but **undeclared** — it
  arrives transitively via `expo`, unowned and unpinned.
- A decision is made and recorded on whether typography joins the Style Dictionary pipeline —
  today `tokens/` holds only `color.json` and `spacing.json`, `SOURCE_FILES` is a hardcoded
  two-element array, `shared/theme/typography.ts` is hand-authored, and
  `docs/design/CONTRIBUTING-DESIGN.md` explicitly **defers** typography generation to a follow-up.
  Honour that deferral or overturn it in writing.
- **The scale is re-derived, not re-labelled.** The app carries Apple's HIG taxonomy and metrics;
  the design system carries its own. Eleven app tokens map onto seven design-system tokens, so
  the mapping is decided explicitly and the losses are named:

  |          | app today              | design system                          |
  | -------- | ---------------------- | -------------------------------------- |
  | display  | 34/41 · w700 · +0.37pt | 34/40 · w800 · −0.03em · Space Grotesk |
  | headline | 22/28 · w700 · +0.35pt | 24/32 · w700 · −0.01em · Space Grotesk |
  | body     | 17/22 · w400 · −0.41pt | 17/24 · w400 · Inter                   |
  | label    | 13/18 · w400 · −0.08pt | 13/18 · w600 · +0.02em · Inter         |

- **Tracking units are converted, not copied.** The design system specifies `em`; React Native's
  `letterSpacing` is in points, so each value is resolved against its own size (`em × fontSize`).
  Copying the numbers across produces tracking roughly 30× too tight. A test asserts at least one
  conversion so a future copy-paste regression fails loudly.
- ⚠️ **All consumers are migrated, by BOTH paths — there are 20 distinct production files, not 13.** Corrected 2026-09-15: **10** files import `TYPOGRAPHY` directly, and a further **ten** read
  `useTheme().typography` and never write the identifier a grep looks for (eight under
  `features/auth/`, two under `features/onboarding/`). Roughly 16 test files stub a `typography:`
  object and break if token names change. Note also that spread sites (`...TYPOGRAPHY.x`) inherit a
  new `fontFamily` automatically while field-picking sites (`fontSize:` / `lineHeight:` only)
  **silently drop it** — those are the ones that will render in the system face and look almost
  right.
- The four hardcoded monospace sites become JetBrains Mono **through one shared token**. They are
  four different treatments, not one repeated: `Menlo` ×3 and `Courier` ×1, three sizes, three
  tracking values, and two different platform APIs.
- **`GuestModeBanner`'s hardcoded fallbacks are corrected or removed** — it optional-chains the
  scale with `?? 16` against a token whose value is **15**, so it is already drifted and will mask
  a broken read.
- The two watch apps are covered or explicitly deferred to Epic 23 — they carry their own type
  stacks and do not inherit this change.
- Verified on device in both schemes, at the largest and smallest Dynamic Type settings, and the
  contrast suite still passes. ⚠️ The app sets **no `allowFontScaling` and no
  `maxFontSizeMultiplier` anywhere**, so text scales freely and uncapped — and a bundled face has
  different metrics (cap height, x-height, line gap) from the system face. Whether a cap is now
  needed is a decision this story takes, not one it discovers in the field.
- **`theme.typography` (the Unistyles path) gets a decision.** It is registered and fully typed but
  read by **zero** components. Make it canonical or drop it; do not migrate dead plumbing.

### Story 21.7: The Single Rebrand Release [Enabling]

**As a** user, **I want** the rebrand to arrive complete, **So that** I never see an app whose
icon, name and colours disagree with each other.

**Acceptance Criteria:**

- Stories 21.1, 21.2, **21.2a** and 21.3–21.6 — seven — ship in **one** store release on both
  platforms. None is released alone. 21.2a joined the gate when it was split out of 21.2; on its
  migrate branch it edits native watch code that must ship in the same binary.
- The release is verified on real devices before submission: home-screen icon and label, app
  switcher, launch surface into first screen with no colour discontinuity, watch face and watch
  app icon, and the themed (Material You) icon on Android 13+.
- The legacy identity is removed in this release: `assets/app-icons/variants/` (aurora, sunset,
  forest — 10 files, no code references) and the orphaned `app-icon-*.svg` files. ⚠️ **There are
  SEVEN such SVGs, not eight, and only SIX are orphaned** (corrected 2026-09-14 — the earlier count
  made this criterion unsatisfiable as written). The seventh,
  `assets/images/app-icon-variant-aurora.svg`, is **load-bearing**:
  `test/svg-module-resolution.test.tsx` imports it **twice**, once aliased and once relative, as a
  jest `moduleNameMapper` **ordering invariant** — not as a component test. **Repoint that test to
  a Cardì SVG first** (all three generated ones sit in the same directory, so both import styles
  still resolve), prove it green, and only then delete the file.
- ⛔ **`expo.version` is bumped and the release tag is named.** `runtimeVersion.policy` is
  `appVersion` and `version` is still `1.0.0`, so shipping the rebrand at `1.0.0` leaves it sharing
  a runtimeVersion with **every pre-rebrand install**. `expo-updates` is a dependency and
  `eas update --branch` is the documented catalogue-delivery path, so the next OTA would land the
  new tokens and copy on **old binaries** — creating exactly the icon/name/colour mismatch this
  gate exists to prevent, through the one channel the gate does not cover. Nothing else bumps it:
  Fastlane only calls `increment_build_number`, and every existing tag is `v1.0.0-rc.N` while the
  store-upload workflow triggers on a bare `vX.Y.Z`.
- **The release commit is pinned, and Story 22.1 is explicitly in or out.** The upload workflow
  ships whatever is at the tagged commit, and 22.1 can merge before this story publishes. A release
  also carrying a rewritten card tile, `TOUCH_TARGET` 44→48 and two scanner fixes is a different
  rollback from the one below.
- **The two out-of-band deliverables are release steps, not merges**: the Supabase config deploy
  carrying the renamed email templates and subject lines, and the store listing text. No workflow
  does either, and no merge can prove them — without both, this "complete" release ships with the
  old name in every transactional email and in the listing.
- A rollback position is written down before submission, given that no part of this can be
  undone by an OTA update.
- `currentColor` rendering in the in-app mark is confirmed **on a device**. The jest SVG mock
  means a green test suite is no evidence for it. (Story 20.4 verified it against
  react-native-svg's source and left the device check open; its own text mis-routes that gap to
  "story 21.6" — it is discharged **here**.)
- **Every unprovable check is recorded as performed or knowingly accepted**, as a filled table. Most
  of this story's acceptance cannot be proven from the repository, which is the shape the Epic 10
  retrospective closed on (DEC-E10-RETRO-001): a story merged with two validation tables left blank.
  "Not performed" is an acceptable answer; a blank is not.

---

## Epic 22: Cardì Redesign — Screen Implementation

Implement the forty-one frames from Epic 20 across the phone app's 21 routes.

**Phase:** 3 · **Epic Type:** Feature/Implementation

Epic 20 produced the designs and Epic 21 makes the app _called_ and _coloured_ Cardì. This epic
is the one that makes it _look_ like Cardì. It is deliberately **screen by screen**, not a big
bang: unlike colour tokens, layout has a supported half-migrated state, and shipping a redesigned
Wallet while Settings still waits costs nothing.

**Sequencing:** 22.1 first — the shared primitives every other story consumes. Then Wave A
(wallet, card detail, barcode, capture, form, settings, document, auth), which is
illustration-free and can proceed immediately. **Wave B is onboarding.** It was blocked on a
commissioned illustration set that did not exist, because the alternative, inventing a per-screen
illustration style, is explicitly forbidden. **Unblocked 2026-10-24:** ifero adopted a drawn
onboarding set in place of a commissioned one; see the design system's _Illustrations_.

### Story 22.1: Design-System Components [Enabling]

**As a** developer implementing the redesign, **I want** the shared primitives to exist first,
**So that** eight screen stories consume them instead of each inventing its own.

**Acceptance Criteria:**

- The primitives the frames rely on exist as components: the anchored primary-action footer with
  its 1px hairline rule, the card tile, the section header, the hairline-outlined surface, the
  form field with its error idiom, and the sheet.
- The primary-action footer is a flex sibling of the scroll area or an auto-top-margin anchor
  inside it — **never `position: absolute`**, so it does not fight the keyboard. The button is
  always enabled; pressing an incomplete form reveals the field errors.
- Depth comes from tonal layers and hairline outlines only. No shadows, no gradients.
- Storybook stories cover each primitive in light and dark. ⚠️ **Storybook and Chromatic see only
  `shared/components/ui/`** — a primitive placed anywhere else gets no story and no visual
  coverage. And `shared/components/ui/stories.test.tsx` **hard-asserts exactly seven story
  modules**, so it fails the moment an eighth primitive gains a `.stories` file. Update that count
  deliberately rather than meeting it as a mystery red build.
- ⚠️ **Two of these primitives have no specification at all.** The design system contains **no
  section-header spec** and **no sheet spec** beyond a 16px radius and a dark fill — nothing on
  handles, scrim, padding or title size — but ⚠️ **they ARE specced elsewhere, in
  `docs/design/cardi/stitch-prompts-settings.txt`** (`:120` for the section header, `:183` for the
  sheet's 36 × 4 `#D6D6CB` grabber), which the main design document never restates. This story
  **transcribes** them so 22.2–22.10 implement against a decided thing rather than against this
  story's source code — and note the shared `BottomSheet`'s 40 × 4 grabber is the off-spec one, not
  `MultiCodePickerSheet`'s 36 × 4.
- **Extend what already exists rather than duplicating it.** `TextField` and `BottomSheet` are
  already right in shape (eight settings sheets consume the latter); the one hand-rolled outlier is
  the multi-code picker. `shared/components/ui/CardShell.tsx` is **not** the home grid tile — it is
  a separate surface, and conflating them is the obvious mistake here.
- **Busy is not disabled.** A submitting primary button keeps its ink fill and swaps its label for
  a spinner. The shipped `Button` greys out on `loading`, which is exactly the refusal read the
  anchored-footer rule exists to remove.
- The four filed UI-defect stories (16-30 banner occlusion, 16-31 viewfinder geometry, 16-32
  Button `destructive`, 16-33 touch target 44→48) are resolved here rather than separately,
  since they all live in components this story rewrites. ⚠️ **Read their story files first.** They
  exist on `main` with **no tracker key and no catalogue section**, so `check-story-catalogue-sync`
  cannot see them and nothing else points at them — they are the detail this story consumes, and
  they are easy to miss precisely because nothing links to them.
- ⚠️ **Sequenced after 21.2 AND 21.6, by file overlap rather than preference** — this story
  _rewrites_ the very components those two edit. Running them in parallel puts three stories in the
  same files.

### Story 22.2: Wallet

**As a** user, **I want** the home screen redesigned, **So that** my cards read as the content
and the app around them stays quiet.

**Acceptance Criteria:**

- The four wallet frames are implemented: populated, empty, single card and no-results.
- The **two-column grid stays** — it is the shipped, correct layout, and replacing it with
  single-column rows is forbidden.
- No bottom tab bar and no floating action button. Navigation stays a single Home with `+` left
  and gear right in the header.
- Branded tiles are never tinted, washed or recoloured; the ~45 brand colours render exactly as
  the catalogue supplies them.
- No large yellow chrome surface sits near the grid.

### Story 22.3: Card Detail

**As a** user, **I want** the card screen redesigned, **So that** the brand owns the top of the
screen and the chrome recedes as I scroll.

**Acceptance Criteria:**

- The four card-detail frames are implemented, including the scroll transition: header is the
  brand at rest, hero fades, header condenses to cream with a hairline.
- The barcode is reachable in one tap and nothing is ever drawn over it.
- Custom-card accents apply only to cards with no official brand.

### Story 22.4: Barcode Flash

**As a** user at a till, **I want** the barcode screen redesigned, **So that** it scans first try.

**Acceptance Criteria:**

- The three barcode frames are implemented: EAN-13, QR, and card-not-found.
- **Nothing overlays the barcode** — no beam, no scan line, no watermark, no chrome.
- The surround is neutral (black, ink, cream or white) and never a saturated field, which is
  glare beside the scan target at maximum brightness.
- The screen ignores dark mode and stays white, as specified.
- Brightness boost and the existing symbology handling are preserved.

### Story 22.5: Capture

**As a** user adding a card, **I want** the capture flow redesigned, **So that** aiming and
choosing are both obvious.

**Acceptance Criteria:**

- The four capture frames are implemented: brand list, viewfinder, permission refused, and the
  multiple-codes picker.
- The viewfinder is shaped to the expected symbology rather than a fixed square (story 16-31).
- The scan banner is not occluded by the bottom actions (story 16-30).
- The beam **is** allowed here — this is our scanner, not the shop's.

### Story 22.6: The Form Pattern

**As a** user entering card details, **I want** forms redesigned consistently, **So that** the
eight form screens behave the same way.

**Acceptance Criteria:**

- The four form states are implemented — default, error, filled, saving — against the anchored
  footer from 22.1.
- The app's **two** current form treatments are reconciled into one: `AuthScreenLayout` centres
  its content vertically while `CardForm` is top-aligned with a trailing button and 100px of
  bottom padding. Neither is bottom-anchored today.
- The error idiom distinguishes field validation from a failed request.
- `add-card/setup` and `card/[id]/edit` both adopt it.

### Story 22.7: Settings

**As a** user, **I want** settings redesigned, **So that** the list and its sheets match the
system.

**Acceptance Criteria:**

- The six settings frames are implemented, covering both signed-in and guest states and the
  picker and confirm sheets.
- Destructive actions use the corrected `destructive` button variant from 22.1.

### Story 22.8: Document Screens

**As a** user reading help or a policy, **I want** long-form screens redesigned, **So that** they
are legible rather than merely present.

**Acceptance Criteria:**

- The three document frames are implemented: prose, searchable FAQ, and two-column table.
- `help`, `privacy-policy` and `data-summary` all adopt the pattern.
- Body text meets the size policy decided in 21.2.

### Story 22.9: Authentication

**As a** user signing in, **I want** the auth flow redesigned, **So that** the first screens a
new user sees are the brand.

**Acceptance Criteria:**

- The six auth frames are implemented: sign in, create account, forgot password, OTP entry, new
  password with its strength meter, and the request-failed error idiom.
- The strength meter varies width (33/66/100%) and does not rely on colour alone; the green it
  currently uses is not in the palette and is replaced.
- `AppIconHeader` renders the Cardì mark, already delivered in 20.4.

### Story 22.10: Onboarding

**As a** new user, **I want** onboarding redesigned, **So that** my first impression is the brand
at its best.

**Acceptance Criteria:**

- The six onboarding frames are implemented: welcome, mode selection, the difference sheet, the
  scan-or-add-manually screen, and the highlights carousel.
- **Uses the adopted onboarding illustration set** (unblocked 2026-10-24): the four drawings in
  `docs/design/cardi/lottie/`, shipped as Lottie in `assets/animations/onboarding/`. Inventing a
  per-screen illustration style is still forbidden, and the placeholder drawings in the frames are
  references, not artwork.
- Illustrations are two-colour — ink line-work plus one beam accent — with no gradients and no
  third colour.
- The splash-adjacent brand animation lands here if it lands anywhere: the launch surface is
  explicitly anti-spectacle (story 16.17), and onboarding is where the user has already agreed
  to wait.

---

## Epic 23: Cardì on the Watch

Design and then implement the Cardì identity on the two watch apps and the widget — six surfaces
that have **no Cardì design at all**.

**Phase:** 3 · **Epic Type:** Design/Enabling + Feature/Implementation

Epic 20 drew the phone and stopped there. watchOS has `ContentView`, `CardListView` and
`BarcodeFlashView`; Wear OS has `CardListScreen`, `BarcodeScreen` and `SortPickerScreen`; and the
watch widget has its own surface. None of them appears in the forty-one frames.

**This epic cannot be folded into Epic 22**, which implements designs that already exist. A 384px
round screen with no room for a header, no bottom navigation and a rotary input is a different
grammar, not the phone system scaled down — and the phone system's central rule, that the content
is the colour, behaves differently when only one card is on screen at a time.

### Story 23.1: The Watch Grammar [Enabling]

**As a** designer, **I want** a written watch extension to the design system, **So that** the two
watch apps are implemented against a decided thing rather than improvised per screen.

**Acceptance Criteria:**

- ⛔ **The system is AMENDED, not merely extended.** Corrected 2026-09-14: `cardi-design-system.md`
  says _"Frame: 393 × 852 (iPhone-class portrait). Design nothing else. No desktop, no tablet, no
  square canvases"_, and its Forbidden list carries _"any frame that is not 393 × 852"_ — so every
  frame this story must draw is, as the document stands, **prohibited**. An additive watch appendix
  that leaves those rules standing makes the system contradict itself, which is the exact failure
  mode Story 20.1's thesis section exists to prevent.
- ⛔ **There are TWO design systems in this repository, and the watch code implements the other
  one.** The words _watch_, _wear_, _complication_, _crown_ and _widget_ do not appear in the Cardì
  document at all; the watch's actual design language is **"Carbon Utility"**
  (`docs/ux-design-specification.md`), cited by name in the Wear theme's own KDoc. **Reconciling
  the two is this story's real subject.** State whether Carbon is superseded, retired, or survives.
- The system is extended to cover round and square watch faces, at the real sizes: **384 × 384**
  round Wear OS, and the watchOS size classes from **40 mm (162 × 197 pt)** to **49 mm (205 × 251)**
  — a table that lives only in `targets/watch/__tests__/watch-layout-contract.test.ts`, not in any
  source file. 40 mm is the floor because the watch target deploys to watchOS 10.
- **The colour, type and grid divergences are resolved to single values.** watchOS has **no theme
  layer at all** (its accent colorset is an empty stub, every colour a literal at the call site)
  while Wear has a small one; the two disagree with each other and with Cardì on surface fill, body
  text and grey. **`orange` ships as a card-palette key on all three watch surfaces and Cardì bans
  it by name.** watchOS's 44 pt touch target also contradicts the system's own adjudication to 48.
- It states what carries over from the phone (ink and beam, the barcode rules, the refusal to
  overlay a scan target) and what does not (the two-column grid, the header, the anchored
  footer).
- Reference frames are drawn for the **six app screens** — the three **Wear** screens on both
  round and square, the three **watchOS** screens against the size classes above, since watchOS has
  no square variant. The widget is covered by its own four-families criterion.
- Rotary and crown input are designed for, not retrofitted — and the **current asymmetry is
  resolved**: the crown dismisses the barcode screen on watchOS, rotary was explicitly **not
  shipped** on Wear's barcode screen, and Wear's list rotary works only implicitly through the
  scaffold, with no explicit modifier anywhere in the source.
- **The complication is designed across all four families it supports**, within the **76 px** image
  budget — exceeding `accessoryCorner`'s ceiling renders the slot as a grey placeholder, and
  scaling modifiers do not help.
- **New frames either ship a generator or are declared hand-maintained.** `yarn frames:check` diffs
  generator output byte-for-byte; nine of the sixteen existing frames already have no generator and
  say so. A generator's shared helpers must be named with a leading underscore or the checker
  reports no output and goes red.
- The barcode-flash rule is re-derived rather than assumed: a watch screen is small and dim, and
  the constraint that made the phone's surround neutral is stronger here, not weaker.

### Story 23.2: watchOS Implementation

**As an** Apple Watch user, **I want** the watch app to look like Cardì, **So that** it matches
the phone I set it up from.

**Acceptance Criteria:**

- `CardListView` and `BarcodeFlashView` implement the 23.1 frames.
- Ink and beam are defined once for the watch target rather than duplicated per view.
- The barcode flash keeps its current symbology correctness and brightness behaviour.
- Verified on a real Apple Watch, not only the simulator.

### Story 23.3: Wear OS Implementation

**As a** Wear OS user, **I want** the watch app to look like Cardì, **So that** it matches the
phone.

**Acceptance Criteria:**

- `CardListScreen`, `BarcodeScreen` and `SortPickerScreen` implement the 23.1 frames.
- `TransformingLazyColumn` with `ScreenScaffold` and the morph transformation spec is used as
  the list idiom, per the Wear Compose patterns already established in Epic 10.
- Verified on both a round and a square AVD, and on a real device.
- Rotary input is verified on hardware — it cannot be injected headlessly.

### Story 23.4: The Watch Widget and Complication

**As an** Apple Watch user, **I want** the complication to carry the Cardì mark, **So that** the
brand is right at the one size where only the mark fits.

**Acceptance Criteria:**

- The widget's surface implements the 23.1 frames.
- The complication uses the mark at complication sizes, where the reduction rather than the full
  mark may be required — the decision is made against a rendered complication, not asserted.
- The `OpenAppIcon` imageset is consistent with the icon set delivered in 21.3.
