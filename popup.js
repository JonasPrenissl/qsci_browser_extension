// Q-SCI Browser Extension - Simplified Debug Version
console.log('Q-SCI Debug Popup: Script loaded');

// Global variables
let elements = {};
let currentTab = null;
let currentAnalysis = null;
let currentUser = null;

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('Q-SCI Debug Popup: Unhandled promise rejection:', event.reason);
  console.error('Q-SCI Debug Popup: Promise:', event.promise);
  
  // Show error to user if it's not already handled
  if (event.reason && event.reason.message) {
    showError('Unexpected error: ' + event.reason.message);
  } else {
    showError('An unexpected error occurred. Please check the console for details.');
  }
  
  // Prevent the default browser behavior (showing error in console only)
  event.preventDefault();
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Q-SCI Debug Popup: DOM loaded, initializing...');
  
  // Initialize i18n first
  if (window.QSCIi18n) {
    await window.QSCIi18n.init();
    window.QSCIi18n.translatePage();
  }
  
  initializeElements();
  setupEventListeners();
  initializeAuth();
});

// Initialize all DOM elements
function initializeElements() {
  console.log('Q-SCI Debug Popup: Initializing elements...');
  
  elements = {
    pageStatus: document.getElementById('page-status'),
    analyzeBtn: document.getElementById('analyze-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    statsSection: document.getElementById('stats-section'),
    qualityScore: document.getElementById('quality-score'),
    qualityStatItem: document.getElementById('quality-stat-item'),
    loadingMessage: document.getElementById('loading-overlay'),
    errorMessage: document.getElementById('error-message'),
    successMessage: document.getElementById('success-message'),
    // Score reasoning elements
    scoreReasoningSection: document.getElementById('score-reasoning-section'),
    scoreReasoningText: document.getElementById('score-reasoning-text'),
    // Detailed view elements
    detailedSection: document.getElementById('detailed-section'),
    journalInfo: document.getElementById('journal-info'),
    journalName: document.getElementById('journal-name'),
    journalCategory: document.getElementById('journal-category'),
    detailedQualityCircle: document.getElementById('detailed-quality-circle'),
    detailedQualityPercentage: document.getElementById('detailed-quality-percentage'),
    detailedTrafficLight: document.getElementById('detailed-traffic-light'),
    positiveAspectsList: document.getElementById('positive-aspects-list'),
    negativeAspectsList: document.getElementById('negative-aspects-list'),
    sourceCitationsSection: document.getElementById('source-citations-section'),
    sourceTextDisplay: document.getElementById('source-text-display'),
    sourceContent: document.getElementById('source-content'),
    exportAnalysisBtn: document.getElementById('export-analysis-btn'),
    // Settings elements
    settingsBtn: document.getElementById('settings-btn'),
    // Auth elements
    authSection: document.getElementById('auth-section'),
    loginForm: document.getElementById('login-form'),
    loginBtn: document.getElementById('login-btn'),
    userStatus: document.getElementById('user-status'),
    userEmailDisplay: document.getElementById('user-email-display'),
    subscriptionBadge: document.getElementById('subscription-badge'),
    usageDisplay: document.getElementById('usage-display'),
    logoutBtn: document.getElementById('logout-btn'),
    upgradePrompt: document.getElementById('upgrade-prompt'),
    refreshSubscriptionBtn: document.getElementById('refresh-subscription-btn'),
    // Language selector
    languageSelector: document.getElementById('language-selector')
  };
  
  // Log which elements were found
  Object.entries(elements).forEach(([key, element]) => {
    if (element) {
      console.log(`Q-SCI Debug Popup: Found element '${key}'`);
    } else {
      console.warn(`Q-SCI Debug Popup: Missing element '${key}'`);
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  console.log('Q-SCI Debug Popup: Setting up event listeners...');
  
  if (elements.analyzeBtn) {
    elements.analyzeBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Analyze button clicked');
      analyzePage();
    });
  }
  
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Refresh button clicked');
      updatePageStatus();
    });
  }
  
  if (elements.exportAnalysisBtn) {
    elements.exportAnalysisBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Export analysis button clicked');
      exportAnalysis();
    });
  }

  // Settings button opens the extension options page
  if (elements.settingsBtn) {
    elements.settingsBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Settings button clicked');
      if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }
    });
  }

  // Language selector
  if (elements.languageSelector && window.QSCIi18n) {
    // Set initial value
    elements.languageSelector.value = window.QSCIi18n.getLanguage();
    
    // Handle language change
    elements.languageSelector.addEventListener('change', async function(e) {
      console.log('Q-SCI Debug Popup: Language changed to', e.target.value);
      await window.QSCIi18n.setLanguage(e.target.value);
      
      // Update HTML lang attribute
      document.documentElement.lang = e.target.value;
      
      // Re-translate the entire page
      window.QSCIi18n.translatePage();
      
      // Re-render dynamic content if needed
      if (currentUser) {
        updateSubscriptionBadge(currentUser.subscriptionStatus);
      }
    });
  }

  // Auth event listeners
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Login button clicked');
      handleLogin();
    });
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Logout button clicked');
      handleLogout();
    });
  }

  if (elements.refreshSubscriptionBtn) {
    elements.refreshSubscriptionBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Refresh subscription button clicked');
      handleRefreshSubscription();
    });
  }
}

