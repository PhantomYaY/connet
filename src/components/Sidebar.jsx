import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { auth } from "../lib/firebase";
import {
  getUserTree,
  updateUserTree,
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  getNotes,
  getRootFolder,
  ensureRootFolder,
  updateNote,
  deleteNote
} from "../lib/firestoreService";
import { Folder, Star, Users, PlusCircle, FolderPlus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ui/use-toast";
import TreeView from "./TreeView";

const Sidebar = ({ open, onClose }) => {
  const [username, setUsername] = useState("Loading...");
  const [userTree, setUserTree] = useState(null);
  const [userId, setUserId] = useState(null);
  const [rootFolder, setRootFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user and tree data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const name = user.displayName || user.email.split("@")[0];
        setUsername(name);
        setUserId(user.uid);

        try {
          // Ensure root folder exists first
          await ensureRootFolder();

          // Load all data in parallel
          const [tree, root, userFolders, notes] = await Promise.all([
            getUserTree(),
            getRootFolder(),
            getFolders(),
            getNotes()
          ]);

          setUserTree(tree);
          setRootFolder(root);
          setFolders(userFolders);
          setAllNotes(notes);
        } catch (error) {
          console.error('Error loading sidebar data:', error);

          const isOfflineError = error.message.includes('offline') ||
                                error.message.includes('unavailable') ||
                                error.code === 'unavailable';

          toast({
            title: isOfflineError ? "Offline Mode" : "Error",
            description: isOfflineError
              ? "You're currently offline. Some features may be limited until you reconnect."
              : error.message || "Failed to load sidebar data",
            variant: isOfflineError ? "default" : "destructive",
          });
        }
      }
    });
    return () => unsubscribe();
  }, [toast]);

  const handleAddFolder = async (parentId = null) => {
    if (!userId) return;

    try {
      const folderName = prompt("Enter folder name:");
      if (!folderName?.trim()) return;

      await createFolder(folderName.trim(), parentId);

      // Refresh folders
      const updatedFolders = await getFolders();
      setFolders(updatedFolders);

      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const handleFolderRename = async (folderId, currentName) => {
    try {
      const newName = prompt("Enter new folder name:", currentName);
      if (!newName?.trim() || newName === currentName) return;

      await renameFolder(folderId, newName.trim());
      
      // Refresh folders
      const updatedFolders = await getFolders();
      setFolders(updatedFolders);
      
      toast({
        title: "Success",
        description: "Folder renamed successfully",
      });
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast({
        title: "Error",
        description: "Failed to rename folder",
        variant: "destructive",
      });
    }
  };

  const handleFolderDelete = async (folderId) => {
    try {
      // Prevent deletion of root folder
      if (folderId === 'root') {
        toast({
          title: "Cannot Delete",
          description: "The root folder cannot be deleted",
          variant: "destructive",
        });
        return;
      }

      if (!window.confirm("Are you sure you want to delete this folder? Notes inside will be moved to root folder.")) {
        return;
      }

      await deleteFolder(folderId);

      // Refresh data
      const [updatedFolders, updatedNotes] = await Promise.all([
        getFolders(),
        getNotes()
      ]);
      setFolders(updatedFolders);
      setAllNotes(updatedNotes);

      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder",
        variant: "destructive",
      });
    }
  };

  const handleNoteClick = (noteId) => {
    if (noteId) {
      // Open existing note
      navigate(`/page?id=${noteId}`);
    } else {
      // Create new note
      navigate('/page');
    }
  };

  const handleNoteRename = async (noteId, currentTitle) => {
    try {
      const newTitle = prompt("Enter new note title:", currentTitle);
      if (!newTitle?.trim() || newTitle === currentTitle) return;

      await updateNote(noteId, { title: newTitle.trim() });

      // Refresh data
      const updatedNotes = await getNotes();
      setAllNotes(updatedNotes);

      toast({
        title: "Success",
        description: "Note renamed successfully",
      });
    } catch (error) {
      console.error('Error renaming note:', error);
      toast({
        title: "Error",
        description: "Failed to rename note",
        variant: "destructive",
      });
    }
  };

  const handleNoteDelete = async (noteId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this note?")) {
        return;
      }

      await deleteNote(noteId);

      // Refresh data
      const updatedNotes = await getNotes();
      setAllNotes(updatedNotes);

      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const handleNoteMoveToFolder = async (noteId, folderId) => {
    try {
      await updateNote(noteId, { folderId });

      // Refresh data
      const updatedNotes = await getNotes();
      setAllNotes(updatedNotes);

      toast({
        title: "Success",
        description: "Note moved to folder successfully",
      });
    } catch (error) {
      console.error('Error moving note:', error);
      toast({
        title: "Error",
        description: "Failed to move note",
        variant: "destructive",
      });
    }
  };

  return (
    <Wrapper>
      <div className={`sidebar ${open ? "open" : "closed"}`}>
        <button className="new-note-btn" onClick={() => navigate("/page")}>
          <PlusCircle size={18} />
          New Note
        </button>

        <div className="nav-section">
          <NavItem 
            icon={<FileText size={16} />} 
            label="All Notes" 
            count={allNotes.length}
            onClick={() => navigate('/dashboard')}
          />
          <NavItem 
            icon={<Star size={16} />} 
            label="Favorites" 
            count={allNotes.filter(note => note.pinned).length}
          />
          <NavItem icon={<PlusCircle size={16} />} label="Whiteboard" />
          <NavItem icon={<Users size={16} />} label="Communities" />
        </div>


        {/* VS Code Tree View */}
        <div className="tree-section">
          <TreeView
            rootFolder={rootFolder}
            folders={folders}
            notes={allNotes}
            onNoteClick={handleNoteClick}
            onNoteRename={handleNoteRename}
            onNoteDelete={handleNoteDelete}
            onNoteMoveToFolder={handleNoteMoveToFolder}
            onFolderRename={handleFolderRename}
            onFolderDelete={handleFolderDelete}
            onFolderCreate={handleAddFolder}
          />
        </div>

        {/* Legacy notes warning */}
        {allNotes.filter(note => !note.folderId).length > 0 && (
          <div className="section legacy-warning">
            <h3 className="section-title">⚠️ Uncategorized Notes</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
              These notes will be automatically moved to your root folder.
            </p>
            <div className="notes-list">
              {allNotes
                .filter(note => !note.folderId)
                .map((note) => (
                  <div
                    key={note.id}
                    className="note-item legacy"
                    onClick={() => handleNoteClick(note.id)}
                    title="This note will be moved to your root folder"
                  >
                    <FileText size={14} />
                    <span className="note-title">{note.title}</span>
                    {note.pinned && <Star size={12} className="pinned-icon" />}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
};

const NavItem = ({ icon, label, count, onClick }) => (
  <button className="nav-item" onClick={onClick}>
    {icon}
    <span>{label}</span>
    {count !== undefined && <span className="count">{count}</span>}
  </button>
);


const Wrapper = styled.div`
  .sidebar {
    position: fixed;
    top: 64px;
    left: 0;
    width: 260px;
    height: calc(100vh - 64px);
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    padding: 20px 16px;
    z-index: 40;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */

    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari, and Opera */
    }
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);

    &.closed {
      transform: translateX(-100%);
      visibility: hidden;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &.open {
      transform: translateX(0);
      visibility: visible;
      pointer-events: auto;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .dark & {
      background: rgba(15, 23, 42, 0.25);
      border-right: 1px solid rgba(148, 163, 184, 0.1);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
    }

    .new-note-btn {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 24px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
      }

      &:active {
        transform: translateY(0);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 16px;

      .dark & {
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: transparent;
      border: none;
      color: rgba(71, 85, 105, 0.9);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;
      position: relative;
      overflow: hidden;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: rgba(15, 23, 42, 0.95);
        transform: translateX(4px);
      }

      &:active {
        transform: translateX(2px);
      }

      .dark & {
        color: rgba(226, 232, 240, 0.8);

        &:hover {
          background: rgba(148, 163, 184, 0.15);
          color: rgba(248, 250, 252, 0.95);
        }
      }

      .count {
        margin-left: auto;
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        min-width: 24px;
        text-align: center;

        .dark & {
          background: rgba(147, 197, 253, 0.2);
          color: #93c5fd;
        }
      }
    }

    .section {
      margin-bottom: 2rem;
    }

    .section-title, .title {
      font-size: 0.8rem;
      font-weight: 700;
      color: rgba(71, 85, 105, 0.7);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
      padding-left: 4px;

      .dark & {
        color: rgba(148, 163, 184, 0.8);
      }
    }

    .title {
      font-size: 1rem;
      font-weight: 700;
      color: #1e40af;
      text-transform: none;
      letter-spacing: 0;
      text-shadow: 0 1px 2px rgba(59, 130, 246, 0.1);
      margin-bottom: 16px;

      .dark & {
        color: #93c5fd;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
    }


    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .tree-section {
      flex: 1;
      min-height: 450px;
      overflow-y: auto;
      padding: 0;
      margin: 0;
      background: transparent;
      border: none;
      border-radius: 12px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.3);
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.1);

        &:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      }

      .dark &::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.2);
        border: 1px solid rgba(30, 41, 59, 0.3);

        &:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      }
    }


    .note-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.875rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 4px;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.nested {
        margin-left: 1.5rem;
        font-size: 0.8125rem;
      }

      &.legacy {
        border-left: 3px solid #f59e0b;
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.3);

        .dark & {
          background: rgba(245, 158, 11, 0.15);
        }
      }

      .note-title {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
        color: rgba(71, 85, 105, 0.9);
      }

      .pinned-icon {
        color: #f59e0b;
        flex-shrink: 0;
      }

      .dark & {
        background: rgba(30, 41, 59, 0.3);
        border: 1px solid rgba(148, 163, 184, 0.1);

        .note-title {
          color: rgba(226, 232, 240, 0.9);
        }

        &:hover {
          background: rgba(30, 41, 59, 0.5);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
      }
    }

  }
`;

export default Sidebar;
