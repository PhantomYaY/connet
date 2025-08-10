import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useOutletContext, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import {
  getRecentNotes,
  getPinnedNotes,
  getCommunityPosts,
  getTrendingPosts,
  getUserProfile,
  createUserProfile,
  togglePinNote,
  ensureRootFolder,
  migrateLegacyNotes,
  getUserFlashCards
} from "../lib/firestoreService";
import { useToast } from "../components/ui/use-toast";
import ModernLoader from "../components/ModernLoader";
import NotificationCenter, { useNotifications } from "../components/NotificationCenter";
import MessagingCenter from "../components/MessagingCenter";
import FriendsCenter from "../components/FriendsCenter";


// Styled wrapper
const StyledWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  .glass-card {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 1.5rem;
    padding: 1.75rem;
    border: 1px solid rgba(255, 255, 255, 0.25);
    transition: box-shadow 0.3s ease;

    .dark & {
      background: rgba(30, 41, 59, 0.25);
      border: 1px solid rgba(148, 163, 184, 0.15);
    }
  }

  @keyframes pulse-slow {
    0%, 100% {
      transform: scale(1);
      opacity: 0.08;
    }
    50% {
      transform: scale(1.03);
      opacity: 0.16;
    }
  }

  .animate-pulse-slow {
    animation: pulse-slow 20s ease-in-out infinite;
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .hide-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .clickable {
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
  }

  .pin-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    &.pinned {
      color: #f59e0b;
    }

    &.unpinned {
      color: #9ca3af;
    }
  }

  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const GlassCard = ({ title, icon, children, className = "" }) => (
  <div className={`glass-card shadow-md hover:shadow-lg transition-all duration-300 space-y-4 ${className}`}>
    <h3 className="text-xl font-semibold text-zinc-800 dark:text-white flex items-center gap-2 mb-1">
      {icon && <span>{icon}</span>}
      {title}
    </h3>
    <div className="text-sm text-zinc-600 dark:text-zinc-300">{children}</div>
  </div>
);

