/**
 * Privacy Policy (Italian) — Bundled Offline Content
 */

import { PRIVACY_POLICY_LAST_UPDATED } from './privacy-policy';

export const PRIVACY_POLICY_TITLE_IT = 'Informativa sulla privacy';
export const PRIVACY_POLICY_LAST_UPDATED_LABEL_IT = 'Ultimo aggiornamento';

export const PRIVACY_POLICY_CONTENT_IT = `Informativa sulla privacy
Ultimo aggiornamento: ${PRIVACY_POLICY_LAST_UPDATED}

1. Introduzione

Cardì ("noi") si impegna a proteggere la tua privacy. Questa Informativa sulla privacy spiega quali dati raccogliamo, come li utilizziamo e quali sono i tuoi diritti ai sensi del Regolamento generale sulla protezione dei dati (GDPR) e delle altre leggi applicabili.

Utilizzando Cardì accetti la raccolta e l'uso delle informazioni in conformità con questa informativa. Puoi usare l'app in modalità ospite, senza un account: non ci fornisci alcun indirizzo email e le tue carte non vengono mai caricate: restano sul tuo dispositivo e sul tuo smartwatch, se ne colleghi uno.

2. Dati che raccogliamo

Per tutti, ospiti inclusi:
• Diagnostica di crash ed errori - quando l'app si arresta in modo anomalo o un'operazione non riesce (per esempio, il controllo di un aggiornamento dell'app), viene inviata una segnalazione a Sentry. Contiene l'errore e il punto in cui si è verificato, la versione e la build dell'app, il modello del tuo dispositivo e il sistema operativo. Non contiene nulla che ti identifichi: nessun nome, indirizzo email, ID dell'account, dato delle carte, identificatore del dispositivo o dell'installazione, né la posizione.
• Controllo degli aggiornamenti - quando l'app controlla se c'è un aggiornamento, Expo riceve un identificatore conservato per questa installazione dell'app, con la versione dell'app e la piattaforma. È usato solo per distribuire gli aggiornamenti dell'app.

Quando crei un account, raccogliamo:
• Indirizzo email - usato per autenticazione e recupero dell'account, insieme a un ID dell'account assegnato alla registrazione.
• Dati delle carte fedeltà - nomi delle carte, valori dei codici a barre, formati dei codici, riferimenti al brand, colori e metadati d'uso (stato preferito, numero di utilizzi, ultimo utilizzo e quando ogni carta è stata creata e modificata).
• Registri del consenso - se e quando hai accettato questa Informativa sulla privacy.

Senza un account, le tue carte non vengono mai caricate: sono memorizzate sul tuo dispositivo e sul tuo smartwatch, se ne colleghi uno.

Smartwatch: l'app per Apple Watch scambia le carte solo con il tuo iPhone e non invia nulla ad alcun server. L'app per Wear OS invia a Sentry la diagnostica dei crash, limitata come quella del telefono.

Non raccogliamo:
• Dati di posizione
• Identificatori pubblicitari
• Contatti o foto (un'immagine che scansioni per leggere un codice a barre viene letta sul tuo dispositivo e non viene mai caricata)

Cardì non mostra pubblicità e non usa identificatori pubblicitari.

3. Come utilizziamo i tuoi dati

Utilizziamo i tuoi dati esclusivamente per le seguenti finalità:
• Autenticazione - per identificarti e proteggere il tuo account.
• Backup cloud - per conservare le tue carte fedeltà e sincronizzarle tra i tuoi dispositivi.
• Registri del consenso - per conservare la prova di quando hai accettato questa informativa (obbligo legale ai sensi del GDPR).
• Diagnostica - per individuare e correggere crash ed errori.
• Aggiornamenti dell'app - per distribuire gli aggiornamenti dell'app.

Non utilizziamo i tuoi dati per pubblicità, profilazione o vendita a terzi.

4. Conservazione e sicurezza dei dati

• Archiviazione locale: i dati delle carte sono salvati sul dispositivo in un database SQLite nello spazio privato dell'app. Il database in sé non è cifrato; è protetto dall'isolamento delle app del tuo dispositivo e, se attiva, dalla cifratura del dispositivo stesso. I token di sessione sono conservati nel Portachiavi (iOS) o nel Keystore (Android) tramite expo-secure-store.
• Archiviazione cloud: se crei un account, i tuoi dati vengono salvati in Supabase (PostgreSQL) con Row-Level Security (RLS), in modo che solo tu possa accedere ai tuoi dati.
• Diagnostica: le segnalazioni di crash ed errori sono conservate da Sentry nella sua regione UE. Sentry non conserva l'indirizzo IP da cui arriva una segnalazione.
• Cifratura: i dati in transito sono protetti da TLS 1.2+. I dati nel cloud sono cifrati dal nostro provider di hosting (AES-256).

5. Condivisione dei dati

Non vendiamo né concediamo in affitto i tuoi dati personali e non li condividiamo per fini pubblicitari. I tuoi dati sono trattati solo da questi fornitori di servizi, per nostro conto:
• Supabase - il nostro provider per database cloud e autenticazione, per chi ha un account (accordo sul trattamento dei dati in vigore).
• Sentry - diagnostica di crash ed errori, per tutti, conservata nell'UE, con la versione e la build dell'app, il modello del dispositivo e il sistema operativo e nulla che ti identifichi.
• Expo - distribuisce gli aggiornamenti dell'app e riceve l'identificatore per gli aggiornamenti descritto nella sezione 2.

Come qualsiasi server, Supabase ed Expo ricevono anche l'indirizzo IP da cui arriva ogni richiesta.

6. I tuoi diritti (GDPR)

Ai sensi del GDPR, hai i seguenti diritti:
• Diritto di accesso - puoi vedere le tue carte e i dati del tuo account nell'app, ed esportare le tue carte. Per tutto il resto, contattaci.
• Diritto di rettifica - puoi modificare i dati delle tue carte fedeltà in qualsiasi momento.
• Diritto alla cancellazione - puoi eliminare il tuo account nelle Impostazioni: vengono cancellati dal cloud il tuo account, le tue carte e i tuoi registri del consenso. La cancellazione viene completata entro 30 giorni.
• Diritto alla portabilità dei dati - puoi esportare i tuoi dati in un formato standard.
• Diritto di revoca del consenso - puoi revocare il consenso eliminando il tuo account; puoi continuare a usare Cardì come ospite, senza che le tue carte vengano mai caricate. La revoca non pregiudica la liceità del trattamento basato sul consenso prima della revoca stessa.
• Diritto alla limitazione del trattamento - puoi uscire dall'account in qualsiasi momento: le tue carte smettono di sincronizzarsi con il cloud. Le carte già nel cloud restano lì finché non elimini il tuo account.
• Diritto di presentare reclamo - puoi rivolgerti alla tua autorità locale per la protezione dei dati.

Per esercitare questi diritti, usa le opzioni disponibili nelle Impostazioni dell'app o contattaci all'indirizzo indicato sotto.

7. Conservazione dei dati

• Modalità ospite: le tue carte sono memorizzate sul tuo dispositivo e sul tuo smartwatch, se ne colleghi uno. Non ne conserviamo nessuna.
• Utenti autenticati: i tuoi dati sono conservati finché il tuo account è attivo. Quando elimini l'account, tutti i dati cloud, registri del consenso inclusi, vengono cancellati definitivamente entro 30 giorni.
• Diagnostica di crash ed errori: conservata da Sentry per un massimo di 90 giorni, poi eliminata automaticamente.
• Identificatore per gli aggiornamenti: usato da Expo solo per distribuire gli aggiornamenti dell'app.

8. Privacy dei minori

Cardì non è destinata a minori di 16 anni. Non raccogliamo consapevolmente dati personali di minori. Se ritieni che un minore ci abbia fornito dati personali, contattaci e li elimineremo tempestivamente.

9. Modifiche a questa informativa

Potremmo aggiornare questa Informativa sulla privacy di tanto in tanto. La versione aggiornata sarà identificata dalla data di "Ultimo aggiornamento" in alto. Ti invitiamo a consultare periodicamente questa informativa. L'uso continuato dell'app dopo le modifiche costituisce accettazione della versione aggiornata.

10. Contattaci

Se hai domande su questa Informativa sulla privacy o vuoi esercitare i tuoi diritti, contattaci a:

Email: privacy@cardiapp.eu
`;
