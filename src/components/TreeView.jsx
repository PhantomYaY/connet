import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Star, FolderPlus, FileImage, Presentation, File, Eye, Sparkles } from 'lucide-react';
import styled from 'styled-components';

const TreeView = ({
  rootFolder,
  folders,
  files,
  onFileClick,
  onFileRename,
  onFileDelete,
  onFileView,
  onFileAIConvert,
  onFolderRename,
  onFolderDelete,
  onFolderCreate,
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetType: null
  });

  // Simple click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [contextMenu.visible]);

  // File type icons
  const getFileIcon = (file) => {
    const fileType = file.fileType || file.type;
    const extension = file.fileName ? file.fileName.split('.').pop()?.toLowerCase() : '';

    switch (fileType) {
      case 'pdf':
      case 'application/pdf':
        return <File size={14} className="node-icon" style={{ color: '#dc2626' }} />;
      case 'ppt':
      case 'pptx':
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return <Presentation size={14} className="node-icon" style={{ color: '#ea580c' }} />;
      case 'doc':
      case 'docx':
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <FileText size={14} className="node-icon" style={{ color: '#2563eb' }} />;
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage size={14} className="node-icon" style={{ color: '#059669' }} />;
      case 'note':
      case 'text':
      default:
        return <FileText size={14} className="node-icon" style={{ color: '#6366f1' }} />;
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleContextMenu = (e, id, type) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetId: id,
      targetType: type
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Context menu handlers
  const handleRename = () => {
    const targetItem = contextMenu.targetType === 'folder' 
      ? folders.find(f => f.id === contextMenu.targetId)
      : files.find(f => f.id === contextMenu.targetId);
    
    if (targetItem) {
      const name = contextMenu.targetType === 'folder' ? targetItem.name : (targetItem.title || targetItem.fileName);
      const newName = prompt(`Rename ${contextMenu.targetType}:`, name);
      if (newName && newName.trim() && newName !== name) {
        if (contextMenu.targetType === 'folder') {
          onFolderRename(contextMenu.targetId, newName.trim());
        } else {
          onFileRename(contextMenu.targetId, newName.trim());
        }
      }
    }
    closeContextMenu();
  };

  const handleDelete = () => {
    const confirmMessage = `Are you sure you want to delete this ${contextMenu.targetType}?`;
    if (window.confirm(confirmMessage)) {
      if (contextMenu.targetType === 'folder') {
        onFolderDelete(contextMenu.targetId);
      } else {
        onFileDelete(contextMenu.targetId);
      }
    }
    closeContextMenu();
  };

  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      onFolderCreate(contextMenu.targetId, folderName.trim());
    }
    closeContextMenu();
  };

  const handleFileView = () => {
    onFileView(contextMenu.targetId);
    closeContextMenu();
  };

  const handleFileAIConvert = () => {
    onFileAIConvert(contextMenu.targetId);
    closeContextMenu();
  };

  const TreeNode = ({ item, level = 0, type = 'folder' }) => {
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = type === 'folder' && (
      folders.some(f => f.parentId === item.id) ||
      files.some(f => f.folderId === item.id)
    );
    const isRoot = item.id === 'root';
    const indent = level * 12;

    if (type === 'file') {
      return (
        <FileNode
          style={{ paddingLeft: `${indent + 16}px` }}
          onClick={() => onFileClick(item.id)}
          onContextMenu={(e) => handleContextMenu(e, item.id, 'file')}
        >
          <NodeContent>
            {getFileIcon(item)}
            <NodeLabel>{item.title || item.fileName}</NodeLabel>
            {item.pinned && <Star size={10} className="pinned-icon" fill="currentColor" />}
            {item.fileType && item.fileType !== 'note' && (
              <FileTypeTag $fileType={item.fileType}>
                {item.fileType.toUpperCase()}
              </FileTypeTag>
            )}
          </NodeContent>
        </FileNode>
      );
    }

    return (
      <div>
        <FolderNode
          style={{ paddingLeft: `${indent + 8}px` }}
          $isRoot={isRoot}
          onClick={() => hasChildren && toggleFolder(item.id)}
          onContextMenu={(e) => handleContextMenu(e, item.id, 'folder')}
        >
          <NodeContent>
            {hasChildren && (
              <ExpandButton
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(item.id);
                }}
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </ExpandButton>
            )}
            <Folder size={14} className="folder-icon" />
            <NodeLabel $isRoot={isRoot}>{item.name}</NodeLabel>
          </NodeContent>
        </FolderNode>

        {isExpanded && hasChildren && (
          <ChildrenContainer>
            {folders
              .filter(f => f.parentId === item.id)
              .map(folder => (
                <TreeNode
                  key={folder.id}
                  item={folder}
                  level={level + 1}
                  type="folder"
                />
              ))}
            
            {files
              .filter(f => f.folderId === item.id)
              .sort((a, b) => {
                // Sort pinned first, then by type, then by date
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                
                const aType = a.fileType || 'note';
                const bType = b.fileType || 'note';
                if (aType === 'note' && bType !== 'note') return -1;
                if (aType !== 'note' && bType === 'note') return 1;

                const aTime = a.updatedAt?.toDate?.() || new Date(0);
                const bTime = b.updatedAt?.toDate?.() || new Date(0);
                return bTime - aTime;
              })
              .map(file => (
                <TreeNode
                  key={file.id}
                  item={file}
                  level={level + 1}
                  type="file"
                />
              ))}
          </ChildrenContainer>
        )}
      </div>
    );
  };

  return (
    <TreeWrapper>
      <TreeHeader>
        <HeaderTitle>FILES</HeaderTitle>
        <HeaderActions>
          <ActionButton
            onClick={() => onFolderCreate && onFolderCreate('root')}
            title="New Folder"
          >
            <FolderPlus size={14} />
          </ActionButton>
        </HeaderActions>
      </TreeHeader>

      <TreeContainer>
        {rootFolder && (
          <TreeNode item={rootFolder} level={0} type="folder" />
        )}

        {folders
          .filter(f => f.id !== 'root' && (!f.parentId || f.parentId === null))
          .map(folder => (
            <TreeNode key={folder.id} item={folder} level={0} type="folder" />
          ))}
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
                <FolderPlus size={14} />
                <span>New Folder</span>
              </MenuItem>
            )}
            
            {contextMenu.targetType === 'folder' && contextMenu.targetId !== 'root' && (
              <>
                <MenuItem onClick={handleRename}>
                  <FileText size={14} />
                  <span>Rename</span>
                </MenuItem>
                <MenuSeparator />
                <MenuItem onClick={handleDelete} className="danger">
                  <FileText size={14} />
                  <span>Delete</span>
                </MenuItem>
              </>
            )}
            
            {contextMenu.targetType === 'file' && (
              <>
                <MenuItem onClick={handleFileView}>
                  <Eye size={14} />
                  <span>View File</span>
                </MenuItem>
                {(() => {
                  const file = files.find(f => f.id === contextMenu.targetId);
                  const canConvert = file && ['pdf', 'ppt', 'pptx', 'doc', 'docx'].includes(file.fileType);
                  return canConvert && (
                    <MenuItem onClick={handleFileAIConvert}>
                      <Sparkles size={14} />
                      <span>AI Convert to Notes</span>
                    </MenuItem>
                  );
                })()}
                <MenuSeparator />
                <MenuItem onClick={handleRename}>
                  <FileText size={14} />
                  <span>Rename</span>
                </MenuItem>
                <MenuItem onClick={handleDelete} className="danger">
                  <FileText size={14} />
                  <span>Delete</span>
                </MenuItem>
              </>
            )}
          </ContextMenu>
        </>
      )}
    </TreeWrapper>
  );
};

