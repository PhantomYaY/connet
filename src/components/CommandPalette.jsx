import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import styled from 'styled-components';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  FilePlus,
  Star,
  FolderPlus,
  Save,
  Sun,
  Moon,
  Settings,
  Search,
  ArrowLeft,
  Trash2,
  Copy,
  FileText,
  Undo,
  Redo,
  Link,
  Image,
  Calendar,
  Clock
} from 'lucide-react';

// Context for command palette
const CommandPaletteContext = createContext();

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
};

// Command definitions based on context
const getCommands = (location, editor, navigate, setIsDarkMode, isDarkMode) => {
  const isNotePage = location.pathname === '/page';
  const isDashboard = location.pathname === '/dashboard';
  const isSettings = location.pathname === '/settings';

  let commands = [];

  // Always available commands
  const globalCommands = [
    {
      id: 'search',
      label: 'Search Notes',
      icon: <Search size={16} />,
      section: 'Navigation',
      shortcut: 'Ctrl+F',
      action: () => navigate('/dashboard')
    },
    {
      id: 'new-note',
      label: 'Create New Note',
      icon: <FilePlus size={16} />,
      section: 'Navigation',
      shortcut: 'Ctrl+N',
      action: () => navigate('/page')
    },
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: <FileText size={16} />,
      section: 'Navigation',
      action: () => navigate('/dashboard')
    },
    {
      id: 'favorites',
      label: 'Show Favorites',
      icon: <Star size={16} />,
      section: 'Navigation',
      action: () => navigate('/dashboard?filter=favorites')
    },
    {
      id: 'new-folder',
      label: 'Create New Folder',
      icon: <FolderPlus size={16} />,
      section: 'Organization',
      action: () => console.log('Create folder')
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: <Settings size={16} />,
      section: 'Application',
      action: () => navigate('/settings')
    },
    {
      id: 'toggle-theme',
      label: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: isDarkMode ? <Sun size={16} /> : <Moon size={16} />,
      section: 'Application',
      action: () => setIsDarkMode(!isDarkMode)
    }
  ];

  // Note page specific commands
  const noteCommands = [
    {
      id: 'save-note',
      label: 'Save Note',
      icon: <Save size={16} />,
      section: 'Note Actions',
      shortcut: 'Ctrl+S',
      action: () => {
        // Trigger auto-save or manual save
        const event = new CustomEvent('saveNote');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'back-dashboard',
      label: 'Back to Dashboard',
      icon: <ArrowLeft size={16} />,
      section: 'Navigation',
      shortcut: 'Esc',
      action: () => navigate('/dashboard')
    },
    {
      id: 'delete-note',
      label: 'Delete Current Note',
      icon: <Trash2 size={16} />,
      section: 'Note Actions',
      destructive: true,
      action: () => {
        const event = new CustomEvent('deleteNote');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'duplicate-note',
      label: 'Duplicate Note',
      icon: <Copy size={16} />,
      section: 'Note Actions',
      action: () => {
        const event = new CustomEvent('duplicateNote');
        window.dispatchEvent(event);
      }
    }
  ];

  // Text formatting commands (only when editor is available)
  const formatCommands = editor ? [
    {
      id: 'format-bold',
      label: 'Toggle Bold',
      icon: <Bold size={16} />,
      section: 'Text Formatting',
      shortcut: 'Ctrl+B',
      active: editor.isActive('bold'),
      action: () => editor.chain().focus().toggleBold().run()
    },
    {
      id: 'format-italic',
      label: 'Toggle Italic',
      icon: <Italic size={16} />,
      section: 'Text Formatting',
      shortcut: 'Ctrl+I',
      active: editor.isActive('italic'),
      action: () => editor.chain().focus().toggleItalic().run()
    },
    {
      id: 'format-underline',
      label: 'Toggle Underline',
      icon: <Underline size={16} />,
      section: 'Text Formatting',
      shortcut: 'Ctrl+U',
      active: editor.isActive('underline'),
      action: () => editor.chain().focus().toggleUnderline().run()
    },
    {
      id: 'format-strike',
      label: 'Toggle Strikethrough',
      icon: <Strikethrough size={16} />,
      section: 'Text Formatting',
      active: editor.isActive('strike'),
      action: () => editor.chain().focus().toggleStrike().run()
    },
    {
      id: 'format-h1',
      label: 'Heading 1',
      icon: <Heading1 size={16} />,
      section: 'Text Formatting',
      active: editor.isActive('heading', { level: 1 }),
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
      id: 'format-h2',
      label: 'Heading 2',
      icon: <Heading2 size={16} />,
      section: 'Text Formatting',
      active: editor.isActive('heading', { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      id: 'format-h3',
      label: 'Heading 3',
      icon: <Heading3 size={16} />,
      section: 'Text Formatting',
      active: editor.isActive('heading', { level: 3 }),
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      id: 'format-paragraph',
      label: 'Normal Text',
      icon: <FileText size={16} />,
      section: 'Text Formatting',
      active: editor.isActive('paragraph'),
      action: () => editor.chain().focus().setParagraph().run()
    },
    {
      id: 'format-bullet-list',
      label: 'Bullet List',
      icon: <List size={16} />,
      section: 'Text Formatting',
      active: editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run()
    },
    {
      id: 'format-ordered-list',
      label: 'Numbered List',
      icon: <ListOrdered size={16} />,
      section: 'Text Formatting',
      active: editor.isActive('orderedList'),
      action: () => editor.chain().focus().toggleOrderedList().run()
    },
    {
      id: 'format-blockquote',
      label: 'Quote Block',
      icon: <Quote size={16} />,
      section: 'Text Formatting',
      active: editor.isActive('blockquote'),
      action: () => editor.chain().focus().toggleBlockquote().run()
    },
    {
      id: 'format-code-block',
      label: 'Code Block',
      icon: <Code size={16} />,
      section: 'Text Formatting',
      action: () => {
        const event = new CustomEvent('insertCodeBlock');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'edit-undo',
      label: 'Undo',
      icon: <Undo size={16} />,
      section: 'Edit Actions',
      shortcut: 'Ctrl+Z',
      disabled: !editor.can().undo(),
      action: () => editor.chain().focus().undo().run()
    },
    {
      id: 'edit-redo',
      label: 'Redo',
      icon: <Redo size={16} />,
      section: 'Edit Actions',
      shortcut: 'Ctrl+Y',
      disabled: !editor.can().redo(),
      action: () => editor.chain().focus().redo().run()
    }
  ] : [];

  // Build final command list based on context
  commands = [...globalCommands];
  
  if (isNotePage) {
    commands = [...commands, ...noteCommands, ...formatCommands];
  }

  return commands;
};

export const CommandPaletteProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [editor, setEditor] = useState(null);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, setIsDarkMode } = useTheme();

  const commands = getCommands(location, editor, navigate, setIsDarkMode, isDarkMode);
  
  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.section.toLowerCase().includes(query.toLowerCase())
  );

  const openPalette = () => {
    setIsOpen(true);
    setQuery('');
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closePalette = () => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const executeCommand = (command) => {
    if (command.disabled) return;
    command.action();
    closePalette();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Open palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }

      if (!isOpen) return;

      // Navigation within palette
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowDown':
          setActiveIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          if (filteredCommands.length > 0) {
            executeCommand(filteredCommands[activeIndex]);
          }
          break;
        case 'Escape':
          closePalette();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, activeIndex]);

  // Auto-scroll active item into view
  useEffect(() => {
    const activeElement = itemRefs.current[activeIndex];
    if (activeElement) {
      activeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [activeIndex]);

  // Reset active index when search changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const registerEditor = (editorInstance) => {
    setEditor(editorInstance);
  };

  const value = {
    isOpen,
    openPalette,
    closePalette,
    registerEditor
  };

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {isOpen && (
        <PaletteModal onClick={closePalette}>
          <PaletteContainer onClick={(e) => e.stopPropagation()}>
            <SearchSection>
              <SearchIcon>⌘</SearchIcon>
              <SearchInput
                ref={inputRef}
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <ClearButton onClick={() => setQuery('')}>
                  ✕
                </ClearButton>
              )}
            </SearchSection>

            <ResultsSection>
              {filteredCommands.length === 0 ? (
                <EmptyState>
                  No commands found for "{query}"
                </EmptyState>
              ) : (
                <>
                  {[...new Set(filteredCommands.map(cmd => cmd.section))].map(section => (
                    <SectionGroup key={section}>
                      <SectionTitle>{section}</SectionTitle>
                      {filteredCommands
                        .filter(cmd => cmd.section === section)
                        .map((cmd, index) => {
                          const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                          return (
                            <CommandItem
                              key={cmd.id}
                              ref={el => itemRefs.current[globalIndex] = el}
                              $active={globalIndex === activeIndex}
                              $destructive={cmd.destructive}
                              $disabled={cmd.disabled}
                              onMouseEnter={() => setActiveIndex(globalIndex)}
                              onClick={() => executeCommand(cmd)}
                            >
                              <ItemLeft $active={cmd.active}>
                                <ItemIcon $active={cmd.active}>
                                  {cmd.icon}
                                </ItemIcon>
                                <ItemLabel>{cmd.label}</ItemLabel>
                              </ItemLeft>
                              
                              <ItemRight>
                                {cmd.active && <ActiveBadge>●</ActiveBadge>}
                                {cmd.shortcut && <Shortcut>{cmd.shortcut}</Shortcut>}
                              </ItemRight>
                            </CommandItem>
                          );
                        })}
                    </SectionGroup>
                  ))}
                </>
              )}
            </ResultsSection>

            <Footer>
              <FooterHint>
                <kbd>↑↓</kbd> Navigate <kbd>Enter</kbd> Execute <kbd>Esc</kbd> Close
              </FooterHint>
            </Footer>
          </PaletteContainer>
        </PaletteModal>
      )}
    </CommandPaletteContext.Provider>
  );
};

