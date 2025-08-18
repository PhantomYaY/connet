import {
  db,
  auth,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  setDoc,
  withRetry,
  onSnapshot
} from "./firebase";

// Get user UID
const getUserId = () => auth.currentUser?.uid;

// === USER PROFILE ===
export const createUserProfile = async (userInfo) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  
  const userProfile = {
    uid: userId,
    email: userInfo.email,
    displayName: userInfo.displayName || userInfo.email.split('@')[0],
    photoURL: userInfo.photoURL || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    settings: {
      theme: 'light',
      notifications: true,
      publicProfile: false
    }
  };
  
  await setDoc(doc(db, "users", userId), userProfile);
  return userProfile;
};

export const getUserProfile = async (userId = null) => {
  const uid = userId || getUserId();
  if (!uid) return null;

  return await withRetry(async () => {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  });
};

export const updateUserProfile = async (updates) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// === ROOT FOLDER ===
export const ensureRootFolder = async () => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const rootRef = doc(db, "users", userId, "folders", "root");
  const rootSnapshot = await getDoc(rootRef);

  if (!rootSnapshot.exists()) {
    const user = await getUserProfile();
    const rootFolderData = {
      name: `${user?.displayName || 'Your'} Notes`,
      parentId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isFolder: true,
      isRoot: true
    };

    await setDoc(rootRef, rootFolderData);
  }

  return rootRef.id;
};

export const getRootFolder = async () => {
  const userId = getUserId();
  if (!userId) return null;

  const rootRef = doc(db, "users", userId, "folders", "root");
  const rootSnapshot = await getDoc(rootRef);

  if (rootSnapshot.exists()) {
    return { id: rootSnapshot.id, ...rootSnapshot.data() };
  }

  // Create root folder if it doesn't exist
  await ensureRootFolder();
  const newSnapshot = await getDoc(rootRef);
  return { id: newSnapshot.id, ...newSnapshot.data() };
};

// === FOLDERS ===
export const getFolders = async () => {
  const userId = getUserId();
  if (!userId) return [];

  // Ensure root folder exists
  await ensureRootFolder();

  return await withRetry(async () => {
    const q = query(
      collection(db, "users", userId, "folders"),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });
};

export const createFolder = async (name, parentId = null) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Default to root folder as parent if none specified
  const finalParentId = parentId || 'root';

  const folderData = {
    name: name.trim(),
    parentId: finalParentId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isFolder: true
  };

  return await addDoc(collection(db, "users", userId, "folders"), folderData);
};

export const renameFolder = async (folderId, newName) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  
  const ref = doc(db, "users", userId, "folders", folderId);
  await updateDoc(ref, { 
    name: newName.trim(),
    updatedAt: serverTimestamp() 
  });
};

export const deleteFolder = async (folderId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Prevent deletion of root folder
  if (folderId === 'root') {
    throw new Error('Cannot delete root folder');
  }

  // First, move all notes in this folder to root folder
  const notesInFolder = await getNotesByFolder(folderId);
  for (const note of notesInFolder) {
    await updateNote(note.id, { folderId: 'root' });
  }

  const ref = doc(db, "users", userId, "folders", folderId);
  await deleteDoc(ref);
};

