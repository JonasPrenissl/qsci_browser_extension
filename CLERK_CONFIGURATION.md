# Clerk Configuration Guide

This document explains how to properly configure Clerk authentication keys for the Q-SCI browser extension.

## Overview

The extension uses a configuration file (`clerk-config.js`) to manage Clerk publishable keys. This allows you to:
- Easily switch between development and production keys
- Keep sensitive keys out of version control
- Avoid hardcoding keys in source files

## Quick Start

### 1. Create Configuration File

Copy the example configuration to create your own:

```bash
cp clerk-config.example.js clerk-config.js
```

### 2. Add Your Clerk Key

Edit `clerk-config.js` and replace the placeholder with your actual Clerk publishable key:

```javascript
const CLERK_CONFIG = {
  publishableKey: 'pk_test_your_actual_key_here',  // or pk_live_... for production
};
```

### 3. Rebuild Extension

After updating the configuration, rebuild:

```bash
npm install  # if dependencies aren't installed
npm run build
```

### 4. Reload Extension

Go to `chrome://extensions` and click the reload icon for the Q-SCI extension.

## Development vs Production Keys

### Development Keys (`pk_test_...`)

**Purpose**: Testing and development only

**Characteristics**:
- Start with `pk_test_`
- Have strict usage limits
- Show console warning: "Clerk has been loaded with development keys"
- Free to use for testing

**When to use**:
- Local development
- Testing features
- Debugging issues

**Example**: `pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA`

### Production Keys (`pk_live_...`)

**Purpose**: Production deployments

**Characteristics**:
- Start with `pk_live_`
- No usage limits (based on your Clerk plan)
- No console warnings
- Requires production Clerk instance

**When to use**:
- Production deployments
- Public releases
- Real user environments

**Example**: `pk_live_Y2xlcmsuZXhhbXBsZS5jb20k`

## Getting Your Keys

### From Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **API Keys** section
4. Choose your instance:
   - **Development**: For testing (shows test keys)
   - **Production**: For deployment (shows live keys)
5. Copy the **Publishable Key**

### Instance Switching

At the top of the Clerk dashboard, you can switch between:
- **Development** instance → provides `pk_test_...` keys
- **Production** instance → provides `pk_live_...` keys

## Configuration File Structure

The `clerk-config.js` file has this simple structure:

```javascript
const CLERK_CONFIG = {
  // Your Clerk Publishable Key
  publishableKey: 'YOUR_KEY_HERE',
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CLERK_CONFIG;
}

// Global variable for direct script includes
if (typeof window !== 'undefined') {
  window.CLERK_CONFIG = CLERK_CONFIG;
}
```

## How It Works

1. **Configuration Loading**: 
   - `clerk-auth.html` loads `clerk-config.js` before the authentication bundle
   - This makes `CLERK_CONFIG` available globally via `window.CLERK_CONFIG`

2. **Key Usage**:
   - `src/auth.js` imports the config and uses the key for Clerk initialization
   - `src/clerk-auth-main.js` checks for `window.CLERK_CONFIG` and uses the key

3. **Build Process**:
   - `npm run build` bundles the source files into `dist/js/bundle-auth.js`
   - The configuration is imported but the actual key value comes from `clerk-config.js`
   - This keeps keys separate from bundled code

## Security Considerations

### What's Safe

✅ `clerk-config.example.js` - Safe to commit (contains no real keys)  
✅ Source files (`src/*.js`) - Safe to commit (imports config, no hardcoded keys)  
✅ Build output (`dist/js/bundle-auth.js`) - References config, safe to commit  

### What's Sensitive

❌ `clerk-config.js` - **NEVER commit** (contains your actual keys)  
❌ Production keys - Keep secure, don't share publicly  

### Git Protection

The `.gitignore` file includes:
```
clerk-config.js
.env
.env.local
```

This prevents accidental commits of your actual configuration.

## Troubleshooting

### Warning: "Clerk has been loaded with development keys"

**Problem**: You're seeing this console warning in your deployment.

**Cause**: You're using a test key (`pk_test_...`) instead of a production key.

**Solution**:
1. Get your production key from Clerk dashboard (Production instance)
2. Update `clerk-config.js` with the production key (`pk_live_...`)
3. Run `npm run build`
4. Reload the extension

### "clerk-config.js not found" Warning

**Problem**: Build works but you see this warning in console.

**Cause**: The configuration file wasn't created.

**Solution**:
```bash
cp clerk-config.example.js clerk-config.js
# Edit clerk-config.js with your key
npm run build
```

### Extension Won't Load After Configuration Change

**Problem**: Extension errors after updating configuration.

**Cause**: Extension not rebuilt or reloaded.

**Solution**:
1. Make sure you ran `npm run build`
2. Go to `chrome://extensions`
3. Click the reload icon on the Q-SCI extension
4. Check browser console for any errors

### Key Not Working

**Problem**: Authentication fails with your key.

**Cause**: Incorrect key, wrong instance, or configuration issue.

**Solution**:
1. Verify the key is correct in Clerk dashboard
2. Ensure you're using the right instance (dev/prod)
3. Check that redirect URLs are configured in Clerk
4. Verify the key is properly formatted (no extra spaces/quotes)

## Best Practices

### For Development

1. Use test keys (`pk_test_...`)
2. Keep `clerk-config.js` local only
3. Document which Clerk instance you're using
4. Don't worry about usage warnings during testing

### For Production

1. **Always** use production keys (`pk_live_...`)
2. Verify no console warnings appear
3. Test authentication flow before releasing
4. Monitor Clerk dashboard for usage/errors
5. Keep production keys secure and private

### For Team Collaboration

1. Share `clerk-config.example.js` with the team
2. Document where to get keys (Clerk dashboard)
3. Each developer maintains their own `clerk-config.js`
4. Use different Clerk instances for different environments
5. Never commit actual keys to version control

## Environment-Specific Configurations

For different environments, you can maintain separate configuration files:

```bash
# Development
cp clerk-config.example.js clerk-config.dev.js
# Add test key to clerk-config.dev.js

# Production  
cp clerk-config.example.js clerk-config.prod.js
# Add production key to clerk-config.prod.js

# Copy the appropriate one before building
cp clerk-config.dev.js clerk-config.js   # for dev
cp clerk-config.prod.js clerk-config.js  # for prod

npm run build
```

## Related Documentation

- [CLERK_SETUP.md](CLERK_SETUP.md) - Full Clerk setup guide
- [README.md](README.md) - Extension overview
- [INSTALLATION.md](INSTALLATION.md) - Installation instructions
- [Clerk Documentation](https://clerk.com/docs) - Official Clerk docs

## Support

If you encounter issues with Clerk configuration:

1. Check this guide for troubleshooting steps
2. Review [CLERK_SETUP.md](CLERK_SETUP.md) for setup details
3. Check browser console for specific error messages
4. Verify configuration in Clerk dashboard
5. Ensure you've rebuilt and reloaded the extension

## Summary

✅ Copy `clerk-config.example.js` to `clerk-config.js`  
✅ Add your Clerk publishable key  
✅ Use test keys (`pk_test_...`) for development  
✅ Use production keys (`pk_live_...`) for deployment  
✅ Run `npm run build` after changes  
✅ Never commit `clerk-config.js` to version control  

With proper configuration, you'll avoid the "development keys" warning and have a smooth authentication experience!
