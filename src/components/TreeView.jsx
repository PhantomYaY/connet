import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Star, FolderPlus, FileImage, Presentation, File, Download, Eye, Sparkles } from 'lucide-react';
import styled from 'styled-components';

const TreeView = ({
  rootFolder,
  folders,
  files, // Changed from notes to files
  onFileClick, // Changed from onNoteClick
  onFileRename, // Changed from onNoteRename
  onFileDelete, // Changed from onNoteDelete
  onFileView,
  onFileAIConvert,
  onFolderRename,
  onFolderDelete,
  onFolderCreate,
  onFileMoveToFolder // Changed from onNoteMoveToFolder
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetType: null
  });
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedFileId: null, // Changed from draggedNoteId
    dropTargetId: null
  });

  // Function to get appropriate icon for file type
  const getFileIcon = (file) => {
    const fileType = file.fileType || file.type;
    const extension = file.fileName ? file.fileName.split('.').pop()?.toLowerCase() : '';

    switch (fileType) {
      case 'pdf':
      case 'application/pdf':
        return <File size={16} className="node-icon pdf-icon" style={{ color: '#dc2626' }} />;
      case 'ppt':
      case 'pptx':
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return <Presentation size={16} className="node-icon ppt-icon" style={{ color: '#ea580c' }} />;
      case 'doc':
      case 'docx':
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <FileText size={16} className="node-icon doc-icon" style={{ color: '#2563eb' }} />;
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage size={16} className="node-icon image-icon" style={{ color: '#059669' }} />;
      case 'note':
      case 'text':
      default:
        return <FileText size={16} className="node-icon" />;
    }
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleContextMenu = (e, id, type) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      targetId: id,
      targetType: type
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleRename = () => {
    if (contextMenu.targetType === 'folder') {
      const folder = folders.find(f => f.id === contextMenu.targetId);
      if (folder) {
        onFolderRename(contextMenu.targetId, folder.name);
      }
    }
    closeContextMenu();
  };

  const handleDelete = () => {
    if (contextMenu.targetType === 'folder') {
      onFolderDelete(contextMenu.targetId);
    }
    closeContextMenu();
  };

  const handleCreateFolder = () => {
    if (contextMenu.targetType === 'folder' && onFolderCreate) {
      onFolderCreate(contextMenu.targetId);
    }
    closeContextMenu();
  };

  const handleFileRename = () => {
    if (contextMenu.targetType === 'file' && onFileRename) {
      const file = files.find(f => f.id === contextMenu.targetId);
      if (file) {
        onFileRename(contextMenu.targetId, file.title || file.fileName);
      }
    }
    closeContextMenu();
  };

  const handleFileDelete = () => {
    if (contextMenu.targetType === 'file' && onFileDelete) {
      onFileDelete(contextMenu.targetId);
    }
    closeContextMenu();
  };

  const handleFileView = () => {
    if (contextMenu.targetType === 'file' && onFileView) {
      onFileView(contextMenu.targetId);
    }
    closeContextMenu();
  };

  const handleFileAIConvert = () => {
    if (contextMenu.targetType === 'file' && onFileAIConvert) {
      onFileAIConvert(contextMenu.targetId);
    }
    closeContextMenu();
  };

  // Forceful clear function
  const forceClearDragState = () => {
    setDragState({
      isDragging: false,
      draggedFileId: null, // Changed from draggedNoteId
      dropTargetId: null
    });
  };

  // Simple HTML5 drag and drop handlers
  const handleDragStart = (e, fileId) => {
    console.log('Drag start:', { fileId });

    // Clear any existing drag state first
    forceClearDragState();

    // Set new state immediately instead of with delay
    setDragState({
      isDragging: true,
      draggedFileId: fileId, // Changed from draggedNoteId
      dropTargetId: null
    });

    // Automatic timeout to clear stuck drag states after 5 seconds
    setTimeout(() => {
      forceClearDragState();
    }, 5000);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fileId);

    console.log('Drag data set:', { fileId, dataTransfer: e.dataTransfer.getData('text/plain') });
  };

  const handleDragEnd = (e) => {
    // Always clear drag state when drag ends
    forceClearDragState();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, folderId) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData('text/plain') || dragState.draggedFileId;
    console.log('Drag enter:', { folderId, fileId, isDragging: dragState.isDragging });

    if (fileId && dragState.isDragging) {
      setDragState(prev => ({ ...prev, dropTargetId: folderId }));
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the folder
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragState(prev => ({ ...prev, dropTargetId: null }));
    }
  };

  const handleDrop = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();

    // Get the file ID before clearing state
    const fileId = e.dataTransfer.getData('text/plain') || dragState.draggedFileId;

    console.log('Drop event:', { fileId, folderId, dragState });

    if (fileId && onFileMoveToFolder && folderId) {
      // Check if file is actually being moved to a different folder
      const file = files.find(f => f.id === fileId);
      if (file && file.folderId !== folderId) {
        console.log('Moving file:', file.title || file.fileName, 'to folder:', folderId);
        onFileMoveToFolder(fileId, folderId);
      } else {
        console.log('File already in target folder or file not found');
      }
    } else {
      console.log('Missing data for drop:', { fileId, folderId, hasHandler: !!onFileMoveToFolder });
    }

    // Clear drag state after handling drop
    forceClearDragState();
  };

  // Handle escape key to cancel drag
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      forceClearDragState();
    }
  };

  // Add click anywhere to clear drag
  const handleGlobalClick = (e) => {
    if (dragState.isDragging) {
      // If clicking anywhere outside tree during drag, clear it
      forceClearDragState();
    }
  };

  // Add global mouse up to clear stuck drags
  const handleGlobalMouseUp = (e) => {
    // If mouse up anywhere and we're dragging, clear it
    if (dragState.isDragging) {
      setTimeout(() => forceClearDragState(), 100);
    }
  };

  // Add global event listeners for cleanup
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState.isDragging]);



  const TreeNode = ({ item, level = 0, type = 'folder', isLast = false, parentPath = [] }) => {
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = type === 'folder' && (
      folders.some(f => f.parentId === item.id) ||
      files.some(f => f.folderId === item.id) // Changed from notes to files
    );

    const isRoot = item.id === 'root';
    const indent = level * 12; // Compact indent for better space usage

    const renderTreeLines = () => {
      if (level === 0) return null;

      const lines = [];

      // Draw vertical lines for parent levels
      for (let i = 0; i < level - 1; i++) {
        const hasVerticalLine = !parentPath[i];
        lines.push(
          <TreeLine
            key={`line-${i}`}
            className="tree-line vertical"
            style={{ left: `${4 + i * 12}px` }}
          >
            {hasVerticalLine && '│'}
          </TreeLine>
        );
      }

      // Draw the connection line for this level
      lines.push(
        <TreeLine
          key={`connector-${level}`}
          className="tree-line connector"
          style={{ left: `${4 + (level - 1) * 12}px` }}
        >
          {isLast ? '└──' : '├──'}
        </TreeLine>
      );

      return lines;
    };

    if (type === 'file') { // Changed from 'note' to 'file'
      const isDragged = dragState.draggedFileId === item.id && dragState.isDragging;

      return (
        <TreeNodeContainer
          style={{ paddingLeft: `${isRoot ? 0 : indent + 16}px` }}
          className={`tree-node file-node ${isDragged ? 'dragging' : ''}`} // Changed class
          onClick={(e) => {
            if (dragState.isDragging) {
              // If stuck in drag mode, clear it
              e.preventDefault();
              e.stopPropagation();
              forceClearDragState();
              return;
            }
            onFileClick(item.id); // Changed handler
          }}
          onContextMenu={(e) => handleContextMenu(e, item.id, 'file')} // Changed type
          draggable={true}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragEnd={handleDragEnd}
        >
          {renderTreeLines()}
          <NodeContent>
            {getFileIcon(item)} {/* Use dynamic icon based on file type */}
            <NodeLabel>{item.title || item.fileName}</NodeLabel> {/* Show title or fileName */}
            {item.pinned && <Star size={12} className="pinned-icon" />}
            {/* Add file type indicator */}
            {item.fileType && item.fileType !== 'note' && (
              <FileTypeIndicator $fileType={item.fileType}>
                {item.fileType.toUpperCase()}
              </FileTypeIndicator>
            )}
          </NodeContent>
        </TreeNodeContainer>
      );
    }

    const isDropTarget = dragState.dropTargetId === item.id;
    const canAcceptDrop = dragState.isDragging && dragState.draggedFileId; // Changed from draggedNoteId

    return (
      <>
        <TreeNodeContainer
          style={{ paddingLeft: `${isRoot ? 0 : indent + 16}px` }}
          className={`tree-node folder-node ${isRoot ? 'root-folder' : ''} ${isDropTarget ? 'drop-target' : ''} ${canAcceptDrop && !isDropTarget ? 'can-drop' : ''}`}
          onClick={(e) => {
            if (!dragState.isDragging) {
              hasChildren && toggleFolder(item.id);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, item.id, 'folder')}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
        >
          {renderTreeLines()}
          <NodeContent>
            {hasChildren && (
              <ExpandButton
                onClick={(e) => {
                  if (dragState.isDragging || dragState.draggedNoteId) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  e.stopPropagation();
                  toggleFolder(item.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </ExpandButton>
            )}
            <Folder size={16} className={`node-icon ${isExpanded ? 'expanded' : ''}`} />
            <NodeLabel>
              {isRoot ? item.name : item.name}
            </NodeLabel>
          </NodeContent>
        </TreeNodeContainer>

        {isExpanded && hasChildren && (
          <div className="tree-children">
            {(() => {
              const childFolders = folders.filter(f => f.parentId === item.id);
              const childFiles = files // Changed from childNotes to childFiles
                .filter(f => f.folderId === item.id)
                .sort((a, b) => {
                  // Sort by file type first (notes first, then others), then by date
                  const aType = a.fileType || 'note';
                  const bType = b.fileType || 'note';

                  if (aType === 'note' && bType !== 'note') return -1;
                  if (aType !== 'note' && bType === 'note') return 1;

                  const aTime = a.updatedAt?.toDate?.() || new Date(0);
                  const bTime = b.updatedAt?.toDate?.() || new Date(0);
                  return bTime - aTime;
                });

              const allChildren = [...childFolders, ...childFiles]; // Changed from childNotes

              return allChildren.map((child, index) => {
                const isLastChild = index === allChildren.length - 1;
                const newParentPath = [...parentPath, isLastChild];

                if (childFolders.includes(child)) {
                  return (
                    <TreeNode
                      key={child.id}
                      item={child}
                      level={level + 1}
                      type="folder"
                      isLast={isLastChild}
                      parentPath={newParentPath}
                    />
                  );
                } else {
                  return (
                    <TreeNode
                      key={child.id}
                      item={child}
                      level={level + 1}
                      type="file" // Changed from "note" to "file"
                      isLast={isLastChild}
                      parentPath={newParentPath}
                    />
                  );
                }
              });
            })()}
          </div>
        )}
      </>
    );
  };

  return (
    <StyledWrapper>
      <ExplorerHeader>
        <HeaderTitle>FILES</HeaderTitle> {/* Changed from EXPLORER to FILES */}
        <HeaderActions>
          {dragState.isDragging && (
            <ActionButton
              onClick={forceClearDragState}
              title="Clear Drag (Emergency)"
              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
            >
              ✕
            </ActionButton>
          )}
          <ActionButton
            onClick={() => onFolderCreate && onFolderCreate('root')}
            title="New Folder"
          >
            <FolderPlus size={14} />
          </ActionButton>
          <FileUploadInput
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                // Handle file upload - we'll implement this in the parent component
                window.handleFileUpload?.(e.target.files);
              }
            }}
          />
          <ActionButton
            as="label"
            htmlFor="file-upload"
            title="Upload Files (PDF, PPT, DOC, Images)"
          >
            <Download size={14} />
          </ActionButton>
        </HeaderActions>
      </ExplorerHeader>

      <TreeContainer>
        {/* Root folder always first */}
        {rootFolder && (
          <TreeNode
            item={rootFolder}
            level={0}
            type="folder"
            isLast={false}
            parentPath={[]}
          />
        )}

        {/* Other top-level folders */}
        {(() => {
          const topLevelFolders = folders.filter(f => f.id !== 'root' && (!f.parentId || f.parentId === null));
          return topLevelFolders.map((folder, index) => (
            <TreeNode
              key={folder.id}
              item={folder}
              level={0}
              type="folder"
              isLast={index === topLevelFolders.length - 1}
              parentPath={[]}
            />
          ));
        })()}
      </TreeContainer>

      {/* Context Menu */}
      {contextMenu.visible && (
        <>
          <ContextOverlay onClick={closeContextMenu} />
          <ContextMenu
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
            }}
          >
            {contextMenu.targetType === 'folder' && (
              <MenuItem onClick={handleCreateFolder}>
                📁 New Folder
              </MenuItem>
            )}
            {contextMenu.targetType === 'folder' && contextMenu.targetId !== 'root' && (
              <>
                <MenuItem onClick={handleRename}>
                  ✏️ Rename
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                  🗑️ Delete
                </MenuItem>
              </>
            )}
            {contextMenu.targetType === 'file' && (
              <>
                <MenuItem onClick={handleFileView}>
                  <Eye size={14} />
                  View File
                </MenuItem>
                {(() => {
                  const file = files.find(f => f.id === contextMenu.targetId);
                  const canConvert = file && ['pdf', 'ppt', 'pptx', 'doc', 'docx'].includes(file.fileType);
                  return canConvert && (
                    <MenuItem onClick={handleFileAIConvert}>
                      <Sparkles size={14} />
                      AI Convert to Notes
                    </MenuItem>
                  );
                })()}
                <MenuItem onClick={handleFileRename}>
                  ✏️ Rename
                </MenuItem>
                <MenuItem className="danger" onClick={handleFileDelete}>
                  🗑️ Delete
                </MenuItem>
              </>
            )}
          </ContextMenu>
        </>
      )}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  background: transparent;
  color: rgba(71, 85, 105, 0.9);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  height: 100%;
  user-select: none;

  .dark & {
    color: rgba(226, 232, 240, 0.9);
  }