// === NOTES ===
export const getNotes = async () => {
  const userId = getUserId();
  if (!userId) return [];

  return await withRetry(async () => {
    const q = query(
      collection(db, "users", userId, "notes"),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });
};

export const getNotesByFolder = async (folderId) => {
  const userId = getUserId();
  if (!userId) return [];

  const q = query(
    collection(db, "users", userId, "notes"),
    where("folderId", "==", folderId)
  );
  const snapshot = await getDocs(q);
  const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort by updatedAt in JavaScript to avoid composite index
  return notes.sort((a, b) => {
    const aTime = a.updatedAt?.toDate?.() || new Date(0);
    const bTime = b.updatedAt?.toDate?.() || new Date(0);
    return bTime - aTime;
  });
};

export const getRecentNotes = async (limit = 5) => {
  const userId = getUserId();
  if (!userId) return [];
  
  const q = query(
    collection(db, "users", userId, "notes"),
    orderBy("updatedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getPinnedNotes = async () => {
  const userId = getUserId();
  if (!userId) return [];

  const q = query(
    collection(db, "users", userId, "notes"),
    where("pinned", "==", true)
  );
  const snapshot = await getDocs(q);
  const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort by updatedAt in JavaScript to avoid composite index
  return notes.sort((a, b) => {
    const aTime = a.updatedAt?.toDate?.() || new Date(0);
    const bTime = b.updatedAt?.toDate?.() || new Date(0);
    return bTime - aTime;
  });
};

export const getNote = async (noteId) => {
  const userId = getUserId();
  if (!userId) return null;
  
  const noteDoc = await getDoc(doc(db, "users", userId, "notes", noteId));
  return noteDoc.exists() ? { id: noteDoc.id, ...noteDoc.data() } : null;
};

export const createNote = async (title, content = "", folderId = null) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Ensure root folder exists
  await ensureRootFolder();

  // Default to root folder if no folder specified
  const finalFolderId = folderId || 'root';

  const noteData = {
    title: title.trim() || "Untitled Note",
    content,
    folderId: finalFolderId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    pinned: false,
    tags: [],
    shared: false,
    collaborators: []
  };

  return await addDoc(collection(db, "users", userId, "notes"), noteData);
};

export const updateNote = async (noteId, updates) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  
  const ref = doc(db, "users", userId, "notes", noteId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteNote = async (noteId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  
  const ref = doc(db, "users", userId, "notes", noteId);
  await deleteDoc(ref);
};

export const togglePinNote = async (noteId, pinned) => {
  await updateNote(noteId, { pinned });
};

export const addTagToNote = async (noteId, tag) => {
  const note = await getNote(noteId);
  if (!note) return;

  const tags = note.tags || [];
  if (!tags.includes(tag)) {
    await updateNote(noteId, { tags: [...tags, tag] });
  }
};

export const removeTagFromNote = async (noteId, tag) => {
  const note = await getNote(noteId);
  if (!note) return;

  const tags = note.tags || [];
  await updateNote(noteId, { tags: tags.filter(t => t !== tag) });
};

// === FILES MANAGEMENT (enhanced file system) ===
export const getFiles = async () => {
  const userId = getUserId();
  if (!userId) return [];

  return await withRetry(async () => {
    // Get both notes and files
    const [notesSnapshot, filesSnapshot] = await Promise.all([
      getDocs(query(
        collection(db, "users", userId, "notes"),
        orderBy("updatedAt", "desc")
      )),
      getDocs(query(
        collection(db, "users", userId, "files"),
        orderBy("updatedAt", "desc")
      )).catch(() => ({ docs: [] })) // Files collection might not exist yet
    ]);

    // Convert notes to files format
    const notesAsFiles = notesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fileType: 'note' // Mark as note type
    }));

    // Get actual files
    const actualFiles = filesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Combine and sort by updatedAt
    const allFiles = [...notesAsFiles, ...actualFiles];
    return allFiles.sort((a, b) => {
      const aTime = a.updatedAt?.toDate?.() || new Date(0);
      const bTime = b.updatedAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
  });
};

export const createFile = async (fileData) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const fileDoc = {
    ...fileData,
    fileType: fileData.fileType || 'note',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    folderId: fileData.folderId || 'root'
  };

  // If it's a note type, save to notes collection for compatibility
  const collectionName = fileDoc.fileType === 'note' ? 'notes' : 'files';
  const filesRef = collection(db, "users", userId, collectionName);
  const docRef = await addDoc(filesRef, fileDoc);
  return docRef.id;
};

export const updateFile = async (fileId, updates) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Try to find the file in both collections
  const noteRef = doc(db, "users", userId, "notes", fileId);
  const fileRef = doc(db, "users", userId, "files", fileId);

  try {
    // Check if it exists in notes collection first
    const noteSnap = await getDoc(noteRef);
    if (noteSnap.exists()) {
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return;
    }

    // Otherwise update in files collection
    await updateDoc(fileRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
};

export const deleteFile = async (fileId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Try to delete from both collections
  const noteRef = doc(db, "users", userId, "notes", fileId);
  const fileRef = doc(db, "users", userId, "files", fileId);

  try {
    // Check if it exists in notes collection first
    const noteSnap = await getDoc(noteRef);
    if (noteSnap.exists()) {
      await deleteDoc(noteRef);
      return;
    }

    // Otherwise delete from files collection
    await deleteDoc(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const getFile = async (fileId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Try to get from both collections
  const noteRef = doc(db, "users", userId, "notes", fileId);
  const fileRef = doc(db, "users", userId, "files", fileId);

  try {
    // Check notes collection first
    const noteSnap = await getDoc(noteRef);
    if (noteSnap.exists()) {
      return { id: noteSnap.id, ...noteSnap.data(), fileType: 'note' };
    }

    // Otherwise check files collection
    const fileSnap = await getDoc(fileRef);
    if (fileSnap.exists()) {
      return { id: fileSnap.id, ...fileSnap.data() };
    }

    throw new Error('File not found');
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
};

// === COMMUNITIES ===






export const getCommunityPosts = async (communityId = null) => {
  let q;
  if (communityId) {
    q = query(
      collection(db, "posts"),
      where("communityId", "==", communityId)
    );
  } else {
    q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  }

  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort by createdAt in JavaScript if filtering by community to avoid composite index
  if (communityId) {
    return posts.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
  }

  return posts;
};

// Get trending posts from communities
export const getTrendingPosts = async (limit = 5) => {
  try {
    // Get posts sorted by likes + comments for trending
    const q = query(
      collection(db, "communityPosts"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort by engagement (likes + comments) for trending
    const trendingPosts = posts.sort((a, b) => {
      const aEngagement = (a.likes || 0) + (a.comments || 0);
      const bEngagement = (b.likes || 0) + (b.comments || 0);
      return bEngagement - aEngagement;
    });

    return trendingPosts.slice(0, limit);
  } catch (error) {
    console.error("Error getting trending posts:", error);
    // Fallback to mock data if no posts exist
    return [];
  }
};

// === COMMUNITIES ===
// Function to update community details
export const updateCommunity = async (communityId, updateData) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  try {
    const communityRef = doc(db, "communities", communityId);
    const communityDoc = await getDoc(communityRef);

    if (!communityDoc.exists()) {
      throw new Error('Community not found');
    }

    const community = communityDoc.data();

    // Check if user is the creator or a moderator
    if (community.createdBy !== userId && !community.moderators?.includes(userId)) {
      throw new Error('Unauthorized: Only community creators and moderators can edit community details');
    }

    await updateDoc(communityRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
      lastModifiedBy: userId
    });

    return { id: communityId, ...community, ...updateData };
  } catch (error) {
    console.error('Error updating community:', error);
    throw error;
  }
};

// Function to change community icon
export const updateCommunityIcon = async (communityId, newIcon) => {
  return await updateCommunity(communityId, { icon: newIcon });
};

// Function to check if user can edit community
export const canEditCommunity = async (communityId) => {
  const userId = getUserId();
  if (!userId) return false;

  try {
    const communityRef = doc(db, "communities", communityId);
    const communityDoc = await getDoc(communityRef);

    if (!communityDoc.exists()) return false;

    const community = communityDoc.data();
    return community.createdBy === userId || community.moderators?.includes(userId);
  } catch (error) {
    console.error('Error checking edit permissions:', error);
    return false;
  }
};

export const createCommunity = async (communityData) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const community = {
    ...communityData,
    id: communityData.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    members: [userId],
    memberCount: 1,
    onlineMembers: 1,
    moderators: [userId],
    isOfficial: false
  };

  await setDoc(doc(db, "communities", community.id), community);
  return community;
};

export const getCommunities = async () => {
  try {
    const userId = getUserId();
    const q = query(collection(db, "communities"), orderBy("memberCount", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const isJoined = userId && data.members && data.members.includes(userId);

      return {
        id: doc.id,
        ...data,
        isJoined: isJoined || false
      };
    });
  } catch (error) {
    console.error("Error getting communities:", error);
    return [];
  }
};

export const joinCommunity = async (communityId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const communityRef = doc(db, "communities", communityId);
  const communityDoc = await getDoc(communityRef);

  if (communityDoc.exists()) {
    const currentMembers = communityDoc.data().members || [];
    if (!currentMembers.includes(userId)) {
      await updateDoc(communityRef, {
        members: [...currentMembers, userId],
        memberCount: currentMembers.length + 1,
        updatedAt: serverTimestamp()
      });
    }
  }
};

export const leaveCommunity = async (communityId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const communityRef = doc(db, "communities", communityId);
  const communityDoc = await getDoc(communityRef);

  if (communityDoc.exists()) {
    const currentMembers = communityDoc.data().members || [];
    const updatedMembers = currentMembers.filter(id => id !== userId);
    await updateDoc(communityRef, {
      members: updatedMembers,
      memberCount: updatedMembers.length,
      updatedAt: serverTimestamp()
    });
  }
};

// === WHITEBOARDS ===
export const createCommunityPost = async (postData) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const userProfile = await getUserProfile();

  const post = {
    ...postData,
    authorId: userId,
    author: {
      uid: userId,
      displayName: userProfile?.displayName || 'Anonymous',
      photoURL: userProfile?.photoURL || null,
      avatar: userProfile?.avatar || '👤'
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likes: 0,
    dislikes: 0,
    comments: 0,
    views: 0,
    shares: 0,
    likedBy: [],
    dislikedBy: []
  };

  const docRef = await addDoc(collection(db, "communityPosts"), post);
  return { id: docRef.id, ...post };
};

export const getCommunityPostsReal = async (communityId = null, limit = 20) => {
  try {
    let q;
    if (communityId) {
      q = query(
        collection(db, "communityPosts"),
        where("communityId", "==", communityId),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "communityPosts"),
        orderBy("createdAt", "desc")
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting whiteboards:", error);
    return [];
  }
};

export const likePost = async (postId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const postRef = doc(db, "communityPosts", postId);
  const postDoc = await getDoc(postRef);

  if (postDoc.exists()) {
    const data = postDoc.data();
    const likedBy = data.likedBy || [];
    const dislikedBy = data.dislikedBy || [];

    const isLiked = likedBy.includes(userId);
    const isDisliked = dislikedBy.includes(userId);

    let updatedLikedBy, updatedDislikedBy, likes, dislikes;

    if (isLiked) {
      // Remove like
      updatedLikedBy = likedBy.filter(id => id !== userId);
      updatedDislikedBy = dislikedBy;
      likes = Math.max(0, (data.likes || 0) - 1);
      dislikes = data.dislikes || 0;
    } else {
      // Add like, remove dislike if exists
      updatedLikedBy = [...likedBy, userId];
      updatedDislikedBy = dislikedBy.filter(id => id !== userId);
      likes = (data.likes || 0) + 1;
      dislikes = isDisliked ? Math.max(0, (data.dislikes || 0) - 1) : (data.dislikes || 0);
    }

    await updateDoc(postRef, {
      likes,
      dislikes,
      likedBy: updatedLikedBy,
      dislikedBy: updatedDislikedBy,
      updatedAt: serverTimestamp()
    });
  }
};

export const dislikePost = async (postId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const postRef = doc(db, "communityPosts", postId);
  const postDoc = await getDoc(postRef);

  if (postDoc.exists()) {
    const data = postDoc.data();
    const likedBy = data.likedBy || [];
    const dislikedBy = data.dislikedBy || [];

    const isLiked = likedBy.includes(userId);
    const isDisliked = dislikedBy.includes(userId);

    let updatedLikedBy, updatedDislikedBy, likes, dislikes;

    if (isDisliked) {
      // Remove dislike
      updatedLikedBy = likedBy;
      updatedDislikedBy = dislikedBy.filter(id => id !== userId);
      likes = data.likes || 0;
      dislikes = Math.max(0, (data.dislikes || 0) - 1);
    } else {
      // Add dislike, remove like if exists
      updatedLikedBy = likedBy.filter(id => id !== userId);
      updatedDislikedBy = [...dislikedBy, userId];
      likes = isLiked ? Math.max(0, (data.likes || 0) - 1) : (data.likes || 0);
      dislikes = (data.dislikes || 0) + 1;
    }

    await updateDoc(postRef, {
      likes,
      dislikes,
      likedBy: updatedLikedBy,
      dislikedBy: updatedDislikedBy,
      updatedAt: serverTimestamp()
    });
  }
};


// === NOTIFICATIONS SYSTEM ===
export const createNotification = async (notificationData) => {
  const notification = {
    ...notificationData,
    createdAt: serverTimestamp(),
    read: false
  };

  await addDoc(collection(db, "notifications"), notification);
};

export const getNotifications = async (limit = 20) => {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
      // limit(limit)
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort by createdAt in JavaScript to avoid composite index
    return notifications.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
};

export const markNotificationRead = async (notificationId) => {
  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
    readAt: serverTimestamp()
  });
};

export const markAllNotificationsRead = async () => {
  const userId = getUserId();
  if (!userId) return;

  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("read", "==", false)
  );

  const snapshot = await getDocs(q);
  const batch = [];

  snapshot.docs.forEach((docSnap) => {
    batch.push(updateDoc(docSnap.ref, {
      read: true,
      readAt: serverTimestamp()
    }));
  });

  await Promise.all(batch);
};

export const clearAllNotifications = async () => {
  const userId = getUserId();
  if (!userId) return;

  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const batch = [];

    snapshot.docs.forEach((docSnap) => {
      batch.push(deleteDoc(docSnap.ref));
    });

    await Promise.all(batch);
  } catch (error) {
    console.error("Error clearing all notifications:", error);
    throw error;
  }
};

export const getUnreadNotificationCount = async () => {
  const userId = getUserId();
  if (!userId) return 0;

  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
};

export const createPost = async (content, communityId = null) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  
  const postData = {
    content: content.trim(),
    authorId: userId,
    communityId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likes: 0,
    replies: 0
  };
  
  return await addDoc(collection(db, "posts"), postData);
};

// === TREE STRUCTURE ===
export const getUserTree = async () => {
  const userId = getUserId();
  if (!userId) return null;
  
  const treeRef = doc(db, "users", userId, "tree", "data");
  const snapshot = await getDoc(treeRef);
  
  if (snapshot.exists()) {
    return snapshot.data();
  } else {
    const user = await getUserProfile();
    const initialTree = {
      label: `${user?.displayName || 'Your'} Notes`,
      isFolder: true,
      childrenNodes: [],
    };
    await setDoc(treeRef, initialTree);
    return initialTree;
  }
};

export const updateUserTree = async (treeData) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const treeRef = doc(db, "users", userId, "tree", "data");
  await setDoc(treeRef, treeData);
};

