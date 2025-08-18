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
import OptimizedModernLoader from "../components/OptimizedModernLoader";
import NotificationCenter from "../components/NotificationCenter";


// Styled wrapper
const StyledWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 1.5rem;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
      
      &::before {
        opacity: 1;
      }
    }

    .dark & {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(148, 163, 184, 0.1);
      
      &:hover {
        border-color: rgba(96, 165, 250, 0.4);
      }
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

const GlassCard = ({ title, icon, children, className = "", highlight = false }) => (
  <div className={`glass-card shadow-lg space-y-6 ${highlight ? 'ring-2 ring-blue-500/20' : ''} ${className}`}>
    <div className="relative z-10">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">{title}</span>
      </h3>
      <div className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">{children}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { sidebarOpen } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [pinnedNotes, setPinnedNotes] = useState([]);
  const [communityFeed, setCommunityFeed] = useState([]);
  const [whiteboards, setWhiteboards] = useState([]);
  const [flashCardSets, setFlashCardSets] = useState([]);

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Handle custom events from navbar and sidebar
  useEffect(() => {
    const handleOpenNotifications = () => setShowNotifications(true);
    const handleOpenSocial = () => {
      // Social features removed
    };

    window.addEventListener('openNotifications', handleOpenNotifications);
    window.addEventListener('openSocial', handleOpenSocial);

    return () => {
      window.removeEventListener('openNotifications', handleOpenNotifications);
      window.removeEventListener('openSocial', handleOpenSocial);
    };
  }, []);

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
      setWhiteboards([]); // No whiteboards yet - separate from notes
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
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }).format(date);
    }
  };

  const handleNoteClick = (noteId) => {
    navigate(`/page?id=${noteId}`);
  };

  const handleCreateNote = () => {
    navigate('/page');
  };

  if (loading) {
    return <OptimizedModernLoader />;
  }

  return (
    <StyledWrapper className="bg-slate-50 dark:bg-slate-900">
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
          className={`pt-24 pr-4 md:pr-6 pb-16 w-full transition-all duration-300 space-y-6 md:space-y-8 ${
            sidebarOpen ? "pl-4 md:pl-[280px] max-w-5xl" : "pl-4 md:pl-16 max-w-6xl"
          } mx-auto`}
        >
          {/* Welcome Hero */}
          <section className="text-center space-y-4 md:space-y-6 px-2">
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-600 dark:from-white dark:via-blue-100 dark:to-cyan-100 bg-clip-text text-transparent leading-tight">
                Welcome back, {user?.displayName || 'User'}!
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
                Your personalized learning dashboard is ready. Continue your CS journey with powerful tools and insights.
              </p>
            </div>
          </section>

          {/* Overview Stats */}
          <GlassCard title="Your Progress" icon="📊">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="group relative bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-6 text-center border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <h4 className="text-4xl font-bold text-blue-400 mb-2">{recentNotes.length}</h4>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">Recent Notes</p>
                  <div className="mt-2 w-12 h-1 bg-blue-400 rounded-full mx-auto"></div>
                </div>
              </div>
              <div className="group relative bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-2xl p-6 text-center border border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <h4 className="text-4xl font-bold text-yellow-400 mb-2">{pinnedNotes.length}</h4>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">Favorites</p>
                  <div className="mt-2 w-12 h-1 bg-yellow-400 rounded-full mx-auto"></div>
                </div>
              </div>
              <div className="group relative bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl p-6 text-center border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <h4 className="text-4xl font-bold text-purple-400 mb-2">{whiteboards.length}</h4>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">Whiteboards</p>
                  <div className="mt-2 w-12 h-1 bg-purple-400 rounded-full mx-auto"></div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard title="Quick Actions" icon="⚡">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <button
                onClick={handleCreateNote}
                className="group relative p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/5 rounded-2xl text-center hover:from-blue-500/30 hover:to-blue-600/10 transition-all duration-300 border border-blue-500/20 hover:border-blue-400/40 transform hover:scale-105"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📝</div>
                <div className="font-bold text-slate-800 dark:text-white text-lg mb-2">Create Note</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Start writing your ideas</div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              <button
                onClick={() => navigate('/communities')}
                className="group relative p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/5 rounded-2xl text-center hover:from-purple-500/30 hover:to-purple-600/10 transition-all duration-300 border border-purple-500/20 hover:border-purple-400/40 transform hover:scale-105"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👥</div>
                <div className="font-bold text-slate-800 dark:text-white text-lg mb-2">Communities</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Connect and collaborate</div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              <button
                onClick={() => navigate('/whiteboard')}
                className="group relative p-6 bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 rounded-2xl text-center hover:from-cyan-500/30 hover:to-cyan-600/10 transition-all duration-300 border border-cyan-500/20 hover:border-cyan-400/40 transform hover:scale-105"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🖼️</div>
                <div className="font-bold text-slate-800 dark:text-white text-lg mb-2">Whiteboard</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Visual brainstorming</div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </GlassCard>

          {/* Recent + Pinned + Flash Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
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
                  <p className="text-slate-600 dark:text-zinc-500">No notes yet. Create your first note!</p>
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
                  <p className="text-slate-600 dark:text-zinc-500">No favorites yet.</p>
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
                  <p className="text-slate-600 dark:text-zinc-500">No flash cards yet. Create some from your notes!</p>
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
                <p className="text-slate-600 dark:text-zinc-500">No trending posts yet. Be the first to create one!</p>
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

      {/* Notification Modals */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

    </StyledWrapper>
  );
}
