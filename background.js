// Q-SCI Browser Extension - Background Service Worker
// This is a Manifest V3 service worker that handles extension lifecycle events
// and performs analysis in the background to continue even when popup is closed
'use strict';

// Dev reload (development only) - embedded directly to avoid CSP violations
// This connects to the local dev server's WebSocket to reload the extension on changes
try {
  // Only attempt WebSocket connection in development (when localhost is accessible)
  const ws = new WebSocket("ws://localhost:35729");
  ws.onmessage = (e) => {
    if (e.data === "reload-extension") {
      console.log('Q-SCI Background: Reloading extension due to file change...');
      chrome.runtime.reload();
    }
  };
  ws.onerror = () => {
    // Silently ignore - dev server not running (no console output to reduce noise)
  };
  ws.onclose = () => {
    // Silently ignore - dev server stopped (no console output to reduce noise)
  };
} catch (e) {
  // Silently ignore - WebSocket not available or connection failed (no console output to reduce noise)
}

console.log('Q-SCI Background: Service worker starting...');

// Import required scripts for analysis
// Note: These must be loaded in the service worker context
if (typeof importScripts === "function") {
  try {
    importScripts('qsci_evaluator.js');
    console.log('Q-SCI Background: qsci_evaluator.js loaded');
  } catch (e) {
    console.error('Q-SCI Background: Failed to load qsci_evaluator.js:', e);
  }
}

// Storage keys for analysis state and auth
const ANALYSIS_STATE_KEY = 'qsci_current_analysis_state';
const AUTH_TOKEN_KEY = 'qsci_auth_token';
const TOKEN_TIMESTAMP_KEY = 'qsci_auth_token_timestamp';
const API_BASE_URL = 'https://www.q-sci.org/api';
const LANGUAGE_KEY = 'qsci_language';
const DEFAULT_LANGUAGE = 'de'; // Default to German, can be overridden by user preference

// Token refresh settings
const TOKEN_REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const TOKEN_MAX_AGE = 23 * 60 * 60 * 1000; // 23 hours - refresh before 24h expiry

// Helper function to get user's preferred language from storage
async function getUserLanguage() {
  return new Promise((resolve) => {
    chrome.storage.local.get([LANGUAGE_KEY], (result) => {
      resolve(result[LANGUAGE_KEY] || DEFAULT_LANGUAGE);
    });
  });
}

// Helper function to get auth token from storage
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get([AUTH_TOKEN_KEY], (result) => {
      resolve(result[AUTH_TOKEN_KEY] || null);
    });
  });
}

// Helper function to fetch OpenAI API key from backend
async function getOpenAIApiKey() {
  console.log('Q-SCI Background: Fetching OpenAI API key...');
  
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login first.');
  }
  
  const response = await fetch(`${API_BASE_URL}/extension-auth?operation=openai-key`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Q-SCI Background: Failed to fetch API key:', response.status, errorText);
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Your session may have expired. Please log in again.');
    } else if (response.status === 404) {
      throw new Error('Backend endpoint not found. Please ensure the backend is properly configured.');
    } else if (response.status === 500) {
      throw new Error('Backend server error. Please try again later.');
    } else {
      throw new Error(`Backend returned error ${response.status}. Please try again.`);
    }
  }
  
  const data = await response.json();
  if (!data.api_key) {
    throw new Error('Backend did not return an API key.');
  }
  
  console.log('Q-SCI Background: API key fetched successfully');
  return data.api_key;
}

/**
 * Download a PDF from a URL and return it as an ArrayBuffer
 * This runs in the background service worker, which has broader permissions than extension pages
 * @param {string} pdfUrl - URL of the PDF to download
 * @returns {Promise<ArrayBuffer>} - Promise that resolves to the PDF data
 */