// === MIGRATION HELPERS ===
export const migrateLegacyNotes = async () => {
  const userId = getUserId();
  if (!userId) return 0;

  // Ensure root folder exists
  await ensureRootFolder();

  // Find notes without folderId or with null/undefined folderId
  const q = query(collection(db, "users", userId, "notes"));
  const snapshot = await getDocs(q);

  let migratedCount = 0;
  const batch = [];

  for (const docSnapshot of snapshot.docs) {
    const noteData = docSnapshot.data();
    if (!noteData.folderId) {
      // Update note to be in root folder
      batch.push(
        updateNote(docSnapshot.id, { folderId: 'root' })
      );
      migratedCount++;
    }
  }

  // Execute all updates
  await Promise.all(batch);

  return migratedCount;
};

// === FLASHCARDS ===
export const saveFlashCards = async (flashCardSet) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const flashCardData = {
    ...flashCardSet,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  return await addDoc(collection(db, "users", userId, "flashcards"), flashCardData);
};

export const getUserFlashCards = async () => {
  const userId = getUserId();
  if (!userId) return [];

  const q = query(
    collection(db, "users", userId, "flashcards"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getFlashCard = async (flashCardId) => {
  const userId = getUserId();
  if (!userId) return null;

  const flashCardDoc = await getDoc(doc(db, "users", userId, "flashcards", flashCardId));
  return flashCardDoc.exists() ? { id: flashCardDoc.id, ...flashCardDoc.data() } : null;
};

export const updateFlashCard = async (flashCardId, updates) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const flashCardRef = doc(db, "users", userId, "flashcards", flashCardId);
  await updateDoc(flashCardRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteFlashCard = async (flashCardId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  await deleteDoc(doc(db, "users", userId, "flashcards", flashCardId));
};

// === API KEYS ===
export const saveUserApiKey = async (service, apiKey) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const encrypt = (text) => btoa(text + 'connectEd_api_key_salt');

  const apiKeyData = {
    key: encrypt(apiKey),
    service: service,
    timestamp: serverTimestamp(),
    lastUsed: serverTimestamp(),
    userId: userId
  };

  const apiKeyRef = doc(db, "users", userId, "apiKeys", service);
  await setDoc(apiKeyRef, apiKeyData);
  return true;
};

export const getUserApiKey = async (service) => {
  const userId = getUserId();
  if (!userId) return null;

  const decrypt = (encryptedText) => {
    try {
      const decoded = atob(encryptedText);
      return decoded.replace('connectEd_api_key_salt', '');
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText;
    }
  };

  const apiKeyRef = doc(db, "users", userId, "apiKeys", service);
  const apiKeyDoc = await getDoc(apiKeyRef);

  if (!apiKeyDoc.exists()) return null;

  const keyData = apiKeyDoc.data();

  // Update last used timestamp
  await updateDoc(apiKeyRef, {
    lastUsed: serverTimestamp()
  });

  return decrypt(keyData.key);
};

export const removeUserApiKey = async (service) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const apiKeyRef = doc(db, "users", userId, "apiKeys", service);
  await deleteDoc(apiKeyRef);
  return true;
};

export const getUserApiServices = async () => {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const apiKeysCollection = collection(db, "users", userId, "apiKeys");
    const snapshot = await getDocs(apiKeysCollection);

    return snapshot.docs.map(doc => ({
      service: doc.id,
      ...doc.data()
    })).filter(item => item.service !== '_metadata'); // Exclude metadata doc
  } catch (error) {
    console.error('Error getting user API services:', error);
    return [];
  }
};

// === COMMENTS ===
export const getCommunityPostById = async (postId) => {
  return await withRetry(async () => {
    const postDoc = await getDoc(doc(db, "communityPosts", postId));
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }
    return { id: postDoc.id, ...postDoc.data() };
  });
};