`;

const ExplorerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 1px solid rgba(255, 255, 255, 0.1);

  .dark & {
    background: rgba(30, 41, 59, 0.3);
    border: 1px solid rgba(148, 163, 184, 0.1);
  }
`;

const HeaderTitle = styled.div`
  color: rgba(71, 85, 105, 0.8);

  .dark & {
    color: rgba(148, 163, 184, 0.9);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(71, 85, 105, 0.7);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(15, 23, 42, 0.9);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  .dark & {
    background: rgba(30, 41, 59, 0.3);
    border: 1px solid rgba(148, 163, 184, 0.1);
    color: rgba(148, 163, 184, 0.7);

    &:hover {
      background: rgba(30, 41, 59, 0.5);
      color: rgba(248, 250, 252, 0.9);
    }
  }
`;

const TreeContainer = styled.div`
  padding: 0;
  overflow-y: auto;
  height: calc(100% - 32px);
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, and Opera */
  }
`;

const TreeNodeContainer = styled.div`
  position: relative;
  line-height: 28px;
  cursor: pointer;
  color: rgba(71, 85, 105, 0.9);
  user-select: none;
  border-radius: 8px;
  margin: 2px 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
  }

  &.note-node {
    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  }

  &.folder-node {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &.note-node {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    &.dragging {
      opacity: 0.5;
      background: rgba(59, 130, 246, 0.2) !important;
      border: 2px solid #3b82f6;
      transform: scale(0.95) rotate(2deg);
      transition: all 0.2s ease;
      border-radius: 10px;
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
      cursor: grabbing;
    }
  }

  &.folder-node.can-drop {
    background: rgba(34, 197, 94, 0.08) !important;
    border: 1px dashed rgba(34, 197, 94, 0.4);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);

    .node-icon {
      color: #22c55e !important;
      opacity: 0.9 !important;
    }
  }

  &.folder-node.drop-target {
    background: rgba(34, 197, 94, 0.25) !important;
    border: 2px dashed #22c55e;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
    border-radius: 10px;
    transform: translateX(6px) scale(1.02);
    animation: pulse 1.5s ease-in-out infinite;

    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #22c55e, #10b981, #22c55e);
      border-radius: 10px;
      z-index: -1;
      opacity: 0.3;
      animation: borderGlow 2s ease-in-out infinite;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  @keyframes borderGlow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }

  .dark & {
    color: rgba(226, 232, 240, 0.9);

    &:hover {
      background: rgba(148, 163, 184, 0.1);
    }

    &.note-node:hover {
      background: rgba(148, 163, 184, 0.12);
    }

    &.folder-node:hover {
      background: rgba(148, 163, 184, 0.1);
    }
  }
`;