// Initialize authentication
async function initializeAuth() {
  console.log('Q-SCI Debug Popup: Initializing authentication...');
  
  // Debug: Check all storage keys
  try {
    const allStorage = await chrome.storage.local.get(null);
    console.log('Q-SCI Debug Popup: All chrome.storage.local keys:', Object.keys(allStorage));
    console.log('Q-SCI Debug Popup: Auth-related storage:', {
      hasAuthToken: !!allStorage.qsci_auth_token,
      hasEmail: !!allStorage.qsci_user_email,
      hasUserId: !!allStorage.qsci_user_id,
      subscriptionStatus: allStorage.qsci_subscription_status
    });
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error checking storage:', error);
  }
  
  try {
    // Check if user is logged in
    const isLoggedIn = await window.QSCIAuth.isLoggedIn();
    console.log('Q-SCI Debug Popup: isLoggedIn returned:', isLoggedIn);
    
    if (isLoggedIn) {
      // Get current user and verify auth
      try {
        currentUser = await window.QSCIAuth.verifyAndRefreshAuth();
        showUserStatus(currentUser);
        await updateUsageDisplay();
        updatePageStatus();
      } catch (error) {
        console.error('Q-SCI Debug Popup: Auth verification failed:', error);
        
        // If it's a network error, show cached user data
        if (error.message && error.message.includes('internet connection')) {
          const cachedUser = await window.QSCIAuth.getCurrentUser();
          if (cachedUser) {
            currentUser = cachedUser;
            showUserStatus(currentUser);
            await updateUsageDisplay();
            updatePageStatus();
            // Show a warning that we're using cached data
            console.warn('Q-SCI Debug Popup: Using cached auth data due to network error');
          } else {
            showLoginForm();
          }
        } else {
          // Token is invalid, show login form
          showLoginForm();
        }
      }
    } else {
      console.log('Q-SCI Debug Popup: User not logged in, showing login form');
      showLoginForm();
    }
  } catch (error) {
    console.error('Q-SCI Debug Popup: Auth initialization error:', error);
    showLoginForm();
  }
}

// Handle login - opens Clerk authentication pop-up
async function handleLogin() {
  console.log('Q-SCI Debug Popup: Attempting Clerk login...');
  
  // Disable login button
  if (elements.loginBtn) {
    elements.loginBtn.disabled = true;
    elements.loginBtn.innerHTML = '⏳ Opening login window...';
  }
  
  try {
    const userData = await window.QSCIAuth.login();
    console.log('Q-SCI Debug Popup: Login completed, user data:', userData);
    currentUser = userData;
    
    // Show user status
    showUserStatus(currentUser);
    await updateUsageDisplay();
    updatePageStatus();
    
    showSuccess('Login successful!');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Login failed:', error);
    
    // Check if we have stored credentials even though login promise failed
    // This handles edge cases where auth succeeded but promise resolution failed
    try {
      const isLoggedIn = await window.QSCIAuth.isLoggedIn();
      if (isLoggedIn) {
        console.log('Q-SCI Debug Popup: Found stored credentials despite error, attempting to use them');
        currentUser = await window.QSCIAuth.getCurrentUser();
        if (currentUser) {
          showUserStatus(currentUser);
          await updateUsageDisplay();
          updatePageStatus();
          showSuccess('Login successful!');
          return;
        }
      }
    } catch (checkError) {
      console.error('Q-SCI Debug Popup: Error checking stored credentials:', checkError);
    }
    
    showError(error.message || 'Login failed. Please try again.');
  } finally {
    // Re-enable login button
    if (elements.loginBtn) {
      elements.loginBtn.disabled = false;
      elements.loginBtn.innerHTML = '🔐 Login with Clerk';
    }
  }
}

// Handle logout
async function handleLogout() {
  console.log('Q-SCI Debug Popup: Attempting logout...');
  
  try {
    await window.QSCIAuth.logout();
    currentUser = null;
    
    // Show login form
    showLoginForm();
    
    // Hide analysis sections
    if (elements.statsSection) {
      elements.statsSection.style.display = 'none';
    }
    if (elements.detailedSection) {
      elements.detailedSection.style.display = 'none';
    }
    
    showSuccess('Logged out successfully!');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Logout failed:', error);
    showError('Logout failed. Please try again.');
  }
}

// Handle refresh subscription status
async function handleRefreshSubscription() {
  console.log('Q-SCI Debug Popup: Refreshing subscription status...');
  
  if (!currentUser) {
    showError('Please login first.');
    return;
  }

  // Disable refresh button
  if (elements.refreshSubscriptionBtn) {
    elements.refreshSubscriptionBtn.disabled = true;
    elements.refreshSubscriptionBtn.innerHTML = '⏳ Refreshing...';
  }
  
  try {
    const updatedUser = await window.QSCIAuth.refreshSubscriptionStatus();
    currentUser = updatedUser;
    
    // Update UI with new subscription status
    showUserStatus(currentUser);
    await updateUsageDisplay();
    
    showSuccess('Subscription status refreshed!');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Refresh subscription failed:', error);
    showError(error.message || 'Failed to refresh subscription status. Please try again.');
  } finally {
    // Re-enable refresh button
    if (elements.refreshSubscriptionBtn) {
      elements.refreshSubscriptionBtn.disabled = false;
      elements.refreshSubscriptionBtn.innerHTML = '🔄 Refresh Status';
    }
  }
}

// Show login form
function showLoginForm() {
  console.log('Q-SCI Debug Popup: Showing login form');
  
  if (elements.loginForm) {
    elements.loginForm.style.display = 'block';
  }
  if (elements.userStatus) {
    elements.userStatus.style.display = 'none';
  }
  
  // Disable analyze buttons
  if (elements.analyzeBtn) {
    elements.analyzeBtn.disabled = true;
    elements.analyzeBtn.style.opacity = '0.5';
  }
}

// Update subscription badge with i18n support
function updateSubscriptionBadge(status) {
  if (!elements.subscriptionBadge) return;
  
  let badgeKey, backgroundColor, textColor;
  if (status === 'subscribed') {
    badgeKey = 'subscription.subscribed';
    backgroundColor = '#dcfce7';
    textColor = '#166534';
  } else if (status === 'past_due') {
    badgeKey = 'subscription.pastDue';
    backgroundColor = '#fef3c7';
    textColor = '#92400e';
  } else {
    badgeKey = 'subscription.free';
    backgroundColor = '#f3f4f6';
    textColor = '#6b7280';
  }
  
  const badgeText = window.QSCIi18n ? window.QSCIi18n.t(badgeKey) : status;
  elements.subscriptionBadge.textContent = badgeText;
  elements.subscriptionBadge.style.backgroundColor = backgroundColor;
  elements.subscriptionBadge.style.color = textColor;
}

