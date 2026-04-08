# VocalFlow Web - Security & Feature Update Guide

## Summary of Changes

This update brings **vocalflow-web** to feature and security parity with the **vocal** desktop app.

### Critical Security Fixes ✅

1. **JWT Authentication** - Replaced insecure base64 tokens with proper JWT
   - Tokens expire in 24 hours
   - Server-side verification on all protected routes
   - Account lockout after 5 failed login attempts

2. **Password Security** - Implemented bcryptjs hashing
   - Passwords hashed with 10 salt rounds
   - User database created to store secure credentials
   - Passwords never returned in API responses

3. **API Key Encryption** - Deepgram and Groq keys encrypted at rest
   - AES encryption using crypto-js
   - Keys decrypted only when needed
   - Keys never exposed in API responses by default

4. **Input Validation** - Added express-validator to all routes
   - All user inputs validated and sanitized
   - Type checking on numeric fields
   - Email format validation

5. **Rate Limiting** - Implemented request rate limiting
   - 1000 requests per 15 minutes per IP
   - Prevents brute force attacks
   - Returns 429 Too Many Requests

6. **CORS & Security Headers**
   - CORS enabled for localhost:3000 (configure for production)
   - Request logging for debugging
   - Proper error handling middleware

### Feature Improvements ✅

1. **Waveform Visualization** - Upgraded from static bars to real-time rendering
   - Canvas-based real-time waveform display
   - Frequency visualization
   - Fallback to animated bars if analyser unavailable
   - Recording status indicator with pulse animation

2. **Error Recovery** - Added comprehensive error handling
   - Global error handler catches all exceptions
   - 404 handler for undefined routes
   - Proper HTTP status codes
   - User-friendly error messages

3. **Settings Model** - Cleaned up unused fields
   - Removed: hotkey (browser limitation), autoMute (future use)
   - Kept: theme, autoCopy, processingOptions

4. **Authorization** - All API routes now verify user identity
   - JWT token required for protected routes
   - User can only access their own settings/recordings
   - Prevents unauthorized data access

## Migration Guide

### Step 1: Install Dependencies

```bash
cd vocalflow-web/server
npm install
```

New packages added:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT generation/verification
- `crypto-js` - API key encryption
- `express-validator` - Input validation

### Step 2: Update Environment Variables

Add to `.env`:
```env
JWT_SECRET=your_very_secret_key_change_in_production_12345
ENCRYPTION_KEY=your_encryption_key_for_api_keys_change_in_production
```

⚠️ **IMPORTANT**: Change these values in production!

### Step 3: Update Client Authentication

The client needs to be updated to:

1. **Store JWT token after login/register**
```javascript
// After successful login
localStorage.setItem('token', response.token);
localStorage.setItem('userId', response.user._id);
```

2. **Add token to all API requests**
```javascript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};
```

3. **Handle token expiration**
```javascript
// Check if token is expired or invalid
if (error.response?.status === 401) {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  // Redirect to login
  navigate('/login');
}
```

### Step 4: Update API Service Classes

Example for `recordingAPI.js`:

```javascript
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export default {
  async getRecordings(userId, limit = 20, skip = 0) {
    const response = await fetch(
      `/api/recordings/${userId}?limit=${limit}&skip=${skip}`,
      { headers: getAuthHeaders() }
    );
    return response.json();
  },

  async saveRecording(userId, data) {
    const response = await fetch(`/api/recordings/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
```

### Step 5: Run Database Migration (if needed)

If upgrading from previous version with existing data:

```bash
# MongoDB migration script (for future implementation)
# - Create User documents for existing settings
# - Encrypt existing API keys
# - Create indexes
```

For now, existing data will continue to work but without encryption.
New API keys saved will be automatically encrypted.

### Step 6: Update Client Environment

Add to client `.env.local`:
```
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_JWT_STORAGE_KEY=token
REACT_APP_USER_ID_STORAGE_KEY=userId
```

### Step 7: Test Authentication Flow

```bash
# In one terminal - start server
cd server
npm run dev

