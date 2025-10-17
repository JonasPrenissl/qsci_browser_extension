# Backend Implementation Guide for Q-SCI Stripe Integration

This guide provides the exact code needed to implement the backend API that the Q-SCI browser extension expects.

## Quick Start Checklist

- [ ] Install dependencies: `stripe`, `@clerk/clerk-sdk-node`, `express`, `body-parser`
- [ ] Set environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLERK_SECRET_KEY`
- [ ] Implement `/api/checkout` endpoint
- [ ] Implement `/api/webhooks/stripe` endpoint
- [ ] Implement `/api/auth/subscription-status` endpoint (optional but recommended)
- [ ] Configure Stripe webhook in Dashboard
- [ ] Test with Stripe CLI

## Required Dependencies

```bash
npm install stripe @clerk/clerk-sdk-node express body-parser
```

## Environment Variables

Create `.env` file:

```env
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
CLERK_SECRET_KEY=sk_live_... # or sk_test_... for testing
PORT=5000
```

## 1. Setup Express Server

**File:** `server/index.js`

```javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import checkoutRoutes from "./routes/checkout.js";
import webhookRoutes from "./routes/webhooks.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// IMPORTANT: Webhook route must be defined BEFORE body parser middleware
// Stripe webhooks require raw body for signature verification
app.use("/api/webhooks", webhookRoutes);

// Apply JSON body parser for other routes
app.use(express.json());
app.use(cors({
  origin: ["https://www.q-sci.org", "https://q-sci.org"],
  credentials: true
}));

// Other routes
app.use("/api", checkoutRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 2. Checkout Session Creation

**File:** `server/routes/checkout.js`

```javascript
import express from "express";
import Stripe from "stripe";
import { clerkClient } from "@clerk/clerk-sdk-node";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
  apiVersion: "2024-06-20" 
});

/**
 * Helper: Get or create Stripe Customer linked to Clerk user
 */
async function getOrCreateCustomer(clerkUserId) {
  // Get Clerk user to get email
  const user = await clerkClient.users.getUser(clerkUserId);
  const email = user.emailAddresses?.[0]?.emailAddress;

  // Check if customer already exists with this Clerk user ID
  const customers = await stripe.customers.list({
    limit: 1,
    email: email,
  });

  let customer = customers.data.find(
    (c) => c.metadata?.clerk_user_id === clerkUserId
  );

  if (!customer) {
    // Create new customer with Clerk user ID in metadata
    customer = await stripe.customers.create({
      email: email,
      metadata: { 
        clerk_user_id: clerkUserId // CRITICAL: This links Stripe to Clerk
      },
    });
    console.log(`Created Stripe customer ${customer.id} for Clerk user ${clerkUserId}`);
  } else {
    console.log(`Found existing customer ${customer.id} for Clerk user ${clerkUserId}`);
  }

  return customer;
}

/**
 * POST /api/checkout
 * Creates Stripe Checkout Session for subscription
 */
router.post("/checkout", async (req, res) => {
  try {
    const { clerkUserId, priceId, successUrl, cancelUrl } = req.body;

    if (!clerkUserId || !priceId) {
      return res.status(400).json({ 
        error: "Missing required parameters: clerkUserId and priceId" 
      });
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(clerkUserId);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [
        { 
          price: priceId, 
          quantity: 1 
        }
      ],
      success_url: successUrl || "https://www.q-sci.org/account?status=success",
      cancel_url: cancelUrl || "https://www.q-sci.org/pricing?status=cancel",
      client_reference_id: clerkUserId, // Fallback for webhook
      metadata: {
        clerk_user_id: clerkUserId // Additional fallback
      }
    });

    console.log(`Created checkout session ${session.id} for user ${clerkUserId}`);

    res.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ 
      error: "Failed to create checkout session",
      message: error.message 
    });
  }
});

export default router;
```

## 3. Stripe Webhook Handler

**File:** `server/routes/webhooks.js`

```javascript
import express from "express";
import Stripe from "stripe";
import { clerkClient } from "@clerk/clerk-sdk-node";
import bodyParser from "body-parser";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
  apiVersion: "2024-06-20" 
});

/**
 * Helper: Extract Clerk user ID from Stripe event
 */
async function getClerkUserId(event) {
  // Method 1: checkout.session.completed → client_reference_id
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.client_reference_id) {
      return session.client_reference_id;
    }

    // Fallback: Get from customer metadata
    if (session.customer) {
      const customer = await stripe.customers.retrieve(session.customer);
      if (!customer.deleted && customer.metadata?.clerk_user_id) {
        return customer.metadata.clerk_user_id;
      }
    }
  }

  // Method 2: subscription events → get customer metadata
  if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object;
    const customer = await stripe.customers.retrieve(subscription.customer);
    if (!customer.deleted && customer.metadata?.clerk_user_id) {
      return customer.metadata.clerk_user_id;
    }
  }

  return null;
}

/**
 * Helper: Map Stripe subscription status to app status
 */
function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "subscribed";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "free";
    default:
      return "free";
  }
}

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events
 * IMPORTANT: Must use raw body parser for signature verification
 */
router.post(
  "/stripe",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Received webhook: ${event.type}`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          // User completed checkout
          const clerkUserId = await getClerkUserId(event);
          if (clerkUserId) {
            await clerkClient.users.updateUser(clerkUserId, {
              publicMetadata: { 
                subscription_status: "subscribed" 
              },
            });
            console.log(`Updated user ${clerkUserId} to subscribed after checkout`);
          } else {
            console.warn("No Clerk user ID found for checkout session");
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          // Subscription status changed
          const subscription = event.data.object;
          const clerkUserId = await getClerkUserId(event);
          
          if (clerkUserId) {
            const appStatus = mapStripeStatus(subscription.status);
            
            await clerkClient.users.updateUser(clerkUserId, {
              publicMetadata: {
                subscription_status: appStatus,
                plan_id: subscription.items.data[0]?.price?.id ?? null,
                current_period_end: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : null,
              },
            });
            
            console.log(`Updated user ${clerkUserId} subscription to ${appStatus}`);
          } else {
            console.warn(`No Clerk user ID found for subscription ${subscription.id}`);
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook handler error:", error);
      res.status(500).send("Webhook handler failed");
    }
  }
);

