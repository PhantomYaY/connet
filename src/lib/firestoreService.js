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

  return await withNetworkCheck(async () => {
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

  return await withNetworkCheck(async () => {
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

  return await withNetworkCheck(async () => {
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

export const createCommunity = async (name, description) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  
  const communityData = {
    name: name.trim(),
    description: description.trim(),
    creatorId: userId,
    members: [userId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isPublic: true
  };
  
  return await addDoc(collection(db, "communities"), communityData);
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
