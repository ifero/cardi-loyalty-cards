# Brand catalogue additions — 2026-11-27

Sixteen brands added to `catalogue/italy.json` (57 → 73).

Every brand below issues a **physical loyalty card**, verified on the brand's own
domain. The evidence URL was fetched and the quote read in the page content.

| Brand       | Card programme                                            | Physical card | Category                                     |
| ----------- | --------------------------------------------------------- | ------------- | -------------------------------------------- |
| Famila      | Carta Famila Club                                         | yes           | Supermarket (Selex, Nord-Est/Centro/Sicilia) |
| Sidis       | SIDIS Card                                                | yes           | Supermarket (Salerno/Campania, Gruppo VéGé)  |
| Unes        | Unes Family                                               | yes           | Supermarket (Finiper, Nord/Centro Italia)    |
| NaturaSì    | Community Card NaturaSì (Programma Fedeltà NaturaSì 2026) | yes           | grocery                                      |
| Brico OK    | Brico OK Club Card                                        | yes           | Fai da te                                    |
| Bricofer    | Carta PAYBACK                                             | yes           | Fai da te                                    |
| Brico io    | Brico io CARD                                             | yes           | Fai da te                                    |
| Marionnaud  | Carta Fedeltà Marionnaud (Marionnaud Privilege)           | yes           | beauty                                       |
| Thun        | Thun Lovers (Thun Card / THUN Club)                       | yes           | home-gifts                                   |
| UCI Cinemas | myUCI                                                     | yes           | cinema                                       |
| Trenitalia  | CartaFreccia                                              | yes           | Mobilità / Trasporti                         |
| Telepass    | Tessera Membership Premium (Opzione Premium)              | yes           | Mobilità / Pedaggi                           |
| Autogrill   | My Autogrill                                              | yes           | Autostrade / Ristorazione                    |
| Q8          | Carta PAYBACK Q8 (ClubQ8 / StarQ8)                        | yes           | Carburanti                                   |
| Tamoil      | mycard Tamoil Ricaricabile                                | yes           | Carburanti                                   |

### Scarpamondo (`scarpamondo`)

- **Card**: MyEmotions
- **Evidence**: https://scarpamondo.it/regolamento-myemotions.html
- **Quote**: "In caso di adesione presso i Punti Vendita (punto 4a) la carta fisica verrà rilasciata contestualmente alla registrazione del profilo e sarà attiva da subito."
- **Physical card**: yes — the official regulation states the physical card is
  issued on sign-up at the till, alongside a virtual card carrying a numeric
  code shown at the till.
- **Barcode**: numeric code printed on the card — no `defaultFormat` is
  declared, because the symbology was not read off the card's own printed
  payload (Story 2.9 removed 11 guessed values for exactly this reason).
- **Colour**: `#F9B123` — the golden swoosh in Scarpamondo's own logo SVG,
  `https://scarpamondo.it/on/demandware.static/Sites-Scarpamondo-Site/-/default/dw609a1f79/images/logo-scarpa-black.svg`
  (the wordmark itself is near-black `#171515`)
- **Logo**: the brand's own domain, not Wikimedia Commons — Commons has no
  Scarpamondo file. The source SVG's viewBox clipped the outer strokes of the
  first and last letters, and it used `mix-blend-mode:exclusion`, which
  react-native-svg does not implement; both were fixed before shipping.
- **Confidence**: high

## Evidence

### Famila (`famila`)

- **Card**: Carta Famila Club
- **Evidence**: https://famila.it/famila-nordest/club-famila/carta-fedelta
- **Quote**: "Richiedi gratuitamente la tua carta Famila Club presso il box informazioni del punto vendita Famila più vicino e inizia subito a risparmiare!"
- **Physical card**: The card is handed out free at the in-store info desk and the app version carries the digital card shown at the till.
- **Barcode**: EAN-13 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#E55204` — Wikimedia Commons File:Logo Famila.svg, described on Commons as the Famila Italian supermarket chain logo (fill #e55204, re-drawn from https://www.famila.it/)
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/0/02/Logo_Famila.svg
- **Confidence**: high

### Sidis (`sidis`)

- **Card**: SIDIS Card
- **Evidence**: https://www.sidis.sa.it/fidelity-card-supermercati-sidis/
- **Quote**: "La SIDIS Card è una Carta personale che ogni cliente può richiedere gratuitamente nei supermercati SIDIS, MAXISIDIS e IPERSIDIS."
- **Physical card**: A plastic card is booked and collected at the point of sale, and the brand's own card image shows a glossy blue-and-white plastic card.
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#004489` — Sidis's own logo PNG on its official domain, https://sidis.sa.it/wp-content/uploads/2020/05/Logo-Sidis-Supermercati-Salerno.png (navy #004489 wordmark, crimson #D2091E emblem)
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/4/4d/SIDIS_Logo.svg
- **Confidence**: high

### Unes (`unes`)

