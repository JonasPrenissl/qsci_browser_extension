(() => {
  // src/auth.js
  (function() {
    "use strict";
    const CLERK_AUTH_URL = "http://localhost:5000/extension-login";
    const API_BASE_URL = "http://localhost:5000/api";
    const STORAGE_KEYS = {
      AUTH_TOKEN: "qsci_auth_token",
      USER_EMAIL: "qsci_user_email",
      USER_ID: "qsci_user_id",
      CLERK_SESSION_ID: "qsci_clerk_session_id",
      SUBSCRIPTION_STATUS: "qsci_subscription_status",
      // Values: 'free', 'subscribed', 'past_due'
      DAILY_USAGE: "qsci_daily_usage",
      LAST_USAGE_DATE: "qsci_last_usage_date"
    };
    const USAGE_LIMITS = {
      FREE: 10,
      // Free users: 10 analyses per day
      SUBSCRIBED: 100,
      // Subscribed users: 100 analyses per day
      PAST_DUE: 10
      // Past due users: same as free (10 per day)
    };
    const AuthService = {
      /**
       * Login user via Clerk authentication pop-up
       * Opens a pop-up window with Clerk authentication
       * @returns {Promise<Object>} User data including subscription status
       */
      async login() {
        return new Promise((resolve, reject) => {
          console.log("Q-SCI Auth: Opening Clerk authentication pop-up...");
          try {
            const width = 500;
            const height = 700;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;
            const authWindow = window.open(
              CLERK_AUTH_URL,
              "Q-SCI Login",
              `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
            );
            if (!authWindow) {
              reject(new Error("Failed to open authentication window. Please check if pop-ups are blocked."));
              return;
            }
            let messageReceived = false;
            const messageHandler = async (event) => {
              var _a, _b, _c;
              if (event.data && event.data.type === "CLERK_AUTH_SUCCESS") {
                console.log("Q-SCI Auth: Received authentication success from Clerk");
                console.log("Q-SCI Auth: Auth data received:", {
                  hasToken: !!((_a = event.data.data) == null ? void 0 : _a.token),
                  hasEmail: !!((_b = event.data.data) == null ? void 0 : _b.email),
                  hasUserId: !!((_c = event.data.data) == null ? void 0 : _c.userId)
                });
                messageReceived = true;
                window.removeEventListener("message", messageHandler);
                clearInterval(checkClosed);
                clearTimeout(timeoutId);
                try {
                  const authData = event.data.data;
                  if (!authData || !authData.token || !authData.email) {
                    throw new Error("Invalid auth data received from Clerk window");
                  }
                  console.log("Q-SCI Auth: Storing received auth data...");
                  await this._storeAuthData({
                    token: authData.token,
                    email: authData.email,
                    userId: authData.userId,
                    clerkSessionId: authData.clerkSessionId,
                    subscriptionStatus: authData.subscriptionStatus || "free"
                  });
                  console.log("Q-SCI Auth: Auth data stored via postMessage");
                  if (authWindow && !authWindow.closed) {
                    authWindow.close();
                  }
                  resolve({
                    email: authData.email,
                    subscriptionStatus: authData.subscriptionStatus || "free",
                    userId: authData.userId
                  });
                } catch (error) {
                  console.error("Q-SCI Auth: Error storing auth data:", error);
                  reject(error);
                }
              } else if (event.data && event.data.type === "CLERK_AUTH_ERROR") {
                console.error("Q-SCI Auth: Authentication error from Clerk");
                messageReceived = true;
                window.removeEventListener("message", messageHandler);
                clearInterval(checkClosed);
                clearTimeout(timeoutId);
                if (authWindow && !authWindow.closed) {
                  authWindow.close();
                }
                reject(new Error(event.data.message || "Authentication failed"));
              }
            };
            window.addEventListener("message", messageHandler);
            const checkClosed = setInterval(async () => {
              if (authWindow.closed) {
                clearInterval(checkClosed);
                clearTimeout(timeoutId);
                window.removeEventListener("message", messageHandler);
                console.log("Q-SCI Auth: Auth window closed, checking for stored credentials...");
                await new Promise((resolve2) => setTimeout(resolve2, 1e3));
                try {
                  const user = await this.getCurrentUser();
                  if (user && user.token && !messageReceived) {
                    console.log("Q-SCI Auth: Found stored credentials after window close");
                    resolve({
                      email: user.email,
                      subscriptionStatus: user.subscriptionStatus || "free",
                      userId: user.userId
                    });
                  } else if (!messageReceived) {
                    reject(new Error("Authentication window was closed before completing authentication"));
                  }
                } catch (error) {
                  console.error("Q-SCI Auth: Error checking stored credentials:", error);
                  if (!messageReceived) {
                    reject(new Error("Authentication window was closed"));
                  }
                }
              }
            }, 500);
            const timeoutId = setTimeout(() => {
              clearInterval(checkClosed);
              window.removeEventListener("message", messageHandler);
              if (authWindow && !authWindow.closed) {
                authWindow.close();
              }
              if (!messageReceived) {
                reject(new Error("Authentication timeout"));
              }
            }, 5 * 60 * 1e3);
          } catch (error) {
            console.error("Q-SCI Auth: Login error:", error);
            reject(error);
          }
        });
      },
      /**
       * Logout user
       */
      async logout() {
        try {
          await chrome.storage.local.remove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.USER_EMAIL,
            STORAGE_KEYS.USER_ID,
            STORAGE_KEYS.CLERK_SESSION_ID,
            STORAGE_KEYS.SUBSCRIPTION_STATUS
          ]);
          console.log("Q-SCI Auth: User logged out");
        } catch (error) {
          console.error("Q-SCI Auth: Logout error:", error);
          throw error;
        }
      },
      /**
       * Check if user is logged in
       * @returns {Promise<boolean>} True if user is logged in
       */
      async isLoggedIn() {
        try {
          console.log("Q-SCI Auth: Checking if user is logged in...");
          const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
          const isLoggedIn = !!(result && result[STORAGE_KEYS.AUTH_TOKEN]);
          console.log("Q-SCI Auth: isLoggedIn result:", isLoggedIn, "token exists:", !!result[STORAGE_KEYS.AUTH_TOKEN]);
          return isLoggedIn;
        } catch (error) {
          console.error("Q-SCI Auth: Error checking login status:", error);
          return false;
        }
      },
      /**
       * Get current user data
       * @returns {Promise<Object|null>} User data or null if not logged in
       */
      async getCurrentUser() {
        try {
          console.log("Q-SCI Auth: Getting current user...");
          const result = await chrome.storage.local.get([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.USER_EMAIL,
            STORAGE_KEYS.USER_ID,
            STORAGE_KEYS.CLERK_SESSION_ID,
            STORAGE_KEYS.SUBSCRIPTION_STATUS
          ]);
          console.log("Q-SCI Auth: Storage keys retrieved:", {
            hasToken: !!result[STORAGE_KEYS.AUTH_TOKEN],
            hasEmail: !!result[STORAGE_KEYS.USER_EMAIL],
            hasUserId: !!result[STORAGE_KEYS.USER_ID],
            subscriptionStatus: result[STORAGE_KEYS.SUBSCRIPTION_STATUS]
          });
          if (!result || !result[STORAGE_KEYS.AUTH_TOKEN]) {
            console.log("Q-SCI Auth: No auth token found in storage");
            return null;
          }
          const user = {
            token: result[STORAGE_KEYS.AUTH_TOKEN],
            email: result[STORAGE_KEYS.USER_EMAIL],
            userId: result[STORAGE_KEYS.USER_ID],
            clerkSessionId: result[STORAGE_KEYS.CLERK_SESSION_ID],
            subscriptionStatus: result[STORAGE_KEYS.SUBSCRIPTION_STATUS] || "free"
          };
          console.log("Q-SCI Auth: Current user:", { email: user.email, subscriptionStatus: user.subscriptionStatus });
          return user;
        } catch (error) {
          console.error("Q-SCI Auth: Error getting current user:", error);
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
            throw new Error("No authentication token found");
          }
          try {
            const response = await fetch(`${API_BASE_URL}/auth/subscription-status`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${user.token}`,
                "Content-Type": "application/json"
              }
            });
            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                const newSubscriptionStatus = data.subscription_status || "free";
                await chrome.storage.local.set({
                  [STORAGE_KEYS.SUBSCRIPTION_STATUS]: newSubscriptionStatus
                });
                console.log("Q-SCI Auth: Subscription status verified and updated:", newSubscriptionStatus);
                return {
                  ...user,
                  subscriptionStatus: newSubscriptionStatus
                };
              } else {
                console.warn("Q-SCI Auth: Backend returned non-JSON response, using cached data");
                console.warn("Q-SCI Auth: Content-Type:", contentType);
                return user;
              }
            } else {
              console.warn("Q-SCI Auth: Failed to verify subscription status (status:", response.status, "), using cached data");
              return user;
            }
          } catch (fetchError) {
            console.warn("Q-SCI Auth: Network error fetching subscription status, using cached data");
            return user;
          }
        } catch (error) {
          console.error("Q-SCI Auth: Error verifying auth:", error);
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            const user = await this.getCurrentUser();
            if (user) {
              console.warn("Q-SCI Auth: Using cached user data due to network error");
              return user;
            }
            throw new Error("Unable to verify authentication. Please check your internet connection.");
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
            throw new Error("No user found. Please login first.");
          }
          console.log("Q-SCI Auth: Refreshing subscription status from backend...");
          const response = await fetch(`${API_BASE_URL}/auth/subscription-status`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${user.token}`,
              "Content-Type": "application/json"
            }
          });
          if (!response.ok) {
            console.warn("Q-SCI Auth: Failed to refresh subscription status from backend (status:", response.status, "), using cached data");
            return user;
          }
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.warn("Q-SCI Auth: Backend returned non-JSON response, using cached data");
            console.warn("Q-SCI Auth: Content-Type:", contentType);
            return user;
          }
          const data = await response.json();
          const newSubscriptionStatus = data.subscription_status || "free";
          await chrome.storage.local.set({
            [STORAGE_KEYS.SUBSCRIPTION_STATUS]: newSubscriptionStatus
          });
          console.log("Q-SCI Auth: Subscription status refreshed:", newSubscriptionStatus);
          return {
            ...user,
            subscriptionStatus: newSubscriptionStatus
          };
        } catch (error) {
          console.error("Q-SCI Auth: Error refreshing subscription status:", error);
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            const user = await this.getCurrentUser();
            if (user) {
              console.warn("Q-SCI Auth: Using cached subscription data due to network error");
              return user;
            }
          }
          return await this.getCurrentUser();
        }
      },
      /**
       * Store authentication data
       * @private
       */
      async _storeAuthData({ token, email, userId, clerkSessionId, subscriptionStatus }) {
        console.log("Q-SCI Auth: Storing auth data...", {
          hasToken: !!token,
          email,
          userId,
          subscriptionStatus
        });
        try {
          await chrome.storage.local.set({
            [STORAGE_KEYS.AUTH_TOKEN]: token,
            [STORAGE_KEYS.USER_EMAIL]: email,
            [STORAGE_KEYS.USER_ID]: userId,
            [STORAGE_KEYS.CLERK_SESSION_ID]: clerkSessionId,
            [STORAGE_KEYS.SUBSCRIPTION_STATUS]: subscriptionStatus
          });
          console.log("Q-SCI Auth: Auth data stored successfully");
          const verification = await chrome.storage.local.get([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.USER_EMAIL,
            STORAGE_KEYS.USER_ID
          ]);
          console.log("Q-SCI Auth: Verification - data in storage:", {
            hasToken: !!verification[STORAGE_KEYS.AUTH_TOKEN],
            email: verification[STORAGE_KEYS.USER_EMAIL],
            userId: verification[STORAGE_KEYS.USER_ID]
          });
        } catch (error) {
          console.error("Q-SCI Auth: Error storing auth data:", error);
          throw error;
        }
      },
      /**
       * Fetch OpenAI API key from backend
       * This method retrieves the API key from the backend server
       * The backend should return the key based on the user's authentication token
       * @returns {Promise<string>} OpenAI API key
       */
      async getOpenAIApiKey() {
        console.log("Q-SCI Auth: getOpenAIApiKey() called");
        try {
          const user = await this.getCurrentUser();
          console.log("Q-SCI Auth: Current user:", user ? "logged in" : "not logged in");
          if (!user || !user.token) {
            const errorMsg = "No authentication token found. Please login first.";
            console.error("Q-SCI Auth:", errorMsg);
            throw new Error(errorMsg);
          }
          console.log("Q-SCI Auth: Fetching OpenAI API key from backend...");
          console.log("Q-SCI Auth: API endpoint:", `${API_BASE_URL}/auth/openai-key`);
          console.log("Q-SCI Auth: Using token (first 20 chars):", user.token.substring(0, 20) + "...");
          const response = await fetch(`${API_BASE_URL}/auth/openai-key`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${user.token}`,
              "Content-Type": "application/json"
            }
          });
          console.log("Q-SCI Auth: Backend response status:", response.status);
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Q-SCI Auth: Failed to fetch API key from backend:", response.status, errorText);
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
          console.log("Q-SCI Auth: Response data received:", data ? "yes" : "no");
          if (!data.api_key) {
            console.error("Q-SCI Auth: No API key in response:", data);
            throw new Error("Backend did not return an API key. Please ensure the OPENAI_API_KEY environment variable is set on Vercel.");
          }
          console.log("Q-SCI Auth: OpenAI API key fetched successfully (length:", data.api_key.length, ")");
          return data.api_key;
        } catch (error) {
          console.error("Q-SCI Auth: Error fetching OpenAI API key:", error);
          console.error("Q-SCI Auth: Error details:", {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
          });
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            throw new Error("Unable to connect to backend. Please check your internet connection and ensure the backend is running.");
          }
          throw error;
        }
      }
    };
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
          if (lastDate !== today) {
            await this._resetDailyUsage();
            return 0;
          }
          return usage;
        } catch (error) {
          console.error("Q-SCI Usage: Error getting daily usage:", error);
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
          console.log("Q-SCI Usage: Incremented to", newUsage);
          return newUsage;
        } catch (error) {
          console.error("Q-SCI Usage: Error incrementing usage:", error);
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
          let limit;
          if (subscriptionStatus === "subscribed") {
            limit = USAGE_LIMITS.SUBSCRIBED;
          } else if (subscriptionStatus === "past_due") {
            limit = USAGE_LIMITS.PAST_DUE;
          } else {
            limit = USAGE_LIMITS.FREE;
          }
          const remaining = Math.max(0, limit - usage);
          return {
            canAnalyze: usage < limit,
            remaining,
            limit,
            used: usage
          };
        } catch (error) {
          console.error("Q-SCI Usage: Error checking if can analyze:", error);
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
        console.log("Q-SCI Usage: Reset daily usage for new day");
      },
      /**
       * Get today's date as YYYY-MM-DD string
       * @private
       */
      _getTodayDate() {
        const now = /* @__PURE__ */ new Date();
        return now.toISOString().split("T")[0];
      }
    };
    window.QSCIAuth = AuthService;
    window.QSCIUsage = UsageService;
    console.log("Q-SCI Auth: Module loaded");
  })();
})();
//# sourceMappingURL=bundle-auth.js.map
