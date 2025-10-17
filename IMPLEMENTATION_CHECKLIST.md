# Stripe Subscription Integration - Implementation Checklist

Use this checklist to track the implementation of Stripe subscription payments for Q-SCI.

## ✅ Extension Changes (This PR - COMPLETE)

- [x] Added subscription status refresh functionality
- [x] Added "Refresh Status" button in popup
- [x] Added "Refresh Status" button in options page
- [x] Updated UI to show subscription badges
- [x] Added support for 3 subscription tiers (free/subscribed/past_due)
- [x] Added usage counter display
- [x] Added upgrade prompts for free users
- [x] Added "Subscribe Now" link to q-sci.org/subscribe
- [x] Created comprehensive documentation (5 guides)
- [x] All code reviewed and approved

**Status:** ✅ **READY FOR MERGE**

---

## 📋 Backend Implementation (Separate PR)

Reference: [BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md)

### Setup

- [ ] Install dependencies
  ```bash
  npm install stripe @clerk/clerk-sdk-node express body-parser
  ```

- [ ] Create `.env` file with:
  - [ ] `STRIPE_SECRET_KEY=sk_test_...` (or sk_live for production)
  - [ ] `STRIPE_WEBHOOK_SECRET=whsec_...`
  - [ ] `CLERK_SECRET_KEY=sk_test_...` (or sk_live for production)

### Endpoints to Implement

- [ ] **POST /api/checkout**
  - [ ] Accept `clerkUserId`, `priceId`, `successUrl`, `cancelUrl`
  - [ ] Get or create Stripe Customer
  - [ ] Set `metadata.clerk_user_id` on Customer
  - [ ] Create Checkout Session
  - [ ] Return checkout URL

- [ ] **POST /api/webhooks/stripe**
  - [ ] Use raw body parser for signature verification
  - [ ] Verify webhook signature with `STRIPE_WEBHOOK_SECRET`
  - [ ] Handle `checkout.session.completed` event
  - [ ] Handle `customer.subscription.created` event
  - [ ] Handle `customer.subscription.updated` event
  - [ ] Handle `customer.subscription.deleted` event
  - [ ] Extract Clerk user ID from Customer metadata
  - [ ] Update Clerk `publicMetadata.subscription_status`
  - [ ] Map Stripe status to app status (free/subscribed/past_due)

- [ ] **GET /api/auth/subscription-status** (Optional but recommended)
  - [ ] Verify Clerk session token from Authorization header
  - [ ] Get user from Clerk
  - [ ] Return `subscription_status` from `publicMetadata`

### Testing

- [ ] Test with Stripe CLI
  ```bash
  stripe listen --forward-to localhost:5000/api/webhooks/stripe
  stripe trigger checkout.session.completed
  ```

- [ ] Test checkout flow with test card: `4242 4242 4242 4242`
- [ ] Verify webhook updates Clerk metadata
- [ ] Test subscription refresh endpoint

---

## 🎨 Frontend Changes (Separate PR)

### Create Subscription Page

- [ ] Create page at `q-sci.org/subscribe` (or `/pricing`)
- [ ] Display pricing plans (Free vs Premium)
- [ ] Add "Subscribe" button
- [ ] Get Clerk user ID: `const { user } = useUser();`
- [ ] Call backend:
  ```javascript
  const res = await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({
      clerkUserId: user?.id,
      priceId: 'price_xxxxx',
      successUrl: `${origin}/account?status=success`,
      cancelUrl: `${origin}/pricing?status=cancel`
    })
  });
  const { url } = await res.json();
  window.location.href = url;
  ```

### Create Success/Cancel Pages

- [ ] Create `/account?status=success` page
  - [ ] Show success message
  - [ ] Prompt user to refresh extension
  - [ ] Link back to extension usage

- [ ] Create `/pricing?status=cancel` page
  - [ ] Show "Payment canceled" message
  - [ ] Allow user to try again
  - [ ] Link back to pricing

---

## 🔧 Stripe Configuration

### Dashboard Setup

- [ ] Go to [Stripe Dashboard](https://dashboard.stripe.com)
- [ ] Switch to Test Mode (toggle in top right)

### Create Product and Price

- [ ] Navigate to Products
- [ ] Click "Add product"
- [ ] Enter product details:
  - [ ] Name: "Q-SCI Premium"
  - [ ] Description: "100 analyses per day"
- [ ] Create price:
  - [ ] Pricing model: Standard pricing
  - [ ] Price: (set your price)
  - [ ] Billing period: Monthly (or your preference)
- [ ] Save and copy `price_id` (starts with `price_`)

### Configure Webhook

- [ ] Navigate to Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] Enter endpoint URL: `https://your-domain.com/api/webhooks/stripe`
- [ ] Select events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] Click "Add endpoint"
- [ ] Copy webhook signing secret (starts with `whsec_`)
- [ ] Add to backend `.env` as `STRIPE_WEBHOOK_SECRET`

### API Keys

- [ ] Navigate to Developers → API keys
- [ ] Copy "Secret key" (starts with `sk_test_`)
- [ ] Add to backend `.env` as `STRIPE_SECRET_KEY`
- [ ] **Never commit these keys to git!**

---

## 🗄️ Clerk Configuration

