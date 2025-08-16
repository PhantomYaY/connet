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
  getFiles, // Added for file management
  createFile, // Added for file creation
  updateFile, // Added for file updates
  deleteFile, // Added for file deletion
  getRootFolder,
  ensureRootFolder,
  updateNote,
  deleteNote,
  getSharedNotes
} from "../lib/firestoreService";
import { Folder, Star, Users, PlusCircle, FolderPlus, FileText, MessageCircle, UserPlus, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ui/use-toast";
import TreeView from "./TreeView";
import InlineLoader from "./InlineLoader";
import FileViewer from "./viewers/FileViewer";

const Sidebar = ({ open, onClose }) => {
  const [username, setUsername] = useState(null);
  const [userTree, setUserTree] = useState(null);
  const [userId, setUserId] = useState(null);
  const [rootFolder, setRootFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [allFiles, setAllFiles] = useState([]); // Changed from allNotes to allFiles
  const [sharedNotes, setSharedNotes] = useState([]);
  const [viewerFile, setViewerFile] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const navigate = useNavigate();
  // Temporarily disable toast to debug the error
  const toast = (options) => {
    console.log('Toast would show:', options.title, '-', options.description);
  };

  // File upload handler
  const handleFileUpload = async (files) => {
    try {
      toast({
        title: "Uploading Files",
        description: `Uploading ${files.length} file(s)...`,
      });

      for (const file of files) {
        const fileType = file.type || file.name.split('.').pop()?.toLowerCase();

        // Create file record
        await createFile({
          fileName: file.name,
          fileType: fileType,
          size: file.size,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          folderId: 'root', // Default to root folder
          uploadedAt: new Date(),
          // Note: In a real app, you'd upload to Firebase Storage first
          // downloadURL: uploadedFileURL
        });
      }

      // Refresh files
      const updatedFiles = await getFiles();
      setAllFiles(updatedFiles);

      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${files.length} file(s)`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      if (toast && typeof toast === 'function') {
        toast({
          title: "Upload Failed",
          description: "Failed to upload files. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Make file upload handler available globally for TreeView
  useEffect(() => {
    window.handleFileUpload = handleFileUpload;
    return () => {
      delete window.handleFileUpload;
    };
  }, [handleFileUpload]);

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
          const [tree, root, userFolders, files, shared] = await Promise.all([
            getUserTree(),
            getRootFolder(),
            getFolders(),
            getFiles(), // Changed from getNotes to getFiles
            getSharedNotes()
          ]);

          setUserTree(tree);
          setRootFolder(root);
          setFolders(userFolders);
          setAllFiles(files); // Changed from setAllNotes to setAllFiles
          setSharedNotes(shared);
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
      const [updatedFolders, updatedFiles] = await Promise.all([
        getFolders(),
        getFiles()
      ]);
      setFolders(updatedFolders);
      setAllFiles(updatedFiles);

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
      const updatedFiles = await getFiles();
      setAllFiles(updatedFiles);

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
      const updatedFiles = await getFiles();
      setAllFiles(updatedFiles);

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

  const handleFileMoveToFolder = async (fileId, folderId) => {
    console.log('handleFileMoveToFolder called:', { fileId, folderId });

    try {
      console.log('Updating file with folderId:', folderId);
      await updateFile(fileId, { folderId }); // Changed from updateNote to updateFile

      // Refresh data
      const updatedFiles = await getFiles(); // Changed from getNotes to getFiles
      setAllFiles(updatedFiles); // Changed from setAllNotes to setAllFiles

      console.log('File moved successfully');
      toast({
        title: "Success",
        description: "File moved to folder successfully",
      });
    } catch (error) {
      console.error('Error moving file:', error);
      toast({
        title: "Error",
        description: "Failed to move file",
        variant: "destructive",
      });
    }
  };

  const handleFileClick = (fileId) => {
    if (fileId) {
      // Find the file to determine its type
      const file = allFiles.find(f => f.id === fileId);

      if (file) {
        const fileType = file.fileType || file.type || '';
        const fileName = file.fileName || file.title || '';
        const extension = fileName.split('.').pop()?.toLowerCase();

        // Check if it's a document file that should use the viewer
        const documentTypes = ['pdf', 'ppt', 'pptx', 'doc', 'docx'];
        const normalizedFileType = fileType.toLowerCase();
        const isDocument = documentTypes.includes(normalizedFileType) ||
                          documentTypes.includes(extension) ||
                          normalizedFileType.includes('pdf') ||
                          normalizedFileType.includes('powerpoint') ||
                          normalizedFileType.includes('presentation') ||
                          normalizedFileType.includes('word') ||
                          normalizedFileType.includes('document');

        if (isDocument) {
          // Use the file viewer for documents
          handleFileView(fileId);
        } else {
          // Open as note for text files or unknown types
          navigate(`/page?id=${fileId}`);
        }
      } else {
        // File not found, navigate to create new
        navigate('/page');
      }
    } else {
      // Create new file
      navigate('/page');
    }
  };

  const handleFileRename = async (fileId, currentTitle) => {
    try {
      const newTitle = prompt("Enter new file name:", currentTitle);
      if (!newTitle?.trim() || newTitle === currentTitle) return;

      await updateFile(fileId, { title: newTitle.trim() });

      // Refresh data
      const updatedFiles = await getFiles();
      setAllFiles(updatedFiles);

      toast({
        title: "Success",
        description: "File renamed successfully",
      });
    } catch (error) {
      console.error('Error renaming file:', error);
      toast({
        title: "Error",
        description: "Failed to rename file",
        variant: "destructive",
      });
    }
  };

  const handleFileDelete = async (fileId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this file?")) {
        return;
      }

      await deleteFile(fileId);

      // Refresh data
      const updatedFiles = await getFiles();
      setAllFiles(updatedFiles);

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleFileView = async (fileId) => {
    try {
      if (!fileId) {
        console.error('handleFileView called with no fileId');
        return;
      }

      const file = allFiles.find(f => f.id === fileId);
      console.log('handleFileView - file found:', file);

      if (!file) {
        toast({
          title: "File Not Found",
          description: "The requested file could not be found",
          variant: "destructive",
        });
        return;
      }

      // Check if it's a supported file type for the viewer
      const fileType = file.fileType || file.type || '';
      const fileName = file.fileName || file.title || '';
      const extension = fileName.split('.').pop()?.toLowerCase();

      console.log('File details:', {
        fileType,
        fileName,
        extension,
        downloadURL: !!file.downloadURL,
        hasUrl: !!file.downloadURL
      });

      const supportedTypes = ['pdf', 'ppt', 'pptx', 'doc', 'docx'];
      const isSupported = supportedTypes.includes(fileType.toLowerCase()) ||
                          supportedTypes.includes(extension) ||
                          fileType.toLowerCase().includes('pdf') ||
                          fileType.toLowerCase().includes('powerpoint') ||
                          fileType.toLowerCase().includes('presentation') ||
                          fileType.toLowerCase().includes('word') ||
                          fileType.toLowerCase().includes('document');

      console.log('File support check:', { isSupported, fileType, extension });

      if (isSupported) {
        // Use our custom viewer
        console.log('Opening file in custom viewer');
        setViewerFile(file);
        setIsViewerOpen(true);
      } else if (file.downloadURL) {
        // Fallback to opening in new tab for unsupported types
        console.log('Opening file in new tab');
        window.open(file.downloadURL, '_blank');
      } else {
        console.log('File not supported and no downloadURL available');
        toast({
          title: "File Viewer",
          description: "This file type is not supported for preview. Please upload files with valid URLs.",
        });
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      toast({
        title: "Error",
        description: "Failed to open file",
        variant: "destructive",
      });
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setViewerFile(null);
  };

  const handleGoogleDriveFilesUploaded = async (uploadedFiles) => {
    try {
      // Add the uploaded files to our local state
      setAllFiles(prevFiles => [...prevFiles, ...uploadedFiles]);

      toast({
        title: "Files Uploaded Successfully",
        description: `${uploadedFiles.length} file(s) uploaded to Google Drive and added to your files.`,
      });

      // Optionally refresh the files list to ensure consistency
      // const refreshedFiles = await getFiles();
      // setAllFiles(refreshedFiles);
    } catch (error) {
      console.error('Error handling Google Drive uploaded files:', error);
      toast({
        title: "Error",
        description: "Files uploaded but failed to add to your files list.",
        variant: "destructive",
      });
    }
  };

  const handleFileAIConvert = async (fileId) => {
    try {
      const file = allFiles.find(f => f.id === fileId);
      if (!file) return;

      toast({
        title: "AI Conversion Started",
        description: "Converting file to notes... This may take a moment.",
      });

      // TODO: Implement AI conversion logic
      // This would typically call an AI service to extract text and convert to notes
      console.log('AI conversion for file:', file);

    } catch (error) {
      console.error('Error converting file:', error);
      toast({
        title: "Error",
        description: "Failed to convert file",
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
            count={allFiles.length}
            isActive={activeSection === 'all-notes'}
            isLoading={loadingStates['all-notes']}
            onClick={() => {
              setActiveSection('all-notes');
              setLoadingStates(prev => ({ ...prev, 'all-notes': true }));
              navigate('/all-notes');
              setTimeout(() => setLoadingStates(prev => ({ ...prev, 'all-notes': false })), 300);
            }}
          />
          <NavItem
            icon={<Star size={16} />}
            label="Favorites"
            count={allFiles.filter(file => file.pinned).length}
            isActive={activeSection === 'favorites'}
            isLoading={loadingStates['favorites']}
            onClick={() => {
              setActiveSection('favorites');
              setLoadingStates(prev => ({ ...prev, 'favorites': true }));
              navigate('/favorites');
              setTimeout(() => setLoadingStates(prev => ({ ...prev, 'favorites': false })), 300);
            }}
          />
          <NavItem
            icon={<Users size={16} />}
            label="Shared with Me"
            count={sharedNotes.length}
            isActive={activeSection === 'shared'}
            isLoading={loadingStates['shared']}
            onClick={() => {
              setActiveSection('shared');
              setLoadingStates(prev => ({ ...prev, 'shared': true }));
              navigate('/shared-notes');
              setTimeout(() => setLoadingStates(prev => ({ ...prev, 'shared': false })), 300);
            }}
          />
          <NavItem
            icon={<PlusCircle size={16} />}
            label="Whiteboard"
            isActive={activeSection === 'whiteboard'}
            isLoading={loadingStates['whiteboard']}
            onClick={() => {
              setActiveSection('whiteboard');
              setLoadingStates(prev => ({ ...prev, 'whiteboard': true }));
              navigate('/whiteboard');
              setTimeout(() => setLoadingStates(prev => ({ ...prev, 'whiteboard': false })), 300);
            }}
          />
          <NavItem
            icon={<Users size={16} />}
            label="Communities"
            isActive={activeSection === 'communities'}
            isLoading={loadingStates['communities']}
            onClick={() => {
              setActiveSection('communities');
              setLoadingStates(prev => ({ ...prev, 'communities': true }));
              navigate('/communities');
              setTimeout(() => setLoadingStates(prev => ({ ...prev, 'communities': false })), 300);
            }}
          />
          <NavItem
            icon={<UserPlus size={16} />}
            label="Social"
            isActive={activeSection === 'social'}
            isLoading={loadingStates['social']}
            onClick={() => {
              setActiveSection('social');
              setLoadingStates(prev => ({ ...prev, 'social': true }));
              // Open the social features modal instead of navigating
              window.dispatchEvent(new CustomEvent('openSocial'));
              setTimeout(() => setLoadingStates(prev => ({ ...prev, 'social': false })), 300);
            }}
          />
          <NavItem
            icon={<Brain size={16} />}
            label="Flashcards"
            isActive={activeSection === 'flashcards'}
            isLoading={loadingStates['flashcards']}
            onClick={() => {
              setActiveSection('flashcards');
              setLoadingStates(prev => ({ ...prev, 'flashcards': true }));
              navigate('/flashcards');
              setTimeout(() => setLoadingStates(prev => ({ ...prev, 'flashcards': false })), 300);
            }}
          />
        </div>


        {/* VS Code Tree View */}
        <div className="tree-section">
          <TreeView
            rootFolder={rootFolder}
            folders={folders}
            files={allFiles} // Changed from notes to files
            onFileClick={handleFileClick} // Changed from onNoteClick
            onFileRename={handleFileRename} // Changed from onNoteRename
            onFileDelete={handleFileDelete} // Changed from onNoteDelete
            onFileView={handleFileView} // New handler
            onFileAIConvert={handleFileAIConvert} // New handler
            onFilesUploaded={handleGoogleDriveFilesUploaded} // Google Drive upload handler
            // File move functionality removed with drag and drop
            onFolderRename={handleFolderRename}
            onFolderDelete={handleFolderDelete}
            onFolderCreate={handleAddFolder}
          />
        </div>

        {/* Legacy files warning */}
        {allFiles.filter(file => !file.folderId).length > 0 && (
          <div className="section legacy-warning">
            <h3 className="section-title">⚠��� Uncategorized Files</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
              These files will be automatically moved to your root folder.
            </p>
            <div className="notes-list">
              {allFiles
                .filter(file => !file.folderId)
                .map((file) => (
                  <div
                    key={file.id}
                    className="note-item legacy"
                    onClick={() => handleFileClick(file.id)}
                    title="This file will be moved to your root folder"
                  >
                    <FileText size={14} />
                    <span className="note-title">{file.title || file.fileName}</span>
                    {file.pinned && <Star size={12} className="pinned-icon" />}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* File Viewer Modal */}
      <FileViewer
        file={viewerFile}
        isVisible={isViewerOpen}
        onClose={handleCloseViewer}
      />
    </Wrapper>
  );
};

const NavItem = ({ icon, label, count, onClick, isActive, isLoading }) => (
  <button
    className={`nav-item ${isActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
    onClick={onClick}
  >
    <div className="nav-item-content">
      <div className="nav-item-icon">
        {isLoading ? (
          <div className="loading-spinner" />
        ) : (
          icon
        )}
      </div>
      <span className="nav-item-label">{label}</span>
      {count !== undefined && <span className="count">{count}</span>}
    </div>
    {isActive && <div className="active-indicator" />}
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
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
      position: relative;
      overflow: hidden;

      &:before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
      }

      &:hover {
        transform: translateY(-2px);
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.25);

        &:before {
          left: 100%;
        }
      }

      &:active {
        transform: translateY(-1px);
      }

      .dark & {
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);

        &:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          box-shadow: 0 8px 25px rgba(96, 165, 250, 0.25);
        }
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

      .nav-item {
        opacity: 0;
        animation: slideInLeft 0.4s ease forwards;

        &:nth-child(1) { animation-delay: 0.1s; }
        &:nth-child(2) { animation-delay: 0.15s; }
        &:nth-child(3) { animation-delay: 0.2s; }
        &:nth-child(4) { animation-delay: 0.25s; }
        &:nth-child(5) { animation-delay: 0.3s; }
        &:nth-child(6) { animation-delay: 0.35s; }
        &:nth-child(7) { animation-delay: 0.4s; }
      }
    }

    @keyframes slideInLeft {
      0% {
        opacity: 0;
        transform: translateX(-20px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0;
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

      &:hover:not(.loading) {
        background: rgba(255, 255, 255, 0.15);

        .nav-item-content {
          transform: translateX(2px);
        }
      }

      &.active {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;

        .nav-item-icon {
          color: #3b82f6;
        }

        .count {
          background: rgba(59, 130, 246, 0.25);
          color: #1d4ed8;
        }
      }

      &.loading {
        opacity: 0.7;
        cursor: default;
      }

      .nav-item-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        width: 100%;
        transition: transform 0.2s ease;
      }

      .nav-item-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease;
      }

      .nav-item-label {
        flex: 1;
      }

      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(59, 130, 246, 0.2);
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .active-indicator {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: linear-gradient(to bottom, #3b82f6, #1d4ed8);
        border-radius: 0 2px 2px 0;
        opacity: 1;
        animation: slideIn 0.3s ease;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes slideIn {
        0% {
          width: 0;
          opacity: 0;
        }
        100% {
          width: 3px;
          opacity: 1;
        }
      }

      .dark & {
        color: rgba(226, 232, 240, 0.8);

        &:hover:not(.loading) {
          background: rgba(148, 163, 184, 0.1);
          color: rgba(248, 250, 252, 0.95);
        }

        &.active {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;

          .nav-item-icon {
            color: #60a5fa;
          }

          .count {
            background: rgba(59, 130, 246, 0.3);
            color: #93c5fd;
          }

          .active-indicator {
            background: linear-gradient(to bottom, #60a5fa, #3b82f6);
          }
        }

        .loading-spinner {
          border-color: rgba(96, 165, 250, 0.2);
          border-top-color: #60a5fa;
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
        transition: all 0.2s ease;

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
      opacity: 0;
      animation: fadeInUp 0.6s ease forwards;
      animation-delay: 0.2s;

      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */

      &::-webkit-scrollbar {
        display: none; /* Chrome, Safari, and Opera */
      }
    }

    @keyframes fadeInUp {
      0% {
        opacity: 0;
        transform: translateY(20px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
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
        position: relative;
        animation: pulse 2s ease-in-out infinite;

        &:before {
          content: '⚠️';
          position: absolute;
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
        }

        .dark & {
          background: rgba(245, 158, 11, 0.15);
        }
      }

      @keyframes pulse {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
        }
        50% {
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
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
