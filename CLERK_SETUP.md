# Clerk Integration Setup Guide

This guide will help you set up Clerk authentication for the Q-SCI browser extension.

## Step 1: Create a Clerk Account

1. Go to https://clerk.com
2. Sign up for a free account
3. Create a new application

## Step 2: Get Your Clerk Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Note your **Frontend API** URL (e.g., `your-app-name.clerk.accounts.dev`)

## Step 3: Configure Clerk Keys

The Clerk SDK is now bundled locally. To update your Clerk publishable key:

1. Open `src/clerk-auth-main.js`
2. Find the line with `new Clerk(...)` (around line 58)
3. Replace the publishable key:

```javascript
// FROM:
const clerk = new Clerk('YOUR_CURRENT_KEY');

// TO:
const clerk = new Clerk('pk_test_your_actual_key_here');
```

4. Rebuild the bundles:
```bash
npm install  # if you haven't already
npm run build
```

This will update `js/clerk-auth.js` with your new key.

**Note**: The Clerk SDK is bundled locally instead of loaded from a CDN, which improves security and reliability.

## Step 4: Configure Clerk Application Settings

In your Clerk dashboard:

1. **Allowed Redirect URLs**: Add the following URLs:
   - `chrome-extension://[YOUR_EXTENSION_ID]/clerk-auth.html`
     - You'll get your extension ID after loading it in Chrome
     - Example: `chrome-extension://abcdefghijklmnopqrstuvwxyz123456/clerk-auth.html`
   - `https://www.q-sci.org/auth-callback`
     - This is required to prevent the "Redirect URL is not on one of the allowedRedirectOrigins" warning
     - Go to **Paths** in your Clerk dashboard
     - Under **Allowed redirect origins**, add `https://www.q-sci.org/auth-callback`

2. **Enable Sign Up**: Make sure sign-up is enabled if you want users to register

3. **Authentication Methods**: Configure which methods to enable (Email/Password, Google, etc.)

## Step 5: Set Up User Metadata

The extension expects users to have a `subscription_status` field in their public metadata.

### Option A: Via Clerk Dashboard

1. Go to **Users** in Clerk dashboard
2. Select a user
3. Click on **Public metadata**
4. Add:
   ```json
   {
     "subscription_status": "free"
   }
   ```
   or
   ```json
   {
     "subscription_status": "subscribed"
   }
   ```

### Option B: Via Clerk API (when user subscribes)

```javascript
import { clerkClient } from '@clerk/clerk-sdk-node';

// When a user subscribes
await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    subscription_status: "subscribed"
  }
});

// When a subscription expires
await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    subscription_status: "free"
  }
});
```

### Option C: Via Webhook (Recommended for Production)

Set up a webhook to automatically update subscription status:

1. In Clerk dashboard, go to **Webhooks**
2. Create a new webhook endpoint
3. Listen for relevant events (e.g., custom events from your payment provider)
4. Update user metadata when subscription changes

## Step 6: Testing the Integration

### Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder
5. Note your extension ID (shown in the extension card)

### Update Clerk Settings

1. Go back to Clerk dashboard
2. Add your extension's redirect URL (from Step 4)
3. Save changes

### Test Authentication

1. Click the extension icon
2. Click "Login with Clerk"
3. A pop-up window should open
4. Complete the sign-in or sign-up process
5. The window should close and you should be logged in

### Verify Storage

1. Open Chrome DevTools console
2. Run:
   ```javascript
   chrome.storage.local.get(null, (data) => console.log(data));
   ```
3. You should see:
   - `qsci_auth_token`
   - `qsci_user_email`
   - `qsci_user_id`
   - `qsci_clerk_session_id`
   - `qsci_subscription_status`

## Usage Limits

The extension enforces these limits based on subscription status:

- **Free users**: 10 analyses per day
- **Subscribed users**: 100 analyses per day

Make sure to set `subscription_status` in user metadata to control this.

## Troubleshooting

### Warning: "Redirect URL is not on one of the allowedRedirectOrigins"

This warning appears when `https://www.q-sci.org/auth-callback` is not configured in Clerk:

**Solution:**
1. Go to your Clerk dashboard
2. Navigate to **Paths** or **Authentication** settings
3. Find **Allowed redirect origins** or **Redirect URLs**
4. Add `https://www.q-sci.org/auth-callback`
5. Save changes

The extension uses this URL as a fallback redirect URL for Clerk authentication. While the actual authentication uses `postMessage` communication, Clerk requires this URL to be whitelisted.

### Warning: "Clerk has been loaded with development keys"

This warning appears when using test/development keys in production:

**Issue:**
```
Clerk: Clerk has been loaded with development keys. Development instances have 
strict usage limits and should not be used when deploying your application to production.
```

**Solution:**
1. Get your production publishable key from Clerk dashboard
   - It should start with `pk_live_` instead of `pk_test_`
2. Update `src/clerk-auth-main.js` (around line 61):
   ```javascript
   const clerk = new Clerk('pk_live_YOUR_PRODUCTION_KEY_HERE');
   ```
3. Rebuild the extension:
   ```bash
   npm run build
   ```
4. Reload the extension in Chrome

Development keys have strict usage limits and should only be used for testing.

### Warning: "Missing element" Console Warnings

If you see console warnings like:
```
Q-SCI Debug Popup: Missing element 'journalCategory'
Q-SCI Debug Popup: Missing element 'detailedQualityCircle'
```

These are informational warnings that occur during element initialization. The elements exist in the HTML but may not be visible initially (they're in the detailed analysis section which is hidden by default). These warnings are harmless and can be ignored.

### Pop-up Blocked

- Make sure Chrome's pop-up blocker allows pop-ups from extensions
- Try clicking the login button again

### Authentication Not Working

1. Check browser console for errors
2. Verify Clerk publishable key is correct
3. Verify Frontend API URL is correct
4. Make sure redirect URL is configured in Clerk

### Subscription Status Not Showing

1. Check user's public metadata in Clerk dashboard
2. Verify `subscription_status` field exists and is either "free" or "subscribed"
3. Log out and log in again to refresh

### Session Token Issues

- Clerk tokens expire automatically
- The extension currently trusts stored tokens
- For production, consider implementing token refresh or verification

## Production Checklist

- [ ] **IMPORTANT**: Replace test publishable key with live/production key
  - Development keys (starting with `pk_test_`) have strict usage limits
  - Production keys (starting with `pk_live_`) should be used for production deployments
  - Update the key in `src/clerk-auth-main.js` and rebuild with `npm run build`
- [ ] Update Frontend API URL to production
- [ ] Configure production redirect URLs (including `https://www.q-sci.org/auth-callback`)
- [ ] Set up webhook for subscription status updates
- [ ] Implement proper error handling for expired sessions
- [ ] Add analytics/logging for auth events
- [ ] Test with real users
- [ ] Document subscription upgrade flow
- [ ] Set up customer support for auth issues

## Security Best Practices

1. **Never commit keys**: Keep publishable keys in configuration, not in code
2. **Use environment-specific keys**: Different keys for development/production
3. **Validate tokens**: Consider adding backend validation for sensitive operations
4. **Monitor sessions**: Set up alerts for unusual authentication patterns
5. **Regular updates**: Keep Clerk SDK updated to latest version

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk JavaScript SDK](https://clerk.com/docs/references/javascript/overview)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Clerk User Metadata](https://clerk.com/docs/users/metadata)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)
