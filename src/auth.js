// Q-SCI Clerk Authentication Module
// Handles Clerk authentication initialization and user sign-in flow

import { Clerk } from '@clerk/clerk-js';
import CLERK_CONFIG from '../clerk-config.js';

console.log('Q-SCI Clerk Auth: Module loaded');
console.log('Q-SCI Clerk Auth: CLERK_CONFIG:', CLERK_CONFIG);
console.log('Q-SCI Clerk Auth: CLERK_CONFIG type:', typeof CLERK_CONFIG);
console.log('Q-SCI Clerk Auth: CLERK_CONFIG.publishableKey:', CLERK_CONFIG ? CLERK_CONFIG.publishableKey : 'undefined');

// Constants
// Extra defensive check: if CLERK_CONFIG is null/undefined, try to access it from window
let clerkConfig = CLERK_CONFIG;
if (!clerkConfig && typeof window !== 'undefined' && window.CLERK_CONFIG) {
  console.log('Q-SCI Clerk Auth: Using CLERK_CONFIG from window object');
  clerkConfig = window.CLERK_CONFIG;
}

const CLERK_PUBLISHABLE_KEY = clerkConfig ? clerkConfig.publishableKey : undefined;
console.log('Q-SCI Clerk Auth: CLERK_PUBLISHABLE_KEY extracted:', CLERK_PUBLISHABLE_KEY ? 'YES' : 'NO');
const SUCCESS_CLOSE_MESSAGE = 'Success! Closing window...';
const WINDOW_CLOSE_DELAY_MS = 1500;
// Valid HTTPS URL to satisfy Clerk's redirect URL validation
// (actual authentication uses postMessage, so redirect is never followed)
const AUTH_CALLBACK_URL = 'https://www.q-sci.org/auth-callback';

// Initialize i18n when DOM is ready
let currentLanguage = 'de';

async function initializeI18n() {
  if (window.QSCIi18n) {
    await window.QSCIi18n.init();
    currentLanguage = window.QSCIi18n.getLanguage();
    document.documentElement.lang = currentLanguage;
    window.QSCIi18n.translatePage();
    
    // Set language selector
    const langSelector = document.getElementById('language-selector');
    if (langSelector) {
      langSelector.value = currentLanguage;
      langSelector.addEventListener('change', async function(e) {
        await window.QSCIi18n.setLanguage(e.target.value);
        currentLanguage = e.target.value;
        document.documentElement.lang = currentLanguage;
        window.QSCIi18n.translatePage();
      });
    }
  }
}

// Function to wait for Clerk to be available
function waitForClerk(clerk, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkClerk = () => {
      if (clerk) {
        console.log('Q-SCI Clerk Auth: Clerk SDK loaded successfully');
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for Clerk SDK to load'));
      } else {
        setTimeout(checkClerk, 100);
      }
    };
    
    checkClerk();
  });
}

