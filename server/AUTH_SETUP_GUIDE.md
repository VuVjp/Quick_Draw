# Authentication Setup Guide

This guide walks you through setting up the authentication system with JWT and Google OAuth for the Quick Draw application.

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Firebase Setup](#firebase-setup)
3. [Google OAuth Setup](#google-oauth-setup)
4. [Testing the Authentication](#testing-the-authentication)
5. [Client Integration](#client-integration)

---

## Environment Setup

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Generate JWT Secret

Generate a secure random string for JWT_SECRET:

```bash
# On Windows PowerShell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32|ForEach-Object{[char](Get-Random -InputObject @(48..57+65..90+97..122))})-join''))

# On macOS/Linux
openssl rand -base64 32
```

Copy the output and add it to your `.env`:

```env
JWT_SECRET=<your_generated_secret>
```

### 3. Update Other Environment Variables

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
JWT_EXPIRE=7d
```

---

## Firebase Setup

### 1. Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Project Settings** (gear icon)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file will download

### 2. Place the Key

Save the downloaded file as `config/serviceAccountKey.json`:

```bash
# The file structure should look like:
server/
├── config/
│   ├── firebaseConfig.example.js
│   ├── serviceAccountKey.json    # Your downloaded key
│   └── passport.js
```

### 3. Add Firestore Database

If not already created:

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Start in test mode (for development)
4. Choose your region
5. Click **Create**

### 4. Create Firestore Collections (Optional)

You can manually create the collections or let them auto-create:

**users** collection:
```
{
  email: string
  password: string (hashed)
  name: string
  profilePicture: string (nullable)
  authProvider: string ("email" or "google")
  googleId: string (for Google OAuth)
  isVerified: boolean
  createdAt: timestamp
  updatedAt: timestamp
  lastLogin: timestamp
}
```

**drawings** collection:
```
{
  title: string
  data: string (base64 image or canvas data)
  userId: string (reference to user)
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Search for "OAuth 2.0" in the search bar

### 2. Create OAuth 2.0 Credentials

1. Go to **Credentials** in the left sidebar
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Select **Web Application**
4. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
5. Click **Create**
6. Copy your **Client ID** and **Client Secret**

### 3. Enable Google+ API

1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### 4. Add Credentials to `.env`

```env
GOOGLE_CLIENT_ID=<your_client_id>
GOOGLE_CLIENT_SECRET=<your_client_secret>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

---

## Testing the Authentication

### 1. Start the Server

```bash
npm run dev
```

You should see:
```
✓ Server running on http://localhost:5000
✓ Environment: development
✓ Firebase initialized successfully
```

### 2. Test Registration

Using curl or Postman:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### 3. Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456"
  }'
```

### 4. Test Protected Endpoint

Using the token from login/register:

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token>"
```

### 5. Test Drawings API

Create a drawing (requires authentication):

```bash
curl -X POST http://localhost:5000/api/drawings \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Drawing",
    "data": "base64_encoded_data_here"
  }'
```

### 6. Using Postman

1. Open Postman
2. Create a new request
3. For protected endpoints, go to **Authorization** tab
4. Select **Bearer Token** type
5. Paste your JWT token

---

## Client Integration

### React/React Native Example

```javascript
// Login
const loginUser = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    return data.user;
  }
};

// Create Drawing
const saveDrawing = async (title, data) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/drawings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, data })
  });
  
  return response.json();
};

// Get My Drawings
const getMyDrawings = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/drawings', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

### Google OAuth Flow

For React Native/Expo:

```javascript
import * as Google from 'expo-google-app-auth';

const googleSignIn = async () => {
  try {
    const result = await Google.logInAsync({
      iosClientId: YOUR_IOS_CLIENT_ID,
      androidClientId: YOUR_ANDROID_CLIENT_ID,
      iosStandaloneAppClientId: YOUR_IOS_APP_CLIENT_ID,
      androidStandaloneAppClientId: YOUR_ANDROID_APP_CLIENT_ID,
    });

    if (result.type === 'success') {
      // Send idToken to backend
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${result.idToken}`
        }
      });
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
  }
};
```

---

## Production Deployment Checklist

- [ ] Set strong `JWT_SECRET` in production environment
- [ ] Change `NODE_ENV` to `production`
- [ ] Update `CORS_ORIGIN` to your production domain
- [ ] Use HTTPS for all URLs
- [ ] Update `GOOGLE_CALLBACK_URL` to production URL
- [ ] Enable Firestore security rules
- [ ] Set up Firebase App Check for additional security
- [ ] Configure rate limiting on auth endpoints
- [ ] Set up monitoring and logging
- [ ] Use environment-specific Firebase projects
- [ ] Enable 2FA for Firebase console access

---

## Troubleshooting

### Issue: "Firebase initialization error"

**Solution:**
- Verify `config/serviceAccountKey.json` exists and is valid
- Check JSON file isn't corrupted
- Ensure Firebase project ID matches in the JSON

### Issue: "Invalid or expired token"

**Solution:**
- Token may have expired (default 7 days)
- User needs to login again to get new token
- Check `JWT_SECRET` matches between token creation and verification

### Issue: "No token provided"

**Solution:**
- Protected endpoints require `Authorization: Bearer <token>` header
- Check token is being sent in request
- Verify header format: `Authorization: Bearer eyJhbGci...`

### Issue: Google OAuth not working

**Solution:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check `GOOGLE_CALLBACK_URL` matches Google Cloud configuration
- Ensure Google+ API is enabled
- Verify URI doesn't have trailing slash issues

### Issue: Firestore permission denied

**Solution:**
- Check Firestore rules (start with test mode for development)
- Verify service account has proper permissions
- Check Firestore is properly initialized

---

## Next Steps

1. Set up email verification
2. Implement password reset functionality
3. Add refresh token mechanism
4. Implement role-based access control (RBAC)
5. Add rate limiting
6. Set up comprehensive logging
7. Implement API versioning
8. Add API documentation UI (Swagger/OpenAPI)

