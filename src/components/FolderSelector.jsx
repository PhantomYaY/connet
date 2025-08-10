import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronDown, Folder, FolderOpen, Check } from 'lucide-react';

const FolderSelector = ({ folders = [], selectedFolderId, onFolderChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFolderSelect = (folderId) => {
    onFolderChange(folderId);
    setIsOpen(false);
  };

  const getFolderIcon = (folder, isSelected = false) => {
    if (!folder) {
      return <Folder size={14} />;
    }
    if (folder.id === 'root') {
      return isSelected ? <FolderOpen size={14} /> : <Folder size={14} />;
    }
    return isSelected ? <FolderOpen size={14} /> : <Folder size={14} />;
  };

  const getFolderDisplayName = (folder) => {
    if (!folder) {
      return 'Select Folder';
    }
    if (folder.id === 'root') {
      return folder.name || 'All Notes';
    }
    return folder.name;
  };

  return (
    <SelectorContainer className={className} ref={dropdownRef}>
      <SelectorButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
        <FolderInfo>
          <FolderIcon>
            {getFolderIcon(selectedFolder, isOpen)}
          </FolderIcon>
          <FolderName>
            {getFolderDisplayName(selectedFolder)}
          </FolderName>
        </FolderInfo>
        <ChevronIcon $isOpen={isOpen}>
          <ChevronDown size={14} />
        </ChevronIcon>
      </SelectorButton>

      {isOpen && (
        <DropdownMenu>
          <DropdownHeader>Move to folder</DropdownHeader>
          {folders.length > 0 ? (
            folders.map((folder) => (
              <DropdownItem
                key={folder.id}
                onClick={() => handleFolderSelect(folder.id)}
                $isSelected={folder.id === selectedFolderId}
              >
                <ItemContent>
                  <FolderIcon>
                    {getFolderIcon(folder)}
                  </FolderIcon>
                  <ItemText>
                    <FolderName>{getFolderDisplayName(folder)}</FolderName>
                    {folder.id === 'root' && (
                      <FolderDescription>Your main folder</FolderDescription>
                    )}
                  </ItemText>
                </ItemContent>
                {folder.id === selectedFolderId && (
                  <CheckIcon>
                    <Check size={14} />
                  </CheckIcon>
                )}
              </DropdownItem>
            ))
          ) : (
            <DropdownItem disabled>
              <ItemContent>
                <ItemText>
                  <FolderName>No folders available</FolderName>
                </ItemText>
              </ItemContent>
            </DropdownItem>
          )}
        </DropdownMenu>
      )}
    </SelectorContainer>
  );
};

const SelectorContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const SelectorButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(203, 213, 225, 0.4);
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 140px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  ${props => props.$isOpen && `
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  `}
  
  .dark & {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.3);
    
    &:hover {
      background: rgba(30, 41, 59, 0.95);
      border-color: rgba(59, 130, 246, 0.5);
    }
    
    ${props => props.$isOpen && `
      background: rgba(59, 130, 246, 0.15);
      border-color: #60a5fa;
    `}
  }
`;

const FolderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const FolderIcon = styled.div`
  color: rgba(59, 130, 246, 0.8);
  display: flex;
  align-items: center;
  
  .dark & {
    color: rgba(96, 165, 250, 0.8);
  }
`;

const FolderName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: rgba(15, 23, 42, 0.9);
  white-space: nowrap;
  
  .dark & {
    color: rgba(226, 232, 240, 0.9);
  }
`;

const FolderDescription = styled.span`
  font-size: 11px;
  color: rgba(71, 85, 105, 0.6);
  
  .dark & {
    color: rgba(148, 163, 184, 0.6);
  }
`;

const ChevronIcon = styled.div`
  color: rgba(71, 85, 105, 0.6);
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  
  ${props => props.$isOpen && `
    transform: rotate(180deg);
    color: #3b82f6;
  `}
  
  .dark & {
    color: rgba(148, 163, 184, 0.6);
    
    ${props => props.$isOpen && `
      color: #60a5fa;
    `}
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(203, 213, 225, 0.3);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  z-index: 50;
  animation: dropdownOpen 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  .dark & {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  }
  
  @keyframes dropdownOpen {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const DropdownHeader = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: rgba(71, 85, 105, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px 4px;
  margin-bottom: 4px;
  
  .dark & {
    color: rgba(148, 163, 184, 0.7);
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  &:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${props => props.$isSelected && `
    background: rgba(59, 130, 246, 0.15);
  `}

  .dark & {
    &:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.2);
    }

    ${props => props.$isSelected && `
      background: rgba(59, 130, 246, 0.25);
    `}
  }
`;

const ItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

const ItemText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CheckIcon = styled.div`
  color: #3b82f6;
  display: flex;
  align-items: center;
  
  .dark & {
    color: #60a5fa;
  }
`;

export default FolderSelector;
