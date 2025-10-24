# Quick Deployment Guide - Clerk Extension Authentication

## What You Need to Do

Deploy 2 HTML files to your website to fix the "Invalid URL scheme" error.

## Step 1: Deploy HTML Files

Copy these files to your website:

```
website/extension-login.html        → https://www.q-sci.org/extension-login
website/extension-auth-success.html → https://www.q-sci.org/extension-auth-success
```

### Quick Deploy with Vercel

```bash
# Add to your vercel.json
{
  "routes": [
    {
      "src": "/extension-login",
      "dest": "/website/extension-login.html"
    },
    {
      "src": "/extension-auth-success", 
      "dest": "/website/extension-auth-success.html"
    }
  ]
}

# Deploy
vercel --prod
```

### Quick Deploy with Static Hosting

```bash
# Upload to your web server
scp website/*.html user@server:/var/www/html/
```

## Step 2: Configure Clerk

Add these URLs to your Clerk dashboard:

1. Go to https://dashboard.clerk.com
2. Select your app → **Paths**
3. Add to **Allowed Redirect URLs**:
   ```
   https://www.q-sci.org/extension-login
   https://www.q-sci.org/extension-auth-success
   ```

## Step 3: Test

1. Load extension in Chrome
2. Click "Login" button
3. New tab should open to your website
4. Complete authentication
5. Tab auto-closes
6. Extension shows you as logged in ✅

## That's It!

The extension will now authenticate through your website instead of using chrome-extension:// URLs.

**No "Invalid URL scheme" error anymore!** 🎉

## Need More Details?

See [CLERK_EXTENSION_AUTH_DEPLOYMENT.md](CLERK_EXTENSION_AUTH_DEPLOYMENT.md) for:
- Complete deployment instructions
- Configuration details
- Troubleshooting guide
- Security recommendations

## Production Checklist

- [ ] Deploy HTML files to website
- [ ] Configure Clerk redirect URLs
- [ ] Update Clerk keys to production (pk_live_...)
- [ ] Test authentication flow
- [ ] Verify tab opens and closes correctly
- [ ] Check extension receives token
- [ ] Done! 🚀
