# Q-SCI Browser Extension - File Guide

Quick reference for understanding the purpose of each file in the Clerk integration.

## Core Extension Files

### Main Extension Files
- **manifest.json** - Chrome extension configuration, permissions, and resources
- **popup.html** - Extension popup UI with login button and user status
- **popup.js** - Popup logic, handles authentication flow and analysis
- **popup.css** - Styling for the popup (not modified)

### Authentication Files
- **auth.js** - Authentication service using Clerk, usage tracking
- **clerk-auth.html** - Clerk authentication page (opened in pop-up window)

### Content Scripts
- **content-script.js** - Injected into web pages to extract paper content
- **background.js** - Service worker for extension

### Analysis Files
- **qsci_evaluator.js** - Paper quality evaluation logic
- **qsci_calibration_publications.json** - Reference data for quality scoring

### Settings
- **options.html** - Extension settings page
- **options.js** - Settings page logic

## Documentation Files

### Setup & Configuration
- **CLERK_SETUP.md** - ⭐ START HERE - Complete Clerk setup guide
- **clerk-config.example.js** - Example configuration with placeholders
- **README_CLERK.md** - Quick overview of Clerk integration

### Technical Documentation
- **AUTHENTICATION.md** - Technical details of authentication system
- **IMPLEMENTATION_SUMMARY.md** - Implementation overview and status
- **CHANGES.md** - Summary of what changed in Clerk integration

### Reference
- **FLOW_DIAGRAM.md** - Authentication flow diagrams
- **TEST_PAGE.html** - Testing instructions (legacy)
- **README_DE.md** - German documentation (not updated)

## Quick Start Guide

### For Setting Up the Extension

1. **First, read**: CLERK_SETUP.md
2. **Configure**: clerk-auth.html (follow CLERK_SETUP.md)
3. **Reference**: clerk-config.example.js
4. **Load**: Extension in Chrome (chrome://extensions)
5. **Test**: Click login button

### For Understanding the Code

1. **Start with**: AUTHENTICATION.md
2. **Review**: auth.js (authentication logic)
3. **Check**: popup.js (UI logic)
4. **See**: clerk-auth.html (pop-up page)

### For Troubleshooting

1. **Setup issues**: CLERK_SETUP.md → Troubleshooting section
2. **Auth issues**: Browser console + AUTHENTICATION.md
3. **Flow questions**: FLOW_DIAGRAM.md

## File Dependencies

```
popup.html
  ├── loads: popup.css (styling)
  ├── loads: auth.js (authentication)
  ├── loads: qsci_evaluator.js (analysis)
  └── loads: popup.js (logic)
       └── uses: window.QSCIAuth (from auth.js)
       └── uses: window.QSCIUsage (from auth.js)

clerk-auth.html
  ├── loads: Clerk SDK (from CDN)
  └── sends postMessage to: popup.js

manifest.json
  ├── references: popup.html
  ├── references: clerk-auth.html
  ├── references: content-script.js
  └── references: background.js
```

## Modification Guide

### To Change Clerk Configuration
Edit: **clerk-auth.html** (lines ~102 and ~114)

### To Change Authentication Logic
Edit: **auth.js** (AuthService object)

### To Change Login UI
Edit: **popup.html** (auth-section div)

### To Change Usage Limits
Edit: **auth.js** (USAGE_LIMITS constant)

### To Change Popup Behavior
Edit: **popup.js** (handleLogin function)

## Files NOT Modified

These files were not changed during Clerk integration:
- popup.css
- qsci_evaluator.js
- qsci_calibration_publications.json
- content-script.js
- background.js
- options.html
- options.js (may need updating for consistency)
- icons/*
- Various legacy files

## Important Notes

### Must Configure
- ⚙️ clerk-auth.html - Add your Clerk publishable key and API URL

### Can Customize
- popup.html - Change login button text/style
- auth.js - Change usage limits, storage keys
- clerk-auth.html - Change UI styling, messaging

### Don't Modify (unless you know what you're doing)
- manifest.json structure
- Message passing in auth.js
- Storage key names (will break existing installations)

## Testing Files

- Load extension from this directory in Chrome
- No build step required
- Changes to HTML/JS require extension reload
- Changes to manifest.json require extension reload

## Size Reference

```
Core Logic:
  auth.js             ~13 KB
  popup.js            ~37 KB
  clerk-auth.html     ~9 KB

Documentation:
  CLERK_SETUP.md      ~6 KB
  AUTHENTICATION.md   ~8 KB
  CHANGES.md          ~7 KB
  README_CLERK.md     ~3 KB
```

## For Maintenance

When updating:
1. Keep documentation in sync
2. Update version in manifest.json
3. Test authentication flow
4. Verify usage limits work
5. Check subscription status handling

## Common Tasks

### Update Clerk Key
1. Edit clerk-auth.html
2. Replace key in 2 places
3. Reload extension
4. Test login

### Change Usage Limits
1. Edit auth.js
2. Find USAGE_LIMITS constant
3. Change FREE and/or SUBSCRIBED values
4. Reload extension
5. Test limits

### Debug Authentication
1. Open popup
2. Open browser console (F12)
3. Look for "Q-SCI Auth:" messages
4. Check chrome.storage: `chrome.storage.local.get(null, console.log)`

### Add New Authentication Method
1. Update clerk-auth.html with Clerk settings
2. Configure in Clerk dashboard
3. No code changes needed!

## Resources

- Clerk Docs: https://clerk.com/docs
- Chrome Extension Docs: https://developer.chrome.com/docs/extensions/
- This Project: See AUTHENTICATION.md for details

---

**Need help?** Check CLERK_SETUP.md first!
