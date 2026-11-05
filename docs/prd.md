---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - 'docs/analysis/brainstorming-session-2025-12-11.md'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
workflowType: 'prd'
lastStep: 11
workflowComplete: true
completedDate: '2025-12-22'
project_name: 'myLoyaltyCards'
user_name: 'Ifero'
date: '2025-12-21'
---

# Product Requirements Document - myLoyaltyCards

**Author:** Ifero
**Date:** 2025-12-21

## Executive Summary

**myLoyaltyCards** is a mobile loyalty card management application designed for the European Union market. The app enables users to digitally store and instantly access their loyalty cards across multiple EU countries through a fast, offline-first architecture with true wearable independence.

**Vision:** Transform the payment moment experience by eliminating the friction of managing physical loyalty cards. Users can instantly access their loyalty cards via Apple Watch or Android Wear without needing their phone, network connectivity, or waiting for apps to load.

**Target Users:** EU consumers who regularly use loyalty cards across multiple retailers and brands, particularly those who value speed and convenience during checkout experiences.

**Core Problem Solved:** Existing loyalty card apps fail at the critical payment moment due to two fundamental issues: (1) dependency on network connectivity that causes loading delays or prevents app access entirely, and (2) lack of true wearable companion apps, forcing users to fumble with their phones during checkout while holding items and with people waiting behind them.

### What Makes This Special

**myLoyaltyCards** differentiates itself through three core capabilities designed for MVP market entry:

1. **Offline-First Architecture:** The app works completely without network connectivity. All loyalty cards are cached locally on both mobile and wearable devices, ensuring instant access regardless of network conditions - in basements, rural areas, or airplane mode. No loading screens, no waiting for server responses.

2. **True Wearable Independence:** Standalone Apple Watch and Android Wear apps that function completely independently from the phone. Cards are synced and stored directly on the wearable device, enabling users to leave their phone in their pocket or bag and access cards with a simple wrist raise and tap.

3. **Intelligent Card Sorting:** Smart ordering algorithm surfaces the right card quickly - most recently used cards appear first, frequently accessed cards stay near the top, and users can pin favorites for instant one-tap access. Combined with wearable form factor, this creates a sub-3-second payment moment experience.

**The MVP Value Proposition:** While everyone else fumbles with their phone or waits for apps to load over slow connections, myLoyaltyCards users simply raise their wrist, tap once, and show their barcode. No phone, no network required, no friction. Speed, reliability, and independence at the moment that matters most.

**Future Enhancements:** Contextual card detection using location services, merchant identification, and usage patterns will further reduce interaction time in V2, but the MVP delivers immediate, measurable value through offline access and wearable independence alone.

## Project Classification

**Technical Type:** mobile_app (iOS/Android) with wearable companion apps (watchOS/Wear OS)

**Domain:** general (consumer utility)

**Complexity:** medium

**Project Context:** Greenfield - new project

**Classification Rationale:**

- **Mobile App Signals:** Multi-platform mobile application (iOS/Android) with native wearable companions requiring offline capabilities, local data synchronization, and cross-platform consistency
- **Medium Complexity:** The MVP scope includes:
  - Multi-platform development (4 platforms: iOS, Android, watchOS, Wear OS)
  - Offline-first data synchronization between phone and wearable
  - Wearable independence (standalone watchOS/Wear OS apps with local storage)
  - Smart sorting algorithm (usage frequency + recency + favorites)
  - Fast barcode rendering optimized for small wearable screens
  - EU multi-country catalogue management (top 20 brands per country)
  - Hybrid backend architecture (server database + JSON delivery for offline caching)

**Key Technical Considerations for MVP:**

- Native vs. cross-platform development decision (React Native/Flutter vs. native Swift/Kotlin)
- Wearable storage constraints and data sync strategy (delta sync vs. full sync)
- Battery optimization for wearable apps (minimize background processes)
- Barcode format support and rendering performance on small screens
- App store compliance across iOS, Android, watchOS, and Wear OS platforms

**Technical Platform Decision (MVP):**

- React Native with Expo for cross-platform development
- Expo dev client with custom native modules for wearable apps
- Single codebase approach for faster time to market
- Note: watchOS companion is embedded in the iOS app archive via `@bacons/apple-targets` (CNG). Apple does not allow standalone watchOS binary uploads — all watchOS apps are distributed inside the iOS IPA.
- Note: NativeWind (Tailwind CSS) is the current styling solution but is **under evaluation** (DEC-S11-RETRO-001) due to persistent implementation friction. Alternatives being considered before next UI-heavy epic.

## Success Criteria

### User Success

**Speed Breakthrough:** Users display their loyalty card on their wearable device in **≤3 seconds** from decision to display, compared to 8-12 seconds with competing phone-based apps or 10-15 seconds with physical cards.

**Primary Success Metrics:**

- **Card Display Speed:** ≤3 seconds on wearable (wrist raise → tap → barcode visible)
- **Offline Reliability:** 100% functionality without network connectivity - zero failed attempts due to connectivity issues
- **Wearable Independence:** Users access cards without touching their phone - standalone wearable operation

**User Outcome:** Users never miss loyalty points due to slow card access, and consistently complete checkout interactions faster than anyone using phone apps or physical cards. The friction of managing loyalty cards is eliminated at the critical payment moment.

**The "Aha!" Moment:** Standing at a register with items in hand, the user raises their wrist, taps once, and shows the barcode while others are still pulling out their phones or searching through wallets. Speed and convenience become immediately obvious.

### Impact Success (Personal Satisfaction & Community)

This is a **community-driven, open-source passion project** with no monetization or advertising. Success is measured by problem-solving impact and community engagement, not revenue.

**Personal Satisfaction:**

- App solves the checkout friction problem reliably for the creator and users
- Code quality is maintainable, well-architected, and contribution-friendly
- Project ships and runs stably without constant maintenance burden
- Pride in building something useful that solves a real problem

**Community Success:**

- Users provide positive feedback confirming the problem is solved
- Organic growth through word-of-mouth as users discover value
- Open-source contributors join to improve the app and expand catalogues
- Positive app store ratings/reviews reflecting genuine user satisfaction
- Active community participation via GitHub issues, PRs, and discussions

