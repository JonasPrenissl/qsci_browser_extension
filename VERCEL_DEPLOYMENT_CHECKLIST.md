# Vercel Deployment Checklist for OpenAI API Key Integration

This checklist ensures that the Q-SCI browser extension can properly fetch the OpenAI API key from the Vercel-deployed backend.

## Prerequisites

- [ ] Backend code deployed to Vercel
- [ ] Clerk authentication configured
- [ ] OpenAI API key obtained

## Environment Variables Configuration

### 1. Set Environment Variables in Vercel

Log into your Vercel project dashboard and add these environment variables:

```
OPENAI_API_KEY=sk-proj-...your-actual-openai-key...
CLERK_SECRET_KEY=sk_live_...or-sk_test_...
```

**Steps:**
1. Go to Vercel Dashboard → Your Project
2. Navigate to Settings → Environment Variables
3. Add `OPENAI_API_KEY` with your OpenAI API key
4. Add `CLERK_SECRET_KEY` with your Clerk secret key
5. Ensure variables are set for Production environment (and Preview if testing)

### 2. Redeploy After Adding Variables

After adding environment variables, redeploy your application:

```bash
# Option 1: Through Vercel Dashboard
Go to Deployments → Redeploy latest deployment

# Option 2: Through CLI
vercel --prod
```

## Backend Endpoint Implementation

### Required Endpoint

Ensure your backend has this endpoint implemented:

**Endpoint:** `GET /api/auth/openai-key`

**Location:** Should be at `https://www.q-sci.org/api/auth/openai-key`

**Reference Implementation:** See `BACKEND_OPENAI_KEY_ENDPOINT.md` for complete code

### Minimal Implementation Example

```javascript
// File: api/auth/openai-key.js (for Vercel Serverless Functions)
import { clerkClient } from "@clerk/clerk-sdk-node";

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and verify authorization token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header' 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify with Clerk (adjust based on your Clerk setup)
    // Note: Verification method may vary based on Clerk SDK version
    const session = await clerkClient.sessions.verifySession(token);
    
    if (!session) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid session token' 
      });
    }

    // Return the OpenAI API key from environment
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
    console.error('Error in /api/auth/openai-key:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve API key' 
    });
  }
}
```

## CORS Configuration

Ensure your backend allows requests from the extension:

```javascript
// Add CORS headers to allow extension requests
res.setHeader('Access-Control-Allow-Origin', '*'); // Or specific origin
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

if (req.method === 'OPTIONS') {
  return res.status(200).end();
}
```

## Testing the Endpoint

### 1. Test with cURL

Replace `<YOUR_CLERK_TOKEN>` with an actual Clerk session token:

```bash
curl -X GET https://www.q-sci.org/api/auth/openai-key \
  -H "Authorization: Bearer <YOUR_CLERK_TOKEN>" \
  -H "Content-Type: application/json"
```

**Expected Success Response:**
```json
{
  "api_key": "sk-proj-..."
}
```

**Expected Error Response (401):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid session token"
}
```

**Expected Error Response (500):**
```json
{
  "error": "Internal Server Error",
  "message": "API key not configured"
}
```

### 2. Test from Extension

1. Load the extension in Chrome
2. Login with Clerk authentication
3. Navigate to a supported scientific site (e.g., pubmed.ncbi.nlm.nih.gov)
4. Click "Analyze Paper"
5. Open browser console (F12) and check for logs:
   - `Q-SCI Auth: Fetching OpenAI API key from backend...`
   - `Q-SCI Auth: OpenAI API key fetched successfully`
   - `Q-SCI LLM Evaluator: API key fetched successfully`

### 3. Check for Errors

If analysis fails, check console for error messages:

- **404 Error**: Backend endpoint not deployed
- **401 Error**: Authentication issue
- **500 Error**: Environment variable not set
- **CORS Error**: CORS headers not configured

## Common Issues and Solutions

### Issue 1: "Backend endpoint not found (404)"

**Solution:**
- Verify the endpoint is deployed at `/api/auth/openai-key`
- Check Vercel deployment logs
- Ensure the file is in the correct location (`api/auth/openai-key.js` for serverless)

### Issue 2: "OPENAI_API_KEY not configured"

**Solution:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `OPENAI_API_KEY` with your OpenAI key
3. Redeploy the application

### Issue 3: "Invalid session token"

**Solution:**
- User needs to log out and log in again
- Check Clerk configuration is correct
- Verify `CLERK_SECRET_KEY` is set in environment

### Issue 4: CORS Errors

**Solution:**
- Add CORS headers to backend response
- Ensure `OPTIONS` preflight requests are handled
- Check browser console for specific CORS error

## Verification Checklist

After deployment, verify:

- [ ] Environment variables are set in Vercel
- [ ] Backend is deployed and accessible
- [ ] Endpoint returns 200 OK with valid token
- [ ] Endpoint returns 401 with invalid token
- [ ] CORS headers allow extension requests
- [ ] Extension can successfully fetch API key
- [ ] Analysis completes successfully

## Monitoring

Set up monitoring for:

1. **API Key Usage**: Track requests to `/api/auth/openai-key`
2. **Error Rates**: Monitor 401/500 errors
3. **OpenAI API Calls**: Track usage and costs
4. **Failed Analyses**: Alert on high failure rates

## Security Notes

1. **Never expose API key in client-side code**
2. **Always verify authentication tokens**
3. **Implement rate limiting** per user/subscription
4. **Rotate API keys regularly**
5. **Monitor for unusual usage patterns**
6. **Use HTTPS only** in production

## Support

If issues persist:

1. Check Vercel deployment logs
2. Check browser console for detailed error messages
3. Verify all environment variables are set
4. Test endpoint independently with cURL
5. Contact support with error logs

## Related Documentation

- `BACKEND_OPENAI_KEY_ENDPOINT.md` - Complete implementation guide
- `BACKEND_IMPLEMENTATION_GUIDE.md` - General backend setup
- Clerk Documentation: https://clerk.com/docs
- OpenAI API Documentation: https://platform.openai.com/docs
