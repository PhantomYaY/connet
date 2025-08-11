import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Star, FolderPlus, FileImage, Presentation, File, Eye, Sparkles, MoreHorizontal } from 'lucide-react';
import styled, { keyframes, css } from 'styled-components';

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
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetType: null
  });
  const [isRenaming, setIsRenaming] = useState(null);
  const [renamingValue, setRenamingValue] = useState('');
  const renameInputRef = useRef(null);
  const treeContainerRef = useRef(null);

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (contextMenu.visible) {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
      return;
    }

    if (isRenaming) {
      if (e.key === 'Escape') {
        setIsRenaming(null);
        setRenamingValue('');
      } else if (e.key === 'Enter') {
        handleRenameSubmit();
      }
      return;
    }

    // Add keyboard navigation for tree items
    if (e.key === 'Escape') {
      setSelectedItem(null);
    }
  }, [contextMenu.visible, isRenaming]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle clicks outside to close context menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible && !event.target.closest('[data-context-menu]')) {
        closeContextMenu();
      }
      if (isRenaming && !event.target.closest('[data-rename-input]')) {
        setIsRenaming(null);
        setRenamingValue('');
      }
    };

    if (contextMenu.visible || isRenaming) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.visible, isRenaming]);

  // Enhanced file type detection with better icons
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
        return <FileText size={16} className="node-icon note-icon" style={{ color: '#6366f1' }} />;
    }
  };

  const toggleFolder = (folderId, e) => {
    if (e) {
      e.stopPropagation();
    }
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

    // Calculate position to keep menu in viewport
    const rect = treeContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    let x = e.clientX;
    let y = e.clientY;

    // Adjust position if menu would go off-screen
    const menuWidth = 200;
    const menuHeight = 150;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setContextMenu({
      visible: true,
      x,
      y,
      targetId: id,
      targetType: type
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleItemClick = (item, type, e) => {
    e.stopPropagation();
    setSelectedItem({ id: item.id, type });
    
    if (type === 'file') {
      onFileClick(item.id);
    } else if (type === 'folder') {
      toggleFolder(item.id);
    }
  };

  const startRename = (id, currentName) => {
    setIsRenaming(id);
    setRenamingValue(currentName);
    closeContextMenu();
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 100);
  };

  const handleRenameSubmit = () => {
    if (isRenaming && renamingValue.trim()) {
      const item = [...folders, ...files].find(item => item.id === isRenaming);
      if (item) {
        if (folders.includes(item)) {
          onFolderRename(isRenaming, renamingValue.trim());
        } else {
          onFileRename(isRenaming, renamingValue.trim());
        }
      }
    }
    setIsRenaming(null);
    setRenamingValue('');
  };

  // Context menu handlers
  const handleRename = () => {
    const targetItem = contextMenu.targetType === 'folder' 
      ? folders.find(f => f.id === contextMenu.targetId)
      : files.find(f => f.id === contextMenu.targetId);
    
    if (targetItem) {
      const name = contextMenu.targetType === 'folder' ? targetItem.name : (targetItem.title || targetItem.fileName);
      startRename(contextMenu.targetId, name);
    }
  };

  const handleDelete = () => {
    if (contextMenu.targetType === 'folder') {
      onFolderDelete(contextMenu.targetId);
    } else {
      onFileDelete(contextMenu.targetId);
    }
    closeContextMenu();
  };

  const handleCreateFolder = () => {
    if (onFolderCreate) {
      onFolderCreate(contextMenu.targetId);
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

  const TreeNode = ({ item, level = 0, type = 'folder', isLast = false, parentPath = [] }) => {
    const isExpanded = expandedFolders.has(item.id);
    const isSelected = selectedItem?.id === item.id && selectedItem?.type === type;
    const isHovered = hoveredItem === item.id;
    const isCurrentlyRenaming = isRenaming === item.id;
    
    const hasChildren = type === 'folder' && (
      folders.some(f => f.parentId === item.id) ||
      files.some(f => f.folderId === item.id)
    );

    const isRoot = item.id === 'root';
    const indent = level * 20;

    const handleMouseEnter = () => setHoveredItem(item.id);
    const handleMouseLeave = () => setHoveredItem(null);

    if (type === 'file') {
      return (
        <TreeNodeContainer
          $level={level}
          $isSelected={isSelected}
          $isHovered={isHovered}
          className="tree-node file-node"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => handleItemClick(item, 'file', e)}
          onContextMenu={(e) => handleContextMenu(e, item.id, 'file')}
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          <NodeContent $isSelected={isSelected}>
            <IconContainer>
              {getFileIcon(item)}
            </IconContainer>
            
            {isCurrentlyRenaming ? (
              <RenameInput
                ref={renameInputRef}
                value={renamingValue}
                onChange={(e) => setRenamingValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') {
                    setIsRenaming(null);
                    setRenamingValue('');
                  }
                }}
                data-rename-input
              />
            ) : (
              <NodeLabel $isSelected={isSelected} $type="file">
                {item.title || item.fileName}
              </NodeLabel>
            )}

            <NodeActions>
              {item.pinned && (
                <Star size={12} className="pinned-icon" fill="currentColor" />
              )}
              {item.fileType && item.fileType !== 'note' && (
                <FileTypeIndicator $fileType={item.fileType}>
                  {item.fileType.toUpperCase()}
                </FileTypeIndicator>
              )}
              {isHovered && (
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, item.id, 'file');
                  }}
                  title="More options"
                >
                  <MoreHorizontal size={14} />
                </ActionButton>
              )}
            </NodeActions>
          </NodeContent>
        </TreeNodeContainer>
      );
    }

    return (
      <FolderContainer>
        <TreeNodeContainer
          $level={level}
          $isSelected={isSelected}
          $isHovered={isHovered}
          $isRoot={isRoot}
          className={`tree-node folder-node ${isRoot ? 'root-folder' : ''}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => handleItemClick(item, 'folder', e)}
          onContextMenu={(e) => handleContextMenu(e, item.id, 'folder')}
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          <NodeContent $isSelected={isSelected}>
            {hasChildren && (
              <ExpandButton
                onClick={(e) => toggleFolder(item.id, e)}
                $isExpanded={isExpanded}
              >
                <ChevronRight size={16} />
              </ExpandButton>
            )}
            
            <IconContainer>
              {isExpanded ? 
                <FolderOpen size={16} className="folder-icon expanded" /> : 
                <Folder size={16} className="folder-icon" />
              }
            </IconContainer>
            
            {isCurrentlyRenaming ? (
              <RenameInput
                ref={renameInputRef}
                value={renamingValue}
                onChange={(e) => setRenamingValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') {
                    setIsRenaming(null);
                    setRenamingValue('');
                  }
                }}
                data-rename-input
              />
            ) : (
              <NodeLabel $isSelected={isSelected} $type="folder" $isRoot={isRoot}>
                {item.name}
              </NodeLabel>
            )}

            <NodeActions>
              {isHovered && (
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, item.id, 'folder');
                  }}
                  title="More options"
                >
                  <MoreHorizontal size={14} />
                </ActionButton>
              )}
            </NodeActions>
          </NodeContent>
        </TreeNodeContainer>

        <ChildrenContainer $isExpanded={isExpanded}>
          {isExpanded && hasChildren && (
            <ChildrenContent>
              {(() => {
                const childFolders = folders.filter(f => f.parentId === item.id);
                const childFiles = files
                  .filter(f => f.folderId === item.id)
                  .sort((a, b) => {
                    // Sort by pinned first, then by type, then by update time
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    
                    const aType = a.fileType || 'note';
                    const bType = b.fileType || 'note';

                    if (aType === 'note' && bType !== 'note') return -1;
                    if (aType !== 'note' && bType === 'note') return 1;

                    const aTime = a.updatedAt?.toDate?.() || new Date(0);
                    const bTime = b.updatedAt?.toDate?.() || new Date(0);
                    return bTime - aTime;
                  });

                const allChildren = [...childFolders, ...childFiles];

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
                        type="file"
                        isLast={isLastChild}
                        parentPath={newParentPath}
                      />
                    );
                  }
                });
              })()}
            </ChildrenContent>
          )}
        </ChildrenContainer>
      </FolderContainer>
    );
  };

  return (
    <StyledWrapper>
      <ExplorerHeader>
        <HeaderTitle>FILES</HeaderTitle>
        <HeaderActions>
          <ActionButton
            onClick={() => onFolderCreate && onFolderCreate('root')}
            title="New Folder"
          >
            <FolderPlus size={14} />
          </ActionButton>
        </HeaderActions>
      </ExplorerHeader>

      <TreeContainer ref={treeContainerRef}>
        {rootFolder && (
          <TreeNode
            item={rootFolder}
            level={0}
            type="folder"
            isLast={false}
            parentPath={[]}
          />
        )}

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

      {/* Enhanced Context Menu */}
      {contextMenu.visible && (
        <>
          <ContextOverlay onClick={closeContextMenu} />
          <ContextMenu
            data-context-menu
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
            }}
          >
            {contextMenu.targetType === 'folder' && (
              <MenuItem onClick={handleCreateFolder}>
                <FolderPlus size={16} />
                <span>New Folder</span>
              </MenuItem>
            )}
            
            {contextMenu.targetType === 'folder' && contextMenu.targetId !== 'root' && (
              <>
                <MenuItem onClick={handleRename}>
                  <FileText size={16} />
                  <span>Rename</span>
                </MenuItem>
                <MenuSeparator />
                <MenuItem onClick={handleDelete} className="danger">
                  <FileText size={16} />
                  <span>Delete</span>
                </MenuItem>
              </>
            )}
            
            {contextMenu.targetType === 'file' && (
              <>
                <MenuItem onClick={handleFileView}>
                  <Eye size={16} />
                  <span>View File</span>
                </MenuItem>
                {(() => {
                  const file = files.find(f => f.id === contextMenu.targetId);
                  const canConvert = file && ['pdf', 'ppt', 'pptx', 'doc', 'docx'].includes(file.fileType);
                  return canConvert && (
                    <MenuItem onClick={handleFileAIConvert}>
                      <Sparkles size={16} />
                      <span>AI Convert to Notes</span>
                    </MenuItem>
                  );
                })()}
                <MenuSeparator />
                <MenuItem onClick={handleRename}>
                  <FileText size={16} />
                  <span>Rename</span>
                </MenuItem>
                <MenuItem onClick={handleDelete} className="danger">
                  <FileText size={16} />
                  <span>Delete</span>
                </MenuItem>
              </>
            )}
          </ContextMenu>
        </>
      )}
    </StyledWrapper>
  );
};

// Animations
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const expandAnimation = keyframes`
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 1000px;
    opacity: 1;
  }
`;

const collapseAnimation = keyframes`
  from {
    max-height: 1000px;
    opacity: 1;
  }
  to {
    max-height: 0;
    opacity: 0;
  }
`;

// Styled Components
const StyledWrapper = styled.div`
  background: transparent;
  color: rgba(71, 85, 105, 0.9);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  height: 100%;
  user-select: none;
  overflow: hidden;

  .dark & {
    color: rgba(226, 232, 240, 0.9);
  }
`;

const ExplorerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  .dark & {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.15);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
`;

const HeaderTitle = styled.div`
  color: rgba(71, 85, 105, 0.8);
  font-weight: 800;

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
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(15, 23, 42, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
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
  padding: 0 8px;
  overflow-y: auto;
  height: calc(100% - 100px);
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(148, 163, 184, 0.5);
    }
  }
`;

const TreeNodeContainer = styled.div`
  position: relative;
  cursor: pointer;
  border-radius: 10px;
  margin: 2px 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 36px;
  display: flex;
  align-items: center;

  ${props => props.$isSelected && css`
    background: rgba(59, 130, 246, 0.15);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
    
    .dark & {
      background: rgba(59, 130, 246, 0.25);
    }
  `}

  ${props => props.$isHovered && !props.$isSelected && css`
    background: rgba(255, 255, 255, 0.08);
    
    .dark & {
      background: rgba(148, 163, 184, 0.1);
    }
  `}

  ${props => props.$isRoot && css`
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    
    .dark & {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
    }
  `}

  &:active {
    transform: scale(0.98);
  }
`;

const FolderContainer = styled.div`
  margin: 2px 0;
`;

const ChildrenContainer = styled.div`
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${props => props.$isExpanded ? css`
    animation: ${expandAnimation} 0.3s ease-out;
  ` : css`
    max-height: 0;
    opacity: 0;
  `}
`;

const ChildrenContent = styled.div`
  padding-left: 12px;
  border-left: 2px solid rgba(148, 163, 184, 0.15);
  margin-left: 16px;
  margin-top: 4px;

  .dark & {
    border-color: rgba(148, 163, 184, 0.2);
  }
`;

const NodeContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  flex: 1;
  min-width: 0;

  ${props => props.$isSelected && css`
    color: rgba(59, 130, 246, 0.9);
    
    .dark & {
      color: rgba(147, 197, 253, 0.95);
    }
  `}
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .node-icon {
    transition: all 0.2s ease;
  }

  .folder-icon {
    color: rgba(59, 130, 246, 0.8);
    
    &.expanded {
      color: rgba(59, 130, 246, 1);
    }
  }

  .note-icon {
    color: rgba(99, 102, 241, 0.8);
  }
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: rgba(71, 85, 105, 0.6);
  cursor: pointer;
  padding: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  svg {
    transform: ${props => props.$isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'};
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover {
    background: rgba(59, 130, 246, 0.15);
    color: rgba(59, 130, 246, 0.9);
    transform: scale(1.1);
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
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-weight: 500;
  min-width: 0;

  ${props => props.$isRoot && css`
    font-weight: 700;
    color: rgba(59, 130, 246, 0.9);
    
    .dark & {
      color: rgba(147, 197, 253, 0.95);
    }
  `}

  ${props => props.$type === 'file' && css`
    color: rgba(71, 85, 105, 0.85);
    
    .dark & {
      color: rgba(226, 232, 240, 0.85);
    }
  `}

  ${props => props.$type === 'folder' && css`
    color: rgba(71, 85, 105, 0.9);
    font-weight: 600;
    
    .dark & {
      color: rgba(226, 232, 240, 0.9);
    }
  `}
`;

const NodeActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;

  .pinned-icon {
    color: #f59e0b;
  }
`;

const RenameInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(59, 130, 246, 0.5);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(15, 23, 42, 0.9);
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: rgba(59, 130, 246, 0.8);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .dark & {
    background: rgba(30, 41, 59, 0.95);
    color: rgba(226, 232, 240, 0.9);
    border-color: rgba(59, 130, 246, 0.6);
  }
`;

const FileTypeIndicator = styled.span`
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 700;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;

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
  backdrop-filter: blur(2px);
`;

const ContextMenu = styled.div`
  position: fixed;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(203, 213, 225, 0.4);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding: 8px;
  min-width: 200px;
  z-index: 1000;
  font-size: 14px;
  animation: ${slideIn} 0.15s ease-out;
  overflow: hidden;

  .dark & {
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  }
`;

const MenuItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  color: rgba(71, 85, 105, 0.9);
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
  border-radius: 10px;
  margin: 2px 0;

  &:hover {
    background: rgba(59, 130, 246, 0.12);
    color: rgba(59, 130, 246, 0.9);
    transform: translateX(2px);
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
  margin: 6px 12px;

  .dark & {
    background: rgba(148, 163, 184, 0.3);
  }
`;

export default TreeView;
