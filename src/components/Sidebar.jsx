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
          toast({
            title: "Error",
            description: "Failed to load sidebar data",
            variant: "destructive",
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
    background-color: #252526;
    border-right: 1px solid #3e3e42;
    padding: 16px 12px;
    z-index: 40;
    overflow-y: auto;
    color: #cccccc;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

    &.closed {
      transform: translateX(-100%);
      visibility: hidden;
      pointer-events: none;
      transition: transform 0.3s ease;
    }

    &.open {
      transform: translateX(0);
      visibility: visible;
      pointer-events: auto;
      transition: transform 0.3s ease;
    }

    .new-note-btn {
      width: 100%;
      background: #007acc;
      color: #ffffff;
      font-weight: 500;
      border: 1px solid #007acc;
      border-radius: 4px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 16px;
      transition: all 0.2s ease;

      &:hover {
        background: #1177bb;
        border-color: #1177bb;
      }

      &:active {
        background: #005a9e;
        border-color: #005a9e;
      }
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 16px;
      border-bottom: 1px solid #3e3e42;
      padding-bottom: 12px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      background: transparent;
      border: none;
      color: #cccccc;
      font-size: 13px;
      font-weight: 400;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;

      &:hover {
        background: #2a2d2e;
        color: #ffffff;
      }

      &:active {
        background: #37373d;
      }

      .count {
        margin-left: auto;
        background: #3e3e42;
        color: #cccccc;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 500;
        min-width: 18px;
        text-align: center;
      }
    }

    .section {
      margin-bottom: 1.5rem;
    }

    .section-title, .title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;

      .dark & {
        color: #94a3b8;
      }
    }

    .title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e40af;
      text-transform: none;
      letter-spacing: 0;
      text-shadow: 0 1px 2px rgba(59, 130, 246, 0.1);

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

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 2px;

        &:hover {
          background: rgba(0, 0, 0, 0.25);
        }
      }

      .dark &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);

        &:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      }
    }


    .note-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.5rem;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: background 0.2s ease;
      font-size: 0.875rem;

      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      &.nested {
        margin-left: 1rem;
        font-size: 0.8125rem;
      }

      &.legacy {
        border-left: 3px solid #f59e0b;
        background: rgba(245, 158, 11, 0.05);

        .dark & {
          background: rgba(245, 158, 11, 0.1);
        }
      }

      .note-title {
        flex: 1;
        truncate: true;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .pinned-icon {
        color: #f59e0b;
        flex-shrink: 0;
      }

      .dark & {
        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      }
    }

  }
`;

export default Sidebar;
