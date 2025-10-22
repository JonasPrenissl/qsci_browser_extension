// Q-SCI Browser Extension - Authentication Module
// Handles user authentication via Clerk, subscription status, and usage tracking

(function() {
  'use strict';

  // Clerk authentication configuration
  // The extension uses Clerk for authentication via a pop-up window
  // Users authenticate through Clerk's hosted UI, and the extension receives
  // the session token and user information via postMessage
  const CLERK_AUTH_URL = chrome.runtime.getURL('clerk-auth.html');
  
  // Backend API base URL - points to q-sci.org backend (if needed for additional verification)
  const API_BASE_URL = 'https://www.q-sci.org/api';
  
  // Storage keys
  const STORAGE_KEYS = {
    AUTH_TOKEN: 'qsci_auth_token',
    USER_EMAIL: 'qsci_user_email',
    USER_ID: 'qsci_user_id',
    CLERK_SESSION_ID: 'qsci_clerk_session_id',
    SUBSCRIPTION_STATUS: 'qsci_subscription_status', // Values: 'free', 'subscribed', 'past_due'
    DAILY_USAGE: 'qsci_daily_usage',
    LAST_USAGE_DATE: 'qsci_last_usage_date'
  };

  // Usage limits
  // Subscription status determination:
  // The backend checks Clerk's privateMetadata.stripe_customer_id to determine subscription status:
  // - If stripe_customer_id exists -> user is 'subscribed' (has active paid subscription)
  // - If stripe_customer_id does NOT exist -> user is 'free' (no subscription)
  // Note: privateMetadata is only accessible server-side, so the extension must query the backend
  // API endpoint /api/auth/subscription-status to get the current subscription status.
  //
  // Subscription status values:
  // - 'free': Free tier users (no active subscription, no stripe_customer_id)
  // - 'subscribed': Active paid subscription (has stripe_customer_id in privateMetadata)
  // - 'past_due': Payment issue but still allow limited access (deprecated, treated as 'free')
  const USAGE_LIMITS = {
    FREE: 10,           // Free users: 10 analyses per day
    SUBSCRIBED: 100,    // Subscribed users: 100 analyses per day
    PAST_DUE: 10        // Past due users: same as free (10 per day)
  };

  /**
   * Authentication service
   */
  const AuthService = {
    
    /**
     * Login user via Clerk authentication pop-up
     * Opens a pop-up window with Clerk authentication
     * @returns {Promise<Object>} User data including subscription status
     */
    async login() {
      return new Promise((resolve, reject) => {
        console.log('Q-SCI Auth: Opening Clerk authentication pop-up...');
        
        try {
          // Open Clerk auth page in a pop-up window
          const width = 500;
          const height = 700;
          const left = (screen.width - width) / 2;
          const top = (screen.height - height) / 2;
          
          const authWindow = window.open(
            CLERK_AUTH_URL,
            'Q-SCI Login',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
          );

          if (!authWindow) {
            reject(new Error('Failed to open authentication window. Please check if pop-ups are blocked.'));
            return;
          }

          // Listen for message from auth window
          const messageHandler = async (event) => {
            // Verify the message is from our auth window
            if (event.data && event.data.type === 'CLERK_AUTH_SUCCESS') {
              console.log('Q-SCI Auth: Received authentication success from Clerk');
              
              window.removeEventListener('message', messageHandler);
              
              try {
                const authData = event.data.data;
                
                // Store auth data
                await this._storeAuthData({
                  token: authData.token,
                  email: authData.email,
                  userId: authData.userId,
                  clerkSessionId: authData.clerkSessionId,
                  subscriptionStatus: authData.subscriptionStatus || 'free'
                });

                // Close the auth window if still open
                if (authWindow && !authWindow.closed) {
                  authWindow.close();
                }

                resolve({
                  email: authData.email,
                  subscriptionStatus: authData.subscriptionStatus || 'free',
                  userId: authData.userId
                });
              } catch (error) {
                console.error('Q-SCI Auth: Error storing auth data:', error);
                reject(error);
              }
            } else if (event.data && event.data.type === 'CLERK_AUTH_ERROR') {
              console.error('Q-SCI Auth: Authentication error from Clerk');
              window.removeEventListener('message', messageHandler);
              
              if (authWindow && !authWindow.closed) {
                authWindow.close();
              }
              
              reject(new Error(event.data.message || 'Authentication failed'));
            }
          };

          window.addEventListener('message', messageHandler);

          // Check if window was closed without completing auth
          const checkClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', messageHandler);
              reject(new Error('Authentication window was closed'));
            }
          }, 1000);

          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            if (authWindow && !authWindow.closed) {
              authWindow.close();
            }
            reject(new Error('Authentication timeout'));
          }, 5 * 60 * 1000);

        } catch (error) {
          console.error('Q-SCI Auth: Login error:', error);
          reject(error);
        }
      });
    },

    /**
     * Logout user
     */
    async logout() {
      try {
        // Clear all auth-related storage
        await chrome.storage.local.remove([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.USER_EMAIL,
          STORAGE_KEYS.USER_ID,
          STORAGE_KEYS.CLERK_SESSION_ID,
          STORAGE_KEYS.SUBSCRIPTION_STATUS
        ]);
        
        console.log('Q-SCI Auth: User logged out');
      } catch (error) {
        console.error('Q-SCI Auth: Logout error:', error);
        throw error;
      }
    },

    /**
     * Check if user is logged in
     * @returns {Promise<boolean>} True if user is logged in
     */
    async isLoggedIn() {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
        return !!(result && result[STORAGE_KEYS.AUTH_TOKEN]);
      } catch (error) {
        console.error('Q-SCI Auth: Error checking login status:', error);
        return false;
      }
    },

    /**
     * Get current user data
     * @returns {Promise<Object|null>} User data or null if not logged in
     */
    async getCurrentUser() {
      try {
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.USER_EMAIL,
          STORAGE_KEYS.USER_ID,
          STORAGE_KEYS.CLERK_SESSION_ID,
          STORAGE_KEYS.SUBSCRIPTION_STATUS
        ]);

        if (!result || !result[STORAGE_KEYS.AUTH_TOKEN]) {
          return null;
        }

        return {
          token: result[STORAGE_KEYS.AUTH_TOKEN],
          email: result[STORAGE_KEYS.USER_EMAIL],
          userId: result[STORAGE_KEYS.USER_ID],
          clerkSessionId: result[STORAGE_KEYS.CLERK_SESSION_ID],
          subscriptionStatus: result[STORAGE_KEYS.SUBSCRIPTION_STATUS] || 'free'
        };
      } catch (error) {
        console.error('Q-SCI Auth: Error getting current user:', error);
        return null;
      }
    },

    /**
     * Verify authentication token with Clerk and refresh subscription status
     * This fetches the current subscription status from the backend which checks
     * privateMetadata.stripe_customer_id to determine if user is subscribed
     * @returns {Promise<Object>} Updated user data
     */
    async verifyAndRefreshAuth() {
      try {
        const user = await this.getCurrentUser();
        
        if (!user || !user.token) {
          throw new Error('No authentication token found');
        }

        // Fetch the latest subscription status from backend
        // The backend checks privateMetadata.stripe_customer_id to determine subscription status
        try {
          const response = await fetch(`${API_BASE_URL}/auth/subscription-status`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              const newSubscriptionStatus = data.subscription_status || 'free';
              
              // Update stored subscription status
              await chrome.storage.local.set({
                [STORAGE_KEYS.SUBSCRIPTION_STATUS]: newSubscriptionStatus
              });
              
              console.log('Q-SCI Auth: Subscription status verified and updated:', newSubscriptionStatus);
              
              return {
                ...user,
                subscriptionStatus: newSubscriptionStatus
              };
            } else {
              console.warn('Q-SCI Auth: Backend returned non-JSON response, using cached data');
              console.warn('Q-SCI Auth: Content-Type:', contentType);
              return user;
            }
          } else {
            console.warn('Q-SCI Auth: Failed to verify subscription status (status:', response.status, '), using cached data');
            return user;
          }
        } catch (fetchError) {
          console.warn('Q-SCI Auth: Network error fetching subscription status, using cached data');
          return user;
        }
        
      } catch (error) {
        console.error('Q-SCI Auth: Error verifying auth:', error);
        
        // For network errors, use cached data
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          const user = await this.getCurrentUser();
          if (user) {
            console.warn('Q-SCI Auth: Using cached user data due to network error');
            return user;
          }
          throw new Error('Unable to verify authentication. Please check your internet connection.');
        }
        
        throw error;
      }
    },

    /**
     * Refresh subscription status from backend
     * This should be called after a user completes payment to update their subscription status
     * The backend webhook will update Clerk publicMetadata, and this function fetches the latest status
     * @returns {Promise<Object>} Updated user data with refreshed subscription status
     */
    async refreshSubscriptionStatus() {
      try {
        const user = await this.getCurrentUser();
        
        if (!user || !user.userId) {
          throw new Error('No user found. Please login first.');
        }

        console.log('Q-SCI Auth: Refreshing subscription status from backend...');

        // Call backend API to get updated subscription status
        // The backend will check Clerk's privateMetadata.stripe_customer_id to determine subscription status
        // If stripe_customer_id exists, user is subscribed; otherwise, user is on free tier
        const response = await fetch(`${API_BASE_URL}/auth/subscription-status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn('Q-SCI Auth: Failed to refresh subscription status from backend (status:', response.status, '), using cached data');
          return user;
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Q-SCI Auth: Backend returned non-JSON response, using cached data');
          console.warn('Q-SCI Auth: Content-Type:', contentType);
          return user;
        }

        const data = await response.json();
        const newSubscriptionStatus = data.subscription_status || 'free';

        // Update stored subscription status
        await chrome.storage.local.set({
          [STORAGE_KEYS.SUBSCRIPTION_STATUS]: newSubscriptionStatus
        });

        console.log('Q-SCI Auth: Subscription status refreshed:', newSubscriptionStatus);

        // Return updated user data
        return {
          ...user,
          subscriptionStatus: newSubscriptionStatus
        };
        
      } catch (error) {
        console.error('Q-SCI Auth: Error refreshing subscription status:', error);
        
        // For network errors, return cached data
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          const user = await this.getCurrentUser();
          if (user) {
            console.warn('Q-SCI Auth: Using cached subscription data due to network error');
            return user;
          }
        }
        
        // Return current user data even if refresh fails
        return await this.getCurrentUser();
      }
    },

    /**
     * Store authentication data
     * @private
     */
    async _storeAuthData({ token, email, userId, clerkSessionId, subscriptionStatus }) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.AUTH_TOKEN]: token,
        [STORAGE_KEYS.USER_EMAIL]: email,
        [STORAGE_KEYS.USER_ID]: userId,
        [STORAGE_KEYS.CLERK_SESSION_ID]: clerkSessionId,
        [STORAGE_KEYS.SUBSCRIPTION_STATUS]: subscriptionStatus
      });
    },

    /**
     * Fetch OpenAI API key from backend
     * This method retrieves the API key from the backend server
     * The backend should return the key based on the user's authentication token
     * @returns {Promise<string>} OpenAI API key
     */
    async getOpenAIApiKey() {
      console.log('Q-SCI Auth: getOpenAIApiKey() called');
      
      try {
        const user = await this.getCurrentUser();
        console.log('Q-SCI Auth: Current user:', user ? 'logged in' : 'not logged in');
        
        if (!user || !user.token) {
          const errorMsg = 'No authentication token found. Please login first.';
          console.error('Q-SCI Auth:', errorMsg);
          throw new Error(errorMsg);
        }

        console.log('Q-SCI Auth: Fetching OpenAI API key from backend...');
        console.log('Q-SCI Auth: API endpoint:', `${API_BASE_URL}/auth/openai-key`);
        console.log('Q-SCI Auth: Using token (first 20 chars):', user.token.substring(0, 20) + '...');

        // Call backend API to get OpenAI API key
        const response = await fetch(`${API_BASE_URL}/auth/openai-key`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Q-SCI Auth: Backend response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Q-SCI Auth: Failed to fetch API key from backend:', response.status, errorText);
          
          let userMessage;
          if (response.status === 404) {
            userMessage = `Backend endpoint not found (404). The /api/auth/openai-key endpoint needs to be deployed to Vercel. Please ensure the backend is properly configured.`;
          } else if (response.status === 401) {
            userMessage = `Authentication failed (401). Your session may have expired. Please try logging out and logging in again.`;
          } else if (response.status === 500) {
            userMessage = `Backend server error (500). The OPENAI_API_KEY environment variable may not be set on Vercel. Please contact support.`;
          } else {
            userMessage = `Backend returned error ${response.status}: ${response.statusText}. Please contact support.`;
          }
          
          throw new Error(userMessage);
        }

        const data = await response.json();
        console.log('Q-SCI Auth: Response data received:', data ? 'yes' : 'no');
        
        if (!data.api_key) {
          console.error('Q-SCI Auth: No API key in response:', data);
          throw new Error('Backend did not return an API key. Please ensure the OPENAI_API_KEY environment variable is set on Vercel.');
        }

        console.log('Q-SCI Auth: OpenAI API key fetched successfully (length:', data.api_key.length, ')');
        return data.api_key;
        
      } catch (error) {
        console.error('Q-SCI Auth: Error fetching OpenAI API key:', error);
        console.error('Q-SCI Auth: Error details:', {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        });
        
        // For network errors, inform the user appropriately
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Unable to connect to backend. Please check your internet connection and ensure the backend is running.');
        }
        
        throw error;
      }
    }
  };

  /**
   * Usage tracking service
   */
  const UsageService = {
    
    /**
     * Get current daily usage count
     * @returns {Promise<number>} Number of analyses done today
     */
    async getDailyUsage() {
      try {
        const today = this._getTodayDate();
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.DAILY_USAGE,
          STORAGE_KEYS.LAST_USAGE_DATE
        ]);

        const lastDate = result[STORAGE_KEYS.LAST_USAGE_DATE];
        const usage = result[STORAGE_KEYS.DAILY_USAGE] || 0;

        // Reset usage if it's a new day
        if (lastDate !== today) {
          await this._resetDailyUsage();
          return 0;
        }

        return usage;
      } catch (error) {
        console.error('Q-SCI Usage: Error getting daily usage:', error);
        return 0;
      }
    },

    /**
     * Increment daily usage count
     * @returns {Promise<number>} New usage count
     */
    async incrementUsage() {
      try {
        const today = this._getTodayDate();
        const currentUsage = await this.getDailyUsage();
        const newUsage = currentUsage + 1;

        await chrome.storage.local.set({
          [STORAGE_KEYS.DAILY_USAGE]: newUsage,
          [STORAGE_KEYS.LAST_USAGE_DATE]: today
        });

        console.log('Q-SCI Usage: Incremented to', newUsage);
        return newUsage;
      } catch (error) {
        console.error('Q-SCI Usage: Error incrementing usage:', error);
        throw error;
      }
    },

    /**
     * Check if user can perform an analysis
     * @param {string} subscriptionStatus - User's subscription status ('free', 'subscribed', or 'past_due')
     * @returns {Promise<Object>} Object with canAnalyze flag and remaining count
     */
    async canAnalyze(subscriptionStatus) {
      try {
        const usage = await this.getDailyUsage();
        
        // Determine limit based on subscription status
        let limit;
        if (subscriptionStatus === 'subscribed') {
          limit = USAGE_LIMITS.SUBSCRIBED;
        } else if (subscriptionStatus === 'past_due') {
          limit = USAGE_LIMITS.PAST_DUE;
        } else {
          limit = USAGE_LIMITS.FREE;
        }
        
        const remaining = Math.max(0, limit - usage);

        return {
          canAnalyze: usage < limit,
          remaining: remaining,
          limit: limit,
          used: usage
        };
      } catch (error) {
        console.error('Q-SCI Usage: Error checking if can analyze:', error);
        return { canAnalyze: false, remaining: 0, limit: 0, used: 0 };
      }
    },

    /**
     * Reset daily usage (called when a new day starts)
     * @private
     */
    async _resetDailyUsage() {
      const today = this._getTodayDate();
      await chrome.storage.local.set({
        [STORAGE_KEYS.DAILY_USAGE]: 0,
        [STORAGE_KEYS.LAST_USAGE_DATE]: today
      });
      console.log('Q-SCI Usage: Reset daily usage for new day');
    },

    /**
     * Get today's date as YYYY-MM-DD string
     * @private
     */
    _getTodayDate() {
      const now = new Date();
      return now.toISOString().split('T')[0];
    }
  };

  // Expose services globally
  window.QSCIAuth = AuthService;
  window.QSCIUsage = UsageService;

  console.log('Q-SCI Auth: Module loaded');

})();
