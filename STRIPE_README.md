# Stripe Subscription Integration - Complete Guide

This directory contains all documentation for implementing Stripe subscription payments with the Q-SCI browser extension.

## 📚 Documentation Overview

### For Browser Extension Users

- **[STRIPE_TESTING.md](./STRIPE_TESTING.md)** - Test the Stripe integration in the extension
  - Test cases for all subscription scenarios
  - Manual testing checklist
  - Debugging commands

### For Backend Developers

- **[BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md)** - Complete backend implementation
  - Ready-to-use Express.js code
  - Stripe webhook handler
  - Clerk integration
  - Testing with Stripe CLI

### For Full-Stack Developers

- **[STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md)** - Architecture and workflow
  - Complete integration overview
  - Extension → Backend → Stripe → Clerk flow
  - Security considerations
  - Troubleshooting guide

## 🚀 Quick Start

### 1. Extension Setup (Already Done ✓)

The browser extension is ready to work with Stripe subscriptions:
- ✓ Reads subscription status from Clerk `publicMetadata`
- ✓ Enforces usage limits (10 free / 100 premium)
- ✓ Provides "Subscribe" button linking to payment page
- ✓ Includes "Refresh Status" button for manual updates
- ✓ Supports `free`, `subscribed`, and `past_due` statuses

### 2. Backend Setup (To Do)

Follow [BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md) to implement:

```bash
# Install dependencies
npm install stripe @clerk/clerk-sdk-node express body-parser

# Set environment variables
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLERK_SECRET_KEY=sk_live_...

# Implement 3 endpoints:
# - POST /api/checkout
# - POST /api/webhooks/stripe
# - GET /api/auth/subscription-status (optional)
```

### 3. Stripe Configuration

1. Create Stripe account
2. Get API keys (Dashboard → Developers → API keys)
3. Create product and price
4. Configure webhook endpoint
5. Test with Stripe test cards

### 4. Testing

Follow [STRIPE_TESTING.md](./STRIPE_TESTING.md) to verify:
- [ ] Extension shows correct subscription status
- [ ] Refresh button updates status
- [ ] Usage limits are enforced
- [ ] Subscribe link works
- [ ] Webhook updates Clerk metadata

## 🎯 Architecture

```
┌─────────────────┐
│ Browser         │
│ Extension       │
│ (This repo)     │
└────────┬────────┘
         │ 1. User clicks "Subscribe"
         │
         ▼
┌─────────────────┐
│ Frontend        │     2. Calls backend
│ (q-sci.org)     │────────────────────┐
└─────────────────┘                     │
                                        ▼
                              ┌──────────────────┐
                              │ Backend API      │
                              │ (Your server)    │
                              └────────┬─────────┘
                                       │ 3. Creates checkout
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Stripe           │
                              │ (Payment)        │
                              └────────┬─────────┘
                                       │ 4. Sends webhook
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Backend API      │
                              │ (Webhook)        │
                              └────────┬─────────┘
                                       │ 5. Updates metadata
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Clerk            │
                              │ (publicMetadata) │
                              └────────┬─────────┘
                                       │ 6. Extension reads
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Browser          │
                              │ Extension        │
                              │ (Shows Premium)  │
                              └──────────────────┘
```

## 📝 Extension Features

### Subscription Status Display

**Popup (extension icon):**
- User email and status badge
- Daily usage counter (X / Y)
- Upgrade prompt for free users
- "Refresh Status" button
- "Subscribe Now" link

**Options page:**
- Current plan details
- Subscription management
- "Refresh Status" button
- "Upgrade to Premium" link

### Subscription Statuses

| Status | Badge | Daily Limit | Description |
|--------|-------|-------------|-------------|
| `free` | Free | 10 | Free tier user |
| `subscribed` | ✓ Premium | 100 | Active paid subscription |
| `past_due` | ⚠ Payment Due | 10 | Payment issue, limited access |

## 🔧 Extension Files Modified

- `auth.js` - Added `refreshSubscriptionStatus()` method
- `popup.js` - Added refresh button handler
- `popup.html` - Added "Refresh Status" button
- `options.js` - Added subscription management section
- `options.html` - Added subscription UI

## 🔐 Security

**Extension Security:**
- Never stores Stripe keys
- Only reads subscription status (read-only)
- Uses Clerk session tokens
- Secure Chrome local storage

**Backend Security (Your responsibility):**
- Verify webhook signatures
- Validate Clerk tokens
- Use HTTPS only
- Rate limit endpoints

## 🐛 Troubleshooting

### Extension shows "Free" after payment

**Solution:**
1. Check Clerk Dashboard → Users → [User] → Metadata
2. Verify `publicMetadata.subscription_status = "subscribed"`
3. Click "Refresh Status" in extension
4. Check backend webhook logs

### Webhook not firing

**Solution:**
1. Verify webhook URL in Stripe Dashboard
2. Check webhook signing secret
3. Review Stripe Dashboard → Webhooks → Recent events
4. Test with Stripe CLI: `stripe listen --forward-to localhost:5000/api/webhooks/stripe`

### Usage limit not working

**Solution:**
1. Check subscription status in Chrome DevTools → Application → Storage
2. Verify status is exactly `"subscribed"` (not `"subscribe"` or `"premium"`)
3. Clear extension storage and re-login

## 📞 Support

**For extension issues:**
- Check browser console for errors
- Review [STRIPE_TESTING.md](./STRIPE_TESTING.md)

**For backend issues:**
- Review [BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md)
- Check server logs
- Test with Stripe CLI

**For Stripe issues:**
- Stripe Dashboard → Webhooks
- Stripe CLI: `stripe logs tail`

**For Clerk issues:**
- Clerk Dashboard → Users → Metadata
- Check `publicMetadata.subscription_status`

## 🎓 Learning Resources

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Clerk Metadata Docs](https://clerk.com/docs/users/metadata)
- [Chrome Extension Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

## ✅ Implementation Checklist

### Extension (Already Done ✓)
- [x] Subscription status storage
- [x] Usage limit enforcement
- [x] Subscribe button/link
- [x] Refresh status function
- [x] UI for all statuses
- [x] Options page integration

### Backend (To Do)
- [ ] Install dependencies
- [ ] Create `/api/checkout` endpoint
- [ ] Create `/api/webhooks/stripe` endpoint
- [ ] Create `/api/auth/subscription-status` endpoint
- [ ] Configure Stripe webhook
- [ ] Test with Stripe CLI
- [ ] Deploy to production

### Testing (To Do)
- [ ] Test free user flow
- [ ] Test subscription purchase
- [ ] Test status refresh
- [ ] Test usage limits
- [ ] Test webhook events
- [ ] Test with real payments

## 🚦 Status

| Component | Status | Notes |
|-----------|--------|-------|
| Browser Extension | ✅ Ready | All features implemented |
| Backend API | ⏳ To Do | Follow BACKEND_IMPLEMENTATION_GUIDE.md |
| Stripe Setup | ⏳ To Do | Create account, configure webhook |
| Testing | ⏳ To Do | Follow STRIPE_TESTING.md |

## 📅 Next Steps

1. **Backend Developer:** Implement backend using [BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md)
2. **DevOps:** Deploy backend and configure Stripe webhook
3. **QA:** Test integration using [STRIPE_TESTING.md](./STRIPE_TESTING.md)
4. **Product:** Launch and monitor subscription conversions

---

**Need help?** Refer to the specific documentation files linked above for detailed information on each aspect of the integration.
