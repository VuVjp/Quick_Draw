const express = require('express');
const admin = require('firebase-admin');
const { verifyToken, optionalToken } = require('../middleware/auth');

const router = express.Router();
const db = admin.firestore();

// Create a new drawing (requires authentication)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, data } = req.body;
    const userId = req.user.userId;

    if (!title || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, data' 
      });
    }

    const docRef = await db.collection('drawings').add({
      title,
      data,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ 
      id: docRef.id,
      message: 'Drawing saved successfully'
    });
  } catch (error) {
    console.error('Error saving drawing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all drawings for current user (requires authentication)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const snapshot = await db.collection('drawings')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const drawings = [];
    snapshot.forEach(doc => {
      drawings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(drawings);
  } catch (error) {
    console.error('Error fetching drawings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all drawings for a specific user (public, optional auth)
router.get('/user/:userId', optionalToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const snapshot = await db.collection('drawings')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const drawings = [];
    snapshot.forEach(doc => {
      drawings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(drawings);
  } catch (error) {
    console.error('Error fetching drawings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single drawing by ID (public, optional auth)
router.get('/:drawingId', optionalToken, async (req, res) => {
  try {
    const { drawingId } = req.params;
    
    const doc = await db.collection('drawings').doc(drawingId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Drawing not found' });
    }

    res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    console.error('Error fetching drawing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a drawing (requires authentication)
router.put('/:drawingId', verifyToken, async (req, res) => {
  try {
    const { drawingId } = req.params;
    const { title, data } = req.body;
    const userId = req.user.userId;

    const drawingDoc = await db.collection('drawings').doc(drawingId).get();
    
    if (!drawingDoc.exists) {
      return res.status(404).json({ error: 'Drawing not found' });
    }

    // Check ownership
    if (drawingDoc.data().userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only edit your own drawings' });
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (title) updateData.title = title;
    if (data) updateData.data = data;

    await db.collection('drawings').doc(drawingId).update(updateData);

    res.json({ 
      id: drawingId,
      message: 'Drawing updated successfully'
    });
  } catch (error) {
    console.error('Error updating drawing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a drawing (requires authentication)
router.delete('/:drawingId', verifyToken, async (req, res) => {
  try {
    const { drawingId } = req.params;
    const userId = req.user.userId;

    const drawingDoc = await db.collection('drawings').doc(drawingId).get();
    
    if (!drawingDoc.exists) {
      return res.status(404).json({ error: 'Drawing not found' });
    }

    // Check ownership
    if (drawingDoc.data().userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own drawings' });
    }
    
    await db.collection('drawings').doc(drawingId).delete();

    res.json({ 
      id: drawingId,
      message: 'Drawing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting drawing:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