**Project Health:**

- Maintainable codebase that creator and contributors can easily work with
- Open-source community forms around the project
- Bug reports filed and collaboratively fixed
- Feature requests indicating real-world usage and engagement
- Catalogue contributions via Pull Requests as community validates value

### Technical Success

**Performance Requirements:**

- **Card Display Latency:** <3 seconds from wrist raise to barcode visible on wearable
- **App Launch Time:** <1 second on phone, <2 seconds on wearable (from cold start)
- **Offline Operation:** 100% feature availability without network connectivity
- **Sync Reliability:** Phone-to-wearable sync succeeds within 30 seconds when both devices connected
- **Battery Efficiency:** Minimal battery impact on wearable device during standby

**Reliability Requirements:**

- **Barcode Rendering:** 100% successful barcode generation and display across supported formats
- **Camera Scanning:** >95% successful barcode capture rate under normal lighting conditions
- **Data Persistence:** Zero data loss during app updates or device sync
- **Cross-Platform Consistency:** Identical user experience on iOS/Android and watchOS/Wear OS

**Technical Quality:**

- Clean, maintainable React Native + Expo codebase
- Open-source contribution guidelines and architecture documentation
- Comprehensive error handling for offline scenarios
- Successful app store deployment across all four platforms (iOS, Android, watchOS, Wear OS)

### Measurable Outcomes

**3-Month Success Indicators:**

- App successfully deployed to all app stores (iOS, Android, watchOS, Wear OS)
- Personal usage validates the 3-second card display goal
- Initial community feedback confirms problem is solved
- Zero critical bugs preventing core functionality
- First community contributions received (code or catalogue PRs)

**12-Month Success Indicators:**

- Active open-source community with regular contributions
- Positive app store ratings (>4.0 stars) reflecting user satisfaction
- Italian catalogue complete and community-maintained
- Organic growth demonstrating word-of-mouth value
- Feature requests and bug reports indicating real-world adoption

**Core Success Signal:** When users say "I can't go back to using my phone app or physical cards - this is too convenient."

## Product Scope

### MVP - Minimum Viable Product (Italy Launch)

**Target:** Validate the wearable-first, offline concept in a single market (Italy) with community-friendly catalogue management.

**Core Features:**

**Mobile Applications:**

- iOS and Android apps (React Native + Expo)
- Offline-first card storage (local persistence)
- Card management interface
- Manual card addition with two input methods:
  - **Camera barcode scanning** (primary method)
  - Manual barcode entry (fallback)
- Card details: name (required), barcode (required), logo (optional)
- Logo handling: user upload OR default placeholder
- Smart card sorting algorithm:
  - Most recently used cards at top
  - Frequently accessed cards prioritized
  - Manual favorites pinning
  - Alphabetical fallback

**Wearable Applications:**

- Apple Watch (watchOS) and Android Wear (Wear OS) apps
- Standalone operation (independent from phone)
- Local card storage on wearable device
- Quick card access (wrist raise → one tap → display)
- Optimized barcode rendering for small screens
- Battery-efficient implementation

**Synchronization:**

- Phone-to-wearable sync when devices connected
- Catalogue updates from repository
- User card sync across devices
- Delta sync for efficiency

**Catalogue System:**

- **Italy-only brand catalogue** (top 20 brands by user awareness)
- JSON file structure in GitHub repository
- Community contributions via Pull Requests
- App fetches latest catalogue during sync
- Catalogue includes: brand name, logo (SVG/PNG), aliases

**Barcode Support:**

- Multiple barcode format support (Code 128, EAN-13, QR, etc.)
- Fast rendering optimized for wearable displays
- Clear, scannable output at point-of-sale

**Out of Scope for MVP:**

- Admin panel (using JSON + PRs instead)
- Other EU countries (Italy only for validation)
- Contextual card detection
- User card submission workflow to official catalogue
- Analytics or usage tracking

### Growth Features (Post-MVP)

**EU Market Expansion:**

- Expand catalogue to additional EU countries (Spain, France, Germany, etc.)
- Country-specific top 20 brand lists
- Multi-language support for UI
- Regional barcode format handling

**Enhanced Catalogue Management:**

- Web-based admin panel for easier catalogue updates
- Formal user card submission workflow
- Community voting on card additions
- Automated logo scraping pipeline (from brainstorming session)

**Personal Cloud Sync (Bring-Your-Own Storage) — Epic 19:**

- Sync through a folder in the user's own cloud storage (iCloud Drive, Dropbox, Google Drive, OneDrive) with no account and no data on our servers
- One OS file-provider folder covers all four providers — no per-provider SDKs, OAuth or API keys
- A household sharing that folder converges on a common card set, giving family sharing without accounts
- Complements (does not replace) the account-based household layer in Epic 14

**Advanced Features:**

- Contextual card detection using location services
- Merchant identification for auto-card selection
- Usage pattern learning for smarter sorting
- Card sharing within community

**Community & Platform:**

- Contributor documentation and onboarding
- Localization and translation contributions
- Platform-specific optimizations based on feedback
- Integration with other loyalty/payment systems

### Vision (Future)

**Full EU Coverage:**

- Comprehensive catalogues for all EU member countries
- Community-driven localization and maintenance
- Unified barcode database across regions

**Intelligence Layer:**

- AI-powered merchant detection
- Predictive card suggestions based on location and context
- Automatic card selection at payment moment
- Learning from user behavior patterns

**Ecosystem Integration:**

- Open API for third-party integrations
- Integration with payment apps and digital wallets
- Cross-platform ecosystem (desktop, tablet extensions)
- Partnerships with loyalty program providers

**Global Expansion:**

- Expand beyond EU to other regions
- International brand catalogue
- Multi-currency and regional compliance handling

## User Journeys

### Journey 1: Marco - The Regular User at Checkout

**Marco is a 32-year-old office worker in Milan** who shops at his local Esselunga supermarket during lunch breaks. He's always rushed, juggling groceries with his work bag, and hates fumbling for his phone or wallet at checkout.

