# Q-SCI Browser Extension - Clerk Authentication Integration

This document describes the Clerk-based authentication and subscription system implemented in the Q-SCI browser extension.

## Overview

The extension now requires users to login via Clerk before performing paper analyses. The authentication system:

1. Opens a pop-up window with Clerk's authentication UI
2. Receives authentication tokens and user data from Clerk
3. Checks subscription status from Clerk user metadata
4. Enforces daily usage limits based on subscription status

## Features

### For Free Users (Registered)
- Must register and login via Clerk to use the extension
- Limited to **10 analyses per day**
- Can upgrade to premium subscription

### For Subscribed Users (Registered)
- Must register and login via Clerk to use the extension
- Can perform up to **100 analyses per day**
- Premium features and higher limits

## Clerk Integration

The extension uses Clerk for authentication. Here's how it works:

### 1. Authentication Flow

1. User clicks "Login with Clerk" button in the extension popup
2. Extension opens `clerk-auth.html` in a new pop-up window
3. User completes authentication through Clerk's UI (sign in or sign up)
4. Clerk authenticates the user and provides a session token
5. The auth page sends user data back to the extension via `postMessage`
6. Extension stores the session token and user information locally

### 2. User Data Structure

After successful authentication, the extension receives:

```javascript
{
  token: "clerk_session_token",
  email: "user@example.com",
  userId: "clerk_user_id",
  clerkSessionId: "clerk_session_id",
  subscriptionStatus: "free" | "subscribed"
}
```

### 3. Subscription Status

The subscription status is stored in Clerk's user metadata:
- **Free users**: `user.publicMetadata.subscription_status = "free"` (or undefined, defaults to "free")
- **Subscribed users**: `user.publicMetadata.subscription_status = "subscribed"`

You need to set this metadata in your Clerk dashboard or via Clerk's API when users subscribe.

## How It Works

### Authentication Flow

1. **Initial Load**: When the extension popup opens, it checks if the user is logged in
2. **Login Button**: If not logged in, displays a "Login with Clerk" button
3. **Pop-up Window**: User clicks login, extension opens Clerk auth page in a pop-up
4. **Clerk Authentication**: User signs in or signs up through Clerk's hosted UI
5. **Token Retrieval**: Clerk provides session token and user information
6. **Data Transfer**: Auth page sends data back to extension via `postMessage`
7. **Token Storage**: Extension stores auth data in `chrome.storage.local`
8. **Session Persistence**: Session persists across browser sessions until logout

### Usage Tracking

1. **Daily Reset**: Usage counters reset automatically at midnight (based on date)
2. **Local Storage**: Usage data is stored locally in `chrome.storage.local`
3. **Pre-Analysis Check**: Before each analysis, the extension checks:
   - Is user logged in?
   - What is their subscription status?
   - Have they reached their daily limit?
4. **Usage Increment**: After successful analysis, usage counter is incremented

### Storage Keys

The extension uses the following keys in `chrome.storage.local`:

- `qsci_auth_token`: Clerk session token
- `qsci_user_email`: User's email address
- `qsci_user_id`: Clerk user ID
- `qsci_clerk_session_id`: Clerk session ID
- `qsci_subscription_status`: Either "free" or "subscribed"
- `qsci_daily_usage`: Number of analyses performed today
- `qsci_last_usage_date`: Date of last analysis (YYYY-MM-DD format)

## UI Components

### Login Button
- Single "Login with Clerk" button
- Opens Clerk authentication in pop-up window
- Shows usage limits information (10/day free, 100/day subscribed)

### User Status Display
- User email
- Subscription badge (Free/Subscribed)
- Usage counter (e.g., "5 / 10")
- Logout button
- Upgrade prompt (for free users near limit)

## Error Handling

### Network Errors
- If backend is unreachable during verification, extension uses cached auth data
- User can continue using the extension offline (with cached subscription status)
- Login requires active internet connection

