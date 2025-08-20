import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Star, FolderPlus, FileImage, Presentation, File, Download, Eye, Sparkles, Edit3 } from 'lucide-react';
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
  onFilesUploaded,
  onWhiteboardCreate, // New prop for creating whiteboards
  // onFileMoveToFolder removed with drag functionality
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetType: null
  });

  // Function to get appropriate icon for file type
  const getFileIcon = (file) => {
    const fileType = file.fileType || file.type;
    const extension = file.fileName ? file.fileName.split('.').pop()?.toLowerCase() : '';

    switch (fileType) {
      case 'whiteboard':
        return <Edit3 size={16} className="node-icon whiteboard-icon" style={{ color: '#8b5cf6' }} />;
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

  const TreeNode = ({ item, level = 0, type = 'folder', isLast = false, parentPath = [] }) => {
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = type === 'folder' && (
      folders.some(f => f.parentId === item.id) ||
      files.some(f => f.folderId === item.id)
    );

    const isRoot = item.id === 'root';
    const indent = level * 12;

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

    if (type === 'file') {
      return (
        <TreeNodeContainer
          style={{ paddingLeft: `${isRoot ? 0 : indent + 16}px` }}
          className="tree-node file-node"
          onClick={() => onFileClick(item.id)}
          onContextMenu={(e) => handleContextMenu(e, item.id, 'file')}
        >
          {renderTreeLines()}
          <NodeContent>
            {getFileIcon(item)}
            <NodeLabel>{item.title || item.fileName}</NodeLabel>
            {item.pinned && <Star size={12} className="pinned-icon" />}
            {item.fileType && item.fileType !== 'note' && (
              <FileTypeIndicator $fileType={item.fileType}>
                {item.fileType.toUpperCase()}
              </FileTypeIndicator>
            )}
          </NodeContent>
        </TreeNodeContainer>
      );
    }

    return (
      <>
        <TreeNodeContainer
          style={{ paddingLeft: `${isRoot ? 0 : indent + 16}px` }}
          className={`tree-node folder-node ${isRoot ? 'root-folder' : ''}`}
          onClick={() => hasChildren && toggleFolder(item.id)}
          onContextMenu={(e) => handleContextMenu(e, item.id, 'folder')}
        >
          {renderTreeLines()}
          <NodeContent>
            {hasChildren && (
              <ExpandButton
                onClick={(e) => {
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
              const childFiles = files
                .filter(f => f.folderId === item.id)
                .sort((a, b) => {
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
          </div>
        )}
      </>
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

      <TreeContainer>
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
                  ��️ Delete
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
  height: calc(100% - 80px);
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TreeNodeContainer = styled.div`
  position: relative;
  line-height: 28px;
  cursor: pointer;
  color: rgba(71, 85, 105, 0.9);
  user-select: none;
  border-radius: 6px;
  margin: 1px 0;
  transition: background-color 0.15s ease;

  .dark & {
    color: rgba(226, 232, 240, 0.9);
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


  .dark & {
    color: rgba(147, 197, 253, 0.6);

  }
`;

const NodeContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  position: relative;
  z-index: 1;
  border-radius: 8px;

  .tree-node.folder-node.root-folder & {
    padding-left: 4px;
  }

  .node-icon {
    flex-shrink: 0;
    opacity: 0.8;
    color: rgba(71, 85, 105, 0.7);
  }

  .pinned-icon {
    color: #f59e0b;
    margin-left: auto;
  }

  .dark & {
    .node-icon {
      color: rgba(148, 163, 184, 0.7);
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
  transition: background-color 0.15s ease, color 0.15s ease;

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

  .tree-node.file-node & {
    color: rgba(71, 85, 105, 0.85);
    font-weight: 500;
  }

  .dark & {
    color: rgba(226, 232, 240, 0.9);

    .tree-node.folder-node.root-folder & {
      color: #93c5fd;
    }

    .tree-node.file-node & {
      color: rgba(226, 232, 240, 0.85);
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

const FileTypeIndicator = styled.span`
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: auto;
  opacity: 0.8;

  background: ${props => {
    switch (props.$fileType) {
      case 'whiteboard': return 'rgba(139, 92, 246, 0.2)';
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
      case 'whiteboard': return '#8b5cf6';
      case 'pdf': return '#dc2626';
      case 'ppt':
      case 'pptx': return '#ea580c';
      case 'doc':
      case 'docx': return '#2563eb';
      default: return '#6b7280';
    }
  }};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 20px;
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
