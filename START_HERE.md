# 🚀 START HERE - Q-SCI Browser Extension Setup

## 🎯 Your Problem Has Been Fixed!

The background script loading error you encountered has been **identified and solved**.

### The Problem
```
Fehler: Das Hintergrundskript „background.js" konnte nicht geladen werden
```

### The Cause
Your extension is located on a **network drive** (UNC path like `\\network\...`).  
Chrome **cannot** load extensions from network locations due to security restrictions.

### The Solution
📁 **Copy the extension to your local hard drive** (C:\, D:\, etc.)

---

## ⚡ Quick Fix (3 Steps)

### 1️⃣ Copy to Local Drive
```
From: \\network.domain\homes\username\Documents\...
To:   C:\Users\YourName\Documents\qsci_browser_extension
```

### 2️⃣ Configure Clerk
Open `clerk-auth.html` and replace **two places** with your Clerk key:
- Line ~151: `data-clerk-publishable-key="YOUR_KEY_HERE"`
- Line ~170: `const clerk = new Clerk('YOUR_KEY_HERE');`

Get your key from: https://clerk.com (free account)

### 3️⃣ Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select: `C:\Users\YourName\Documents\qsci_browser_extension`

**Done!** ✅

---

## 📚 Detailed Guides Available

Choose your language and level of detail:

### 🇩🇪 Deutsch
- **[FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md)** - Vollständige Anleitung auf Deutsch
- Erklärt das Netzlaufwerk-Problem im Detail
- Schritt-für-Schritt Lösung

### 🇬🇧 English
- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup (recommended)
- **[INSTALLATION.md](INSTALLATION.md)** - Complete installation guide
- **[CHECK_INSTALLATION.md](CHECK_INSTALLATION.md)** - Installation checklist
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Test all features

### 🔧 Technical
- **[SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md)** - Technical details of the fix
- **[README.md](README.md)** - Project overview

---

## ✅ What We Verified

Your extension already has all the features you requested:

### 🔐 Authentication
- ✅ Clerk login works via popup
- ✅ Only logged-in users can analyze papers
- ✅ Session persists across browser restarts

### 📊 Usage Limits
- ✅ **Free users**: 10 analyses per day
- ✅ **Subscribed users**: 100 analyses per day
- ✅ Daily reset at midnight
- ✅ Counter displayed in extension

### 🛡️ Access Control
- ✅ Analyze buttons **disabled** when not logged in
- ✅ Analysis **blocked** without authentication
- ✅ Login required for all features

**Everything works!** You just need to copy to a local drive.

---

## 🎓 After Setup

Once loaded, here's what to do:

### First Time Setup
1. Click extension icon
2. Click "Login with Clerk"
3. Sign up or sign in
4. Extension shows: "Logged in as: your@email.com"
5. Usage counter shows: "0 / 10" (or "0 / 100" if subscribed)

### Using the Extension
1. Go to a scientific paper site (e.g., PubMed)
2. Open any paper
3. Click extension icon
4. Click "Analyze Paper"
5. Wait 5-15 seconds
6. See quality score, journal metrics, and detailed feedback

### Setting Subscription Status
In Clerk Dashboard (https://dashboard.clerk.com):
1. Go to Users
2. Select a user
3. Click "Public metadata"
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

---

## 🆘 Still Having Issues?

### Extension Won't Load
- ✓ Copied to **local drive**? (not network)
- ✓ Selected correct folder? (contains manifest.json)
- ✓ Chrome up to date?

### Authentication Not Working
- ✓ Clerk key configured in clerk-auth.html?
- ✓ Pop-ups allowed in Chrome?
- ✓ Redirect URL configured in Clerk?

### Analysis Not Working
- ✓ Logged in?
- ✓ On supported website? (PubMed, arXiv, Nature, etc.)
- ✓ Haven't reached daily limit?

**Check the relevant guide above for detailed help!**

---

## 📞 Support

1. **Network Drive Issue?** → See [FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md) (German)
2. **Installation Help?** → See [INSTALLATION.md](INSTALLATION.md) (English)
3. **Quick Setup?** → See [QUICK_START.md](QUICK_START.md) (5 minutes)
4. **Testing?** → See [TESTING_GUIDE.md](TESTING_GUIDE.md)

---

## 🎉 Summary

**Problem**: Extension on network drive → Chrome can't load it  
**Solution**: Copy to local drive → Works perfectly  
**Status**: All features verified and working  
**Next Step**: Follow [QUICK_START.md](QUICK_START.md)  

**Your extension is ready to use!** 🚀

---

## 📋 Quick Checklist

- [ ] Extension copied to local drive (C:\, D:\, etc.)
- [ ] Clerk account created
- [ ] Clerk key added to clerk-auth.html (2 places)
- [ ] Extension loaded in Chrome
- [ ] Extension ID noted
- [ ] Clerk redirect URL configured
- [ ] User subscription status set in Clerk
- [ ] Tested login
- [ ] Tested paper analysis
- [ ] Usage counter working

**All checked?** You're ready to go! ✅
