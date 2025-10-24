console.log('Q-SCI Clerk Auth: Page loaded');

// Import Clerk configuration
// Note: In production, ensure clerk-config.js contains your production publishable key (pk_live_...)
// Development keys (pk_test_...) have strict usage limits and should only be used for testing
let CLERK_PUBLISHABLE_KEY = 'pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA'; // Default fallback

// Try to load configuration if available
if (typeof window !== 'undefined' && window.CLERK_CONFIG && window.CLERK_CONFIG.publishableKey) {
  CLERK_PUBLISHABLE_KEY = window.CLERK_CONFIG.publishableKey;
  console.log('Q-SCI Clerk Auth: Using configuration from clerk-config.js');
} else {
  console.warn('Q-SCI Clerk Auth: clerk-config.js not found, using default test key. For production, create clerk-config.js from clerk-config.example.js');
}

// Constants
// Valid HTTPS URL to satisfy Clerk's redirect URL validation
// (actual authentication uses postMessage, so redirect is never followed)
const AUTH_CALLBACK_URL = 'https://www.q-sci.org/auth-callback';

// Initialize i18n
let currentLanguage = 'de';
document.addEventListener('DOMContentLoaded', async function() {
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
});

// Function to wait for Clerk to be available
function waitForClerk(timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkClerk = () => {
      if (typeof Clerk !== 'undefined') {
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
    console.log('Q-SCI Clerk Auth: Waiting for Clerk SDK...');
    
    // Wait for Clerk to be available with timeout
    await waitForClerk();

    // Initialize Clerk
    // IMPORTANT: This is a main app configuration, NOT a satellite app.
    // We do NOT set isSatellite, domain, or proxyUrl as this extension is standalone.
    console.log('Q-SCI Clerk Auth: Initializing Clerk...');
    const clerk = new Clerk(CLERK_PUBLISHABLE_KEY);
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

    // Listen for sign-in events using multiple approaches
    console.log('Q-SCI Clerk Auth: Setting up session listeners...');
    
    // Approach 1: Listen for session events using modern Clerk API
    // The clerk instance emits events when the session changes
    let sessionCheckInterval = null;
    
    // Approach 2: Use more aggressive session polling with reload check
    let checkCount = 0;
    const maxChecks = 300; // 5 minutes with 1 second interval
    sessionCheckInterval = setInterval(async () => {
      try {
        checkCount++;
        
        // Reload clerk state to ensure we have the latest session
        await clerk.load();
        
        // Log every 5 seconds for debugging (more frequent for better UX)
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

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeClerk);
} else {
  // DOM already loaded
  initializeClerk();
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
        console.warn('Q-SCI Clerk Auth: Failed to fetch subscription status from backend, status:', response.status);
        // Fallback: Check publicMetadata for plan_id as indicator of subscription
        if (user.publicMetadata && user.publicMetadata.plan_id) {
          subscriptionStatus = 'subscribed';
          console.log('Q-SCI Clerk Auth: Using publicMetadata fallback - user has plan_id, treating as subscribed');
        } else {
          console.log('Q-SCI Clerk Auth: No plan_id in publicMetadata, defaulting to free');
        }
      }
    } catch (error) {
      console.error('Q-SCI Clerk Auth: Error fetching subscription status:', error);
      // Fallback: Check publicMetadata for plan_id as indicator of subscription
      if (user.publicMetadata && user.publicMetadata.plan_id) {
        subscriptionStatus = 'subscribed';
        console.log('Q-SCI Clerk Auth: Network error, using publicMetadata fallback - user has plan_id, treating as subscribed');
      } else {
        console.log('Q-SCI Clerk Auth: Network error and no plan_id in publicMetadata, defaulting to free tier');
      }
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

    // If we're in an extension context (opened as popup from extension)
    if (window.opener && !window.opener.closed) {
      // Post message to opener window
      window.opener.postMessage({
        type: 'CLERK_AUTH_SUCCESS',
        data: authData
      }, '*');

      // Show success and close window after a short delay
      showSuccess(window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.successClose') : 'Success! Closing window...');
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      // Try to communicate with extension directly via chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          'qsci_auth_token': authData.token,
          'qsci_user_email': authData.email,
          'qsci_subscription_status': authData.subscriptionStatus,
          'qsci_user_id': authData.userId,
          'qsci_clerk_session_id': authData.clerkSessionId
        });

        showSuccess(window.QSCIi18n ? window.QSCIi18n.t('clerkAuth.successClose') : 'Success! Closing window...');
        
        // Close window after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
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
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  
  const successEl = document.getElementById('success-message');
  successEl.style.display = 'none';
  
  // Show retry button on error
  const retrySection = document.getElementById('retry-section');
  if (retrySection) {
    retrySection.style.display = 'block';
  }
}

function showSuccess(message) {
  const successEl = document.getElementById('success-message');
  successEl.textContent = message;
  successEl.style.display = 'block';
  
  const errorEl = document.getElementById('error-message');
  errorEl.style.display = 'none';
  
  // Hide retry button on success
  const retrySection = document.getElementById('retry-section');
  if (retrySection) {
    retrySection.style.display = 'none';
  }
}

// Add retry button handler
document.addEventListener('DOMContentLoaded', function() {
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
});

// Handle messages from extension
window.addEventListener('message', function(event) {
  console.log('Q-SCI Clerk Auth: Received message:', event.data);
  
  // Handle any commands from extension if needed
  if (event.data && event.data.type === 'EXTENSION_PING') {
    event.source.postMessage({ type: 'CLERK_AUTH_READY' }, event.origin);
  }
});
