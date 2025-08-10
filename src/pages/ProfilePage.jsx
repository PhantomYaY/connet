import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signOut, updateProfile, updatePassword } from "firebase/auth";
import { getNotes, getFolders } from "../lib/firestoreService";
import { useToast } from "../components/ui/use-toast";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  FileText, 
  Star, 
  Folder, 
  Settings, 
  Edit3, 
  Save,
  X,
  Shield,
  Clock
} from "lucide-react";
import OptimizedModernLoader from "../components/OptimizedModernLoader";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [stats, setStats] = useState({
    totalNotes: 0,
    favoriteNotes: 0,
    totalFolders: 0,
    accountAge: ""
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/");
        return;
      }

      try {
        setUser(currentUser);
        setNewName(currentUser.displayName || "");

        // Load user data
        const [notesData, foldersData] = await Promise.all([
          getNotes(),
          getFolders()
        ]);

        setNotes(notesData);
        setFolders(foldersData);

        // Calculate stats
        const favoriteCount = notesData.filter(note => note.pinned).length;
        const accountCreated = new Date(currentUser.metadata.creationTime);
        const now = new Date();
        const daysSinceCreation = Math.floor((now - accountCreated) / (1000 * 60 * 60 * 24));
        
        let accountAge;
        if (daysSinceCreation < 30) {
          accountAge = `${daysSinceCreation} days ago`;
        } else if (daysSinceCreation < 365) {
          accountAge = `${Math.floor(daysSinceCreation / 30)} months ago`;
        } else {
          accountAge = `${Math.floor(daysSinceCreation / 365)} years ago`;
        }

        setStats({
          totalNotes: notesData.length,
          favoriteNotes: favoriteCount,
          totalFolders: foldersData.length,
          accountAge
        });

      } catch (error) {
        console.error("Error loading profile data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, toast]);

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;

    try {
      await updateProfile(user, {
        displayName: newName.trim()
      });
      
      setUser({ ...user, displayName: newName.trim() });
      setEditingName(false);
      
      toast({
        title: "Success",
        description: "Display name updated successfully",
      });
    } catch (error) {
      console.error("Error updating name:", error);
      toast({
        title: "Error",
        description: "Failed to update display name",
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    if (!user) return "??";
    
    if (user.displayName) {
      const nameParts = user.displayName.trim().split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else {
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    } else if (user.email) {
      const emailUsername = user.email.split('@')[0];
      return emailUsername.substring(0, 2).toUpperCase();
    }
    
    return "??";
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <OptimizedModernLoader />;

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

      {/* Header */}
      <div className="header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Profile</h1>
      </div>

      {/* Content */}
      <div className="content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar">
              {getInitials()}
            </div>
            <div className="profile-info">
              <div className="name-section">
                {editingName ? (
                  <div className="name-edit">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter your name"
                      autoFocus
                    />
                    <div className="name-actions">
                      <button onClick={handleUpdateName} className="save-btn">
                        <Save size={16} />
                      </button>
                      <button onClick={() => {
                        setEditingName(false);
                        setNewName(user?.displayName || "");
                      }} className="cancel-btn">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="name-display">
                    <h2>{user?.displayName || "Anonymous User"}</h2>
                    <button onClick={() => setEditingName(true)} className="edit-btn">
                      <Edit3 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="email">
                <Mail size={16} />
                <span>{user?.email}</span>
              </div>
              <div className="joined">
                <Calendar size={16} />
                <span>Joined {stats.accountAge}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card notes">
            <div className="stat-icon">
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.totalNotes}</h3>
              <p>Total Notes</p>
            </div>
          </div>

          <div className="stat-card favorites">
            <div className="stat-icon">
              <Star size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.favoriteNotes}</h3>
              <p>Favorites</p>
            </div>
          </div>

          <div className="stat-card folders">
            <div className="stat-icon">
              <Folder size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.totalFolders}</h3>
              <p>Folders</p>
            </div>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="actions-section">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button onClick={() => navigate('/all-notes')} className="action-btn">
              <FileText size={20} />
              <span>View All Notes</span>
            </button>
            <button onClick={() => navigate('/favorites')} className="action-btn">
              <Star size={20} />
              <span>View Favorites</span>
            </button>
            <button onClick={() => navigate('/settings')} className="action-btn">
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="account-section">
          <h3>Account Information</h3>
          <div className="account-details">
            <div className="detail-row">
              <span className="label">Account Created</span>
              <span className="value">{formatDate(user?.metadata?.creationTime)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Last Sign In</span>
              <span className="value">{formatDate(user?.metadata?.lastSignInTime)}</span>
            </div>
            <div className="detail-row">
              <span className="label">User ID</span>
              <span className="value uid">{user?.uid}</span>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  min-height: 100vh;
  position: relative;

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

  .header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    
    .dark & {
      background: rgba(15, 23, 42, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
      
      .dark & {
        color: #f9fafb;
      }
    }
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    color: #374151;
    font-weight: 500;
    transition: all 0.2s;
    
    .dark & {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
      
      .dark & {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .content {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .profile-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.5rem;
    padding: 2rem;
    
    .dark & {
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .profile-header {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
    flex-shrink: 0;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);

    .dark & {
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      box-shadow: 0 4px 20px rgba(96, 165, 250, 0.3);
    }
  }

  .profile-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .name-section {
    margin-bottom: 0.5rem;
  }

  .name-display {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
      
      .dark & {
        color: #f9fafb;
      }
    }
  }

  .edit-btn {
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    border-radius: 0.5rem;
    color: #6b7280;
    transition: all 0.2s;
    
    .dark & {
      background: rgba(255, 255, 255, 0.05);
      color: #9ca3af;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #374151;
      
      .dark & {
        background: rgba(255, 255, 255, 0.1);
        color: #d1d5db;
      }
    }
  }

  .name-edit {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    
    input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      background: white;
      
      .dark & {
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #f9fafb;
      }
    }
  }

  .name-actions {
    display: flex;
    gap: 0.25rem;
  }

  .save-btn, .cancel-btn {
    padding: 0.5rem;
    border: none;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }

  .save-btn {
    background: #10b981;
    color: white;
    
    &:hover {
      background: #059669;
    }
  }

  .cancel-btn {
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  }

  .email, .joined {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
    
    .dark & {
      color: #9ca3af;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s;
    
    .dark & {
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    &:hover {
      transform: translateY(-2px);
    }
    
    &.notes .stat-icon {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }
    
    &.favorites .stat-icon {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
    }
    
    &.folders .stat-icon {
      color: #8b5cf6;
      background: rgba(139, 92, 246, 0.1);
    }
    
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-info {
    h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
      
      .dark & {
        color: #f9fafb;
      }
    }
    
    p {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
      
      .dark & {
        color: #9ca3af;
      }
    }
  }

  .actions-section, .account-section {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
    padding: 1.5rem;
    
    .dark & {
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
      
      .dark & {
        color: #f9fafb;
      }
    }
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    color: #374151;
    font-weight: 500;
    transition: all 0.2s;
    
    .dark & {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
      
      .dark & {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .account-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    
    .dark & {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }

  .label {
    font-weight: 500;
    color: #374151;
    
    .dark & {
      color: #d1d5db;
    }
  }

  .value {
    color: #6b7280;
    font-size: 0.875rem;
    
    .dark & {
      color: #9ca3af;
    }
    
    &.uid {
      font-family: monospace;
      font-size: 0.75rem;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }


  @media (max-width: 768px) {
    .content {
      padding: 1rem;
    }
    
    .profile-header {
      flex-direction: column;
      text-align: center;
    }
    
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .action-buttons {
      grid-template-columns: 1fr;
    }
    
    .detail-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
  }
`;

export default ProfilePage;
