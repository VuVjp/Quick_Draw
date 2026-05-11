# Quick Draw API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_token_here>
```

---

## Auth Endpoints

### 1. User Registration

**POST** `/auth/register`

Register a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- `400`: Email already registered / Invalid input
- `500`: Server error

---

### 2. User Login

**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "profilePicture": "https://..."
  }
}
```

**Error Responses:**
- `401`: Invalid email or password
- `500`: Server error

---

### 3. Google Token Login (recommended)

**POST** `/auth/google/token`

Accepts a Google ID token issued to your client (mobile/web) and returns a JWT for this API.

**Request Body:**
```json
{
  "idToken": "<Google ID token from client>"
}
```

**Response (200):**
```json
{
  "message": "Google token login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@gmail.com",
    "name": "John Doe",
    "profilePicture": "https://..."
  }
}
```

**Error Responses:**
- `400`: Missing or invalid `idToken`
- `500`: Server error

---

### 4. Get Current User

**GET** `/auth/me`

Get the current authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "profilePicture": "https://...",
  "authProvider": "email",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401`: No token / Invalid token
- `404`: User not found
- `500`: Server error

---

### 5. Update User Profile

**PUT** `/auth/profile`

Update the current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "profilePicture": "https://example.com/image.jpg"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user_id",
    "name": "Jane Doe",
    "profilePicture": "https://example.com/image.jpg",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Responses:**
- `401`: No token / Invalid token
- `500`: Server error

---

## Drawing Endpoints

### 1. Create Drawing

**POST** `/drawings`

Save a new drawing.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "My Awesome Drawing",
  "data": "base64_encoded_image_or_canvas_data"
}
```

**Response (201):**
```json
{
  "id": "drawing_id",
  "message": "Drawing saved successfully"
}
```

**Error Responses:**
- `400`: Missing required fields
- `401`: No token / Invalid token
- `500`: Server error

---

### 2. Get My Drawings

**GET** `/drawings`

Retrieve all drawings created by the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "drawing_id_1",
    "title": "My Drawing 1",
    "data": "base64_data",
    "userId": "user_id",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "drawing_id_2",
    "title": "My Drawing 2",
    "data": "base64_data",
    "userId": "user_id",
    "createdAt": "2024-01-14T15:45:00Z",
    "updatedAt": "2024-01-14T15:45:00Z"
  }
]
```

**Error Responses:**
- `401`: No token / Invalid token
- `500`: Server error

---

### 3. Get User's Drawings

**GET** `/drawings/user/:userId`

Retrieve all drawings from a specific user (public access).

**Query Parameters:** None

**Response (200):**
```json
[
  {
    "id": "drawing_id",
    "title": "User's Drawing",
    "data": "base64_data",
    "userId": "user_id",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

**Error Responses:**
- `500`: Server error

---

### 4. Get Single Drawing

**GET** `/drawings/:drawingId`

Retrieve a specific drawing by ID (public access).

**Response (200):**
```json
{
  "id": "drawing_id",
  "title": "My Drawing",
  "data": "base64_data",
  "userId": "user_id",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `404`: Drawing not found
- `500`: Server error

---

### 5. Update Drawing

**PUT** `/drawings/:drawingId`

Update a drawing (must be owner).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "data": "updated_base64_data"
}
```

**Response (200):**
```json
{
  "id": "drawing_id",
  "message": "Drawing updated successfully"
}
```

**Error Responses:**
- `401`: No token / Invalid token
- `403`: Unauthorized (not owner)
- `404`: Drawing not found
- `500`: Server error

---

### 6. Delete Drawing

**DELETE** `/drawings/:drawingId`

Delete a drawing (must be owner).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "drawing_id",
  "message": "Drawing deleted successfully"
}
```

**Error Responses:**
- `401`: No token / Invalid token
- `403`: Unauthorized (not owner)
- `404`: Drawing not found
- `500`: Server error

---

## Utility Endpoints

### Health Check

**GET** `/health`

Check if the server is running.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `200`: OK - Request successful
- `201`: Created - Resource created successfully
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Not authorized to perform this action
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

---

## Example Workflows

### Workflow 1: Register and Create Drawing

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'

# Response includes token
# Save the token: TOKEN=<token_from_response>

# 2. Create Drawing
curl -X POST http://localhost:5000/api/drawings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Drawing",
    "data": "base64_encoded_data"
  }'

# 3. Get My Drawings
curl -X GET http://localhost:5000/api/drawings \
  -H "Authorization: Bearer $TOKEN"
```

### Workflow 2: Google OAuth Login

```bash
# 1. Redirect user to Google OAuth
# Browser navigates to: http://localhost:5000/api/auth/google

# 2. After authorization, server redirects to callback
# Response includes token and user data

# 3. Use token to access protected endpoints
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Environment Variables

Required `.env` configuration:

```env
# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## Token Expiration

Tokens expire after 7 days (configurable via `JWT_EXPIRE`). When a token expires, users need to login again to get a new one.

---

## Security Notes

1. Always send tokens over HTTPS in production
2. Never expose your JWT_SECRET in client-side code
3. Tokens should be stored securely (not in localStorage for sensitive apps)
4. Use HTTPS for OAuth callback URLs in production
5. Implement rate limiting for auth endpoints in production