// Simplified styled components without animations that cause flickering
const TreeWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  color: rgba(71, 85, 105, 0.9);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  user-select: none;

  .dark & {
    color: rgba(226, 232, 240, 0.9);
  }
`;

const TreeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);

  .dark & {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.15);
  }
`;

const HeaderTitle = styled.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(71, 85, 105, 0.8);

  .dark & {
    color: rgba(148, 163, 184, 0.9);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(71, 85, 105, 0.8);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(15, 23, 42, 0.9);
  }

  .dark & {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.15);
    color: rgba(148, 163, 184, 0.8);

    &:hover {
      background: rgba(30, 41, 59, 0.6);
      color: rgba(248, 250, 252, 0.95);
    }
  }
`;

const TreeContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 2px;

    &:hover {
      background: rgba(148, 163, 184, 0.5);
    }
  }
`;

const FolderNode = styled.div`
  cursor: pointer;
  border-radius: 6px;
  margin: 1px 0;
  transition: background-color 0.15s ease;
  min-height: 24px;
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  ${props => props.$isRoot && `
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);

    .dark & {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
    }
  `}

  .dark &:hover {
    background: rgba(148, 163, 184, 0.1);
  }
`;

const FileNode = styled.div`
  cursor: pointer;
  border-radius: 6px;
  margin: 1px 0;
  transition: background-color 0.15s ease;
  min-height: 24px;
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .dark &:hover {
    background: rgba(148, 163, 184, 0.1);
  }
`;