export const getPostComments = async (postId) => {
  return await withRetry(async () => {
    // First, get all comments for this post
    const commentsQuery = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );

    const snapshot = await getDocs(commentsQuery);
    const allComments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter and organize comments in JavaScript to avoid composite index
    const topLevelComments = allComments
      .filter(comment => !comment.parentId || comment.parentId === null)
      .sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime; // desc order
      });

    // Add replies to each top-level comment
    topLevelComments.forEach(comment => {
      comment.replies = allComments
        .filter(reply => reply.parentId === comment.id)
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return aTime - bTime; // asc order for replies
        });
    });

    return topLevelComments;
  });
};

// Helper function to get actual comment count for a post
export const getPostCommentCount = async (postId) => {
  try {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting post comment count:', error);
    return 0;
  }
};

// Function to sync comment counts for all posts
export const syncPostCommentCounts = async () => {
  try {
    const postsQuery = query(collection(db, "communityPosts"));
    const postsSnapshot = await getDocs(postsQuery);

    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id;
      const actualCommentCount = await getPostCommentCount(postId);

      await updateDoc(postDoc.ref, {
        comments: actualCommentCount
      });
    }

    console.log('Comment counts synced successfully');
  } catch (error) {
    console.error('Error syncing comment counts:', error);
  }
};

