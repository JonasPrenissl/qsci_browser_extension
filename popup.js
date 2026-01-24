// Q-SCI Browser Extension - Simplified Debug Version
console.log('Q-SCI Debug Popup: Script loaded');

// Global variables
let elements = {};
let currentTab = null;
let currentAnalysis = null;
let currentUser = null;
let currentPdfUrl = null;
let analysisHistory = []; // Array to store historical analyses
let selectedHistoryItem = null; // Currently selected historical analysis
let paperContextForChat = null; // Store paper context for chat even when not on the page

// Constants for polling and timeouts
const POLL_INTERVAL_MS = 500; // Poll every 500ms for analysis status
const MAX_POLL_ATTEMPTS = 240; // 240 * 500ms = 2 minutes max polling time
const MAX_HISTORY_ITEMS = 50; // Maximum number of analyses to store in history

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
  
  // Load saved analysis before initializing auth
  await loadSavedAnalysis();
  
  initializeAuth();
  
  // Make functions globally accessible for onclick handlers
  window.loadHistoryItem = loadHistoryItem;
  window.deleteHistoryItem = deleteHistoryItem;
  window.returnToCurrentPage = returnToCurrentPage;
});

// Listen for messages from background worker (e.g., analysis complete)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Q-SCI Debug Popup: Received message from background:', message?.type);
  
  if (message.type === 'ANALYSIS_COMPLETE') {
    console.log('Q-SCI Debug Popup: Analysis completed in background, updating UI...');
    if (message.result) {
      currentAnalysis = message.result;
      displayAnalysisResults(message.result);
      showSuccess('Analysis completed successfully!');
    }
  } else if (message.type === 'ANALYSIS_ERROR') {
    console.error('Q-SCI Debug Popup: Analysis error from background:', message.error);
    showError(message.error || 'Analysis failed');
  }
  
  sendResponse({ received: true });
  return true;
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
    journalImpactFactor: document.getElementById('journal-impact-factor'),
    impactFactorValue: document.getElementById('impact-factor-value'),
    journalCategory: document.getElementById('journal-category'),
    detailedQualityCircle: document.getElementById('detailed-quality-circle'),
    detailedQualityPercentage: document.getElementById('detailed-quality-percentage'),
    detailedTrafficLight: document.getElementById('detailed-traffic-light'),
    positiveAspectsList: document.getElementById('positive-aspects-list'),
    negativeAspectsList: document.getElementById('negative-aspects-list'),
    exportAnalysisBtn: document.getElementById('export-analysis-btn'),
    downloadPdfBtn: document.getElementById('download-pdf-btn'),
    // Chat elements
    chatContainer: document.getElementById('chat-container'),
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    chatSendBtn: document.getElementById('chat-send-btn'),
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
    languageSelector: document.getElementById('language-selector'),
    // History elements
    viewHistoryBtn: document.getElementById('view-history-btn'),
    closeHistoryBtn: document.getElementById('close-history-btn'),
    historySection: document.getElementById('history-section'),
    historyList: document.getElementById('history-list')
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

  if (elements.downloadPdfBtn) {
    elements.downloadPdfBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Download PDF button clicked');
      downloadPdf();
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

  // Chat event listeners
  if (elements.chatSendBtn) {
    elements.chatSendBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Chat send button clicked');
      handleChatSend();
    });
  }

  if (elements.chatInput) {
    elements.chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        console.log('Q-SCI Debug Popup: Chat input Enter pressed');
        handleChatSend();
      }
    });
  }

  // History event listeners
  if (elements.viewHistoryBtn) {
    elements.viewHistoryBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: View history button clicked');
      showHistoryView();
    });
  }

  if (elements.closeHistoryBtn) {
    elements.closeHistoryBtn.addEventListener('click', function() {
      console.log('Q-SCI Debug Popup: Close history button clicked');
      closeHistoryView();
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

// Load saved analysis from chrome.storage.local
async function loadSavedAnalysis() {
  console.log('Q-SCI Debug Popup: Loading saved analysis...');
  
  try {
    // First check if there's an ongoing analysis in the background
    const stateResponse = await chrome.runtime.sendMessage({
      type: 'GET_ANALYSIS_STATE'
    });
    
    if (stateResponse && stateResponse.state) {
      const state = stateResponse.state;
      console.log('Q-SCI Debug Popup: Found background analysis state:', state.status);
      
      if (state.status === 'running') {
        // Analysis is still running, show loading
        console.log('Q-SCI Debug Popup: Analysis is running in background, showing loading...');
        
        // Show which URL is being analyzed
        const loadingMessage = state.message || 'Analysis in progress...';
        let analyzingInfo = null;
        if (state.sourceUrl) {
          // Extract domain from URL for display
          try {
            const url = new URL(state.sourceUrl);
            analyzingInfo = state.title || url.hostname;
          } catch (e) {
            // Invalid URL format - this can happen if sourceUrl is malformed
            // Safe to ignore as we simply won't show the analyzing info
            console.log('Q-SCI Debug Popup: Failed to parse sourceUrl for display:', e.message);
          }
        }
        
        showLoading(loadingMessage, state.progress || 50, analyzingInfo);
        
        // Continue polling for completion
        pollForAnalysisCompletion();
        return; // Don't load old saved analysis
      } else if (state.status === 'complete' && state.result) {
        // Analysis completed while popup was closed
        console.log('Q-SCI Debug Popup: Found completed analysis from background');
        currentAnalysis = state.result;
        currentPdfUrl = state.pdfUrl || null;
        displayAnalysisResults(state.result);
        
        // Save to the regular storage location as well
        await saveAnalysis(state.result);
        
        // Clear the background state since we've retrieved it
        await chrome.runtime.sendMessage({ type: 'CLEAR_ANALYSIS_STATE' });
        return;
      } else if (state.status === 'error') {
        // Analysis failed while popup was closed
        console.error('Q-SCI Debug Popup: Found failed analysis from background:', state.error);
        showError(state.error || 'Previous analysis failed');
        
        // Clear the error state
        await chrome.runtime.sendMessage({ type: 'CLEAR_ANALYSIS_STATE' });
        // Continue to check for older saved analysis below
      }
    }
    
    // No ongoing background analysis, check for previously saved results
    const result = await chrome.storage.local.get(['qsci_current_analysis', 'qsci_current_pdf_url']);
    
    if (result.qsci_current_analysis) {
      console.log('Q-SCI Debug Popup: Found saved analysis');
      currentAnalysis = result.qsci_current_analysis;
      currentPdfUrl = result.qsci_current_pdf_url || null;
      
      // Display the saved analysis
      displayAnalysisResults(currentAnalysis);
    } else {
      console.log('Q-SCI Debug Popup: No saved analysis found');
    }
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error loading saved analysis:', error);
  }
}

// Poll for analysis completion when analysis is running in background
// Returns the analysis result or throws an error
async function pollForAnalysisResult() {
  console.log('Q-SCI Debug Popup: Starting to poll for analysis completion...');
  
  let pollAttempts = 0;
  
  while (pollAttempts < MAX_POLL_ATTEMPTS) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    pollAttempts++;
    
    try {
      const stateResponse = await chrome.runtime.sendMessage({
        type: 'GET_ANALYSIS_STATE'
      });
      
      if (stateResponse && stateResponse.state) {
        const state = stateResponse.state;
        
        // Update progress if available
        if (state.progress) {
          updateLoadingProgress(state.message || 'Analyzing...', state.progress);
        }
        
        // Check if complete
        if (state.status === 'complete' && state.result) {
          console.log('Q-SCI Debug Popup: Analysis completed during polling');
          currentPdfUrl = state.pdfUrl || null;
          
          // Clear background state
          await chrome.runtime.sendMessage({ type: 'CLEAR_ANALYSIS_STATE' });
          
          return state.result;
        }
        
        // Check if error
        if (state.status === 'error') {
          console.error('Q-SCI Debug Popup: Analysis failed during polling:', state.error);
          
          // Clear background state
          await chrome.runtime.sendMessage({ type: 'CLEAR_ANALYSIS_STATE' });
          
          throw new Error(state.error || 'Analysis failed in background');
        }
      }
    } catch (error) {
      // If it's an analysis error, rethrow it
      if (error.message && error.message.includes('Analysis failed')) {
        throw error;
      }
      // Otherwise it's a polling error, continue
      console.error('Q-SCI Debug Popup: Error during polling:', error);
    }
  }
  
  // Timeout
  console.warn('Q-SCI Debug Popup: Polling timed out');
  throw new Error('Analysis timed out or did not complete');
}

// Poll for analysis completion when analysis is running in background
// Handles all UI updates (used when restoring analysis on popup open)
async function pollForAnalysisCompletion() {
  console.log('Q-SCI Debug Popup: Starting to poll for analysis completion...');
  
  try {
    const result = await pollForAnalysisResult();
    
    // Analysis completed successfully
    currentAnalysis = result;
    
    hideLoading();
    displayAnalysisResults(result);
    
    // Save to regular storage
    await saveAnalysis(result);
    
    // Increment usage after successful analysis
    try {
      await window.QSCIUsage.incrementUsage();
      await updateUsageDisplay();
    } catch (usageError) {
      console.error('Q-SCI Debug Popup: Failed to increment usage:', usageError);
    }
    
    showSuccess('Analysis completed successfully!');
  } catch (error) {
    hideLoading();
    showError(error.message || 'Analysis failed');
  }
}

// Save analysis to chrome.storage.local and add to history
async function saveAnalysis(analysis) {
  console.log('Q-SCI Debug Popup: Saving analysis...');
  
  try {
    // Save as current analysis
    await chrome.storage.local.set({ 
      qsci_current_analysis: analysis,
      qsci_current_pdf_url: currentPdfUrl
    });
    
    // Add to history
    await addToHistory(analysis);
    
    console.log('Q-SCI Debug Popup: Analysis saved successfully');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error saving analysis:', error);
  }
}

// Add analysis to history
async function addToHistory(analysis) {
  console.log('Q-SCI Debug Popup: Adding analysis to history...');
  
  try {
    // Load existing history
    const result = await chrome.storage.local.get(['qsci_analysis_history']);
    let history = result.qsci_analysis_history || [];
    
    // Create paper context if not available
    // This ensures chat can still work even if paperContextForChat wasn't captured
    let contextToSave = paperContextForChat;
    if (!contextToSave && analysis) {
      // Create a minimal context from analysis data
      contextToSave = {
        title: analysis.journal_name || (currentTab ? currentTab.title : 'Unknown Paper'),
        text: analysis.reasoning || '',
        url: currentTab ? currentTab.url : null
      };
      console.log('Q-SCI Debug Popup: Created fallback paper context from analysis data');
    }
    
    // Create history item
    const historyItem = {
      id: Date.now(), // Unique ID
      timestamp: new Date().toISOString(),
      analysis: analysis,
      pdfUrl: currentPdfUrl,
      paperContext: contextToSave, // Save paper context for offline chat
      pageUrl: currentTab ? currentTab.url : null,
      pageTitle: currentTab ? currentTab.title : null
    };
    
    // Add to beginning of array
    history.unshift(historyItem);
    
    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    // Save updated history
    await chrome.storage.local.set({ qsci_analysis_history: history });
    
    // Update local history cache
    analysisHistory = history;
    
    console.log('Q-SCI Debug Popup: Analysis added to history');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error adding to history:', error);
  }
}

// Load analysis history from storage
async function loadAnalysisHistory() {
  console.log('Q-SCI Debug Popup: Loading analysis history...');
  
  try {
    const result = await chrome.storage.local.get(['qsci_analysis_history']);
    analysisHistory = result.qsci_analysis_history || [];
    console.log(`Q-SCI Debug Popup: Loaded ${analysisHistory.length} history items`);
    return analysisHistory;
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error loading history:', error);
    return [];
  }
}

// Delete a history item
async function deleteHistoryItem(itemId) {
  console.log('Q-SCI Debug Popup: Deleting history item:', itemId);
  
  try {
    // Reload history from storage first to avoid overwriting changes
    const result = await chrome.storage.local.get(['qsci_analysis_history']);
    let history = result.qsci_analysis_history || [];
    
    // Filter out the item
    history = history.filter(item => item.id !== itemId);
    
    // Save updated history
    await chrome.storage.local.set({ qsci_analysis_history: history });
    
    // Update local cache
    analysisHistory = history;
    
    // Refresh the history view
    await showHistoryView();
    
    console.log('Q-SCI Debug Popup: History item deleted');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error deleting history item:', error);
    showError('Failed to delete history item');
  }
}

// Load a history item and display it
async function loadHistoryItem(itemId) {
  console.log('Q-SCI Debug Popup: Loading history item:', itemId);
  
  try {
    const item = analysisHistory.find(h => h.id === itemId);
    
    if (!item) {
      showError('History item not found');
      return;
    }
    
    // Set as current analysis
    currentAnalysis = item.analysis;
    currentPdfUrl = item.pdfUrl;
    paperContextForChat = item.paperContext;
    selectedHistoryItem = item;
    
    // Display the analysis
    displayAnalysisResults(item.analysis);
    
    // Close history view
    closeHistoryView();
    
    // Show indicator that this is from history
    showHistoryIndicator(item);
    
    console.log('Q-SCI Debug Popup: History item loaded');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error loading history item:', error);
    showError('Failed to load history item');
  }
}

// Clear saved analysis from chrome.storage.local
async function clearSavedAnalysis() {
  console.log('Q-SCI Debug Popup: Clearing saved analysis...');
  
  try {
    await chrome.storage.local.remove(['qsci_current_analysis', 'qsci_current_pdf_url']);
    
    // Also clear background analysis state
    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_ANALYSIS_STATE' });
    } catch (e) {
      // Background worker might not be ready, that's OK
      console.log('Q-SCI Debug Popup: Could not clear background state (worker might not be ready)');
    }
    
    console.log('Q-SCI Debug Popup: Saved analysis cleared');
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error clearing saved analysis:', error);
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
  
  // Check actual auth state from storage instead of relying on currentUser variable
  // This prevents false "Please login first" errors when popup reopens
  const isLoggedIn = await window.QSCIAuth.isLoggedIn();
  if (!isLoggedIn) {
    showError('Please login first.');
    return;
  }
  
  // Get current user from storage if not already set
  if (!currentUser) {
    currentUser = await window.QSCIAuth.getCurrentUser();
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
  // Get current user from storage if not already set
  if (!currentUser) {
    currentUser = await window.QSCIAuth.getCurrentUser();
  }
  
  // Return early if still no user (not logged in)
  if (!currentUser) return;
  
  try {
    const usageInfo = await window.QSCIUsage.canAnalyze(currentUser.subscriptionStatus);
    
    if (elements.usageDisplay) {
      // Format usage to show 1 decimal place for fractional values
      const usedFormatted = usageInfo.used % 1 === 0 ? usageInfo.used : usageInfo.used.toFixed(1);
      elements.usageDisplay.textContent = `${usedFormatted} / ${usageInfo.limit}`;
      
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
      // Check page status using content script if possible
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
  
  // Clear any previously saved analysis and PDF URL when starting a new analysis
  await clearSavedAnalysis();
  currentAnalysis = null;
  currentPdfUrl = null;
  
  // Check if user is logged in by querying actual auth state
  // This prevents false "Please login" errors when popup reopens
  const isLoggedIn = await window.QSCIAuth.isLoggedIn();
  if (!isLoggedIn) {
    console.error('Q-SCI Debug Popup: No current user, showing error');
    showError('Please login to use analysis features.');
    return;
  }
  
  // Get current user from storage if not already set
  if (!currentUser) {
    currentUser = await window.QSCIAuth.getCurrentUser();
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
  
  // Show loading immediately with initial stage
  console.log('Q-SCI Debug Popup: Showing loading indicator...');
  const preparingMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.preparingAnalysis') : 'Preparing analysis...';
  showLoading(preparingMsg, 5);
  
  try {
    // IMPORTANT: Capture and lock the tab information at the very start of analysis
    // This ensures the URL being analyzed doesn't change if the user switches tabs mid-analysis
    let analyzedTab;
    if (!currentTab) {
      console.log('Q-SCI Debug Popup: Current tab not set, querying...');
      const detectingMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.detectingPage') : 'Detecting page...';
      updateLoadingProgress(detectingMsg, 10);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url) {
        throw new Error('No active tab found. Please ensure you are on a webpage.');
      }
      
      analyzedTab = tab;
      currentTab = tab;
      console.log('Q-SCI Debug Popup: Current tab set in analyzePage:', currentTab.url);
    } else {
      // Lock the tab being analyzed (create a shallow copy to preserve current state)
      // This prevents the reference from being affected by subsequent updates to currentTab
      // Note: Chrome Tab objects contain only primitive values (id, url, title, etc.)
      // so a shallow copy is sufficient
      analyzedTab = { ...currentTab };
    }
    
    // Use analyzedTab for all subsequent operations to prevent confusion if user switches tabs
    console.log('Q-SCI Debug Popup: Locked analyzed tab:', analyzedTab.url);
    console.log('Q-SCI Debug Popup: Locked tab ID:', analyzedTab.id);
    
    // Extract page content using content script message-based extraction
    // This uses the sophisticated extraction logic in content-script.js with delays and meta tag fallbacks
    console.log('Q-SCI Debug Popup: Requesting page data extraction from content script...');
    const extractingMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.extractingContent') : 'Extracting content from page...';
    updateLoadingProgress(extractingMsg, 15);
    
    let pageData = null;
    
    try {
      // First, try to use the content script's message-based extraction
      // This is preferred because it includes sophisticated features like:
      // - 7-second delay (LANCET_CONTENT_DELAY = 7000ms) for Lancet dynamic content
      // - Meta tag fallback for pages that haven't finished rendering
      // - Loading placeholder detection
      // - Site-specific extraction logic
      const response = await chrome.tabs.sendMessage(analyzedTab.id, { 
        type: 'EXTRACT_PAGE_DATA' 
      });
      
      console.log('Q-SCI Debug Popup: Content script response:', response);
      
      if (response && response.success && response.data) {
        pageData = response.data;
        const extractedMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.contentExtracted') : 'Content extracted successfully';
        updateLoadingProgress(extractedMsg, 35);
        console.log('Q-SCI Debug Popup: Successfully extracted page data via content script');
      } else {
        console.warn('Q-SCI Debug Popup: Content script extraction failed:', response?.error);
        throw new Error(response?.error || 'Content script extraction failed');
      }
    } catch (messageError) {
      console.warn('Q-SCI Debug Popup: Failed to communicate with content script:', messageError.message);
      console.log('Q-SCI Debug Popup: Falling back to inline extraction function...');
      const fallbackMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.usingFallback') : 'Using fallback extraction...';
      updateLoadingProgress(fallbackMsg, 25);
      
      // Fallback: inject the extraction function directly
      // This is less sophisticated but works when content script is not loaded
      const results = await chrome.scripting.executeScript({
        target: { tabId: analyzedTab.id },
        function: extractPageContent
      });
      
      console.log('Q-SCI Debug Popup: Fallback script execution results:', results);
      
      if (!results || !results[0] || !results[0].result) {
        throw new Error('Failed to extract page content. The page may not be accessible or the content script failed to execute.');
      }
      
      pageData = results[0].result;
      const extractedMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.contentExtracted') : 'Content extracted successfully';
      updateLoadingProgress(extractedMsg, 35);
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
    
    // Capture paper context for chat functionality
    paperContextForChat = {
      title: pageData.title || 'Unknown Title',
      text: pageData.text || '',
      url: analyzedTab.url
    };
    console.log('Q-SCI Debug Popup: Paper context captured for chat');
    
    // Try to analyze PDF first if PDF URLs are available
    let requestData = null;
    let pdfAnalysisAttempted = false;
    
    if (pageData.pdfUrls && pageData.pdfUrls.length > 0 && window.QSCIPDFHandler) {
      console.log('Q-SCI Debug Popup: PDF URLs found, attempting PDF download and analysis...');
      pdfAnalysisAttempted = true;
      
      try {
        const pdfResult = await window.QSCIPDFHandler.tryDownloadAndExtractPDF(pageData.pdfUrls);
        
        if (pdfResult.success && pdfResult.text && pdfResult.text.length >= 50) {
          console.log('Q-SCI Debug Popup: PDF text extracted successfully:', pdfResult.text.length, 'characters');
          requestData = {
            text: pdfResult.text,
            title: pageData.title || 'Unknown Title',
            source_url: pdfResult.pdfUrl || analyzedTab.url,
            source_type: 'PDF'
          };
          // Store PDF URL for download functionality
          currentPdfUrl = pdfResult.pdfUrl || null;
          console.log('Q-SCI Debug Popup: Stored PDF URL for download:', currentPdfUrl);
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
      const preparingTextMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.preparingText') : 'Preparing text for analysis...';
      updateLoadingProgress(preparingTextMsg, 45);
      
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
        source_url: analyzedTab.url,
        source_type: 'HTML'
      };
      const textPreparedMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.textPrepared') : 'Text prepared successfully';
      updateLoadingProgress(textPreparedMsg, 50);
    }
    
    console.log('Q-SCI Debug Popup: Request data prepared:', {
      type: requestData.source_type,
      textLength: requestData.text ? requestData.text.length : 'N/A',
      title: requestData.title,
      url: requestData.source_url
    });
    
    // Send analysis request to background worker
    // This allows the analysis to continue even if the user switches tabs or closes the popup
    console.log('Q-SCI Debug Popup: Sending analysis request to background worker...');
    const sendingToAiMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.sendingToAi') : 'Sending to AI for analysis...';
    updateLoadingProgress(sendingToAiMsg, 60);
    
    const analysisData = {
      text: requestData.text || '',
      title: requestData.title || 'Unknown Title',
      sourceUrl: requestData.source_url || analyzedTab.url || '',
      sourceType: requestData.source_type,
      pdfUrl: currentPdfUrl
    };
    
    console.log('Q-SCI Debug Popup: Analysis data prepared:', {
      textLength: analysisData.text.length,
      title: analysisData.title,
      sourceUrl: analysisData.sourceUrl,
      sourceType: analysisData.sourceType
    });
    
    // Start the analysis in background worker
    const startingBgMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.startingBackground') : 'Starting background analysis...';
    updateLoadingProgress(startingBgMsg, 65);
    const bgResponse = await chrome.runtime.sendMessage({
      type: 'START_ANALYSIS',
      data: analysisData
    });
    
    if (!bgResponse || !bgResponse.success) {
      throw new Error(bgResponse?.error || 'Failed to start background analysis');
    }
    
    console.log('Q-SCI Debug Popup: Background analysis started successfully');
    const runningMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.runningInBackground') : 'Analysis running in background...';
    updateLoadingProgress(runningMsg, 70);
    
    // Poll for analysis completion using the reusable function
    // This allows the user to close the popup and come back later
    const evaluation = await pollForAnalysisResult();
    
    console.log('Q-SCI Debug Popup: Analysis completed successfully');
    const processingMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.processingResults') : 'Processing results...';
    updateLoadingProgress(processingMsg, 90);
    
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
    const displayingMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.displayingResults') : 'Displaying results...';
    updateLoadingProgress(displayingMsg, 95);
    displayAnalysisResults(evaluation);
    
    // Save the analysis to chrome.storage.local for persistence
    await saveAnalysis(evaluation);
    
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
    
    const completeMsg = window.QSCIi18n ? window.QSCIi18n.t('progress.complete') : 'Complete!';
    updateLoadingProgress(completeMsg, 100);
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
// Helper function to create aspect element with inline source/explanation
function createAspectElement(aspect, type) {
  // Create container for aspect and its details
  const aspectContainer = document.createElement('div');
  aspectContainer.className = 'aspect-container';
  
  // Create the clickable aspect element
  const aspectElement = document.createElement('div');
  aspectElement.className = 'analysis-item clickable';
  
  // Handle both string and object formats
  // For LLM results, aspect objects have keys 'aspect', 'source_text', and 'explanation'.
  // For legacy heuristic results, use 'text' and 'source'.
  let aspectText;
  let aspectSource;
  let aspectExplanation;
  if (typeof aspect === 'string') {
    aspectText = aspect;
    aspectSource = null;
    aspectExplanation = null;
  } else if (typeof aspect === 'object') {
    aspectText = aspect.aspect || aspect.text || '';
    aspectSource = aspect.source_text || aspect.source || null;
    aspectExplanation = aspect.explanation || null;
  } else {
    aspectText = String(aspect);
    aspectSource = null;
    aspectExplanation = null;
  }
  
  aspectElement.textContent = aspectText;
  
  // Create inline source/explanation section (hidden by default)
  const detailsSection = document.createElement('div');
  detailsSection.className = 'aspect-details';
  detailsSection.style.display = 'none';
  
  // Determine colors based on aspect type
  const isPositive = type === 'positive';
  const sourceBgColor = isPositive ? '#f8fafc' : '#fef2f2';
  const sourceBorderColor = isPositive ? '#10b981' : '#ef4444';
  const sourceLabelColor = isPositive ? '#059669' : '#dc2626';
  
  // Create source section
  const sourceSection = document.createElement('div');
  sourceSection.className = 'aspect-source';
  sourceSection.style.marginTop = '8px';
  sourceSection.style.padding = '12px';
  sourceSection.style.background = sourceBgColor;
  sourceSection.style.borderLeft = `4px solid ${sourceBorderColor}`;
  sourceSection.style.borderRadius = '4px';
  
  const sourceLabel = document.createElement('div');
  sourceLabel.style.fontSize = '12px';
  sourceLabel.style.fontWeight = '600';
  sourceLabel.style.color = sourceLabelColor;
  sourceLabel.style.marginBottom = '6px';
  sourceLabel.setAttribute('data-i18n', 'detailed.source');
  sourceLabel.textContent = window.QSCIi18n ? window.QSCIi18n.t('detailed.source') : 'Quelle';
  
  const sourceContent = document.createElement('div');
  sourceContent.style.fontStyle = 'italic';
  sourceContent.style.fontSize = '13px';
  sourceContent.style.lineHeight = '1.6';
  sourceContent.style.color = '#374151';
  
  // Use actual source text from API if available, otherwise show fallback message
  let displayText;
  if (aspectSource !== undefined && aspectSource !== null && aspectSource.trim() !== '') {
    displayText = `"${aspectSource}"`;
  } else {
    displayText = window.QSCIi18n ? window.QSCIi18n.t('detailed.noExactCitation') : 'A precise source citation cannot be provided here, as this aspect is based on an integrative analysis of multiple text passages. The scientific validity derives from the overall argumentation of the publication.';
  }
  sourceContent.textContent = displayText;
  
  sourceSection.appendChild(sourceLabel);
  sourceSection.appendChild(sourceContent);
  detailsSection.appendChild(sourceSection);
  
  // Create explanation section if available
  if (aspectExplanation && aspectExplanation.trim() !== '') {
    const explanationSection = document.createElement('div');
    explanationSection.className = 'aspect-explanation';
    explanationSection.style.marginTop = '8px';
    explanationSection.style.padding = '12px';
    explanationSection.style.background = '#f0f9ff';
    explanationSection.style.borderLeft = '4px solid #3b82f6';
    explanationSection.style.borderRadius = '4px';
    
    const explanationLabel = document.createElement('div');
    explanationLabel.style.fontSize = '12px';
    explanationLabel.style.fontWeight = '600';
    explanationLabel.style.color = '#1e40af';
    explanationLabel.style.marginBottom = '6px';
    explanationLabel.setAttribute('data-i18n', 'detailed.explanation');
    explanationLabel.textContent = window.QSCIi18n ? window.QSCIi18n.t('detailed.explanation') : 'Erklärung:';
    
    const explanationContent = document.createElement('div');
    explanationContent.style.fontSize = '13px';
    explanationContent.style.lineHeight = '1.6';
    explanationContent.style.color = '#1e3a8a';
    explanationContent.textContent = aspectExplanation;
    
    explanationSection.appendChild(explanationLabel);
    explanationSection.appendChild(explanationContent);
    detailsSection.appendChild(explanationSection);
  }
  
  // Toggle visibility on click
  aspectElement.addEventListener('click', () => {
    const isVisible = detailsSection.style.display !== 'none';
    detailsSection.style.display = isVisible ? 'none' : 'block';
  });
  
  aspectContainer.appendChild(aspectElement);
  aspectContainer.appendChild(detailsSection);
  
  return aspectContainer;
}

function displayAnalysisResults(analysis) {
  console.log('Q-SCI Debug Popup: Displaying results:', analysis);
  
  if (!analysis) {
    console.error('Q-SCI Debug Popup: No analysis data to display');
    return;
  }
  
  // Validate analysis quality score before displaying
  const score = analysis.quality_percentage || analysis.score;
  if (typeof score !== 'number' || score < 0 || score > 100) {
    console.error('Q-SCI Debug Popup: Invalid quality score:', score);
    showError('Invalid analysis result received. The quality score is missing or invalid. Please try analyzing again.');
    return;
  }
  
  // Clear chat history for new analysis
  chatHistory = [];
  paperContextForChat = null;
  if (elements.chatMessages) {
    // Clear previous messages and show welcome message using i18n
    const welcomeText = window.QSCIi18n ? window.QSCIi18n.t('detailed.chatWelcome') : 'Ask questions about the publication, and the AI will answer them based on the analyzed content.';
    elements.chatMessages.innerHTML = `
      <div style="font-size: 12px; color: #6b7280; text-align: center; padding: 20px;">
        ${welcomeText}
      </div>
    `;
  }
  
  // Update quality score and background color
  if (elements.qualityScore && elements.qualityStatItem) {
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
    const reasoningText = analysis.reasoning || analysis.justification || '';
    
    // Only show reasoning if it has meaningful content (more than 10 characters)
    if (reasoningText.trim().length > 10) {
      
      // Format the reasoning into paragraphs
      // Split on double line breaks first (if present), then on single line breaks, then on sentences
      let paragraphs = [];
      
      // Try splitting on double line breaks first
      if (reasoningText.includes('\n\n')) {
        paragraphs = reasoningText.split('\n\n').filter(p => p.trim().length > 0);
      } 
      // Try splitting on single line breaks if we don't have enough paragraphs
      else if (reasoningText.includes('\n')) {
        paragraphs = reasoningText.split('\n').filter(p => p.trim().length > 0);
      }
      // If no line breaks, try to split into sentences and group them
      else {
        // Split on sentence boundaries (., !, ?) followed by space
        const sentences = reasoningText.split(/([.!?])\s+/).filter(s => s.trim().length > 0);
        
        // Reconstruct sentences (merge punctuation with preceding text)
        const fullSentences = [];
        for (let i = 0; i < sentences.length; i++) {
          if (sentences[i].match(/^[.!?]$/)) {
            // This is punctuation, merge with previous
            if (fullSentences.length > 0) {
              fullSentences[fullSentences.length - 1] += sentences[i];
            }
          } else {
            fullSentences.push(sentences[i]);
          }
        }
        
        // Group sentences into 2-3 paragraphs
        const sentencesPerParagraph = Math.ceil(fullSentences.length / 3);
        for (let i = 0; i < fullSentences.length; i += sentencesPerParagraph) {
          const paragraphSentences = fullSentences.slice(i, i + sentencesPerParagraph);
          paragraphs.push(paragraphSentences.join(' '));
        }
      }
      
      // If we still only have one paragraph and it's very long (>200 chars), try to split it
      if (paragraphs.length === 1 && paragraphs[0].length > 200) {
        const text = paragraphs[0];
        const sentences = text.split(/([.!?])\s+/).filter(s => s.trim().length > 0);
        
        // Reconstruct sentences
        const fullSentences = [];
        for (let i = 0; i < sentences.length; i++) {
          if (sentences[i].match(/^[.!?]$/)) {
            if (fullSentences.length > 0) {
              fullSentences[fullSentences.length - 1] += sentences[i];
            }
          } else {
            fullSentences.push(sentences[i]);
          }
        }
        
        // Split into 2-3 paragraphs
        if (fullSentences.length > 1) {
          paragraphs = [];
          const sentencesPerParagraph = Math.ceil(fullSentences.length / 3);
          for (let i = 0; i < fullSentences.length; i += sentencesPerParagraph) {
            const paragraphSentences = fullSentences.slice(i, i + sentencesPerParagraph);
            paragraphs.push(paragraphSentences.join(' '));
          }
        }
      }
      
      // Create HTML with paragraph tags, escaping the text to prevent XSS
      const paragraphsHtml = paragraphs.map(p => `<p style="margin-bottom: 8px;">${escapeHtml(p.trim())}</p>`).join('');
      elements.scoreReasoningText.innerHTML = paragraphsHtml;
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

  // Show/hide download PDF button based on whether PDF URL is available
  if (elements.downloadPdfBtn) {
    if (currentPdfUrl) {
      elements.downloadPdfBtn.style.display = 'inline-block';
      console.log('Q-SCI Debug Popup: Download PDF button shown');
    } else {
      elements.downloadPdfBtn.style.display = 'none';
      console.log('Q-SCI Debug Popup: Download PDF button hidden (no PDF URL)');
    }
  }

  // Automatically show detailed analysis after displaying the quality score
  console.log('Q-SCI Debug Popup: Auto-showing detailed analysis');
  showDetailedAnalysis();
  
  console.log('Q-SCI Debug Popup: Results displayed successfully');
}

// openDetailedAnalysis function removed (no longer needed)

// UI Helper Functions
function showLoading(stage = '', progress = 0, analyzingInfo = null) {
  console.log('Q-SCI Debug Popup: Showing loading...', stage, progress);
  
  if (elements.loadingMessage) {
    elements.loadingMessage.style.display = 'flex';
    
    // Update stage text if provided - use safe DOM manipulation
    const stageElement = elements.loadingMessage.querySelector('.loading-stage');
    if (stageElement) {
      // Clear previous content
      stageElement.textContent = '';
      
      if (stage) {
        // Create main message text node
        const messageNode = document.createTextNode(stage);
        stageElement.appendChild(messageNode);
        
        // Add analyzing info if provided (prevents XSS by using textContent)
        if (analyzingInfo) {
          const br = document.createElement('br');
          stageElement.appendChild(br);
          
          const small = document.createElement('small');
          small.style.color = '#9ca3af';
          small.textContent = `Analyzing: ${analyzingInfo}`;
          stageElement.appendChild(small);
        }
      }
    }
    
    // Update progress bar if provided
    const progressFill = elements.loadingMessage.querySelector('.loading-progress-fill');
    if (progressFill && progress > 0) {
      progressFill.style.width = progress + '%';
    }
  }
  
  if (elements.analyzeBtn) {
    elements.analyzeBtn.disabled = true;
    // Use i18n for button text
    const analyzingText = window.QSCIi18n ? window.QSCIi18n.t('message.analyzing') : 'Analyzing...';
    elements.analyzeBtn.textContent = analyzingText;
  }
}

function updateLoadingProgress(stage, progress) {
  console.log('Q-SCI Debug Popup: Updating loading progress...', stage, progress);
  
  if (elements.loadingMessage) {
    const stageElement = elements.loadingMessage.querySelector('.loading-stage');
    if (stageElement) {
      stageElement.textContent = stage;
    }
    
    const progressFill = elements.loadingMessage.querySelector('.loading-progress-fill');
    if (progressFill) {
      progressFill.style.width = progress + '%';
    }
  }
}

function hideLoading() {
  console.log('Q-SCI Debug Popup: Hiding loading...');
  
  if (elements.loadingMessage) {
    elements.loadingMessage.style.display = 'none';
    
    // Reset progress
    const stageElement = elements.loadingMessage.querySelector('.loading-stage');
    if (stageElement) {
      stageElement.textContent = '';
    }
    
    const progressFill = elements.loadingMessage.querySelector('.loading-progress-fill');
    if (progressFill) {
      progressFill.style.width = '0%';
    }
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
    
    // Display impact factor if available
    if (elements.journalImpactFactor && elements.impactFactorValue) {
      if (analysis.journal_info.impact_factor && analysis.journal_info.impact_factor !== 'Not available') {
        elements.impactFactorValue.textContent = analysis.journal_info.impact_factor;
        elements.journalImpactFactor.style.display = 'block';
      } else {
        elements.journalImpactFactor.style.display = 'none';
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
      const aspectContainer = createAspectElement(aspect, 'positive');
      elements.positiveAspectsList.appendChild(aspectContainer);
    });
  }
  
  // Negative aspects (areas for improvement)
  if (elements.negativeAspectsList && analysis.negative_aspects) {
    elements.negativeAspectsList.innerHTML = '';
    
    analysis.negative_aspects.forEach((aspect, index) => {
      const aspectContainer = createAspectElement(aspect, 'negative');
      elements.negativeAspectsList.appendChild(aspectContainer);
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
}

// Export analysis to PDF format
function exportAnalysis() {
  console.log('Q-SCI Debug Popup: Exporting analysis to PDF...');
  
  if (!currentAnalysis) {
    showError('No analysis data available to export.');
    return;
  }
  
  try {
    // Check if PDF export function is available
    if (typeof window.exportAnalysisToPDF !== 'function') {
      throw new Error('PDF export function not loaded. Please refresh the extension.');
    }
    
    // Call the PDF export function with current analysis and chat history
    window.exportAnalysisToPDF(currentAnalysis, chatHistory);
    
    showSuccess('PDF exported successfully!');
  } catch (error) {
    console.error('Q-SCI Debug Popup: PDF export error:', error);
    showError('Failed to export PDF: ' + error.message);
  }
}

// Download the PDF of the publication
async function downloadPdf() {
  console.log('Q-SCI Debug Popup: Downloading publication PDF...');
  
  if (!currentPdfUrl) {
    showError('No PDF available to download. The analysis may not have been performed on a PDF.');
    return;
  }
  
  try {
    // Validate the PDF URL format
    let validUrl;
    try {
      validUrl = new URL(currentPdfUrl);
      // Ensure it's HTTP or HTTPS
      if (!validUrl.protocol.startsWith('http')) {
        throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
      }
    } catch (urlValidationError) {
      console.error('Q-SCI Debug Popup: Invalid PDF URL:', currentPdfUrl, urlValidationError);
      showError('Invalid PDF URL. Cannot download the file.');
      return;
    }
    
    // Use Chrome's downloads API to download the PDF
    console.log('Q-SCI Debug Popup: Initiating download for:', currentPdfUrl);
    
    // Extract a filename from the URL or use a default
    let filename = 'publication.pdf';
    try {
      const pathParts = validUrl.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.endsWith('.pdf')) {
        filename = lastPart;
      } else if (currentAnalysis && currentAnalysis.journal_info && 
                 (currentAnalysis.journal_info.journal_name || currentAnalysis.journal_info.name)) {
        // Create a filename from journal name if available
        const journalName = currentAnalysis.journal_info.journal_name || currentAnalysis.journal_info.name;
        const sanitizedName = journalName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        filename = `${sanitizedName}_${Date.now()}.pdf`;
      }
    } catch (filenameError) {
      console.warn('Q-SCI Debug Popup: Error generating filename:', filenameError);
      // Keep the default filename
    }
    
    // Trigger the download using Chrome's downloads API
    chrome.downloads.download({
      url: currentPdfUrl,
      filename: filename,
      saveAs: true // Prompt user for save location
    }, function(downloadId) {
      if (chrome.runtime.lastError) {
        console.error('Q-SCI Debug Popup: Download error:', chrome.runtime.lastError);
        showError('Failed to download PDF: ' + chrome.runtime.lastError.message);
      } else {
        console.log('Q-SCI Debug Popup: Download started with ID:', downloadId);
        showSuccess('PDF download started!');
      }
    });
    
  } catch (error) {
    console.error('Q-SCI Debug Popup: PDF download error:', error);
    showError('Failed to download PDF: ' + error.message);
  }
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

// Show history view
async function showHistoryView() {
  console.log('Q-SCI Debug Popup: Showing history view...');
  
  try {
    // Load history
    await loadAnalysisHistory();
    
    // Hide other sections
    if (elements.statsSection) elements.statsSection.style.display = 'none';
    if (elements.detailedSection) elements.detailedSection.style.display = 'none';
    
    // Show history section
    if (elements.historySection) {
      elements.historySection.style.display = 'block';
    }
    
    // Render history list
    renderHistoryList();
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error showing history:', error);
    showError('Failed to load history');
  }
}

// Close history view
function closeHistoryView() {
  console.log('Q-SCI Debug Popup: Closing history view...');
  
  if (elements.historySection) {
    elements.historySection.style.display = 'none';
  }
  
  // Show analysis results if available
  if (currentAnalysis) {
    displayAnalysisResults(currentAnalysis);
  }
}

// Render history list
function renderHistoryList() {
  console.log('Q-SCI Debug Popup: Rendering history list...');
  
  if (!elements.historyList) {
    console.error('Q-SCI Debug Popup: History list element not found');
    return;
  }
  
  const emptyText = window.QSCIi18n ? window.QSCIi18n.t('history.empty') : 'No analysis history yet.';
  
  if (analysisHistory.length === 0) {
    elements.historyList.innerHTML = `
      <div style="font-size: 12px; color: #6b7280; text-align: center; padding: 20px;">${emptyText}</div>
    `;
    return;
  }
  
  const viewText = window.QSCIi18n ? window.QSCIi18n.t('history.viewAnalysis') : 'View';
  const deleteText = window.QSCIi18n ? window.QSCIi18n.t('history.deleteAnalysis') : 'Delete';
  
  let html = '';
  
  analysisHistory.forEach(item => {
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const title = item.pageTitle || item.analysis.journal_name || 'Unknown Paper';
    const quality = item.analysis.quality_percentage || 0;
    const trafficLight = item.analysis.traffic_light || 'Unknown';
    
    // Determine color based on traffic light
    let colorClass = 'gray';
    if (trafficLight === 'green') colorClass = 'green';
    else if (trafficLight === 'yellow') colorClass = 'yellow';
    else if (trafficLight === 'red') colorClass = 'red';
    
    html += `
      <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 8px; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 13px; color: #374151; margin-bottom: 4px; line-height: 1.4;">${escapeHtml(title)}</div>
            <div style="font-size: 11px; color: #6b7280;">${dateStr} ${timeStr}</div>
          </div>
          <div style="text-align: right; margin-left: 8px;">
            <div style="font-size: 14px; font-weight: 700; color: ${getTrafficLightColor(trafficLight)};">${quality}%</div>
            <div style="font-size: 10px; color: #6b7280;">${trafficLight}</div>
          </div>
        </div>
        ${item.pageUrl ? `<div style="font-size: 11px; color: #9ca3af; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.pageUrl)}</div>` : ''}
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-primary" onclick="loadHistoryItem(${item.id})" style="flex: 1; padding: 6px 12px; font-size: 12px;">${viewText}</button>
          <button class="btn btn-secondary" onclick="deleteHistoryItem(${item.id})" style="padding: 6px 12px; font-size: 12px;">🗑️ ${deleteText}</button>
        </div>
      </div>
    `;
  });
  
  elements.historyList.innerHTML = html;
}

// Show indicator that current analysis is from history
function showHistoryIndicator(item) {
  console.log('Q-SCI Debug Popup: Showing history indicator...');
  
  const loadedText = window.QSCIi18n ? window.QSCIi18n.t('history.loadedFrom') : 'Loaded from history';
  const returnText = window.QSCIi18n ? window.QSCIi18n.t('history.returnToCurrent') : '← Return to Current Page';
  
  // Add an indicator banner at the top of the stats section
  if (elements.statsSection) {
    // Remove existing indicator if any
    const existingIndicator = document.getElementById('history-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    const indicator = document.createElement('div');
    indicator.id = 'history-indicator';
    indicator.style.cssText = 'background: #fef3c7; border: 1px solid #fbbf24; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; font-size: 12px; color: #92400e;';
    
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    indicator.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>📚 ${loadedText} (${dateStr} ${timeStr})</span>
        <button class="btn btn-secondary" onclick="returnToCurrentPage()" style="padding: 4px 8px; font-size: 11px; margin-left: 8px;">${returnText}</button>
      </div>
    `;
    
    elements.statsSection.insertBefore(indicator, elements.statsSection.firstChild);
  }
}

// Return to current page analysis
async function returnToCurrentPage() {
  console.log('Q-SCI Debug Popup: Returning to current page...');
  
  // Clear selected history item
  selectedHistoryItem = null;
  
  // Remove indicator
  const indicator = document.getElementById('history-indicator');
  if (indicator) {
    indicator.remove();
  }
  
  // Reload saved analysis
  await loadSavedAnalysis();
}

// Helper function to get traffic light color
function getTrafficLightColor(trafficLight) {
  switch(trafficLight) {
    case 'green': return '#059669';
    case 'yellow': return '#d97706';
    case 'red': return '#dc2626';
    default: return '#6b7280';
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Chat functionality
let chatHistory = [];

// Chat configuration constants
const CHAT_MAX_TOKENS = 500;
const CHAT_TEMPERATURE = 0.7;
const CHAT_HISTORY_LIMIT = 10; // Keep last 5 exchanges (10 messages)
const CHAT_FALLBACK_MODEL = 'gpt-4o-mini'; // Fallback if window.QSCI_MODEL_NAME not available

// Handle sending a chat message
async function handleChatSend() {
  console.log('Q-SCI Debug Popup: Handling chat send...');
  
  if (!elements.chatInput || !elements.chatMessages) {
    console.error('Q-SCI Debug Popup: Chat elements not found');
    return;
  }
  
  const userMessage = elements.chatInput.value.trim();
  if (!userMessage) {
    console.log('Q-SCI Debug Popup: Empty message, ignoring');
    return;
  }
  
  // Check if user is logged in by querying actual auth state
  // This prevents false "Please login" errors when popup reopens
  const isLoggedIn = await window.QSCIAuth.isLoggedIn();
  if (!isLoggedIn) {
    const loginMsg = window.QSCIi18n ? window.QSCIi18n.t('chat.loginRequired') : 'Please login to use the chat feature.';
    showError(loginMsg);
    return;
  }
  
  // Get current user from storage if not already set
  if (!currentUser) {
    currentUser = await window.QSCIAuth.getCurrentUser();
  }
  
  // Check if analysis exists
  if (!currentAnalysis) {
    const analysisMsg = window.QSCIi18n ? window.QSCIi18n.t('chat.analyzeFirst') : 'Please analyze a paper first before asking questions.';
    showError(analysisMsg);
    return;
  }
  
  // Check usage limits before sending chat message (chat questions count as analyses)
  try {
    const usageCheck = await window.QSCIUsage.canAnalyze(currentUser.subscriptionStatus);
    console.log('Q-SCI Debug Popup: Chat usage check:', usageCheck);
    
    if (!usageCheck.canAnalyze) {
      const limitMsg = window.QSCIi18n 
        ? window.QSCIi18n.t('message.dailyLimitReached')
        : `Daily analysis limit reached (${usageCheck.limit}). Please upgrade to Premium for more analyses.`;
      showError(limitMsg);
      return;
    }
  } catch (error) {
    console.error('Q-SCI Debug Popup: Error checking usage limits:', error);
    showError('Could not verify usage limits. Please try again.');
    return;
  }
  
  // Clear input
  elements.chatInput.value = '';
  
  // Add user message to chat
  addChatMessage('user', userMessage);
  
  // Disable send button and show loading
  if (elements.chatSendBtn) {
    elements.chatSendBtn.disabled = true;
    elements.chatSendBtn.textContent = '...';
  }
  
  try {
    // Get the paper context if not already set
    if (!paperContextForChat && currentTab && currentTab.url) {
      // Try to get paper content from the last analyzed page
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          function: extractPageContent
        });
        
        if (results && results[0] && results[0].result) {
          const pageData = results[0].result;
          paperContextForChat = {
            title: pageData.title || 'Unknown Title',
            text: pageData.text || '',
            url: currentTab.url
          };
        }
      } catch (error) {
        console.warn('Q-SCI Debug Popup: Could not extract paper context:', error);
      }
    }
    
    // Build chat messages for OpenAI
    const messages = buildChatMessages(userMessage);
    
    // Get OpenAI API key
    // Note: This may refresh the auth token internally if it has expired
    const apiKey = await window.QSCIAuth.getOpenAIApiKey();
    
    if (!apiKey) {
      throw new Error('Failed to retrieve API key from backend.');
    }
    
    // Refresh currentUser after getOpenAIApiKey() in case auth was refreshed
    // This ensures subsequent chat calls have up-to-date auth data
    currentUser = await window.QSCIAuth.getCurrentUser();
    if (!currentUser) {
      throw new Error('Your session has expired. Please login again.');
    }
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: window.QSCI_MODEL_NAME || CHAT_FALLBACK_MODEL,
        messages: messages,
        temperature: CHAT_TEMPERATURE,
        max_tokens: CHAT_MAX_TOKENS
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const json = await response.json();
    const aiResponse = json?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    // Add AI response to chat
    addChatMessage('ai', aiResponse);
    
    // Add to chat history for context
    chatHistory.push({ role: 'user', content: userMessage });
    chatHistory.push({ role: 'assistant', content: aiResponse });
    
    // Increment usage after successful chat response (chat questions count as 0.2 analyses)
    try {
      console.log('Q-SCI Debug Popup: Incrementing usage counter for chat question (0.2)...');
      await window.QSCIUsage.incrementUsage(0.2);
      await updateUsageDisplay();
      console.log('Q-SCI Debug Popup: Usage incremented successfully for chat');
    } catch (usageError) {
      console.error('Q-SCI Debug Popup: Failed to increment usage for chat:', usageError);
      // Don't throw here, as the chat response was successful
    }
    
  } catch (error) {
    console.error('Q-SCI Debug Popup: Chat error:', error);
    addChatMessage('error', 'Error: ' + error.message);
    
    // If session expired, update UI to show login form
    // Check for various session expiration error messages
    const sessionExpiredPhrases = ['session has expired', 'session expired', 'please login'];
    const isSessionExpired = error.message && sessionExpiredPhrases.some(phrase => 
      error.message.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (isSessionExpired) {
      console.log('Q-SCI Debug Popup: Session expired, updating UI to show login form');
      currentUser = null;
      showLoginForm();
    }
  } finally {
    // Re-enable send button
    if (elements.chatSendBtn) {
      elements.chatSendBtn.disabled = false;
      const sendText = window.QSCIi18n ? window.QSCIi18n.t('detailed.send') : 'Send';
      elements.chatSendBtn.textContent = sendText;
    }
  }
}

// Build chat messages for OpenAI API
function buildChatMessages(userMessage) {
  const systemPrompt = `You are Q-SCI, an expert assistant helping users understand scientific publications. 
You have access to the analysis results of a paper and can answer questions about it.
Be concise, clear, and helpful in your responses. Base your answers on the paper's content and analysis.`;

  const messages = [{ role: 'system', content: systemPrompt }];
  
  // Add paper context if available
  if (paperContextForChat) {
    const contextMessage = `Paper Title: ${paperContextForChat.title}\n` +
      `URL: ${paperContextForChat.url}\n\n` +
      `Analysis Summary:\n` +
      `Quality Score: ${currentAnalysis.quality_percentage}%\n` +
      `Assessment: ${currentAnalysis.traffic_light}\n` +
      `Reasoning: ${currentAnalysis.reasoning || 'N/A'}\n\n`;
    
    messages.push({ role: 'system', content: contextMessage });
  }
  
  // Add chat history for context (last 5 exchanges = 10 messages)
  const recentHistory = chatHistory.slice(-CHAT_HISTORY_LIMIT);
  messages.push(...recentHistory);
  
  // Add current user message
  messages.push({ role: 'user', content: userMessage });
  
  return messages;
}

// Add a message to the chat display
function addChatMessage(type, message) {
  if (!elements.chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.style.marginBottom = '12px';
  messageDiv.style.padding = '10px';
  messageDiv.style.borderRadius = '6px';
  messageDiv.style.fontSize = '13px';
  messageDiv.style.lineHeight = '1.6';
  
  if (type === 'user') {
    messageDiv.style.background = '#e0e7ff';
    messageDiv.style.color = '#3730a3';
    messageDiv.style.textAlign = 'right';
    const youLabel = window.QSCIi18n ? window.QSCIi18n.t('chat.you') : 'Sie';
    messageDiv.innerHTML = `<strong>${youLabel}:</strong> ${escapeHtml(message)}`;
  } else if (type === 'ai') {
    messageDiv.style.background = '#f0f9ff';
    messageDiv.style.color = '#0c4a6e';
    messageDiv.innerHTML = `<strong>Q-SCI:</strong> ${escapeHtml(message)}`;
  } else if (type === 'error') {
    messageDiv.style.background = '#fee2e2';
    messageDiv.style.color = '#991b1b';
    messageDiv.innerHTML = `<strong>Error:</strong> ${escapeHtml(message)}`;
  }
  
  elements.chatMessages.appendChild(messageDiv);
  
  // Scroll to bottom
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}


console.log('Q-SCI Debug Popup: Script initialization complete');

