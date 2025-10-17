# Quick Backend Setup Guide

## TL;DR

The extension now fetches the OpenAI API key from the backend instead of requiring users to enter it manually. You need to implement one new endpoint.

## What You Need to Do

### 1. Add New Endpoint (5 minutes)

**Endpoint:** `GET /api/auth/openai-key`

**Authentication:** Required (Clerk Bearer token)

**Returns:**
```json
{
  "api_key": "sk-proj-..."
}
```

### 2. Minimal Implementation (Copy & Paste)

Add this to your `server/routes/auth.js`:

```javascript
/**
 * GET /api/auth/openai-key
 * Returns OpenAI API key for authenticated users
 */
router.get("/openai-key", async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing authorization header' 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify token with Clerk
    // If you already have authentication middleware (e.g., from existing endpoints),
    // reuse it here. The middleware should verify the Clerk session token and
    // attach req.userId. Example using Clerk SDK directly:
    const session = await clerkClient.sessions.verifySession(token);
    if (!session) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token' 
      });
    }

    // Return the API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not set in environment');
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'API key not configured' 
      });
    }

    return res.status(200).json({ 
      api_key: apiKey 
    });
    
  } catch (error) {
    console.error('Error fetching API key:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve API key' 
    });
  }
});
```

### 3. Set Environment Variable

Add to your `.env` file:

```env
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
```

### 4. Test It

```bash
# Replace YOUR_CLERK_TOKEN with a real token from a logged-in user
curl -X GET https://www.q-sci.org/api/auth/openai-key \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"

# Expected response:
# {"api_key":"sk-proj-..."}
```

## That's It!

Once this endpoint is live, the extension will:
1. ✅ Automatically fetch the API key when users analyze papers
2. ✅ Show better error messages if the backend is down
3. ✅ No longer require users to manually enter API keys

## Full Documentation

For complete implementation details, security considerations, and advanced features:
- **Full Implementation Guide:** `BACKEND_OPENAI_KEY_ENDPOINT.md`
- **Testing Instructions:** `TESTING_GUIDE_FIXES.md`
- **Fix Summary:** `FIX_SUMMARY.md`

## Questions?

Common issues:

**Q: Do I need to change anything else?**
A: No, just add the endpoint and set the environment variable.

**Q: What if I already have auth verification middleware?**
A: Great! Reuse it. Just make sure it verifies Clerk tokens and attaches `req.userId`.

**Q: Can I use a different API key per user?**
A: Yes! See `BACKEND_OPENAI_KEY_ENDPOINT.md` for examples of per-user or per-tier keys.

**Q: How do I test this locally?**
A: 
1. Set `OPENAI_API_KEY` in your local `.env`
2. Start your backend server
3. Load the extension in Chrome
4. Log in and try analyzing a paper
5. Check browser console for "API key fetched successfully"

## Deployment Checklist

- [ ] Add endpoint to `server/routes/auth.js`
- [ ] Set `OPENAI_API_KEY` environment variable in production
- [ ] Deploy backend
- [ ] Test with curl or Postman
- [ ] Test with extension (login + analyze paper)
- [ ] Monitor logs for any errors
- [ ] ✅ Done!
