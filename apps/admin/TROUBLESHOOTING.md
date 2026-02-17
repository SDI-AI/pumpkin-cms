# Troubleshooting Login Issues

If you're having trouble logging in, check the following:

## 1. Check Browser Console

Open the browser's Developer Tools (F12) and look at the Console tab. You should see detailed logs like:

```
[API Client] Request: { url, method, hasApiKey, apiKeyPreview }
[API Client] Response: { status, statusText, ok }
```

## 2. Common Issues

### Missing or Invalid API Key
- Check `.env` file has `NEXT_PUBLIC_API_KEY` set
- Verify the API key matches what's configured in the Pumpkin API
- After changing `.env`, restart the dev server (`npm run dev`)

### User Not Found (401 Unauthorized)
- Verify the user exists in the database
- Check the email is correct (`admin@pumpkincms.io`)
- Ensure the user's `IsActive` field is `true`

### CORS Issues
- API must allow requests from your frontend domain
- Check API's CORS configuration
- Look for CORS errors in browser console

### Network Issues
- Verify API is running and accessible (localhost or production)
- For localhost, test with: `curl http://localhost:5064/health`
- For production, test with: `curl https://api.pumpkincms.com/health`
- Check firewall/network settings

## 3. Test API Directly

Test the login endpoint with curl:

**For localhost:**
```bash
curl -X POST http://localhost:5064/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pumpkincms.io","password":"Admin@123!Secure"}'
```

**For production:**
```bash
curl -X POST https://api.pumpkincms.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pumpkincms.io","password":"Admin@123!Secure"}'
```

Expected successful response:
```json
{
  "token": "eyJ...",
  "expiresAt": "2026-02-16T...",
  "user": {
    "id": "...",
    "email": "admin@pumpkincms.io",
    "username": "superadmin",
    "role": "SuperAdmin",
    ...
  }
}
```

## 4. Check Environment Variables

In the browser console, you can check (DO NOT LOG IN PRODUCTION):
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
console.log('Has API Key:', !!process.env.NEXT_PUBLIC_API_KEY)
```

## 5. Database Check

Ensure the user exists in the database with:
- Correct email: `admin@pumpkincms.io`
- IsActive: `true`
- Valid password hash (BCrypt)

## 6. Restart Development Server

After any `.env` changes:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

## Getting More Help

If issues persist, check:
1. Browser console for detailed error logs
2. API server logs
3. Network tab in browser DevTools for request/response details
