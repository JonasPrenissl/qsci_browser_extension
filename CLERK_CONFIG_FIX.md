# Clerk Configuration Fix

## Problem
The extension was showing the error: **"Fehler beim Initialisieren der Authentifizierung: Clerk API-Schlüssel fehlt"** (Error initializing authentication: Clerk API key is missing)

## Root Cause
The `clerk-config.js` file was missing from the repository because it was in `.gitignore`. This file is required by the build process to bundle the Clerk authentication SDK with the correct API key.

## Solution Implemented

### 1. Created Default clerk-config.js
A `clerk-config.js` file has been created with a working default test key that allows the extension to build and run for testing purposes.

```javascript
const CLERK_CONFIG = {
  publishableKey: 'pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA',
};
```

### 2. Improved Build Process
The `build.js` script now includes:
- **Pre-build validation**: Checks if `clerk-config.js` exists before building
- **Key validation**: Warns if using placeholder or test keys
- **Helpful error messages**: Provides clear instructions if the config is missing
- **Production warnings**: Alerts when using development keys in production

### 3. Updated .gitignore
The `clerk-config.js` file is now tracked in git with a default test key. This ensures:
- The repository builds successfully out of the box
- Users can test the extension immediately
- Production deployments can override the file locally

## For Development/Testing

The default configuration works immediately:

```bash
npm install
npm run build
```

The extension will use the test key and work for development/testing purposes.

## For Production Deployment

If you need to deploy to production:

1. **Get your production Clerk publishable key:**
   - Go to https://dashboard.clerk.com
   - Navigate to your app > API Keys
   - Switch to "Production" instance
   - Copy the publishable key (starts with `pk_live_`)

2. **Update clerk-config.js locally:**
   ```javascript
   const CLERK_CONFIG = {
     publishableKey: 'pk_live_YOUR_PRODUCTION_KEY_HERE',
   };
   ```

3. **Rebuild the extension:**
   ```bash
   npm run build
   ```

4. **Deploy the built extension**

**Note:** For production deployments, you may want to add `clerk-config.js` to your local `.git/info/exclude` file to prevent accidentally committing your production key.

## Build Warnings Explained

### ⚠️ Using development/test Clerk key
This warning appears when building with a test key (`pk_test_...`). It's normal for development but should be replaced with a production key (`pk_live_...`) for production deployments.

### ❌ clerk-config.js not found
This error appears if the `clerk-config.js` file is missing. The build script provides instructions to fix it.

### ⚠️ Placeholder or empty publishable key
This warning appears if the key is set to `YOUR_CLERK_PUBLISHABLE_KEY_HERE` or is empty. Update the key with a valid Clerk publishable key.

## Verification

After building, you can verify the configuration was bundled correctly:

```bash
# Check if the key is in the bundle
grep "publishableKey" dist/js/bundle-auth.js
```

You should see your Clerk publishable key in the output.

## Additional Resources

- **Full setup guide:** See [CLERK_SETUP.md](CLERK_SETUP.md)
- **Clerk documentation:** https://clerk.com/docs
- **Get Clerk keys:** https://dashboard.clerk.com > API Keys
