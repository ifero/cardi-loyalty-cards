# Store listing (Story 24.6)

The text ifero pastes into App Store Connect and the Play Console for Cardì 1.0, in English and
Italian, plus the App Review note. **Nothing uploads this file**: there is no `fastlane/metadata/`
and every metadata upload is off in `fastlane/Fastfile`. It is the dated record of what was
submitted, so when a console field changes, change it here in the same step.

- **Written:** 2026-11-13, for version 1.0.0.
- **Screenshots:** `assets/store/screenshots/` (see its README for which file goes in which slot).
- **Privacy answers:** `docs/store/privacy-disclosures.md` (Story 24.1). Every claim below matches
  it: cards stay on the device unless the user signs in, crash and error diagnostics are sent from
  every install, and there are no ads and no advertising identifiers.

Each field sits in its own `text` block under a heading that names its limit, so it can be copied
whole; `test/store-listing.test.ts` checks every block against that limit, checks that no published field
names a retailer from the catalogue, and checks that the App Review note names only the two
screenshot brands.

## Rules this copy follows

- The name is `Cardì`, with the grave accent, in every field and both stores.
- **No third-party brand in any field or keyword** (App Store guidelines 2.3.7, 4.1 and 5.2.1;
  Play's impersonation and intellectual-property policies). The catalogue is described, never
  listed. The **screenshots** show two catalogue cards, Esselunga and IKEA, beside invented shops,
  because real brands are far more recognisable: ifero accepted the review risk on 2026-11-13. The
  App Review note explains them.
- **The codice fiscale** is named in the Italian copy: Italians keep it in their wallet, and the
  catalogue has it. It is not a retailer, so the no-brand rule does not cover it.
- **No claim beyond the privacy policy.** "Works offline", "sync is optional" and "open source" are
  true; "nothing leaves your phone" is not (crash diagnostics and the update check do), so the copy
  never says it.

## Shared answers

| Field                 | App Store Connect                                         | Play Console                                                                                                                                                             |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App name              | Cardì                                                     | Cardì                                                                                                                                                                    |
| Primary category      | Shopping                                                  | Shopping                                                                                                                                                                 |
| Secondary category    | Utilities                                                 | n/a (Play has one category)                                                                                                                                              |
| Tags                  | n/a                                                       | Not chosen yet: pick at submission and record them here                                                                                                                  |
| Age rating            | 4+ (questionnaire below)                                  | Everyone / PEGI 3 (IARC questionnaire below)                                                                                                                             |
| Price                 | Free, no in-app purchases                                 | Free, no in-app products, no ads                                                                                                                                         |
| Contains ads          | n/a                                                       | No                                                                                                                                                                       |
| Support URL / website | `https://cardiapp.eu/`                                    | `https://cardiapp.eu/`                                                                                                                                                   |
| Marketing URL         | `https://cardiapp.eu/`                                    | n/a                                                                                                                                                                      |
| Contact email         | `support@cardiapp.eu`                                     | `support@cardiapp.eu`                                                                                                                                                    |
| Privacy policy URL    | `https://cardiapp.eu/privacy-policy.html`                 | `https://cardiapp.eu/privacy-policy.html`                                                                                                                                |
| Copyright             | 2026 Andrea Pacino                                        | n/a                                                                                                                                                                      |
| Devices               | iPhone and Apple Watch (no iPad: `supportsTablet: false`) | Phone and Wear OS                                                                                                                                                        |
| Wear OS form factor   | n/a                                                       | Opt in under Advanced settings → Form factors; the watch app is not standalone (`com.google.android.wearable.standalone` is `false`: cards reach it only from the phone) |
| Source code           | `https://github.com/ifero/myLoyaltyCards` (MIT)           | same                                                                                                                                                                     |

## English (App Store: English (U.S.); Play: en-US)

### App Store

#### Subtitle · max 30

```text
Loyalty cards on your wrist
```

#### Promotional text · max 170

```text
All your loyalty cards on iPhone and Apple Watch. Works offline, sync is optional, no ads. Open source.
```

#### Keywords · max 100 bytes

```text
loyalty,card,wallet,barcode,rewards,points,membership,fidelity,club,scanner,offline,watch,stamp
```

#### Description · max 4000

```text
Cardì keeps every loyalty card you own in one place, on your iPhone and on your Apple Watch, so the checkout queue never waits for you to dig through your wallet.

ADD A CARD IN SECONDS
• Scan the barcode with the camera, or read it from a photo.
• Pick your shop from the built-in catalogue of Italian loyalty programmes, or create your own card with a name and a colour.
• EAN-13, EAN-8, UPC-A, Code 128, Code 39 and QR codes are supported.

SHOW IT AT THE TILL
• Tap a card and the barcode fills the screen, at full brightness if you want it.
• Sort the list A to Z or by most used, with your favourites on top, or by most recently added.

ON YOUR WRIST
• The Apple Watch app keeps a copy of your cards on the watch: raise your wrist, tap a card, show the barcode.
• It works without your iPhone nearby once the cards have synced.

WORKS OFFLINE
• Your cards live on your device and open without a connection, even underground.
• An account is optional. Sign in only if you want your cards backed up and synced between devices.

YOUR DATA, YOUR CHOICE
• No ads and no advertising identifiers.
• Export your cards to a file and import them back at any time.
• Delete your account, and everything stored with it, from Settings.
• Crash and error reports help us fix bugs; they carry no account, email or card data. The privacy policy explains exactly what is sent and why.

OPEN SOURCE
Cardì is open source under the MIT licence. The code is on GitHub for anyone to read.

Available in English and Italian, in light and dark mode.
```

#### What's New in This Version · max 4000

```text
The first release of Cardì.
```

### Play Console

#### Short description · max 80

```text
Your loyalty cards on your phone and watch. Works offline. No ads. Open source.
```

#### Full description · max 4000

```text
Cardì keeps every loyalty card you own in one place, on your Android phone and on your Wear OS watch, so the checkout queue never waits for you to dig through your wallet.

ADD A CARD IN SECONDS
• Scan the barcode with the camera, or read it from a photo.
• Pick your shop from the built-in catalogue of Italian loyalty programmes, or create your own card with a name and a colour.
• EAN-13, EAN-8, UPC-A, Code 128, Code 39 and QR codes are supported.

SHOW IT AT THE TILL
• Tap a card and the barcode fills the screen, at full brightness if you want it.
• Sort the list A to Z or by most used, with your favourites on top, or by most recently added.

ON YOUR WRIST
• The Wear OS app keeps a copy of your cards on the watch: tap a card and show the barcode.
• It works without your phone nearby once the cards have synced.

WORKS OFFLINE
• Your cards live on your device and open without a connection, even underground.
• An account is optional. Sign in only if you want your cards backed up and synced between devices.

YOUR DATA, YOUR CHOICE
• No ads and no advertising identifiers.
• Export your cards to a file and import them back at any time.
• Delete your account, and everything stored with it, from Settings.
• Crash and error reports help us fix bugs; they carry no account, email or card data. The privacy policy explains exactly what is sent and why.

OPEN SOURCE
Cardì is open source under the MIT licence. The code is on GitHub for anyone to read.

Available in English and Italian, in light and dark mode.
```

#### Release notes · max 500

```text
The first release of Cardì.
```

## Italiano (App Store: Italiano; Play: it-IT)

### App Store

#### Sottotitolo · max 30

```text
Le carte fedeltà al polso
```

#### Testo promozionale · max 170

```text
Tutte le tue carte fedeltà su iPhone e Apple Watch. Funziona offline, la sincronizzazione è facoltativa, niente pubblicità. Open source.
```

#### Parole chiave · max 100 bytes

```text
fedeltà,carte,tessera,portafoglio,codice a barre,punti,raccolta,sconti,scanner,offline,orologio
```

#### Descrizione · max 4000

```text
Cardì tiene tutte le tue carte fedeltà in un unico posto, su iPhone e su Apple Watch, così alla cassa non devi più frugare nel portafoglio.

AGGIUNGI UNA CARTA IN POCHI SECONDI
• Scansiona il codice a barre con la fotocamera, o leggilo da una foto.
• Scegli il negozio dal catalogo integrato dei programmi fedeltà italiani, oppure crea la tua carta con un nome e un colore.
• Tieni a portata di mano anche il codice fiscale, pronto da mostrare in farmacia o allo sportello.
• Sono supportati EAN-13, EAN-8, UPC-A, Code 128, Code 39 e codici QR.

MOSTRALA ALLA CASSA
• Tocca una carta e il codice a barre riempie lo schermo, alla massima luminosità se vuoi.
• Ordina l'elenco dalla A alla Z o per le più usate, con le preferite in cima, oppure per le aggiunte di recente.

AL POLSO
• L'app per Apple Watch tiene una copia delle tue carte sull'orologio: alza il polso, tocca una carta, mostra il codice.
• Una volta sincronizzate, funziona anche senza l'iPhone vicino.

FUNZIONA OFFLINE
• Le tue carte restano sul dispositivo e si aprono anche senza connessione, persino in metropolitana.
• L'account è facoltativo. Accedi solo se vuoi il backup delle carte e la sincronizzazione tra dispositivi.

I TUOI DATI, LA TUA SCELTA
• Niente pubblicità e nessun identificatore pubblicitario.
• Esporta le tue carte in un file e reimportale quando vuoi.
• Elimina l'account, e tutto ciò che vi è associato, dalle Impostazioni.
• I report di crash ed errori ci aiutano a correggere i bug; non contengono dati dell'account, email o carte. L'informativa sulla privacy spiega esattamente cosa viene inviato e perché.

OPEN SOURCE
Cardì è open source con licenza MIT. Il codice è su GitHub, consultabile da chiunque.

Disponibile in italiano e in inglese, con tema chiaro e scuro.
```

#### Novità di questa versione · max 4000

```text
La prima versione di Cardì.
```

### Play Console

#### Descrizione breve · max 80

```text
Le carte fedeltà su telefono e smartwatch. Funziona offline. Niente pubblicità.
```

#### Descrizione completa · max 4000

```text
Cardì tiene tutte le tue carte fedeltà in un unico posto, sul telefono Android e sullo smartwatch Wear OS, così alla cassa non devi più frugare nel portafoglio.

AGGIUNGI UNA CARTA IN POCHI SECONDI
• Scansiona il codice a barre con la fotocamera, o leggilo da una foto.
• Scegli il negozio dal catalogo integrato dei programmi fedeltà italiani, oppure crea la tua carta con un nome e un colore.
• Tieni a portata di mano anche il codice fiscale, pronto da mostrare in farmacia o allo sportello.
• Sono supportati EAN-13, EAN-8, UPC-A, Code 128, Code 39 e codici QR.

MOSTRALA ALLA CASSA
• Tocca una carta e il codice a barre riempie lo schermo, alla massima luminosità se vuoi.
• Ordina l'elenco dalla A alla Z o per le più usate, con le preferite in cima, oppure per le aggiunte di recente.

AL POLSO
• L'app per Wear OS tiene una copia delle tue carte sull'orologio: tocca una carta e mostra il codice.
• Una volta sincronizzate, funziona anche senza il telefono vicino.

FUNZIONA OFFLINE
• Le tue carte restano sul dispositivo e si aprono anche senza connessione, persino in metropolitana.
• L'account è facoltativo. Accedi solo se vuoi il backup delle carte e la sincronizzazione tra dispositivi.

I TUOI DATI, LA TUA SCELTA
• Niente pubblicità e nessun identificatore pubblicitario.
• Esporta le tue carte in un file e reimportale quando vuoi.
• Elimina l'account, e tutto ciò che vi è associato, dalle Impostazioni.
• I report di crash ed errori ci aiutano a correggere i bug; non contengono dati dell'account, email o carte. L'informativa sulla privacy spiega esattamente cosa viene inviato e perché.

OPEN SOURCE
Cardì è open source con licenza MIT. Il codice è su GitHub, consultabile da chiunque.

Disponibile in italiano e in inglese, con tema chiaro e scuro.
```

#### Note di rilascio · max 500

```text
La prima versione di Cardì.
```

## Age rating

### App Store Connect (result: 4+)

Answer **None** or **No** to every item: violence (cartoon, realistic, prolonged), sexual content
and nudity, profanity or crude humour, horror or fear themes, alcohol, tobacco or drugs, medical or
treatment information, simulated or real gambling, contests, mature or suggestive themes,
unrestricted web access, user-generated content, messaging or chat, advertising, parental controls
and age assurance. Cardì shows the user's own cards and nothing else; its only outside link
composes an email to the support address (Help → Contact Support and Submit Feedback), and the
privacy policy is an in-app screen.

### Play Console, IARC questionnaire (result: Everyone / PEGI 3)

- **Category:** Utility, Productivity, Communication, or Other.
- **Violence, fear, sexuality, language, controlled substances, crude humour, gambling:** No to
  every question.
- **Does the app allow users to interact or exchange content with other users?** No. Sync carries
  a user's cards only between that user's own devices.
- **Does the app share the user's current physical location with other users?** No.
- **Does the app allow users to purchase digital goods?** No.
- **Does the app contain ads?** No.
- **Is the app a web browser or search engine?** No.

## App Review note

Paste into App Store Connect → App Review Information → Notes, and into the Play Console's
"App access" instructions where they apply.

```text
Cardì stores the user's own loyalty cards and shows their barcodes at the checkout, on iPhone and Apple Watch (Android and Wear OS on Google Play).

Sign-in is not required. Every feature except backup and sync works without an account: on the welcome screen tap "Get Started", then "Keep cards on this device". An account is optional and only backs up and syncs the user's own cards.

Catalogue logos. When adding a card, the user can pick their shop from a catalogue of Italian loyalty programmes. The catalogue shows each programme's name and logo only so the user can recognise the card they already hold; choosing one fills in the card's name and colour. Cardì is not affiliated with, sponsored by or endorsed by any of these companies, does not issue cards or points, and offers no content, offers or purchases on their behalf. The barcode shown is the one the user scanned or typed. The screenshots show two catalogue cards, Esselunga and IKEA, the way a user who holds those cards sees them in Cardì, with made-up card numbers; no third-party name appears in the app's name, subtitle, description or keywords.

Permissions. Camera: scanning a card's barcode. Photos: reading a barcode from an image the user picks. Both are asked for only when the user starts that action.

Apple Watch. The watch app receives the cards from the iPhone app and keeps a copy on the watch, so a card opens without the phone nearby.

No ads, no in-app purchases, no tracking. Privacy policy: https://cardiapp.eu/privacy-policy.html. Contact: support@cardiapp.eu.
```

### Before pasting

- [ ] The onboarding buttons read as the note says ("Get Started", then "Keep cards on this
      device") on the build under review; reword the note if they changed.
- [ ] If Review asks for an account anyway, add one under Sign-In Information rather than in the
      note.
- [ ] `https://cardiapp.eu/privacy-policy.html` is live (see `docs/store/privacy-disclosures.md`).
