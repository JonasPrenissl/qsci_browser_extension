// Q-SCI Browser Extension - Background Service Worker
// This is a Manifest V3 service worker that handles extension lifecycle events
// and performs analysis in the background to continue even when popup is closed
'use strict';

// Dev reload (development only) - loads from local dev server when running
if (typeof importScripts === "function") {
  try { importScripts("http://localhost:35729/dev-reload.js"); } catch (e) {}
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

// Storage keys for analysis state
const ANALYSIS_STATE_KEY = 'qsci_current_analysis_state';

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
    // Update state to 'running'
    await updateAnalysisState({
      status: 'running',
      progress: 10,
      message: 'Analyzing paper...',
      startTime: Date.now()
    });
    
    // Check if qsciEvaluatePaper is available
    if (typeof qsciEvaluatePaper === 'undefined') {
      throw new Error('qsciEvaluatePaper function is not available in background worker');
    }
    
    console.log('Q-SCI Background: Calling qsciEvaluatePaper...');
    await updateAnalysisState({
      status: 'running',
      progress: 30,
      message: 'Sending to AI for analysis...'
    });
    
    // Perform the evaluation - this can take time but will continue even if popup closes
    const evaluation = await qsciEvaluatePaper(
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
    
    // Store the completed analysis
    const completeState = {
      status: 'complete',
      progress: 100,
      message: 'Analysis complete!',
      result: evaluation,
      sourceType: data.sourceType,
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

