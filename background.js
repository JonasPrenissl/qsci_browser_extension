// Q-SCI Browser Extension - Background Service Worker
// This is a Manifest V3 service worker that handles extension lifecycle events
'use strict';

console.log('Q-SCI Background: Service worker starting...');

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
  
  // Acknowledge the message
  // The popup handles most functionality directly, so we just acknowledge
  sendResponse({ 
    acknowledged: true,
    timestamp: Date.now()
  });
  
  return true; // Keep message channel open for async operations
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('Q-SCI Background: Service worker activated');
});

console.log('Q-SCI Background: Service worker initialized successfully');

