# Q-SCI Browser Extension

AI-powered scientific paper quality evaluator for Chrome. Automatically analyze research papers on PubMed, arXiv, Nature, Science, and many other scientific websites.

## 🚀 Quick Start

👉 **New to this extension?** See **[QUICK_START.md](QUICK_START.md)** for a 5-minute setup guide!

### ⚠️ IMPORTANT: Network Drive Issue

**If you get an error:** "Das Hintergrundskript „background.js" konnte nicht geladen werden"

**This means:** You're trying to load the extension from a network drive.

**Solution:** Copy the extension folder to your **local hard drive** (C:\, D:\, etc.) - Chrome cannot load extensions from network locations.

👉 **See [FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md) (German) or [INSTALLATION.md](INSTALLATION.md) (English) for detailed solutions.**

### Installation Steps

1. **Copy to local drive** (if on network drive)
   ```
   From: \\network\path\...
   To:   C:\Users\YourName\Documents\qsci_browser_extension
   ```

2. **Configure Clerk** (see [CLERK_SETUP.md](CLERK_SETUP.md))
   - Get Clerk account and publishable key
   - Copy `clerk-config.example.js` to `clerk-config.js`
   - Update `clerk-config.js` with your keys
   - **IMPORTANT**: For production, use production keys (`pk_live_...`) not test keys (`pk_test_...`)
   - See [CLERK_CONFIGURATION.md](CLERK_CONFIGURATION.md) for detailed configuration guide

3. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the **local** extension folder

4. **Configure Clerk Redirect**
   - Note your extension ID from Chrome
   - Add `chrome-extension://YOUR_ID/clerk-auth.html` to Clerk dashboard

5. **Test**
   - Click extension icon
   - Click "Login with Clerk"
   - Sign in or sign up
   - Analyze a paper!

## 📚 Documentation

### Installation & Setup
- **[CHECK_INSTALLATION.md](CHECK_INSTALLATION.md)** - Quick installation checklist
- **[INSTALLATION.md](INSTALLATION.md)** - Complete installation guide (English)
- **[FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md)** - Troubleshooting guide (German)
- **[CLERK_SETUP.md](CLERK_SETUP.md)** - Clerk authentication setup
- **[CLERK_CONFIGURATION.md](CLERK_CONFIGURATION.md)** - Clerk key configuration guide

### Technical Documentation
- **[AUTHENTICATION.md](AUTHENTICATION.md)** - Authentication system details
- **[README_CLERK.md](README_CLERK.md)** - Clerk integration overview
- **[README_DE.md](README_DE.md)** - Implementation summary (German)
- **[FLOW_DIAGRAM.md](FLOW_DIAGRAM.md)** - Authentication flow diagrams
- **[FILE_GUIDE.md](FILE_GUIDE.md)** - File structure guide

## ✨ Features

### Core Features
- ✅ **AI-Powered Analysis** - Comprehensive paper quality evaluation
- ✅ **Multi-Site Support** - Works on PubMed, arXiv, Nature, Science, and more
- ✅ **PDF Analysis** - Direct PDF content analysis when available
- ✅ **HTML Fallback** - Analyzes webpage content when PDF not available
- ✅ **Quality Scoring** - Percentage-based quality score with traffic light system
- ✅ **Journal Metrics** - Impact factor and quartile information
- ✅ **Detailed Feedback** - Positive aspects and areas for improvement

### Authentication & Access Control
- 🔐 **Clerk Authentication** - Secure login via Clerk
- 👤 **User Management** - Registration and subscription handling
- 🚫 **Access Control** - Only logged-in users can analyze papers
- 📊 **Usage Tracking** - Daily analysis limits enforced

### Usage Limits

| User Type | Analyses per Day |
|-----------|------------------|
| Free (Registered) | 10 |
| Subscribed | 100 |

- Counters reset automatically at midnight (local time)
- Usage displayed in extension popup
- Upgrade prompts for free users

## 🎯 Supported Websites