export default router;
```

## 4. Subscription Status Endpoint (Optional)

**File:** `server/routes/auth.js`

This endpoint allows the browser extension to refresh subscription status.

```javascript
import express from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";

const router = express.Router();

/**
 * Middleware: Verify Clerk session token
 */
async function verifyClerkToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    // Verify the token with Clerk
    const session = await clerkClient.sessions.verifySession(token);
    req.clerkUserId = session.userId;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * GET /api/auth/subscription-status
 * Returns current subscription status from Clerk metadata
 */
router.get("/subscription-status", verifyClerkToken, async (req, res) => {
  try {
    const userId = req.clerkUserId;
    
    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);
    
    // Extract subscription info from publicMetadata
    const subscriptionStatus = user.publicMetadata?.subscription_status || "free";
    const planId = user.publicMetadata?.plan_id || null;
    const currentPeriodEnd = user.publicMetadata?.current_period_end || null;

    res.json({
      subscription_status: subscriptionStatus,
      plan_id: planId,
      current_period_end: currentPeriodEnd
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ 
      error: "Failed to fetch subscription status",
      message: error.message 
    });
  }
});

export default router;
```

## 5. Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Save and copy the webhook signing secret
6. Add to `.env` as `STRIPE_WEBHOOK_SECRET=whsec_...`

## 6. Test with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## 7. Frontend Integration Example

**React Component:**

```javascript
import { useUser } from "@clerk/clerk-react";

export function SubscribeButton() {
  const { user } = useUser();

  const startCheckout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkUserId: user?.id,
        priceId: "price_1234567890", // Your Stripe price ID
        successUrl: window.location.origin + "/account?status=success",
        cancelUrl: window.location.origin + "/pricing?status=cancel",
      }),
    });
    
    const { url } = await res.json();
    window.location.href = url;
  };

  return <button onClick={startCheckout}>Subscribe to Premium</button>;
}
```

## Testing Checklist

- [ ] `/api/checkout` creates session and links to Clerk user
- [ ] Webhook endpoint receives and verifies signatures
- [ ] Webhook updates Clerk `publicMetadata.subscription_status`
- [ ] `/api/auth/subscription-status` returns correct status
- [ ] Browser extension refreshes and shows new status
- [ ] Test with Stripe test cards:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`

## Troubleshooting

### Webhook not receiving events

- Check webhook URL is publicly accessible
- Verify webhook secret matches
- Check Stripe Dashboard → Webhooks → Recent events

### Customer not linked to Clerk user

- Verify `metadata.clerk_user_id` is set on customer
- Check `clerkUserId` is passed in checkout request

### Extension not showing updated status

- Check Clerk user's `publicMetadata` in Dashboard
- Click "Refresh Status" in extension
- Clear extension storage and re-login

## Security Best Practices

1. **Always verify webhook signatures**
2. **Never expose Stripe secret keys**
3. **Use HTTPS in production**
4. **Validate all input parameters**
5. **Rate limit API endpoints**
6. **Log webhook events for debugging**

## Production Deployment

1. Replace test keys with live keys
2. Update webhook URL to production domain
3. Re-configure webhook in Stripe Dashboard
4. Test with real payment methods
5. Monitor webhook logs for errors

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Express.js Documentation](https://expressjs.com/)
