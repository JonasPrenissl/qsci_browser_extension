// Q-SCI Browser Extension - Simplified Background Script
console.log('Q-SCI Background: Service worker started');

// Simple background script that doesn't interfere with popup's direct API calls
chrome.runtime.onInstalled.addListener(() => {
  console.log('Q-SCI Background: Extension installed');
});

// Handle any messages (but popup will make direct API calls)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Q-SCI Background: Received message:', message.type);
  
  // Just acknowledge the message but don't process it
  // The popup will handle API calls directly
  sendResponse({ acknowledged: true });
  
  return true; // Keep message channel open
});

console.log('Q-SCI Background: Service worker initialized');

