const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

// Store active users and their socket connections
const activeUsers = new Map(); // userId -> { socketId, userInfo, roomIds }
const userTyping = new Map(); // roomId -> Set of userIds typing

// Authentication middleware for Socket.IO
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.userId = decodedToken.uid;
    socket.userEmail = decodedToken.email;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
};

io.use(authenticateSocket);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected with socket ${socket.id}`);

  // Store user connection
  activeUsers.set(socket.userId, {
    socketId: socket.id,
    userEmail: socket.userEmail,
    roomIds: new Set(),
    lastSeen: new Date()
  });

  // Notify others about user coming online
  socket.broadcast.emit('user-online', {
    userId: socket.userId,
    userEmail: socket.userEmail
  });

  // Join conversation rooms
  socket.on('join-conversation', async (conversationId) => {
    try {
      // Verify user is part of this conversation
      const conversationRef = db.collection('conversations').doc(conversationId);
      const conversationDoc = await conversationRef.get();
      
      if (!conversationDoc.exists) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      const conversationData = conversationDoc.data();
      if (!conversationData.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Not authorized for this conversation' });
        return;
      }

      // Join the room
      socket.join(conversationId);
      activeUsers.get(socket.userId).roomIds.add(conversationId);
      
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      
      // Notify others in the room
      socket.to(conversationId).emit('user-joined-conversation', {
        userId: socket.userId,
        conversationId
      });

    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { conversationId, content } = data;
      
      // Verify user is in this conversation
      if (!activeUsers.get(socket.userId)?.roomIds.has(conversationId)) {
        socket.emit('error', { message: 'Not in this conversation' });
        return;
      }

      // Create message in Firestore
      const messageData = {
        senderId: socket.userId,
        conversationId,
        content,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        type: 'text'
      };

      const messageRef = await db.collection('messages').add(messageData);
      
      // Update conversation last message
      await db.collection('conversations').doc(conversationId).update({
        lastMessage: content,
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Get the created message with timestamp
      const createdMessage = await messageRef.get();
      const messageWithId = {
        id: messageRef.id,
        ...createdMessage.data(),
        createdAt: new Date() // Use current time for immediate display
      };

      // Emit to all users in the conversation (including sender)
      io.to(conversationId).emit('new-message', messageWithId);

      // Stop typing indicator for this user
      if (userTyping.has(conversationId)) {
        userTyping.get(conversationId).delete(socket.userId);
        if (userTyping.get(conversationId).size === 0) {
          userTyping.delete(conversationId);
        }
        socket.to(conversationId).emit('user-stopped-typing', {
          userId: socket.userId,
          conversationId
        });
      }

      console.log(`Message sent in conversation ${conversationId} by ${socket.userId}`);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { conversationId } = data;
    
    if (!activeUsers.get(socket.userId)?.roomIds.has(conversationId)) {
      return;
    }

    if (!userTyping.has(conversationId)) {
      userTyping.set(conversationId, new Set());
    }
    
    userTyping.get(conversationId).add(socket.userId);
    
    socket.to(conversationId).emit('user-typing', {
      userId: socket.userId,
      conversationId
    });
  });

  socket.on('typing-stop', (data) => {
    const { conversationId } = data;
    
    if (userTyping.has(conversationId)) {
      userTyping.get(conversationId).delete(socket.userId);
      if (userTyping.get(conversationId).size === 0) {
        userTyping.delete(conversationId);
      }
    }
    
    socket.to(conversationId).emit('user-stopped-typing', {
      userId: socket.userId,
      conversationId
    });
  });

  // Handle message read receipts
  socket.on('mark-messages-read', async (data) => {
    try {
      const { conversationId, messageIds } = data;
      
      // Update read status in Firestore (optional - for persistent read receipts)
      const batch = db.batch();
      messageIds.forEach(messageId => {
        const messageRef = db.collection('messages').doc(messageId);
        batch.update(messageRef, {
          [`readBy.${socket.userId}`]: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();

      // Emit read receipt to other users
      socket.to(conversationId).emit('messages-read', {
        userId: socket.userId,
        conversationId,
        messageIds
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
    
    // Remove from typing indicators
    userTyping.forEach((typingUsers, conversationId) => {
      if (typingUsers.has(socket.userId)) {
        typingUsers.delete(socket.userId);
        socket.to(conversationId).emit('user-stopped-typing', {
          userId: socket.userId,
          conversationId
        });
      }
    });

    // Remove from active users
    activeUsers.delete(socket.userId);
    
    // Notify others about user going offline
    socket.broadcast.emit('user-offline', {
      userId: socket.userId
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get online users
app.get('/api/users/online', (req, res) => {
  const onlineUsers = Array.from(activeUsers.entries()).map(([userId, userData]) => ({
    userId,
    userEmail: userData.userEmail,
    lastSeen: userData.lastSeen
  }));
  
  res.json({ onlineUsers });
});

// Get conversation participants status
app.get('/api/conversations/:id/participants/status', async (req, res) => {
  try {
    const conversationId = req.params.id;
    
    // Get conversation participants
    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    if (!conversationDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const participants = conversationDoc.data().participants;
    const participantStatus = participants.map(userId => ({
      userId,
      online: activeUsers.has(userId),
      lastSeen: activeUsers.get(userId)?.lastSeen || null
    }));

    res.json({ participants: participantStatus });
  } catch (error) {
    console.error('Error getting participant status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Real-time messaging server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});

module.exports = { app, server, io };