- **Card**: Unes Family
- **Evidence**: https://www.unes.it/it/unes-family
- **Quote**: "puoi richiedere Unes Family anche in versione fisica. La carta fisica si aggiunge all'App e non la sostituisce"
- **Physical card**: The physical card was added on top of the formerly app-only Unes Card and is collected in store after the totem procedure.
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#F15A22` — Unes's own current logo SVG on its official domain, https://www.unes.it/media_15d3d103b373b3b65051bcf82aee9fccf2b88473c.svg (fill #F15A22); confirmed by the official Unes app icon
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/9/95/UNES_Supermercati.svg
- **Confidence**: medium

### NaturaSì (`naturasi`)

- **Card**: Community Card NaturaSì (Programma Fedeltà NaturaSì 2026)
- **Evidence**: https://www.naturasi.it/card
- **Quote**: "La Community Card valorizza ancora di più la tua spesa. Ogni tre mesi, seguendo l'andamento delle stagioni, si raccolgono i frutti della spesa con un buono valido entro la fine del mese dalla sua emissione."
- **Physical card**: The official 2026 regulation states 'La Card NaturaSì può essere richiesta gratuitamente presso tutti i Punti Vendita' and treats unregistered cards as 'al portatore', implying a physical carrier.
- **Barcode**: none/unknown — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#487629` — NaturaSì's own logo SVG, https://www.naturasi.it/logo/naturasi-positive.svg (fill #487629)
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/2/2d/Naturas%C3%AC_Logo.svg
- **Confidence**: high

### Brico OK (`brico-ok`)

- **Card**: Brico OK Club Card
- **Evidence**: https://www.bricook.it/brico-ok-card.php
- **Quote**: "BRICO OK CLUB CARD Richiedi subito Brico OK Club Card presso il punto vendita più vicino a te. È gratuita e trasforma i tuoi acquisti in sconti."
- **Physical card**: The plastic Brico OK Club Card is handed out free at the info box of every Brico OK store after signing the paper enrolment form, as stated in the brand's own regulation PDF (bricook.it/bricook-card/modalita-ottenimento-brico-ok-club-card-2026-10-13.pdf).
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#D20A10` — Brico OK's own logo artwork (brand header PNG on www.bricook.it): black #1D1D1B wordmark, red #D20A10 accent, yellow #FFDD00
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/a/a8/Brico_OK_logo.svg
- **Confidence**: high

### Bricofer (`bricofer`)

- **Card**: Carta PAYBACK
- **Evidence**: https://www.bricofer.it/payback
- **Quote**: "Il primo passo è richiedere la tua carta fedeltà ed entrare a far parte del mondo PAYBACK"
- **Physical card**: The physical PAYBACK card is requested free of charge online or at the Bricofer info box and is delivered in physical or digital format; 1 °Punto every 2 euros spent at Bricofer/Self.
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#003772` — Brand's own logo SVG https://www.bricofer.it/media/logo.svg (dark blue #003772 wordmark on yellow #ffd329 square, with green #008d46 and red #d2232c accents); symbology cross-checked at https://showcardsapp.com/en/brands/bricofer
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/6/63/Bricofer_wordmark.svg
- **Confidence**: high

### Brico io (`brico-io`)

- **Card**: Brico io CARD
- **Evidence**: https://www.bricoio.it/it/it/brit/st/bricoiocard
- **Quote**: "Hai già la **Brico io CARD** che ti è stata consegnata in negozio\* e devi registrarti?"
- **Physical card**: The Brico io CARD is handed over physically in the store and then registered online; 1 point per euro spent, 500 points = 5 € discount.
- **Barcode**: none/unknown — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#F52837` — Brico io's own logo artwork: black #000000 field, white wordmark, red #F52837 accent
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/8/83/Brico_Io_-_logo_%28Italy%2C_2014-%29.svg
- **Confidence**: high

### Marionnaud (`marionnaud`)

- **Card**: Carta Fedeltà Marionnaud (Marionnaud Privilege)
- **Evidence**: https://www.marionnaud.it/Chi_Siamo
- **Quote**: "Sottoscrivi la nostra Carta Fedeltà qui, su marionnaud.it, oppure in ogni profumeria Marionnaud e guadagni 1 punto per ogni 1€ speso! Al raggiungimento di 200 punti riceverai il tuo assegno fedeltà da 7,50€."
- **Physical card**: The T&C says you sign 'un apposito modulo di richiesta, in formato cartaceo o elettronico, presso una delle Profumerie Marionnaud', so the card is obtained in the physical branch.
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#631B4B` — Official Wikimedia Commons SVG 'Logo Marionnaud.svg' (single dominant fill, 11 occurrences; brand plum)
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/2/22/Logo_Marionnaud.svg
- **Confidence**: high

### Thun (`thun`)

- **Card**: Thun Lovers (Thun Card / THUN Club)
- **Evidence**: https://www.thun.com/it_it/thun-world/stay-thuned/programma-fedelta-thun-lovers
- **Quote**: "Il Programma Fedeltà che premia i tuoi acquisti. Nel nostro mondo di fiaba facciamo rivivere le emozioni dell'infanzia, i sogni, la magia e il calore."
- **Physical card**: The official FAQ says you can join by 'creando gratuitamente una tessera THUN Lovers Bronzo o acquistando una tessera THUN Lovers Argento' either at a point of sale or on thun.com.
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#007D7B` — Official Wikimedia Commons SVG 'Thun - logo (Italy).svg'
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/b/b2/Thun_-_logo_%28Italy%29.svg
- **Confidence**: medium

