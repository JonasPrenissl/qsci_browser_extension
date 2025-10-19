# Build System for Q-SCI Browser Extension

## Overview

This extension uses a build system to bundle the Clerk authentication SDK with local authentication logic, allowing the extension to work without loading remote scripts from CDNs.

## Build Process

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

Install dependencies:

```bash
npm install
```

This will install:
- `@clerk/clerk-js` - Clerk authentication SDK
- `esbuild` - Fast JavaScript bundler

### Building

To build the authentication bundle:

```bash
npm run build
```

This command:
1. Reads the source file `src/auth.js`
2. Bundles it with the Clerk SDK from `@clerk/clerk-js`
3. Outputs the bundled file to `dist/js/bundle-auth.js`
4. Creates a source map at `dist/js/bundle-auth.js.map`

### Build Configuration

The build is configured in `build.js`:

- **Entry point**: `src/auth.js`
- **Output**: `dist/js/bundle-auth.js`
- **Format**: IIFE (Immediately Invoked Function Expression) for browser compatibility
- **Target**: Chrome 90+
- **Minification**: Disabled for debugging
- **Source maps**: Enabled for debugging

## Authentication Flow

The bundled authentication module (`src/auth.js`) includes:

1. **Clerk Initialization**: Initializes Clerk SDK with a publishable key placeholder
2. **i18n Integration**: Initializes internationalization before authentication
3. **Sign-in UI**: Mounts Clerk's sign-in component into the page
4. **Session Detection**: Polls for successful sign-in using session checks
5. **Success Handling**: 
   - Posts `CLERK_AUTH_SUCCESS` message to opener window with auth data (token, userId, email, subscriptionStatus)
   - Falls back to `chrome.storage.local` when opener is not available
   - Validates opener origin where possible for security

## File Structure

```
.
├── src/
│   └── auth.js              # Authentication source code
├── dist/
│   └── js/
│       ├── bundle-auth.js   # Bundled authentication (included in git)
│       └── bundle-auth.js.map # Source map (included in git)
├── clerk-auth.html          # Authentication page
├── build.js                 # Build script
├── package.json             # Dependencies and build script
└── BUILD_README.md          # This file
```

## Configuration

### Clerk Publishable Key

The authentication module uses a placeholder key in `src/auth.js`:

```javascript
const CLERK_PUBLISHABLE_KEY = 'pk_test_REPLACE_WITH_YOUR_CLERK_PUBLISHABLE_KEY';
```

**Important**: Replace this placeholder with your actual Clerk publishable key before deploying.

### .gitignore

The `.gitignore` file is configured to:
- Exclude `node_modules/`
- Exclude most files in `dist/` except the bundle
- Include `dist/js/bundle-auth.js` and `dist/js/bundle-auth.js.map` in version control

This ensures the bundled files are available for the extension without requiring users to build.

## Development Workflow

1. **Make changes** to `src/auth.js`
2. **Rebuild** by running `npm run build`
3. **Test** the extension by reloading it in Chrome
4. **Commit** both the source and bundled files

## Why Bundle?

Browser extensions cannot load remote scripts from CDNs due to Content Security Policy (CSP) restrictions. By bundling the Clerk SDK locally:

- ✅ No remote script loading required
- ✅ Extension works offline
- ✅ Passes Chrome Web Store review requirements
- ✅ Better security and privacy
- ✅ Faster load times (no CDN dependency)

## Troubleshooting

### Build Fails

If the build fails, try:

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Bundle Not Loading

If the bundle doesn't load in the extension:

1. Check that `dist/js/bundle-auth.js` exists
2. Verify `manifest.json` includes the bundle in `web_accessible_resources`
3. Check browser console for errors
4. Ensure `clerk-auth.html` references the correct bundle path

### Clerk Import Error

If you see an error about Clerk imports, ensure you're using the named import:

```javascript
// Correct ✅
import { Clerk } from '@clerk/clerk-js';

// Incorrect ❌
import Clerk from '@clerk/clerk-js';
```

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [esbuild Documentation](https://esbuild.github.io/)
- [Chrome Extension CSP](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy)
