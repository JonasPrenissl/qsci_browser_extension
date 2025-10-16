# Q-SCI Extension - Authentication Flow

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     Extension Popup Opens                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Is Logged In? │
                    └───────┬───────┘
                            │
            ┌───────────────┴────────────────┐
            │                                │
            ▼ NO                             ▼ YES
    ┌──────────────┐                ┌──────────────────┐
    │ Show Login   │                │ Verify Token     │
    │ Form         │                │ with Backend     │
    └──────┬───────┘                └────────┬─────────┘
           │                                 │
           │                     ┌───────────┴────────────┐
           │                     │                        │
           │                     ▼ Valid                  ▼ Invalid
           │            ┌────────────────┐        ┌──────────────┐
           │            │ Show User      │        │ Logout &     │
           │            │ Status         │        │ Show Login   │
           │            └────────┬───────┘        └──────────────┘
           │                     │
           ▼                     ▼
    ┌──────────────┐     ┌──────────────┐
    │ User Enters  │     │ Check Usage  │
    │ Credentials  │     │ Limit        │
    └──────┬───────┘     └──────┬───────┘
           │                     │
           ▼                     │
    ┌──────────────┐            │
    │ Call Login   │            │
    │ API          │            │
    └──────┬───────┘            │
           │                     │
    ┌──────┴────────┐           │
    │               │           │
    ▼ Success       ▼ Error     │
┌────────────┐  ┌─────────┐    │
│ Store      │  │ Show    │    │
│ Token      │  │ Error   │    │
└─────┬──────┘  └─────────┘    │
      │                         │
      └─────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ User Can Now  │
        │ Analyze       │
        │ Papers        │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Click         │
        │ "Analyze"     │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Check:        │
        │ - Logged in?  │
        │ - Under limit?│
        └───────┬───────┘
                │
    ┌───────────┴────────────┐
    │                        │
    ▼ Allowed                ▼ Denied
┌───────────┐         ┌──────────────┐
│ Perform   │         │ Show Error   │
│ Analysis  │         │ with Limit   │
└─────┬─────┘         └──────────────┘
      │
      ▼
┌───────────┐
│ Increment │
│ Usage     │
│ Counter   │
└─────┬─────┘
      │
      ▼
┌───────────┐
│ Update    │
│ Display   │
│ (e.g.     │
│  6 / 10)  │
└───────────┘
```

## Daily Usage Reset

```
┌─────────────────────────────────────┐
│  Midnight (00:00) - New Day Starts  │
└─────────────────┬───────────────────┘
                  │
                  ▼
          ┌───────────────┐
          │ Extension     │
          │ Detects Date  │
          │ Change        │
          └───────┬───────┘
                  │
                  ▼
          ┌───────────────┐
          │ Reset Usage   │
          │ Counter to 0  │
          └───────┬───────┘
                  │
                  ▼
          ┌───────────────┐
          │ User Can      │
          │ Analyze       │
          │ Again         │
          └───────────────┘
```

## Subscription Status Check

```
┌─────────────────────────────────────┐
│  Backend Returns Subscription       │
│  Status: "free" or "subscribed"     │
└─────────────────┬───────────────────┘
                  │
      ┌───────────┴────────────┐
      │                        │
      ▼ free                   ▼ subscribed
┌─────────────┐          ┌─────────────┐
│ Limit: 10   │          │ Limit: 100  │
│ per day     │          │ per day     │
└──────┬──────┘          └──────┬──────┘
       │                        │
       ▼                        ▼