const TreeLine = styled.div`
  position: absolute;
  color: rgba(99, 102, 241, 0.6);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 28px;
  height: 28px;
  pointer-events: none;
  user-select: none;
  opacity: 1;
  transition: all 0.2s ease;
  font-weight: 600;

  &.vertical {
    top: -14px;
    height: 42px;
  }

  &.connector {
    top: 0;
    width: 24px;
  }

  .tree-node:hover & {
    color: rgba(99, 102, 241, 0.8);
    transform: scale(1.1);
  }

  .dark & {
    color: rgba(147, 197, 253, 0.6);

    .tree-node:hover & {
      color: rgba(147, 197, 253, 0.8);
    }
  }
`;

const NodeContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  position: relative;
  z-index: 1;
  border-radius: 8px;

  .tree-node.note-node.dragging & {
    pointer-events: none;
  }

  .tree-node:hover & {
    background: transparent;
  }

  .node-icon {
    flex-shrink: 0;
    opacity: 0.8;
    transition: all 0.2s ease;
    color: rgba(71, 85, 105, 0.7);
  }

  .tree-node.folder-node:hover & .node-icon {
    opacity: 1;
    color: #3b82f6;
  }

  .tree-node.note-node:hover & .node-icon {
    opacity: 1;
    color: #3b82f6;
  }

  .pinned-icon {
    color: #f59e0b;
    margin-left: auto;
  }

  .dark & {
    .node-icon {
      color: rgba(148, 163, 184, 0.7);
    }

    .tree-node.folder-node:hover & .node-icon {
      color: #93c5fd;
    }

    .tree-node.note-node:hover & .node-icon {
      color: #60a5fa;
    }
  }
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: rgba(71, 85, 105, 0.6);
  cursor: pointer;
  padding: 2px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    color: rgba(15, 23, 42, 0.9);
    background: rgba(255, 255, 255, 0.2);
  }

  &:active {
    background: rgba(255, 255, 255, 0.3);
  }

  .dark & {
    color: rgba(148, 163, 184, 0.6);

    &:hover {
      color: rgba(248, 250, 252, 0.9);
      background: rgba(148, 163, 184, 0.2);
    }
  }
