export const it = {
  common: {
    system: 'Sistema',
    english: 'Inglese',
    italian: 'Italiano',
    actions: {
      cancel: 'Annulla',
      continue: 'Continua',
      delete: 'Elimina',
      done: 'Fatto',
      export: 'Esporta',
      import: 'Importa',
      ok: 'OK',
      openSettings: 'Apri impostazioni',
      retry: 'Riprova',
      signIn: 'Accedi',
      signOut: 'Esci',
      createAccount: 'Crea un account',
      sync: 'Sincronizza'
    },
    theme: {
      light: 'Chiaro',
      dark: 'Scuro',
      system: 'Sistema'
    },
    status: {
      never: 'Mai',
      justNow: 'Proprio adesso'
    },
    errors: {
      databaseErrorTitle: 'Errore database',
      initializationFailed: 'Inizializzazione non riuscita'
    },
    launch: {
      accessibilityLabel: 'Cardì, avvio in corso'
    }
  },
  navigation: {
    home: 'Cardì',
    welcome: 'Benvenuto',
    getStarted: 'Inizia',
    highlights: 'Punti salienti',
    addCard: 'Aggiungi carta',
    settings: 'Impostazioni',
    scanBarcode: 'Scansiona codice a barre',
    barcode: 'Codice a barre',
    cardDetails: 'Dettagli carta',
    editCard: 'Modifica carta',
    createAccount: 'Crea account',
    verifyEmail: 'Verifica email',
    signIn: 'Accedi',
    forgotPassword: 'Password dimenticata',
    recoveryOtp: 'Reimposta password',
    newPassword: 'Nuova password',
    whatWeCollect: 'Cosa raccogliamo'
  },
  onboarding: {
    welcome: {
      screenLabel: 'Benvenuto in Cardì',
      title: 'Cardì',
      subtitle: 'Le tue carte fedeltà, sempre con te',
      getStarted: 'Inizia',
      existingAccount: 'Ho già un account',
      existingAccountAccessibilityLabel: 'Ho già un account. Accedi',
      existingAccountHint: 'Apre la schermata di accesso'
    },
    modeSelection: {
      screenAnnouncement: 'Schermata di selezione modalità',
      backAccessibilityLabel: 'Torna indietro',
      title: 'Inizia',
      heading: "Come vuoi\nusare l'app?",
      subtitle: 'Puoi sempre cambiarlo più tardi nelle Impostazioni.',
      localTitle: 'Conserva le carte su questo dispositivo',
      localSubtitle: 'Veloce e privata. Le tue carte restano qui.',
      localEyebrow: 'Puoi creare un account più tardi',
      cloudTitle: 'Sincronizza su tutti i dispositivi',
      cloudSubtitle: 'Crea un account gratuito per salvare e usare le tue carte ovunque.',
      cloudEyebrow: 'Gratis per sempre',
      footer:
        'I tuoi dati restano tuoi. Puoi esportare o importare le carte in qualsiasi momento dalle Impostazioni.',
      whatsDifferenceAccessibilityLabel: 'Qual è la differenza tra le opzioni di archiviazione?',
      whatsDifference: 'Qual è la differenza?'
    },
    modeOption: {
      recommended: 'Consigliato',
      recommendedAccessibilitySuffix: '. Opzione consigliata.',
      accessibilityHint: 'Tocca due volte per selezionare questa opzione di archiviazione'
    },
    infoTooltip: {
      openedAnnouncement: 'Informazioni sulle opzioni di archiviazione aperte',
      accessibilityLabel: 'Informazioni sulle opzioni di archiviazione',
      closeAccessibilityLabel: 'Chiudi informazioni',
      heading: 'Qual è la differenza?',
      body: 'Conserva le carte su questo dispositivo salva le tue carte fedeltà solo su questo telefono. È veloce, privata e funziona offline. Sincronizza su tutti i dispositivi crea un account gratuito così le tue carte vengono salvate e sono disponibili su qualsiasi dispositivo su cui accedi. Puoi cambiare in qualsiasi momento dalle Impostazioni.',
      button: 'Capito'
    },
    highlights: {
      screenAnnouncement: "Punti salienti dell'app",
      skipAccessibilityLabel: "Salta i punti salienti dell'app",
      skip: 'Salta',
      swipeAccessibilityHint: "Scorri a sinistra o a destra per vedere i punti salienti dell'app",
      next: 'Avanti',
      letsGo: 'Andiamo!',
      allCardsTitle: 'Tutte le tue carte in un unico posto',
      allCardsDescription:
        'Conserva ogni carta fedeltà in formato digitale. Niente più ricerche nel portafoglio alla cassa.',
      scanOrManualTitle: 'Scansiona o aggiungi manualmente',
      scanOrManualDescription:
        'Punta la fotocamera su qualsiasi codice a barre oppure digita il numero. In entrambi i casi bastano pochi secondi.',
      yourDataTitle: 'I tuoi dati, le tue regole',
      yourDataDescription:
        'Esporta e importa le tue carte quando vuoi. Nessun vincolo, nessun costo nascosto. Le tue carte appartengono a te.'
    }
  },
  settings: {
    sections: {
      preferences: 'Preferenze',
      about: 'Informazioni',
      data: 'Dati'
    },
    account: {
      fallbackEmail: 'Utente connesso',
      signedIn: 'Accesso effettuato',
      signOutA11y: 'Esci',
      deleteAccount: 'Elimina account',
      deleteAccountA11y: 'Elimina account, azione distruttiva',
      guestTitle: "Non hai ancora effettuato l'accesso",
      guestBody:
        'Accedi o crea un account per salvare le tue carte e sincronizzarle tra i dispositivi.',
      accountDeleted: 'Account eliminato',
      signOutError: 'Impossibile uscire',
      deleteError: "Impossibile eliminare l'account",
      changePassword: 'Cambia password',
      changePasswordA11y: 'Cambia password',
      changePasswordError: 'Impossibile inviare il codice di verifica. Riprova.',
      passwordChanged: 'Password modificata'
    },
    preferences: {
      themeLabel: 'Tema',
      languageLabel: 'Lingua',
      autoBrightnessLabel: 'Luminosità massima nei dettagli carta'
    },
    about: {
      appVersion: 'Versione app',
      catalogue: 'Catalogo',
      helpFaq: 'Aiuto e FAQ',
      privacyPolicy: 'Informativa sulla privacy'
    },
    data: {
      exportData: 'Esporta dati',
      importData: 'Importa dati',
      format: 'JSON'
    },
    theme: {
      pickerTitle: 'Tema',
      optionAccessibilityLabel: 'Tema {{name}}',
      systemDescription: "Sistema usa l'impostazione di aspetto del dispositivo",
      selectedAnnouncement: 'Tema {{theme}} selezionato'
    },
    language: {
      systemValue: 'Sistema ({{language}})',
      selectedAnnouncement: '{{language}} selezionato',
      movedToSheet: 'La selezione della lingua e stata spostata in un pannello dal basso.',
      picker: {
        title: 'Lingua',
        optionAccessibilityLabel: 'Lingua {{name}}'
      }
    },
    export: {
      confirmTitle: 'Esporta le tue carte',
      confirmBody_one:
        'La tua {{count}} carta verrà esportata come file JSON da salvare o condividere.',
      confirmBody_other:
        'Tutte le {{count}} carte verranno esportate come file JSON da salvare o condividere.',
      emptyTitle: 'Niente da esportare',
      emptyBody: 'Non hai ancora carte. Aggiungi la tua prima carta per esportare i dati.',
      shareDialogTitle: 'Esporta carte',
      successTitle: 'Esportazione completata',
      localBackupMessage:
        'Backup salvato localmente in File. La condivisione non è disponibile in questo ambiente.',
      failedMessage: 'Esportazione non riuscita'
    },
    import: {
      invalidFileTitle: 'File non valido',
      noCardDataTitle: 'Nessun dato carta',
      failedTitle: 'Importazione non riuscita',
      noFileSelected: 'Nessun file selezionato.',
      unreadableFile: 'Impossibile leggere il file selezionato.',
      invalidFileMessage: 'Questo file non contiene dati carta validi. Seleziona un file diverso.',
      noCardDataMessage: 'Questo file non contiene dati carta.',
      previewTitle: 'Importa carte',
      totalCardsFound_one: '{{count}} carta trovata',
      totalCardsFound_other: '{{count}} carte trovate',
      newCardsAdded_one: 'Verrà aggiunta {{count}} nuova carta.',
      newCardsAdded_other: 'Verranno aggiunte {{count}} nuove carte.',
      duplicatesSkipped_one: 'Verrà saltato {{count}} duplicato.',
      duplicatesSkipped_other: 'Verranno saltati {{count}} duplicati.',
      invalidEntriesSkipped_one: 'Verrà saltata {{count}} voce non valida.',
      invalidEntriesSkipped_other: 'Verranno saltate {{count}} voci non valide.',
      toastCompleteTitle: 'Importazione completata',
      toastFinishedTitle: 'Importazione terminata',
      toastNoNewCards: 'Nessuna nuova carta importata',
      toastImported_one: '{{count}} carta importata con successo',
      toastImported_other: '{{count}} carte importate con successo',
      toastDuplicatesSkipped_one: '{{count}} duplicato saltato',
      toastDuplicatesSkipped_other: '{{count}} duplicati saltati',
      toastInvalidEntriesSkipped_one: '{{count}} voce non valida saltata',
      toastInvalidEntriesSkipped_other: '{{count}} voci non valide saltate',
      failedMessage: 'Importazione non riuscita'
    },
    signOutSheet: {
      title: 'Vuoi uscire?',
      body: 'Tornerai in modalità ospite. Le tue carte resteranno su questo dispositivo.'
    },
    deleteAccountSheet: {
      step1Title: "Eliminare l'account?",
      step1Body:
        "L'account e tutti i dati sincronizzati verranno eliminati in modo permanente. Le carte salvate localmente su questo dispositivo resteranno disponibili.",
      step2Title: 'Conferma eliminazione account',
      step2Body: "Digita DELETE per confermare l'eliminazione permanente dell'account.",
      confirmInputLabel: 'Digita DELETE per confermare',
      confirmInputHint: "Digita DELETE per abilitare l'eliminazione dell'account",
      confirmKeyword: 'DELETE'
    }
  },
  privacy: {
    title: 'Informativa sulla privacy',
    lastUpdated: 'Ultimo aggiornamento',
    version: 'Versione {{version}}',
    dataSummary: {
      title: 'Cosa raccogliamo',
      description:
        'Questa è una sintesi dei dati che Cardì raccoglie quando hai un account. Gli utenti ospite non hanno dati cloud: tutto resta sul dispositivo.',
      table: {
        categoryHeader: 'Categoria',
        dataCollectedHeader: 'Dati raccolti'
      },
      rows: {
        account: {
          category: 'Account',
          detail: 'Indirizzo email'
        },
        cards: {
          category: 'Carte',
          detail: 'Nomi carte, codici a barre, timestamp'
        },
        app: {
          category: 'App',
          detail: 'Versione app, lingua (per catalogo)'
        },
        location: {
          category: 'Posizione',
          detail: 'Non raccolti'
        },
        contacts: {
          category: 'Contatti',
          detail: 'Non raccolti'
        },
        deviceId: {
          category: 'ID dispositivo',
          detail: 'Non raccolti'
        }
      }
    }
  },
  help: {
    title: 'Aiuto e FAQ',
    subtitle: 'Trova risposte rapide e passaggi per risolvere i problemi.',
    searchPlaceholder: "Cerca nell'aiuto",
    clearSearchAccessibilityLabel: 'Cancella ricerca',
    noResults: 'Nessuna risposta corrisponde a “{{query}}”',
    expandedAccessibilityValue: 'aperto',
    collapsedAccessibilityValue: 'chiuso',
    contactSupport: 'Contatta supporto',
    submitFeedback: 'Invia feedback',
    contactSupportA11y: 'Contatta supporto',
    submitFeedbackA11y: 'Invia feedback',
    openFailedTitle: 'Impossibile aprire',
    contactSupportUnavailable: 'Nessuna app email disponibile. Riprova piu tardi.',
    submitFeedbackUnavailable: 'Pagina feedback non disponibile. Riprova piu tardi.'
  },
  sharedUi: {
    bottomSheet: {
      fallbackLabel: 'Pannello inferiore',
      openedAnnouncement: '{{label}} aperto',
      closedAnnouncement: '{{label}} chiuso'
    },
    formScreen: {
      saving: 'Salvataggio...'
    },
    screenHeader: {
      backAccessibilityLabel: 'Torna indietro'
    }
  },
  syncUi: {
    syncIndicator: {
      syncingA11y: 'Sincronizzazione carte in corso',
      successA11y: 'Carte sincronizzate',
      syncingMessage: 'Sincronizzazione carte…',
      successMessage: 'Tutte le modifiche sincronizzate'
    },
    offline: {
      message_one: 'Offline • {{count}} modifica verra sincronizzata quando torni online',
      message_other: 'Offline • {{count}} modifiche verranno sincronizzate quando torni online'
    },
    errorBanner: {
      retryButton: 'Riprova',
      retryA11yLabel: 'Riprova sincronizzazione cloud',
      retryA11yHint: 'Tenta di sincronizzare di nuovo le carte nel cloud',
      dismissA11yLabel: 'Nascondi errore sincronizzazione',
      dismissA11yHint: 'Nasconde il messaggio di errore'
    },
    conflict: {
      comparisonCard: {
        a11yLabel:
          '{{label}}: {{name}}, codice a barre finale {{barcodeTail}}, aggiornato {{updatedAt}}',
        pointsLabel: 'Punti:',
        barcodeLabel: 'Codice a barre:',
        updatedPrefix: 'Aggiornato:'
      },
      modal: {
        accessibilityLabel: 'Risolvi conflitto di sincronizzazione',
        title: 'Risolvi conflitto di sincronizzazione',
        subtitle:
          'Questa carta e stata modificata sia su questo dispositivo che nel cloud.\nScegli quale versione mantenere.',
        localLabel: 'Questo dispositivo',
        cloudLabel: 'Cloud',
        keepLocal: 'Mantieni locale',
        keepCloud: 'Mantieni cloud',
        keepBoth: 'Mantieni entrambe',
        decideLater: 'Decidi dopo',
        keepLocalA11yLabel: 'Mantieni versione locale',
        keepLocalA11yHint: 'Sostituisce la versione cloud con i dati locali',
        keepCloudA11yLabel: 'Mantieni versione cloud',
        keepCloudA11yHint: 'Sostituisce i dati locali con la versione cloud',
        keepBothA11yLabel: 'Mantieni entrambe le versioni',
        keepBothA11yHint: 'Crea una copia per salvare entrambe le versioni',
        decideLaterA11yLabel: 'Decidi dopo',
        decideLaterA11yHint: 'Chiude la finestra senza risolvere il conflitto'
      }
    }
  },
  auth: {
    fields: {
      email: 'Email',
      password: 'Password',
      newPassword: 'Nuova password',
      confirmPassword: 'Conferma password',
      verificationCode: 'Codice di verifica'
    },
    placeholders: {
      email: 'tu@esempio.com',
      password: 'La tua password',
      newPassword: 'Min 8 car., 1 lettera, 1 numero',
      confirmPassword: 'Inserisci di nuovo la password',
      confirmNewPassword: 'Inserisci di nuovo la nuova password',
      verificationCode: 'Codice a 8 cifre'
    },
    accessibility: {
      emailHint: 'Inserisci il tuo indirizzo email',
      passwordHint: 'Inserisci la tua password',
      passwordRuleHint: 'Almeno 8 caratteri con almeno una lettera e un numero',
      confirmPasswordHint: 'Inserisci di nuovo la password per confermare',
      forgotPasswordEmailHint: 'Inserisci il tuo indirizzo email per ricevere un codice di reset',
      confirmNewPasswordHint: 'Inserisci di nuovo la nuova password per confermare',
      forgotPassword: 'Password dimenticata',
      sendResetCode: 'Invia codice di reimpostazione',
      backToSignIn: "Torna all'accesso",
      verificationCodeLabel: 'Codice di verifica a 8 cifre',
      verificationCodeHint: 'Inserisci il codice a 8 cifre ricevuto via email',
      confirmCode: 'Conferma',
      wrongEmailGoBack: 'Email sbagliata? Torna indietro'
    },
    validation: {
      emailRequired: "L'email è obbligatoria.",
      emailInvalid: 'Inserisci un indirizzo email valido',
      passwordRequired: 'La password è obbligatoria.',
      passwordRule: 'Minimo 8 caratteri, almeno una lettera e un numero.',
      confirmPasswordRequired: 'Conferma la password.',
      passwordsMismatch: 'Le password non corrispondono.',
      consentRequired: "Devi accettare l'Informativa sulla privacy.",
      codeIncomplete: 'Inserisci il codice a 8 cifre.'
    },
    signIn: {
      heading: 'Bentornato',
      subtitle: 'Accedi per sincronizzare le tue carte fedeltà tra i dispositivi',
      forgotPassword: 'Password dimenticata?',
      button: 'Accedi',
      noAccountPrefix: 'Non hai un account?',
      noAccountAction: 'Creane uno',
      incorrectCredentials: 'Email o password non corrette. Riprova.',
      emailNotConfirmed: 'Verifica prima il tuo indirizzo email.',
      networkError: 'Impossibile connettersi. Controlla internet e riprova.',
      genericError: 'Qualcosa è andato storto. Riprova.'
    },
    createAccount: {
      heading: 'Crea account',
      subtitle: 'Unisciti a Cardì',
      button: 'Crea un account',
      alreadyHaveAccount: 'Hai già un account?',
      signInAction: 'Accedi',
      accountExists: 'Esiste già un account con questa email. Accedi invece di crearne uno nuovo.',
      networkError: 'Impossibile connettersi. Controlla internet e riprova.',
      genericError: 'Si è verificato un errore imprevisto. Riprova.'
    },
    forgotPassword: {
      heading: 'Password dimenticata?',
      subtitle: 'Nessun problema. Inserisci la tua email e ti invieremo un codice di reset.',
      sendResetCode: 'Invia codice di reset',
      backToSignIn: "Torna all'accesso",
      networkError: 'Impossibile connettersi. Controlla internet e riprova.',
      genericError: 'Si è verificato un errore imprevisto. Riprova.'
    },
    verifyEmail: {
      heading: 'Verifica la tua email',
      subtitle: 'Abbiamo inviato un codice di 8 cifre a {{email}}',
      confirm: 'Conferma',
      resendCode: 'Invia di nuovo il codice',
      resendIn: 'Invia di nuovo tra {{time}}',
      wrongEmail: 'Email sbagliata?',
      goBack: 'Torna indietro',
      incorrectCode: 'Codice non corretto. Riprova.',
      expiredCode: 'Questo codice è scaduto. Richiedine uno nuovo.',
      verifyUnavailable: 'Impossibile verificare ora. Controlla la connessione e riprova.',
      resendFailure: 'Impossibile inviare di nuovo il codice. Riprova.',
      resendSuccess: 'Codice inviato di nuovo. Inserisci il codice più recente ricevuto via email.'
    },
    recoveryOtp: {
      heading: 'Reimposta la password',
      subtitle: 'Abbiamo inviato un codice di 8 cifre a {{email}}',
      confirm: 'Conferma',
      resendCode: 'Invia di nuovo il codice',
      resendIn: 'Invia di nuovo tra {{time}}',
      wrongEmail: 'Email sbagliata?',
      goBack: 'Torna indietro',
      incorrectCode: 'Codice non corretto. Riprova.',
      expiredCode: 'Questo codice è scaduto. Richiedine uno nuovo.',
      verifyUnavailable: 'Impossibile verificare ora. Controlla la connessione e riprova.',
      resendFailure: 'Impossibile inviare di nuovo il codice. Riprova.',
      resendSuccess: 'Codice inviato di nuovo. Inserisci il codice più recente ricevuto via email.'
    },
    newPassword: {
      heading: 'Imposta una nuova password',
      subtitle: 'Scegli una nuova password sicura per il tuo account.',
      button: 'Aggiorna password',
      networkError: 'Impossibile connettersi. Controlla internet e riprova.',
      genericError: 'Si è verificato un errore imprevisto. Riprova.'
    },
    passwordStrength: {
      weak: 'Debole',
      fair: 'Discreta',
      strong: 'Forte',
      accessibilityLabel: 'Sicurezza della password: {{strength}}'
    },
    busy: {
      signIn: 'Accesso in corso...',
      createAccount: "Creazione dell'account...",
      forgotPassword: 'Invio del codice...',
      verifyCode: 'Verifica in corso...',
      resendCode: 'Invio del codice...',
      newPassword: 'Aggiornamento della password...'
    },
    passwordInput: {
      show: 'Mostra password',
      hide: 'Nascondi password'
    },
    consent: {
      checkboxLabel: "Accetto l'Informativa sulla privacy",
      checkboxHint: 'Attiva o disattiva il consenso alla privacy',
      labelPrefix: "Accetto l'",
      policy: 'Informativa sulla privacy',
      policyHint: "Apre l'Informativa sulla privacy"
    },
    guestBanner: {
      title: 'Proteggi le tue carte',
      body: 'Crea un account gratuito per salvare le tue carte e accedervi su tutti i tuoi dispositivi',
      dismissA11y: 'Chiudi banner'
    },
    migrationBanner: {
      retryA11yLabel: 'Riprova backup carte',
      dismissA11yLabel: 'Chiudi'
    }
  },
  addCard: {
    selection: {
      screenAnnouncement: 'Schermata di selezione del tipo di carta',
      heading: 'Aggiungi carta',
      backAccessibilityLabel: 'Torna indietro'
    },
    search: {
      placeholder: 'Cerca per nome',
      accessibilityLabel: 'Cerca marchi per nome',
      clearAccessibilityLabel: 'Cancella ricerca'
    },
    list: {
      results: 'Risultati',
      popularCards: 'Carte popolari',
      allCards: 'Tutte le carte',
      noCardsFound: 'Nessuna carta trovata',
      showingResults: 'Mostra risultati per "{{query}}"'
    },
    otherCard: {
      label: 'Altra carta',
      subtitle: 'Aggiungi una carta fedeltà personalizzata',
      accessibilityLabel: 'Altra carta. Aggiungi una carta fedeltà personalizzata'
    },
    scanner: {
      screenAnnouncement: 'Schermata scanner di codici a barre',
      cameraAccessTitle: 'Accesso alla fotocamera necessario',
      cameraAccessBody:
        "L'accesso alla fotocamera è necessario per scansionare i codici a barre.\nPuoi abilitarlo nelle Impostazioni oppure inserire il codice manualmente.",
      cameraErrorTitle: 'Errore fotocamera',
      cameraStartError: "Impossibile avviare l'anteprima della fotocamera.",
      cameraErrorFallback: 'Errore fotocamera. Riprova.',
      cameraPermissionDeniedError: 'Permesso fotocamera negato',
      checkingPermission: 'Controllo autorizzazione fotocamera...',
      instruction: 'Punta la fotocamera verso il codice a barre',
      processingImage: 'Scansione immagine…',
      scanFromImage: 'Scansiona da immagine',
      scanFromImageAccessibilityLabel:
        'Scansiona un codice a barre da una foto o da uno screenshot',
      manualEntry: 'Inserisci manualmente il numero della carta',
      manualEntryAccessibilityLabel: 'Inserisci manualmente il numero della carta',
      floatingBackAccessibilityLabel: 'Torna indietro'
    },
    multiCode: {
      title: 'Trovati più codici a barre',
      subtitle: 'Tocca quello che corrisponde alla tua carta fedeltà',
      cancelAccessibilityLabel: 'Annulla e chiudi il selettore di codici a barre',
      codeAccessibilityLabel: '{{format}}, codice {{value}}',
      formats: {
        CODE128: 'Code 128',
        EAN13: 'EAN-13',
        EAN8: 'EAN-8',
        QR: 'Codice QR',
        CODE39: 'Code 39',
        UPCA: 'UPC-A'
      }
    },
    noCodeFound: {
      // See the note in en.ts — two messages replace one that conflated a
      // decoder miss with an unreadable file (Story 16.23).
      notFoundMessage:
        'Non è stato possibile leggere un codice a barre in questa immagine — prova a inquadrare la carta',
      scanFailedMessage: 'Si è verificato un problema durante la lettura di questa immagine',
      // See the note in en.ts — deliberately does not mention "this image".
      pickerFailedMessage: 'Non è stato possibile aprire le tue foto',
      // "Prova un'altra immagine" would presume a first image; none was picked.
      pickerFailedRetry: 'Riprova',
      dismissAccessibilityLabel: 'Chiudi il messaggio di errore',
      retryAccessibilityLabel: "Prova a scansionare un'altra immagine",
      retry: "Prova un'altra immagine",
      manualEntryAccessibilityLabel: 'Inserisci manualmente il numero della carta',
      manualEntry: 'Inseriscilo manualmente'
    },
    setup: {
      catalogueAnnouncement: 'Schermata di configurazione carta',
      customAnnouncement: 'Schermata nuova carta',
      catalogueHeading: 'Configura carta',
      customHeading: 'Nuova carta',
      storeNameLabel: 'Nome negozio',
      storeNamePlaceholder: 'Inserisci il nome del negozio',
      storeNameRequired: 'Il nome del negozio è obbligatorio',
      cardNumberLabel: 'Numero carta',
      cardNumberPlaceholder: 'Inserisci o scansiona il numero della carta',
      colorLabel: 'Colore carta',
      inlineScanAccessibilityLabel: 'Scansiona il codice a barre con la fotocamera'
    }
  },
  cards: {
    home: {
      searchPlaceholder: 'Cerca carte fedeltà',
      searchAccessibilityLabel: 'Cerca carte fedeltà',
      clearSearchAccessibilityLabel: 'Cancella ricerca',
      noResults: 'Nessuna carta corrisponde a “{{query}}”',
      singleCardTip: 'Tocca + per aggiungere altre carte al tuo portafoglio',
      emptyStateTitle: 'Nessuna carta ancora',
      emptyStateSubtitle:
        'Aggiungi la tua prima carta fedeltà e\nnon perdere mai i premi alla cassa',
      emptyStateCta: 'Aggiungi la tua prima carta',
      cardTileAccessibilityHint: 'Apre i dettagli della carta',
      cardTileFavouriteAccessibilityLabel: '{{name}}, preferita'
    },
    sort: {
      count_one: '{{count}} carta',
      count_other: '{{count}} carte',
      buttonAccessibilityLabel: 'Ordina per {{label}}',
      buttonHint: 'Apre le opzioni di ordinamento',
      sheetTitle: 'Ordina per',
      frequent: 'Più usate',
      recent: 'Aggiunte di recente',
      az: 'A-Z'
    },
    colors: {
      // Vedi en.ts: le cinque chiavi CARD_COLOR_KEYS sono identificatori
      // congelati (Story 21.2a), quindi due non descrivono più il loro colore —
      // `orange` è il giallo beam #FCCC0C e `grey` è l'azzurro #0C84CC.
      blue: 'Blu scuro',
      red: 'Rosso',
      green: 'Verde',
      orange: 'Giallo',
      grey: 'Azzurro',
      accessibilityLabel: 'Colore {{color}}{{selected}}',
      selectedSuffix: ', selezionato'
    },
    formatPicker: {
      label: 'Formato codice a barre',
      accessibilityLabel: 'Selettore formato codice a barre'
    },
    form: {
      nameLabel: 'Nome carta',
      namePlaceholder: 'Inserisci il nome della carta',
      nameAccessibilityLabel: 'Nome carta',
      nameRequired: 'Il nome della carta è obbligatorio',
      nameMax: 'Il nome della carta deve contenere al massimo 50 caratteri',
      barcodeLabel: 'Numero del codice a barre',
      barcodePlaceholder: 'Inserisci il numero del codice a barre',
      barcodeAccessibilityLabel: 'Numero del codice a barre',
      barcodeRequired: 'Il numero del codice a barre è obbligatorio',
      barcodeFormatLabel: 'Formato codice a barre (rilevato automaticamente)',
      barcodeFormat: {
        CODE128: 'Code 128 (universale)',
        EAN13: 'EAN-13 (vendita al dettaglio)',
        EAN8: 'EAN-8 (compatto)',
        QR: 'Codice QR',
        CODE39: 'Code 39 (industriale)',
        UPCA: 'UPC-A (Nord America)'
      }
    },
    add: {
      successTitle: 'Carta aggiunta',
      failedMessage: 'Impossibile aggiungere la carta'
    },
    details: {
      copiedToClipboard: 'Copiato negli appunti ✓',
      invalidId: 'ID carta non valido',
      notFound: 'Carta non trovata',
      loadFailed: 'Impossibile caricare i dettagli della carta',
      missingDescription: 'La carta che stai cercando non esiste o è stata eliminata.',
      backAccessibilityLabel: 'Torna indietro',
      favoriteToggleLabel: 'Preferito',
      viewFullscreenAccessibilityLabel: 'Mostra il codice a barre a schermo intero',
      viewFullscreenHint: 'Apre il codice a barre a schermo intero per la scansione',
      tapToEnlarge: 'Tocca per ingrandire',
      brightnessToggleLabel: 'Luminosità massima',
      brightnessToggleHint:
        'Imposta lo schermo alla massima luminosità per far leggere il codice a barre',
      numberLabel: 'Numero',
      copyAccessibilityHint: 'Tocca due volte per copiare il numero del codice a barre',
      colorLabel: 'Colore',
      addedLabel: 'Aggiunta',
      manageSection: 'Gestisci',
      editAction: 'Modifica carta',
      deleteAccessibilityLabel: 'Elimina carta',
      deletingAccessibilityLabel: 'Eliminazione carta in corso',
      deleteAction: 'Elimina carta',
      deleting: 'Eliminazione...',
      deleteConfirmTitle: 'Eliminare la carta?',
      deleteConfirmBody:
        'Vuoi davvero eliminare "{{name}}"? Questa azione non può essere annullata.',
      copyFailedTitle: 'Errore',
      copyFailedMessage: 'Impossibile copiare il codice a barre negli appunti'
    },
    flash: {
      dismissOverlayA11yLabel: 'Chiudi overlay codice a barre',
      dismissOverlayA11yHint: 'Tocca ovunque per chiudere',
      barcodeValueA11yLabel: 'Numero codice a barre per {{title}}: {{value}}',
      copyHint: 'Tieni premuto per copiare il codice a barre negli appunti',
      tapToClose: 'Tocca ovunque per chiudere'
    },
    barcodeRenderer: {
      invalidA11y: 'Codice a barre non valido',
      loadingA11y: 'Caricamento codice a barre',
      imageA11yLabel: 'Codice a barre {{format}} per {{value}}'
    },
    edit: {
      invalidId: 'ID carta non valido',
      notFound: 'Carta non trovata',
      loadFailed: 'Impossibile caricare i dettagli della carta',
      missingDescription:
        'La carta che stai cercando di modificare non esiste o è stata eliminata.',
      title: 'Modifica carta',
      save: 'Salva',
      discardTitle: 'Scartare le modifiche?',
      discardBody: 'Hai modifiche non salvate che andranno perse.',
      keepEditing: 'Continua a modificare',
      discard: 'Scarta',
      savedTitle: 'Carta salvata',
      failedMessage: 'Impossibile aggiornare la carta'
    },
    delete: {
      invalidId: 'ID carta non valido',
      successTitle: 'Carta eliminata',
      failedTitle: 'Impossibile eliminare la carta',
      failedMessage: 'Impossibile eliminare la carta'
    }
  }
} as const;