┌─────────────┐          ┌─────────────┐
│ Show        │          │ Hide        │
│ Upgrade     │          │ Upgrade     │
│ Prompt      │          │ Prompt      │
│ (when near  │          │             │
│  limit)     │          │             │
└─────────────┘          └─────────────┘
```

## Storage Structure

```
chrome.storage.local
├── qsci_auth_token: "jwt_token_abc123..."
├── qsci_user_email: "user@example.com"
├── qsci_subscription_status: "free" | "subscribed"
├── qsci_daily_usage: 5
├── qsci_last_usage_date: "2025-10-16"
└── openai_api_key: "sk-..." (existing)
```

## UI States

### State 1: Not Logged In
```
┌──────────────────────────────────┐
│  Q-SCI Quality Check             │
├──────────────────────────────────┤
│  Login Required                  │
│                                  │
│  Email: [________________]       │
│  Password: [____________]        │
│                                  │
│  [        Login         ]        │
│                                  │
│  Don't have an account?          │
│  Visit q-sci.org to register     │
└──────────────────────────────────┘
```

### State 2: Logged In (Free User)
```
┌──────────────────────────────────┐
│  Q-SCI Quality Check             │
├──────────────────────────────────┤
│  Logged in as:                   │
│  user@example.com                │
│  [Free]                          │
│  Today's analyses: 5 / 10        │
│                                  │
│  [       Logout       ]          │
├──────────────────────────────────┤
│  Current Page                    │
│  ✅ Scientific site detected     │
│  [  Analyze Paper  ] [Refresh]   │
└──────────────────────────────────┘
```

### State 3: Logged In Near Limit (Free User)
```
┌──────────────────────────────────┐
│  Q-SCI Quality Check             │
├──────────────────────────────────┤
│  Logged in as:                   │
│  user@example.com                │
│  [Free]                          │
│  Today's analyses: 8 / 10        │
│                                  │
│  ╔═══════════════════════════╗  │
│  ║ ⚡ Upgrade to Premium     ║  │
│  ║ Get 100 analyses per day  ║  │
│  ║ instead of 10!            ║  │
│  ║ [ Subscribe Now ]         ║  │
│  ╚═══════════════════════════╝  │
│                                  │
│  [       Logout       ]          │
└──────────────────────────────────┘
```

### State 4: Logged In (Subscribed User)
```
┌──────────────────────────────────┐
│  Q-SCI Quality Check             │
├──────────────────────────────────┤
│  Logged in as:                   │
│  user@example.com                │
│  [✓ Subscribed]                  │
│  Today's analyses: 45 / 100      │
│                                  │
│  [       Logout       ]          │
├──────────────────────────────────┤
│  Current Page                    │
│  ✅ Scientific site detected     │
│  [  Analyze Paper  ] [Refresh]   │
└──────────────────────────────────┘
```

## Error Handling

```
Network Error (Backend Unreachable)
        │
        ▼
┌───────────────────────────┐
│ Use Cached Auth Data      │
│ Show Warning (optional)   │
│ Allow Offline Usage       │
└───────────────────────────┘

Invalid Token
        │
        ▼
┌───────────────────────────┐
│ Logout User               │
│ Clear Auth Data           │
│ Show Login Form           │
└───────────────────────────┘

Usage Limit Reached (Free)
        │
        ▼
┌───────────────────────────┐
│ Block Analysis            │
│ Show Upgrade Message      │
│ Provide Subscribe Link    │
└───────────────────────────┘

Usage Limit Reached (Subscribed)
        │
        ▼
┌───────────────────────────┐
│ Block Analysis            │
│ Show "Try Tomorrow" Msg   │
└───────────────────────────┘
```

## Integration Points

```
Extension ←→ q-sci.org Backend
    │
    ├─→ POST /api/auth/login
    │   Request: { email, password }
    │   Response: { token, email, subscription_status }
    │
    └─→ GET /api/auth/verify
        Header: Authorization: Bearer <token>
        Response: { subscription_status }
```

## Key Features at a Glance

✅ Login required for all users
✅ JWT token authentication
✅ Subscription status from backend
✅ Daily usage tracking (local)
✅ 10/day limit for free users
✅ 100/day limit for subscribed users
✅ Automatic midnight reset
✅ Offline support with cached data
✅ Upgrade prompts for free users
✅ Clean, intuitive UI
✅ Options page with status display
✅ Comprehensive error handling

---

For detailed implementation, see:
- AUTHENTICATION.md - API specification
- IMPLEMENTATION_SUMMARY.md - Technical details
- README_DE.md - German overview
