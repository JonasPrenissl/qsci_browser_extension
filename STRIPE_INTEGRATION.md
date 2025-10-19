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

The extension determines subscription status by querying the backend API which checks Clerk's `privateMetadata.stripe_customer_id` field.

**Important:** `privateMetadata` is **only accessible server-side** and cannot be read by client-side JavaScript. Therefore, the extension must call the backend API to determine subscription status.

**Backend Logic:**
- If `privateMetadata.stripe_customer_id` exists → user is **subscribed**
- If `privateMetadata.stripe_customer_id` does NOT exist → user is **free**

**Supported subscription status values:**
- `"free"` - Free tier (10 analyses/day) - no stripe_customer_id in privateMetadata
- `"subscribed"` - Premium tier (100 analyses/day) - has stripe_customer_id in privateMetadata
- `"past_due"` - Payment issue, treated as free (10 analyses/day) - deprecated

### 2. Authentication Flow

When a user logs in via the extension:

1. User clicks "Login with Clerk" in extension popup
2. Clerk authentication window opens
3. User signs in/signs up
4. Extension receives Clerk session token
5. **Extension calls backend API** `/api/auth/subscription-status` with session token
6. Backend validates token and checks `privateMetadata.stripe_customer_id`
7. Backend returns subscription status based on presence of stripe_customer_id
8. Extension stores subscription status locally

**File:** `src/auth.js` (handleSignInSuccess function)
```javascript
// Fetch actual subscription status from backend
// The backend checks privateMetadata.stripe_customer_id to determine if user is subscribed
let subscriptionStatus = 'free';
try {
  const response = await fetch('https://www.q-sci.org/api/auth/subscription-status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    subscriptionStatus = data.subscription_status || 'free';
  }
} catch (error) {
  console.error('Error fetching subscription status:', error);
}
```

**File:** `auth.js` - `_storeAuthData()` method
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

The webhook handler must store the Stripe customer ID in Clerk's **privateMetadata** when a subscription is created or updated. This is critical because the extension determines subscription status by checking if `stripe_customer_id` exists in privateMetadata.

1. Verify webhook signature
2. Extract Clerk user ID from Customer metadata
3. For subscription events, store `stripe_customer_id` in Clerk's **privateMetadata**
4. Remove `stripe_customer_id` when subscription is canceled/deleted

**Important:** Store `stripe_customer_id` in **privateMetadata** (not publicMetadata) for security. The extension queries the backend API which can access privateMetadata server-side.

```javascript
// When subscription is created/updated
await clerkClient.users.updateUser(clerkUserId, {
  privateMetadata: {
    stripe_customer_id: customer.id  // Store Stripe customer ID
  },
  publicMetadata: {
    plan_id: subscription.items.data[0]?.price?.id,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
  }
});

// When subscription is canceled/deleted
await clerkClient.users.updateUser(clerkUserId, {
  privateMetadata: {
    stripe_customer_id: undefined  // Use undefined to delete the field
  }
});
```

**Example webhook handler implementation:**

