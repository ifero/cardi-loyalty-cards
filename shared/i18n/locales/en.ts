export const en = {
  common: {
    system: 'System',
    english: 'English',
    italian: 'Italian',
    actions: {
      cancel: 'Cancel',
      continue: 'Continue',
      delete: 'Delete',
      done: 'Done',
      export: 'Export',
      import: 'Import',
      ok: 'OK',
      openSettings: 'Open Settings',
      retry: 'Retry',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      createAccount: 'Create Account',
      sync: 'Sync'
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
      system: 'System'
    },
    status: {
      never: 'Never',
      justNow: 'Just now'
    },
    errors: {
      databaseErrorTitle: 'Database Error',
      initializationFailed: 'Initialization failed'
    },
    launch: {
      accessibilityLabel: 'Cardì, starting up'
    }
  },
  navigation: {
    home: 'Cardì',
    welcome: 'Welcome',
    getStarted: 'Get Started',
    highlights: 'Highlights',
    addCard: 'Add Card',
    settings: 'Settings',
    scanBarcode: 'Scan Barcode',
    barcode: 'Barcode',
    cardDetails: 'Card Details',
    editCard: 'Edit Card',
    createAccount: 'Create Account',
    verifyEmail: 'Verify Email',
    signIn: 'Sign In',
    forgotPassword: 'Forgot Password',
    recoveryOtp: 'Reset Password',
    newPassword: 'New Password',
    whatWeCollect: 'What We Collect'
  },
  onboarding: {
    welcome: {
      screenLabel: 'Welcome to Cardì',
      title: 'Cardì',
      subtitle: 'Your loyalty cards, always with you',
      getStarted: 'Get Started',
      existingAccount: 'I already have an account',
      existingAccountAccessibilityLabel: 'I already have an account. Sign In',
      existingAccountHint: 'Navigates to the sign in screen'
    },
    modeSelection: {
      screenAnnouncement: 'Mode selection screen',
      backAccessibilityLabel: 'Go back',
      title: 'Get Started',
      heading: 'How would you like\nto use the app?',
      subtitle: 'You can always change this later in Settings.',
      localTitle: 'Keep cards on this device',
      localSubtitle: 'Fast and private. Your cards stay right here.',
      localEyebrow: 'You can create an account later',
      cloudTitle: 'Sync across all devices',
      cloudSubtitle: 'Create a free account to back up and access your cards everywhere.',
      cloudEyebrow: 'Free forever',
      footer: 'Your data is always yours. Export or import your cards anytime from Settings.',
      whatsDifferenceAccessibilityLabel: 'What is the difference between storage options?',
      whatsDifference: "What's the difference?"
    },
    modeOption: {
      recommended: 'Recommended',
      recommendedAccessibilitySuffix: '. Recommended option.',
      accessibilityHint: 'Double tap to select this storage option'
    },
    infoTooltip: {
      openedAnnouncement: 'Storage options info opened',
      accessibilityLabel: 'Storage options information',
      closeAccessibilityLabel: 'Close information',
      heading: "What's the difference?",
      body: "Keep cards on this device stores your loyalty cards only on this phone. It's fast, private, and works offline. Sync across all devices creates a free account so your cards are backed up and available on any device you sign in to. You can switch anytime from Settings.",
      button: 'Got it'
    },
    highlights: {
      screenAnnouncement: 'Feature highlights',
      skipAccessibilityLabel: 'Skip feature highlights',
      skip: 'Skip',
      swipeAccessibilityHint: 'Swipe left or right to move through feature highlights',
      next: 'Next',
      letsGo: "Let's go!",
      allCardsTitle: 'All your cards in one place',
      allCardsDescription:
        'Store every loyalty card digitally. No more digging through your wallet at the checkout.',
      scanOrManualTitle: 'Scan or add manually',
      scanOrManualDescription:
        'Point your camera at any barcode, or type the number in. Either way, it takes seconds.',
      yourDataTitle: 'Your data, your rules',
      yourDataDescription:
        'Export and import your cards anytime. No lock-in, no hidden fees. Your cards belong to you.'
    }
  },
  settings: {
    sections: {
      preferences: 'Preferences',
      about: 'About',
      data: 'Data'
    },
    account: {
      fallbackEmail: 'Signed in user',
      signedIn: 'Signed in',
      synced: 'Synced',
      signOutA11y: 'Sign Out',
      deleteAccount: 'Delete Account',
      deleteAccountA11y: 'Delete Account, destructive action',
      guestTitle: 'Not signed in yet',
      guestBody: 'Sign in or create an account to back up your cards and sync across devices.',
      accountDeleted: 'Account deleted',
      signOutError: 'Unable to sign out',
      deleteError: 'Unable to delete account',
      changePassword: 'Change Password',
      changePasswordA11y: 'Change Password',
      changePasswordError: 'Unable to send the verification code. Please try again.',
      passwordChanged: 'Password changed'
    },
    preferences: {
      themeLabel: 'Theme',
      languageLabel: 'Language',
      autoBrightnessLabel: 'Full brightness on card details'
    },
    about: {
      appVersion: 'App Version',
      catalogue: 'Catalogue',
      helpFaq: 'Help & FAQ',
      privacyPolicy: 'Privacy Policy'
    },
    data: {
      exportData: 'Export Data',
      importData: 'Import Data',
      format: 'JSON'
    },
    theme: {
      pickerTitle: 'Theme',
      pickerAccessibilityLabel: 'Theme picker',
      optionAccessibilityLabel: '{{name}} theme',
      systemDescription: "System uses your device's appearance setting",
      selectedAnnouncement: '{{theme}} theme selected'
    },
    language: {
      systemValue: 'System ({{language}})',
      selectedAnnouncement: '{{language}} selected',
      movedToSheet: 'Language selection moved to a bottom sheet.',
      picker: {
        title: 'Language',
        accessibilityLabel: 'Language picker',
        optionAccessibilityLabel: '{{name}} language'
      }
    },
    export: {
      confirmTitle: 'Export Your Cards',
      confirmBody_one:
        'Your {{count}} card will be exported as a JSON file that you can save or share.',
      confirmBody_other:
        'All {{count}} cards will be exported as a JSON file that you can save or share.',
      emptyTitle: 'Nothing to Export',
      emptyBody: "You don't have any cards yet. Add your first card to export your data.",
      shareDialogTitle: 'Export cards',
      successTitle: 'Export complete',
      localBackupMessage:
        'Backup saved locally in Files. Sharing is unavailable in this environment.',
      failedTitle: 'Export failed',
      failedMessage: 'Export failed'
    },
    import: {
      invalidFileTitle: 'Invalid File',
      noCardDataTitle: 'No Card Data',
      failedTitle: 'Import Failed',
      noFileSelected: 'No file was selected.',
      unreadableFile: 'Unable to read the selected file.',
      invalidFileMessage:
        "This file doesn't contain valid card data. Please select a different file.",
      noCardDataMessage: 'This file contains no card data.',
      previewTitle: 'Import Cards',
      totalCardsFound_one: '{{count}} card found',
      totalCardsFound_other: '{{count}} cards found',
      newCardsAdded_one: '{{count}} new card will be added.',
      newCardsAdded_other: '{{count}} new cards will be added.',
      duplicatesSkipped_one: '{{count}} duplicate will be skipped.',
      duplicatesSkipped_other: '{{count}} duplicates will be skipped.',
      invalidEntriesSkipped_one: '{{count}} invalid entry will be skipped.',
      invalidEntriesSkipped_other: '{{count}} invalid entries will be skipped.',
      toastCompleteTitle: 'Import complete',
      toastFinishedTitle: 'Import finished',
      toastNoNewCards: 'No new cards were imported',
      toastImported_one: '{{count}} card imported successfully',
      toastImported_other: '{{count}} cards imported successfully',
      toastDuplicatesSkipped_one: '{{count}} duplicate skipped',
      toastDuplicatesSkipped_other: '{{count}} duplicates skipped',
      toastInvalidEntriesSkipped_one: '{{count}} invalid entry skipped',
      toastInvalidEntriesSkipped_other: '{{count}} invalid entries skipped',
      failedMessage: 'Import failed'
    },
    signOutSheet: {
      title: 'Sign Out?',
      body: 'You will return to guest mode. Your cards will remain on this device.'
    },
    deleteAccountSheet: {
      step1Title: 'Delete Account?',
      step1Body:
        'This will permanently delete your account and all synced data. Cards stored locally on this device will remain.',
      step2Title: 'Confirm Account Deletion',
      step2Body: 'Type DELETE to confirm permanent account deletion.',
      confirmInputLabel: 'Type DELETE to confirm',
      confirmInputHint: 'Type DELETE to enable account deletion',
      confirmKeyword: 'DELETE'
    }
  },
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated',
    version: 'Version {{version}}',
    dataSummary: {
      title: 'What We Collect',
      description:
        'This is a summary of the data Cardì collects when you have an account. Guest users have no cloud data — everything stays on device.',
      table: {
        categoryHeader: 'Category',
        dataCollectedHeader: 'Data Collected'
      },
      rows: {
        account: {
          category: 'Account',
          detail: 'Email address'
        },
        cards: {
          category: 'Cards',
          detail: 'Card names, barcodes, timestamps'
        },
        app: {
          category: 'App',
          detail: 'App version, locale (for catalogue)'
        },
        location: {
          category: 'Location',
          detail: 'Not collected'
        },
        contacts: {
          category: 'Contacts',
          detail: 'Not collected'
        },
        deviceId: {
          category: 'Device ID',
          detail: 'Not collected'
        }
      },
      downloadButtonA11yLabel: 'Download My Data',
      downloadButtonA11yHint: 'This feature is not yet available',
      downloadButton: 'Download My Data (coming soon)',
      downloadFooter: 'Data export will be available in a future update.'
    }
  },
  help: {
    title: 'Help & FAQ',
    subtitle: 'Find quick answers and troubleshooting steps.',
    searchPlaceholder: 'Search help',
    contactSupport: 'Contact Support',
    submitFeedback: 'Submit Feedback',
    contactSupportA11y: 'Contact support',
    submitFeedbackA11y: 'Submit feedback',
    openFailedTitle: 'Unable to open',
    contactSupportUnavailable: 'No email app available. Please try again later.',
    submitFeedbackUnavailable: 'Feedback page unavailable. Please try again later.'
  },
  sharedUi: {
    bottomSheet: {
      fallbackLabel: 'Bottom sheet',
      openedAnnouncement: '{{label}} opened',
      closedAnnouncement: '{{label}} closed'
    },
    formScreen: {
      backAccessibilityLabel: 'Go back',
      saving: 'Saving...'
    }
  },
  syncUi: {
    syncIndicator: {
      syncingA11y: 'Syncing cards',
      successA11y: 'Cards synced',
      syncingMessage: 'Syncing cards…',
      successMessage: 'All changes synced'
    },
    offline: {
      message_one: 'Offline • {{count}} change will sync when online',
      message_other: 'Offline • {{count}} changes will sync when online'
    },
    errorBanner: {
      retryButton: 'Retry',
      retryA11yLabel: 'Retry cloud sync',
      retryA11yHint: 'Attempts to sync your cards to the cloud again',
      dismissA11yLabel: 'Dismiss sync error',
      dismissA11yHint: 'Hides the error message'
    },
    conflict: {
      comparisonCard: {
        a11yLabel: '{{label}}: {{name}}, barcode ending {{barcodeTail}}, updated {{updatedAt}}',
        pointsLabel: 'Points:',
        barcodeLabel: 'Barcode:',
        updatedPrefix: 'Updated:'
      },
      modal: {
        accessibilityLabel: 'Resolve sync conflict',
        title: 'Resolve sync conflict',
        subtitle:
          'This card was modified on both this device and the cloud.\nChoose which version to keep.',
        localLabel: 'This device',
        cloudLabel: 'Cloud',
        keepLocal: 'Keep local',
        keepCloud: 'Keep cloud',
        keepBoth: 'Keep both',
        decideLater: 'Decide later',
        keepLocalA11yLabel: 'Keep local version',
        keepLocalA11yHint: 'Replaces cloud version with local data',
        keepCloudA11yLabel: 'Keep cloud version',
        keepCloudA11yHint: 'Replaces local data with cloud version',
        keepBothA11yLabel: 'Keep both versions',
        keepBothA11yHint: 'Creates a copy so both versions are saved',
        decideLaterA11yLabel: 'Decide later',
        decideLaterA11yHint: 'Closes the dialog without resolving the conflict'
      }
    }
  },
  auth: {
    fields: {
      email: 'Email',
      password: 'Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password'
    },
    placeholders: {
      email: 'you@example.com',
      password: 'Your password',
      newPassword: 'Min 8 chars, 1 letter, 1 number',
      confirmPassword: 'Re-enter your password',
      confirmNewPassword: 'Re-enter your new password',
      verificationCode: '8-digit code'
    },
    accessibility: {
      emailHint: 'Enter your email address',
      passwordHint: 'Enter your password',
      passwordRuleHint: 'Minimum 8 characters with at least one letter and one number',
      confirmPasswordHint: 'Re-enter your password to confirm',
      forgotPasswordEmailHint: 'Enter your email address to receive a reset code',
      confirmNewPasswordHint: 'Re-enter your new password to confirm',
      forgotPassword: 'Forgot password',
      back: 'Back',
      sendResetCode: 'Send password reset code',
      backToSignIn: 'Back to Sign In',
      verificationCodeLabel: '8-digit verification code',
      verificationCodeHint: 'Enter the 8-digit code from your email',
      confirmCode: 'Confirm',
      wrongEmailGoBack: 'Wrong email? Go back'
    },
    validation: {
      emailRequired: 'Email is required.',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required.',
      passwordRule: 'Min 8 characters, at least one letter and one number.',
      confirmPasswordRequired: 'Please confirm your password.',
      passwordsMismatch: 'Passwords do not match.',
      consentRequired: 'You must agree to the Privacy Policy.'
    },
    signIn: {
      heading: 'Welcome Back',
      subtitle: 'Sign in to sync your loyalty cards across devices',
      forgotPassword: 'Forgot password?',
      button: 'Sign In',
      noAccountPrefix: "Don't have an account?",
      noAccountAction: 'Create one',
      incorrectCredentials: 'Incorrect email or password. Please try again.',
      emailNotConfirmed: 'Please verify your email address first.',
      networkError: 'Unable to connect. Check your internet and try again.',
      genericError: 'Something went wrong. Please try again.'
    },
    createAccount: {
      heading: 'Create Account',
      subtitle: 'Join Cardì',
      button: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      signInAction: 'Sign in',
      passwordRequirements:
        'Password must be at least 8 characters with at least one letter and one number.',
      accountExists: 'An account with this email already exists. Sign in instead.',
      networkError: 'Unable to connect. Check your internet and try again.',
      genericError: 'An unexpected error occurred. Please try again.'
    },
    forgotPassword: {
      heading: 'Forgot Password?',
      subtitle: "No worries. Enter your email and we'll send you a reset code.",
      sendResetCode: 'Send Reset Code',
      backToSignIn: 'Back to Sign In',
      networkError: 'Unable to connect. Check your internet and try again.',
      genericError: 'An unexpected error occurred. Please try again.'
    },
    verifyEmail: {
      heading: 'Verify your email',
      subtitle: 'We sent an 8-digit code to {{email}}',
      confirm: 'Confirm',
      resendCode: 'Resend code',
      resendIn: 'Resend in {{time}}',
      wrongEmail: 'Wrong email?',
      goBack: 'Go back',
      incorrectCode: 'Incorrect code. Please try again.',
      expiredCode: 'This code has expired. Please request a new one.',
      verifyUnavailable: "Couldn't verify right now. Check your connection and try again.",
      resendFailure: "Couldn't resend code. Try again.",
      resendSuccess: 'Code resent. Enter the newest code from your email.'
    },
    recoveryOtp: {
      heading: 'Reset your password',
      subtitle: 'We sent an 8-digit code to {{email}}',
      confirm: 'Confirm',
      resendCode: 'Resend code',
      resendIn: 'Resend in {{time}}',
      wrongEmail: 'Wrong email?',
      goBack: 'Go back',
      incorrectCode: 'Incorrect code. Please try again.',
      expiredCode: 'This code has expired. Please request a new one.',
      verifyUnavailable: "Couldn't verify right now. Check your connection and try again.",
      resendFailure: "Couldn't resend code. Try again.",
      resendSuccess: 'Code resent. Enter the newest code from your email.'
    },
    newPassword: {
      heading: 'Set New Password',
      subtitle: 'Choose a strong new password for your account.',
      button: 'Update Password',
      networkError: 'Unable to connect. Check your internet and try again.',
      genericError: 'An unexpected error occurred. Please try again.'
    },
    passwordStrength: {
      weak: 'Weak',
      fair: 'Fair',
      strong: 'Strong'
    },
    passwordInput: {
      show: 'Show password',
      hide: 'Hide password'
    },
    consent: {
      checkboxLabel: 'I agree to the Privacy Policy',
      checkboxHint: 'Toggles privacy consent',
      labelPrefix: 'I agree to the',
      policy: 'Privacy Policy',
      policyHint: 'Opens the Privacy Policy'
    },
    guestBanner: {
      title: 'Protect your cards',
      body: 'Create a free account to back up your cards and access them on all your devices',
      dismissA11y: 'Dismiss banner'
    },
    migrationBanner: {
      retryA11yLabel: 'Retry card backup',
      dismissA11yLabel: 'Dismiss'
    }
  },
  addCard: {
    selection: {
      screenAnnouncement: 'Card type selection screen',
      heading: 'Add Card',
      backAccessibilityLabel: 'Go back'
    },
    search: {
      placeholder: 'Search by name',
      accessibilityLabel: 'Search brands by name',
      clearAccessibilityLabel: 'Clear search'
    },
    list: {
      results: 'Results',
      popularCards: 'Popular cards',
      allCards: 'All cards',
      noCardsFound: 'No cards found',
      showingResults: 'Showing results matching "{{query}}"'
    },
    otherCard: {
      label: 'Other card',
      subtitle: 'Add a custom loyalty card',
      accessibilityLabel: 'Other card. Add a custom loyalty card'
    },
    scanner: {
      screenAnnouncement: 'Barcode scanner screen',
      cameraAccessTitle: 'Camera Access Needed',
      cameraAccessBody:
        'Camera access is needed to scan barcodes.\nYou can enable it in Settings, or enter the barcode manually.',
      cameraErrorTitle: 'Camera Error',
      cameraStartError: 'Unable to start the camera preview.',
      cameraErrorFallback: 'Camera error. Please try again.',
      cameraPermissionDeniedError: 'Camera permission denied',
      checkingPermission: 'Checking camera permission...',
      instruction: 'Point camera at barcode',
      processingImage: 'Scanning image…',
      scanFromImage: 'Scan from image',
      scanFromImageAccessibilityLabel: 'Scan a barcode from a photo or screenshot',
      manualEntry: 'Enter card number manually',
      manualEntryAccessibilityLabel: 'Enter card number manually',
      floatingBackAccessibilityLabel: 'Go back'
    },
    multiCode: {
      title: 'Multiple barcodes found',
      subtitle: 'Tap the one that matches your loyalty card',
      cancelAccessibilityLabel: 'Cancel, dismiss barcode picker',
      codeAccessibilityLabel: '{{format}}, code {{value}}',
      formats: {
        CODE128: 'Code 128',
        EAN13: 'EAN-13',
        EAN8: 'EAN-8',
        QR: 'QR Code',
        CODE39: 'Code 39',
        UPCA: 'UPC-A'
      }
    },
    noCodeFound: {
      // Two messages, not one (Story 16.23). The single "No barcode found in
      // this image" was shown for a decoder miss, for a genuinely code-free
      // image, AND for a file the decoder never managed to open. It was also
      // demonstrably false in the case that motivated the split: a Penny Market
      // card whose barcode Android reads without trouble.
      notFoundMessage: "We couldn't read a barcode in this image — try scanning the card itself",
      scanFailedMessage: 'Something went wrong reading that image',
      // Deliberately does not say "that image": the picker never handed us one,
      // so there is nothing for the user to reconsider about their choice.
      pickerFailedMessage: "We couldn't open your photos",
      // "Try another image" would presume a first image; none was ever picked.
      pickerFailedRetry: 'Try again',
      dismissAccessibilityLabel: 'Dismiss error message',
      retryAccessibilityLabel: 'Try scanning a different image',
      retry: 'Try another image',
      manualEntryAccessibilityLabel: 'Enter the card number manually',
      manualEntry: 'Enter it manually'
    },
    setup: {
      catalogueAnnouncement: 'Card setup screen',
      customAnnouncement: 'New card screen',
      catalogueHeading: 'Card Setup',
      customHeading: 'New Card',
      storeNameLabel: 'Store name',
      storeNamePlaceholder: 'Enter store name',
      storeNameRequired: 'Store name is required',
      cardNumberLabel: 'Card number',
      cardNumberPlaceholder: 'Enter or scan card number',
      colorLabel: 'Card Color',
      inlineScanAccessibilityLabel: 'Scan barcode with camera'
    }
  },
  cards: {
    home: {
      searchPlaceholder: 'Search loyalty cards',
      searchAccessibilityLabel: 'Search loyalty cards',
      clearSearchAccessibilityLabel: 'Clear search',
      noResults: 'No cards matching “{{query}}”',
      singleCardTip: 'Tap + to add more cards to your wallet',
      emptyStateTitle: 'No cards yet',
      emptyStateSubtitle: 'Add your first loyalty card and\nnever miss rewards at checkout',
      emptyStateCta: 'Add your first card',
      cardTileAccessibilityHint: 'Opens card details',
      cardTileFavouriteAccessibilityLabel: '{{name}}, favorite'
    },
    sort: {
      count_one: '{{count}} card',
      count_other: '{{count}} cards',
      buttonAccessibilityLabel: 'Sort by {{label}}',
      buttonHint: 'Opens sort options',
      sheetTitle: 'Sort by',
      frequent: 'Frequently used',
      recent: 'Recently added',
      az: 'A-Z'
    },
    colors: {
      // Story 21.2a froze the five CARD_COLOR_KEYS as wire identifiers and
      // repainted only their values, so two keys no longer name their colour:
      // `orange` renders the beam yellow #FCCC0C (orange is banned from the
      // design system) and `grey` renders the azure #0C84CC (there is no
      // neutral among the five accents). These labels describe what the swatch
      // actually IS — they are all a screen-reader user gets, and announcing a
      // yellow swatch as "Orange" would be simply wrong. `blue` is qualified
      // because the picker now shows two blues side by side and "Blue" alone
      // would not tell them apart.
      blue: 'Deep blue',
      red: 'Red',
      green: 'Green',
      orange: 'Yellow',
      grey: 'Azure',
      accessibilityLabel: '{{color}} color{{selected}}',
      selectedSuffix: ', selected'
    },
    formatPicker: {
      label: 'Barcode Format',
      accessibilityLabel: 'Barcode format selector'
    },
    form: {
      nameLabel: 'Card Name',
      namePlaceholder: 'Enter card name',
      nameAccessibilityLabel: 'Card name',
      nameRequired: 'Card name is required',
      nameMax: 'Card name must be 50 characters or less',
      barcodeLabel: 'Barcode Number',
      barcodePlaceholder: 'Enter barcode number',
      barcodeAccessibilityLabel: 'Barcode number',
      barcodeRequired: 'Barcode number is required',
      barcodeFormatLabel: 'Barcode Format (Auto-detected)',
      barcodeFormat: {
        CODE128: 'Code 128 (Universal)',
        EAN13: 'EAN-13 (Retail)',
        EAN8: 'EAN-8 (Compact)',
        QR: 'QR Code',
        CODE39: 'Code 39 (Industrial)',
        UPCA: 'UPC-A (North America)'
      },
      saving: 'Saving...'
    },
    add: {
      successTitle: 'Card added',
      failedMessage: 'Failed to add card'
    },
    details: {
      copiedToClipboard: 'Copied to clipboard ✓',
      invalidId: 'Invalid card ID',
      notFound: 'Card not found',
      loadFailed: 'Failed to load card details',
      missingDescription: "The card you're looking for doesn't exist or has been deleted.",
      backAccessibilityLabel: 'Go back',
      favoriteToggleLabel: 'Favorite',
      viewFullscreenAccessibilityLabel: 'View full screen barcode',
      viewFullscreenHint: 'Opens the barcode in full screen for scanning',
      tapToEnlarge: 'Tap to enlarge',
      brightnessToggleLabel: 'Full brightness',
      brightnessToggleHint: 'Sets the screen to full brightness so a scanner can read the barcode',
      numberLabel: 'Number',
      copyAccessibilityHint: 'Double tap to copy barcode number',
      colorLabel: 'Color',
      addedLabel: 'Added',
      manageSection: 'Manage',
      editAction: 'Edit card',
      deleteAccessibilityLabel: 'Delete card',
      deletingAccessibilityLabel: 'Deleting card',
      deleteAction: 'Delete card',
      deleting: 'Deleting...',
      deleteConfirmTitle: 'Delete Card?',
      deleteConfirmBody:
        'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
      copyFailedTitle: 'Error',
      copyFailedMessage: 'Failed to copy barcode to clipboard'
    },
    flash: {
      dismissOverlayA11yLabel: 'Dismiss barcode overlay',
      dismissOverlayA11yHint: 'Tap anywhere to close',
      barcodeValueA11yLabel: 'Barcode number for {{title}}: {{value}}',
      copyHint: 'Long press to copy barcode to clipboard',
      tapToClose: 'Tap anywhere to close'
    },
    barcodeRenderer: {
      invalidA11y: 'Invalid barcode',
      loadingA11y: 'Loading barcode',
      imageA11yLabel: '{{format}} barcode for {{value}}'
    },
    edit: {
      invalidId: 'Invalid card ID',
      notFound: 'Card not found',
      loadFailed: 'Failed to load card details',
      missingDescription: "The card you're trying to edit doesn't exist or has been deleted.",
      title: 'Edit Card',
      cancel: 'Cancel',
      save: 'Save',
      discardTitle: 'Discard changes?',
      discardBody: 'You have unsaved changes that will be lost.',
      keepEditing: 'Keep Editing',
      discard: 'Discard',
      savedTitle: 'Card saved',
      failedMessage: 'Failed to update card',
      errorTitle: 'Error'
    },
    delete: {
      invalidId: 'Invalid card ID',
      successTitle: 'Card deleted',
      failedTitle: 'Failed to delete card',
      failedMessage: 'Failed to delete card'
    }
  }
} as const;