export const createComment = async (commentData) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const userProfile = await getUserProfile();

  const comment = {
    ...commentData,
    authorId: userId,
    author: {
      uid: userId,
      displayName: userProfile?.displayName || 'Anonymous',
      avatar: userProfile?.photoURL || '👤',
      isVerified: userProfile?.isVerified || false,
      isModerator: userProfile?.isModerator || false,
      reputation: userProfile?.reputation || 0
    },
    likes: 0,
    dislikes: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  return await withRetry(async () => {
    const docRef = await addDoc(collection(db, "comments"), comment);

    // Update post comment count
    if (commentData.postId) {
      try {
        const postRef = doc(db, "communityPosts", commentData.postId);
        const postDoc = await getDoc(postRef);
        if (postDoc.exists()) {
          const currentComments = postDoc.data().comments || 0;
          await updateDoc(postRef, {
            comments: currentComments + 1
          });
        }
      } catch (error) {
        console.warn('Failed to update post comment count:', error);
      }
    }

    // Send notification to post author if comment is on a post (not a reply)
    if (commentData.postId && !commentData.parentId) {
      try {
        // Get the post to find the author
        const post = await getCommunityPostById(commentData.postId);

        // Only send notification if someone else commented (not the post author)
        if (post && post.authorId && post.authorId !== userId) {
          await createNotification({
            userId: post.authorId,
            type: 'comment',
            title: 'New Comment',
            message: `${userProfile?.displayName || 'Someone'} commented on your post: "${post.title}"`,
            data: {
              postId: commentData.postId,
              commentId: docRef.id,
              postTitle: post.title,
              commenterName: userProfile?.displayName || 'Anonymous'
            }
          });
        }
      } catch (error) {
        console.warn('Failed to send comment notification:', error);
        // Don't fail the comment creation if notification fails
      }
    }

    // Send notification for replies to comment authors
    if (commentData.parentId) {
      try {
        // Get the parent comment to find the author
        const parentCommentQuery = query(
          collection(db, "comments"),
          where("id", "==", commentData.parentId)
        );

        const parentSnapshot = await getDocs(parentCommentQuery);
        if (!parentSnapshot.empty) {
          const parentComment = parentSnapshot.docs[0].data();

          // Only send notification if someone else replied (not the comment author)
          if (parentComment.authorId && parentComment.authorId !== userId) {
            await createNotification({
              userId: parentComment.authorId,
              type: 'reply',
              title: 'New Reply',
              message: `${userProfile?.displayName || 'Someone'} replied to your comment`,
              data: {
                postId: commentData.postId,
                commentId: docRef.id,
                parentCommentId: commentData.parentId,
                replierName: userProfile?.displayName || 'Anonymous'
              }
            });
          }
        }
      } catch (error) {
        console.warn('Failed to send reply notification:', error);
        // Don't fail the comment creation if notification fails
      }
    }

    return docRef.id;
  });
};

