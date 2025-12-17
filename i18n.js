// Q-SCI Browser Extension - Internationalization (i18n) Module
// Provides German and English language support with user preference storage

(function() {
  'use strict';

  // Language translations
  const translations = {
    de: {
      // Header
      'header.title': 'Qualitätsprüfung',
      'header.subtitle': 'für wissenschaftliche Publikationen',
      
      // Authentication
      'auth.loginRequired': 'Anmeldung erforderlich',
      'auth.loginDescription': 'Bitte melden Sie sich mit Clerk an, um die Q-SCI Analysefunktionen zu nutzen.',
      'auth.loginButton': '🔐 Mit Clerk anmelden',
      'auth.whatYouGet': 'Was Sie erhalten:',
      'auth.free': 'Kostenlos',
      'auth.freeAnalyses': '10 Analysen pro Tag',
      'auth.subscribed': 'Abonniert',
      'auth.subscribedAnalyses': '100 Analysen pro Tag',
      'auth.loggedInAs': 'Angemeldet als:',
      'auth.todaysAnalyses': 'Heutige Analysen:',
      'auth.upgradeToPremium': '⚡ Auf Premium upgraden',
      'auth.upgradeToPremiumDesc': 'Erhalten Sie 100 Analysen pro Tag statt 10!',
      'auth.subscribeNow': 'Jetzt abonnieren',
      'auth.refreshStatus': '🔄 Status aktualisieren',
      'auth.logout': 'Abmelden',
      
      // Subscription status
      'subscription.free': 'Kostenlos',
      'subscription.subscribed': 'Premium',
      'subscription.pastDue': 'Zahlung fällig',
      
      // Current page section
      'page.title': 'Aktuelle Seite',
      'page.checking': 'Überprüfe...',
      'page.analyzeButton': 'Paper analysieren',
      'page.refreshButton': 'Aktualisieren',
      'page.analyzePdf': 'PDF analysieren (falls verfügbar)',
      
      // Analysis results
      'results.title': 'Analyseergebnisse',
      'results.quality': 'Qualität',
      'results.reasoning': 'Begründung',
      'results.journalTier': 'Journal-Tier',
      'results.quartile': 'Quartil',
      'results.viewDetails': 'Details anzeigen',
      
      // Manual analysis
      'manual.title': 'Manuelle Analyse',
      'manual.placeholder': 'Paper-Text zum Analysieren einfügen...',
      'manual.analyzeButton': 'Text analysieren',
      
      // Detailed analysis
      'detailed.title': 'Detaillierte Analyse',
      'detailed.close': 'Schließen',
      'detailed.journal': 'Journal',
      'detailed.journalTier': 'Journal-Tier',
      'detailed.quartile': 'Quartil',
      'detailed.quality': 'Qualität',
      'detailed.trafficLight': 'Ampel',
      'detailed.positiveAspects': '✅ Positive Aspekte',
      'detailed.negativeAspects': '⚠️ Verbesserungsbereiche',
      'detailed.source': 'Quelle',
      'detailed.noExactCitation': 'Eine präzise Quellenangabe kann hier nicht angegeben werden, da dieser Aspekt auf einer integrativen Analyse mehrerer Textpassagen basiert. Die wissenschaftliche Validität ergibt sich aus der Gesamtargumentation der Publikation.',
      'detailed.explanation': 'Erklärung',
      'detailed.impactFactor': 'Impact Factor',
      'detailed.askQuestions': 'Fragen zur Publikation',
      'detailed.chatWelcome': 'Stellen Sie Fragen zur Publikation, und die KI wird diese basierend auf dem analysierten Inhalt beantworten.',
      'detailed.chatPlaceholder': 'Frage eingeben...',
      'detailed.send': 'Senden',
      'detailed.exportAnalysis': 'Analyse exportieren',
      'detailed.downloadPdf': 'PDF herunterladen',
      
      // Chat messages
      'chat.you': 'Sie',
      'chat.loginRequired': 'Bitte melden Sie sich an, um die Chat-Funktion zu nutzen.',
      'chat.analyzeFirst': 'Bitte analysieren Sie zuerst ein Paper, bevor Sie Fragen stellen.',
      
      // Messages
      'message.analyzing': 'Analysiere...',
      'message.error': 'Ein Fehler ist aufgetreten.',
      'message.success': 'Erfolg!',
      
      // Progress messages
      'progress.preparingAnalysis': 'Analyse wird vorbereitet...',
      'progress.detectingPage': 'Seite wird erkannt...',
      'progress.extractingContent': 'Inhalt wird von der Seite extrahiert...',
      'progress.contentExtracted': 'Inhalt erfolgreich extrahiert',
      'progress.usingFallback': 'Verwende Fallback-Extraktion...',
      'progress.downloadingPdf': 'PDF wird heruntergeladen...',
      'progress.pdfExtracted': 'PDF erfolgreich extrahiert',
      'progress.preparingText': 'Text wird für Analyse vorbereitet...',
      'progress.textPrepared': 'Text erfolgreich vorbereitet',
      'progress.sendingToAi': 'Wird zur KI-Analyse gesendet...',
      'progress.startingBackground': 'Hintergrundanalyse wird gestartet...',
      'progress.runningInBackground': 'Analyse läuft im Hintergrund...',
      'progress.processingResults': 'Ergebnisse werden verarbeitet...',
      'progress.displayingResults': 'Ergebnisse werden angezeigt...',
      'progress.complete': 'Abgeschlossen!',
      
      // Settings
      'settings.button': 'Einstellungen',
      'settings.title': 'Q-SCI Einstellungen',
      'settings.authStatus': 'Authentifizierungsstatus',
      'settings.subscriptionManagement': 'Abonnementverwaltung',
      'settings.refreshSubscription': '🔄 Abonnementstatus aktualisieren',
      'settings.upgradeToPremium': '⚡ Auf Premium upgraden',
      'settings.openaiConfig': 'OpenAI API Konfiguration',
      'settings.openaiManagedCentrally': 'Der OpenAI API-Schlüssel wird zentral vom Q-SCI-Backend verwaltet. Sie müssen keinen eigenen Schlüssel eingeben. Alle Analysen werden über den zentralen Service ausgeführt.',
      'settings.apiKeyLabel': 'OpenAI API-Schlüssel',
      'settings.saveButton': 'API-Schlüssel speichern',
      'settings.usageStats': 'Nutzungsstatistiken',
      'settings.languagePreference': 'Spracheinstellung',
      'settings.german': 'Deutsch',
      'settings.english': 'Englisch',
      'settings.legal': 'Rechtliches',
      'settings.privacyPolicy': '📄 Datenschutzerklärung',
      
      // Clerk auth page
      'clerkAuth.title': 'Q-SCI Anmeldung',
      'clerkAuth.subtitle': 'Scientific Paper Quality Evaluator',
      'clerkAuth.loading': 'Lade Authentifizierung...',
      'clerkAuth.whatYouGet': 'Was Sie erhalten:',
      'clerkAuth.free': 'Kostenlos',
      'clerkAuth.freeAnalyses': '10 Analysen pro Tag',
      'clerkAuth.subscribed': 'Abonniert',
      'clerkAuth.subscribedAnalyses': '100 Analysen pro Tag',
      'clerkAuth.authSuccess': 'Authentifizierung erfolgreich! Verarbeite...',
      'clerkAuth.successClose': 'Erfolg! Sie können dieses Fenster schließen.',
      'clerkAuth.errorInit': 'Fehler beim Initialisieren der Authentifizierung. Bitte versuchen Sie es erneut.',
      'clerkAuth.errorMissingKey': 'Fehler beim Initialisieren der Authentifizierung: Clerk API-Schlüssel fehlt. Bitte kontaktieren Sie den Administrator.',
      'clerkAuth.errorProcess': 'Fehler beim Verarbeiten der Authentifizierung. Bitte versuchen Sie es erneut.',
      'clerkAuth.errorExtension': 'Bitte öffnen Sie diese Seite über die Erweiterung.'
    },
    en: {
      // Header
      'header.title': 'Quality Check',
      'header.subtitle': 'Scientific Publications',
      
      // Authentication
      'auth.loginRequired': 'Login Required',
      'auth.loginDescription': 'Please login with Clerk to use Q-SCI analysis features.',
      'auth.loginButton': '🔐 Login with Clerk',
      'auth.whatYouGet': 'What you get:',
      'auth.free': 'Free',
      'auth.freeAnalyses': '10 analyses per day',
      'auth.subscribed': 'Subscribed',
      'auth.subscribedAnalyses': '100 analyses per day',
      'auth.loggedInAs': 'Logged in as:',
      'auth.todaysAnalyses': "Today's analyses:",
      'auth.upgradeToPremium': '⚡ Upgrade to Premium',
      'auth.upgradeToPremiumDesc': 'Get 100 analyses per day instead of 10!',
      'auth.subscribeNow': 'Subscribe Now',
      'auth.refreshStatus': '🔄 Refresh Status',
      'auth.logout': 'Logout',
      
      // Subscription status
      'subscription.free': 'Free',
      'subscription.subscribed': 'Premium',
      'subscription.pastDue': 'Past Due',
      
      // Current page section
      'page.title': 'Current Page',
      'page.checking': 'Checking...',
      'page.analyzeButton': 'Analyze Paper',
      'page.refreshButton': 'Refresh',
      'page.analyzePdf': 'Analyze PDF (if available)',
      
      // Analysis results
      'results.title': 'Analysis Results',
      'results.quality': 'Quality',
      'results.reasoning': 'Reasoning',
      'results.journalTier': 'Journal Tier',
      'results.quartile': 'Quartile',
      'results.viewDetails': 'View Details',
      
      // Manual analysis
      'manual.title': 'Manual Analysis',
      'manual.placeholder': 'Paste paper text to analyze...',
      'manual.analyzeButton': 'Analyze Text',
      
      // Detailed analysis
      'detailed.title': 'Detailed Analysis',
      'detailed.close': 'Close',
      'detailed.journal': 'Journal',
      'detailed.journalTier': 'Journal Tier',
      'detailed.quartile': 'Quartile',
      'detailed.quality': 'Quality',
      'detailed.trafficLight': 'Traffic Light',
      'detailed.positiveAspects': '✅ Positive Aspects',
      'detailed.negativeAspects': '⚠️ Areas for Improvement',
      'detailed.source': 'Source',
      'detailed.noExactCitation': 'A precise source citation cannot be provided here, as this aspect is based on an integrative analysis of multiple text passages. The scientific validity derives from the overall argumentation of the publication.',
      'detailed.explanation': 'Explanation',
      'detailed.impactFactor': 'Impact Factor',
      'detailed.askQuestions': 'Questions about the Publication',
      'detailed.chatWelcome': 'Ask questions about the publication, and the AI will answer them based on the analyzed content.',
      'detailed.chatPlaceholder': 'Enter your question...',
      'detailed.send': 'Send',
      'detailed.exportAnalysis': 'Export Analysis',
      'detailed.downloadPdf': 'Download PDF',
      
      // Chat messages
      'chat.you': 'You',
      'chat.loginRequired': 'Please login to use the chat feature.',
      'chat.analyzeFirst': 'Please analyze a paper first before asking questions.',
      
      // Messages
      'message.analyzing': 'Analyzing...',
      'message.error': 'An error occurred.',
      'message.success': 'Success!',
      
      // Progress messages
      'progress.preparingAnalysis': 'Preparing analysis...',
      'progress.detectingPage': 'Detecting page...',
      'progress.extractingContent': 'Extracting content from page...',
      'progress.contentExtracted': 'Content extracted successfully',
      'progress.usingFallback': 'Using fallback extraction...',
      'progress.downloadingPdf': 'Downloading PDF...',
      'progress.pdfExtracted': 'PDF extracted successfully',
      'progress.preparingText': 'Preparing text for analysis...',
      'progress.textPrepared': 'Text prepared successfully',
      'progress.sendingToAi': 'Sending to AI for analysis...',
      'progress.startingBackground': 'Starting background analysis...',
      'progress.runningInBackground': 'Analysis running in background...',
      'progress.processingResults': 'Processing results...',
      'progress.displayingResults': 'Displaying results...',
      'progress.complete': 'Complete!',
      
      // Settings
      'settings.button': 'Settings',
      'settings.title': 'Q-SCI Settings',
      'settings.authStatus': 'Authentication Status',
      'settings.subscriptionManagement': 'Subscription Management',
      'settings.refreshSubscription': '🔄 Refresh Subscription Status',
      'settings.upgradeToPremium': '⚡ Upgrade to Premium',
      'settings.openaiConfig': 'OpenAI API Configuration',
      'settings.openaiManagedCentrally': 'The OpenAI API key is centrally managed by the Q-SCI backend. You don\'t need to enter your own key. All analyses are performed through the central service.',
      'settings.apiKeyLabel': 'OpenAI API Key',
      'settings.saveButton': 'Save API Key',
      'settings.usageStats': 'Usage Statistics',
      'settings.languagePreference': 'Language Preference',
      'settings.german': 'German',
      'settings.english': 'English',
      'settings.legal': 'Legal',
      'settings.privacyPolicy': '📄 Privacy Policy',
      
      // Clerk auth page
      'clerkAuth.title': 'Q-SCI Login',
      'clerkAuth.subtitle': 'Scientific Paper Quality Evaluator',
      'clerkAuth.loading': 'Loading authentication...',
      'clerkAuth.whatYouGet': 'What you get:',
      'clerkAuth.free': 'Free',
      'clerkAuth.freeAnalyses': '10 analyses per day',
      'clerkAuth.subscribed': 'Subscribed',
      'clerkAuth.subscribedAnalyses': '100 analyses per day',
      'clerkAuth.authSuccess': 'Authentication successful! Processing...',
      'clerkAuth.successClose': 'Success! You can close this window.',
      'clerkAuth.errorInit': 'Failed to initialize authentication. Please try again.',
      'clerkAuth.errorMissingKey': 'Failed to initialize authentication: Clerk API key is missing. Please contact the administrator.',
      'clerkAuth.errorProcess': 'Failed to process authentication. Please try again.',
      'clerkAuth.errorExtension': 'Please open this page from the extension.'
    }
  };

  // Default language
  const DEFAULT_LANGUAGE = 'de';
  const STORAGE_KEY = 'qsci_language';

  /**
   * i18n Service
   */
  const I18nService = {
    currentLanguage: DEFAULT_LANGUAGE,
    
    /**
     * Initialize i18n service by loading saved language preference
     */
    async init() {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        this.currentLanguage = result[STORAGE_KEY] || DEFAULT_LANGUAGE;
        console.log('Q-SCI i18n: Initialized with language:', this.currentLanguage);
      } catch (error) {
        console.error('Q-SCI i18n: Error loading language preference:', error);
        this.currentLanguage = DEFAULT_LANGUAGE;
      }
    },

    /**
     * Get translated string for the given key
     * @param {string} key - Translation key (e.g., 'auth.loginButton')
     * @param {string} language - Optional language override
     * @returns {string} Translated string or key if not found
     */
    t(key, language = null) {
      const lang = language || this.currentLanguage;
      const translation = translations[lang] && translations[lang][key];
      
      if (!translation) {
        console.warn(`Q-SCI i18n: Missing translation for key "${key}" in language "${lang}"`);
        return key;
      }
      
      return translation;
    },

    /**
     * Set the current language and save preference
     * @param {string} language - Language code ('de' or 'en')
     */
    async setLanguage(language) {
      if (!translations[language]) {
        console.error('Q-SCI i18n: Invalid language:', language);
        return;
      }
      
      this.currentLanguage = language;
      
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: language });
        console.log('Q-SCI i18n: Language changed to:', language);
      } catch (error) {
        console.error('Q-SCI i18n: Error saving language preference:', error);
      }
    },

    /**
     * Get current language
     * @returns {string} Current language code
     */
    getLanguage() {
      return this.currentLanguage;
    },

    /**
     * Get all available languages
     * @returns {Array} Array of language codes
     */
    getAvailableLanguages() {
      return Object.keys(translations);
    },

    /**
     * Translate all elements with data-i18n attribute
     */
    translatePage() {
      const elements = document.querySelectorAll('[data-i18n]');
      elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = this.t(key);
        
        // Handle different element types
        if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'password')) {
          element.placeholder = translation;
        } else if (element.tagName === 'INPUT' && element.type === 'button') {
          element.value = translation;
        } else if (element.tagName === 'BUTTON') {
          // Preserve any icons/emojis at the start
          const match = element.textContent.match(/^([\u{1F300}-\u{1F9FF}]|🔐|🔄|⚡|✅|⚠️)\s*/u);
          if (match) {
            element.textContent = match[0] + translation.replace(/^([\u{1F300}-\u{1F9FF}]|🔐|🔄|⚡|✅|⚠️)\s*/u, '');
          } else {
            element.textContent = translation;
          }
        } else {
          element.textContent = translation;
        }
      });
      
      console.log('Q-SCI i18n: Page translated to', this.currentLanguage);
    },

    /**
     * Update specific element with translation
     * @param {HTMLElement} element - Element to update
     * @param {string} key - Translation key
     */
    updateElement(element, key) {
      if (!element) return;
      
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'password')) {
        element.placeholder = translation;
      } else if (element.tagName === 'INPUT' && element.type === 'button') {
        element.value = translation;
      } else {
        element.textContent = translation;
      }
    }
  };

  // Expose service globally
  window.QSCIi18n = I18nService;

  console.log('Q-SCI i18n: Module loaded');

})();
