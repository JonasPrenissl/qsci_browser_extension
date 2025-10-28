# 🧪 LOCAL TESTING GUIDE - Q-SCI Browser Extension

This guide will help you test the Q-SCI browser extension locally with all features working:
- ✅ Clerk authentication
- ✅ OpenAI API integration  
- ✅ Browser extension redirection through http/https links
- ✅ Full analysis workflow

## Prerequisites

- Node.js installed
- Chrome browser
- OpenAI API key (optional - mock key will be used if not provided)

## Quick Start (5 Minutes)

### Step 1: Start the Mock Backend Server

The mock backend server provides the API endpoints that the extension needs:
- `/api/auth/openai-key` - Returns OpenAI API key
- `/api/auth/subscription-status` - Returns subscription status
- `/extension-login` - Clerk authentication page
- `/extension-auth-success` - Authentication callback page

```bash
# Start the mock backend server
node mock-backend-server.js
```

You should see:
```
╔════════════════════════════════════════════════════════════════╗
║  Q-SCI Mock Backend Server                                    ║
║  FOR LOCAL TESTING ONLY                                       ║
╚════════════════════════════════════════════════════════════════╝

✅ Server running at http://localhost:5000/
```

**Keep this terminal window open!** The server must run while you test the extension.

### Step 2: Build the Extension

Open a **new terminal** and build the extension:

```bash
npm run build
```

You should see:
```
⚠️  Warning: Using development/test Clerk key (pk_test_...)
✓ Build complete: dist/js/bundle-auth.js
```

### Step 3: Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the extension directory: `/home/runner/work/qsci_browser_extension/qsci_browser_extension`
5. The extension should load successfully ✅

### Step 4: Test Authentication

1. Click the Q-SCI extension icon in your browser toolbar
2. You should see the login screen
3. Click **"🔐 Login with Clerk"**
4. A new window will open showing the Clerk authentication page
5. Sign up or sign in with your test account
6. After authentication, the window should close automatically
7. The extension popup should now show you as logged in

### Step 5: Test Paper Analysis

Now test the paper analysis feature:

1. Go to a supported website (e.g., https://pubmed.ncbi.nlm.nih.gov/)
2. Navigate to any paper details page
3. Click the Q-SCI extension icon
4. The extension should show "✅ Scientific site detected"
5. Click **"Analyze Paper"**
6. Wait for the analysis to complete (may take 30-60 seconds)
7. You should see:
   - Quality score (percentage)
   - Traffic light indicator (🟢/🟡/🔴)
   - Impact factor and quartile information

## Configuration Options

### Using a Real OpenAI API Key

If you have an OpenAI API key and want to test with real AI analysis:

1. Stop the mock backend server (Ctrl+C)
2. Set your API key as an environment variable:

```bash
# On Linux/Mac:
export OPENAI_API_KEY="sk-your-real-api-key-here"

# On Windows (PowerShell):
$env:OPENAI_API_KEY="sk-your-real-api-key-here"
```

3. Start the mock backend server again:
```bash
node mock-backend-server.js
```

The server will now use your real OpenAI API key for analysis.

### Switching to Production Mode

To use the extension with the production backend (when deployed):

1. Edit `src/auth.js`:
   - Change `CLERK_AUTH_URL` to `https://www.q-sci.org/extension-login`
   - Change `API_BASE_URL` to `https://www.q-sci.org/api`

2. Edit `clerk-config.js`:
   - Change `publishableKey` to your production Clerk key (starts with `pk_live_`)

3. Rebuild:
```bash
npm run build
```

4. Reload the extension in Chrome

## Troubleshooting

### "Failed to open authentication window"
- **Cause**: Pop-ups are blocked
- **Fix**: Allow pop-ups for the extension

### "Backend endpoint not found (404)"
- **Cause**: Mock backend server is not running
- **Fix**: Make sure you started `mock-backend-server.js` and it's running on port 5000

### "Unable to retrieve API key from backend"
- **Cause**: Backend server is not running or returning errors
- **Fix**: Check the mock backend server terminal for error messages

### "Authentication window was closed"
- **Cause**: User closed the auth window before completing login
- **Fix**: Try logging in again and complete the authentication process

### Extension won't load
- **Cause**: Extension is on a network drive
- **Fix**: Copy the extension folder to your local hard drive (C:\, D:\, etc.)

### "Insufficient text provided for analysis"
- **Cause**: Not on a paper details page, or page content couldn't be extracted
- **Fix**: Make sure you're on a paper details page (not a search results page)

## Testing Checklist

Use this checklist to verify all features work:

- [ ] Extension loads without errors in Chrome
- [ ] Mock backend server starts successfully
- [ ] Login button opens Clerk authentication window
- [ ] Authentication completes and window closes
- [ ] Extension shows "Logged in as: your@email.com"
- [ ] Usage counter shows "0 / 10" (free tier)
- [ ] Supported site detection works (✅ Scientific site detected)
- [ ] Paper analysis button is enabled when logged in
- [ ] Analysis completes successfully
- [ ] Results show quality score, traffic light, and metrics
- [ ] View details button works
- [ ] Logout button works

## Architecture Overview

### Request Flow

```
Extension → Mock Backend → OpenAI API (if real key provided)
   ↓
Storage (chrome.storage.local)
   ↓
Display Results
```

### Authentication Flow

```
1. User clicks "Login" in extension
2. Extension opens http://localhost:5000/extension-login
3. User authenticates with Clerk
4. Clerk redirects to http://localhost:5000/extension-auth-success
5. Success page sends token to extension via postMessage
6. Extension stores token in chrome.storage.local
7. Auth window closes, user is logged in
```

### Analysis Flow

```
1. User clicks "Analyze Paper"
2. Extension extracts page content
3. Extension fetches OpenAI API key from backend
4. Extension calls OpenAI API with paper content
5. OpenAI returns analysis (quality score, aspects, etc.)
6. Extension displays results
7. Usage counter is incremented
```

## Mock Backend API Endpoints

The mock backend server provides these endpoints:

### GET /api/auth/openai-key
Returns the OpenAI API key for authenticated users.

**Request:**
```
GET /api/auth/openai-key
Authorization: Bearer <token>
```

**Response:**
```json
{
  "api_key": "sk-test-mock-key-for-local-testing-only"
}
```

### GET /api/auth/subscription-status
Returns the user's subscription status.

**Request:**
```
GET /api/auth/subscription-status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "subscription_status": "free"
}
```

## Next Steps

After successful local testing:

1. **Deploy Backend**: Deploy real backend API endpoints to Vercel or similar
2. **Deploy Website Pages**: Deploy authentication pages to your domain
3. **Update Configuration**: Switch to production URLs and keys
4. **Package Extension**: Create distributable package for Chrome Web Store
5. **Test in Production**: Verify all features work with production backend

## Support

If you encounter issues:

1. Check the mock backend server terminal for error messages
2. Check browser console (F12) for extension errors
3. Verify all files are present and the extension built successfully
4. Try restarting the mock backend server
5. Try reloading the extension in Chrome

## Files Modified/Created

- **✨ NEW:** `mock-backend-server.js` - Local testing backend server
- **✨ NEW:** `extension-config.json` - Configuration for local/production modes
- **✨ NEW:** `LOCAL_TESTING_GUIDE.md` - This guide
- **📝 MODIFIED:** `src/auth.js` - Updated to use localhost URLs for testing
- **📝 MODIFIED:** `clerk-config.js` - Added test Clerk key

## Production Deployment Checklist

When ready to deploy to production:

- [ ] Deploy backend API to Vercel/similar hosting
- [ ] Deploy website auth pages to domain (q-sci.org)
- [ ] Set environment variables on hosting (OPENAI_API_KEY, CLERK_SECRET_KEY)
- [ ] Update `src/auth.js` with production URLs
- [ ] Update `clerk-config.js` with production Clerk key
- [ ] Build production version: `npm run build`
- [ ] Test with production backend
- [ ] Package for Chrome Web Store
- [ ] Submit to Chrome Web Store for review

---

**Happy Testing! 🚀**