export const likeComment = async (commentId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  return await withRetry(async () => {
    const commentRef = doc(db, "comments", commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const currentLikes = commentDoc.data().likes || 0;
    await updateDoc(commentRef, {
      likes: currentLikes + 1,
      updatedAt: serverTimestamp()
    });
  });
};

export const dislikeComment = async (commentId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  return await withRetry(async () => {
    const commentRef = doc(db, "comments", commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const currentDislikes = commentDoc.data().dislikes || 0;
    await updateDoc(commentRef, {
      dislikes: currentDislikes + 1,
      updatedAt: serverTimestamp()
    });
  });
};

// === USER REACTIONS TRACKING ===
export const getUserPostReaction = async (postId) => {
  const userId = getUserId();
  if (!userId) return null;

  return await withRetry(async () => {
    const reactionQuery = query(
      collection(db, "user_reactions"),
      where("userId", "==", userId),
      where("postId", "==", postId)
    );

    const snapshot = await getDocs(reactionQuery);
    if (!snapshot.empty) {
      return snapshot.docs[0].data().reactionType;
    }
    return null;
  });
};

export const getUserCommentReaction = async (commentId) => {
  const userId = getUserId();
  if (!userId) return null;

  return await withRetry(async () => {
    const reactionQuery = query(
      collection(db, "user_reactions"),
      where("userId", "==", userId),
      where("commentId", "==", commentId)
    );

    const snapshot = await getDocs(reactionQuery);
    if (!snapshot.empty) {
      return snapshot.docs[0].data().reactionType;
    }
    return null;
  });
};

export const setUserReaction = async (targetId, targetType, reactionType) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  return await withRetry(async () => {
    const reactionQuery = query(
      collection(db, "user_reactions"),
      where("userId", "==", userId),
      where(targetType === 'post' ? "postId" : "commentId", "==", targetId)
    );

    const snapshot = await getDocs(reactionQuery);

    if (!snapshot.empty) {
      // Update existing reaction
      const existingDoc = snapshot.docs[0];
      if (existingDoc.data().reactionType === reactionType) {
        // Remove reaction if clicking the same button
        await deleteDoc(existingDoc.ref);
        return null;
      } else {
        // Update to new reaction
        await updateDoc(existingDoc.ref, {
          reactionType,
          updatedAt: serverTimestamp()
        });
        return reactionType;
      }
    } else {
      // Create new reaction
      const reactionData = {
        userId,
        reactionType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (targetType === 'post') {
        reactionData.postId = targetId;
      } else {
        reactionData.commentId = targetId;
      }

      await addDoc(collection(db, "user_reactions"), reactionData);
      return reactionType;
    }
  });
};

export const getUserPostReactions = async (postIds) => {
  const userId = getUserId();
  if (!userId || !postIds.length) return {};

  return await withRetry(async () => {
    const reactionQuery = query(
      collection(db, "user_reactions"),
      where("userId", "==", userId),
      where("postId", "in", postIds.slice(0, 10)) // Firestore 'in' limit is 10
    );

    const snapshot = await getDocs(reactionQuery);
    const reactions = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      reactions[data.postId] = data.reactionType;
    });

    return reactions;
  });
};

