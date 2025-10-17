# Q-SCI Browser Extension - Installation Guide

## ⚠️ Important: Network Drive Issue

If you receive an error like:
```
Das Hintergrundskript „background.js" konnte nicht geladen werden
(The background script "background.js" could not be loaded)
```

And your extension path shows a network location like:
```
\\charite.de\homes\h08\jopr10\Dokumente\...
```

**This is the problem!** Chrome extensions cannot be loaded from network drives or UNC paths. This is a Chrome security restriction.

## Solution: Copy to Local Drive

### Option 1: Copy to Local Documents (Recommended)

1. **Copy the entire extension folder** to your local drive:
   - From: `\\charite.de\homes\h08\jopr10\Dokumente\...`
   - To: `C:\Users\YourUsername\Documents\qsci_browser_extension`

2. **Load the extension from the local path**:
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the folder: `C:\Users\YourUsername\Documents\qsci_browser_extension`

### Option 2: Use Desktop Location

1. **Copy the extension folder to your Desktop**:
   - To: `C:\Users\YourUsername\Desktop\qsci_browser_extension`

2. **Load from Desktop** (same steps as above)

### Option 3: Create Dedicated Extensions Folder

1. **Create a local folder for extensions**:
   ```
   C:\ChromeExtensions\qsci_browser_extension
   ```

2. **Copy the extension there** and load it

## Installation Steps (After Copying Locally)

### 1. Prerequisites

- Google Chrome browser (latest version)
- Extension files copied to a **local** drive (not network drive)

### 2. Configure Clerk Authentication

Before loading the extension, you need to set up Clerk authentication:

1. **Get Clerk credentials**:
   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Get your **Publishable Key** from the API Keys section

2. **Update clerk-auth.html**:
   - Open `clerk-auth.html` in a text editor
   - Find line ~151 (in the `<script>` tag):
     ```html
     data-clerk-publishable-key="YOUR_CLERK_PUBLISHABLE_KEY"
     ```
   - Replace `YOUR_CLERK_PUBLISHABLE_KEY` with your actual key
   
   - Find line ~170:
     ```javascript
     const clerk = new Clerk('YOUR_CLERK_PUBLISHABLE_KEY');
     ```
   - Replace `YOUR_CLERK_PUBLISHABLE_KEY` with your actual key

3. **Update the Clerk SDK URL**:
   - In the same `<script>` tag, find:
     ```html
     src="https://[your-clerk-frontend-api].clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
     ```
   - Replace `[your-clerk-frontend-api]` with your Clerk frontend API URL
   - Example: `https://your-app-name.clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js`

### 3. Load Extension in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`

2. Enable **Developer mode** (toggle in top right corner)

3. Click **"Load unpacked"**

4. Navigate to your **local** extension folder (not network drive!)

5. Select the folder containing `manifest.json`

6. The extension should now appear in your extensions list

### 4. Get Your Extension ID

After loading:
1. Look at the extension card in `chrome://extensions/`
2. Note the **Extension ID** (long string of letters, e.g., `abcdefghijklmnopqrstuvwxyz123456`)
3. You'll need this for Clerk configuration

### 5. Configure Clerk Redirect URLs

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to: **Your App → Settings → Allowed redirect URLs**
3. Add:
   ```
   chrome-extension://YOUR_EXTENSION_ID/clerk-auth.html
   ```
   Replace `YOUR_EXTENSION_ID` with the actual ID from step 4

### 6. Set Up User Subscription Status

For each user, set their subscription status in Clerk:

1. In Clerk Dashboard, go to **Users**
2. Select a user
3. Click **Public metadata**
4. Add:
   ```json
   {
     "subscription_status": "free"
   }
   ```
   or
   ```json
   {
     "subscription_status": "subscribed"
   }
   ```

## Testing the Extension

1. **Click the extension icon** in Chrome toolbar
2. **Click "Login with Clerk"**
3. **A pop-up window should open** with Clerk authentication
4. **Sign in or sign up**
5. **Verify login status** in the extension popup
6. **Navigate to a scientific paper** (e.g., pubmed.ncbi.nlm.nih.gov)
7. **Click "Analyze Paper"**
8. **Check that usage counter updates** after analysis

## Troubleshooting

### Extension Won't Load

**Problem**: Background script error  
**Solution**: Ensure extension is on **local drive**, not network drive

**Problem**: Manifest file not found  
**Solution**: Make sure you selected the correct folder containing `manifest.json`

### Authentication Issues

**Problem**: Pop-up window doesn't open  
**Solution**: Allow pop-ups for the extension in Chrome settings

**Problem**: Authentication fails  
**Solution**: 
- Check Clerk publishable key is correct in `clerk-auth.html`
- Verify redirect URL is configured in Clerk dashboard
- Check browser console for error messages

**Problem**: "Please login to use analysis features" message  
**Solution**: This is correct! Only logged-in users can use the extension

### Usage Limit Issues

**Problem**: Usage counter doesn't update  
**Solution**: 
- Check browser console for errors
- Verify authentication is working
- Check that `auth.js` is loaded correctly

**Problem**: Wrong usage limit  
**Solution**: 
- Verify subscription status in Clerk user metadata
- Should be either "free" (10/day) or "subscribed" (100/day)

## Directory Structure

```
qsci_browser_extension/
├── manifest.json           # Extension manifest
├── background.js          # Background service worker
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── popup.css             # Popup styles
├── auth.js               # Authentication & usage tracking
├── clerk-auth.html       # Clerk authentication page
├── content-script.js     # Content script for web pages
├── content-style.css     # Content script styles
├── qsci_evaluator.js     # Paper evaluation logic
├── options.html          # Extension options page
├── options.js            # Options page logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── ... (other files)
```

## Features

✅ **Clerk Authentication** - Secure login via Clerk  
✅ **Usage Limits** - 10 analyses/day (free) or 100/day (subscribed)  
✅ **Access Control** - Only logged-in users can analyze papers  
✅ **Auto-reset** - Usage counters reset daily at midnight  
✅ **Multi-site Support** - Works on PubMed, arXiv, Nature, Science, etc.

## Daily Usage Limits

| User Type | Analyses per Day |
|-----------|------------------|
| Free      | 10               |
| Subscribed| 100              |

Counters reset automatically at midnight (local time).

## Support

If you encounter issues:
1. Check browser console (F12) for error messages
2. Verify extension is loaded from **local drive**
3. Check Clerk configuration in `clerk-auth.html`
4. See [CLERK_SETUP.md](CLERK_SETUP.md) for detailed Clerk setup
5. See [AUTHENTICATION.md](AUTHENTICATION.md) for technical details

## Security Notes

- Extension never stores passwords
- All authentication handled by Clerk
- Session tokens stored locally in Chrome storage
- Only secure HTTPS connections to Clerk and APIs

## License

Same as main project license.
