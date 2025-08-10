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
  withRetry
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

// === COMMUNITIES ===
export const getCommunities = async () => {
  const q = query(collection(db, "communities"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};



export const joinCommunity = async (communityId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  
  const community = await getDoc(doc(db, "communities", communityId));
  if (!community.exists()) return;
  
  const data = community.data();
  const members = data.members || [];
  
  if (!members.includes(userId)) {
    await updateDoc(doc(db, "communities", communityId), {
      members: [...members, userId],
      updatedAt: serverTimestamp()
    });
  }
};

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
    const q = query(collection(db, "communities"), orderBy("memberCount", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// === COMMUNITY POSTS ===
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
    console.error("Error getting community posts:", error);
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

// === FRIENDS SYSTEM ===
export const sendFriendRequest = async (targetUserId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const friendRequest = {
    from: userId,
    to: targetUserId,
    status: 'pending',
    createdAt: serverTimestamp()
  };

  await addDoc(collection(db, "friendRequests"), friendRequest);

  // Create notification for recipient
  await createNotification({
    userId: targetUserId,
    type: 'friend_request',
    title: 'New Friend Request',
    message: 'Someone sent you a friend request',
    data: { fromUserId: userId }
  });
};

export const acceptFriendRequest = async (requestId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const requestRef = doc(db, "friendRequests", requestId);
  const requestDoc = await getDoc(requestRef);

  if (requestDoc.exists()) {
    const requestData = requestDoc.data();

    // Update request status
    await updateDoc(requestRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp()
    });

    // Create friendship records for both users
    const friendship = {
      users: [requestData.from, requestData.to].sort(),
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "friendships"), friendship);

    // Create notification for requester
    await createNotification({
      userId: requestData.from,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      message: 'Your friend request was accepted!',
      data: { userId: requestData.to }
    });
  }
};

export const rejectFriendRequest = async (requestId) => {
  const requestRef = doc(db, "friendRequests", requestId);
  await updateDoc(requestRef, {
    status: 'rejected',
    rejectedAt: serverTimestamp()
  });
};

export const getFriends = async () => {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const q = query(
      collection(db, "friendships"),
      where("users", "array-contains", userId)
    );

    const snapshot = await getDocs(q);
    const friendships = snapshot.docs.map(doc => doc.data());

    // Get friend user IDs
    const friendIds = friendships.map(friendship =>
      friendship.users.find(id => id !== userId)
    );

    // Get friend profiles
    const friends = [];
    for (const friendId of friendIds) {
      const friendProfile = await getUserProfile(friendId);
      if (friendProfile) {
        friends.push(friendProfile);
      }
    }

    return friends;
  } catch (error) {
    console.error("Error getting friends:", error);
    return [];
  }
};

export const getFriendRequests = async () => {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const q = query(
      collection(db, "friendRequests"),
      where("to", "==", userId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const requests = [];

    for (const docSnap of snapshot.docs) {
      const requestData = docSnap.data();
      const fromUser = await getUserProfile(requestData.from);
      requests.push({
        id: docSnap.id,
        ...requestData,
        fromUser
      });
    }

    return requests;
  } catch (error) {
    console.error("Error getting friend requests:", error);
    return [];
  }
};

// === MESSAGING SYSTEM ===
export const sendMessage = async (conversationId, content, messageType = 'text') => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const userProfile = await getUserProfile();

  const message = {
    conversationId,
    content,
    type: messageType,
    senderId: userId,
    sender: {
      uid: userId,
      displayName: userProfile?.displayName || 'Anonymous',
      photoURL: userProfile?.photoURL || null,
      avatar: userProfile?.avatar || '👤'
    },
    createdAt: serverTimestamp(),
    read: false
  };

  await addDoc(collection(db, "messages"), message);

  // Update conversation last message
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: content,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return message;
};

export const getConversations = async () => {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const conversations = [];

    for (const docSnap of snapshot.docs) {
      const conversationData = docSnap.data();
      const otherUserId = conversationData.participants.find(id => id !== userId);
      const otherUser = await getUserProfile(otherUserId);

      conversations.push({
        id: docSnap.id,
        ...conversationData,
        otherUser
      });
    }

    return conversations;
  } catch (error) {
    console.error("Error getting conversations:", error);
    return [];
  }
};

export const getMessages = async (conversationId, limit = 50) => {
  try {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "desc"),
      // limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
  } catch (error) {
    console.error("Error getting messages:", error);
    return [];
  }
};

export const createConversation = async (participantId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  // Check if conversation already exists
  const q = query(
    collection(db, "conversations"),
    where("participants", "==", [userId, participantId].sort())
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  // Create new conversation
  const conversation = {
    participants: [userId, participantId].sort(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: '',
    lastMessageAt: null
  };

  const docRef = await addDoc(collection(db, "conversations"), conversation);
  return docRef.id;
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
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
      // limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
