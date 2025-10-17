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
  // Subscription status values set by Stripe webhook in Clerk publicMetadata:
  // - 'free': Free tier users (no active subscription)
  // - 'subscribed': Active paid subscription (Stripe status: active, trialing)
  // - 'past_due': Payment issue but still allow limited access (Stripe status: past_due)
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
                  subscription_status: authData.subscriptionStatus || 'free',
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
     * For Clerk integration, we primarily rely on the stored session
     * but can optionally verify with backend if needed
     * @returns {Promise<Object>} Updated user data
     */
    async verifyAndRefreshAuth() {
      try {
        const user = await this.getCurrentUser();
        
        if (!user || !user.token) {
          throw new Error('No authentication token found');
        }

        // For Clerk, we trust the stored session token
        // Optionally, you can verify with your backend if you have an endpoint
        // that validates Clerk tokens
        
        // If you want to verify with backend (optional):
        // const response = await fetch(`${API_BASE_URL}/auth/verify-clerk`, {
        //   method: 'GET',
        //   headers: {
        //     'Authorization': `Bearer ${user.token}`,
        //     'Content-Type': 'application/json'
        //   }
        // });
        //
        // if (!response.ok) {
        //   await this.logout();
        //   throw new Error('Authentication token is invalid or expired. Please login again.');
        // }
        //
        // const data = await response.json();
        // await chrome.storage.local.set({
        //   [STORAGE_KEYS.SUBSCRIPTION_STATUS]: data.subscription_status || 'free'
        // });

        // For now, return the cached user data
        // Clerk handles session management and expiration
        console.log('Q-SCI Auth: Using Clerk session from storage');
        return user;
        
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
        // The backend will query Clerk's publicMetadata for the latest subscription_status
        const response = await fetch(`${API_BASE_URL}/auth/subscription-status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn('Q-SCI Auth: Failed to refresh subscription status from backend, using cached data');
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
