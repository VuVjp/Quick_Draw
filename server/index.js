require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000' || 'https://localhost:8081',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin (MUST BE FIRST)
// Make sure to set up your Firebase credentials in .env or via service account file
try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require('./config/serviceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  console.log('✓ Firebase initialized successfully');
} catch (error) {
  console.error('✗ Firebase initialization error:', error.message);
  console.error('Make sure config/serviceAccountKey.json exists or FIREBASE_SERVICE_ACCOUNT env var is set');
  process.exit(1);
}

// Initialize Passport (after Firebase is initialized)
const passport = require('passport');
console.log('✓ Passport module loaded');

require('./config/passport');
console.log('✓ Passport config loaded');

// Initialize Passport middleware
app.use(passport.initialize());
console.log('✓ Passport middleware initialized');

const db = admin.firestore();
console.log('✓ Firestore database reference created');

// Import routes
console.log('✓ Starting route imports...');
const authRoutes = require('./routes/auth');
console.log('✓ Auth routes loaded');

const drawingsRoutes = require('./routes/drawings');
console.log('✓ Drawings routes loaded');

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Quick Draw Server is running',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drawings', drawingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
