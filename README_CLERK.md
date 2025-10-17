# Q-SCI Browser Extension - Clerk Integration

This extension now uses **Clerk** for user authentication and registration.

## What Changed?

Previously, the extension used a simple email/password login form. Now it uses Clerk's secure authentication service with a pop-up window flow.

## How It Works

1. **User clicks "Login with Clerk"** in the extension popup
2. **Pop-up window opens** with Clerk's authentication UI
3. **User signs in or signs up** using Clerk
4. **Extension receives authentication** data and stores it locally
5. **User can now analyze papers** based on their subscription status

## Usage Limits

- **Free users (registered)**: 10 analyses per day
- **Subscribed users (registered)**: 100 analyses per day

## Getting Started

### For Users

1. Install the extension in Chrome
2. Click the extension icon
3. Click "Login with Clerk"
4. Sign up or sign in through Clerk
5. Start analyzing scientific papers!

### For Developers

See [CLERK_SETUP.md](CLERK_SETUP.md) for detailed setup instructions.

Quick setup:
1. Create a Clerk account
2. Get your publishable key
3. Update `clerk-auth.html` with your Clerk keys
4. Configure API base URL (see below)
5. Load extension in Chrome
6. Test authentication flow

#### API Base Configuration

The extension connects to your backend API. By default, it uses `https://your-domain.com`.

**For local development**, override the API base URL:
- See [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md) for detailed instructions
- Quick override: Open extension background console and run:
  ```javascript
  chrome.storage.sync.set({ QSCI_API_BASE: 'http://localhost:5173' }, () => console.log('QSCI API base set'));
  ```
- Example config: See `extension-config.example.json` in the repo root

**For production**, update the default in `background_complex.js`:
- Change `let QSCI_API_BASE = 'https://your-domain.com';` to your actual domain

## Features

✅ Secure authentication via Clerk  
✅ No password handling in extension  
✅ Pop-up based authentication flow  
✅ Subscription status from Clerk user metadata  
✅ Daily usage tracking (10 or 100 analyses/day)  
✅ Automatic session persistence  
✅ Clean logout functionality  

## Architecture

```
┌─────────────┐
│  Extension  │
│   Popup     │
└──────┬──────┘
       │
       │ Opens pop-up
       ▼
┌─────────────┐
│    Clerk    │
│  Auth Page  │
└──────┬──────┘
       │
       │ User authenticates
       ▼
┌─────────────┐
│    Clerk    │
│   Service   │
└──────┬──────┘
       │
       │ Returns token & user data
       ▼
┌─────────────┐
│  Extension  │
│   Storage   │
└─────────────┘
```

## Files Changed

- **auth.js**: Updated to use Clerk pop-up authentication
- **popup.html**: Replaced email/password form with single login button
- **popup.js**: Updated login handler to open Clerk pop-up
- **manifest.json**: Added clerk-auth.html to web accessible resources
- **clerk-auth.html**: NEW - Clerk authentication page
- **CLERK_SETUP.md**: NEW - Setup instructions
- **AUTHENTICATION.md**: Updated with Clerk integration details

## Security

- All authentication is handled by Clerk
- Extension never sees or stores passwords
- Session tokens are stored locally in chrome.storage
- Clerk handles token expiration and security

## Documentation

- [CLERK_SETUP.md](CLERK_SETUP.md) - Setup instructions
- [AUTHENTICATION.md](AUTHENTICATION.md) - Technical documentation
- [FLOW_DIAGRAM.md](FLOW_DIAGRAM.md) - Authentication flow diagrams

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify Clerk configuration in clerk-auth.html
3. Ensure pop-ups are not blocked
4. See troubleshooting in CLERK_SETUP.md

## License

Same as main project license.
