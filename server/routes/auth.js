const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  register,
  login,
  verifyGoogleIdToken,
  getCurrentUser,
  updateProfile,
} = require('../controllers/authController');

const router = express.Router();

// Register endpoint
router.post('/register', register);

// Login endpoint
router.post('/login', login);

// Accept Google idToken from client (mobile/native/web)
router.post('/google/token', verifyGoogleIdToken);

// Get current user (requires authentication)
router.get('/me', verifyToken, getCurrentUser);

// Update user profile (requires authentication)
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
