# Q-SCI Internationalization (i18n) Guide

## Overview

The Q-SCI browser extension now supports multiple languages with German (Deutsch) as the default language and English as an optional language. Users can switch between languages at any time through a language selector in the UI.

## Features

- **Default Language**: German (DE) 🇩🇪
- **Available Languages**: German, English
- **Persistent Preference**: Language choice is saved and persists across sessions
- **Dynamic Switching**: Change language instantly without page reload
- **Complete Coverage**: All UI text in popup, settings, and authentication pages

## For Users

### Switching Languages

1. **In the Extension Popup**:
   - Click the extension icon in your browser toolbar
   - Look for the language selector dropdown in the top-right corner
   - Select your preferred language (🇩🇪 DE or 🇬🇧 EN)
   - The interface will update immediately

2. **In the Settings Page**:
   - Open the extension settings
   - Find the language selector in the top-right corner
   - Select your preferred language
   - All content will update automatically

3. **During Authentication**:
   - The login window also has a language selector
   - Your language preference is remembered for next time

### Language Persistence

Your language preference is automatically saved and will be remembered:
- When you open the extension popup
- When you open the settings page
- When you authenticate with Clerk
- Across browser sessions

## For Developers

### Architecture

The i18n system consists of:

1. **`i18n.js`**: Core translation module
2. **Translation Keys**: Organized by feature area
3. **Data Attributes**: HTML elements marked with `data-i18n` attributes
4. **Storage**: Language preference stored in `chrome.storage.local`

### Adding New Translations

To add a new translatable string:

1. **Add translation keys to `i18n.js`**:

```javascript
const translations = {
  de: {
    'your.new.key': 'Deutscher Text',
    // ... more German translations
  },
  en: {
    'your.new.key': 'English text',
    // ... more English translations
  }
};
```

2. **Use in HTML** (for static text):

```html
<button data-i18n="your.new.key">Deutscher Text</button>
```

3. **Use in JavaScript** (for dynamic text):

```javascript
const translatedText = window.QSCIi18n.t('your.new.key');
element.textContent = translatedText;
```

### Translation Key Organization

Keys are organized by feature area:

- `header.*` - Header and branding
- `auth.*` - Authentication and login
- `subscription.*` - Subscription status
- `page.*` - Current page section
- `results.*` - Analysis results
- `manual.*` - Manual analysis
- `detailed.*` - Detailed analysis view
- `message.*` - System messages
- `settings.*` - Settings page
- `clerkAuth.*` - Clerk authentication page

### API Reference

#### `QSCIi18n.init()`

Initialize the i18n service and load saved language preference.

```javascript
await window.QSCIi18n.init();
```

#### `QSCIi18n.t(key, language)`

Get translated string for a key.

```javascript
// Use current language
const text = window.QSCIi18n.t('auth.loginButton');

// Override language
const germanText = window.QSCIi18n.t('auth.loginButton', 'de');
```

#### `QSCIi18n.setLanguage(language)`

Change the current language and save preference.

```javascript
await window.QSCIi18n.setLanguage('en');
```

#### `QSCIi18n.getLanguage()`

Get the current language code.

```javascript
const currentLang = window.QSCIi18n.getLanguage(); // 'de' or 'en'
```

#### `QSCIi18n.translatePage()`

Translate all elements with `data-i18n` attributes on the current page.

```javascript
window.QSCIi18n.translatePage();
```

#### `QSCIi18n.getAvailableLanguages()`

Get list of available language codes.

```javascript
const languages = window.QSCIi18n.getAvailableLanguages(); // ['de', 'en']
```

### Best Practices

1. **Always use translation keys**: Never hardcode user-facing text
2. **Keep keys organized**: Use dot notation for feature grouping
3. **Maintain consistency**: Use the same terms across both languages
4. **Test both languages**: Always verify translations in both DE and EN
5. **Handle dynamic content**: Re-translate after updating dynamic elements

### Example: Adding a New Feature

When adding a new feature, follow these steps:

1. **Add translations**:

```javascript
// In i18n.js
de: {
  'myFeature.title': 'Mein Feature',
  'myFeature.description': 'Dies ist eine Beschreibung',
  'myFeature.action': 'Aktion ausführen'
},
en: {
  'myFeature.title': 'My Feature',
  'myFeature.description': 'This is a description',
  'myFeature.action': 'Perform Action'
}
```

2. **Use in HTML**:

```html
<div class="feature">
  <h3 data-i18n="myFeature.title">Mein Feature</h3>
  <p data-i18n="myFeature.description">Dies ist eine Beschreibung</p>
  <button data-i18n="myFeature.action">Aktion ausführen</button>
</div>
```

3. **Initialize in JavaScript**:

```javascript
document.addEventListener('DOMContentLoaded', async function() {
  if (window.QSCIi18n) {
    await window.QSCIi18n.init();
    window.QSCIi18n.translatePage();
  }
  // ... rest of your code
});
```

### Adding a New Language

To add support for a new language (e.g., French):

1. **Add translations to `i18n.js`**:

```javascript
const translations = {
  de: { /* existing German translations */ },
  en: { /* existing English translations */ },
  fr: {
    'header.title': 'Contrôle de Qualité',
    'auth.loginButton': '🔐 Connexion avec Clerk',
    // ... all other translations
  }
};
```

2. **Update language selector in HTML files**:

```html
<select id="language-selector">
  <option value="de">🇩🇪 DE</option>
  <option value="en">🇬🇧 EN</option>
  <option value="fr">🇫🇷 FR</option>
</select>
```

3. **Test thoroughly**: Ensure all strings are translated

## Troubleshooting

### Language not changing

1. Check browser console for errors
2. Verify `i18n.js` is loaded before other scripts
3. Check that `data-i18n` attributes are correct
4. Clear chrome storage and try again:
   ```javascript
   chrome.storage.local.remove('qsci_language');
   ```

### Missing translations

1. Check console for warnings about missing keys
2. Verify the key exists in both `de` and `en` translations
3. Check spelling of the key

### Language resets to default

1. Verify language selector event listener is set up correctly
2. Check that `setLanguage()` is called when selector changes
3. Verify chrome storage permissions in manifest.json

## Storage

Language preference is stored in `chrome.storage.local` with key:
- `qsci_language`: Language code ('de' or 'en')

## Files Modified

The following files were modified to support i18n:

1. **`i18n.js`** (new): Core i18n module with all translations
2. **`popup.html`**: Added data-i18n attributes and language selector
3. **`popup.js`**: Initialize i18n and handle language switching
4. **`clerk-auth.html`**: Added i18n support and language selector
5. **`options.html`**: Added i18n support and language selector
6. **`options.js`**: Initialize i18n and handle language switching
7. **`manifest.json`**: Added i18n.js to web_accessible_resources

## Testing

The i18n module has been tested with:
- Default language initialization (German)
- Language switching (German ↔ English)
- Translation key lookup
- Persistent storage of language preference
- Page translation functionality

All tests passed successfully.

## Future Enhancements

Potential improvements for the future:

1. **More languages**: Add Spanish, French, Italian, etc.
2. **Browser locale detection**: Auto-detect user's browser language
3. **Fallback chains**: Use English if translation missing in selected language
4. **Pluralization**: Support for plural forms
5. **Date/time formatting**: Locale-specific formatting
6. **Number formatting**: Locale-specific number formatting
7. **RTL support**: Right-to-left language support (Arabic, Hebrew)

## Support

For questions or issues related to i18n:
1. Check this documentation
2. Review the translation keys in `i18n.js`
3. Check browser console for i18n-related warnings
4. Verify chrome storage permissions
