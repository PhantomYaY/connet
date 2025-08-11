import { auth, db, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from './firebase';

class CollaborationService {
  constructor() {
    this.currentNoteId = null;
    this.currentUser = null;
    this.collaborators = new Map();
    this.cursors = new Map();
    this.unsubscribeSnapshot = null;
    this.heartbeatInterval = null;
    this.callbacks = {
      onCollaboratorsChanged: [],
      onCursorMoved: [],
      onContentChanged: []
    };

    // Initialize auth listener
    auth.onAuthStateChanged((user) => {
      this.currentUser = user;
    });
  }

  // Join a collaborative note session
  async joinNote(noteId) {
    if (this.currentNoteId === noteId) return;
    
    // Leave current session if any
    if (this.currentNoteId) {
      await this.leaveNote();
    }

    this.currentNoteId = noteId;
    
    if (!this.currentUser) {
      console.warn('User not authenticated for collaboration');
      return;
    }

    try {
      // Add user to active collaborators
      const userPresenceRef = doc(db, 'noteCollaboration', noteId, 'presence', this.currentUser.uid);
      await setDoc(userPresenceRef, {
        userId: this.currentUser.uid,
        displayName: this.currentUser.displayName || this.currentUser.email,
        email: this.currentUser.email,
        photoURL: this.currentUser.photoURL,
        lastSeen: serverTimestamp(),
        cursor: { x: 0, y: 0, line: 0, column: 0 },
        isActive: true
      });

      // Start listening to collaborators
      this.setupCollaborationListener(noteId);
      
      // Start heartbeat to maintain presence
      this.startHeartbeat();
      
      console.log(`✅ Joined collaboration for note: ${noteId}`);
    } catch (error) {
      console.error('Failed to join collaboration:', error);
    }
  }

  // Leave current collaborative session
  async leaveNote() {
    if (!this.currentNoteId || !this.currentUser) return;

    try {
      // Remove user from active collaborators
      const userPresenceRef = doc(db, 'noteCollaboration', this.currentNoteId, 'presence', this.currentUser.uid);
      await deleteDoc(userPresenceRef);
      
      // Stop listening
      if (this.unsubscribeSnapshot) {
        this.unsubscribeSnapshot();
        this.unsubscribeSnapshot = null;
      }
      
      // Stop heartbeat
      this.stopHeartbeat();
      
      // Clear local state
      this.collaborators.clear();
      this.cursors.clear();
      
      console.log(`✅ Left collaboration for note: ${this.currentNoteId}`);
      this.currentNoteId = null;
      
      // Notify callbacks
      this.notifyCallbacks('onCollaboratorsChanged', []);
    } catch (error) {
      console.error('Failed to leave collaboration:', error);
    }
  }

  // Setup real-time listener for collaborators
  setupCollaborationListener(noteId) {
    import('./firebase').then(({ collection, onSnapshot }) => {
      const presenceCollection = collection(db, 'noteCollaboration', noteId, 'presence');

      this.unsubscribeSnapshot = onSnapshot(
        presenceCollection,
        (snapshot) => {
          const presenceData = {};
          snapshot.forEach((doc) => {
            presenceData[doc.id] = doc.data();
          });
          this.handleCollaborationUpdate({ presence: presenceData });
        },
        (error) => {
          console.error('Collaboration listener error:', error);
        }
      );
    });
  }

  // Handle updates from other collaborators
  handleCollaborationUpdate(data) {
    const activeCollaborators = [];
    
    if (data.presence) {
      Object.entries(data.presence).forEach(([userId, userData]) => {
        if (userId !== this.currentUser?.uid && userData.isActive) {
          activeCollaborators.push(userData);
          
          // Update cursor position
          if (userData.cursor) {
            this.cursors.set(userId, userData.cursor);
          }
        }
      });
    }

    this.collaborators = new Map(activeCollaborators.map(user => [user.userId, user]));
    
    // Notify callbacks
    this.notifyCallbacks('onCollaboratorsChanged', activeCollaborators);
    this.notifyCallbacks('onCursorMoved', Array.from(this.cursors.entries()));
  }

  // Update cursor position
  async updateCursor(cursorPosition) {
    if (!this.currentNoteId || !this.currentUser) return;

    try {
      const userPresenceRef = doc(db, 'noteCollaboration', this.currentNoteId, 'presence', this.currentUser.uid);
      await setDoc(userPresenceRef, {
        cursor: cursorPosition,
        lastSeen: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Failed to update cursor:', error);
    }
  }

  // Share content changes
  async shareContentChange(change) {
    if (!this.currentNoteId || !this.currentUser) return;

    try {
      const changeDoc = doc(db, 'noteCollaboration', this.currentNoteId, 'changes', Date.now().toString());
      await setDoc(changeDoc, {
        userId: this.currentUser.uid,
        change: change,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to share content change:', error);
    }
  }

  // Start heartbeat to maintain presence
  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      if (this.currentNoteId && this.currentUser) {
        try {
          const userPresenceRef = doc(db, 'noteCollaboration', this.currentNoteId, 'presence', this.currentUser.uid);
          await setDoc(userPresenceRef, {
            lastSeen: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Register callbacks for collaboration events
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  // Unregister callbacks
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  // Notify all callbacks for an event
  notifyCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Callback error for ${event}:`, error);
        }
      });
    }
  }

  // Get current collaborators
  getCollaborators() {
    return Array.from(this.collaborators.values());
  }

  // Get cursor positions
  getCursors() {
    return Array.from(this.cursors.entries());
  }

  // Check if currently in a collaborative session
  isCollaborating() {
    return this.currentNoteId !== null && this.collaborators.size > 0;
  }

  // Cleanup when service is destroyed
  destroy() {
    this.leaveNote();
    this.callbacks = {
      onCollaboratorsChanged: [],
      onCursorMoved: [],
      onContentChanged: []
    };
  }
}

// Create singleton instance
const collaborationService = new CollaborationService();

export default collaborationService;
