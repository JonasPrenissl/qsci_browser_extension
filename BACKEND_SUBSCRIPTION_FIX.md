# Backend Implementation Required for Subscription Status Fix

## Problem
The browser extension was always showing "kostenlos" (free) status even for subscribed users because it was trying to read from `publicMetadata.subscription_status`, which wasn't being properly set.

## Solution
The extension now determines subscription status by checking if `privateMetadata.stripe_customer_id` exists in the Clerk user metadata. Since `privateMetadata` is only accessible server-side, the extension calls a backend API endpoint.

## What Changed in the Extension

### 1. Login Flow (`src/auth.js`)
When a user logs in, the extension now:
- Gets the Clerk session token
- **Calls backend API** `GET /api/auth/subscription-status` with the token
- Receives subscription status based on whether `stripe_customer_id` exists
- Stores the subscription status locally

### 2. Subscription Refresh (`auth.js`)
When a user clicks "Refresh Status", the extension:
- **Calls backend API** `GET /api/auth/subscription-status` 
- Updates local subscription status

## Required Backend Changes

### 1. Implement `/api/auth/subscription-status` Endpoint

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
  "current_period_end": "2024-12-31T23:59:59.000Z"
}
```

**Implementation Logic:**
1. Verify Clerk session token from Authorization header
2. Get user ID from verified token
3. Get user from Clerk API: `clerkClient.users.getUser(userId)`
4. Check `user.privateMetadata.stripe_customer_id`
5. If `stripe_customer_id` exists → return `"subscribed"`
6. If `stripe_customer_id` does NOT exist → return `"free"`

**Example Implementation (Node.js/Express):**
```javascript
const { clerkClient } = require('@clerk/clerk-sdk-node');

app.get('/api/auth/subscription-status', async (req, res) => {
  try {
    // Extract and verify token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify the session token with Clerk
    const session = await clerkClient.sessions.verifyToken(token, {
      // Note: Token verification uses the Clerk Secret Key (configured in clerkClient initialization)
      // No additional key parameter needed here
    });
    
    // Get user from Clerk
    const user = await clerkClient.users.getUser(session.userId);
    
    // Check privateMetadata for stripe_customer_id
    const stripeCustomerId = user.privateMetadata?.stripe_customer_id;
    
    // Determine subscription status
    let subscriptionStatus = 'free';
    let planId = null;
    let currentPeriodEnd = null;
    
    if (stripeCustomerId) {
      subscriptionStatus = 'subscribed';
      
      // Optionally query Stripe for more details
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
        }
      } catch (error) {
        console.error('Error querying Stripe:', error);
        // Still return subscribed even if Stripe query fails
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

### 2. Update Stripe Webhook Handler

The webhook handler must store `stripe_customer_id` in **privateMetadata** when subscriptions are created or updated.

**Events to handle:**
- `checkout.session.completed` - Store stripe_customer_id
- `customer.subscription.created` - Store stripe_customer_id
- `customer.subscription.updated` - Store or remove stripe_customer_id based on status
- `customer.subscription.deleted` - Remove stripe_customer_id

**Example Webhook Handler:**
```javascript
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customer = await stripe.customers.retrieve(session.customer);
      const clerkUserId = customer.metadata.clerk_user_id;
      
      if (clerkUserId) {
        await clerkClient.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripe_customer_id: customer.id
          }
        });
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
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
          // Inactive subscription - remove stripe_customer_id
          await clerkClient.users.updateUser(clerkUserId, {
            privateMetadata: {
              stripe_customer_id: undefined  // Use undefined to delete the field
            }
          });
        }
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);
      const clerkUserId = customer.metadata.clerk_user_id;
      
      if (clerkUserId) {
        await clerkClient.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripe_customer_id: undefined  // Use undefined to delete the field
          }
        });
      }
      break;
    }
  }

  res.json({ received: true });
});
```

## Testing

### 1. Test Free User
1. In Clerk Dashboard, go to Users → Select user → Private metadata
2. Ensure `stripe_customer_id` is NOT present (remove it if present)
3. Call the API endpoint with the user's token:
   ```bash
   curl -H "Authorization: Bearer USER_TOKEN" \
        https://www.q-sci.org/api/auth/subscription-status
   ```
4. Should return: `{"subscription_status": "free"}`
5. In extension, login with this user
6. Should show "Kostenlos" or "Free" with 10/day limit

### 2. Test Subscribed User
1. In Clerk Dashboard, go to Users → Select user → Private metadata
2. Set:
   ```json
   {
     "stripe_customer_id": "cus_test123456"
   }
   ```
3. Call the API endpoint:
   ```bash
   curl -H "Authorization: Bearer USER_TOKEN" \
        https://www.q-sci.org/api/auth/subscription-status
   ```
4. Should return: `{"subscription_status": "subscribed"}`
5. In extension, login with this user
6. Should show "Abonniert" or "Subscribed" with 100/day limit

### 3. Test Full Flow
1. Use Stripe test mode
2. Create a test subscription
3. Verify webhook sets `privateMetadata.stripe_customer_id`
4. Login to extension
5. Should show subscribed status
6. Cancel subscription in Stripe
7. Verify webhook removes `stripe_customer_id`
8. Click "Refresh Status" in extension
9. Should show free status

## CORS Configuration

Ensure your backend API allows requests from the extension:

```javascript
// Express.js example
const cors = require('cors');

app.use(cors({
  origin: [
    'chrome-extension://*',
    'moz-extension://*',
    'https://www.q-sci.org'
  ],
  credentials: true
}));
```

## Environment Variables Required

```env
# Clerk
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Summary

The extension changes are complete and deployed. To make subscription status work correctly:

1. ✅ Extension now calls backend API for subscription status
2. ❌ Backend must implement `/api/auth/subscription-status` endpoint
3. ❌ Backend webhook must store `stripe_customer_id` in privateMetadata
4. ❌ Test with both free and subscribed users

Once the backend changes are deployed, the extension will automatically start showing the correct subscription status based on the presence of `stripe_customer_id` in Clerk's privateMetadata.