// Show user status
function showUserStatus(user) {
  console.log('Q-SCI Debug Popup: Showing user status');
  
  if (elements.loginForm) {
    elements.loginForm.style.display = 'none';
  }
  if (elements.userStatus) {
    elements.userStatus.style.display = 'block';
  }
  
  // Update user email display
  if (elements.userEmailDisplay && user.email) {
    elements.userEmailDisplay.textContent = user.email;
  }
  
  // Update subscription badge
  updateSubscriptionBadge(user.subscriptionStatus || 'free');
  
  // Enable analyze buttons
  if (elements.analyzeBtn) {
    elements.analyzeBtn.disabled = false;
    elements.analyzeBtn.style.opacity = '1';
  }
}

// Update usage display
async function updateUsageDisplay() {
  if (!currentUser) return;
  
  try {
    const usageInfo = await window.QSCIUsage.canAnalyze(currentUser.subscriptionStatus);
    
    if (elements.usageDisplay) {
      elements.usageDisplay.textContent = `${usageInfo.used} / ${usageInfo.limit}`;
      
      // Color code based on remaining
      if (usageInfo.remaining === 0) {
        elements.usageDisplay.style.color = '#dc2626';
      } else if (usageInfo.remaining < 5) {
        elements.usageDisplay.style.color = '#ea580c';
      } else {
        elements.usageDisplay.style.color = '#374151';
      }
    }
    
    // Show upgrade prompt for free users who are getting close to limit or have reached it
    // Also show for past_due users
    const status = currentUser.subscriptionStatus || 'free';
    if (elements.upgradePrompt && status !== 'subscribed') {
      const shouldShowPrompt = usageInfo.used >= 5 || usageInfo.remaining === 0;
      elements.upgradePrompt.style.display = shouldShowPrompt ? 'block' : 'none';
    } else if (elements.upgradePrompt) {
      // Hide upgrade prompt for subscribed users
      elements.upgradePrompt.style.display = 'none';
    }
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error updating usage display:', error);
  }
}

// Update page status and check for PDF availability
async function updatePageStatus() {
  console.log('Q-SCI Debug Popup: Updating page status...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showPageStatus('❌ No active tab found', false);
      currentTab = null;
      return;
    }
    
    // Set global currentTab variable
    currentTab = tab;
    console.log('Q-SCI Debug Popup: Current tab set:', currentTab.url);
    
    const isSupported = isSupportedSite(currentTab.url);
    console.log('Q-SCI Debug Popup: Site supported:', isSupported, 'URL:', currentTab.url);
    
    if (isSupported) {
      // Check for PDF availability using content script if possible
      try {
        let pageData = null;
        
        try {
          // Try to use content script's message-based extraction
          const response = await chrome.tabs.sendMessage(currentTab.id, { 
            type: 'CHECK_CONTENT_SCRIPT' 
          });
          
          if (response && response.success) {
            console.log('Q-SCI Debug Popup: Content script is loaded');
            // Content script is available, just show status without full extraction
            showPageStatus('✅ Scientific site detected', true);
            return;
          }
        } catch (messageError) {
          console.log('Q-SCI Debug Popup: Content script not available for status check, using fallback');
        }
        
        // Fallback: use inline extraction for status check only
        const results = await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          function: extractPageContent
        });
        
        if (results && results[0] && results[0].result) {
          pageData = results[0].result;
          const hasPdf = pageData.pdfUrls && pageData.pdfUrls.length > 0;
          
          if (hasPdf) {
            showPageStatus('✅ Scientific site detected (PDF available)', true);
            console.log('Q-SCI Debug Popup: PDF URLs found:', pageData.pdfUrls);
          } else {
            showPageStatus('✅ Scientific site detected', true);
          }
        } else {
          showPageStatus('✅ Scientific site detected', true);
        }
      } catch (error) {
        console.warn('Q-SCI Debug Popup: Could not check PDF availability:', error);
        showPageStatus('✅ Scientific site detected', true);
      }
    } else {
      showPageStatus('❌ Not a supported site', false);
    }
    
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error updating page status:', error);
    showPageStatus('❌ Error checking page', false);
  }
}
// Check if site is supported
function isSupportedSite(url) {
  if (!url) return false;
  
  const supportedDomains = [
    'pubmed.ncbi.nlm.nih.gov',
    'pmc.ncbi.nlm.nih.gov',
    'arxiv.org',
    'scholar.google.com',
    'nature.com',
    'science.org',
    'cell.com',
    'thelancet.com',
    'jamanetwork.com',
    'nejm.org'
  ];
  
  return supportedDomains.some(domain => url.includes(domain));
}

// Show page status
function showPageStatus(message, canAnalyze) {
  console.log('Q-SCI Debug Popup: Showing page status:', message, 'Can analyze:', canAnalyze);
  
  if (elements.pageStatus) {
    elements.pageStatus.textContent = message;
  }
  
  // Only disable the analyze button if the user is not logged in
  // If the user is logged in, keep the button enabled even on unsupported sites
  // because they can still use manual text analysis
  if (elements.analyzeBtn && !currentUser) {
    elements.analyzeBtn.disabled = !canAnalyze;
    elements.analyzeBtn.style.opacity = canAnalyze ? '1' : '0.5';
  }
}

