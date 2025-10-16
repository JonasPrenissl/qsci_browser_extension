// Q-SCI Browser Extension - Authentication Module
// Handles user authentication, subscription status, and usage tracking

(function() {
  'use strict';

  // Backend API base URL - points to q-sci.org backend
  // Note: If the backend is not yet deployed, you can test locally by:
  // 1. Setting up a local server at http://localhost:5000/api
  // 2. Or implementing the /api/auth/login and /api/auth/verify endpoints on q-sci.org
  // 
  // Expected endpoints:
  // POST /api/auth/login - accepts { email, password }, returns { token, email, subscription_status }
  // GET /api/auth/verify - accepts Authorization: Bearer <token>, returns { subscription_status }
  const API_BASE_URL = 'https://www.q-sci.org/api';
  
  // Storage keys
  const STORAGE_KEYS = {
    AUTH_TOKEN: 'qsci_auth_token',
    USER_EMAIL: 'qsci_user_email',
    SUBSCRIPTION_STATUS: 'qsci_subscription_status',
    DAILY_USAGE: 'qsci_daily_usage',
    LAST_USAGE_DATE: 'qsci_last_usage_date'
  };

  // Usage limits
  const USAGE_LIMITS = {
    FREE: 10,           // Free users: 10 analyses per day
    SUBSCRIBED: 100     // Subscribed users: 100 analyses per day
  };

  /**
   * Authentication service
   */
  const AuthService = {
    
    /**
     * Login user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data including subscription status
     */
    async login(email, password) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Login failed' }));
          throw new Error(error.message || 'Login failed. Please check your credentials.');
        }

        const data = await response.json();
        
        // Store auth token and user data
        await this._storeAuthData({
          token: data.token,
          email: data.email || email,
          subscriptionStatus: data.subscription_status || 'free'
        });

        return data;
      } catch (error) {
        console.error('Q-SCI Auth: Login error:', error);
        
        // Provide more user-friendly error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Unable to connect to q-sci.org. Please check your internet connection.');
        }
        
        throw error;
      }
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
          STORAGE_KEYS.SUBSCRIPTION_STATUS
        ]);

        if (!result || !result[STORAGE_KEYS.AUTH_TOKEN]) {
          return null;
        }

        return {
          token: result[STORAGE_KEYS.AUTH_TOKEN],
          email: result[STORAGE_KEYS.USER_EMAIL],
          subscriptionStatus: result[STORAGE_KEYS.SUBSCRIPTION_STATUS] || 'free'
        };
      } catch (error) {
        console.error('Q-SCI Auth: Error getting current user:', error);
        return null;
      }
    },

    /**
     * Verify authentication token with backend and refresh subscription status
     * @returns {Promise<Object>} Updated user data
     */
    async verifyAndRefreshAuth() {
      try {
        const user = await this.getCurrentUser();
        
        if (!user || !user.token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // Token is invalid, logout user
          await this.logout();
          throw new Error('Authentication token is invalid or expired. Please login again.');
        }

        const data = await response.json();
        
        // Update subscription status
        await chrome.storage.local.set({
          [STORAGE_KEYS.SUBSCRIPTION_STATUS]: data.subscription_status || 'free'
        });

        return {
          ...user,
          subscriptionStatus: data.subscription_status || 'free'
        };
      } catch (error) {
        console.error('Q-SCI Auth: Error verifying auth:', error);
        
        // Provide more user-friendly error messages for network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          // Don't logout on network errors, just return cached user data
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
     * Store authentication data
     * @private
     */
    async _storeAuthData({ token, email, subscriptionStatus }) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.AUTH_TOKEN]: token,
        [STORAGE_KEYS.USER_EMAIL]: email,
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
     * @param {string} subscriptionStatus - User's subscription status ('free' or 'subscribed')
     * @returns {Promise<Object>} Object with canAnalyze flag and remaining count
     */
    async canAnalyze(subscriptionStatus) {
      try {
        const usage = await this.getDailyUsage();
        const limit = subscriptionStatus === 'subscribed' ? USAGE_LIMITS.SUBSCRIBED : USAGE_LIMITS.FREE;
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