`;

const NodeLabel = styled.span`
  flex: 1;
  font-size: 14px;
  color: rgba(71, 85, 105, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
  font-weight: 500;

  .tree-node.folder-node.root-folder & {
    font-weight: 700;
    color: #3b82f6;
  }

  .tree-node.folder-node:hover & {
    color: rgba(15, 23, 42, 0.95);
  }

  .tree-node.note-node & {
    color: rgba(71, 85, 105, 0.85);
    font-weight: 500;
  }

  .tree-node.note-node:hover & {
    color: rgba(15, 23, 42, 0.95);
  }

  .dark & {
    color: rgba(226, 232, 240, 0.9);

    .tree-node.folder-node.root-folder & {
      color: #93c5fd;
    }

    .tree-node.folder-node:hover & {
      color: rgba(248, 250, 252, 0.95);
    }

    .tree-node.note-node & {
      color: rgba(226, 232, 240, 0.85);
    }

    .tree-node.note-node:hover & {
      color: rgba(248, 250, 252, 0.95);
    }
  }
`;

const ContextOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
`;

const ContextMenu = styled.div`
  position: fixed;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(203, 213, 225, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  min-width: 180px;
  z-index: 1000;
  font-size: 14px;

  .dark & {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
`;

const MenuItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  color: rgba(71, 85, 105, 0.9);
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  transition: all 0.2s ease;
  margin: 2px 8px;
  border-radius: 8px;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  &.danger {
    color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }
  }

  .dark & {
    color: rgba(226, 232, 240, 0.9);

    &:hover {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }

    &.danger {
      color: #f87171;

      &:hover {
        background: rgba(248, 113, 113, 0.2);
        color: #fca5a5;
      }
    }
  }
`;

export default TreeView;
