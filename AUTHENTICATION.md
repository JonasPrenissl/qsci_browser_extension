# Q-SCI Browser Extension - Authentication & Backend Integration

This document describes the authentication and subscription system implemented in the Q-SCI browser extension.

## Overview

The extension now requires users to login before performing paper analyses. The authentication system integrates with the q-sci.org backend to:

1. Verify user credentials
2. Check subscription status
3. Enforce daily usage limits

## Features

### For Free Users
- Must register and login to use the extension
- Limited to **10 analyses per day**
- Can upgrade to premium subscription

### For Subscribed Users
- Must register and login to use the extension
- Can perform up to **100 analyses per day**
- Premium features and higher limits

## Backend API Requirements

The extension expects the following API endpoints to be available on `https://www.q-sci.org/api`:

### 1. Login Endpoint

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "user_password"
}
```

**Response (Success - 200 OK):**
```json
{
  "token": "jwt_auth_token_here",
  "email": "user@example.com",
  "subscription_status": "free" | "subscribed"
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

### 2. Auth Verification Endpoint

**GET** `/api/auth/verify`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200 OK):**
```json
{
  "subscription_status": "free" | "subscribed"
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "message": "Invalid or expired token"
}
```

## How It Works

### Authentication Flow

1. **Initial Load**: When the extension popup opens, it checks if the user is logged in
2. **Login Form**: If not logged in, displays a login form
3. **Login**: User enters email/password, extension calls `/api/auth/login`
4. **Token Storage**: On successful login, auth token is stored in `chrome.storage.local`
5. **Auth Verification**: On subsequent loads, token is verified with `/api/auth/verify`
6. **Session Persistence**: Token persists across browser sessions until logout

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

- `qsci_auth_token`: JWT authentication token
- `qsci_user_email`: User's email address
- `qsci_subscription_status`: Either "free" or "subscribed"
- `qsci_daily_usage`: Number of analyses performed today
- `qsci_last_usage_date`: Date of last analysis (YYYY-MM-DD format)

## UI Components

### Login Form
- Email input field
- Password input field
- Login button
- Link to registration page on q-sci.org

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

## Testing Without Backend

For development/testing without a live backend:

1. **Mock Mode**: You can temporarily modify `auth.js` to return mock data
2. **Local Server**: Set up a local server at `http://localhost:5000/api` with the required endpoints
3. **Browser DevTools**: Use `chrome.storage.local` to manually set auth data for testing

Example manual auth setup in browser console:
```javascript
chrome.storage.local.set({
  'qsci_auth_token': 'test_token_123',
  'qsci_user_email': 'test@example.com',
  'qsci_subscription_status': 'subscribed'
});
```

## Integration Checklist

To integrate with your q-sci.org backend:

- [ ] Implement `/api/auth/login` endpoint
- [ ] Implement `/api/auth/verify` endpoint
- [ ] Set up JWT token generation and validation
- [ ] Create user registration page at `https://www.q-sci.org/register`
- [ ] Create subscription page at `https://www.q-sci.org/subscribe`
- [ ] Add CORS headers to allow extension origin
- [ ] Test authentication flow end-to-end
- [ ] Set up user database with email, password, and subscription status fields

## Security Considerations

1. **Password Security**: Passwords should be hashed (bcrypt/argon2) in the backend
2. **JWT Security**: Use secure JWT signing key, set appropriate expiration
3. **HTTPS Only**: All API calls must use HTTPS
4. **CORS**: Configure CORS to allow extension origin only
5. **Rate Limiting**: Implement rate limiting on login endpoint to prevent brute force
6. **Token Storage**: Tokens are stored in chrome.storage.local (local to user's machine)

## File Structure

```
qsci_browser_extension/
├── auth.js              # Authentication and usage tracking module
├── popup.html           # Popup UI with login form and user status
├── popup.js             # Popup logic with auth integration
├── manifest.json        # Updated with q-sci.org permissions
└── AUTHENTICATION.md    # This file
```

## Support

For questions or issues related to authentication:
- Check browser console for detailed error messages
- Verify q-sci.org backend is accessible
- Ensure API endpoints match the specification above