// Analyze current page - SIMPLIFIED VERSION
async function analyzePage() {
  console.log('Q-SCI Debug Popup: ==================== STARTING ANALYSIS ====================');
  console.log('Q-SCI Debug Popup: Starting simplified page analysis...');
  console.log('Q-SCI Debug Popup: window.qsciEvaluatePaper available:', typeof window.qsciEvaluatePaper !== 'undefined');
  console.log('Q-SCI Debug Popup: window.QSCIAuth available:', typeof window.QSCIAuth !== 'undefined');
  console.log('Q-SCI Debug Popup: window.QSCIUsage available:', typeof window.QSCIUsage !== 'undefined');
  
  // Check if user is logged in
  if (!currentUser) {
    console.error('Q-SCI Debug Popup: No current user, showing error');
    showError('Please login to use analysis features.');
    return;
  }
  
  console.log('Q-SCI Debug Popup: Current user:', currentUser.email);
  console.log('Q-SCI Debug Popup: Subscription status:', currentUser.subscriptionStatus);
  
  // Check usage limits
  try {
    console.log('Q-SCI Debug Popup: Checking usage limits...');
    const usageInfo = await window.QSCIUsage.canAnalyze(currentUser.subscriptionStatus);
    console.log('Q-SCI Debug Popup: Usage info:', usageInfo);
    
    if (!usageInfo.canAnalyze) {
      const limit = usageInfo.limit;
      const subscriptionType = currentUser.subscriptionStatus === 'subscribed' ? 'subscribed' : 'free';
      
      console.warn('Q-SCI Debug Popup: Usage limit reached:', usageInfo);
      if (subscriptionType === 'free') {
        showError(`You have reached your daily limit of ${limit} analyses. Please subscribe at q-sci.org for more analyses (up to 100 per day).`);
      } else {
        showError(`You have reached your daily limit of ${limit} analyses. Please try again tomorrow.`);
      }
      return;
    }
    
    console.log('Q-SCI Debug Popup: Usage check passed, remaining:', usageInfo.remaining);
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error checking usage:', error);
    showError('Failed to check usage limits. Please try again.');
    return;
  }
  
  // Show loading immediately
  console.log('Q-SCI Debug Popup: Showing loading indicator...');
  showLoading();
  
  try {
    // Get current tab if not already set
    if (!currentTab) {
      console.log('Q-SCI Debug Popup: Current tab not set, querying...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url) {
        throw new Error('No active tab found. Please ensure you are on a webpage.');
      }
      
      currentTab = tab;
      console.log('Q-SCI Debug Popup: Current tab set in analyzePage:', currentTab.url);
    }
    
    console.log('Q-SCI Debug Popup: Using tab:', currentTab.url);
    console.log('Q-SCI Debug Popup: Tab ID:', currentTab.id);
    
    // Extract page content using content script message-based extraction
    // This uses the sophisticated extraction logic in content-script.js with delays and meta tag fallbacks
    console.log('Q-SCI Debug Popup: Requesting page data extraction from content script...');
    
    let pageData = null;
    
    try {
      // First, try to use the content script's message-based extraction
      // This is preferred because it includes sophisticated features like:
      // - 7 second delay for Lancet dynamic content
      // - Meta tag fallback for pages that haven't finished rendering
      // - Loading placeholder detection
      // - Site-specific extraction logic
      const response = await chrome.tabs.sendMessage(currentTab.id, { 
        type: 'EXTRACT_PAGE_DATA' 
      });
      
      console.log('Q-SCI Debug Popup: Content script response:', response);
      
      if (response && response.success && response.data) {
        pageData = response.data;
        console.log('Q-SCI Debug Popup: Successfully extracted page data via content script');
      } else {
        console.warn('Q-SCI Debug Popup: Content script extraction failed:', response?.error);
        throw new Error(response?.error || 'Content script extraction failed');
      }
    } catch (messageError) {
      console.warn('Q-SCI Debug Popup: Failed to communicate with content script:', messageError.message);
      console.log('Q-SCI Debug Popup: Falling back to inline extraction function...');
      
      // Fallback: inject the extraction function directly
      // This is less sophisticated but works when content script is not loaded
      const results = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: extractPageContent
      });
      
      console.log('Q-SCI Debug Popup: Fallback script execution results:', results);
      
      if (!results || !results[0] || !results[0].result) {
        throw new Error('Failed to extract page content. The page may not be accessible or the content script failed to execute.');
      }
      
      pageData = results[0].result;
      console.log('Q-SCI Debug Popup: Extracted page data via fallback method');
    }
    
    console.log('Q-SCI Debug Popup: Extracted page data:', {
      hasTitle: !!pageData.title,
      title: pageData.title ? pageData.title.substring(0, 50) + '...' : 'N/A',
      textLength: pageData.text ? pageData.text.length : 0,
      hasPdfUrls: !!pageData.pdfUrls,
      pdfUrlsCount: pageData.pdfUrls ? pageData.pdfUrls.length : 0,
      isPdfViewer: pageData.isPdfViewer
    });
    
    // Try to analyze PDF first if PDF URLs are available
    let requestData = null;
    let pdfAnalysisAttempted = false;
    
    if (pageData.pdfUrls && pageData.pdfUrls.length > 0 && window.QSCIPDFHandler) {
      console.log('Q-SCI Debug Popup: PDF URLs found, attempting PDF download and analysis...');
      pdfAnalysisAttempted = true;
      
      // Show a status message to the user
      if (elements.loadingMessage) {
        const loadingText = elements.loadingMessage.querySelector('.loading-text');
        if (loadingText) {
          loadingText.textContent = 'Downloading PDF for analysis...';
        }
      }
      
      try {
        const pdfResult = await window.QSCIPDFHandler.tryDownloadAndExtractPDF(pageData.pdfUrls);
        
        if (pdfResult.success && pdfResult.text && pdfResult.text.length >= 50) {
          console.log('Q-SCI Debug Popup: PDF text extracted successfully:', pdfResult.text.length, 'characters');
          requestData = {
            text: pdfResult.text,
            title: pageData.title || 'Unknown Title',
            source_url: pdfResult.pdfUrl || currentTab.url,
            source_type: 'PDF'
          };
          
          // Update loading message
          if (elements.loadingMessage) {
            const loadingText = elements.loadingMessage.querySelector('.loading-text');
            if (loadingText) {
              loadingText.textContent = 'Analyzing PDF content...';
            }
          }
        } else {
          console.warn('Q-SCI Debug Popup: PDF extraction failed or insufficient text:', pdfResult.error);
          // Fall back to HTML text analysis
        }
      } catch (pdfError) {
        console.warn('Q-SCI Debug Popup: Error during PDF analysis:', pdfError.message);
        // Fall back to HTML text analysis
      }
    }
    
    // Fall back to HTML text if PDF analysis wasn't attempted or failed
    if (!requestData) {
      console.log('Q-SCI Debug Popup: Using HTML text analysis', pdfAnalysisAttempted ? '(PDF analysis failed)' : '(no PDF URLs)');
      
      // Update loading message
      if (elements.loadingMessage) {
        const loadingText = elements.loadingMessage.querySelector('.loading-text');
        if (loadingText) {
          loadingText.textContent = 'Analyzing page content...';
        }
      }
      
      if (!pageData.text || pageData.text.length < 50) {
        let errorMsg = 'Insufficient content found on the page (less than 50 characters).';
        
        // Provide specific guidance based on context
        if (pdfAnalysisAttempted) {
          errorMsg += ' PDF analysis was attempted but failed. Please try one of these alternatives:\n\n';
          errorMsg += '1. Wait a few seconds and try again (the page may still be loading)\n';
          errorMsg += '2. Use the Manual Analysis feature below by copying text from the page\n';
          errorMsg += '3. Visit a different version of the article (e.g., abstract page vs PDF viewer)';
        } else if (pageData.isPdfViewer || (pageData.pdfUrls && pageData.pdfUrls.length > 0)) {
          errorMsg += ' This appears to be a PDF page. PDF text extraction from embedded viewers is limited. Please try one of these alternatives:\n\n';
          errorMsg += '1. Wait a few seconds for the PDF to fully load, then try again\n';
          errorMsg += '2. Use the Manual Analysis feature below by copying text from the PDF\n';
          errorMsg += '3. Visit the article\'s abstract/landing page instead of the PDF viewer';
        } else {
          errorMsg += ' Please ensure you are on a paper details page with visible content, or use the Manual Analysis feature below.';
        }
        
        throw new Error(errorMsg);
      }
      
      requestData = {
        text: pageData.text,
        title: pageData.title || 'Unknown Title',
        source_url: currentTab.url,
        source_type: 'HTML'
      };
    }
    
    console.log('Q-SCI Debug Popup: Request data prepared:', {
      type: requestData.source_type,
      textLength: requestData.text ? requestData.text.length : 'N/A',
      title: requestData.title,
      url: requestData.source_url
    });
    
    // Perform evaluation using the LLM evaluator which fetches the API key
    // from the backend and calls OpenAI API
    console.log('Q-SCI Debug Popup: About to call window.qsciEvaluatePaper');
    console.log('Q-SCI Debug Popup: Function type:', typeof window.qsciEvaluatePaper);
    
    const textToEvaluate = requestData.text || '';
    console.log('Q-SCI Debug Popup: Text length to evaluate:', textToEvaluate.length);
    console.log('Q-SCI Debug Popup: Title:', requestData.title);
    console.log('Q-SCI Debug Popup: Source URL:', requestData.source_url);
    
    // Call the evaluator function which always returns a promise
    console.log('Q-SCI Debug Popup: Calling qsciEvaluatePaper...');
    const evaluation = await window.qsciEvaluatePaper(
      textToEvaluate,
      requestData.title || 'Unknown Title',
      requestData.source_url || currentTab.url || ''
    );
    console.log('Q-SCI Debug Popup: Promise resolved successfully');
    
    console.log('Q-SCI Debug Popup: Evaluation result received:', {
      hasResult: !!evaluation,
      quality: evaluation?.quality_percentage,
      trafficLight: evaluation?.traffic_light,
      positiveAspectsCount: evaluation?.positive_aspects?.length,
      negativeAspectsCount: evaluation?.negative_aspects?.length
    });
    
    if (!evaluation) {
      throw new Error('Evaluation returned no results. This may indicate an issue with the evaluator or API.');
    }
    
    currentAnalysis = evaluation;
    console.log('Q-SCI Debug Popup: Displaying analysis results...');
    displayAnalysisResults(evaluation);
    
    // Increment usage after successful analysis
    try {
      console.log('Q-SCI Debug Popup: Incrementing usage counter...');
      await window.QSCIUsage.incrementUsage();
      await updateUsageDisplay();
      console.log('Q-SCI Debug Popup: Usage incremented successfully');
    } catch (usageError) {
      console.error('Q-SCI Debug Popup: Failed to increment usage:', usageError);
      // Don't throw here, as the analysis was successful
    }
    
    console.log('Q-SCI Debug Popup: Analysis completed successfully!');
    showSuccess('Analysis completed successfully!');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Analysis error:', error);
    console.error('Q-SCI Debug Popup: Error type:', error.constructor.name);
    console.error('Q-SCI Debug Popup: Error message:', error.message);
    console.error('Q-SCI Debug Popup: Error stack:', error.stack);
    
    // Ensure the error message is user-friendly
    let errorMessage = error.message || 'Analysis failed. Please try again.';
    
    // Add helpful context for common errors
    if (errorMessage.includes('Insufficient content')) {
      errorMessage += ' You can also try the Manual Analysis feature by pasting text in the text area below.';
    }
    
    showError(errorMessage);
  } finally {
    // Always hide loading, even if there was an error
    console.log('Q-SCI Debug Popup: Hiding loading indicator in finally block...');
    hideLoading();
  }
  
  console.log('Q-SCI Debug Popup: ==================== ANALYSIS COMPLETE ====================');
}

