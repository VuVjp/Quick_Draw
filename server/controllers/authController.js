const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {OAuth2Client} = require('google-auth-library');
const admin = require('firebase-admin');
const db = admin.firestore();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId, email) => {
  const token = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  return token;
};

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').where('email', '==', email).get();
    if (!existingUser.empty) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userRef = await db.collection('users').add({
      email,
      password: hashedPassword,
      name,
      authProvider: 'email',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      profilePicture: null,
      isVerified: false,
    });

    // Generate token
    const token = generateToken(userRef.id, email);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userRef.id,
        email,
        name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .where('authProvider', '==', 'email')
      .get();

    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(userDoc.id, email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userDoc.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// (Redirect-based Google OAuth callback removed — idToken flow only)

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();
    res.json({
      id: userDoc.id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, profilePicture } = req.body;

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (name) updateData.name = name;
    if (profilePicture) updateData.profilePicture = profilePicture;

    await db.collection('users').doc(userId).update(updateData);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: userId,
        ...updateData,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify idToken sent from client (mobile/native/web)
const verifyGoogleIdToken = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const displayName = payload.name || email.split('@')[0];
    const profilePicture = payload.picture || null;

    // Check if user exists by googleId
    let userDoc = null;
    const existingByGoogle = await db.collection('users').where('googleId', '==', googleId).get();
    if (!existingByGoogle.empty) {
      userDoc = existingByGoogle.docs[0];
      await userDoc.ref.update({ lastLogin: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      // Check if email exists
      const emailUser = await db.collection('users').where('email', '==', email).get();
      if (!emailUser.empty) {
        userDoc = emailUser.docs[0];
        const updateData = {
          googleId,
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (profilePicture) updateData.profilePicture = profilePicture;
        await userDoc.ref.update(updateData);
      } else {
        const newUser = {
          email,
          name: displayName,
          googleId,
          authProvider: 'google',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
          isVerified: true,
        };
        if (profilePicture) newUser.profilePicture = profilePicture;
        const userRef = await db.collection('users').add(newUser);
        userDoc = await userRef.get();
      }
    }

    const token = generateToken(userDoc.id, email);
    res.json({ message: 'Google token login successful', token, user: { id: userDoc.id, email: userDoc.data().email, name: userDoc.data().name, profilePicture: userDoc.data().profilePicture } });
  } catch (error) {
    console.error('verifyGoogleIdToken error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyGoogleIdToken,
  getCurrentUser,
  updateProfile,
  generateToken,
};
