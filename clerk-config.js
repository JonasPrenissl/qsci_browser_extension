// Example Clerk Configuration
// Copy this file to 'clerk-config.js' and update with your actual Clerk credentials
// 
// COMMAND: cp clerk-config.example.js clerk-config.js
// Then edit clerk-config.js with your actual key

// STEP 1: Get your Clerk Publishable Key
// Go to: https://dashboard.clerk.com > Your App > API Keys

// IMPORTANT: For production deployment
// - Development keys start with: pk_test_
// - Production keys start with: pk_live_
// - ALWAYS use production keys (pk_live_) for production deployments
// - Development keys have strict usage limits and should ONLY be used for testing

const CLERK_CONFIG = {
  // Clerk Publishable Key
  // For local testing with mock backend: use test key below
  // For production: Replace with your production key from https://dashboard.clerk.com
  // Development keys start with: pk_test_
  // Production keys start with: pk_live_
  publishableKey: 'pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA',
};

// STEP 2: After updating clerk-config.js, rebuild the extension
// 
// Run: npm run build
// 
// This will bundle your Clerk configuration into the extension

// STEP 3: Set up user metadata in Clerk
// 
// In Clerk Dashboard > Users > Select User > Public Metadata
// Add this JSON:
// {
//   "subscription_status": "free"
// }
// or
// {
//   "subscription_status": "subscribed"
// }

// STEP 4: Test the integration
// 
// 1. Ensure clerk-config.js has your actual key
// 2. Run: npm run build
// 3. Load extension in Chrome (chrome://extensions)
// 4. Click extension icon
// 5. Click "Login with Clerk"
// 6. Complete authentication
// 7. Verify you're logged in and no warnings appear in console

// For more detailed instructions, see CLERK_SETUP.md

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CLERK_CONFIG;
}

// Also make available as global variable for direct script includes
if (typeof window !== 'undefined') {
  window.CLERK_CONFIG = CLERK_CONFIG;
}