### User Metadata Setup

- [ ] Go to [Clerk Dashboard](https://dashboard.clerk.com)
- [ ] Navigate to Users
- [ ] For each test user:
  - [ ] Click on user
  - [ ] Go to "Metadata" tab
  - [ ] Click "Edit" on Public metadata
  - [ ] Add:
    ```json
    {
      "subscription_status": "free"
    }
    ```
  - [ ] Save

### Migration Script (Optional)

- [ ] Create script to bulk update existing users:
  ```javascript
  const users = await clerkClient.users.getUserList();
  for (const user of users.data) {
    if (!user.publicMetadata?.subscription_status) {
      await clerkClient.users.updateUser(user.id, {
        publicMetadata: {
          subscription_status: 'free'
        }
      });
    }
  }
  ```

---

## 🧪 Testing

Reference: [STRIPE_TESTING.md](./STRIPE_TESTING.md)

### Extension Testing

- [ ] Install extension from this branch
- [ ] Open popup, login with test Clerk account
- [ ] Verify shows "Free" status and "0 / 10" usage
- [ ] Verify "Subscribe Now" link works
- [ ] In Clerk Dashboard, set `subscription_status = "subscribed"`
- [ ] Click "Refresh Status" in extension
- [ ] Verify shows "✓ Subscribed" and "0 / 100" usage

### Integration Testing

- [ ] Start from free account
- [ ] Click "Subscribe Now" in extension
- [ ] Complete Stripe checkout with test card
- [ ] Verify webhook fires and updates Clerk
- [ ] Return to extension
- [ ] Click "Refresh Status"
- [ ] Verify shows "Premium" status

### Edge Cases

- [ ] Test with `subscription_status = "past_due"`
- [ ] Test with backend unavailable (should use cached data)
- [ ] Test with invalid Clerk token
- [ ] Test reaching daily limit (free tier)
- [ ] Test logout and re-login
- [ ] Test across browser restart

---

## 🚀 Deployment

### Backend Deployment

- [ ] Deploy backend to production server
- [ ] Set production environment variables
- [ ] Verify endpoint is publicly accessible
- [ ] Test with `curl` or Postman

### Stripe Production Setup

- [ ] Switch Stripe Dashboard to Live Mode
- [ ] Create production webhook endpoint
- [ ] Update webhook URL to production domain
- [ ] Copy production webhook secret
- [ ] Update production environment variables
- [ ] Copy production API keys
- [ ] Update production environment variables

### Frontend Deployment

- [ ] Deploy frontend with subscription page
- [ ] Update subscribe link if different from q-sci.org/subscribe
- [ ] Test production checkout flow

### Extension Update

- [ ] Update extension if API URLs changed
- [ ] Test with production environment
- [ ] Publish extension update (if needed)

---

## 📊 Monitoring

### Stripe Dashboard

- [ ] Monitor webhook deliveries
- [ ] Check for failed webhooks
- [ ] Monitor successful payments
- [ ] Track subscription changes

### Backend Logs

- [ ] Monitor webhook handler logs
- [ ] Check for errors
- [ ] Verify Clerk metadata updates

### Clerk Dashboard

- [ ] Check user metadata updates
- [ ] Verify subscription statuses
- [ ] Monitor user count by tier

---

## 🎯 Success Criteria

- [ ] Users can subscribe via Stripe checkout
- [ ] Webhook updates Clerk metadata automatically
- [ ] Extension refreshes and shows premium status
- [ ] Usage limits enforced correctly (10 free, 100 premium)
- [ ] Upgrade prompts show for free users
- [ ] Payment issues handled gracefully (past_due status)
- [ ] Extension works offline with cached data

---

## 📚 Documentation References

- [STRIPE_README.md](./STRIPE_README.md) - Overview and quick start
- [STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md) - Technical architecture
- [BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md) - Backend code
- [STRIPE_TESTING.md](./STRIPE_TESTING.md) - Testing procedures
- [CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md) - What changed in this PR

---

## 🆘 Getting Help

**Extension Issues:**
- Check [STRIPE_TESTING.md](./STRIPE_TESTING.md)
- Browser console logs
- Chrome DevTools → Application → Storage

**Backend Issues:**
- Check [BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md)
- Server logs
- Stripe Dashboard → Webhooks

**Stripe Issues:**
- [Stripe Documentation](https://stripe.com/docs)
- Stripe Dashboard → Developers → Logs
- Test with Stripe CLI

**Clerk Issues:**
- [Clerk Documentation](https://clerk.com/docs)
- Clerk Dashboard → Users → Metadata

---

## ✅ Final Sign-off

### Before Merging This PR

- [x] All extension code changes complete
- [x] All documentation written
- [x] Code review passed
- [x] JavaScript syntax validated
- [x] No breaking changes
- [x] Backward compatible

### After Merging

- [ ] Backend PR created
- [ ] Frontend PR created
- [ ] Stripe configured
- [ ] Clerk metadata set for existing users
- [ ] Integration testing passed
- [ ] Production deployment complete
- [ ] Monitoring in place

---

**Current Status:** Extension implementation complete ✅  
**Next Step:** Implement backend endpoints per BACKEND_IMPLEMENTATION_GUIDE.md