# In another terminal - start client
cd ../client
npm start
```

Test sequence:
1. Go to login page
2. Click "Register" - create new account
3. Login with new email/password
4. Should see token in localStorage
5. Navigate to settings
6. Add API keys
7. Try recording
8. Save recording should work
9. Refresh page - should still be authenticated
10. Clear localStorage - should redirect to login

## API Changes

### Before (Insecure)
```http
POST /api/auth/login
{
  "email": "user@test.com",
  "password": "anypassword"
}

Response:
{
  "userId": "dXNlckB0ZXN0LmNvbQ==",  // base64
  "token": "dXNlckB0ZXN0LmNvbToxNjE0...==" // base64
}
```

### After (Secure)
```http
POST /api/auth/login
{
  "email": "user@test.com",
  "password": "securepassword"
}

Response:
{
  "message": "Login successful",
  "user": {
    "_id": "60d5ec49c1234567890abc",
    "email": "user@test.com",
    "createdAt": "2024-04-08T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Token must be sent with every subsequent request:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Comparison: Desktop vs Web (Updated)

| Feature | Desktop | Web | Status |
|---------|---------|-----|--------|
| Authentication | N/A (single user) | JWT ✅ | ✅ Parity |
| Password Security | N/A | bcrypthijs ✅ | ✅ Parity |
| API Key Storage | Keychain | **Encrypted** ✅ | ✅ Parity |
| Input Validation | Basic | **express-validator** ✅ | ✅ Parity |
| Rate Limiting | N/A | **Implemented** ✅ | ✅ Parity |
| Deepgram Streaming | WebSocket | WebSocket | ✅ Parity |
| Groq Processing | REST API | REST API | ✅ Parity |
| Recording History | None | MongoDB ✅ | ✅ Web Better |
| Waveform Viz | Basic overlay | **Real-time** ✅ | ✅ Parity |
| Global Hotkey | ✅ | ❌ (browser limit) | ⚠️ N/A |
| Text Injection | ✅ | ❌ (browser limit) | ⚠️ N/A |
| Audio Muting | ✅ | ❌ (browser limit) | ⚠️ N/A |

## Breaking Changes

1. **All API routes require JWT token** except `/api/auth/*`
   - Existing clients using base64 tokens will get 401 errors
   - Must be updated to send JWT tokens

2. **User object structure changed**
   - Old: `{ userId: "base64", email, token: "base64" }`
   - New: `{ userId: "mongoId", email, firstName, lastName, lastLogin, token: "jwt" }`

3. **Settings schema updated**
   - Removed: `hotkey`, `autoMute`, `availableDeepgramModels`, `availableGroqModels`
   - Added: automatic encryption for API keys
   - No data loss - existing fields still readable

## Troubleshooting

### "No token provided" error
- Missing `Authorization` header
- Token not stored after login
- Fix: Check localStorage has `token` key

### "Invalid token" error
- Token expired (24hr expiration)
- Token corrupted/tampered with
- Fix: Re-login to get new token

### "Account temporarily locked" error
- 5 failed password attempts in last 30 minutes
- Fix: Wait 30 minutes or contact admin

### Encrypted key fails to decrypt
- Wrong `ENCRYPTION_KEY` environment variable
- Encryption key changed after saving keys
- Fix: Re-save API keys with correct encryption key

### API requests getting 403 error
- User trying to access another user's data
- JWT token is valid but userId doesn't match
- Fix: Verify you're using correct userId

## Production Deployment

For production deployment:

1. **Change environment variables**
```env
NODE_ENV=production
JWT_SECRET=generate_a_long_random_secure_string_here
ENCRYPTION_KEY=generate_another_long_random_secure_string
```

2. **Update CORS for production domain**
```javascript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

3. **Use HTTPS only**
- JWT tokens should only be sent over HTTPS
- Set secure cookies if implementing cookie-based storage

4. **Implement refresh tokens** (future enhancement)
- 24-hour access token + 30-day refresh token
- More secure than single long-lived token

5. **Add rate limiting configuration**
- Adjust rate limits based on API usage
- Consider per-user limits vs global limits

## Support

For issues or questions:
- Check API_DOCUMENTATION.md for endpoint details
- Review error responses for specific error codes
- Check browser console for detailed error messages
- Review server logs: `npm run dev | tail -f`