Marco's standing in line at Esselunga with a sandwich and coffee for lunch. As he reaches the cashier, he raises his wrist and taps his Apple Watch to open myLoyaltyCards. His Esselunga Fìdaty card is right at the top (because he uses it most often and the app remembers). One more tap and the barcode appears. The cashier scans it - done. Total time: 3 seconds. The person behind him is still unlocking their phone.

Later that afternoon, he stops at a Conad for groceries. Same process - raises wrist, opens app, scrolls down one card to find Conad, taps to display barcode. Still faster than pulling out his phone, unlocking it, waiting for an app to load over the store's weak WiFi.

**The breakthrough:** Marco realizes he hasn't needed to pull his phone out of his pocket for loyalty cards in weeks. Even if he has to scroll through 3-4 cards to find the right one on his watch, it's still faster and more convenient than the phone app alternative. No network dependency means it works even in the basement supermarket where signal is terrible. His loyalty points collection is now 100% consistent - he never forgets or can't find a card because of slow loading.

### Journey 2: Giulia - First Time Setup

**Giulia is a 28-year-old marketing professional in Rome** who just heard about myLoyaltyCards from a colleague who raved about how fast it is at checkout.

Giulia downloads myLoyaltyCards on her iPhone while commuting home on the metro. She opens the app and sees a welcome screen explaining the concept: loyalty cards on her wrist, no phone needed, works offline.

She taps "Add First Card" and the app gives her two options: browse the Italian catalogue or add manually. She taps the catalogue and sees familiar logos - Esselunga, Conad, Coop, Carrefour. She selects Esselunga (her main supermarket) and the app asks her to scan or manually enter her Fìdaty card number. She pulls out her physical Esselunga card and uses the camera to scan the barcode. Done. The card appears in her list with the Esselunga logo.

She adds two more cards the same way - Conad and her local pharmacy's loyalty card (which isn't in the catalogue, so she adds it manually with the camera scan, uploads the pharmacy logo from her photos, and names it "Farmacia Centro").

**Her three cards are now ready.** Later that evening, she opens the myLoyaltyCards watch app for the first time. The watch app opens instantly showing her three cards (already synced automatically in the background). In the background, it checks for any updates from the phone, but the cards are already there and accessible immediately - no waiting, fully offline.

**The breakthrough:** The next morning at Esselunga, Giulia uses her watch for the first time. Even though her phone is in her bag and she has no signal in the store basement, the watch app opens instantly with all her cards ready. It works perfectly. She deletes her old loyalty card app from her phone that same afternoon - she doesn't need it anymore.

### Journey Requirements Summary

These user journeys reveal the following capabilities needed for myLoyaltyCards:

**Core Card Management:**

- Browse Italian brand catalogue with recognizable logos
- Add cards from catalogue (select brand, scan/enter barcode)
- Add custom cards manually (name, barcode via camera/manual entry, optional logo upload)
- Display card list with smart sorting (recent/frequent at top)
- Tap card to display barcode in scannable format

**Wearable Experience:**

- Standalone watch app that works independently from phone
- Instant app launch on wearable with offline card access
- Background automatic sync from phone to watch
- Cards immediately accessible even during sync
- Optimized barcode display for small wearable screens
- Quick navigation through card list on watch interface

**Onboarding & Setup:**

- Clear welcome/explanation of concept
- Simple card addition workflow (catalogue vs. manual)
- Camera barcode scanning capability
- Optional logo upload for custom cards
- Automatic background sync setup between phone and watch

**Offline & Reliability:**

- 100% offline functionality (no network required to display cards)
- Local storage on both phone and wearable
- Background sync when devices connected (no user intervention)
- Works in areas with poor/no signal (basement stores, rural areas)

**Performance:**

- Sub-3-second card display on wearable
- Instant watch app launch
- Fast barcode rendering
- Smooth scrolling through card list

## Mobile App Specific Requirements

### Platform & Development Strategy

**Technology Stack:**

- React Native with Expo for cross-platform development
- Expo dev client with custom native modules for wearable functionality
- Single codebase for iOS, Android, watchOS, and Wear OS
- Note: Wearable independence may require bare workflow or custom development builds for full native capability

**Target Platforms:**

- iOS (mobile phones - iPhone)
- Android (mobile phones)
- watchOS (Apple Watch - standalone app)
- Wear OS (Android wearables - standalone app)

**Minimum OS Versions:**

- iOS: To be determined based on React Native/Expo requirements
- Android: To be determined based on React Native/Expo requirements
- watchOS: To be determined based on wearable features needed
- Wear OS: To be determined based on wearable features needed

### Authentication & Account Management

**Authentication Model: Optional Accounts (Local-First)**

**Guest Mode (No Account):**

- Users can download and use app immediately without creating account
- All cards stored locally on device only
- Phone-to-watch sync works via direct Bluetooth connection
- No cloud backup - cards live only on user's devices
- Perfect for privacy-conscious users who don't need multi-device sync

**Authenticated Mode (Cloud Sync):**

- **Optional** account creation for users who want cloud backup
- Authentication methods:
  - Email + password
  - Sign in with Apple (required for iOS best practices)
  - Sign in with Google (for Android convenience)
- User data stored in backend database
- Cards automatically sync across all authenticated devices (multiple phones, watches)
- Seamless transition: users can upgrade from guest to authenticated without losing data

**Data Storage Models:**

- **Guest Mode:** Local SQLite/AsyncStorage only
- **Authenticated Mode:** Local storage + cloud backend with bidirectional sync
- Users can delete account and all cloud data at any time (GDPR right to erasure)

### Device Permissions & Features

**Required Permissions:**

**Camera Access:**

- **Purpose:** Barcode scanning for adding loyalty cards
- **Usage:** Only activated when user explicitly taps "Scan Barcode" button
- **Privacy:** Images not stored, only barcode data extracted
- **App Store Justification:** "Scan loyalty card barcodes to add them to your digital wallet"

**Bluetooth/Wearable Connectivity:**

- **Purpose:** Phone-to-watch synchronization
- **Usage:** Background sync when devices are paired and connected
- **Handled by:** React Native Expo wearable modules (platform-managed)