export default function DashboardPage() {
  const { sidebarOpen } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unreadCount, refreshCount } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [pinnedNotes, setPinnedNotes] = useState([]);
  const [communityFeed, setCommunityFeed] = useState([]);
  const [flashCardSets, setFlashCardSets] = useState([]);

  // Social features state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        try {
          // Ensure root folder exists first
          await ensureRootFolder();

          // Migrate any legacy notes to root folder
          const migratedCount = await migrateLegacyNotes();
          if (migratedCount > 0) {
            toast({
              title: "Migration Complete",
              description: `${migratedCount} notes moved to your root folder`,
            });
          }

          // Get or create user profile
          let userProfile = await getUserProfile();
          if (!userProfile) {
            userProfile = await createUserProfile({
              email: authUser.email,
              displayName: authUser.displayName,
              photoURL: authUser.photoURL
            });
          }
          setUser(userProfile);

          // Load dashboard data
          await loadDashboardData();
        } catch (error) {
          console.error('Error loading dashboard:', error);

          const isOfflineError = error.message.includes('offline') ||
                                error.message.includes('unavailable') ||
                                error.code === 'unavailable';

          toast({
            title: isOfflineError ? "Offline Mode" : "Error",
            description: isOfflineError
              ? "You're currently offline. Some data may not be up to date until you reconnect."
              : error.message || "Failed to load dashboard data",
            variant: isOfflineError ? "default" : "destructive",
          });
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, toast]);

  const loadDashboardData = async () => {
    try {
      const [recent, pinned, trendingPosts, flashCards] = await Promise.all([
        getRecentNotes(5),
        getPinnedNotes(),
        getTrendingPosts(5), // Get top 5 trending posts
        getUserFlashCards()
      ]);

      setRecentNotes(recent);
      setPinnedNotes(pinned);
      setCommunityFeed(trendingPosts); // Use trending posts instead
      setFlashCardSets(flashCards.slice(0, 5)); // Get latest 5 flash card sets
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleTogglePin = async (noteId, currentPinned) => {
    try {
      await togglePinNote(noteId, !currentPinned);
      await loadDashboardData(); // Refresh data
      toast({
        title: "Success",
        description: `Note ${!currentPinned ? 'added to favorites' : 'removed from favorites'}`,
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleNoteClick = (noteId) => {
    navigate(`/page?id=${noteId}`);
  };

  const handleCreateNote = () => {
    navigate('/page');
  };

  if (loading) {
    return <ModernLoader />;
  }

  return (
    <StyledWrapper className="bg-slate-100 dark:bg-slate-900">
      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]
        bg-[linear-gradient(to_right,theme(colors.slate.300)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.300)_1px,transparent_1px)]
        dark:bg-[linear-gradient(to_right,theme(colors.slate.800)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800)_1px,transparent_1px)]
        bg-[size:40px_40px]"
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-cyan-400/10 via-blue-500/0 to-teal-400/10 animate-pulse-slow" />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar relative z-10">
        <main
          className={`pt-24 pr-6 w-full max-w-6xl mx-auto space-y-10 transition-all duration-300 ${
            sidebarOpen ? "pl-[260px]" : "pl-16"
          }`}
        >
          {/* Welcome */}
          <section className="text-center">
            <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white">
              Welcome back, {user?.displayName || 'User'}!
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Here's your Connected workspace overview.
            </p>
          </section>

          {/* Overview Stats */}
          <GlassCard title="Quick Overview" icon="📊">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 p-4 shadow-inner">
                <h4 className="text-3xl font-bold text-blue-600">{recentNotes.length}</h4>
                <p className="text-sm mt-1">Recent Notes</p>
              </div>
              <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 p-4 shadow-inner">
                <h4 className="text-3xl font-bold text-yellow-600">{pinnedNotes.length}</h4>
                <p className="text-sm mt-1">Favorites</p>
              </div>
              <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 p-4 shadow-inner">
                <h4 className="text-3xl font-bold text-orange-600">{communityFeed.length}</h4>
                <p className="text-sm mt-1">Trending Posts</p>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard title="Quick Actions" icon="⚡">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              <button
                onClick={handleCreateNote}
                className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-center hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 group"
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="font-semibold text-blue-800 dark:text-blue-300">Create Note</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Start writing</div>
              </button>


              <button
                onClick={() => navigate('/communities')}
                className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-center hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="font-semibold text-blue-800 dark:text-blue-300">Communities</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Join discussions</div>
              </button>

              <button className="p-4 bg-teal-100 dark:bg-teal-900/30 rounded-xl text-center hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-all duration-200">
                <div className="text-2xl mb-2">🖼️</div>
                <div className="font-semibold text-teal-800 dark:text-teal-300">Whiteboard</div>
                <div className="text-xs text-teal-600 dark:text-teal-400">Visual notes</div>
              </button>
            </div>
          </GlassCard>

          {/* Recent + Pinned + Flash Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard title="Recent Notes" icon="📄">
              {recentNotes.length > 0 ? (
                <ul className="space-y-3">
                  {recentNotes.map((note) => (
                    <li
                      key={note.id}
                      className="p-3 bg-white/40 dark:bg-slate-800/40 rounded-xl clickable flex justify-between items-center"
                      onClick={() => handleNoteClick(note.id)}
                    >
                      <div>
                        <div className="font-semibold">{note.title}</div>
                        <div className="text-xs text-zinc-500">
                          {formatDate(note.updatedAt)}
                          {note.folderId && <span> · Folder</span>}
                        </div>
                      </div>
                      <button
                        className={`pin-button ${note.pinned ? 'pinned' : 'unpinned'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(note.id, note.pinned);
                        }}
                        title={note.pinned ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {note.pinned ? '⭐' : '☆'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-zinc-500">No notes yet. Create your first note!</p>
                  <button
                    onClick={handleCreateNote}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Note
                  </button>
                </div>
              )}
            </GlassCard>

            <GlassCard title="Favorites" icon="⭐">
              {pinnedNotes.length > 0 ? (
                <ul className="space-y-3">
                  {pinnedNotes.map((note) => (
                    <li
                      key={note.id}
                      className="flex items-center justify-between p-3 bg-white/40 dark:bg-slate-800/40 rounded-xl clickable"
                      onClick={() => handleNoteClick(note.id)}
                    >
                      <span className="font-medium">{note.title}</span>
                      <div className="flex items-center gap-2">
                        {note.tags && note.tags.length > 0 && (
                          <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            {note.tags[0]}
                          </span>
                        )}
                        <button
                          className="pin-button pinned"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(note.id, true);
                          }}
                          title="Remove from favorites"
                        >
                          ⭐
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⭐</div>
                  <p className="text-zinc-500">No favorites yet.</p>
                </div>
              )}
            </GlassCard>

            <GlassCard title="Recent Flash Cards" icon="🧠">
              {flashCardSets.length > 0 ? (
                <ul className="space-y-3">
                  {flashCardSets.map((flashCard) => (
                    <li
                      key={flashCard.id}
                      className="p-3 bg-white/40 dark:bg-slate-800/40 rounded-xl clickable flex justify-between items-center"
                      onClick={() => navigate('/flashcards', { state: { flashCardId: flashCard.id } })}
                    >
                      <div>
                        <div className="font-semibold">{flashCard.name}</div>
                        <div className="text-xs text-zinc-500">
                          {flashCard.cards ? `${flashCard.cards.length} cards` : 'No cards'} · {formatDate(flashCard.createdAt)}
                        </div>
                      </div>
                      <div className="text-purple-600 dark:text-purple-400">
                        🧠
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🧠</div>
                  <p className="text-zinc-500">No flash cards yet. Create some from your notes!</p>
                  <button
                    onClick={() => navigate('/flashcards')}
                    className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Explore Flash Cards
                  </button>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Community Feed - Trending Posts */}
          <GlassCard title="Trending in Communities" icon="🔥">
            {communityFeed.length > 0 ? (
              <ul className="space-y-4">
                {communityFeed.map((post) => (
                  <li
                    key={post.id}
                    className="p-4 bg-white/40 dark:bg-slate-800/40 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
                    onClick={() => navigate('/communities')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg flex-shrink-0">{post.author?.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{post.author?.displayName}</span>
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                            {post.community}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm mb-1 line-clamp-1">{post.title}</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>👍 {post.likes || 0}</span>
                          <span>💬 {post.comments || 0}</span>
                          <span>👀 {post.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🔥</div>
                <p className="text-zinc-500">No trending posts yet. Be the first to create one!</p>
                <button
                  onClick={() => navigate('/communities')}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Explore Communities
                </button>
              </div>
            )}
          </GlassCard>
        </main>
      </div>

      {/* Social Feature Modals */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <MessagingCenter
        isOpen={showMessaging}
        onClose={() => setShowMessaging(false)}
      />

      <FriendsCenter
        isOpen={showFriends}
        onClose={() => setShowFriends(false)}
        onStartChat={(friend) => {
          setShowFriends(false);
          setShowMessaging(true);
        }}
      />
    </StyledWrapper>
  );
}
