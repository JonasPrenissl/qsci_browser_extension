# Session Persistence Configuration Guide

## Problem
Users were experiencing session expiration during analysis or when asking questions about papers. This happened because Clerk's default JWT session tokens expire after a short period (typically 1 hour).

## Solution
The extension now implements session persistence through multiple layers:

### 1. Token Timestamp Tracking (Implemented)
The extension now tracks when tokens are created:
- **Token timestamp storage**: Records when each token was created
- **Background monitoring**: Checks token age every 12 hours
- **Logging**: Warns in console when tokens are getting old (23+ hours)

This helps with debugging and understanding session expiration issues.

### 2. Clerk Dashboard Configuration (Primary Solution - REQUIRED)
To ensure sessions last at least 24 hours, you **must** configure Clerk's session settings in the Clerk Dashboard. This is the PRIMARY solution to the session expiration problem.

#### Step 1: Access Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Sessions** in the left sidebar

#### Step 2: Configure Session Lifetime
Set the following values:

- **Session lifetime**: `86400` seconds (24 hours) or longer
  - This controls how long a user stays signed in
  - Recommended: 7 days (604800 seconds) for better UX
  - Maximum: 30 days (2592000 seconds)

- **Inactivity timeout**: `86400` seconds (24 hours) or longer
  - This controls when inactive users are signed out
  - Recommended: 24 hours minimum
  - Can be set to same as session lifetime for best UX

#### Step 3: Configure JWT Template
1. Navigate to **JWT Templates** in the Clerk Dashboard
2. Edit your default template (or create a new one)
3. Set **Token lifetime** to `86400` seconds (24 hours) or more

**Important**: The JWT token lifetime in the template must match or exceed your session lifetime for proper functionality.

#### Example Configuration (Recommended):
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
4. Extension receives JWT token from Clerk
5. Token + timestamp stored in chrome.storage.local

#### Token Monitoring (Background):
1. Background service worker checks token age every 12 hours
2. If token is older than 23 hours:
   - Logs warning in console
   - Suggests user may need to re-login soon
3. If token is fresh:
   - Logs "Token is still fresh" message

**Note**: The background monitoring currently only logs warnings. It does NOT automatically refresh tokens. The primary solution is to configure Clerk Dashboard with long-lived tokens so refresh isn't needed.

#### Fallback on API Calls:
1. When making API calls, if 401 Unauthorized is received:
2. Extension attempts to verify authentication with backend
3. If backend confirms session is valid, retries the request
4. If session truly expired, user is prompted to log in again with a clear message

### 4. Technical Details

#### Files Modified:
- `background.js`: Added token age monitoring and alarm system
- `auth.js`: Added token timestamp tracking in STORAGE_KEYS
- `src/clerk-auth-main.js`: Added timestamp storage on login
- `manifest.json`: Added `alarms` permission for periodic checks

#### Storage Keys:
- `qsci_auth_token`: The JWT session token from Clerk
- `qsci_auth_token_timestamp`: Unix timestamp when token was created/refreshed

#### Alarms:
- `tokenRefresh`: Fires every 12 hours to check and log token age

#### Background Monitoring:
- Checks token age on service worker startup
- Checks token age every 12 hours via alarm
- Logs warnings when token is 23+ hours old
- Does NOT automatically refresh (requires Clerk Dashboard config instead)

### 5. Testing

To verify session persistence:

1. **Configure Clerk Dashboard First**:
   - Follow steps in Section 2 above
   - Set session lifetime to 7 days
   - Set JWT template lifetime to 24 hours
   - This is the MOST IMPORTANT step

2. **Login and verify**:
   - Log in to the extension
   - Check chrome.storage.local for `qsci_auth_token_timestamp`
   - Note the timestamp value

3. **Monitor token age**:
   - Open Chrome DevTools for the service worker
   - Navigate to `chrome://extensions` > Q-SCI extension > Service Worker > Inspect
   - Look for logs like:
     ```
     Q-SCI Background: Token is still fresh
     ```
   - After 23+ hours, should see:
     ```
     Q-SCI Background: Token is older than 23 hours
     Q-SCI Background: User may need to log in again soon
     ```

4. **Test analysis after 24+ hours**:
   - Wait 24+ hours after login (or set system clock forward for testing)
   - Try to analyze a paper
   - If Clerk Dashboard is configured correctly with long session lifetime (7 days):
     - ✅ Analysis should work without re-login
   - If using default 1-hour token lifetime:
     - ❌ Will get 401 error and be asked to log in again

### 6. Troubleshooting

**Session still expires quickly?**
- ✅ Check Clerk Dashboard session settings (see Step 2 above)
- ✅ Verify JWT template has correct lifetime (24 hours minimum)
- ✅ Check browser console for token age logs
- ⚠️ **Most common issue**: Clerk Dashboard not configured - this is REQUIRED

**Token monitoring not working?**
- Verify extension has `alarms` permission in manifest
- Check service worker console for alarm logs
- Alarms fire every 12 hours - may need to wait

**401 errors during analysis?**
- This is expected if Clerk Dashboard has default short sessions
- Configure Clerk Dashboard per Section 2
- User will see helpful error: "Your session has expired. Please click 'Login with Clerk' to sign in again."

### 7. Best Practices

1. **For Development**:
   - Use shorter session lifetimes (1-2 hours) for testing auth flows
   - Monitor background logs to verify token monitoring works
   - Test expiration scenarios

2. **For Production**:
   - ✅ Set session lifetime to 7 days (604800 seconds)
   - ✅ Set inactivity timeout to 24 hours minimum
   - ✅ Set JWT token lifetime to 24 hours (86400 seconds)
   - ✅ This configuration prevents session expiration during normal use

3. **Security Considerations**:
   - Longer sessions improve UX but reduce security
   - Balance between convenience and security based on your threat model
   - 7-day session + 24-hour inactivity timeout is a good balance
   - JWT tokens are stored in chrome.storage.local (more secure than localStorage)
   - Tokens are never logged to console in production

### 8. Future Improvements

Potential enhancements for even better session persistence:

1. **Automatic token refresh**: Implement backend endpoint for token renewal
2. **Cross-tab session sharing**: Share session across multiple extension instances  
3. **Remember me option**: Let users choose session duration
4. **Session status indicator**: Show token expiration countdown in UI
5. **Background token refresh**: Refresh tokens automatically without user interaction

## Summary

The solution to session expiration has two parts:

### Part 1: Clerk Dashboard Configuration (PRIMARY - Required)
- Configure Clerk Dashboard with long-lived sessions (7 days)
- Configure JWT templates with long-lived tokens (24 hours)
- **This is the main fix - without this, sessions will still expire**

### Part 2: Extension Improvements (SECONDARY - Already Implemented)
- Token timestamp tracking for debugging
- Background monitoring that logs token age
- Better error messages when tokens expire
- Foundation for future automatic refresh

With these changes, users should experience:
- ✅ Sessions lasting 7 days (if Clerk Dashboard configured correctly)
- ✅ JWT tokens lasting 24 hours (if Clerk Dashboard configured correctly)
- ✅ Clear error messages when re-login is needed
- ✅ Token age monitoring for debugging
- ✅ No interruptions during analysis (for up to 7 days)
- ✅ Better overall user experience

**Critical**: The Clerk Dashboard configuration (Part 1) is **required** for this to work. The extension improvements alone are not sufficient.
