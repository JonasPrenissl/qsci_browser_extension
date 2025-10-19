// Example Clerk Configuration
// Copy this file and update with your actual Clerk credentials

// STEP 1: Get these values from your Clerk Dashboard
// Go to: https://dashboard.clerk.com > Your App > API Keys

const CLERK_CONFIG = {
  // Your Clerk Publishable Key
  // Example: 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k'
  publishableKey: 'pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA',
  
  // Your Clerk Frontend API URL
  // Example: 'clerk.your-app-name.12345.lcl.dev'
  // or: 'your-app-name.clerk.accounts.dev'
  frontendApi: '[your-clerk-frontend-api]',
  
  // Full Clerk JS SDK URL (constructed from frontendApi)
  // Example: 'https://clerk.your-app-name.12345.lcl.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js'
  sdkUrl: 'https://[your-clerk-frontend-api].clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js'
};

// STEP 2: Update clerk-auth.html with these values
// 
// Find and replace in clerk-auth.html:
// 
// Line ~102 (in <script> tag):
//   data-clerk-publishable-key="pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA"
//   src="https://[your-clerk-frontend-api].clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
// 
// Replace with:
//   data-clerk-publishable-key="YOUR_ACTUAL_KEY_HERE"
//   src="YOUR_ACTUAL_SDK_URL_HERE"
// 
// Line ~114 (in JavaScript):
//   const clerk = new Clerk('pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA');
// 
// Replace with:
//   const clerk = new Clerk('YOUR_ACTUAL_KEY_HERE');

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
// 1. Load extension in Chrome (chrome://extensions)
// 2. Click extension icon
// 3. Click "Login with Clerk"
// 4. Complete authentication
// 5. Verify you're logged in

// For more detailed instructions, see CLERK_SETUP.md