// Content extraction function (injected into page)
function extractPageContent() {
  console.log('Q-SCI Content Extractor: Starting extraction...');
  
  const url = window.location.href;
  let isPdfViewer = false;
  
  // Check if this is a PDF viewer page
  const urlLower = url.toLowerCase();
  const contentType = document.contentType || document.mimeType || '';
  
  if (urlLower.includes('/showpdf') || 
      urlLower.includes('/getpdf') || 
      urlLower.includes('/downloadpdf') ||
      urlLower.includes('/viewpdf') ||
      urlLower.includes('.pdf') ||
      urlLower.includes('pdf=') ||
      contentType.includes('application/pdf') ||
      document.querySelector('embed[type="application/pdf"]') ||
      document.querySelector('object[type="application/pdf"]') ||
      document.querySelector('iframe[src*=".pdf"]')) {
    isPdfViewer = true;
    console.log('Q-SCI Content Extractor: Detected PDF viewer page');
  }
  
  // Try to extract title with comprehensive selectors
  let title = document.title || '';
  const titleSelectors = [
    'h1',
    'h1.article-header__title',
    '.article-title',
    '.paper-title',
    '[data-testid="article-title"]',
    '[data-test="article-title"]',
    '[class*="article-title"]',
    'header h1',
    '.title'
  ];
  
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      title = element.textContent.trim();
      break;
    }
  }
  
  // Try to extract text content
  let text = '';
  
  // For PDF viewers, try multiple strategies
  if (isPdfViewer) {
    console.log('Q-SCI Content Extractor: Attempting PDF text extraction');
    
    // Strategy 1: PDF.js text layers
    const textLayers = document.querySelectorAll('.textLayer');
    if (textLayers.length > 0) {
      console.log('Q-SCI Content Extractor: Found PDF.js text layers:', textLayers.length);
      let pdfText = '';
      textLayers.forEach(layer => {
        const layerText = layer.textContent || '';
        if (layerText.trim()) {
          pdfText += layerText + '\n';
        }
      });
      if (pdfText.length > 100) {
        text = pdfText.trim();
        console.log('Q-SCI Content Extractor: Extracted from PDF.js text layer:', text.length, 'characters');
      }
    }
    
    // Strategy 2: Try viewer-specific containers
    if (!text || text.length < 100) {
      const viewerSelectors = [
        '.pdfViewer .textLayer',
        '#viewer .textLayer',
        '[class*="pdf"] [class*="text"]',
        '[class*="viewer"] [class*="text"]',
        'main',
        '[role="main"]',
        '.main-content',
        '#content'
      ];
      
      for (const selector of viewerSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          let combinedText = '';
          elements.forEach(el => {
            const elText = el.textContent || '';
            if (elText.trim()) {
              combinedText += elText + '\n';
            }
          });
          
          if (combinedText.length > 100) {
            text = combinedText.trim();
            console.log('Q-SCI Content Extractor: Extracted from viewer selector:', selector, text.length, 'characters');
            break;
          }
        }
      }
    }
  }
  
  // Regular text extraction if not PDF or if PDF extraction failed
  if (!text || text.length < 100) {
    const textSelectors = [
      '.abstract',
      '.article-abstract',
      '.paper-abstract',
      'section.abstract',
      '.summary',
      'section.summary',
      '[data-testid="abstract"]',
      '[data-test="abstract-section"]',
      '[class*="abstract"]',
      '.article-body',
      'section.article-body',
      '.content',
      '.article-content',
      'main',
      '[role="main"]',
      '.main-content',
      'article',
      '.article'
    ];
    
    for (const selector of textSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 100) {
        text = element.textContent.trim();
        console.log('Q-SCI Content Extractor: Extracted from selector:', selector, text.length, 'characters');
        break;
      }
    }
  }
  
  // Try extracting from paragraphs if still no content
  if (!text || text.length < 100) {
    const articleContainers = document.querySelectorAll('article, main, [role="main"]');
    if (articleContainers.length > 0) {
      let combinedText = '';
      articleContainers.forEach(container => {
        const paragraphs = container.querySelectorAll('p');
        paragraphs.forEach(p => {
          const pText = p.textContent || '';
          if (pText.trim().length > 50) {
            combinedText += pText.trim() + '\n\n';
          }
        });
      });
      
      if (combinedText.length > 100) {
        text = combinedText.trim();
        console.log('Q-SCI Content Extractor: Extracted from paragraphs:', text.length, 'characters');
      }
    }
  }
  
  // Fallback: get visible text from body (clean up scripts and styles)
  if (!text || text.length < 100) {
    // Get all text nodes without cloning - more efficient
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip text nodes inside script, style, noscript tags
          const parent = node.parentElement;
          if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let bodyText = '';
    let node;
    while (node = walker.nextNode()) {
      const nodeText = node.textContent || '';
      if (nodeText.trim()) {
        bodyText += nodeText;
      }
    }
    
    if (bodyText.trim().length > 100) {
      text = bodyText.trim();
      console.log('Q-SCI Content Extractor: Extracted from body (cleaned):', text.length, 'characters');
    }
  }
  
  // Try to extract PDF URLs
  const pdfUrls = [];
  const pdfLinks = document.querySelectorAll('a[href*=".pdf"], a[href*="pdf"]');
  pdfLinks.forEach(link => {
    const href = link.href;
    if (href && (href.endsWith('.pdf') || href.includes('/pdf/') || href.includes('getPDF') || href.includes('showPdf'))) {
      pdfUrls.push(href);
    }
  });
  
  // If this is a PDF viewer, add the current URL as a PDF URL
  if (isPdfViewer && !pdfUrls.includes(url)) {
    pdfUrls.push(url);
  }
  
  console.log('Q-SCI Content Extractor: Extracted:', {
    title: title ? title.substring(0, 50) + '...' : 'None',
    textLength: text.length,
    pdfUrlsFound: pdfUrls.length,
    isPdfViewer: isPdfViewer
  });
  
  return {
    title: title,
    text: text,
    url: window.location.href,
    pdfUrls: pdfUrls,
    isPdfViewer: isPdfViewer
  };
}