// Styled Components
const PaletteModal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  animation: fadeIn 0.15s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const PaletteContainer = styled.div`
  background: #ffffff;
  width: 100%;
  max-width: 600px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  border: 1px solid #e2e8f0;
  animation: slideIn 0.15s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  
  .dark & {
    border-bottom-color: #334155;
  }
`;

const SearchIcon = styled.span`
  font-size: 18px;
  margin-right: 12px;
  color: #64748b;
  
  .dark & {
    color: #94a3b8;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #1e293b;
  
  &::placeholder {
    color: #94a3b8;
  }
  
  .dark & {
    color: #e2e8f0;
    
    &::placeholder {
      color: #64748b;
    }
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: #f1f5f9;
    color: #64748b;
  }
  
  .dark &:hover {
    background: #334155;
    color: #94a3b8;
  }
`;

const ResultsSection = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
`;

const SectionGroup = styled.div`
  margin-bottom: 4px;
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 8px 20px 6px;
  
  .dark & {
    color: #94a3b8;
  }
`;

const CommandItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.1s ease;
  background: ${props => props.$active ? '#f8fafc' : 'transparent'};
  color: ${props => {
    if (props.$disabled) return '#94a3b8';
    if (props.$destructive) return '#ef4444';
    return '#1e293b';
  }};
  
  &:hover {
    background: ${props => props.$disabled ? 'transparent' : '#f8fafc'};
  }
  
  .dark & {
    background: ${props => props.$active ? '#334155' : 'transparent'};
    color: ${props => {
      if (props.$disabled) return '#64748b';
      if (props.$destructive) return '#f87171';
      return '#e2e8f0';
    }};
    
    &:hover {
      background: ${props => props.$disabled ? 'transparent' : '#334155'};
    }
  }
`;

const ItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ItemIcon = styled.div`
  color: ${props => props.$active ? '#3b82f6' : 'inherit'};
  display: flex;
  align-items: center;
`;

const ItemLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const ItemRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActiveBadge = styled.span`
  color: #3b82f6;
  font-size: 12px;
`;

const Shortcut = styled.kbd`
  font-size: 11px;
  background: #f1f5f9;
  color: #64748b;
  padding: 4px 6px;
  border-radius: 4px;
  font-family: inherit;
  font-weight: 500;
  
  .dark & {
    background: #475569;
    color: #cbd5e1;
  }
`;

const Footer = styled.div`
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  
  .dark & {
    border-top-color: #334155;
    background: #0f172a;
  }
`;

const FooterHint = styled.div`
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 12px;
  
  kbd {
    background: #e2e8f0;
    color: #475569;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
  }
  
  .dark & {
    color: #94a3b8;
    
    kbd {
      background: #475569;
      color: #cbd5e1;
    }
  }
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
  
  .dark & {
    color: #94a3b8;
  }
`;

export { CommandPaletteProvider };
export default CommandPaletteProvider;
