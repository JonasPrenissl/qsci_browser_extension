# Backend OpenAI API Key Endpoint Implementation

This document provides implementation instructions for the new backend endpoint that provides OpenAI API keys to authenticated extension users.

## Overview

Previously, users had to manually enter their OpenAI API keys in the extension settings, which is not production-ready. Now, the extension fetches the API key from the backend, ensuring centralized key management.

## Required Backend Endpoint

### GET /api/auth/openai-key

Returns the OpenAI API key for the authenticated user.

**Authentication:** Required (Bearer token in Authorization header)

**Request Headers:**
```
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

**Response (Success - 200 OK):**
```json
{
  "api_key": "sk-proj-..."
}
```

**Response (Unauthorized - 401):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**Response (Server Error - 500):**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve API key"
}
```

## Implementation Example (Node.js/Express)

### File: `server/routes/auth.js`

```javascript
import express from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";

const router = express.Router();

/**
 * Middleware to verify Clerk authentication token
 */
async function verifyClerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token with Clerk
    const session = await clerkClient.sessions.verifySession(token);
    
    if (!session) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid session token' 
      });
    }

    // Attach user ID to request for use in route handlers
    req.userId = session.userId;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication failed' 
    });
  }
}

/**
 * GET /api/auth/openai-key
 * Returns the OpenAI API key for authenticated users
 */
router.get("/openai-key", verifyClerkAuth, async (req, res) => {
  try {
    // In production, you might want to:
    // 1. Store different API keys per user/subscription level
    // 2. Track API usage per user
    // 3. Apply rate limiting based on subscription tier
    
    // For now, return the configured OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured in environment');
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'API key not configured' 
      });
    }

    // Optional: Log usage for monitoring
    console.log(`API key requested by user: ${req.userId}`);

    return res.status(200).json({ 
      api_key: apiKey 
    });
    
  } catch (error) {
    console.error('Error fetching OpenAI API key:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve API key' 
    });
  }
});

/**
 * GET /api/auth/subscription-status
 * Returns the user's subscription status (existing endpoint)
 */
router.get("/subscription-status", verifyClerkAuth, async (req, res) => {
  try {
    // Get user from Clerk
    const user = await clerkClient.users.getUser(req.userId);
    
    // Get subscription status from user's publicMetadata
    const subscriptionStatus = user.publicMetadata?.subscription_status || 'free';

    return res.status(200).json({ 
      subscription_status: subscriptionStatus 
    });
    
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve subscription status' 
    });
  }
});

export default router;
```

### Update main server file

**File: `server/index.js`**

```javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
// ... other imports

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ... webhook routes (before body parser)

app.use(express.json());
app.use(cors({
  origin: ["https://www.q-sci.org", "https://q-sci.org"],
  credentials: true
}));

// Mount auth routes
app.use("/api/auth", authRoutes);

// ... other routes

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Environment Variables

Add to your `.env` file:

```env
OPENAI_API_KEY=sk-proj-...your-actual-key...
CLERK_SECRET_KEY=sk_live_...or sk_test_...
```

## Security Considerations

1. **Token Verification**: Always verify the Clerk session token before returning the API key
2. **HTTPS Only**: Ensure your backend only accepts HTTPS requests in production
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Key Rotation**: Regularly rotate your OpenAI API key
5. **Usage Tracking**: Monitor API key usage per user to detect anomalies
6. **CORS**: Restrict CORS to only your extension's domain

## Advanced Features (Optional)

### Per-User API Keys

If you want to assign different API keys per user or subscription tier:

```javascript
router.get("/openai-key", verifyClerkAuth, async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.userId);
    const subscriptionStatus = user.publicMetadata?.subscription_status || 'free';
    
    // Different keys for different tiers
    let apiKey;
    if (subscriptionStatus === 'subscribed') {
      apiKey = process.env.OPENAI_API_KEY_PREMIUM;
    } else {
      apiKey = process.env.OPENAI_API_KEY_FREE;
    }
    
    return res.status(200).json({ api_key: apiKey });
  } catch (error) {
    // ... error handling
  }
});
```

### Usage Tracking

Track how many API calls each user makes:

```javascript
// Store in database
await logApiKeyUsage({
  userId: req.userId,
  timestamp: new Date(),
  subscriptionStatus: user.publicMetadata?.subscription_status
});
```

## Testing

### Using cURL

```bash
# Replace with actual Clerk session token
curl -X GET https://www.q-sci.org/api/auth/openai-key \
  -H "Authorization: Bearer <clerk_session_token>" \
  -H "Content-Type: application/json"
```

### Expected Response

```json
{
  "api_key": "sk-proj-..."
}
```

## Deployment Checklist

- [ ] Add OPENAI_API_KEY to production environment variables
- [ ] Ensure CLERK_SECRET_KEY is configured
- [ ] Deploy backend with new auth routes
- [ ] Test endpoint with valid/invalid tokens
- [ ] Verify HTTPS and CORS settings
- [ ] Monitor API key usage
- [ ] Set up alerts for unusual activity

## Error Handling

The extension handles these error scenarios:

1. **No authentication token**: User is not logged in - shows login prompt
2. **Invalid token**: Token expired - prompts user to re-login
3. **Network error**: Backend unreachable - shows appropriate error message
4. **No API key configured**: Backend misconfiguration - logs error and shows message to user

## Support

For questions or issues:
- Check Clerk documentation: https://clerk.com/docs
- Check OpenAI API documentation: https://platform.openai.com/docs
- Review backend logs for detailed error information