// Display analysis results
function displayAnalysisResults(analysis) {
  console.log('Q-SCI Debug Popup: Displaying results:', analysis);
  
  if (!analysis) {
    console.error('Q-SCI Debug Popup: No analysis data to display');
    return;
  }
  
  // Update quality score and background color
  if (elements.qualityScore && elements.qualityStatItem) {
    const score = analysis.quality_percentage || analysis.score || 0;
    elements.qualityScore.textContent = `${Math.round(score)}%`;
    
    // Remove all quality classes first
    elements.qualityStatItem.classList.remove('quality-high', 'quality-medium', 'quality-low');
    
    // Add background color based on quality score
    if (score >= 80) {
      elements.qualityStatItem.classList.add('quality-high');
    } else if (score >= 50) {
      elements.qualityStatItem.classList.add('quality-medium');
    } else {
      elements.qualityStatItem.classList.add('quality-low');
    }
  }
  
  // Display reasoning/justification if available
  if (elements.scoreReasoningSection && elements.scoreReasoningText) {
    if (analysis.reasoning || analysis.justification) {
      elements.scoreReasoningText.textContent = analysis.reasoning || analysis.justification;
      elements.scoreReasoningSection.style.display = 'block';
    } else {
      // Hide reasoning section if not available
      elements.scoreReasoningSection.style.display = 'none';
    }
  }
  
  // Show stats section
  if (elements.statsSection) {
    elements.statsSection.style.display = 'block';
  }

  // Automatically show detailed analysis after displaying the quality score
  console.log('Q-SCI Debug Popup: Auto-showing detailed analysis');
  showDetailedAnalysis();
  
  console.log('Q-SCI Debug Popup: Results displayed successfully');
}

