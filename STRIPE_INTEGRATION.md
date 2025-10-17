# Stripe + Clerk Subscription Integration

This document explains how the Q-SCI browser extension integrates with Stripe for subscription management through Clerk authentication.

## Overview

The subscription flow follows this architecture:

```
Frontend (q-sci.org) → Backend API → Stripe → Webhook → Clerk publicMetadata → Browser Extension
```

### Key Components

1. **Frontend (React)**: Collects Clerk user ID and initiates Stripe Checkout
2. **Backend (Express/Node)**: Creates Stripe Customer and Checkout Session
3. **Stripe Webhooks**: Updates subscription status in Clerk
4. **Browser Extension**: Reads subscription status from Clerk publicMetadata

## Browser Extension Integration

### 1. Subscription Status Storage

The extension reads subscription status from Clerk's `publicMetadata.subscription_status` field during authentication.

**Supported values:**
- `"free"` - Free tier (10 analyses/day)
- `"subscribed"` - Premium tier (100 analyses/day)

### 2. Authentication Flow

When a user logs in via the extension:

1. User clicks "Login with Clerk" in extension popup
2. Clerk authentication window opens
3. User signs in/signs up
4. Extension receives user data including `publicMetadata.subscription_status`
5. Extension stores subscription status locally

**File:** `clerk-auth.html` (lines 230-232)
```javascript
const subscriptionStatus = user.publicMetadata?.subscription_status || 'free';
```

**File:** `auth.js` (lines 268-276)
```javascript
async _storeAuthData({ token, email, userId, clerkSessionId, subscriptionStatus }) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.AUTH_TOKEN]: token,
    [STORAGE_KEYS.USER_EMAIL]: email,
    [STORAGE_KEYS.USER_ID]: userId,
    [STORAGE_KEYS.CLERK_SESSION_ID]: clerkSessionId,
    [STORAGE_KEYS.SUBSCRIPTION_STATUS]: subscriptionStatus
  });
}
```

### 3. Subscription Status Refresh

The extension provides a manual refresh function to update subscription status after payment.

**File:** `auth.js` - `refreshSubscriptionStatus()` method

This function:
- Calls backend API endpoint `/api/auth/subscription-status`
- Backend queries Clerk for latest `publicMetadata.subscription_status`
- Updates local storage with new status

**Usage in popup:**
```javascript
await window.QSCIAuth.refreshSubscriptionStatus();
```

### 4. UI Components

#### Popup (popup.html)

**User Status Display** (lines 44-69):
- Shows subscription badge (Free/Premium)
- Displays usage counter (X / Y analyses)
- Shows upgrade prompt for free users
- Provides "Refresh Status" button

**Subscribe Button:**
```html
<a href="https://www.q-sci.org/subscribe" target="_blank">
  Subscribe Now
</a>
```

#### Options Page (options.html)

**Subscription Management Section:**
- Current plan display
- Refresh subscription button
- Upgrade to Premium link

### 5. Usage Limits

**File:** `auth.js` (lines 28-31)
```javascript
const USAGE_LIMITS = {
  FREE: 10,           // Free users: 10 analyses per day
  SUBSCRIBED: 100     // Subscribed users: 100 analyses per day
};
```

The extension enforces these limits before allowing paper analysis.

## Backend Requirements

For the extension to work with Stripe subscriptions, your backend needs:

### 1. Checkout Session Creation

**Endpoint:** `POST /api/checkout`