async function downloadPDFInBackground(pdfUrl) {
  console.log('Q-SCI Background: Downloading PDF from:', pdfUrl);

  // Skip file:// URLs as they violate CSP and cannot be fetched
  if (pdfUrl.startsWith('file://')) {
    console.warn('Q-SCI Background: Skipping file:// URL (not supported):', pdfUrl);
    throw new Error('Local file URLs (file://) are not supported for security reasons');
  }

  try {
    const response = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log('Q-SCI Background: Content-Type:', contentType);

    // Check if the response is actually a PDF
    if (contentType && !contentType.includes('application/pdf') && !contentType.includes('application/octet-stream')) {
      console.warn('Q-SCI Background: Response is not a PDF (Content-Type:', contentType + ')');
      // Still try to parse it as it might be a PDF despite incorrect content-type
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('Q-SCI Background: PDF downloaded successfully, size:', arrayBuffer.byteLength, 'bytes');

    return arrayBuffer;
  } catch (error) {
    console.error('Q-SCI Background: Error downloading PDF:', error);
    throw new Error(`Failed to download PDF: ${error.message}`);
  }
}

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Q-SCI Background: Extension installed/updated, reason:', details.reason);
  
  // Initialize default settings if needed
  if (details.reason === 'install') {
    console.log('Q-SCI Background: First time installation');
  } else if (details.reason === 'update') {
    console.log('Q-SCI Background: Extension updated');
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Q-SCI Background: Received message:', message?.type || 'unknown');
  
  // Handle START_ANALYSIS message
  if (message.type === 'START_ANALYSIS') {
    console.log('Q-SCI Background: Starting analysis in background...');
    handleStartAnalysis(message.data).then(result => {
      sendResponse({ success: true, result: result });
    }).catch(error => {
      console.error('Q-SCI Background: Analysis error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  // Handle GET_ANALYSIS_STATE message
  if (message.type === 'GET_ANALYSIS_STATE') {
    chrome.storage.local.get([ANALYSIS_STATE_KEY], (result) => {
      sendResponse({ success: true, state: result[ANALYSIS_STATE_KEY] || null });
    });
    return true; // Keep message channel open for async response
  }
  
  // Handle CLEAR_ANALYSIS_STATE message
  if (message.type === 'CLEAR_ANALYSIS_STATE') {
    chrome.storage.local.remove([ANALYSIS_STATE_KEY], () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  // Handle DOWNLOAD_PDF message
  if (message.type === 'DOWNLOAD_PDF') {
    console.log('Q-SCI Background: Downloading PDF:', message.url);
    downloadPDFInBackground(message.url).then(arrayBuffer => {
      // Convert ArrayBuffer to base64 for message passing
      const bytes = new Uint8Array(arrayBuffer);
      // Use Array.from with map for better performance than reduce with string concatenation
      const binary = String.fromCharCode.apply(null, Array.from(bytes));
      const base64 = btoa(binary);
      sendResponse({ success: true, data: base64, size: arrayBuffer.byteLength });
    }).catch(error => {
      console.error('Q-SCI Background: PDF download error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  // Acknowledge other messages
  sendResponse({ 
    acknowledged: true,
    timestamp: Date.now()
  });
  
  return true; // Keep message channel open for async operations
});

// Handle analysis in the background
async function handleStartAnalysis(data) {
  console.log('Q-SCI Background: handleStartAnalysis called with data:', {
    hasText: !!data.text,
    textLength: data.text ? data.text.length : 0,
    title: data.title,
    sourceUrl: data.sourceUrl,
    sourceType: data.sourceType
  });
  
  try {
    // Capture the analyzed URL at analysis start to prevent confusion if user switches tabs
    const analyzedUrl = data.sourceUrl;
    const analyzedTitle = data.title;
    
    // Update state to 'running' with locked URL
    await updateAnalysisState({
      status: 'running',
      progress: 10,
      message: 'Preparing analysis...',
      startTime: Date.now(),
      sourceUrl: analyzedUrl,
      title: analyzedTitle
    });
    
    // Check if qsciEvaluatePaper is available in service worker context
    // Note: The evaluator exposes the function to both window and self contexts,
    // but in service worker context, only self.qsciEvaluatePaper is available (window doesn't exist)
    if (typeof self.qsciEvaluatePaper === 'undefined') {
      throw new Error('qsciEvaluatePaper function is not available in background worker');
    }
    
    console.log('Q-SCI Background: Fetching API key...');
    await updateAnalysisState({
      status: 'running',
      progress: 20,
      message: 'Authenticating...'
    });
    
    // Fetch API key (needed for evaluation)
    const apiKey = await getOpenAIApiKey();
    
    // Get user's preferred language
    const userLanguage = await getUserLanguage();
    console.log('Q-SCI Background: Using language:', userLanguage);
    
    // Store API key temporarily in a way the evaluator can access it
    // The evaluator will try to call QSCIAuth.getOpenAIApiKey(), but in service worker
    // we need to provide it differently. We'll inject it into the evaluator's context
    // by creating a mock QSCIAuth object
    self.QSCIAuth = {
      getOpenAIApiKey: async () => apiKey
    };
    // Also mock i18n for language support
    self.QSCIi18n = {
      getLanguage: () => userLanguage
    };
    
    console.log('Q-SCI Background: Calling evaluator...');
    await updateAnalysisState({
      status: 'running',
      progress: 30,
      message: 'Sending to AI for analysis...'
    });
    
    // Perform the evaluation - this can take time but will continue even if popup closes
    // Use self.qsciEvaluatePaper in service worker context
    const evaluation = await self.qsciEvaluatePaper(
      data.text,
      data.title,
      data.sourceUrl
    );
    
    console.log('Q-SCI Background: Evaluation completed:', {
      quality: evaluation?.quality_percentage,
      trafficLight: evaluation?.traffic_light
    });
    
    await updateAnalysisState({
      status: 'running',
      progress: 90,
      message: 'Processing results...'
    });
    
    // Store the completed analysis with locked URL
    const completeState = {
      status: 'complete',
      progress: 100,
      message: 'Analysis complete!',
      result: evaluation,
      sourceType: data.sourceType,
      sourceUrl: data.sourceUrl,
      title: data.title,
      pdfUrl: data.pdfUrl || null,
      completedTime: Date.now()
    };
    
    await updateAnalysisState(completeState);
    
    // Notify popup that analysis is complete (if popup is open)
    try {
      chrome.runtime.sendMessage({
        type: 'ANALYSIS_COMPLETE',
        result: evaluation
      });
    } catch (e) {
      // Popup might be closed, that's OK
      console.log('Q-SCI Background: Could not notify popup (might be closed)');
    }
    
    console.log('Q-SCI Background: Analysis complete and stored');
    return evaluation;
    
  } catch (error) {
    console.error('Q-SCI Background: Analysis failed:', error);
    
    // Store error state
    await updateAnalysisState({
      status: 'error',
      progress: 0,
      message: error.message || 'Analysis failed',
      error: error.message,
      errorTime: Date.now()
    });
    
    // Notify popup of error (if open)
    try {
      chrome.runtime.sendMessage({
        type: 'ANALYSIS_ERROR',
        error: error.message
      });
    } catch (e) {
      // Popup might be closed
      console.log('Q-SCI Background: Could not notify popup of error (might be closed)');
    }
    
    throw error;
  }
}

// Update analysis state in storage
async function updateAnalysisState(state) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [ANALYSIS_STATE_KEY]: state
    }, () => {
      console.log('Q-SCI Background: Analysis state updated:', state.status, state.message);
      resolve();
    });
  });
}

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('Q-SCI Background: Service worker activated');
});

// ========================================
// Token Refresh Management
// ========================================

/**
 * Check if the stored token needs refreshing based on its age
 * @returns {Promise<boolean>} True if token needs refresh
 */
async function shouldRefreshToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get([AUTH_TOKEN_KEY, TOKEN_TIMESTAMP_KEY], (result) => {
      const token = result[AUTH_TOKEN_KEY];
      const timestamp = result[TOKEN_TIMESTAMP_KEY];
      
      if (!token) {
        resolve(false); // No token to refresh
        return;
      }
      
      if (!timestamp) {
        resolve(true); // Token exists but no timestamp - should refresh
        return;
      }
      
      const tokenAge = Date.now() - timestamp;
      const needsRefresh = tokenAge >= TOKEN_MAX_AGE;
      
      if (needsRefresh) {
        console.log('Q-SCI Background: Token age:', Math.round(tokenAge / (60 * 60 * 1000)), 'hours - needs refresh');
      }
      
      resolve(needsRefresh);
    });
  });
}

