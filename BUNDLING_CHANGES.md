# Clerk Authentication Bundling Changes

## What Changed?

The Clerk authentication library (`@clerk/clerk-js`) is now **bundled locally** with the extension instead of being loaded from a remote CDN.

## Before

```html
<!-- Remote CDN script -->
<script
  crossorigin="anonymous"
  data-clerk-publishable-key="..."
  src="https://optimal-jennet-35.clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
></script>

<!-- Inline authentication logic (300+ lines) -->
<script>
  // All authentication code here...
</script>
```

## After

```html
<!-- Local bundled scripts -->
<script src="js/bundle-clerk.js"></script>
<script src="js/clerk-auth.js"></script>
```

## Benefits

1. **No Remote Dependencies**: Extension works without relying on external CDN
2. **Better Security**: No remote script execution, complies with strict CSP
3. **Offline Support**: Once loaded, works without internet for the SDK
4. **Reliability**: No CDN downtime or network issues
5. **Cleaner Code**: No inline scripts in HTML files

## Files Added

- `package.json` - NPM dependencies and build scripts
- `webpack.config.js` - Webpack bundler configuration
- `src/clerk-bundle.js` - Imports and exposes Clerk SDK globally
- `src/clerk-auth-main.js` - Authentication logic (extracted from HTML)
- `js/bundle-clerk.js` - Bundled Clerk SDK (~1.4MB, minified)
- `js/clerk-auth.js` - Bundled authentication logic (minified)
- `BUILD.md` - Build instructions for developers

## Files Modified

- `clerk-auth.html` - Replaced remote script and inline code with local scripts
- `manifest.json` - Added `js/` files to web_accessible_resources
- `README_CLERK.md` - Updated with bundling information
- `CLERK_SETUP.md` - Updated configuration instructions

## For End Users

**No changes needed!** The extension works exactly the same way. Just install and use as before.

## For Developers

If you need to modify the authentication logic:

1. Edit `src/clerk-auth-main.js` (not the bundled file)
2. Run `npm install` (first time only)
3. Run `npm run build` to rebuild bundles
4. Test your changes

See [BUILD.md](BUILD.md) for detailed build instructions.

## Bundle Size

- `bundle-clerk.js`: ~1.4MB (minified Clerk SDK)
- `clerk-auth.js`: ~5KB (minified auth logic)

The bundle size warning from webpack is expected and normal for the Clerk SDK.

## Host Permissions

The extension still requires `https://*.clerk.accounts.dev/*` permissions because Clerk makes API calls to their servers for authentication. This is normal and expected - we're bundling the SDK code, not the authentication service itself.
