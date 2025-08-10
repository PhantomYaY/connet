import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "./firebase";
import { getUserProfile } from "./firestoreService";

export const searchUsers = async (searchQuery, excludeCurrentUser = true) => {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }

  try {
    const searchTerm = searchQuery.toLowerCase().trim();
    const users = [];

    // Search by email (exact match and prefix match)
    const emailQueries = [
      // Exact email match
      query(
        collection(db, "users"),
        where("email", "==", searchTerm),
        limit(5)
      ),
      // Email prefix match (for domains like @gmail.com)
      query(
        collection(db, "users"),
        where("email", ">=", searchTerm),
        where("email", "<=", searchTerm + '\uf8ff'),
        limit(5)
      )
    ];

    // Search by displayName (prefix match)
    const displayNameQuery = query(
      collection(db, "users"),
      where("displayName", ">=", searchTerm),
      where("displayName", "<=", searchTerm + '\uf8ff'),
      limit(5)
    );

    // Execute all queries in parallel
    const [emailExact, emailPrefix, displayNameResults] = await Promise.all([
      getDocs(emailQueries[0]),
      getDocs(emailQueries[1]),
      getDocs(displayNameQuery)
    ]);

    // Collect results from all queries
    const allResults = [];
    
    emailExact.docs.forEach(doc => {
      allResults.push({ id: doc.id, ...doc.data() });
    });
    
    emailPrefix.docs.forEach(doc => {
      allResults.push({ id: doc.id, ...doc.data() });
    });
    
    displayNameResults.docs.forEach(doc => {
      allResults.push({ id: doc.id, ...doc.data() });
    });

    // Remove duplicates based on user ID
    const uniqueUsers = allResults.reduce((acc, user) => {
      if (!acc.find(u => u.id === user.id)) {
        acc.push(user);
      }
      return acc;
    }, []);

    // Filter out current user if requested
    let filteredUsers = uniqueUsers;
    if (excludeCurrentUser) {
      const currentUser = await getUserProfile();
      if (currentUser) {
        filteredUsers = uniqueUsers.filter(user => user.id !== currentUser.uid);
      }
    }

    // Sort by relevance (exact matches first, then alphabetical)
    const sortedUsers = filteredUsers.sort((a, b) => {
      const aEmail = a.email?.toLowerCase() || '';
      const aName = a.displayName?.toLowerCase() || '';
      const bEmail = b.email?.toLowerCase() || '';
      const bName = b.displayName?.toLowerCase() || '';

      // Exact email match gets highest priority
      if (aEmail === searchTerm && bEmail !== searchTerm) return -1;
      if (bEmail === searchTerm && aEmail !== searchTerm) return 1;

      // Exact name match gets second priority
      if (aName === searchTerm && bName !== searchTerm) return -1;
      if (bName === searchTerm && aName !== searchTerm) return 1;

      // Email starts with search term gets third priority
      if (aEmail.startsWith(searchTerm) && !bEmail.startsWith(searchTerm)) return -1;
      if (bEmail.startsWith(searchTerm) && !aEmail.startsWith(searchTerm)) return 1;

      // Name starts with search term gets fourth priority
      if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
      if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;

      // Alphabetical by display name
      return aName.localeCompare(bName);
    });

    return sortedUsers.slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

export const searchUsersByEmail = async (email) => {
  if (!email || !email.includes('@')) {
    return [];
  }

  try {
    const q = query(
      collection(db, "users"),
      where("email", "==", email.toLowerCase().trim()),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error searching users by email:', error);
    return [];
  }
};

export const searchUsersByUsername = async (username) => {
  if (!username || username.trim().length < 2) {
    return [];
  }

  try {
    const searchTerm = username.toLowerCase().trim();
    
    const q = query(
      collection(db, "users"),
      where("displayName", ">=", searchTerm),
      where("displayName", "<=", searchTerm + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error searching users by username:', error);
    return [];
  }
};

// Check if users are already friends
export const filterAlreadyFriends = async (users, currentUserFriends = []) => {
  const friendUids = currentUserFriends.map(friend => friend.uid || friend.id);
  return users.filter(user => !friendUids.includes(user.id));
};

// Check if friend request already exists between users
export const filterExistingRequests = async (users, existingRequests = []) => {
  const requestUserIds = existingRequests.map(req => req.from);
  return users.filter(user => !requestUserIds.includes(user.id));
};