// Initialize Clerk authentication
async function initializeClerk() {
  try {
    console.log('Q-SCI Clerk Auth: Initializing Clerk...');
    
    // Check if Clerk SDK was loaded
    if (typeof Clerk === 'undefined') {
      const errorMsg = 'Clerk SDK not loaded. Please check your internet connection and try again.';
      console.error('Q-SCI Clerk Auth:', errorMsg);
      showError(errorMsg);
      return;
    }
    console.log('Q-SCI Clerk Auth: Clerk SDK loaded successfully');
    
    // Validate Clerk publishable key
    if (!CLERK_PUBLISHABLE_KEY || 
        CLERK_PUBLISHABLE_KEY === 'YOUR_CLERK_PUBLISHABLE_KEY_HERE' ||
        CLERK_PUBLISHABLE_KEY.trim() === '') {
      const errorMsg = window.QSCIi18n ? 
        window.QSCIi18n.t('clerkAuth.errorMissingKey') : 
        'Fehler beim Initialisieren der Authentifizierung: Clerk API-Schlüssel fehlt. Bitte kontaktieren Sie den Administrator.';
      console.error('Q-SCI Clerk Auth: Invalid or missing Clerk publishable key');
      console.error('Q-SCI Clerk Auth: CLERK_PUBLISHABLE_KEY value:', CLERK_PUBLISHABLE_KEY);
      showError(errorMsg);
      return;
    }
    
    console.log('Q-SCI Clerk Auth: Using publishable key:', CLERK_PUBLISHABLE_KEY.substring(0, 10) + '...');
    
    // Initialize Clerk with the publishable key
    console.log('Q-SCI Clerk Auth: Creating Clerk instance...');
    const clerk = new Clerk(CLERK_PUBLISHABLE_KEY);
    console.log('Q-SCI Clerk Auth: Clerk instance created successfully');
    
    /**
     * Load Clerk with redirect URL options to prevent "Invalid URL scheme" errors.
     * 
     * In browser extensions, window.location.href returns chrome-extension://... URLs,
     * which are not valid for OAuth providers (Apple, Google, etc.) that require
     * HTTPS/HTTP URLs. By setting these options, we ensure Clerk uses a valid HTTPS
     * callback URL for all OAuth flows.
     * 
     * Note: The actual authentication flow uses postMessage for communication between
     * the extension and auth window, so the redirect URL is never actually followed -
     * it only needs to pass OAuth provider validation.
     * 
     * We set both "fallback" and "force" variants to ensure comprehensive coverage:
     * - Fallback URLs are used when no other redirect URL is specified
     * - Force URLs override any other redirect URL settings
     * 
     * IMPORTANT: This is a main app configuration, NOT a satellite app.
     * We do NOT set isSatellite, domain, or proxyUrl as this extension is standalone.
     */
    console.log('Q-SCI Clerk Auth: Loading Clerk SDK...');
    await clerk.load({
      // Set all redirect URL variants to ensure OAuth callback works
      signInFallbackRedirectUrl: AUTH_CALLBACK_URL,
      signUpFallbackRedirectUrl: AUTH_CALLBACK_URL,
      signInForceRedirectUrl: AUTH_CALLBACK_URL,
      signUpForceRedirectUrl: AUTH_CALLBACK_URL,
      afterSignInUrl: AUTH_CALLBACK_URL,
      afterSignUpUrl: AUTH_CALLBACK_URL,
      // Additional redirect URL to handle OAuth callback scenarios
      redirectUrl: AUTH_CALLBACK_URL
    });

    console.log('Q-SCI Clerk Auth: Clerk initialized successfully');

    // Note: We intentionally do NOT check for existing sessions here.
    // The user should always be shown the sign-in component and must
    // complete the authentication flow explicitly in this popup window.
    // This prevents the issue where cached sessions trigger immediate
    // "Authentication Successful" messages without actual authentication.

    // Mount Clerk sign-in component
    const clerkContainer = document.getElementById('clerk-container');
    clerkContainer.innerHTML = ''; // Clear loading message

    // Mount the sign-in component
    console.log('Q-SCI Clerk Auth: Mounting sign-in component...');
    clerk.mountSignIn(clerkContainer, {
      // Use a valid HTTPS URL to avoid "Invalid URL scheme" error
      // Clerk defaults to window.location.href (chrome-extension://) when no redirect URL is specified
      // We use postMessage for auth, so the actual redirect is not used
      // 
      // IMPORTANT: Setting all redirect URL parameters is crucial for OAuth flows
      // (Google, Apple, etc.). When OAuth providers redirect back to Clerk's callback
      // page (clerk.shared.lcl.dev/v1/oauth_callback), Clerk needs a valid HTTPS
      // redirect URL to complete the flow.
      redirectUrl: AUTH_CALLBACK_URL,
      afterSignInUrl: AUTH_CALLBACK_URL,
      afterSignUpUrl: AUTH_CALLBACK_URL,
      // Force redirect URLs ensure OAuth callbacks use our HTTPS URL
      signInForceRedirectUrl: AUTH_CALLBACK_URL,
      signUpForceRedirectUrl: AUTH_CALLBACK_URL,
      // Fallback URLs as additional safety net
      signInFallbackRedirectUrl: AUTH_CALLBACK_URL,
      signUpFallbackRedirectUrl: AUTH_CALLBACK_URL,
      // Additional routing configuration to prevent chrome-extension:// URL usage
      routing: 'hash',
      // Explicitly tell Clerk this is embedded/popup context
      transferable: false,
      appearance: {
        elements: {
          rootBox: {
            width: '100%',
            margin: '0 auto'
          },
          card: {
            margin: '0 auto'
          }
        }
      }
    });

    console.log('Q-SCI Clerk Auth: Sign-in component mounted');

    // Listen for sign-in events using session polling
    console.log('Q-SCI Clerk Auth: Setting up session listeners...');
    
    // Track if we've seen a session to detect new sign-ins
    let hadSession = !!clerk.session;
    let hadUser = !!clerk.user;
    
    console.log('Q-SCI Clerk Auth: Initial state - session:', hadSession, 'user:', hadUser);
    
    // Use session polling to detect when user completes authentication
    let checkCount = 0;
    const maxChecks = 300; // 5 minutes with 1 second interval
    const sessionCheckInterval = setInterval(async () => {
      try {
        checkCount++;
        
        // Reload clerk state to ensure we have the latest session
        await clerk.load();
        
        const hasSession = !!clerk.session;
        const hasUser = !!clerk.user;
        
        // Log every 5 seconds for debugging
        if (checkCount % 5 === 0) {
          console.log(`Q-SCI Clerk Auth: Checking session... (attempt ${checkCount}/${maxChecks})`);
          console.log('Q-SCI Clerk Auth: Session exists:', hasSession, 'User exists:', hasUser);
        }
        
        // Only trigger success if we transition from no-session to session
        // This ensures we only respond to new authentications, not cached sessions
        if (hasSession && hasUser && (!hadSession || !hadUser)) {
          console.log('Q-SCI Clerk Auth: New authentication detected!');
          clearInterval(sessionCheckInterval);
          await handleSignInSuccess(clerk);
        } else if (checkCount >= maxChecks) {
          console.warn('Q-SCI Clerk Auth: Maximum check attempts reached');
          clearInterval(sessionCheckInterval);
          showError('Authentication timeout. Please try again.');
          
          // Show retry section
          const retrySection = document.getElementById('retry-section');
          if (retrySection) {
            retrySection.style.display = 'block';
          }
        }
        
        // Update tracking state
        hadSession = hasSession;
        hadUser = hasUser;
      } catch (error) {
        console.error('Q-SCI Clerk Auth: Error checking session:', error);
      }
    }, 1000);

  } catch (error) {
    console.error('Q-SCI Clerk Auth: Initialization error:', error);
    console.error('Q-SCI Clerk Auth: Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more specific error message if possible
    let errorMessage = window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.errorInit') : 'Failed to initialize authentication. Please try again.';
    
    // Add more context based on error type
    if (error.message) {
      errorMessage += ` (${error.message})`;
    }
    
    showError(errorMessage);
  }
}

// Handle successful sign-in
let isHandlingSignIn = false; // Prevent multiple calls
async function handleSignInSuccess(clerk) {
  if (isHandlingSignIn) {
    console.log('Q-SCI Clerk Auth: Already handling sign-in, skipping...');
    return;
  }
  
  isHandlingSignIn = true;
  
  try {
    console.log('Q-SCI Clerk Auth: Processing sign-in...');
    showSuccess(window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.authSuccess') : 'Authentication successful! Processing...');

    const user = clerk.user;
    const session = clerk.session;

    if (!user || !session) {
      throw new Error('No user or session found');
    }

    // Get the session token
    const token = await session.getToken();

    // Get user's email
    const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress;

    // Fetch actual subscription status from backend
    // The backend checks privateMetadata.stripe_customer_id to determine if user is subscribed
    // We cannot access privateMetadata from client-side, so we must query the backend
    let subscriptionStatus = 'free';
    try {
      const response = await fetch('https://www.q-sci.org/api/auth/subscription-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          subscriptionStatus = data.subscription_status || 'free';
          console.log('Q-SCI Clerk Auth: Fetched subscription status from backend:', subscriptionStatus);
        } else {
          console.warn('Q-SCI Clerk Auth: Backend returned non-JSON response, defaulting to free');
          console.warn('Q-SCI Clerk Auth: Content-Type:', contentType);
        }
      } else {
        console.warn('Q-SCI Clerk Auth: Failed to fetch subscription status (status:', response.status, '), defaulting to free');
      }
    } catch (error) {
      console.error('Q-SCI Clerk Auth: Error fetching subscription status:', error);
      console.log('Q-SCI Clerk Auth: Defaulting to free tier');
    }

    console.log('Q-SCI Clerk Auth: User data:', {
      email,
      subscriptionStatus,
      userId: user.id
    });

    // Prepare auth data to send back to extension
    const authData = {
      token: token,
      email: email,
      subscriptionStatus: subscriptionStatus,
      userId: user.id,
      clerkSessionId: session.id
    };

    // ALWAYS store auth data in chrome.storage first before closing window
    // This ensures data is persisted even if postMessage fails or is delayed
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      console.log('Q-SCI Clerk Auth: Saving auth data to chrome.storage...');
      try {
        await chrome.storage.local.set({
          'qsci_auth_token': authData.token,
          'qsci_user_email': authData.email,
          'qsci_subscription_status': authData.subscriptionStatus,
          'qsci_user_id': authData.userId,
          'qsci_clerk_session_id': authData.clerkSessionId
        });
        console.log('Q-SCI Clerk Auth: Auth data saved to chrome.storage successfully');
        
        // Verify the write was successful
        const verification = await chrome.storage.local.get(['qsci_auth_token', 'qsci_user_email']);
        console.log('Q-SCI Clerk Auth: Verification - token saved:', !!verification.qsci_auth_token, 'email saved:', !!verification.qsci_user_email);
      } catch (storageError) {
        console.error('Q-SCI Clerk Auth: Failed to save to chrome.storage:', storageError);
        // Don't throw - still try postMessage as fallback
      }
    } else {
      console.warn('Q-SCI Clerk Auth: chrome.storage not available, relying on postMessage only');
    }

    // If we're in an extension context (opened as popup from extension)
    if (window.opener && !window.opener.closed) {
      console.log('Q-SCI Clerk Auth: Posting message to opener window...');
      
      // Post message to opener window multiple times to ensure delivery
      // Sometimes the first message can be missed if timing is off
      for (let i = 0; i < 3; i++) {
        window.opener.postMessage({
          type: 'CLERK_AUTH_SUCCESS',
          data: authData
        }, '*');
        
        // Small delay between retries
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log('Q-SCI Clerk Auth: Messages sent to opener window');

      // Show success and close window after a longer delay to ensure message delivery
      // and storage persistence
      showSuccess(window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.successClose') : 'Success! Closing window...');
      
      // Wait longer to ensure chrome.storage has fully persisted
      setTimeout(() => {
        console.log('Q-SCI Clerk Auth: Closing authentication window');
        window.close();
      }, 2500); // Increased from 2000ms to 2500ms
    } else {
      console.log('Q-SCI Clerk Auth: No opener window, auth data already saved to storage');
      showSuccess(window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.successClose') : 'Success! Closing window...');
      
      // Close window after ensuring storage is persisted
      setTimeout(() => {
        window.close();
      }, 2500); // Increased from 2000ms to 2500ms
    }

  } catch (error) {
    console.error('Q-SCI Clerk Auth: Sign-in handling error:', error);
    showError(window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.errorProcess') : 'Failed to process authentication. Please try again.');
    isHandlingSignIn = false; // Reset on error
  }
}

function showError(message) {
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  
  const successEl = document.getElementById('success-message');
  if (successEl) {
    successEl.style.display = 'none';
  }
  
  // Show retry button on error
  const retrySection = document.getElementById('retry-section');
  if (retrySection) {
    retrySection.style.display = 'block';
  }
}

function showSuccess(message) {
  const successEl = document.getElementById('success-message');
  if (successEl) {
    successEl.textContent = message;
    successEl.style.display = 'block';
  }
  
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.style.display = 'none';
  }
  
  // Hide retry button on success
  const retrySection = document.getElementById('retry-section');
  if (retrySection) {
    retrySection.style.display = 'none';
  }
}

// Retry button handler
function setupRetryButton() {
  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', function() {
      console.log('Q-SCI Clerk Auth: Retry button clicked');
      
      // Hide error and retry section
      const errorEl = document.getElementById('error-message');
      if (errorEl) errorEl.style.display = 'none';
      
      const retrySection = document.getElementById('retry-section');
      if (retrySection) retrySection.style.display = 'none';
      
      // Reset clerk container to show loading
      const clerkContainer = document.getElementById('clerk-container');
      if (clerkContainer) {
        clerkContainer.innerHTML = `
          <div class="loading">
            <div class="spinner"></div>
            <div data-i18n="clerkAuth.loading">Lade Authentifizierung...</div>
          </div>
        `;
        
        // Re-translate if i18n is available
        if (window.QSCIi18n) {
          window.QSCIi18n.translatePage();
        }
      }
      
      // Retry initialization
      initializeClerk();
    });
  }
}

// Handle messages from extension
function setupMessageHandler() {
  window.addEventListener('message', function(event) {
    console.log('Q-SCI Clerk Auth: Received message:', event.data);
    
    // Handle any commands from extension if needed
    if (event.data && event.data.type === 'EXTENSION_PING') {
      event.source.postMessage({ type: 'CLERK_AUTH_READY' }, event.origin);
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Q-SCI Clerk Auth: Page loaded');
  
  // Initialize i18n first
  await initializeI18n();
  
  // Set up event handlers
  setupRetryButton();
  setupMessageHandler();
  
  // Initialize Clerk authentication
  initializeClerk();
});

// Also initialize if DOM already loaded
if (document.readyState !== 'loading') {
  (async function() {
    console.log('Q-SCI Clerk Auth: Page already loaded');
    await initializeI18n();
    setupRetryButton();
    setupMessageHandler();
    initializeClerk();
  })();
}
