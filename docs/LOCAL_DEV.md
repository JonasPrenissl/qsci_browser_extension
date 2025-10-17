# Local Development Setup

This guide explains how to configure the Q-SCI browser extension for local development.

## API Base URL Configuration

By default, the extension uses `https://your-domain.com` as the API base URL. For local development, you'll need to override this to point to your local development server.

### Setting the API Base Override

The extension reads the API base URL from `chrome.storage.sync`. To set a custom API base URL for local development:

#### Method 1: Using Chrome DevTools Console

1. Load the extension in Chrome (`chrome://extensions/`)
2. Click on "Inspect views: service worker" (or "background page" for the extension)
3. In the DevTools console that opens, paste and execute:

```javascript
chrome.storage.sync.set({ QSCI_API_BASE: 'http://localhost:5173' }, () => console.log('QSCI API base set')); 
```

4. Reload the extension (disable and re-enable, or click the reload icon on chrome://extensions/)
5. You should see a console log: `Q-SCI: using configured API base http://localhost:5173`

#### Method 2: Using Extension Popup Console

Alternatively, you can set the override from any extension context:

1. Right-click the extension icon and select "Inspect popup"
2. In the console, run the same command:

```javascript
chrome.storage.sync.set({ QSCI_API_BASE: 'http://localhost:5173' }, () => console.log('QSCI API base set')); 
```

### Common Local Development URLs

Depending on your development setup, use one of these:

- **Vite dev server**: `http://localhost:5173`
- **Create React App**: `http://localhost:3000`
- **Flask/Python backend**: `http://localhost:5000`
- **Express/Node backend**: `http://localhost:3000`
- **Custom port**: `http://localhost:<YOUR_PORT>`

### Verifying the Configuration

After setting the API base override:

1. Open the extension popup by clicking the extension icon
2. Open DevTools (right-click → Inspect)
3. Look for the console message: `Q-SCI: using configured API base <your-url>`
4. Try clicking "Sign In" or "Analyze Paper"
5. In the Network tab, verify requests are going to your configured URL

### Resetting to Production

To remove the override and use the production default:

```javascript
chrome.storage.sync.remove('QSCI_API_BASE', () => console.log('QSCI API base override removed'));
```

### Viewing Current Configuration

To check what API base is currently configured:

```javascript
chrome.storage.sync.get(['QSCI_API_BASE'], (res) => console.log('Current API base:', res.QSCI_API_BASE || 'default'));
```

## Testing API Calls

After configuring the API base:

1. Navigate to a scientific paper (e.g., PubMed, arXiv)
2. Click the extension icon
3. Click "Analyze Paper"
4. Open DevTools Network tab
5. Verify the API request goes to: `${QSCI_API_BASE}/api/evaluate`

Example expected request:
- **URL**: `http://localhost:5173/api/evaluate` (if using Vite)
- **Method**: POST
- **Headers**: `Content-Type: application/json`

## Troubleshooting

### Override Not Working

If the API base override isn't being applied:

1. Check that chrome.storage.sync is supported in your environment
2. Verify the storage value was set: 
   ```javascript
   chrome.storage.sync.get(null, (data) => console.log('All storage:', data));
   ```
3. Reload the extension completely (disable and re-enable)
4. Check the background service worker console for the confirmation message

### CORS Errors

If you see CORS errors in the console:

1. Ensure your local development server includes proper CORS headers
2. Add the extension's origin to your server's CORS whitelist
3. For development, you may need to allow all origins: `Access-Control-Allow-Origin: *`

### Wrong API Base Being Used

If requests are still going to the wrong URL:

1. Check both the background service worker and popup consoles
2. Verify `QSCI_API_BASE` is set correctly in storage
3. Look for the "Q-SCI: using configured API base" log message
4. Ensure no other code is overriding the variable

## Example Configuration File

See `extension-config.example.json` in the repo root for an example configuration structure.

## Support

For additional help:
- Check the browser console for error messages
- Review [INSTALLATION.md](../INSTALLATION.md) for general setup
- See [README_CLERK.md](../README_CLERK.md) for authentication setup
