# Q-SCI Extension Installation Check

## Quick Check: Are you on a local drive?

### Windows Users

Open Command Prompt in the extension folder and run:
```cmd
echo %CD%
```

**✅ GOOD** - Local drive path examples:
- `C:\Users\YourName\Documents\qsci_browser_extension`
- `C:\Users\YourName\Desktop\qsci_browser_extension`
- `D:\Projects\qsci_browser_extension`

**❌ BAD** - Network drive path examples:
- `\\charite.de\homes\h08\jopr10\...` (UNC path)
- `Z:\Dokumente\...` (mapped network drive)
- `\\server\share\...` (network share)

### Why This Matters

Chrome extensions **cannot** be loaded from:
- ✗ Network drives (UNC paths like `\\server\...`)
- ✗ Mapped network drives (like `Z:\...` if Z: is mapped to network)
- ✗ Network shares
- ✗ Cloud sync folders that are not fully downloaded (OneDrive, Dropbox placeholders)

Chrome extensions **can** be loaded from:
- ✓ Local hard drives (`C:\`, `D:\`, etc.)
- ✓ User folders (`Documents`, `Desktop`)
- ✓ Dedicated local folders
- ✓ Fully downloaded cloud sync folders

## Installation Checklist

Before loading the extension in Chrome:

### 1. Location Check
- [ ] Extension is on local drive (C:\, D:\, etc.)
- [ ] Not on network drive or UNC path
- [ ] Full path is visible and accessible

### 2. Files Check
- [ ] `manifest.json` exists
- [ ] `background.js` exists
- [ ] `popup.html` exists
- [ ] `popup.js` exists
- [ ] `auth.js` exists
- [ ] `clerk-auth.html` exists
- [ ] `icons/` folder exists with icon files

### 3. Clerk Configuration Check
- [ ] Created Clerk account
- [ ] Got Clerk Publishable Key
- [ ] Updated `clerk-auth.html` with real Clerk key (line ~151)
- [ ] Updated `clerk-auth.html` with real Clerk key (line ~170)
- [ ] Updated Clerk SDK URL in `clerk-auth.html`

### 4. Chrome Setup Check
- [ ] Chrome is up to date
- [ ] Opened `chrome://extensions/`
- [ ] Enabled "Developer mode"
- [ ] Ready to click "Load unpacked"

## Quick Test Commands

### Check all required files exist:

**Windows Command Prompt:**
```cmd
dir manifest.json background.js popup.html popup.js auth.js clerk-auth.html
dir icons\*.png
```

**PowerShell:**
```powershell
Test-Path manifest.json
Test-Path background.js
Test-Path popup.html
Test-Path popup.js
Test-Path auth.js
Test-Path clerk-auth.html
Test-Path icons\*.png
```

All should return `True` or show the files exist.

### Check if on local drive:

**PowerShell:**
```powershell
$path = Get-Location
if ($path.Provider.Name -eq "FileSystem" -and $path.Drive.DisplayRoot -eq $null) {
    Write-Host "✓ You are on a LOCAL drive" -ForegroundColor Green
} else {
    Write-Host "✗ You might be on a NETWORK drive" -ForegroundColor Red
    Write-Host "Current path: $path"
}
```

## Common Issues

### Issue: "Cannot read property 'key' from undefined"
**Cause**: Clerk configuration not updated  
**Fix**: Edit `clerk-auth.html` and replace placeholder keys with real Clerk keys

### Issue: "Failed to load extension"
**Cause**: Wrong folder selected  
**Fix**: Select the folder that contains `manifest.json`

### Issue: "Background script could not be loaded"
**Cause**: Extension on network drive  
**Fix**: Copy extension to local drive (C:\, D:\, etc.)

### Issue: "Pop-up blocked"
**Cause**: Chrome is blocking pop-ups  
**Fix**: Allow pop-ups in Chrome settings for extensions

## After Loading Extension

### Get Extension ID:
1. Go to `chrome://extensions/`
2. Find "Q-SCI: Scientific Paper Quality Evaluator"
3. Note the ID (long string like `abcdefghijklmnopqrstuvwxyz123456`)

### Configure Clerk Redirect:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Go to your app settings
3. Add redirect URL: `chrome-extension://YOUR_EXTENSION_ID/clerk-auth.html`

### Test Login:
1. Click extension icon in Chrome toolbar
2. Click "Login with Clerk"
3. Pop-up should open
4. Sign in or sign up
5. Pop-up should close
6. Extension should show "Logged in as: your@email.com"

### Test Analysis:
1. Go to https://pubmed.ncbi.nlm.nih.gov/
2. Search for any paper
3. Open a paper details page
4. Click extension icon
5. Click "Analyze Paper"
6. Should see analysis results
7. Check usage counter updated

## File Integrity Check

Verify these files have content:

```cmd
# Windows Command Prompt
for %f in (manifest.json background.js popup.html popup.js auth.js clerk-auth.html) do @echo %f && type "%f" | find /c /v ""
```

All files should show line counts > 0.

## Ready to Install?

If all checks pass:
1. ✓ On local drive
2. ✓ All files present
3. ✓ Clerk configured
4. ✓ Chrome ready

Then proceed with:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder
5. Extension should load without errors

## Need Help?

See full documentation:
- [INSTALLATION.md](INSTALLATION.md) - Complete installation guide (English)
- [FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md) - Troubleshooting guide (German)
- [CLERK_SETUP.md](CLERK_SETUP.md) - Clerk configuration details

## Support Resources

- **Clerk Documentation**: https://clerk.com/docs
- **Chrome Extension Documentation**: https://developer.chrome.com/docs/extensions/
- **Repository Issues**: Create an issue on GitHub if you encounter problems