// === NOTE SHARING ===
export const shareNoteWithFriend = async (noteId, friendId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const noteRef = doc(db, "users", userId, "notes", noteId);
  const noteDoc = await getDoc(noteRef);

  if (!noteDoc.exists()) {
    throw new Error('Note not found');
  }

  const noteData = noteDoc.data();
  const currentCollaborators = noteData.collaborators || [];

  // Check if friend is already a collaborator
  if (currentCollaborators.some(collab => collab.uid === friendId)) {
    throw new Error('User is already a collaborator');
  }

  // Get friend profile
  const friendProfile = await getUserProfile(friendId);
  if (!friendProfile) {
    throw new Error('Friend not found');
  }

  // Add friend as collaborator
  const newCollaborator = {
    uid: friendId,
    displayName: friendProfile.displayName,
    email: friendProfile.email,
    avatar: friendProfile.photoURL || '👤',
    addedAt: new Date().toISOString(),
    permissions: 'edit' // edit or view
  };

  await updateDoc(noteRef, {
    shared: true,
    collaborators: [...currentCollaborators, newCollaborator],
    updatedAt: serverTimestamp()
  });

  // Create shared note reference for the friend
  const sharedNoteData = {
    originalNoteId: noteId,
    originalOwnerId: userId,
    sharedAt: serverTimestamp(),
    permissions: 'edit'
  };

  await setDoc(doc(db, "users", friendId, "sharedNotes", noteId), sharedNoteData);

  // Send notification to friend
  await createNotification({
    userId: friendId,
    type: 'note_shared',
    title: 'Note Shared With You',
    message: `${noteData.title || 'Untitled'} has been shared with you`,
    data: {
      noteId,
      ownerId: userId,
      noteTitle: noteData.title,
      ownerName: (await getUserProfile(userId))?.displayName
    }
  });
};

export const removeCollaborator = async (noteId, collaboratorId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const noteRef = doc(db, "users", userId, "notes", noteId);
  const noteDoc = await getDoc(noteRef);

  if (!noteDoc.exists()) {
    throw new Error('Note not found');
  }

  const noteData = noteDoc.data();
  const collaborators = noteData.collaborators || [];

  // Remove collaborator
  const updatedCollaborators = collaborators.filter(collab => collab.uid !== collaboratorId);

  await updateDoc(noteRef, {
    collaborators: updatedCollaborators,
    shared: updatedCollaborators.length > 0,
    updatedAt: serverTimestamp()
  });

  // Remove shared note reference
  await deleteDoc(doc(db, "users", collaboratorId, "sharedNotes", noteId));
};