**Not Required (Explicitly Excluded):**

- ❌ Photo Library Access: Removed from MVP (no custom logo uploads to avoid content moderation issues)
- ❌ Location Services: Post-MVP feature (contextual card detection)
- ❌ Push Notifications: Not needed for MVP
- ❌ Contacts: Not applicable
- ❌ Microphone: Not applicable

### Offline Mode & Data Sync

**Offline-First Architecture:**

- **100% offline functionality** - all core features work without network
- Cards stored locally with full read/write capability offline
- Barcode rendering works entirely offline
- Watch app functions independently without phone or network

**Synchronization Strategy:**

**Guest Mode (Local-Only Sync):**

- Phone ↔ Watch direct Bluetooth sync
- No cloud involvement
- Sync triggers: app launch on watch, card added/edited on phone

**Authenticated Mode (Cloud Sync):**

- Phone ↔ Backend (when online)
- Watch ↔ Phone (Bluetooth)
- Watch ↔ Backend (indirect via phone, or direct when watch has connectivity)
- **Conflict Resolution:** Last-write-wins with timestamp
- **Delta Sync:** Only changed cards sync, not full dataset
- **Background Sync:** Automatic when app backgrounded or device wakes

**Sync Reliability:**

- Queued operations when offline
- Retry logic for failed syncs
- User visibility: subtle sync status indicator
- No sync required for core card display functionality

### Privacy & Compliance (GDPR - EU Market)

**GDPR Requirements:**

**Data Collection & Processing:**

- Clear disclosure of what data is collected (email, barcode numbers, card names)
- User consent required before account creation
- Privacy policy accessible before and after account creation
- No tracking, analytics, or advertising (open-source, non-monetized)

**User Rights:**

- **Right to Access:** Users can export all their data
- **Right to Erasure:** Users can delete account and all cloud data
- **Right to Portability:** Data export in JSON format
- **Right to Object:** Users can opt out of cloud sync (use guest mode)

**Data Security:**

- Barcode data encrypted at rest in cloud database
- HTTPS/TLS for all API communication
- No third-party data sharing (open-source, self-contained)

**Privacy Policy Requirements:**

- Required for app store submission
- Must cover: data collected, how it's used, how long it's stored, user rights
- Available in app and on project website/repo

### App Store Compliance

**iOS App Store:**

- Privacy nutrition labels required (data types collected)
- Sign in with Apple required if offering other social logins
- Age rating: 4+ (no objectionable content, no user-generated content in MVP)
- No special permissions that need extended justification

**Google Play Store:**

- Privacy policy URL required
- Data safety section disclosure (user data collected and shared)
- Age rating: Everyone (no objectionable content)
- No special permissions that need extended justification

**Both Stores:**

- Clear app description stating offline capability and optional cloud sync
- Screenshots showing both phone and watch apps
- Disclosure that app is open source (builds trust)

### Open Source Licensing

**License Selection: MIT License**

**Permissions:**

- ✅ Free use, modification, and distribution
- ✅ Commercial and private use
- ✅ Forking with attribution required
- ✅ Original author credit in derivative works

**Attribution Requirements:**

- Copyright notice and license text must be included in all copies
- Derivatives must credit original author
- Project README with clear attribution guidelines

**Benefits for Community:**

- Simple, widely recognized license
- Minimal restrictions encourage contributions
- Protects original author credit
- Permissive for forks and derivatives

### Platform-Specific Considerations

**iOS/watchOS:**

- Apple Watch complications (future enhancement - quick launch)
- Handoff support between iPhone and Apple Watch
- SwiftUI wearable UI optimization (if using native modules)
- App Clip potential (future - quick demo without full install)

**Android/Wear OS:**

- Wear OS tiles for quick card access (future enhancement)
- Android intent handling (future - share cards)
- Material Design adherence
- Battery optimization whitelisting for background sync

**Cross-Platform Consistency:**

- Identical UX across iOS and Android mobile apps
- Adapted but consistent UX on wearables (accounting for screen size)
- Feature parity across all platforms in MVP

### Technical Implementation Considerations

**Barcode Rendering:**

- Support multiple barcode formats (Code 128, EAN-13, EAN-8, QR Code, etc.)
- Optimized for wearable screen sizes (clear, scannable)
- High contrast for point-of-sale scanners
- Adaptive brightness for different lighting conditions

**Performance Requirements:**

- Cold start: <1 second on phone, <2 seconds on watch
- Card display: <3 seconds total from wrist raise to barcode visible
- Smooth scrolling through card list (60fps target)
- Minimal battery impact on wearables during standby

**Storage Constraints:**

- Watch storage limits (typically <100MB for app + data)
- Optimize logo file sizes (SVG preferred, compressed PNG fallback)
- Efficient local database structure

**React Native/Expo Considerations:**

- Custom native modules may be needed for full wearable independence
- Expo Go limitations for watch app development
- Development builds required for testing wearable features
- OTA updates for bug fixes (within app store guidelines)

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach: Problem-Solving MVP**

myLoyaltyCards follows a problem-solving MVP strategy focused on eliminating checkout friction through wearable-first, offline architecture. The MVP solves a real personal pain point: the 8-12 second fumble with phone apps or physical cards at the payment register, replaced by a 3-second wrist-based solution.

**Development Model: Solo Developer Passion Project**

- **Team Size:** Solo developer (Ifero)
- **Timeline:** Flexible, quality-focused development without external pressure
- **Primary User:** Building for personal use first, community adoption is welcome bonus
- **Success Metric:** Personal satisfaction and solving own checkout friction problem
- **Community Model:** Open-source (MIT license) with community contributions welcome via GitHub PRs

**Strategic Rationale:**

This scoping strategy prioritizes:

1. **Complete core experience** over partial features - all 4 platforms (iOS, Android, watchOS, Wear OS) in MVP
2. **Offline reliability** over cloud features - guest mode works perfectly, cloud sync is optional enhancement
3. **Single market validation** (Italy) over multi-country complexity
4. **Community-friendly catalogue** (JSON + PRs) over admin panel complexity
5. **Long-term sustainability** over rushed launch - take time to build it right

