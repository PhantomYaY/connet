import { io } from 'socket.io-client';
import { auth } from './firebase';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageCallbacks = new Map();
    this.eventCallbacks = new Map();
  }

  async connect() {
    if (this.socket?.connected) {
      return;
    }

    try {
      // Get Firebase auth token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      
      // Connect to backend
      this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });

      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          console.log('🔌 Connected to real-time server');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          this.isConnected = false;
          reject(error);
        });
      });

    } catch (error) {
      console.error('Failed to connect to socket server:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Connection events
    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time server');
      this.isConnected = false;
      this.emit('connection-status', { connected: false });
    });

    this.socket.on('reconnect', () => {
      console.log('🔌 Reconnected to real-time server');
      this.isConnected = true;
      this.emit('connection-status', { connected: true });
    });

    // Message events
    this.socket.on('new-message', (message) => {
      console.log('📨 New message received:', message);
      this.emit('new-message', message);
    });

    // Typing events
    this.socket.on('user-typing', (data) => {
      this.emit('user-typing', data);
    });

    this.socket.on('user-stopped-typing', (data) => {
      this.emit('user-stopped-typing', data);
    });

    // Presence events
    this.socket.on('user-online', (data) => {
      this.emit('user-online', data);
    });

    this.socket.on('user-offline', (data) => {
      this.emit('user-offline', data);
    });

    this.socket.on('user-joined-conversation', (data) => {
      this.emit('user-joined-conversation', data);
    });

    // Read receipts
    this.socket.on('messages-read', (data) => {
      this.emit('messages-read', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
      this.emit('error', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (!this.isConnected) {
      console.warn('Not connected to socket server');
      return;
    }
    
    console.log(`🏠 Joining conversation: ${conversationId}`);
    this.socket.emit('join-conversation', conversationId);
  }

  // Send a message
  sendMessage(conversationId, content) {
    if (!this.isConnected) {
      console.warn('Not connected to socket server');
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('send-message', {
        conversationId,
        content
      });

      // Listen for confirmation or error
      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 5000);

      const onNewMessage = (message) => {
        if (message.conversationId === conversationId) {
          clearTimeout(timeout);
          this.off('new-message', onNewMessage);
          resolve(message);
        }
      };

      this.on('new-message', onNewMessage);
    });
  }

  // Typing indicators
  startTyping(conversationId) {
    if (!this.isConnected) return;
    this.socket.emit('typing-start', { conversationId });
  }

  stopTyping(conversationId) {
    if (!this.isConnected) return;
    this.socket.emit('typing-stop', { conversationId });
  }

  // Mark messages as read
  markMessagesRead(conversationId, messageIds) {
    if (!this.isConnected) return;
    this.socket.emit('mark-messages-read', {
      conversationId,
      messageIds
    });
  }

  // Event system for components to listen to
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Auto-connect when user is authenticated
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      await socketService.connect();
    } catch (error) {
      console.error('Failed to auto-connect to socket server:', error);
    }
  } else {
    socketService.disconnect();
  }
});

export default socketService;