```javascript
// Event handling
switch (event.type) {
  case "checkout.session.completed": {
    const session = event.data.object;
    const customer = await stripe.customers.retrieve(session.customer);
    const clerkUserId = customer.metadata.clerk_user_id;
    
    if (clerkUserId) {
      // Store stripe_customer_id in privateMetadata
      await clerkClient.users.updateUser(clerkUserId, {
        privateMetadata: {
          stripe_customer_id: customer.id
        }
      });
    }
    break;
  }

  case "customer.subscription.created":
  case "customer.subscription.updated": {
    const subscription = event.data.object;
    const customer = await stripe.customers.retrieve(subscription.customer);
    const clerkUserId = customer.metadata.clerk_user_id;
    
    if (clerkUserId) {
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        // Active subscription - store stripe_customer_id
        await clerkClient.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripe_customer_id: customer.id
          },
          publicMetadata: {
            plan_id: subscription.items.data[0]?.price?.id,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          }
        });
      } else {
        // Subscription not active - remove stripe_customer_id
        await clerkClient.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripe_customer_id: undefined  // Use undefined to delete the field
          }
        });
      }
    }
    break;
  }
  
  case "customer.subscription.deleted": {
    const subscription = event.data.object;
    const customer = await stripe.customers.retrieve(subscription.customer);
    const clerkUserId = customer.metadata.clerk_user_id;
    
    if (clerkUserId) {
      // Remove stripe_customer_id when subscription is deleted
      await clerkClient.users.updateUser(clerkUserId, {
        privateMetadata: {
          stripe_customer_id: undefined  // Use undefined to delete the field
        }
      });
    }
    break;
  }
}
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

This endpoint is **critical** for the extension to determine subscription status correctly. It must:

1. Verify Clerk session token from Authorization header
2. Get Clerk user ID from the verified token
3. **Query Clerk's `privateMetadata.stripe_customer_id`** for the user
4. Determine subscription status:
   - If `stripe_customer_id` exists in privateMetadata → return `"subscribed"`
   - If `stripe_customer_id` does NOT exist → return `"free"`
5. Return subscription details

**Example Implementation:**
```javascript
app.get('/api/auth/subscription-status', async (req, res) => {
  try {
    // Verify Clerk session token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = await clerkClient.sessions.verifyToken(token);
    
    // Get user from Clerk
    const user = await clerkClient.users.getUser(session.userId);
    
    // Check privateMetadata for stripe_customer_id
    const stripeCustomerId = user.privateMetadata?.stripe_customer_id;
    
    // Determine subscription status based on stripe_customer_id
    let subscriptionStatus = 'free';
    if (stripeCustomerId) {
      subscriptionStatus = 'subscribed';
    }
    
    // Optionally, query Stripe to get more details
    let planId = null;
    let currentPeriodEnd = null;
    
    if (stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'active',
          limit: 1
        });
        
        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          planId = subscription.items.data[0]?.price?.id;
          currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        } else {
          // Customer exists but no active subscription
          subscriptionStatus = 'free';
        }
      } catch (error) {
        console.error('Error querying Stripe:', error);
        // Even if Stripe query fails, we know they have a customer ID
        // so we can still return subscribed
      }
    }
    
    return res.json({
      subscription_status: subscriptionStatus,
      plan_id: planId,
      current_period_end: currentPeriodEnd
    });
    
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
});
```

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
4. Extension calls backend API to check subscription status
5. Backend checks privateMetadata.stripe_customer_id
6. Extension automatically loads "Premium" status if stripe_customer_id exists
7. Shows 100 analyses/day limit

## Testing

### Test Free User

In Clerk Dashboard:
1. Go to Users → Select user → **Private metadata** (not Public metadata)
2. Ensure `stripe_customer_id` is **not present** or set to `null`
3. In extension, logout and login again (or click "Refresh Status")
4. Verify extension shows "Free" and 10/day limit

### Test Premium User

In Clerk Dashboard:
1. Go to Users → Select user → **Private metadata**
2. Set:
```json
{
  "stripe_customer_id": "cus_test123456"
}
```
3. In extension, logout and login again (or click "Refresh Status")
4. Verify extension shows "Premium"/"Subscribed" and 100/day limit

### Test Subscription Flow

1. Create test Stripe account
2. Configure webhook to test endpoint
3. Use Stripe test mode checkout
4. Complete test payment
5. Verify webhook updates Clerk **privateMetadata** with `stripe_customer_id`
6. In extension, click "Refresh Status" or logout and login again
7. Verify status updates to "Premium"/"Subscribed"

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

**Problem:** User subscribed but extension still shows "Free"/"Kostenlos"

**Solutions:**
1. Check Clerk **privateMetadata.stripe_customer_id** was set by webhook
   - Go to Clerk Dashboard → Users → Select user → Private metadata
   - Verify `stripe_customer_id` field exists and has a valid value
2. Click "Refresh Status" button in extension OR logout and login again
3. Verify backend `/api/auth/subscription-status` endpoint is working:
   - Check it reads from `privateMetadata.stripe_customer_id`
   - Verify it returns `"subscribed"` when stripe_customer_id exists
4. Check browser console for errors in the extension popup
5. Test the backend API directly with curl:
   ```bash
   curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
        https://www.q-sci.org/api/auth/subscription-status
   ```

### Webhook Not Firing

**Problem:** Stripe payment completed but Clerk privateMetadata not updated

**Solutions:**
1. Verify webhook URL in Stripe Dashboard
2. Check webhook signature secret matches
3. Review webhook logs in Stripe Dashboard
4. Ensure backend endpoint is accessible from internet
5. Verify webhook handler updates **privateMetadata.stripe_customer_id** (not just publicMetadata)

### Usage Limit Not Applied

**Problem:** User can analyze more than their limit

**Solutions:**
1. Verify subscription status in local storage:
   - Chrome DevTools → Application → Local Storage → Extension ID
   - Check `qsci_subscription_status` value
2. Check usage counter in Chrome DevTools → Application → Storage
3. Ensure `subscription_status` is exactly `"free"` or `"subscribed"`
4. Clear extension data and re-login

### Extension Always Shows "Kostenlos" (Free)

**Problem:** Extension always shows free status even for subscribed users

**Root Causes:**
1. Backend `/api/auth/subscription-status` endpoint not implemented correctly
2. Webhook not updating `privateMetadata.stripe_customer_id` in Clerk
3. Extension cannot reach backend API (CORS or network issues)

**Solutions:**
1. Implement/fix backend endpoint to check `privateMetadata.stripe_customer_id`
2. Update webhook handler to set `privateMetadata.stripe_customer_id` on subscription creation
3. Check CORS configuration on backend API
4. Test backend endpoint manually with valid Clerk token

## Migration Notes

### From publicMetadata to privateMetadata

If migrating from the old implementation that used `publicMetadata.subscription_status`:

1. **Update Webhook Handler**: Change to store `stripe_customer_id` in privateMetadata
2. **Update Backend API**: Implement `/api/auth/subscription-status` to read from privateMetadata
3. **Existing Subscribers**: 
   - For each existing subscriber, set `privateMetadata.stripe_customer_id` to their Stripe customer ID
   - Can be done via Clerk API or dashboard
4. **Testing**: Test thoroughly with both free and subscribed test users
5. **Deploy**: Deploy backend changes before updating extension
6. **Communicate**: Users may need to logout and login again to see updated status

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