- PubMed (pubmed.ncbi.nlm.nih.gov)
- PubMed Central (pmc.ncbi.nlm.nih.gov)
- arXiv (arxiv.org)
- Google Scholar (scholar.google.com)
- Nature (nature.com)
- Science (science.org)
- Cell (cell.com)
- The Lancet (thelancet.com)
- JAMA Network (jamanetwork.com)
- NEJM (nejm.org)
- PLOS (journals.plos.org)
- BMJ (bmj.com)
- And many more...

## 🔧 Technical Details

### Architecture
- **Manifest Version**: 3 (latest Chrome extension standard)
- **Authentication**: Clerk (secure, passwordless)
- **Storage**: Chrome local storage
- **Analysis**: Client-side evaluation engine
- **Background**: Service worker for lifecycle management

### File Structure
```
qsci_browser_extension/
├── manifest.json           # Extension configuration
├── background.js          # Service worker
├── popup.html/js/css      # Main UI
├── auth.js                # Authentication & usage tracking
├── clerk-auth.html        # Clerk authentication page
├── content-script.js      # Website integration
├── qsci_evaluator.js      # Analysis engine
├── options.html/js        # Settings page
└── icons/                 # Extension icons
```

## 🐛 Troubleshooting

### Common Issues

**Extension won't load / Background script error**
- ❌ You're on a network drive
- ✅ Copy to local drive (C:\, D:\, etc.)
- See [FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md)

**Authentication fails**
- Ensure `clerk-config.js` exists (copy from `clerk-config.example.js` if needed)
- Check Clerk configuration in `clerk-config.js`
- Verify you've run `npm run build` after updating configuration
- Verify redirect URL in Clerk dashboard
- Allow pop-ups in Chrome

**Warning: "Clerk has been loaded with development keys"**
- You're using a test key (`pk_test_...`) instead of production key
- Get production key from Clerk dashboard (starts with `pk_live_...`)
- Update `clerk-config.js` with production key
- Run `npm run build` and reload extension
- See [CLERK_CONFIGURATION.md](CLERK_CONFIGURATION.md) for details

**Usage counter not working**
- Ensure you're logged in
- Check subscription status in Clerk metadata
- Should be "free" or "subscribed"

**Analysis not working**
- Must be logged in to analyze
- Check daily limit not exceeded
- Verify you're on a supported website

## 🔐 Security

- Extension never stores passwords
- All authentication handled by Clerk
- Session tokens stored securely in Chrome storage
- Only HTTPS connections to Clerk and APIs
- No sensitive data transmitted

## 📋 Requirements

- Google Chrome browser (latest version recommended)
- Clerk account (free tier available)
- Local hard drive (not network drive)
- Internet connection for authentication

## 🚀 Development

### Setup for Development

1. Clone the repository to **local drive**
2. Install dependencies (if any)
3. Configure Clerk in `clerk-auth.html`
4. Load unpacked extension in Chrome
5. Test authentication flow
6. Test paper analysis

### Testing Checklist

- [ ] Extension loads without errors
- [ ] Login with Clerk works
- [ ] Usage counter updates
- [ ] Paper analysis works
- [ ] Usage limits enforced
- [ ] Daily reset works
- [ ] Subscription status respected
- [ ] All supported sites work

## 📝 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📞 Support

For issues and questions:
1. Check [INSTALLATION.md](INSTALLATION.md) or [FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md)
2. Review [CLERK_SETUP.md](CLERK_SETUP.md) for authentication issues
3. Check browser console (F12) for error messages
4. Create an issue on GitHub with details

## 🎉 Credits

Built with:
- [Clerk](https://clerk.com) - Authentication
- Chrome Extensions API
- Modern JavaScript

## 📅 Version History

### Current Version: 12.0.0
- ✅ Clerk authentication integration
- ✅ Usage limits (10 free / 100 subscribed)
- ✅ Access control (login required)
- ✅ Daily usage tracking
- ✅ PDF and HTML analysis
- ✅ Multi-site support

---

**Need help?** Start with [CHECK_INSTALLATION.md](CHECK_INSTALLATION.md) for a quick checklist!
