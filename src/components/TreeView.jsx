import React, { useState } from 'react';
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
    setDragState({
      isDragging: true,
      draggedNoteId: noteId,
      dropTargetId: null
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', noteId);
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedNoteId: null,
      dropTargetId: null
    });
  };

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow drop if we're dragging a note and it's not the same folder
    const note = notes.find(n => n.id === dragState.draggedNoteId);
    if (dragState.isDragging && note && note.folderId !== folderId) {
      e.dataTransfer.dropEffect = 'move';
      setDragState(prev => ({
        ...prev,
        dropTargetId: folderId
      }));
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only clear if we're truly leaving the target
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragState(prev => ({
        ...prev,
        dropTargetId: null
      }));
    }
  };

  const handleDrop = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();

    const noteId = e.dataTransfer.getData('text/plain');

    // Verify the note exists and is not already in this folder
    const note = notes.find(n => n.id === noteId);
    if (noteId && folderId && onNoteMoveToFolder && note && note.folderId !== folderId) {
      onNoteMoveToFolder(noteId, folderId);
    }

    // Clear drag state
    setDragState({
      isDragging: false,
      draggedNoteId: null,
      dropTargetId: null
    });
  };

  const TreeNode = ({ item, level = 0, type = 'folder', isLast = false, parentPath = [] }) => {
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = type === 'folder' && (
      folders.some(f => f.parentId === item.id) ||
      notes.some(n => n.folderId === item.id)
    );

    const isRoot = item.id === 'root';
    const indent = level * 16; // Smaller indent for VS Code style

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
            style={{ left: `${4 + i * 16}px` }}
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
          style={{ left: `${4 + (level - 1) * 16}px` }}
        >
          {isLast ? '└' : '├'}
        </TreeLine>
      );

      return lines;
    };

    if (type === 'note') {
      const isDragged = dragState.draggedNoteId === item.id;

      return (
        <TreeNodeContainer
          style={{ paddingLeft: `${indent + 20}px` }}
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
          style={{ paddingLeft: `${indent + 20}px` }}
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
  background: #252526;
  color: #cccccc;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 13px;
  height: 100%;
  user-select: none;
`;

const ExplorerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: transparent;
  border-bottom: none;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 4px;
`;

const HeaderTitle = styled.div`
  color: #cccccc;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.7;

  &:hover {
    background: #37373d;
    color: #cccccc;
    opacity: 1;
  }

  &:active {
    background: #464647;
  }
`;

const TreeContainer = styled.div`
  padding: 0;
  overflow-y: auto;
  height: calc(100% - 32px);
`;

const TreeNodeContainer = styled.div`
  position: relative;
  line-height: 22px;
  cursor: pointer;
  color: #cccccc;
  user-select: none;

  &:hover {
    background: #2a2d2e;
  }

  &.note-node {
    &:hover {
      background: #37373d;
    }
  }

  &.folder-node {
    &:hover {
      background: #2a2d2e;
    }
  }

  &.note-node.dragging {
    opacity: 0.6;
    background: rgba(59, 130, 246, 0.15) !important;
    border-left: 3px solid #007acc;
    transform: scale(0.98);
    transition: all 0.2s ease;
    border-radius: 4px;
  }

  &.folder-node.drop-target {
    background: rgba(34, 197, 94, 0.25) !important;
    border-left: 3px solid #22c55e;
    box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.5);
    border-radius: 4px;
  }
`;

const TreeLine = styled.div`
  position: absolute;
  color: #464647;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 22px;
  height: 22px;
  pointer-events: none;
  user-select: none;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &.vertical {
    top: -11px;
    height: 33px;
  }

  &.connector {
    top: 0;
    width: 12px;
  }

  .tree-node:hover & {
    opacity: 1;
    color: #858585;
  }
`;

const NodeContent = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  position: relative;
  z-index: 1;
  border-radius: 4px;

  .tree-node:hover & {
    background: transparent;
  }

  .node-icon {
    flex-shrink: 0;
    opacity: 0.8;
    transition: all 0.2s ease;
  }

  .tree-node.folder-node:hover & .node-icon {
    opacity: 1;
    color: #569cd6;
  }

  .tree-node.note-node:hover & .node-icon {
    opacity: 1;
    color: #ffffff;
  }
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -2px;
  border-radius: 2px;
  transition: all 0.2s ease;

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const NodeLabel = styled.span`
  flex: 1;
  font-size: 13px;
  color: #cccccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;

  .tree-node.folder-node.root-folder & {
    font-weight: 600;
    color: #569cd6;
  }

  .tree-node.folder-node:hover & {
    color: #ffffff;
  }

  .tree-node.note-node & {
    color: #cccccc;
  }

  .tree-node.note-node:hover & {
    color: #ffffff;
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
  background: #252526;
  border: 1px solid #464647;
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  padding: 4px 0;
  min-width: 160px;
  z-index: 1000;
  font-size: 12px;
`;

const MenuItem = styled.div`
  padding: 6px 12px;
  cursor: pointer;
  color: #cccccc;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #094771;
    color: #ffffff;
  }

  &.danger {
    color: #f14c4c;

    &:hover {
      background: rgba(241, 76, 76, 0.1);
    }
  }
`;

export default TreeView;
