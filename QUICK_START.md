# Q-SCI Extension - Quick Start Guide

Get up and running in 5 minutes!

## ⚡ Quick Setup (5 Steps)

### Step 1: Copy to Local Drive (If on Network)
```
❌ \\charite.de\homes\...  (Network drive - won't work!)
✅ C:\Users\YourName\Documents\qsci_browser_extension  (Local drive - works!)
```

### Step 2: Get Clerk Keys
1. Go to https://clerk.com
2. Sign up (free)
3. Create new application
4. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### Step 3: Configure Extension
Edit `clerk-auth.html` (use Notepad or any text editor):

**Find and replace (Line ~151):**
```html
<!-- BEFORE: -->
data-clerk-publishable-key="YOUR_CLERK_PUBLISHABLE_KEY"

<!-- AFTER: -->
data-clerk-publishable-key="pk_test_your_actual_key_here"
```

**Find and replace (Line ~170):**
```javascript
// BEFORE:
const clerk = new Clerk('YOUR_CLERK_PUBLISHABLE_KEY');

// AFTER:
const clerk = new Clerk('pk_test_your_actual_key_here');
```

**Find and replace (Line ~152):**
```html
<!-- BEFORE: -->
src="https://[your-clerk-frontend-api].clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"

<!-- AFTER: -->
src="https://your-app-name.clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
```

### Step 4: Load in Chrome
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select your **local** extension folder
5. Note your **Extension ID**

### Step 5: Configure Clerk Redirect
1. Go to Clerk Dashboard → Your App → Settings
2. Add redirect URL:
   ```
   chrome-extension://YOUR_EXTENSION_ID/clerk-auth.html
   ```
   (Replace `YOUR_EXTENSION_ID` with actual ID from Step 4)

## 🎉 Done! Test It:

1. Click extension icon
2. Click "Login with Clerk"
3. Sign up / Sign in
4. Go to https://pubmed.ncbi.nlm.nih.gov/
5. Find any paper
6. Click "Analyze Paper"
7. See results!

## 🔧 Configure User Subscription

For each user in Clerk Dashboard:
1. Go to Users → Select user
2. Click "Public metadata"
3. Add:
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

## 📊 Usage Limits

| Type | Analyses/Day |
|------|--------------|
| Free | 10 |
| Subscribed | 100 |

## ❓ Problems?

### "Background script error"
→ Extension on network drive. Copy to local drive (C:\, D:\, etc.)

### "Pop-up blocked"
→ Allow pop-ups in Chrome for the extension

### "Authentication failed"
→ Check Clerk key is correct in `clerk-auth.html`

### "Not a supported site"
→ Only works on scientific paper websites (PubMed, arXiv, Nature, etc.)

### "Please login to use analysis features"
→ Click "Login with Clerk" first!

## 📚 Full Documentation

Need more details?
- **[INSTALLATION.md](INSTALLATION.md)** - Complete installation guide
- **[FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md)** - German troubleshooting
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Test all features
- **[CLERK_SETUP.md](CLERK_SETUP.md)** - Detailed Clerk setup

## ✅ Success Checklist

- [x] Extension on local drive (not network)
- [x] Clerk keys configured in clerk-auth.html
- [x] Extension loaded in Chrome without errors
- [x] Extension ID noted
- [x] Clerk redirect URL configured
- [x] Can login with Clerk
- [x] Can analyze papers
- [x] Usage counter works

## 🎯 Quick Test

**Logged out:**
- Buttons disabled ❌
- Must login ✓

**Logged in:**
- Buttons enabled ✅
- Can analyze ✓
- Counter updates ✓

**Free user:**
- 10 analyses/day ✓
- Upgrade prompt shown ✓

**Subscribed user:**
- 100 analyses/day ✓
- No upgrade prompt ✓

---

**Ready?** Load the extension and start analyzing papers! 🚀