/**
 * Periodic token refresh check
 * Called by alarm every 12 hours
 * 
 * Note: This currently only logs token age for monitoring.
 * Actual token refresh requires the user to log in again or 
 * for the backend to support token renewal.
 * 
 * The primary solution for session persistence is to configure
 * Clerk Dashboard with longer session lifetimes (24+ hours).
 * See SESSION_PERSISTENCE_CONFIGURATION.md for details.
 */
async function checkAndRefreshToken() {
  try {
    const shouldRefresh = await shouldRefreshToken();
    
    if (shouldRefresh) {
      console.log('Q-SCI Background: Token is older than 23 hours');
      console.log('Q-SCI Background: User may need to log in again soon');
      console.log('Q-SCI Background: Configure Clerk Dashboard with longer session lifetime to prevent this');
      console.log('Q-SCI Background: See SESSION_PERSISTENCE_CONFIGURATION.md');
    } else {
      console.log('Q-SCI Background: Token is still fresh');
    }
  } catch (error) {
    console.error('Q-SCI Background: Error in token refresh check:', error);
  }
}

// Set up periodic token refresh alarm
// This monitors token age and logs warnings when tokens are old
chrome.alarms.create('tokenRefresh', {
  periodInMinutes: TOKEN_REFRESH_INTERVAL / (60 * 1000) // Convert ms to minutes (720 minutes = 12 hours)
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tokenRefresh') {
    console.log('Q-SCI Background: Token refresh alarm triggered');
    checkAndRefreshToken();
  }
});

// Check token on service worker startup
checkAndRefreshToken().catch(err => {
  console.error('Q-SCI Background: Initial token check failed:', err);
});

console.log('Q-SCI Background: Service worker initialized successfully with token monitoring support');