### Authentication Errors
- Invalid credentials: Clear error message shown to user
- Expired token: User is automatically logged out and shown login form
- Missing token: Login form is displayed

### Usage Limit Errors
- Free users reaching limit: Shown upgrade prompt with link to subscribe
- Subscribed users reaching limit: Informed to try again tomorrow

## Setting Up Clerk

### Prerequisites

1. Create a Clerk account at https://clerk.com
2. Create a new application in Clerk dashboard
3. Get your publishable key from Clerk dashboard

### Configuration

In `clerk-auth.html`, replace the following placeholders:

1. **Publishable Key**: Replace `YOUR_CLERK_PUBLISHABLE_KEY` (appears twice) with your actual Clerk publishable key
2. **Clerk Frontend API**: Replace `[your-clerk-frontend-api]` with your Clerk frontend API URL (e.g., `your-app.clerk.accounts.dev`)

### Setting Subscription Status

To set a user's subscription status in Clerk:

1. **Via Clerk Dashboard**:
   - Go to Users section
   - Select a user
   - Add/edit public metadata
   - Set `subscription_status` to either `"free"` or `"subscribed"`

2. **Via Clerk API**:
   ```javascript
   // Example: Update user metadata via Clerk Backend API
   await clerkClient.users.updateUser(userId, {
     publicMetadata: {
       subscription_status: "subscribed"
     }
   });
   ```

## Testing Without Clerk Setup

For development/testing without Clerk configured:

1. **Browser DevTools**: Use `chrome.storage.local` to manually set auth data for testing

Example manual auth setup in browser console:
```javascript
chrome.storage.local.set({
  'qsci_auth_token': 'test_token_123',
  'qsci_user_email': 'test@example.com',
  'qsci_user_id': 'test_user_id',
  'qsci_clerk_session_id': 'test_session_id',
  'qsci_subscription_status': 'subscribed'
});
```

## Integration Checklist

To integrate Clerk with your extension:

- [ ] Create Clerk account and application
- [ ] Get Clerk publishable key
- [ ] Update `clerk-auth.html` with your Clerk publishable key and frontend API URL
- [ ] Configure Clerk application settings (allowed redirect URLs, etc.)
- [ ] Set up user metadata structure in Clerk (subscription_status field)
- [ ] Implement subscription management workflow
- [ ] Test authentication flow end-to-end
- [ ] (Optional) Create backend endpoint to sync subscription status with Clerk
- [ ] (Optional) Implement webhook to update user metadata when subscription changes

## Security Considerations

1. **Clerk Security**: Clerk handles password hashing, secure authentication, and session management
2. **Session Tokens**: Clerk session tokens are stored locally in chrome.storage.local
3. **Pop-up Origin**: The extension verifies messages from the auth pop-up window
4. **Token Storage**: Tokens are stored in chrome.storage.local (local to user's machine)
5. **HTTPS Only**: Clerk enforces HTTPS for all authentication flows
6. **No Passwords in Extension**: Extension never handles or stores user passwords

## File Structure

```
qsci_browser_extension/
├── auth.js              # Authentication and usage tracking module (Clerk integration)
├── clerk-auth.html      # Clerk authentication page (opened in pop-up)
├── popup.html           # Popup UI with login button and user status
├── popup.js             # Popup logic with Clerk auth integration
├── manifest.json        # Updated with clerk-auth.html as web accessible resource
└── AUTHENTICATION.md    # This file
```

## Support

For questions or issues related to authentication:
- Check browser console for detailed error messages
- Verify Clerk configuration is correct
- Ensure pop-up blocker is not blocking the auth window
- Check that clerk-auth.html has the correct publishable key
- Verify subscription_status is set in user's publicMetadata in Clerk

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk JavaScript SDK](https://clerk.com/docs/references/javascript/overview)
- [Chrome Extension Messaging](https://developer.chrome.com/docs/extensions/mv3/messaging/)
