# Build Instructions

This extension now bundles the Clerk authentication library locally instead of loading it from a remote CDN.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Building the Extension

If you make changes to the authentication logic, you'll need to rebuild the bundles:

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Bundles

```bash
npm run build
```

This will create/update the following files in the `js/` directory:
- `bundle-clerk.js` - The bundled Clerk SDK
- `clerk-auth.js` - The authentication logic

### 3. Development Mode with Auto-Reload

For development with auto-rebuilding on file changes AND automatic extension reload:

```bash
npm run dev
```

This command runs both:
- **build:watch**: Automatically rebuilds bundles when source files change
- **reload:server**: Runs a WebSocket server that triggers the extension to reload when files change

The dev reload server:
- Watches for changes in the extension directory
- Serves dev-reload.js on http://localhost:35729/dev-reload.js
- Broadcasts reload signals via WebSocket to the extension
- The extension's service worker automatically reloads on file changes

#### Setting Up Chrome for Development

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the repository root directory
5. Start development mode: `npm run dev`
6. Edit files → they'll rebuild → extension auto-reloads

Note: The dev reload functionality only activates when the dev server is running. In production, the extension works normally without any dev dependencies.

## What's Bundled

- **bundle-clerk.js**: Contains the complete `@clerk/clerk-js` library (~1.4MB)
- **clerk-auth.js**: Contains the authentication logic extracted from `clerk-auth.html`

## Source Files

The source files are located in the `src/` directory:
- `src/clerk-bundle.js` - Imports and exposes Clerk SDK globally
- `src/clerk-auth-main.js` - Authentication logic and UI handling

## Notes

- The bundled files are included in the repository so end users don't need to build
- Only developers modifying the authentication logic need to rebuild
- The bundle size warning from webpack is expected for the Clerk SDK