### MVP Feature Set (Phase 1) - Italy Launch

**Scope Decision: Full MVP as defined, no descoping**

Despite solo developer resource constraint, MVP includes complete feature set for market validation in Italy.

**Core User Journeys Supported:**

1. **Regular User at Checkout** (Marco's journey)
   - Wearable-first card display in <3 seconds
   - Smart card sorting (recent/frequent/favorites)
   - Offline reliability in any location
   - Multi-card management

2. **New User Onboarding** (Giulia's journey)
   - Simple card addition from Italian catalogue
   - Camera barcode scanning + manual entry
   - Seamless phone-to-watch sync
   - Optional account creation for cloud backup

**Must-Have Capabilities:**

**Mobile Applications (iOS + Android):**

- React Native + Expo cross-platform implementation
- Offline-first card storage (local persistence)
- Card management interface
- Manual card addition:
  - Camera barcode scanning (primary)
  - Manual barcode entry (fallback)
  - No custom logo uploads (default placeholder only)
- Smart card sorting algorithm
- Guest mode (no account required)
- Optional authentication (email/password, Sign in with Apple, Sign in with Google)
- Cloud sync for authenticated users

**Wearable Applications (watchOS + Wear OS):**

- Standalone operation (phone-independent)
- Local card storage on device
- Instant app launch (<2 seconds)
- Optimized barcode display
- Background automatic sync from phone
- Battery-efficient implementation

**Catalogue System:**

- Italy-only brand catalogue (top 20 brands)
- JSON file in GitHub repository
- Community contributions via Pull Requests
- Catalogue includes: brand name, logo (SVG/PNG), aliases
- App fetches latest on sync

**Backend & Sync:**

- Optional backend for cloud sync (authenticated users only)
- Guest mode: phone ↔ watch Bluetooth sync only
- Authenticated mode: bidirectional cloud sync
- GDPR-compliant data handling
- User data export and deletion

**Technical Requirements:**

- Multiple barcode format support
- <3-second card display performance
- 100% offline functionality
- HTTPS/TLS for cloud communication
- Privacy policy and GDPR compliance

**Explicitly Out of Scope for MVP:**

- ❌ Admin panel (using JSON + PRs instead)
- ❌ Custom logo uploads (content moderation concerns)
- ❌ Other EU countries (Italy validation first)
- ❌ Contextual card detection (location-based)
- ❌ Push notifications
- ❌ User card submission workflow to official catalogue
- ❌ Analytics or usage tracking

### Post-MVP Features (Phase 2: Growth)

**EU Market Expansion:**

- Expand catalogue to additional EU countries
- Country-specific top 20 brand lists
- Multi-language UI support
- Regional barcode format handling

**Enhanced Catalogue Management:**

- Web-based admin panel for easier updates
- Formal user card submission workflow
- Community voting on card additions
- Automated logo scraping pipeline

**Advanced Features:**

- Contextual card detection using location services
- Merchant identification for auto-card selection
- Usage pattern learning for smarter sorting
- Card sharing within community

**Household Collaboration (Epic 14):**

Epic 14 is split into two phases. Bill splitting is explicitly out of scope.

_Phase A — Single user (no account required):_

- ~~Card sharing via deeplink~~ — **moved to Epic 18 (2026-08-02)**; see **Card Sharing & Web Handoff** below
- Shopping list: single-user local list (add, tick, delete); persists in SQLite; cloud-migrateable schema from day one

_Phase B — Household (cloud account required):_

- Household membership: create or join a household (max 6 members); owner + member roles; invite via short-lived token (48h expiry, single-use); local-mode users see an upgrade prompt
- Household card sharing: per-card explicit opt-in visibility to household members; no default sharing; card snapshot stored server-side; owner attribution shown to members
- Household shopping list sync: Phase A list gains household sync via Supabase Realtime; last-write-wins conflict resolution; offline queue with flush on reconnect

_Key decisions recorded (2026-06-05):_

- ~~Deeplink HTTPS fallback: silent failure accepted for MVP~~ — **reversed 2026-08-02.** The HTTPS fallback is now the centrepiece of the feature, not an accepted gap; see Epic 18 below
- Household ownership transfer: two-prompt flow on owner account deletion (nominate successor + shared card disposition); personal cards deleted with account (GDPR)
- Max household members: 6 (owner + 5), enforced server-side
- Bill splitting: descoped from Epic 14; may be revisited as a separate epic

**Card Sharing & Web Handoff (Epic 18):**

Share any loyalty card as one HTTPS link. A recipient with the app installed lands on a pre-filled add-card screen; a recipient without it sees a web page that renders the barcode, so the card is usable at a till either way. Absorbs and supersedes Epic 14's Phase A deeplink story, whose custom-scheme-only design left the app-not-installed case unsolved. No account is required on either side.

- Link shape: `https://<domain>/card/#<token>`, where the token is a versioned, checksummed, base64url-encoded payload carrying brand ID, colour, barcode value, barcode format, and name
- No backend: the card details travel inside the link, keeping the feature consistent with the offline-first architecture and the zero-build static site. The trade-off, accepted deliberately, is that a shared link cannot be revoked or expired
- Web fallback: a static page decodes the token client-side and renders the same six barcode formats the app supports, with store badges and an "Open in app" button
- Forward compatibility: an app that does not recognise the shared brand ID or barcode format still saves the card, preserving the real values verbatim and rendering a generic placeholder until an update makes them resolvable

_Key decisions recorded (2026-08-02):_

- Token lives in the URL **fragment**, so it is never transmitted to the web server, never written to an access log, and never leaks via a `Referer` header. Universal and App Links still match, because they match on the `/card/` path
- The token is **encoded, not hashed** — a one-way hash could not be decoded by the web page, which has no server to look it up against. Consequently the link is a **bearer credential**: anyone holding it can use the card, and every surface that produces one says so
- The checksum is corruption detection, not tamper-proofing. Unforgeable links would require a server secret, which this architecture deliberately does not have
- Hosting: a custom domain on a European host, selected by a spike evaluating Netsons, Namecheap, Spaceship, Infomaniak and OVHcloud against data residency and reliability. The current GitHub Pages project page cannot serve `/.well-known/` at a domain root and therefore cannot support Universal Links
- Data residency: **EU/EEA only**, not geographic Europe. This excludes Infomaniak (Switzerland-only datacentres) despite Switzerland's GDPR adequacy decision — a digital-sovereignty preference rather than a compliance necessity, chosen deliberately. Namecheap and Spaceship remain eligible via their Amsterdam region but must have it explicitly selected, and both carry post-_Schrems II_ CLOUD Act exposure through their shared US parent

**User Experience Enhancements:**

- Custom logo uploads with content moderation
- Card categories and organization
- Search and filter capabilities
- Quick actions and shortcuts

### Vision Features (Phase 3: Expansion)

**Full EU Coverage:**

- Comprehensive catalogues for all EU member countries
- Community-driven localization and maintenance
- Unified barcode database across regions

**Intelligence Layer:**

- AI-powered merchant detection
- Predictive card suggestions based on location and context
- Automatic card selection at payment moment
- Learning from user behavior patterns

**Ecosystem Integration:**

- Open API for third-party integrations
- Integration with payment apps and digital wallets
- Cross-platform ecosystem (desktop, tablet extensions)
- Partnerships with loyalty program providers

**Global Expansion:**

- Expand beyond EU to other regions
- International brand catalogue
- Multi-currency and regional compliance handling

### Risk Mitigation Strategy

**Technical Risks: LOW**

**Risk:** React Native + Expo wearable support may have limitations for true standalone functionality

**Mitigation:**

- Expo dev client with custom native modules planned
- Willing to eject to bare workflow if needed
- Solo developer has flexibility to adjust technical approach
- No hard deadline pressure allows for technical exploration

**Market Risks: MINIMAL**

**Risk:** Low community adoption or contribution

**Mitigation:**

- Primary user is the developer himself - MVP succeeds if it solves personal problem
- Community adoption is welcome bonus, not success requirement
- Open-source model lowers barrier to contribution
- Solving real problem increases organic discovery likelihood

**Resource Risks: NONE**

**Risk:** Solo developer capacity constraints

**Mitigation:**

- No external deadlines or pressure
- Flexible timeline allows quality-focused development
- MVP scope is ambitious but developer committed
- Passion project motivation sustains long-term effort
- Can adjust timeline as needed without business impact

**Scope Risks: ACCEPTED**

**Risk:** Full 4-platform MVP is significant undertaking for solo developer

**Mitigation:**

- Developer explicitly chose not to descope
- React Native single codebase reduces platform duplication
- Building for personal use first means incremental value at each milestone
- Can soft-launch to self before public release
- Flexible timeline accommodates scope

### Development Approach

**Iterative Implementation:**

1. **Core phone app** (iOS/Android) with offline card management
2. **Barcode scanning** and display functionality
3. **Italian catalogue** integration (JSON-based)
4. **Wearable apps** (watchOS/Wear OS) with standalone mode
5. **Phone-watch sync** (Bluetooth for guest mode)
6. **Authentication** and cloud sync (optional accounts)
7. **GDPR compliance** and privacy features
8. **App store submission** and launch

**Quality Gates:**

- Personal usage testing at each stage
- Performance validation (<3-second target)
- Offline reliability testing
- Cross-platform consistency verification
- Community code review (open source benefit)

**Success Validation:**

- Developer personally uses app daily at checkout
- Achieves 3-second card display goal
- Works reliably offline in all Italian stores tested
- Community discovers value and begins contributing

## Functional Requirements

### Card Management

- **FR1:** Users can add a loyalty card by selecting a brand from the Italian catalogue
- **FR2:** Users can add a custom loyalty card by manually entering card details
- **FR3:** Users can scan a barcode using the device camera to capture loyalty card information
- **FR4:** Users can manually enter a barcode number as an alternative to scanning
- **FR5:** Users can view a list of all their stored loyalty cards
- **FR6:** Users can edit existing loyalty card information (name, barcode)
- **FR7:** Users can delete loyalty cards they no longer need
- **FR8:** Users can mark loyalty cards as favorites to pin them at the top of the list
- **FR9:** Users can view detailed information about a specific loyalty card

### Barcode Display

- **FR10:** Users can display a loyalty card's barcode in a scannable format
- **FR11:** The system can render barcodes in multiple formats (Code 128, EAN-13, EAN-8, QR Code)
- **FR12:** Users can display barcodes on wearable devices (Apple Watch, Android Wear)
- **FR13:** The system can optimize barcode brightness and contrast for scanner readability

### Italian Brand Catalogue

- **FR14:** Users can browse the Italian loyalty card catalogue on a dedicated screen
- **FR15:** The system can display catalogue brands with their names, logos, and aliases
- **FR16:** The system can fetch the latest catalogue from cloud storage
- **FR17:** The system can cache the catalogue locally for offline browsing
- **FR18:** The system can check for catalogue updates using ISO date-based versioning
- **FR19:** The system can automatically refresh the catalogue when users add a card
- **FR20:** The system can detect if local catalogue is outdated based on last sync timestamp

### Smart Card Sorting

- **FR21:** The system can automatically sort cards based on usage frequency
- **FR22:** The system can display most recently used cards at the top of the list
- **FR23:** Users can pin favorite cards to remain at the top regardless of usage
- **FR24:** The system can apply alphabetical sorting as a fallback for unused cards
- **FR75:** Users can select the card sort mode (Frequently used / Recently added / A–Z) on each surface (phone, watch); the selection persists per surface.
- **FR76:** Card usage (`usageCount`, `lastUsedAt`) is recorded whenever a card's barcode is displayed on any surface, including the watch.

> **Note (FR75/FR76):** Numbered 75/76 as the next free IDs — the 2026-06-09 correct-course proposal labelled these "FR25/FR26", but those are already assigned (guest mode / create account). They sit in this section topically despite the non-contiguous numbers. The **watch defaults to A–Z**, an intentional divergence from FR22's most-recent-first default (a watch-local, glanceable choice; see UX spec §3.3 + Components §5–§6, and ADR-2026-06-09-001 for the FR76 usage-event channel).

### User Authentication & Account Management

- **FR25:** Users can use the app in guest mode without creating an account with full feature access
- **FR26:** Users can create an account using email and password
- **FR27:** Users can sign in using Sign in with Apple
- **FR28:** Users can sign in using Sign in with Google
- **FR29:** Users can log in to an existing account
- **FR30:** Users can log out of their account
- **FR31:** Users can reset their password if forgotten
- **FR32:** Users can delete their account and all associated cloud data
- **FR33:** Users can upgrade from guest mode to authenticated mode without losing data

### Data Synchronization

- **FR34:** The system can sync cards between phone and watch via Bluetooth in guest mode
- **FR35:** The system can sync cards to cloud backend when user is authenticated
- **FR36:** The system can sync cards across multiple devices for authenticated users
- **FR37:** The system can perform background synchronization automatically
- **FR38:** The system can detect network connectivity status for sync operations
- **FR39:** The system can queue sync operations when offline and retry when connection available
- **FR40:** The system can resolve sync conflicts using last-write-wins strategy
- **FR41:** The system can perform delta sync (only changed cards) for efficiency
- **FR42:** The system can sync bidirectionally (phone ↔ watch, phone ↔ cloud)

### Wearable Experience

- **FR43:** Users can open the wearable app and access cards without phone connection
- **FR44:** The system can store loyalty cards locally on the wearable device
- **FR45:** Users can navigate through their card list on the wearable interface
- **FR46:** Users can tap a card on the wearable to display its barcode
- **FR47:** The system can automatically sync new/edited/deleted cards between phone and watch

### Offline Functionality

- **FR48:** Users can access all core features without network connectivity
- **FR49:** Users can add, edit, and delete cards while offline
- **FR50:** Users can display barcodes while offline
- **FR51:** The system can store user cards and cached catalogue locally for offline access
- **FR52:** The system can function on wearables without phone or network connection

### Privacy & Data Management (GDPR)

- **FR53:** Users can view what personal data is collected and stored
- **FR54:** Users can export all their loyalty card data in JSON format
- **FR55:** Users can request deletion of all their data from cloud storage
- **FR56:** The system can encrypt user data at rest in the cloud database
- **FR57:** Users can access the privacy policy from within the app
- **FR58:** Users can provide consent before account creation and data collection

### User Feedback & Error Handling

- **FR59:** The system can display loading indicators during data operations
- **FR60:** The system can show sync status indicators to users
- **FR61:** The system can display confirmation messages for successful operations
- **FR62:** The system can display error messages with clear explanations when operations fail
- **FR63:** The system can show overlay messages when sync fails
- **FR64:** The system can provide appropriate error messages when camera permission is denied
- **FR65:** The system can provide recovery options for failed operations

### App Settings & Preferences

- **FR66:** Users can select their preferred language for the app interface
- **FR67:** Users can toggle between light mode and dark mode
- **FR68:** Users can access app settings from a dedicated settings screen
- **FR69:** Users can view app version and build information

### Data Validation (Post-MVP - Nice to Have)

- **FR70:** The system can validate barcode format based on brand requirements
- **FR71:** The system can provide validation feedback when manually entering barcodes

### Onboarding & Help

- **FR72:** New users can view a welcome screen explaining the app concept
- **FR73:** Users can access help documentation or FAQs
- **FR74:** The system can provide onboarding guidance for first-time card addition

### Personal Cloud Sync — Bring-Your-Own Storage (Epic 19)

- **FR77:** Users can connect a folder in their own cloud storage (iCloud Drive, Dropbox, Google Drive, OneDrive) as a sync target without creating an account
- **FR78:** The system can sync cards bidirectionally through the connected folder
- **FR79:** The system can converge one user's multiple devices on a single card set through the folder
- **FR80:** The system can converge multiple people sharing one folder on a common card set
- **FR81:** Users can disconnect the sync folder while retaining all cards on the device
- **FR82:** Users can view folder-sync status, the last-synced time, and which folder is connected
- **FR83:** The system can enforce exactly one active sync backend (local, account, or folder) and switch between them without data loss
- **FR84:** The system can degrade gracefully when the folder is unreachable and resume syncing when access is restored

> **Note (FR77-FR84):** Numbered from 77 as the next free IDs — FR75/FR76 are already assigned to Smart Card Sorting (see that section's note).

## Non-Functional Requirements

### Performance

**Response Time Requirements:**

- **NFR-P1:** Card display on wearable devices must complete in ≤3 seconds from wrist raise to barcode visible
- **NFR-P2:** Mobile app cold start must complete in ≤1 second
- **NFR-P3:** Wearable app cold start must complete in ≤2 seconds
- **NFR-P4:** Barcode rendering must complete in ≤100ms
- **NFR-P5:** Phone-to-watch sync operations must complete within 30 seconds when devices are connected
- **NFR-P6:** UI interactions (scrolling, navigation) must maintain 60fps for smooth user experience

**Efficiency Requirements:**

- **NFR-P7:** Wearable app must minimize battery impact during standby mode
- **NFR-P8:** Background sync operations must not noticeably impact device battery life
- **NFR-P9:** Catalogue caching must optimize storage usage without degrading performance

### Security & Privacy

**Data Protection:**

- **NFR-S1:** All user data must be encrypted at rest in cloud database using industry-standard encryption (AES-256)
- **NFR-S2:** All API communication must use HTTPS/TLS 1.2 or higher
- **NFR-S3:** User passwords must be hashed using secure hashing algorithms (bcrypt or equivalent)
- **NFR-S4:** Authentication tokens must expire after reasonable timeframes and support secure refresh mechanisms

**Privacy & Compliance:**

- **NFR-S5:** System must comply with GDPR requirements for EU users
- **NFR-S6:** No user tracking, analytics, or advertising is permitted. Crash and error diagnostics are allowed (amended by Story 24.1): crashes and handled errors only, carrying the error, app version and build, device model and OS and nothing that identifies the user: no performance traces, no session tracking, no install or device identifier, no stored IP address, no locale or timezone, no console or touch breadcrumbs, and no account or record ID (UUIDs masked, URL query strings stripped; native crashes trimmed by the Sentry project's server-side scrubbing rules). They must be disclosed in the privacy policy and the store privacy answers
- **NFR-S7:** User data export must be available in machine-readable JSON format
- **NFR-S8:** User account deletion must remove all associated data from cloud storage within 30 days
- **NFR-S9:** Privacy policy must be accessible before and after account creation

**Access Control:**

- **NFR-S10:** Guest mode users must have full feature access with data stored locally only
- **NFR-S11:** Authenticated users' cloud data must be accessible only by the account owner
- **NFR-S12:** Social login (Sign in with Apple, Google) must follow platform security best practices
- **NFR-S13:** Folder-sync data must never transit or be stored on myLoyaltyCards-controlled infrastructure
- **NFR-S14:** Because folder-sync files are written in plaintext into storage the user already trusts with their files, the app must disclose that the storage provider can read them

### Reliability & Availability

**Offline Capability:**

- **NFR-R1:** 100% of core features must function without network connectivity
- **NFR-R2:** Offline data operations must succeed with zero data loss
- **NFR-R3:** Wearable app must function independently without phone or network connection
- **NFR-R4:** Sync conflict resolution must preserve user data integrity using last-write-wins strategy

**Error Handling:**

- **NFR-R5:** All error conditions must provide clear, actionable error messages to users
- **NFR-R6:** Failed sync operations must retry automatically when connectivity is restored
- **NFR-R7:** System must gracefully handle edge cases (low storage, permission denials, network interruptions)

**Data Integrity:**

- **NFR-R8:** No data loss during app updates or device sync operations
- **NFR-R9:** Local data must persist across app restarts and device reboots
- **NFR-R10:** Sync operations must maintain data consistency across devices
- **NFR-R11:** Concurrent writers sharing one sync folder must converge on the same card set without any writer losing data
- **NFR-R12:** Switching the active sync backend must never delete or orphan cards held on the device

### Usability

**Cross-Platform Consistency:**

- **NFR-U1:** User experience must be consistent across iOS and Android mobile platforms
- **NFR-U2:** Wearable apps must provide adapted but consistent UX accounting for screen size constraints
- **NFR-U3:** All platforms must achieve feature parity within MVP scope

**User Experience:**

- **NFR-U4:** Error messages must be clear and avoid technical jargon
- **NFR-U5:** Loading indicators must be present for all operations exceeding 500ms
- **NFR-U6:** User interface must support both light mode and dark mode

**Internationalization:**

- **NFR-U7:** App interface must support user-selectable languages
- **NFR-U8:** Text labels and messages must be externalized for localization

### Maintainability & Code Quality

**Code Standards:**

- **NFR-M1:** Codebase must follow React Native and Expo best practices
- **NFR-M2:** Code must be well-documented with clear comments for complex logic
- **NFR-M3:** Project structure must be organized for easy navigation by contributors

**Open Source Quality:**

- **NFR-M4:** Repository must include comprehensive README with setup instructions
- **NFR-M5:** Contribution guidelines must be clearly documented
- **NFR-M6:** Code must be released under MIT License with proper attribution requirements

**Testing:**

- **NFR-M7:** Critical user flows must have automated tests
- **NFR-M8:** Performance targets must be validated through testing on actual devices

### Accessibility (Post-MVP - Nice to Have)

- **NFR-A1:** Future versions should support screen reader compatibility
- **NFR-A2:** Future versions should support voice control on supported platforms
- **NFR-A3:** Future versions should provide high contrast modes for visual accessibility

---

## Revision History

| Date       | Section(s)                                     | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Decision Ref                         |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 2026-04-11 | Technical Platform Decision                    | **watchOS distribution model clarified.** watchOS apps must be embedded in the iOS IPA archive (Apple requirement). Using `@bacons/apple-targets` Expo Config Plugin for Continuous Native Generation. Source at `targets/watch/`, auto-embedded during `expo prebuild`. No standalone watchOS binary or separate pipeline.                                                                                                                                                                                                                                                                     | ADR-2026-04-11-002, Story 11-6       |
| 2026-04-11 | Technical Platform Decision                    | **NativeWind under evaluation.** Sprint 11 (Epic 13) showed ~23% rework rate from NativeWind interactions. Evaluating alternatives (pure StyleSheet + design tokens, Unistyles, Tamagui) before next UI implementation epic. Current AGENTS.md Pressable restrictions remain in force.                                                                                                                                                                                                                                                                                                          | DEC-S11-RETRO-001                    |
| 2026-04-11 | (Process — not in PRD body)                    | **Definition of Ready (7 gates) and Definition of Done (8 gates) adopted** as mandatory process gates. Party mode is the default for story refinement. See [Epic 13 Retro](sprint-artifacts/epic-13-retro-2026-04-11.md) for full definitions.                                                                                                                                                                                                                                                                                                                                                  | DEC-S11-RETRO-002, DEC-S11-RETRO-003 |
| 2026-04-11 | Key Technical Considerations                   | **Wearable independence note updated.** Future plan: watchOS app becomes a "standalone-companion" with on-watch login for registered users. Distribution model remains the same (embedded in iOS IPA).                                                                                                                                                                                                                                                                                                                                                                                          | Sprint 12 planning                   |
| 2026-08-02 | Functional Requirements, Growth Features, NFRs | **Epic 19 (Personal Cloud Sync — Bring-Your-Own Storage) added.** A third sync posture alongside local-only and account sync: the user connects one folder in their own cloud storage via the OS file provider (covering iCloud Drive, Dropbox, Google Drive and OneDrive with no SDKs or OAuth), and a shared folder gives family sync with no accounts. Adds FR77-FR84 (FR75/FR76 were already taken by Smart Card Sorting), NFR-S13/S14, NFR-R11/R12. Decisions: plaintext JSON, mutually exclusive backends, complements rather than replaces Epic 14. Gated on the 19-1 feasibility spike. | Epic 19 scoping, 2026-08-02          |