**Request:**
```json
{
  "clerkUserId": "user_xxxxx",
  "priceId": "price_xxxxx",
  "successUrl": "https://q-sci.org/account?status=success",
  "cancelUrl": "https://q-sci.org/pricing?status=cancel"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Implementation:**
- Get/create Stripe Customer with `metadata.clerk_user_id`
- Create Checkout Session with customer ID
- Set `client_reference_id` to Clerk user ID (fallback)

### 2. Webhook Handler

**Endpoint:** `POST /api/webhooks/stripe`

**Events to handle:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Implementation:**
1. Verify webhook signature
2. Extract Clerk user ID from Customer metadata
3. Map Stripe subscription status to app status:
   - `active`, `trialing` → `"subscribed"`
   - `canceled`, `unpaid`, `incomplete_expired` → `"free"`
4. Update Clerk user's `publicMetadata`:

```javascript
await clerkClient.users.updateUser(clerkUserId, {
  publicMetadata: {
    subscription_status: "subscribed", // or "free"
    plan_id: subscription.items.data[0]?.price?.id,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
  }
});
```

### 3. Subscription Status Endpoint

**Endpoint:** `GET /api/auth/subscription-status`

**Headers:**
```
Authorization: Bearer <clerk-session-token>
```

**Response:**
```json
{
  "subscription_status": "subscribed",
  "plan_id": "price_xxxxx",
  "current_period_end": "2024-01-31T23:59:59.000Z"
}
```

**Implementation:**
1. Verify Clerk session token
2. Get Clerk user ID from token
3. Query Clerk user's `publicMetadata.subscription_status`
4. Return subscription details

## Extension Workflow

### New User Flow

1. User installs extension
2. Clicks "Login with Clerk"
3. Signs up with Clerk
4. Extension shows "Free" status with 10 analyses/day
5. User clicks "Subscribe Now"
6. Redirected to q-sci.org/subscribe
7. Completes Stripe Checkout
8. Webhook updates Clerk metadata
9. User clicks "Refresh Status" in extension
10. Extension shows "Premium" status with 100 analyses/day

### Existing Subscriber Flow

1. User installs extension
2. Clicks "Login with Clerk"
3. Signs in with existing account
4. Extension automatically loads "Premium" status from Clerk
5. Shows 100 analyses/day limit

## Testing

### Test Free User

In Clerk Dashboard:
1. Go to Users → Select user → Public metadata
2. Set:
```json
{
  "subscription_status": "free"
}
```
3. In extension, click "Refresh Status"
4. Verify shows "Free" and 10/day limit

### Test Premium User

In Clerk Dashboard:
1. Go to Users → Select user → Public metadata
2. Set:
```json
{
  "subscription_status": "subscribed",
  "plan_id": "price_xxxxx",
  "current_period_end": "2024-12-31T23:59:59.000Z"
}
```
3. In extension, click "Refresh Status"
4. Verify shows "Premium" and 100/day limit

### Test Subscription Flow

1. Create test Stripe account
2. Configure webhook to test endpoint
3. Use Stripe test mode checkout
4. Complete test payment
5. Verify webhook updates Clerk metadata
6. Click "Refresh Status" in extension
7. Verify status updates to "Premium"

## Security Considerations

### Extension Security

1. **No Stripe Keys**: Extension never touches Stripe API keys
2. **Clerk Session**: Uses Clerk session tokens for authentication
3. **Read-Only**: Extension only reads subscription status, never writes
4. **Local Storage**: Sensitive data stored in Chrome's secure local storage

### Backend Security

1. **Webhook Signature**: Always verify Stripe webhook signatures
2. **Clerk Validation**: Validate Clerk session tokens
3. **Rate Limiting**: Implement rate limits on subscription endpoints
4. **HTTPS Only**: All endpoints must use HTTPS

## Troubleshooting

### Subscription Status Not Updating

**Problem:** User subscribed but extension still shows "Free"

**Solutions:**
1. Check Clerk metadata was updated by webhook
2. Click "Refresh Status" button in extension
3. Verify backend `/api/auth/subscription-status` returns correct data
4. Check browser console for errors

### Webhook Not Firing

**Problem:** Stripe payment completed but Clerk not updated

**Solutions:**
1. Verify webhook URL in Stripe Dashboard
2. Check webhook signature secret matches
3. Review webhook logs in Stripe Dashboard
4. Ensure backend endpoint is accessible from internet

### Usage Limit Not Applied

**Problem:** User can analyze more than their limit

**Solutions:**
1. Verify subscription status in local storage
2. Check usage counter in Chrome DevTools → Application → Storage
3. Ensure `subscription_status` is exactly `"free"` or `"subscribed"`
4. Clear extension data and re-login

## Migration Notes

### From Manual to Automated

If migrating from manual subscription management:

1. **Existing Users**: Set `publicMetadata.subscription_status` for all users
2. **Backend Setup**: Implement webhook handler before enabling Stripe
3. **Testing**: Test with Stripe test mode before production
4. **Communication**: Notify users about new automatic subscription management

### Environment Variables

**Backend (.env):**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLERK_SECRET_KEY=sk_live_...
```

**Extension:**
No environment variables needed. Extension reads from Clerk during authentication.

## Support

For issues with:
- **Extension**: Check browser console, verify Clerk configuration
- **Backend**: Check server logs, verify Stripe webhook logs
- **Clerk**: Check Dashboard → Webhooks, verify user metadata
- **Stripe**: Check Dashboard → Webhooks, test with Stripe CLI

## References

- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Chrome Extension Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
