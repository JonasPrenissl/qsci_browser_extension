// Clerk Configuration
// This file contains the Clerk publishable key for authentication
// 
// IMPORTANT: For production deployment
// - Development keys start with: pk_test_
// - Production keys start with: pk_live_
// - ALWAYS use production keys (pk_live_) for production deployments
// - Development keys have strict usage limits and should ONLY be used for testing
//
// To update this configuration:
// 1. Get your Clerk Publishable Key from: https://dashboard.clerk.com > Your App > API Keys
// 2. Replace the publishableKey value below with your actual key
// 3. Run: npm run build
// 4. Reload the extension in Chrome

const CLERK_CONFIG = {
  // Your Clerk Publishable Key
  // This is a default test key - replace with your actual key for production
  // Development example: 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k'
  // Production example: 'pk_live_Y2xlcmsuZXhhbXBsZS5jb20k'
  publishableKey: 'pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA',
};

// Export for use in other modules (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CLERK_CONFIG;
}

// Also make available as global variable for direct script includes
if (typeof window !== 'undefined') {
  window.CLERK_CONFIG = CLERK_CONFIG;
}
