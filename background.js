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
    // Silently ignore - dev server not running
  };
} catch (e) {
  // Silently ignore - WebSocket not available or connection failed
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
const API_BASE_URL = 'https://www.q-sci.org/api';
const LANGUAGE_KEY = 'qsci_language';
const DEFAULT_LANGUAGE = 'de'; // Default to German, can be overridden by user preference

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

console.log('Q-SCI Background: Service worker initialized successfully');

