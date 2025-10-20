# Clerk Configuration Flow

This document shows how the Clerk configuration system works.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SETUP                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────┐
    │ 1. Copy clerk-config.example.js             │
    │    to clerk-config.js                       │
    └──────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────┐
    │ 2. Edit clerk-config.js                     │
    │    Add production key (pk_live_...)         │
    └──────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────┐
    │ 3. Run: npm run build                       │
    └──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUILD PROCESS                              │
└─────────────────────────────────────────────────────────────┘
                           │
    ┌──────────────────────┴───────────────────────┐
    │                                              │
    ▼                                              ▼
┌──────────────────┐                    ┌──────────────────┐
│ clerk-config.js  │                    │ src/auth.js      │
│ (your key)       │◄───── import ──────│ (imports config) │
└──────────────────┘                    └──────────────────┘
    │                                              │
    │                                              │
    └──────────────────────┬───────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  esbuild bundler       │
              │  bundles both files    │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ dist/js/bundle-auth.js │
              │ (contains config)      │
              └────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   RUNTIME EXECUTION                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ clerk-auth.html        │
              │ loads:                 │
              │  1. clerk-config.js    │
              │  2. bundle-auth.js     │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ window.CLERK_CONFIG    │
              │ available globally     │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Clerk SDK initialized  │
              │ with production key    │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ ✅ NO WARNING!         │
              │ Extension works        │
              └────────────────────────┘
```

## Key Behavior

### Development Keys (`pk_test_...`)
```
pk_test_... → Clerk SDK → ⚠️ WARNING in console
              "Development keys detected"
```

### Production Keys (`pk_live_...`)
```
pk_live_... → Clerk SDK → ✅ NO WARNING
              "Production ready"
```

## File Relationships

```
clerk-config.example.js  ─┐
(template, safe to commit)│
                          │
                          │ user copies
                          │
                          ▼
                   clerk-config.js
                   (actual keys, git-ignored)
                          │
                          │ imported by
                          │
                          ▼
                     src/auth.js
                     src/clerk-auth-main.js
                          │
                          │ bundled to
                          │
                          ▼
                dist/js/bundle-auth.js
                (deployed with extension)
```

## Security Model

```
┌─────────────────────┐
│  Source Control     │
│  (GitHub)           │
│                     │
│  ✅ src/*.js        │  ← Code imports config
│  ✅ example file    │  ← Template only
│  ❌ clerk-config.js │  ← Actual keys (ignored)
└─────────────────────┘
         │
         │ clone/pull
         │
         ▼
┌─────────────────────┐
│  Developer Machine  │
│                     │
│  ✅ Create config   │  ← Copy from example
│  ✅ Add real key    │  ← Your production key
│  ✅ Build locally   │  ← npm run build
└─────────────────────┘
         │
         │ build output
         │
         ▼
┌─────────────────────┐
│  Extension Package  │
│                     │
│  ✅ bundle-auth.js  │  ← Contains bundled config
│  ✅ clerk-auth.html │  ← Loads config
│  ✅ All other files │  ← Ready to load
└─────────────────────┘
```

## Configuration Fallback

```
Runtime Check:
    │
    ▼
Is window.CLERK_CONFIG defined?
    │
    ├─ YES ─────► Use configured key ✅
    │             (from clerk-config.js)
    │
    └─ NO ──────► Use default test key ⚠️
                  (shows warning in console)
                  (log: "clerk-config.js not found")
```

## Production Deployment Checklist

```
□ Step 1: Get production key
  └─ Clerk Dashboard → Production → API Keys
     └─ Copy key (starts with pk_live_...)

□ Step 2: Create configuration
  └─ cp clerk-config.example.js clerk-config.js
     └─ Edit with production key

□ Step 3: Build extension
  └─ npm run build
     └─ Verify: ✓ Build complete

□ Step 4: Test locally
  └─ Load in Chrome
     └─ Check console: No warnings

□ Step 5: Deploy
  └─ Package extension
     └─ Distribute to users
```

## Troubleshooting Flow

```
Problem: Warning appears
    │
    ▼
Check clerk-config.js exists?
    │
    ├─ NO ──────► Create it:
    │             cp clerk-config.example.js clerk-config.js
    │             Add your key
    │             npm run build
    │
    └─ YES ─────► Check key type
                      │
                      ▼
                  Key starts with pk_test_?
                      │
                      ├─ YES ──► Change to pk_live_...
                      │          npm run build
                      │          Reload extension
                      │
                      └─ NO ───► Check build
                                 npm run build
                                 Reload extension
                                 Check console
```

## Environment Comparison

### Development Environment
```
clerk-config.js:
  publishableKey: 'pk_test_...'
                    ↓
            Build & Deploy
                    ↓
          ⚠️ Warning appears
          ✅ Works for testing
          ❌ Not for production
```

### Production Environment
```
clerk-config.js:
  publishableKey: 'pk_live_...'
                    ↓
            Build & Deploy
                    ↓
          ✅ No warnings
          ✅ Production ready
          ✅ Higher limits
```

## Quick Reference

| Component | Purpose | Git Status |
|-----------|---------|------------|
| `clerk-config.js` | Your actual key | ❌ Ignored |
| `clerk-config.example.js` | Template | ✅ Tracked |
| `src/auth.js` | Imports config | ✅ Tracked |
| `dist/js/bundle-auth.js` | Bundled code | ✅ Tracked |

## Learn More

- **Quick Fix**: See `CLERK_DEV_KEY_WARNING_FIX.md`
- **Complete Guide**: See `CLERK_CONFIGURATION.md`
- **Setup Instructions**: See `CLERK_SETUP.md`
- **Technical Details**: See `SOLUTION_CLERK_CONFIG.md`

---

**Visual diagrams help understand the flow from configuration to execution!**