const ChildrenContainer = styled.div`
  margin-left: 12px;
  border-left: 1px solid rgba(148, 163, 184, 0.2);
  padding-left: 6px;

  .dark & {
    border-color: rgba(148, 163, 184, 0.3);
  }
`;

const NodeContent = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  flex: 1;
  min-width: 0;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: rgba(71, 85, 105, 0.6);
  cursor: pointer;
  padding: 1px;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.15);
    color: rgba(59, 130, 246, 0.9);
  }

  .dark & {
    color: rgba(148, 163, 184, 0.6);

    &:hover {
      background: rgba(59, 130, 246, 0.2);
      color: rgba(147, 197, 253, 0.9);
    }
  }
`;

const NodeLabel = styled.span`
  flex: 1;
  font-weight: 500;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;

  ${props => props.$isRoot && `
    font-weight: 700;
    color: rgba(59, 130, 246, 0.9);

    .dark & {
      color: rgba(147, 197, 253, 0.95);
    }
  `}
`;

const FileTypeTag = styled.span`
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;

  background: ${props => {
    switch (props.$fileType) {
      case 'pdf': return 'rgba(220, 38, 38, 0.2)';
      case 'ppt':
      case 'pptx': return 'rgba(234, 88, 12, 0.2)';
      case 'doc':
      case 'docx': return 'rgba(37, 99, 235, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  }};

  color: ${props => {
    switch (props.$fileType) {
      case 'pdf': return '#dc2626';
      case 'ppt':
      case 'pptx': return '#ea580c';
      case 'doc':
      case 'docx': return '#2563eb';
      default: return '#6b7280';
    }
  }};
`;

const ContextOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.1);
`;

const ContextMenu = styled.div`
  position: fixed;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(203, 213, 225, 0.4);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 8px;
  min-width: 180px;
  z-index: 1000;
  font-size: 14px;

  .dark & {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
`;

const MenuItem = styled.div`
  padding: 10px 12px;
  cursor: pointer;
  color: rgba(71, 85, 105, 0.9);
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  transition: all 0.15s ease;
  border-radius: 6px;
  margin: 2px 0;

  &:hover {
    background: rgba(59, 130, 246, 0.12);
    color: rgba(59, 130, 246, 0.9);
  }

  &.danger {
    color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.12);
      color: #dc2626;
    }
  }

  .dark & {
    color: rgba(226, 232, 240, 0.9);

    &:hover {
      background: rgba(59, 130, 246, 0.2);
      color: rgba(147, 197, 253, 0.95);
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

const MenuSeparator = styled.div`
  height: 1px;
  background: rgba(203, 213, 225, 0.4);
  margin: 6px 8px;

  .dark & {
    background: rgba(148, 163, 184, 0.3);
  }
`;

export default TreeView;