export const getSharedNotes = async () => {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const q = query(collection(db, "users", userId, "sharedNotes"));
    const snapshot = await getDocs(q);

    const sharedNotes = [];
    for (const docSnap of snapshot.docs) {
      const sharedData = docSnap.data();

      // Get the actual note data from the original owner
      try {
        const noteDoc = await getDoc(doc(db, "users", sharedData.originalOwnerId, "notes", sharedData.originalNoteId));
        if (noteDoc.exists()) {
          const noteData = noteDoc.data();
          sharedNotes.push({
            id: docSnap.id,
            ...noteData,
            originalOwnerId: sharedData.originalOwnerId,
            sharedAt: sharedData.sharedAt,
            permissions: sharedData.permissions,
            isSharedWithMe: true
          });
        }
      } catch (error) {
        console.warn(`Failed to load shared note ${sharedData.originalNoteId}:`, error);
      }
    }

    return sharedNotes.sort((a, b) => {
      const aTime = a.sharedAt?.toDate?.() || new Date(0);
      const bTime = b.sharedAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
  } catch (error) {
    console.error("Error getting shared notes:", error);
    return [];
  }
};

export const getSharedNote = async (noteId, ownerId = null) => {
  const userId = getUserId();
  if (!userId) return null;

  // If ownerId is provided, this is a shared note
  if (ownerId) {
    try {
      // Check if user has access to this shared note
      const sharedNoteDoc = await getDoc(doc(db, "users", userId, "sharedNotes", noteId));
      if (!sharedNoteDoc.exists()) {
        throw new Error('Access denied');
      }

      // Get the actual note from the owner
      const noteDoc = await getDoc(doc(db, "users", ownerId, "notes", noteId));
      if (noteDoc.exists()) {
        const sharedData = sharedNoteDoc.data();
        return {
          id: noteDoc.id,
          ...noteDoc.data(),
          originalOwnerId: ownerId,
          permissions: sharedData.permissions,
          isSharedWithMe: true
        };
      }
    } catch (error) {
      console.error("Error getting shared note:", error);
    }
  }

  return null;
};

export const updateSharedNote = async (noteId, updates, ownerId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Check if user has edit permissions
  const sharedNoteDoc = await getDoc(doc(db, "users", userId, "sharedNotes", noteId));
  if (!sharedNoteDoc.exists()) {
    throw new Error('Access denied');
  }

  const sharedData = sharedNoteDoc.data();
  if (sharedData.permissions !== 'edit') {
    throw new Error('Edit permission denied');
  }

  // Update the original note
  const noteRef = doc(db, "users", ownerId, "notes", noteId);
  await updateDoc(noteRef, {
    ...updates,
    updatedAt: serverTimestamp(),
    lastEditBy: {
      uid: userId,
      displayName: (await getUserProfile(userId))?.displayName || 'Anonymous',
      editedAt: new Date().toISOString()
    }
  });
};

export const subscribeToSharedNote = (noteId, ownerId, callback) => {
  try {
    const noteRef = doc(db, "users", ownerId, "notes", noteId);
    return onSnapshot(noteRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Error in shared note subscription:", error);
      callback(null);
    });
  } catch (error) {
    console.error("Error setting up shared note subscription:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

export const getUserCommentReactions = async (commentIds) => {
  const userId = getUserId();
  if (!userId || !commentIds.length) return {};

  return await withRetry(async () => {
    const reactionQuery = query(
      collection(db, "user_reactions"),
      where("userId", "==", userId),
      where("commentId", "in", commentIds.slice(0, 10)) // Firestore 'in' limit is 10
    );

    const snapshot = await getDocs(reactionQuery);
    const reactions = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      reactions[data.commentId] = data.reactionType;
    });

    return reactions;
  });
};

// === SAVED POSTS ===
export const savePost = async (postId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  return await withRetry(async () => {
    const savedPostData = {
      userId,
      postId,
      savedAt: serverTimestamp()
    };

    await addDoc(collection(db, "saved_posts"), savedPostData);
  });
};

export const unsavePost = async (postId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  return await withRetry(async () => {
    const savedPostsQuery = query(
      collection(db, "saved_posts"),
      where("userId", "==", userId),
      where("postId", "==", postId)
    );

    const snapshot = await getDocs(savedPostsQuery);

    snapshot.docs.forEach(async (docToDelete) => {
      await deleteDoc(doc(db, "saved_posts", docToDelete.id));
    });
  });
};

export const isPostSaved = async (postId) => {
  const userId = getUserId();
  if (!userId) return false;

  return await withRetry(async () => {
    const savedPostsQuery = query(
      collection(db, "saved_posts"),
      where("userId", "==", userId),
      where("postId", "==", postId)
    );

    const snapshot = await getDocs(savedPostsQuery);
    return !snapshot.empty;
  });
};

export const getSavedPosts = async () => {
  const userId = getUserId();
  if (!userId) return [];

  return await withRetry(async () => {
    const savedPostsQuery = query(
      collection(db, "saved_posts"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(savedPostsQuery);
    const savedPostsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by savedAt in JavaScript to avoid composite index
    const sortedSavedPosts = savedPostsData.sort((a, b) => {
      const aTime = a.savedAt?.toDate?.() || new Date(0);
      const bTime = b.savedAt?.toDate?.() || new Date(0);
      return bTime - aTime; // desc order
    });

    const savedPostIds = sortedSavedPosts.map(doc => doc.postId);

    // Get the actual post data for each saved post
    const savedPosts = [];
    for (const postId of savedPostIds) {
      try {
        const post = await getCommunityPostById(postId);
        savedPosts.push(post);
      } catch (error) {
        console.warn(`Could not load saved post ${postId}:`, error);
      }
    }

    return savedPosts;
  });
};
