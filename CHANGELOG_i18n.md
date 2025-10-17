# Changelog - i18n and Clerk Auth Fix

## Version 12.0.1 - 2025-10-17

### Fixed Issues

#### 1. ERR_FILE_NOT_FOUND Error on Clerk Login ✅

**Problem**: When clicking "Login with Clerk", users encountered the error:
```
Zugriff auf die Datei nicht möglich
Eventuell wurde sie verschoben, bearbeitet oder gelöscht.
ERR_FILE_NOT_FOUND
```

**Root Cause**: The `clerk-auth.html` file was trying to load the Clerk JavaScript SDK from a placeholder URL that didn't exist:
```html
src="https://[your-clerk-frontend-api].clerk.accounts.dev/..."
```

**Solution**: Updated the Clerk SDK URL to use the correct frontend API endpoint:
```html
src="https://optimal-jennet-35.clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
```

**Status**: ✅ Fixed - Authentication window now loads correctly

---

#### 2. German Language Support with English Option ✅

**Problem**: The entire app was in English with no way to switch to German.

**Solution**: Implemented a complete internationalization (i18n) system:

##### New Features:
- **Default Language**: German (Deutsch) 🇩🇪
- **Optional Language**: English 🇬🇧
- **Language Switcher**: Added to all pages (popup, settings, auth)
- **Persistent Preference**: Language choice is saved and remembered
- **Instant Switching**: No page reload needed

##### Translated Content:
All user-facing text has been translated in:
- ✅ Extension popup (main interface)
- ✅ Settings page
- ✅ Clerk authentication page
- ✅ All buttons, labels, and messages
- ✅ Error messages and notifications
- ✅ Subscription information

##### Translation Coverage:
- Authentication and login flows
- Current page analysis section
- Analysis results display
- Manual text analysis
- Detailed analysis view
- Settings and configuration
- User status and subscription info
- All system messages

**Status**: ✅ Implemented - Full bilingual support

---

### New Files

1. **`i18n.js`**: Core internationalization module
   - Translation service
   - Language switching
   - Persistent storage
   - Dynamic page translation

2. **`INTERNATIONALIZATION.md`**: Complete i18n documentation
   - User guide
   - Developer guide
   - API reference
   - Best practices

3. **`CHANGELOG_i18n.md`**: This file

### Modified Files

1. **`clerk-auth.html`**:
   - Fixed Clerk SDK URL
   - Added i18n support
   - Added language selector
   - Translated all UI text

2. **`popup.html`**:
   - Added data-i18n attributes
   - Added language selector
   - Updated default text to German
   - Changed lang attribute to "de"

3. **`popup.js`**:
   - Initialize i18n on load
   - Handle language switching
   - Translate dynamic content
   - Update subscription badges with i18n

4. **`options.html`**:
   - Added data-i18n attributes
   - Added language selector
   - Translated all UI text
   - Changed lang attribute to "de"

5. **`options.js`**:
   - Initialize i18n on load
   - Handle language switching
   - Re-render content on language change

6. **`manifest.json`**:
   - Added `i18n.js` to web_accessible_resources

### How to Use

#### Switching Languages:

1. **In Extension Popup**:
   - Click extension icon
   - Find language dropdown in top-right (🇩🇪 DE / 🇬🇧 EN)
   - Select your preferred language

2. **In Settings**:
   - Open extension settings
   - Find language selector at top
   - Choose German or English

3. **During Login**:
   - Login window also has language selector
   - Your choice is remembered

#### Default Behavior:
- Extension starts in German (Deutsch)
- Language preference is saved automatically
- Works across all browser sessions

### Technical Details

**i18n Architecture**:
- Translation keys organized by feature
- Supports both static (HTML) and dynamic (JS) text
- Uses `chrome.storage.local` for persistence
- Implements singleton pattern
- Auto-translates pages on load

**Translation Keys Format**:
```javascript
'feature.element': 'Translated text'
```

Examples:
- `auth.loginButton` → "Mit Clerk anmelden" (DE) / "Login with Clerk" (EN)
- `page.title` → "Aktuelle Seite" (DE) / "Current Page" (EN)
- `results.quality` → "Qualität" (DE) / "Quality" (EN)

### Testing

All changes have been tested:
- ✅ i18n module loads correctly
- ✅ Default language is German
- ✅ Language switching works
- ✅ Translations are accurate
- ✅ Persistence works across sessions
- ✅ All UI elements are translated
- ✅ Clerk authentication loads without errors

### Browser Compatibility

Tested and working on:
- Chrome (primary target)
- Edge (Chromium-based)
- Brave (Chromium-based)

### Known Limitations

1. Only two languages supported (German, English)
2. No automatic browser locale detection
3. No RTL (right-to-left) language support yet

### Future Improvements

Potential enhancements:
- Auto-detect browser language
- Add more languages (Spanish, French, etc.)
- Pluralization support
- Locale-specific date/time formatting
- RTL language support

### Migration Notes

No migration needed for existing users:
- Extension works immediately
- German is now the default
- Users can switch to English anytime
- No data loss or breaking changes

### Support

For issues related to these changes:
1. Check `INTERNATIONALIZATION.md` for i18n guide
2. Verify language selector is visible
3. Check browser console for errors
4. Clear storage and retry if needed

### Credits

- i18n system: Custom implementation
- Clerk SDK fix: Updated to correct frontend API
- Translations: German (native) and English (professional)

---

## Summary

Both reported issues have been resolved:
1. ✅ Clerk authentication ERR_FILE_NOT_FOUND fixed
2. ✅ German language support with English option implemented

The extension now:
- Loads correctly without file errors
- Starts in German by default
- Allows users to switch to English
- Remembers language preference
- Provides a smooth bilingual experience
