// Q-SCI Browser Extension - Simplified Debug Version
console.log('Q-SCI Debug Popup: Script loaded');

// Global variables
let elements = {};
let currentTab = null;
let currentAnalysis = null;
let currentUser = null;

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
    impactFactor: document.getElementById('impact-factor'),
    quartile: document.getElementById('quartile'),
    viewDetailsBtn: document.getElementById('view-details-btn'),
    manualText: document.getElementById('manual-text'),
    manualAnalyzeBtn: document.getElementById('manual-analyze-btn'),
    loadingMessage: document.getElementById('loading-overlay'),
    errorMessage: document.getElementById('error-message'),
    successMessage: document.getElementById('success-message'),
    // Detailed view elements
    detailedSection: document.getElementById('detailed-section'),
    closeDetailsBtn: document.getElementById('close-details-btn'),
    journalInfo: document.getElementById('journal-info'),
    journalName: document.getElementById('journal-name'),
    detailedImpactFactor: document.getElementById('detailed-impact-factor'),
    detailedQuartile: document.getElementById('detailed-quartile'),
    journalCategory: document.getElementById('journal-category'),
    detailedQualityCircle: document.getElementById('detailed-quality-circle'),
    detailedQualityPercentage: document.getElementById('detailed-quality-percentage'),
    detailedTrafficLight: document.getElementById('detailed-traffic-light'),
    positiveAspectsList: document.getElementById('positive-aspects-list'),
    negativeAspectsList: document.getElementById('negative-aspects-list'),
    sourceCitationsSection: document.getElementById('source-citations-section'),
    sourceTextDisplay: document.getElementById('source-text-display'),
    sourceContent: document.getElementById('source-content'),
    openWebAppDetailed: document.getElementById('open-web-app-detailed'),
    exportAnalysisBtn: document.getElementById('export-analysis-btn'),
    // Settings elements
    analyzePdfCheckbox: document.getElementById('analyze-pdf'),
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
  
  if (elements.manualAnalyzeBtn) {
    elements.manualAnalyzeBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Manual analyze button clicked');
      analyzeText();
    });
  }
  
  if (elements.viewDetailsBtn) {
    elements.viewDetailsBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: View details button clicked');
      showDetailedAnalysis();
    });
  }
  
  if (elements.closeDetailsBtn) {
    elements.closeDetailsBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Close details button clicked');
      hideDetailedAnalysis();
    });
  }
  
  if (elements.openWebAppDetailed) {
    elements.openWebAppDetailed.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Open web app detailed button clicked');
      openDetailedAnalysis();
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
  
  try {
    // Check if user is logged in
    const isLoggedIn = await window.QSCIAuth.isLoggedIn();
    
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
    currentUser = userData;
    
    // Show user status
    showUserStatus(currentUser);
    await updateUsageDisplay();
    updatePageStatus();
    
    showSuccess('Login successful!');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Login failed:', error);
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
  if (elements.manualAnalyzeBtn) {
    elements.manualAnalyzeBtn.disabled = true;
    elements.manualAnalyzeBtn.style.opacity = '0.5';
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
  if (elements.manualAnalyzeBtn) {
    elements.manualAnalyzeBtn.disabled = false;
    elements.manualAnalyzeBtn.style.opacity = '1';
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
      // Check for PDF availability
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          function: extractPageContent
        });
        
        if (results && results[0] && results[0].result) {
          const pageData = results[0].result;
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
  
  if (elements.analyzeBtn) {
    elements.analyzeBtn.disabled = !canAnalyze;
    elements.analyzeBtn.style.opacity = canAnalyze ? '1' : '0.5';
  }
}

// Analyze current page - SIMPLIFIED VERSION
async function analyzePage() {
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
  
  // Check usage limits
  try {
    const usageInfo = await window.QSCIUsage.canAnalyze(currentUser.subscriptionStatus);
    
    if (!usageInfo.canAnalyze) {
      const limit = usageInfo.limit;
      const subscriptionType = currentUser.subscriptionStatus === 'subscribed' ? 'subscribed' : 'free';
      
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
    
    // Extract page content using content script
    console.log('Q-SCI Debug Popup: Injecting content script...');
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      function: extractPageContent
    });
    
    if (!results || !results[0] || !results[0].result) {
      throw new Error('Failed to extract page content');
    }
    
    const pageData = results[0].result;
    console.log('Q-SCI Debug Popup: Extracted page data:', {
      hasTitle: !!pageData.title,
      textLength: pageData.text ? pageData.text.length : 0
    });
    
    if (!pageData.text || pageData.text.length < 50) {
      throw new Error('Insufficient content found. Please ensure you are on a paper details page.');
    }
    
    // Check if PDF analysis is enabled
    const usePdfAnalysis = elements.analyzePdfCheckbox && elements.analyzePdfCheckbox.checked;
    console.log('Q-SCI Debug Popup: PDF analysis enabled:', usePdfAnalysis);
    
    let requestData;
    if (usePdfAnalysis && pageData.pdfUrls && pageData.pdfUrls.length > 0) {
      // Use PDF URL for analysis
      console.log('Q-SCI Debug Popup: Using PDF analysis with URL:', pageData.pdfUrls[0]);
      requestData = {
        pdf_url: pageData.pdfUrls[0],
        title: pageData.title || 'Unknown Title',
        source_url: currentTab.url
      };
    } else {
      // Use HTML text for analysis
      console.log('Q-SCI Debug Popup: Using HTML text analysis');
      requestData = {
        text: pageData.text,
        title: pageData.title || 'Unknown Title',
        source_url: currentTab.url
      };
    }
    
    console.log('Q-SCI Debug Popup: Request data:', {
      type: usePdfAnalysis && pageData.pdfUrls && pageData.pdfUrls.length > 0 ? 'PDF' : 'HTML',
      textLength: requestData.text ? requestData.text.length : 'N/A',
      pdfUrl: requestData.pdf_url || 'N/A',
      title: requestData.title,
      url: requestData.source_url
    });
    
    // Perform evaluation locally using the in-browser evaluator.  The
    // evaluator is exposed on the global window (qsciEvaluatePaper) and
    // returns an object with quality metrics.  This avoids any
    // network requests and runs entirely within the extension.
    console.log('Q-SCI Debug Popup: About to call window.qsciEvaluatePaper');
    console.log('Q-SCI Debug Popup: Text length:', textToEvaluate.length);
    console.log('Q-SCI Debug Popup: Title:', requestData.title);
    
    try {
      const textToEvaluate = requestData.text || '';
      // Support both synchronous and asynchronous evaluators.  If
      // qsciEvaluatePaper returns a promise, await it; otherwise use the
      // returned value directly.
      console.log('Q-SCI Debug Popup: Calling qsciEvaluatePaper...');
      let evaluation = window.qsciEvaluatePaper(
        textToEvaluate,
        requestData.title || 'Unknown Title',
        requestData.source_url || currentTab.url || ''
      );
      console.log('Q-SCI Debug Popup: qsciEvaluatePaper returned:', evaluation);
      console.log('Q-SCI Debug Popup: Is promise?', evaluation && typeof evaluation.then === 'function');
      
      if (evaluation && typeof evaluation.then === 'function') {
        console.log('Q-SCI Debug Popup: Awaiting promise...');
        evaluation = await evaluation;
        console.log('Q-SCI Debug Popup: Promise resolved');
      }
      console.log('Q-SCI Debug Popup: Evaluation result:', evaluation);
      currentAnalysis = evaluation;
      displayAnalysisResults(evaluation);
      
      // Increment usage after successful analysis
      try {
        await window.QSCIUsage.incrementUsage();
        await updateUsageDisplay();
        console.log('Q-SCI Debug Popup: Usage incremented');
      } catch (usageError) {
        console.error('Q-SCI Debug Popup: Failed to increment usage:', usageError);
      }
      
      showSuccess('Analysis completed successfully!');
    } catch (error) {
      console.error('Q-SCI Debug Popup: Evaluation error:', error);
      showError(error.message || 'Analysis failed. Please try again.');
    } finally {
      hideLoading();
    }
  } catch (error) {
    console.error('Q-SCI Debug Popup: Outer analysis error:', error);
    showError(error.message || 'Analysis failed. Please try again.');
    hideLoading();
  }
}

// Content extraction function (injected into page)
function extractPageContent() {
  console.log('Q-SCI Content Extractor: Starting extraction...');
  
  // Try to extract title
  let title = '';
  const titleSelectors = [
    'h1',
    '.article-title',
    '.paper-title',
    '[data-testid="article-title"]',
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
  const textSelectors = [
    '.abstract',
    '.article-abstract',
    '.paper-abstract',
    '[data-testid="abstract"]',
    '.content',
    '.article-content',
    'main',
    '.main-content'
  ];
  
  for (const selector of textSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim().length > 100) {
      text = element.textContent.trim();
      break;
    }
  }
  
  // Fallback: get all text from body
  if (!text || text.length < 100) {
    text = document.body.textContent.trim();
  }
  
  // Try to extract PDF URLs
  const pdfUrls = [];
  const pdfLinks = document.querySelectorAll('a[href*=".pdf"], a[href*="pdf"]');
  pdfLinks.forEach(link => {
    const href = link.href;
    if (href && (href.endsWith('.pdf') || href.includes('/pdf/') || href.includes('getPDF'))) {
      pdfUrls.push(href);
    }
  });
  
  console.log('Q-SCI Content Extractor: Extracted:', {
    title: title.substring(0, 50) + '...',
    textLength: text.length,
    pdfUrlsFound: pdfUrls.length
  });
  
  return {
    title: title,
    text: text,
    url: window.location.href,
    pdfUrls: pdfUrls
  };
}

// Analyze manual text
async function analyzeText() {
  // Check if user is logged in
  if (!currentUser) {
    showError('Please login to use analysis features.');
    return;
  }
  
  const text = elements.manualText?.value?.trim();
  
  if (!text || text.length < 50) {
    showError('Please enter at least 50 characters of text to analyze.');
    return;
  }
  
  // Check usage limits
  try {
    const usageInfo = await window.QSCIUsage.canAnalyze(currentUser.subscriptionStatus);
    
    if (!usageInfo.canAnalyze) {
      const limit = usageInfo.limit;
      const subscriptionType = currentUser.subscriptionStatus === 'subscribed' ? 'subscribed' : 'free';
      
      if (subscriptionType === 'free') {
        showError(`You have reached your daily limit of ${limit} analyses. Please subscribe at q-sci.org for more analyses (up to 100 per day).`);
      } else {
        showError(`You have reached your daily limit of ${limit} analyses. Please try again tomorrow.`);
      }
      return;
    }
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error checking usage:', error);
    showError('Failed to check usage limits. Please try again.');
    return;
  }
  
  console.log('Q-SCI Debug Popup: Starting manual text analysis...');
  showLoading();
  
  try {
    // Use the same evaluator for manual text.  Title is arbitrary
    // and the source is set to 'manual-input'.  The evaluator may
    // return a promise when using the LLM backend, so handle both
    // synchronous and asynchronous responses.
    let evaluation = window.qsciEvaluatePaper(
      text,
      'Manual Text Analysis',
      'manual-input'
    );
    if (evaluation && typeof evaluation.then === 'function') {
      evaluation = await evaluation;
    }
    console.log('Q-SCI Debug Popup: Manual evaluation result:', evaluation);
    currentAnalysis = evaluation;
    displayAnalysisResults(evaluation);
    
    // Increment usage after successful analysis
    try {
      await window.QSCIUsage.incrementUsage();
      await updateUsageDisplay();
      console.log('Q-SCI Debug Popup: Usage incremented');
    } catch (usageError) {
      console.error('Q-SCI Debug Popup: Failed to increment usage:', usageError);
    }
    
    showSuccess('Text analysis completed successfully!');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Text analysis error:', error);
    showError(error.message || 'Text analysis failed. Please try again.');
  } finally {
    hideLoading();
  }
}

// Display analysis results
function displayAnalysisResults(analysis) {
  console.log('Q-SCI Debug Popup: Displaying results:', analysis);
  
  if (!analysis) {
    console.error('Q-SCI Debug Popup: No analysis data to display');
    return;
  }
  
  // Update quality score
  if (elements.qualityScore) {
    const score = analysis.quality_percentage || analysis.score || 0;
    elements.qualityScore.textContent = `${Math.round(score)}%`;
    
    // Color coding
    let colorClass = 'red';
    if (score >= 80) colorClass = 'green';
    else if (score >= 50) colorClass = 'yellow';
    
    elements.qualityScore.className = `stat-value ${colorClass}`;
  }
  
  // Update impact factor
  if (elements.impactFactor) {
    const impactFactor = analysis.journal_info?.impact_factor;
    elements.impactFactor.textContent = impactFactor || 'N/A';
  }
  
  // Update quartile
  if (elements.quartile) {
    const quartile = analysis.journal_info?.quartile;
    elements.quartile.textContent = quartile || 'N/A';
    
    if (quartile) {
      let quartileClass = '';
      if (quartile === 'Q1') quartileClass = 'green';
      else if (quartile === 'Q2') quartileClass = 'yellow';
      else if (quartile === 'Q3') quartileClass = 'orange';
      else if (quartile === 'Q4') quartileClass = 'red';
      
      elements.quartile.className = `stat-value ${quartileClass}`;
    }
  }
  
  // Show stats section
  if (elements.statsSection) {
    elements.statsSection.style.display = 'block';
  }

  // Show the view details button when results are available
  if (elements.viewDetailsBtn) {
    elements.viewDetailsBtn.style.display = 'block';
  }
  
  console.log('Q-SCI Debug Popup: Results displayed successfully');
}

// Open detailed analysis
function openDetailedAnalysis() {
  if (currentAnalysis) {
    chrome.tabs.create({
      url: 'https://3000-ic4ghrpbrssboc1wpxpwt-618fd2b2.manusvm.computer'
    });
  }
}

// UI Helper Functions
function showLoading() {
  console.log('Q-SCI Debug Popup: Showing loading...');
  
  if (elements.loadingMessage) {
    elements.loadingMessage.style.display = 'flex';
  }
  
  if (elements.analyzeBtn) {
    elements.analyzeBtn.disabled = true;
    elements.analyzeBtn.textContent = 'Analyzing...';
  }
}

function hideLoading() {
  console.log('Q-SCI Debug Popup: Hiding loading...');
  
  if (elements.loadingMessage) {
    elements.loadingMessage.style.display = 'none';
  }
  
  if (elements.analyzeBtn) {
    elements.analyzeBtn.disabled = false;
    elements.analyzeBtn.textContent = 'Analyze Paper';
  }
}

// Show detailed analysis in popup
function showDetailedAnalysis() {
  console.log('Q-SCI Debug Popup: Showing detailed analysis...');
  
  if (!currentAnalysis) {
    showError('No analysis data available. Please analyze a paper first.');
    return;
  }
  
  // Hide main sections and show detailed section
  if (elements.statsSection) {
    elements.statsSection.style.display = 'none';
  }
  
  if (elements.detailedSection) {
    elements.detailedSection.style.display = 'block';
  }
  
  // Populate detailed analysis data
  populateDetailedAnalysis(currentAnalysis);
}

// Hide detailed analysis and return to main view
function hideDetailedAnalysis() {
  console.log('Q-SCI Debug Popup: Hiding detailed analysis...');
  
  if (elements.detailedSection) {
    elements.detailedSection.style.display = 'none';
  }
  
  if (elements.statsSection) {
    elements.statsSection.style.display = 'block';
  }
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
    
    if (elements.detailedImpactFactor) {
      // Display the prestige tier as the journal tier (stored in impact_factor field)
      elements.detailedImpactFactor.textContent = analysis.journal_info.impact_factor || 'N/A';
    }
    
    if (elements.detailedQuartile) {
      elements.detailedQuartile.textContent = analysis.journal_info.quartile || 'N/A';
      
      // Apply quartile color
      const quartile = analysis.journal_info.quartile;
      if (quartile) {
        let quartileClass = '';
        if (quartile === 'Q1') quartileClass = 'green';
        else if (quartile === 'Q2') quartileClass = 'yellow';
        else if (quartile === 'Q3') quartileClass = 'orange';
        else if (quartile === 'Q4') quartileClass = 'red';
        
        elements.detailedQuartile.className = `metric-value ${quartileClass}`;
      }
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
  
  // Use actual source text from API if available, otherwise show placeholder
  let displayText;
  // Consider empty string as valid source text; only treat undefined or null as unavailable
  if (sourceText !== undefined && sourceText !== null) {
    displayText = sourceText;
  } else {
    displayText = `Source text for "${evaluationPoint}" is not available. This evaluation point was generated based on the overall analysis of the paper content.`;
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
  
  if (elements.errorMessage) {
    const errorText = elements.errorMessage.querySelector('.error-text');
    if (errorText) {
      errorText.textContent = message;
    }
    elements.errorMessage.style.display = 'flex';
    
    setTimeout(() => {
      if (elements.errorMessage) {
        elements.errorMessage.style.display = 'none';
      }
    }, 5000);
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