// openDetailedAnalysis function removed (no longer needed)

// UI Helper Functions
function showLoading() {
  console.log('Q-SCI Debug Popup: Showing loading...');
  
  if (elements.loadingMessage) {
    elements.loadingMessage.style.display = 'flex';
  }
  
  if (elements.analyzeBtn) {
    elements.analyzeBtn.disabled = true;
    // Use i18n for button text
    const analyzingText = window.QSCIi18n ? window.QSCIi18n.t('message.analyzing') : 'Analyzing...';
    elements.analyzeBtn.textContent = analyzingText;
  }
}

function hideLoading() {
  console.log('Q-SCI Debug Popup: Hiding loading...');
  
  if (elements.loadingMessage) {
    elements.loadingMessage.style.display = 'none';
  }
  
  if (elements.analyzeBtn) {
    elements.analyzeBtn.disabled = false;
    // Use i18n for button text
    const analyzeButtonText = window.QSCIi18n ? window.QSCIi18n.t('page.analyzeButton') : 'Analyze Paper';
    elements.analyzeBtn.textContent = analyzeButtonText;
  }
}

// Show detailed analysis in popup
function showDetailedAnalysis() {
  console.log('Q-SCI Debug Popup: Showing detailed analysis...');
  
  if (!currentAnalysis) {
    showError('No analysis data available. Please analyze a paper first.');
    return;
  }
  
  // Show both stats and detailed section (no toggle needed)
  if (elements.statsSection) {
    elements.statsSection.style.display = 'block';
  }
  
  if (elements.detailedSection) {
    elements.detailedSection.style.display = 'block';
  }
  
  // Populate detailed analysis data
  populateDetailedAnalysis(currentAnalysis);
}

// Populate detailed analysis data
function populateDetailedAnalysis(analysis) {
  console.log('Q-SCI Debug Popup: Populating detailed analysis...');
  
  // Journal information
  if (analysis.journal_info && (analysis.journal_info.journal_name || analysis.journal_info.name)) {
    if (elements.journalInfo) {
      elements.journalInfo.style.display = 'block';
    }
    
    if (elements.journalName) {
      elements.journalName.textContent = analysis.journal_info.journal_name || analysis.journal_info.name;
    }
    
    if (elements.journalCategory) {
      // Show the prestige tier in the category field if present
      elements.journalCategory.textContent = analysis.journal_info.prestige_tier || analysis.journal_info.category || 'N/A';
    }
  } else {
    if (elements.journalInfo) {
      elements.journalInfo.style.display = 'none';
    }
  }
  
  // Quality score and traffic light
  if (elements.detailedQualityPercentage) {
    elements.detailedQualityPercentage.textContent = `${analysis.quality_percentage}%`;
  }
  
  if (elements.detailedTrafficLight) {
    const trafficLight = analysis.traffic_light || '';
    elements.detailedTrafficLight.textContent = trafficLight;
    
    // Apply traffic light color
    elements.detailedTrafficLight.className = 'traffic-light';
    if (trafficLight.toLowerCase().includes('green') || trafficLight.toLowerCase().includes('good')) {
      elements.detailedTrafficLight.classList.add('green');
    } else if (trafficLight.toLowerCase().includes('yellow') || trafficLight.toLowerCase().includes('moderate')) {
      elements.detailedTrafficLight.classList.add('yellow');
    } else if (trafficLight.toLowerCase().includes('red') || trafficLight.toLowerCase().includes('poor')) {
      elements.detailedTrafficLight.classList.add('red');
    }
  }
  
  // Positive aspects
  if (elements.positiveAspectsList && analysis.positive_aspects) {
    elements.positiveAspectsList.innerHTML = '';
    
    analysis.positive_aspects.forEach((aspect, index) => {
      const aspectElement = document.createElement('div');
      aspectElement.className = 'analysis-item clickable';
      
      // Handle both string and object formats
      // For LLM results, aspect objects have keys 'aspect' and 'source_text'.
      // For legacy heuristic results, use 'text' and 'source'.
      let aspectText;
      let aspectSource;
      if (typeof aspect === 'string') {
        aspectText = aspect;
        aspectSource = null;
      } else if (typeof aspect === 'object') {
        aspectText = aspect.aspect || aspect.text || '';
        aspectSource = aspect.source_text || aspect.source || null;
      } else {
        aspectText = String(aspect);
        aspectSource = null;
      }
      
      aspectElement.textContent = aspectText;
      aspectElement.addEventListener('click', () => showSourceText(aspectText, 'positive', index, aspectSource));
      elements.positiveAspectsList.appendChild(aspectElement);
    });
  }
  
  // Negative aspects (areas for improvement)
  if (elements.negativeAspectsList && analysis.negative_aspects) {
    elements.negativeAspectsList.innerHTML = '';
    
    analysis.negative_aspects.forEach((aspect, index) => {
      const aspectElement = document.createElement('div');
      aspectElement.className = 'analysis-item clickable';
      
      // Handle both string and object formats
      let aspectText;
      let aspectSource;
      if (typeof aspect === 'string') {
        aspectText = aspect;
        aspectSource = null;
      } else if (typeof aspect === 'object') {
        aspectText = aspect.aspect || aspect.text || '';
        aspectSource = aspect.source_text || aspect.source || null;
      } else {
        aspectText = String(aspect);
        aspectSource = null;
      }
      
      aspectElement.textContent = aspectText;
      aspectElement.addEventListener('click', () => showSourceText(aspectText, 'negative', index, aspectSource));
      elements.negativeAspectsList.appendChild(aspectElement);
    });
  }

  // Display badges if available
  const badgesContainer = document.getElementById('badges-container');
  if (badgesContainer && analysis.badges) {
    badgesContainer.innerHTML = '';
    analysis.badges.forEach((badge) => {
      const badgeEl = document.createElement('span');
      badgeEl.className = 'qsci-badge';
      badgeEl.textContent = badge;
      badgesContainer.appendChild(badgeEl);
    });
  }
  
  // Show source citations section
  if (elements.sourceCitationsSection) {
    elements.sourceCitationsSection.style.display = 'block';
  }
}

