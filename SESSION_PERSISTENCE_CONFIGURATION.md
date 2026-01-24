# Session Persistence Configuration Guide

## Problem
Users were experiencing session expiration during analysis or when asking questions about papers. This happened because Clerk's default JWT session tokens expire after a short period (typically 1 hour).

## Solution
The extension now implements multiple layers of session persistence:

### 1. Token Refresh Mechanism (Implemented)
The extension now includes automatic token refresh:
- **Background token monitoring**: Checks token age every 12 hours
- **Automatic refresh**: Refreshes tokens before they expire (at 23 hours)
- **Timestamp tracking**: Stores when each token was created to manage expiration

### 2. Clerk Dashboard Configuration (Required)
To ensure sessions last at least 24 hours, you **must** configure Clerk's session settings in the Clerk Dashboard:

#### Step 1: Access Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Sessions** in the left sidebar

#### Step 2: Configure Session Lifetime
Set the following values:

- **Session lifetime**: `86400` seconds (24 hours) or longer
  - This controls how long a user stays signed in
  - Recommended: 7 days (604800 seconds) for better UX

- **Inactivity timeout**: `86400` seconds (24 hours) or longer
  - This controls when inactive users are signed out
  - Recommended: 24 hours minimum

#### Step 3: Configure JWT Template
1. Navigate to **JWT Templates** in the Clerk Dashboard
2. Edit your default template (or create a new one)
3. Set **Token lifetime** to `86400` seconds (24 hours)

**Important**: The JWT token lifetime in the template must match or exceed your session lifetime for proper functionality.

#### Example Configuration:
```
Session Settings:
- Session lifetime: 604800 seconds (7 days)
- Inactivity timeout: 86400 seconds (24 hours)

JWT Template:
- Token lifetime: 86400 seconds (24 hours)
```

### 3. How It Works

#### Initial Login Flow:
1. User clicks "Login with Clerk" in the extension
2. Authentication page opens with Clerk SDK
3. User signs in
4. Extension receives and stores JWT token + timestamp in chrome.storage

#### Token Refresh Flow:
1. Background service worker checks token age every 12 hours
2. If token is older than 23 hours:
   - Attempts silent refresh via offscreen document
   - Uses existing Clerk session to get fresh token
   - Updates token and timestamp in chrome.storage
3. If refresh fails:
   - User will be prompted to log in again on next API call
   - No data is lost

#### Fallback on API Calls:
1. When making API calls, if 401 Unauthorized is received:
2. Extension attempts to verify and refresh authentication
3. If refresh succeeds, API call is retried
4. If refresh fails, user is prompted to log in again

### 4. Technical Details

#### Files Modified:
- `background.js`: Added token refresh logic and alarm system
- `auth.js`: Added token timestamp tracking
- `src/clerk-auth-main.js`: Added timestamp storage on login
- `manifest.json`: Added `alarms` and `offscreen` permissions

#### Storage Keys:
- `qsci_auth_token`: The JWT session token from Clerk
- `qsci_auth_token_timestamp`: Unix timestamp when token was created/refreshed

#### Alarms:
- `tokenRefresh`: Fires every 12 hours to check and refresh tokens

### 5. Testing

To verify session persistence:

1. **Login and wait**:
   - Log in to the extension
   - Wait for 2+ hours (or check after 12 hours)
   - Try to analyze a paper
   - Verify you're not asked to log in again

2. **Check background logs**:
   - Open Chrome DevTools for the service worker
   - Navigate to `chrome://extensions` > Q-SCI extension > Service Worker > Inspect
   - Look for logs like:
     ```
     Q-SCI Background: Token refresh alarm triggered
     Q-SCI Background: Token is still fresh
     ```

3. **Force refresh**:
   - Delete `qsci_auth_token_timestamp` from chrome.storage
   - Wait for next alarm (or restart extension)
   - Should see: `Q-SCI Background: Token needs refresh`

### 6. Troubleshooting

**Session still expires quickly?**
- Check Clerk Dashboard session settings (see Step 2 above)
- Verify JWT template has correct lifetime
- Check browser console for token refresh errors

**Token refresh fails?**
- Verify extension has `alarms` and `offscreen` permissions
- Check if Clerk session is still active on website
- User may need to log in again if Clerk session expired

**401 errors during analysis?**
- This is expected if token truly expired
- Extension will attempt refresh automatically
- If refresh fails, user sees helpful error message

### 7. Best Practices

1. **For Development**:
   - Use shorter session lifetimes (1-2 hours) for testing
   - Monitor background logs to verify refresh mechanism

2. **For Production**:
   - Set session lifetime to 7 days (604800 seconds)
   - Set inactivity timeout to 24 hours minimum
   - Set JWT token lifetime to 24 hours (86400 seconds)

3. **Security Considerations**:
   - Longer sessions improve UX but reduce security
   - Balance between convenience and security based on your threat model
   - JWT tokens are stored in chrome.storage.local (more secure than localStorage)
   - Tokens are never logged to console in production

### 8. Future Improvements

Potential enhancements for even better session persistence:

1. **Cross-tab session sharing**: Share session across multiple extension instances
2. **Background token refresh**: Refresh tokens in background without user interaction
3. **Remember me option**: Let users choose session duration
4. **Session status indicator**: Show token expiration countdown in UI

## Summary

With these changes, users should experience:
- ✅ Sessions lasting at least 24 hours (configurable in Clerk Dashboard)
- ✅ Automatic token refresh every 12 hours
- ✅ Graceful handling of expired tokens
- ✅ No interruptions during analysis or questioning
- ✅ Better overall user experience

The combination of Clerk Dashboard configuration and automatic token refresh ensures users can work uninterrupted for extended periods.
