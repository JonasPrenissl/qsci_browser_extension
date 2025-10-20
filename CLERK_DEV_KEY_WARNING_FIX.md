# Quick Fix: Clerk Development Key Warning

If you're seeing this warning in your browser console:

```
Clerk: Clerk has been loaded with development keys. Development instances have 
strict usage limits and should not be used when deploying your application to production.
Learn more: https://clerk.com/docs/deployments/overview
```

Follow these steps to fix it:

## Step 1: Get Your Production Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. **Switch to Production instance** (dropdown at top of dashboard)
4. Go to **API Keys**
5. Copy your **Publishable Key** (starts with `pk_live_...`)

## Step 2: Update Configuration

1. **Create configuration file** (if you haven't already):
   ```bash
   cd /path/to/qsci_browser_extension
   cp clerk-config.example.js clerk-config.js
   ```

2. **Edit `clerk-config.js`** with your production key:
   ```javascript
   const CLERK_CONFIG = {
     // Use your production key from Clerk dashboard
     publishableKey: 'pk_live_YOUR_PRODUCTION_KEY_HERE',
   };
   ```

   **Important**: Make sure the key starts with `pk_live_` NOT `pk_test_`

## Step 3: Rebuild Extension

```bash
npm install  # if you haven't already
npm run build
```

## Step 4: Reload Extension

1. Open Chrome and go to `chrome://extensions/`
2. Find "Q-SCI Browser Extension"
3. Click the **reload icon** (circular arrow)

## Step 5: Verify Fix

1. Click the extension icon
2. Click "Login with Clerk"
3. Open browser console (F12)
4. The warning should **no longer appear**

## What Changed?

- **Before**: Test key (`pk_test_...`) was hardcoded in source files
- **After**: Production key (`pk_live_...`) is configured in `clerk-config.js`

## Troubleshooting

### Warning Still Appears

**Check your key**:
```bash
grep "publishableKey" clerk-config.js
```

Make sure it shows `pk_live_...` not `pk_test_...`

**Rebuild and reload**:
```bash
npm run build

# Then reload extension in Chrome
```

### Can't Find clerk-config.js

```bash
# Make sure you're in the extension directory
cd /path/to/qsci_browser_extension

# Create from example
cp clerk-config.example.js clerk-config.js

# Edit with your key
nano clerk-config.js  # or use your preferred editor
```

### Still Using Test Key

If you need to continue using the test key for development:
- That's fine for testing!
- The warning is just informational
- Test keys have usage limits
- **Always switch to production key before deploying**

## Why This Matters

### Test Keys (`pk_test_...`)
- ❌ Strict usage limits
- ❌ Show console warnings
- ✅ Free for development/testing
- ✅ Safe to use locally

### Production Keys (`pk_live_...`)
- ✅ Higher usage limits
- ✅ No console warnings
- ✅ Required for production
- ⚠️ Keep secure and private

## Need More Help?

See these guides:
- [CLERK_CONFIGURATION.md](CLERK_CONFIGURATION.md) - Detailed configuration guide
- [CLERK_SETUP.md](CLERK_SETUP.md) - Complete Clerk setup
- [README.md](README.md) - Extension overview

## Summary

✅ Get production key from Clerk dashboard (starts with `pk_live_...`)  
✅ Create `clerk-config.js` from `clerk-config.example.js`  
✅ Update key in `clerk-config.js`  
✅ Run `npm run build`  
✅ Reload extension in Chrome  
✅ Verify warning is gone!

That's it! You should now have a production-ready Clerk configuration. 🎉