// Show source text for clicked evaluation point
function showSourceText(evaluationPoint, type, index, sourceText) {
  console.log('Q-SCI Debug Popup: Showing source text for:', evaluationPoint);
  
  // Use actual source text from API if available, otherwise show fallback message
  let displayText;
  // Consider empty string as not available - we need actual citation text
  if (sourceText !== undefined && sourceText !== null && sourceText.trim() !== '') {
    // Wrap the citation in quotation marks to clearly indicate it's a direct quote
    displayText = `"${sourceText}"`;
  } else {
    // Use i18n for fallback message
    displayText = window.QSCIi18n ? window.QSCIi18n.t('detailed.noExactCitation') : 'aspect extracted from reasoning regarding multiple parts of the publication';
  }
  
  if (elements.sourceContent) {
    elements.sourceContent.textContent = displayText;
  }
  
  if (elements.sourceTextDisplay) {
    elements.sourceTextDisplay.style.display = 'block';
  }
  
  // Scroll to source text
  if (elements.sourceTextDisplay) {
    elements.sourceTextDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Export analysis to text format
function exportAnalysis() {
  console.log('Q-SCI Debug Popup: Exporting analysis...');
  
  if (!currentAnalysis) {
    showError('No analysis data available to export.');
    return;
  }
  
  let exportText = '# Q-SCI Scientific Paper Quality Analysis\n\n';
  
  // Quality score
  exportText += `## Quality Score: ${currentAnalysis.quality_percentage}%\n`;
  exportText += `**Assessment:** ${currentAnalysis.traffic_light}\n\n`;
  
  // Journal information
  if (currentAnalysis.journal_info) {
    const jInfo = currentAnalysis.journal_info;
    const jName = jInfo.journal_name || jInfo.name || '';
    exportText += `## Journal Information\n`;
    exportText += `- **Journal:** ${jName}\n`;
    exportText += `- **Journal Tier:** ${jInfo.impact_factor || 'N/A'}\n`;
    exportText += `- **Quartile:** ${jInfo.quartile || 'N/A'}\n`;
    exportText += `- **Prestige Tier:** ${jInfo.prestige_tier || 'N/A'}\n\n`;
  }
  
  // Positive aspects
  if (currentAnalysis.positive_aspects && currentAnalysis.positive_aspects.length > 0) {
    exportText += `## ✅ Positive Aspects\n`;
    currentAnalysis.positive_aspects.forEach((aspect, index) => {
      // Aspect can be a string or an object with text and source
      const text = typeof aspect === 'string' ? aspect : (aspect.text || aspect);
      exportText += `${index + 1}. ${text}\n`;
    });
    exportText += '\n';
  }
  
  // Areas for improvement
  if (currentAnalysis.negative_aspects && currentAnalysis.negative_aspects.length > 0) {
    exportText += `## ⚠️ Areas for Improvement\n`;
    currentAnalysis.negative_aspects.forEach((aspect, index) => {
      const text = typeof aspect === 'string' ? aspect : (aspect.text || aspect);
      exportText += `${index + 1}. ${text}\n`;
    });
    exportText += '\n';
  }
  
  exportText += `---\n*Analysis generated by Q-SCI Browser Extension*\n`;
  
  // Create and download file
  const blob = new Blob([exportText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qsci-analysis-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showSuccess('Analysis exported successfully!');
}

function showError(message) {
  console.error('Q-SCI Debug Popup: Showing error:', message);
  console.error('Q-SCI Debug Popup: Error stack trace:', new Error().stack);
  
  // TEMPORARY: Show alert for debugging
  alert('Q-SCI Error: ' + message);
  
  if (elements.errorMessage) {
    const errorText = elements.errorMessage.querySelector('.error-text');
    if (errorText) {
      errorText.textContent = message;
    }
    elements.errorMessage.style.display = 'block';
    
    // For API key, authentication, or backend errors, keep the message visible longer (30 seconds)
    // This ensures users have enough time to read and understand the error
    const timeout = message.includes('API key') || message.includes('authentication') || 
                    message.includes('backend') || message.includes('login') || 
                    message.includes('endpoint') || message.includes('Unable to retrieve') ? 30000 : 12000;
    
    console.log('Q-SCI Debug Popup: Error message will be visible for', timeout, 'ms');
    
    setTimeout(() => {
      if (elements.errorMessage) {
        elements.errorMessage.style.display = 'none';
      }
    }, timeout);
  } else {
    // Fallback: show an alert if error element not found
    console.error('Q-SCI Debug Popup: Error message element not found, using alert');
    alert('Q-SCI Error: ' + message);
  }
}

function showSuccess(message) {
  console.log('Q-SCI Debug Popup: Showing success:', message);
  
  if (elements.successMessage) {
    const successText = elements.successMessage.querySelector('.success-text');
    if (successText) {
      successText.textContent = message;
    }
    elements.successMessage.style.display = 'flex';
    
    setTimeout(() => {
      if (elements.successMessage) {
        elements.successMessage.style.display = 'none';
      }
    }, 3000);
  }
}

console.log('Q-SCI Debug Popup: Script initialization complete');

