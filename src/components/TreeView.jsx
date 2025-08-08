import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Star, FolderPlus } from 'lucide-react';
import styled from 'styled-components';

const TreeView = ({
  rootFolder,
  folders,
  notes,
  onNoteClick,
  onNoteRename,
  onNoteDelete,
  onFolderRename,
  onFolderDelete,
  onFolderCreate,
  onNoteMoveToFolder
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
    draggedNoteId: null,
    dropTargetId: null
  });

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

  const handleNoteRename = () => {
    if (contextMenu.targetType === 'note' && onNoteRename) {
      const note = notes.find(n => n.id === contextMenu.targetId);
      if (note) {
        onNoteRename(contextMenu.targetId, note.title);
      }
    }
    closeContextMenu();
  };

  const handleNoteDelete = () => {
    if (contextMenu.targetType === 'note' && onNoteDelete) {
      onNoteDelete(contextMenu.targetId);
    }
    closeContextMenu();
  };

  // Drag and drop handlers
  const handleDragStart = (e, noteId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'note', id: noteId }));

    setDragState({
      isDragging: true,
      draggedNoteId: noteId,
      dropTargetId: null
    });

    // Fallback cleanup after 5 seconds in case dragend doesn't fire
    setTimeout(() => {
      setDragState({
        isDragging: false,
        draggedNoteId: null,
        dropTargetId: null
      });
    }, 5000);
  };

  const handleDragEnd = (e) => {
    // Force immediate cleanup
    setDragState({
      isDragging: false,
      draggedNoteId: null,
      dropTargetId: null
    });
  };

  // Additional cleanup handlers
  const clearDragState = () => {
    setDragState({
      isDragging: false,
      draggedNoteId: null,
      dropTargetId: null
    });
  };

  // Handle mouse up as fallback for stuck drag state
  const handleMouseUp = () => {
    if (dragState.isDragging) {
      clearDragState();
    }
  };

  // Handle escape key to cancel drag
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && dragState.isDragging) {
      clearDragState();
    }
  };

  // Add global event listeners for cleanup
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dragState.isDragging]);

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const dragData = JSON.parse(data);
        if (dragData.type === 'note') {
          const note = notes.find(n => n.id === dragData.id);
          if (note && note.folderId !== folderId) {
            e.dataTransfer.dropEffect = 'move';
            setDragState(prev => ({
              ...prev,
              dropTargetId: folderId
            }));
          } else {
            e.dataTransfer.dropEffect = 'none';
          }
        }
      }
    } catch (err) {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Use a small delay to prevent flickering when moving between child elements
    setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragState(prev => ({
          ...prev,
          dropTargetId: null
        }));
      }
    }, 10);
  };

  const handleDrop = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();

    // Always clear drag state first
    clearDragState();

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const dragData = JSON.parse(data);

        if (dragData.type === 'note' && dragData.id) {
          const note = notes.find(n => n.id === dragData.id);
          if (note && note.folderId !== folderId && onNoteMoveToFolder) {
            onNoteMoveToFolder(dragData.id, folderId);
          }
        }
      }
    } catch (err) {
      // Silently handle JSON parse errors
    }
  };

  const TreeNode = ({ item, level = 0, type = 'folder', isLast = false, parentPath = [] }) => {
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = type === 'folder' && (
      folders.some(f => f.parentId === item.id) ||
      notes.some(n => n.folderId === item.id)
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

    if (type === 'note') {
      const isDragged = dragState.draggedNoteId === item.id && dragState.isDragging;

      return (
        <TreeNodeContainer
          style={{ paddingLeft: `${isRoot ? 0 : indent + 16}px` }}
          className={`tree-node note-node ${isDragged ? 'dragging' : ''}`}
          onClick={(e) => {
            if (dragState.isDragging || dragState.draggedNoteId) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            onNoteClick(item.id);
          }}
          onContextMenu={(e) => handleContextMenu(e, item.id, 'note')}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragEnd={handleDragEnd}
        >
          {renderTreeLines()}
          <NodeContent>
            <FileText size={16} className="node-icon" />
            <NodeLabel>{item.title}</NodeLabel>
            {item.pinned && <Star size={12} className="pinned-icon" />}
          </NodeContent>
        </TreeNodeContainer>
      );
    }

    const isDropTarget = dragState.dropTargetId === item.id;

    return (
      <>
        <TreeNodeContainer
          style={{ paddingLeft: `${isRoot ? 0 : indent + 16}px` }}
          className={`tree-node folder-node ${isRoot ? 'root-folder' : ''} ${isDropTarget ? 'drop-target' : ''}`}
          onClick={(e) => {
            if (dragState.isDragging) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            hasChildren && toggleFolder(item.id);
          }}
          onContextMenu={(e) => handleContextMenu(e, item.id, 'folder')}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
              const data = e.dataTransfer.getData('application/json') || '{}';
              const dragData = JSON.parse(data);
              if (dragData.type === 'note') {
                const note = notes.find(n => n.id === dragData.id);
                if (note && note.folderId !== item.id) {
                  setDragState(prev => ({ ...prev, dropTargetId: item.id }));
                }
              }
            } catch (err) {
              // Fallback for browsers that don't support getData in dragenter
              if (dragState.isDragging && dragState.draggedNoteId) {
                const note = notes.find(n => n.id === dragState.draggedNoteId);
                if (note && note.folderId !== item.id) {
                  setDragState(prev => ({ ...prev, dropTargetId: item.id }));
                }
              }
            }
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
        >
          {renderTreeLines()}
          <NodeContent>
            {hasChildren && (
              <ExpandButton>
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
              const childNotes = notes
                .filter(n => n.folderId === item.id)
                .sort((a, b) => {
                  const aTime = a.updatedAt?.toDate?.() || new Date(0);
                  const bTime = b.updatedAt?.toDate?.() || new Date(0);
                  return bTime - aTime;
                });

              const allChildren = [...childFolders, ...childNotes];

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
                      type="note"
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
        <HeaderTitle>EXPLORER</HeaderTitle>
        <HeaderActions>
          <ActionButton
            onClick={() => onFolderCreate && onFolderCreate('root')}
            title="New Folder"
          >
            <FolderPlus size={14} />
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
            {contextMenu.targetType === 'note' && (
              <>
                <MenuItem onClick={handleNoteRename}>
                  ✏️ Rename Note
                </MenuItem>
                <MenuItem className="danger" onClick={handleNoteDelete}>
                  🗑️ Delete Note
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

  &.folder-node.drop-target {
    background: rgba(34, 197, 94, 0.2) !important;
    border: 2px solid #22c55e;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    border-radius: 10px;
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
    color: #667eea;
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
    color: #667eea;
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
