// Q-SCI Clerk Authentication Module
// Handles Clerk authentication initialization and user sign-in flow

import { Clerk } from '@clerk/clerk-js';

console.log('Q-SCI Clerk Auth: Module loaded');

// Constants
const CLERK_PUBLISHABLE_KEY = 'pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA';
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
    
    // Initialize Clerk with the publishable key
    const clerk = new Clerk(CLERK_PUBLISHABLE_KEY);
    
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
     */
    await clerk.load({
      // Set all redirect URL variants to ensure OAuth callback works
      signInFallbackRedirectUrl: AUTH_CALLBACK_URL,
      signUpFallbackRedirectUrl: AUTH_CALLBACK_URL,
      signInForceRedirectUrl: AUTH_CALLBACK_URL,
      signUpForceRedirectUrl: AUTH_CALLBACK_URL,
      // Additional redirect URL to handle OAuth callback scenarios
      redirectUrl: AUTH_CALLBACK_URL
    });

    console.log('Q-SCI Clerk Auth: Clerk initialized successfully');

    // Check if user is already signed in
    if (clerk.user) {
      console.log('Q-SCI Clerk Auth: User already signed in:', clerk.user.id);
      await handleSignInSuccess(clerk);
      return;
    }

    // Mount Clerk sign-in component
    const clerkContainer = document.getElementById('clerk-container');
    clerkContainer.innerHTML = ''; // Clear loading message

    // Mount the sign-in component
    console.log('Q-SCI Clerk Auth: Mounting sign-in component...');
    clerk.mountSignIn(clerkContainer, {
      // Use a valid HTTPS URL to avoid "Invalid URL scheme" error
      // Clerk defaults to window.location.href (chrome-extension://) when redirectUrl is undefined
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
    
    let sessionCheckInterval = null;
    let checkCount = 0;
    const maxChecks = 300; // 5 minutes with 1 second interval
    
    sessionCheckInterval = setInterval(async () => {
      try {
        checkCount++;
        
        // Reload clerk state to ensure we have the latest session
        await clerk.load();
        
        // Log every 5 seconds for debugging
        if (checkCount % 5 === 0) {
          console.log(`Q-SCI Clerk Auth: Checking session... (attempt ${checkCount}/${maxChecks})`);
          console.log('Q-SCI Clerk Auth: Session exists:', !!clerk.session);
          console.log('Q-SCI Clerk Auth: User exists:', !!clerk.user);
        }
        
        if (clerk.session && clerk.user) {
          console.log('Q-SCI Clerk Auth: Session detected, user signed in');
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
      } catch (error) {
        console.error('Q-SCI Clerk Auth: Error checking session:', error);
      }
    }, 1000);

  } catch (error) {
    console.error('Q-SCI Clerk Auth: Initialization error:', error);
    showError(window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.errorInit') : 'Failed to initialize authentication. Please try again.');
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
        const data = await response.json();
        subscriptionStatus = data.subscription_status || 'free';
        console.log('Q-SCI Clerk Auth: Fetched subscription status from backend:', subscriptionStatus);
      } else {
        console.warn('Q-SCI Clerk Auth: Failed to fetch subscription status, defaulting to free');
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

    // Validate opener origin if possible (best security practice)
    let targetOrigin = '*';
    
    // Try to determine if we're in an extension context
    if (window.opener && !window.opener.closed) {
      // For browser extensions, the opener might have a chrome-extension:// origin
      // We use '*' for now but could be more restrictive if needed
      try {
        // Attempt to get the opener's origin (may fail due to CORS)
        if (window.opener.location && window.opener.location.origin) {
          targetOrigin = window.opener.location.origin;
        }
      } catch (e) {
        // If we can't access opener's origin (cross-origin), use '*'
        console.log('Q-SCI Clerk Auth: Cannot determine opener origin, using wildcard');
      }
      
      // Post message to opener window
      window.opener.postMessage({
        type: 'CLERK_AUTH_SUCCESS',
        data: authData
      }, targetOrigin);

      // Show success and close window after a short delay
      showSuccess(window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.successClose') : SUCCESS_CLOSE_MESSAGE);
      setTimeout(() => {
        window.close();
      }, WINDOW_CLOSE_DELAY_MS);
    } else {
      // Fallback: Try to communicate with extension directly via chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          'qsci_auth_token': authData.token,
          'qsci_user_email': authData.email,
          'qsci_subscription_status': authData.subscriptionStatus,
          'qsci_user_id': authData.userId,
          'qsci_clerk_session_id': authData.clerkSessionId
        });

        showSuccess(window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.successClose') : SUCCESS_CLOSE_MESSAGE);
        
        // Close window after a short delay
        setTimeout(() => {
          window.close();
        }, WINDOW_CLOSE_DELAY_MS);
      } else {
        showError(window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.errorExtension') : 'Please open this page from the extension.');
      }
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
