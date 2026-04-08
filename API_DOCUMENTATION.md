# VocalFlow Web - Updated API Documentation

## Authentication

All endpoints except `/api/auth/*` require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "message": "Login successful",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "lastLogin": "2024-04-08T...",
    "createdAt": "2024-04-08T...",
    "updatedAt": "2024-04-08T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

Response: 201 Created
{
  "message": "Registration successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Validate Token
```http
POST /api/auth/validate
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "valid": true,
  "user": {
    "userId": "60d5ec49c1234567890abc",
    "email": "user@example.com"
  }
}
```

## Settings

### Get User Settings
```http
GET /api/settings/:userId
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "userId": "...",
  "deepgramModel": "nova-2",
  "deepgramLanguage": "en",
  "groqModel": "mixtral-8x7b-32768",
  "processingOptions": {
    "spelling": true,
    "grammar": true,
    "codeMix": false,
    "codeMixLanguage": "Hinglish",
    "targetLanguage": false,
    "targetLanguageValue": "en"
  },
  "theme": "auto",
  "autoCopy": false,
  "availableDeepgramModels": [...],
  "availableGroqModels": [...],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Update Settings
```http
PUT /api/settings/:userId
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "deepgramApiKey": "encrypted_key_here",
  "groqApiKey": "encrypted_key_here",
  "deepgramModel": "nova-2",
  "deepgramLanguage": "en-US",
  "processingOptions": {
    "spelling": true,
    "grammar": true,
    "codeMix": true,
    "codeMixLanguage": "Hinglish"
  }
}

Response: 200 OK
{
  "message": "Settings updated successfully",
  "settings": { ... }
}
```

### Fetch Deepgram Models
```http
POST /api/settings/models/deepgram
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "apiKey": "dg_live_..."
}

Response: 200 OK
{
  "message": "Models fetched successfully",
  "models": [
    {
      "name": "nova-2",
      "architecture": "nova-2",
      "language": "en-US",
      "version": "..."
    },
    ...
  ]
}
```

### Get Deepgram Balance
```http
POST /api/settings/balance/deepgram
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "apiKey": "dg_live_..."
}

Response: 200 OK
{
  "status": "success",
  "data": {
    "balance": 100.00,
    "currency": "USD"
  }
}
```

## Recordings

### Get User Recordings
```http
GET /api/recordings/:userId?limit=20&skip=0
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "message": "Recordings fetched successfully",
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "originalTranscript": "...",
      "processedTranscript": "...",
      "deepgramModel": "nova-2",
      "deepgramLanguage": "en",
      "groqModel": "mixtral-8x7b-32768",
      "processingOptions": { ... },
      "duration": 5000,
      "audioFormat": "PCM16",
      "sampleRate": 16000,
      "status": "completed",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 150,
  "limit": 20,
  "skip": 0
}
```

### Save Recording
```http
POST /api/recordings/:userId
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "originalTranscript": "hello world",
  "processedTranscript": "Hello World",
  "deepgramModel": "nova-2",
  "deepgramLanguage": "en",
  "groqModel": "mixtral-8x7b-32768",
  "processingOptions": { ... },
  "duration": 5000,
  "audioFormat": "PCM16",
  "sampleRate": 16000
}

Response: 201 Created
{
  "message": "Recording saved successfully",
  "data": { ... }
}
```

### Delete Recording
```http
DELETE /api/recordings/:userId/:recordingId
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "message": "Recording deleted successfully"
}
```

## WebSocket - Audio Streaming

### Connect to WebSocket
```
WS ws://localhost:5000/ws/audio
```

### Send Audio Data
```json
{
  "action": "start",
  "apiKey": "dg_live_...",
  "model": "nova-2",
  "language": "en-US",
  "sampleRate": 16000
}

[binary audio data...]

{
  "action": "stop"
}
```

### Receive Events
```json
{
  "event": "connected",
  "message": "Connected to Deepgram"
}

{
  "event": "interim_transcript",
  "transcript": "hello wor...",
  "isFinal": false
}

{
  "event": "final_transcript",
  "transcript": "hello world",
  "isFinal": true
}

{
  "event": "error",
  "error": "error message"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": []
}
```

### Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - No permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate entry
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server error

## Security

- API keys are encrypted at rest using AES encryption
- All passwords are hashed using bcryptjs
- JWT tokens expire after 24 hours
- CORS is enabled for localhost:3000
- Rate limiting: 1000 requests per 15 minutes per IP
- Account locks after 5 failed login attempts (30 minutes)