### UCI Cinemas (`uci-cinemas`)

- **Card**: myUCI
- **Evidence**: https://assistenza.ucicinemas.it/hc/it-it/articles/8557235255453-Cos-%C3%A8-myUCI
- **Quote**: "myUCI è il programma fedeltà di UCI Cinemas che ti permette di accedere a tante promozioni e sconti, raccogliere punti e ottenere biglietti gratis e omaggi al bar."
- **Physical card**: The official 'Regolamento myUCI' PDF refers to 'presentando la tessera myUCI presso le casse del cinema o il bar dei cinema UCI aderenti' and to a conto telematico per each tessera, while also stating 'La tessera myUCI è digitale e gratuita'.
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#FFED00` — Official Wikimedia Commons SVG 'UCI Logo.svg' (with #152C4E as the dark blue)
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/d/d5/UCI_Logo.svg
- **Confidence**: high

### Trenitalia (`trenitalia`)

- **Card**: CartaFreccia
- **Evidence**: https://www.trenitalia.com/it/cartafreccia/condizioni-di-adesioneedutilizzodellecarte.html
- **Quote**: "di fidelizzazione nel formato plastificato"
- **Physical card**: The conditions list cards "di fidelizzazione nel formato plastificato" (Argento, Oro, Platino, Platino Infinito); the base CartaFreccia level is digital-only, so the plastic card requires reaching a status tier.
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#006A6A` — dominant fill="#006A6A" in the official Wikimedia Commons SVG Trenitalia logo.svg (Trenitalia teal)
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/d/d5/Trenitalia_logo.svg
- **Confidence**: high

### Telepass (`telepass`)

- **Card**: Tessera Membership Premium (Opzione Premium)
- **Evidence**: https://telepass.com/KTI/resources/pdf/norme_condizioni_premium.pdf
- **Quote**: "L’adesione all’Opzione dà diritto alla consegna della Tessera Membership Premium, di seguito la “Card”"
- **Physical card**: The official Premium conditions state the Card is delivered by post to the client's home address in all three enrolment channels.
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#0057B7` — Telepass's own logo artwork: blue #0057B7 wordmark, yellow #FEE01A field
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/d/da/Telepass_%28azienda%29_logo_2021.svg
- **Confidence**: medium

### Autogrill (`autogrill`)

- **Card**: My Autogrill
- **Evidence**: https://www.autogrill.it/faq-e-contatti/
- **Quote**: "Dalla home inserisci il numero di 16 cifre che trovi riportato sul retro della carta in tuo possesso"
- **Physical card**: The brand FAQ states "L'App e la carta My Autogrill sono valide in tutti i bar snack e ristoranti ad insegna Autogrill" and the English FAQ lists showing the physical card as a check-out identification method.
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#ED1C2E` — dominant fill="#ED1C2E" in the official Wikimedia Commons SVG Autogrill-Logo.svg (Autogrill red)
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/e/ec/Autogrill-Logo.svg
- **Confidence**: high

### Q8 (`q8`)

- **Card**: Carta PAYBACK Q8 (ClubQ8 / StarQ8)
- **Evidence**: https://www.q8.it/assistenza/privati/faq/domande-risposte-iscrizione-carta-clubq8
- **Quote**: "Ogni carta PAYBACK Q8 riporta un Codice Cliente di 10 cifre che consente di utilizzare i servizi del ClubQ8 e del Programma Fedeltà PAYBACK."
- **Physical card**: The Q8 FAQ states you can "recarti in una Stazione di Servizio Q8 abilitata e richiedere una carta PAYBACK Q8 al tuo gestore", and the StarQ8 terms describe physical magnetic-stripe cards.
- **Barcode**: Code 128 — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#214199` — Q8's own logo artwork: navy #214199 wordmark (the mark itself is multicoloured — yellow #FCB72D, red #ED1C2D)
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/5/5e/Q8_logo.svg
- **Confidence**: high

### Tamoil (`tamoil`)

- **Card**: mycard Tamoil Ricaricabile
- **Evidence**: https://www.tamoil.it/Prodotti/Carte/my-card-ricaricabile-privati
- **Quote**: "Richiedere mycard Tamoil Ricaricabile è semplice e veloce"
- **Physical card**: The brand page states "Una volta completata l'operazione, la carta verrà recapitata all'indirizzo indicato in fase di registrazione nell'arco di una decina di giorni".
- **Barcode**: magnetic stripe — no `defaultFormat` is declared, because the
  symbology was not read off the card's own printed payload (Story 2.9 removed
  11 guessed values for exactly this reason).
- **Colour**: `#106AA9` — dominant fill="#106AA9" in the official Wikimedia Commons SVG Tamoil.svg (Tamoil brand blue; the red #EF2E47 is the secondary wordmark colour)
- **Logo**: https://upload.wikimedia.org/wikipedia/commons/5/5a/Tamoil.svg
- **Confidence**: medium
