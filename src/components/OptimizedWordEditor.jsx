import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewContent,
  NodeViewWrapper,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { Extension, Node } from "@tiptap/core";
import styled from "styled-components";
import { useCommandPalette } from "./CommandPalette";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Save,
  Clock,
  Expand,
  Minimize2,
  Focus,
  Eye,
  FileText,
  Copy,
  Trash2,
  Check,
  Play
} from 'lucide-react';

// Memoized CodeBlock component for better performance
const MemoizedCodeBlock = React.memo(({ node, updateAttributes, selected, extension, deleteNode, editor }) => {
  const [lang, setLang] = useState(node.attrs.language || "javascript");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const languages = useMemo(() => [
    { value: "python", label: "Python" },
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" }
  ], []);

  const handleLanguageChange = useCallback((newLang) => {
    setLang(newLang);
    updateAttributes({ language: newLang });
  }, [updateAttributes]);

  const copyToClipboard = useCallback(async () => {
    const code = node.textContent?.trim();
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [node]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this code block?')) {
      if (deleteNode) {
        deleteNode();
      } else if (editor) {
        // Alternative method using editor commands
        editor.chain().focus().deleteNode('customCodeBlock').run();
      }
    }
  }, [deleteNode, editor]);

  const runCode = useCallback(async () => {
    const code = node.textContent?.trim();
    if (!code) {
      setOutput("❌ No code to execute");
      return;
    }

    setIsRunning(true);
    setOutput("⏳ Running code...");

    try {
      let language = lang;
      let version = "latest";

      // Map our language values to Piston API language names
      if (lang === 'cpp') {
        language = 'cpp';
        version = '10.2.0';
      } else if (lang === 'c') {
        language = 'c';
        version = '10.2.0';
      } else if (lang === 'python') {
        language = 'python';
        version = '3.10.0';
      }

      // Use Piston API for all languages
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: language,
          version: version,
          files: [
            {
              content: code,
            },
          ],
        }),
      });

      const data = await response.json();
      if (data.run && data.run.output) {
        setOutput(`✅ Output:\n${data.run.output}`);
      } else if (data.run && data.run.stderr) {
        setOutput(`❌ Error:\n${data.run.stderr}`);
      } else {
        setOutput("❌ No output received");
      }
    } catch (error) {
      setOutput(`❌ Execution failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [node, lang]);

  return (
    <NodeViewWrapper className="custom-code-block">
      <div className="code-block-header">
        <div className="header-controls">
          <select value={lang} onChange={(e) => handleLanguageChange(e.target.value)}>
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          <div className="action-buttons">
            <button
              className={`action-btn copy-btn ${copied ? 'copied' : ''}`}
              onClick={copyToClipboard}
              title="Copy code"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            {(lang === 'python' || lang === 'c' || lang === 'cpp') && (
              <button
                className="action-btn run-btn"
                onClick={runCode}
                disabled={isRunning}
                title="Run code"
              >
                {isRunning ? <span style={{fontSize: '12px'}}>⏳</span> : <Play size={14} />}
              </button>
            )}
            <button
              className="action-btn delete-btn"
              onClick={handleDelete}
              title="Delete code block"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
      <NodeViewContent as="pre" className="code-content" />
      {output && (
        <div className="code-output">
          {output}
        </div>
      )}
    </NodeViewWrapper>
  );
});

const CustomCodeBlock = Node.create({
  name: "customCodeBlock",
  group: "block",
  content: "text*",
  code: true,
  marks: "",
  defining: true,
  addAttributes() {
    return {
      language: {
        default: "javascript",
      },
    };
  },
  parseHTML() {
    return [{ tag: "custom-code-block" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["custom-code-block", HTMLAttributes, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MemoizedCodeBlock, {
      contentDOMElementTag: 'pre',
    });
  },
  addCommands() {
    return {
      setCustomCodeBlock: (attributes) => ({ commands }) => {
        return commands.setNode(this.name, attributes);
      },
    };
  },
});

// Optimized toolbar with memoization
const Toolbar = React.memo(({ editor, isExpanded, onToggleExpanded, wordCount, saving, lastSaved }) => {
  if (!editor) return null;

  return (
    <ToolbarContainer>
      <ToolbarSection>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          $active={editor?.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          $active={editor?.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          $active={editor?.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          $active={editor?.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        
        <ToolbarDivider />
        
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          $active={editor?.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          $active={editor?.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          $active={editor?.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          $active={editor?.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          $active={editor?.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          $active={editor?.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().setCustomCodeBlock({ language: 'javascript' }).run()}
          title="Code Block"
        >
          <Code size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
        </ToolbarButton>
      </ToolbarSection>
      
      <ToolbarSection>
        <StatusInfo>
          <span>{wordCount} words</span>
          {saving && (
            <>
              <StatusDot $saving />
              <span>Saving...</span>
            </>
          )}
          {lastSaved && !saving && (
            <>
              <Clock size={12} />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </>
          )}
        </StatusInfo>
        
        <ToolbarButton
          onClick={() => {
            try {
              onToggleExpanded?.();
            } catch (error) {
              console.error('Error toggling editor expansion:', error);
            }
          }}
          title={isExpanded ? "Collapse Editor" : "Expand Editor"}
        >
          {isExpanded ? <Minimize2 size={16} /> : <Expand size={16} />}
        </ToolbarButton>
      </ToolbarSection>
    </ToolbarContainer>
  );
});

const OptimizedWordEditor = ({ content = '', onChange, onAutoSave }) => {
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const editorRef = useRef(null);
  const commandPalette = useCommandPalette();

  // Memoized editor configuration to prevent unnecessary re-renders
  const editorConfig = useMemo(() => ({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        blockquote: true,
        strike: false,
      }),
      Underline,
      Strike,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'ordered-list',
        },
      }),
      ListItem,
      CustomCodeBlock,
      Extension.create({
        name: 'characterCount',
        addStorage() {
          return {
            characters: () => 0,
            words: () => 0,
          }
        },
        onUpdate() {
          const text = this.editor.getText();
          this.storage.characters = () => text.length;
          this.storage.words = () => text.split(/\s+/).filter(word => word.length > 0).length;
        },
      }),
    ],
    content: content || `<h1>Untitled Document</h1><p>Start writing your thoughts...</p>`,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
        spellcheck: 'true',
      },
      handleKeyDown: (view, event) => {
        // Add custom keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 'b':
              event.preventDefault();
              return true;
            case 'i':
              event.preventDefault();
              return true;
            case 'u':
              event.preventDefault();
              return true;
          }
        }
        return false;
      },
    },
  }), [content]);

  const editor = useEditor(editorConfig);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    async (htmlContent) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(async () => {
        if (onAutoSave && htmlContent) {
          setSaving(true);
          try {
            await onAutoSave(htmlContent);
            setLastSaved(new Date());
          } catch (error) {
            console.error('Auto-save failed:', error);
          } finally {
            setSaving(false);
          }
        }
      }, 2000); // Increased debounce time for better performance
    },
    [onAutoSave]
  );

  // Optimized update handler
  const handleEditorUpdate = useCallback(({ editor }) => {
    const htmlContent = editor.getHTML();
    
    if (onChange) {
      onChange(htmlContent);
    }

    // Update word count efficiently
    const text = editor.getText();
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);

    // Auto-expand logic with hysteresis to prevent flickering
    if (words > 300 && !isExpanded) {
      setIsExpanded(true);
    } else if (words <= 150 && isExpanded) {
      setIsExpanded(false);
    }

    // Debounced auto-save
    debouncedAutoSave(htmlContent);
  }, [onChange, debouncedAutoSave, isExpanded]);

  // Set up editor event handlers
  useEffect(() => {
    if (editor) {
      editor.on('update', handleEditorUpdate);
      editor.on('focus', () => setIsFocused(true));
      editor.on('blur', () => setIsFocused(false));

      return () => {
        editor.off('update', handleEditorUpdate);
        editor.off('focus');
        editor.off('blur');
      };
    }
  }, [editor, handleEditorUpdate]);

  // Register with command palette
  useEffect(() => {
    if (commandPalette?.registerEditor && editor) {
      commandPalette.registerEditor(editor);
    }
  }, [commandPalette, editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const toggleExpanded = useCallback(() => {
    try {
      setIsExpanded(prev => !prev);
    } catch (error) {
      console.error('Error in toggleExpanded:', error);
    }
  }, []);

  if (!editor) {
    return (
      <LoadingContainer>
        <div className="spinner" />
        <span>Loading editor...</span>
      </LoadingContainer>
    );
  }

  return (
    <DocumentContainer $isExpanded={isExpanded} $isFocused={isFocused}>
      <Toolbar 
        editor={editor}
        isExpanded={isExpanded}
        onToggleExpanded={toggleExpanded}
        wordCount={wordCount}
        saving={saving}
        lastSaved={lastSaved}
      />
      
      <EditorContainer ref={editorRef} $isExpanded={isExpanded}>
        <EditorContent editor={editor} />
        
      </EditorContainer>
      
      <StatusBar>
        <div>
          {wordCount > 0 && (
            <span>{wordCount} words • {Math.ceil(wordCount / 250)} min read</span>
          )}
        </div>
        <div>
          {saving ? (
            <SaveStatus $saving>
              <div className="spinner" />
              Saving...
            </SaveStatus>
          ) : lastSaved ? (
            <SaveStatus>
              <Save size={12} />
              Saved {lastSaved.toLocaleTimeString()}
            </SaveStatus>
          ) : null}
        </div>
      </StatusBar>
    </DocumentContainer>
  );
};

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 1rem;
  color: #6b7280;

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const DocumentContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: ${props => props.$isExpanded ? '100vh' : 'auto'};
  min-height: ${props => props.$isExpanded ? '100vh' : '600px'};
  background: ${props => props.theme?.isDark ? '#1e293b' : '#ffffff'};
  border-radius: ${props => props.$isExpanded ? '0' : '1rem'};
  border: 1px solid ${props => props.$isFocused ? '#3b82f6' : props.theme?.isDark ? '#374151' : '#e5e7eb'};
  box-shadow: ${props => props.$isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: ${props => props.$isExpanded ? 'fixed' : 'relative'};
  top: ${props => props.$isExpanded ? '0' : 'auto'};
  left: ${props => props.$isExpanded ? '0' : 'auto'};
  right: ${props => props.$isExpanded ? '0' : 'auto'};
  bottom: ${props => props.$isExpanded ? '0' : 'auto'};
  z-index: ${props => props.$isExpanded ? '9999' : '1'};
  overflow: hidden;
`;

const ToolbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${props => props.theme?.isDark ? '#374151' : '#e5e7eb'};
  background: ${props => props.theme?.isDark ? '#1f2937' : '#f9fafb'};
  flex-shrink: 0;
`;

const ToolbarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: ${props => props.$active ? '#3b82f6' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : props.theme?.isDark ? '#e5e7eb' : '#374151'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${props => props.$active ? '#2563eb' : props.theme?.isDark ? '#374151' : '#e5e7eb'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 20px;
  background: ${props => props.theme?.isDark ? '#374151' : '#e5e7eb'};
  margin: 0 0.5rem;
`;

const StatusInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${props => props.theme?.isDark ? '#9ca3af' : '#6b7280'};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$saving ? '#f59e0b' : '#10b981'};
  animation: ${props => props.$saving ? 'pulse 1.5s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  position: relative;
  padding: ${props => props.$isExpanded ? '2rem' : '1.5rem'};

  .ProseMirror {
    outline: none;
    min-height: ${props => props.$isExpanded ? 'calc(100vh - 200px)' : '400px'};
    
    h1, h2, h3, h4, h5, h6 {
      color: ${props => props.theme?.isDark ? '#f1f5f9' : '#1e293b'};
      margin: 1.5rem 0 0.75rem 0;
      line-height: 1.2;
    }

    h1 { font-size: 2.25rem; font-weight: 800; }
    h2 { font-size: 1.875rem; font-weight: 700; }
    h3 { font-size: 1.5rem; font-weight: 600; }

    p {
      color: ${props => props.theme?.isDark ? '#e2e8f0' : '#374151'};
      line-height: 1.7;
      margin: 0.75rem 0;
    }

    ul, ol {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    li {
      margin: 0.25rem 0;
      color: ${props => props.theme?.isDark ? '#e2e8f0' : '#374151'};
    }

    blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: ${props => props.theme?.isDark ? '#94a3b8' : '#6b7280'};
    }

    .custom-code-block {
      margin: 1rem 0;
      border-radius: 8px;
      overflow: hidden;
      background: ${props => props.theme?.isDark ? '#0f172a' : '#f8fafc'};
      border: 1px solid ${props => props.theme?.isDark ? '#1e293b' : '#e2e8f0'};

      .code-block-header {
        padding: 0.5rem 1rem;
        background: ${props => props.theme?.isDark ? '#1e293b' : '#e2e8f0'};
        border-bottom: 1px solid ${props => props.theme?.isDark ? '#334155' : '#cbd5e1'};

        .header-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        select {
          background: transparent;
          border: none;
          color: ${props => props.theme?.isDark ? '#e2e8f0' : '#374151'};
          font-size: 0.875rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: transparent;
          border: 1px solid ${props => props.theme?.isDark ? '#475569' : '#cbd5e1'};
          color: ${props => props.theme?.isDark ? '#e2e8f0' : '#374151'};
          padding: 0.375rem 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s ease;

          &:hover {
            background: ${props => props.theme?.isDark ? '#475569' : '#f1f5f9'};
            border-color: ${props => props.theme?.isDark ? '#64748b' : '#94a3b8'};
          }

          &.copy-btn {
            &:hover {
              background: #16a34a;
              border-color: #16a34a;
              color: white;
            }

            &.copied {
              background: #16a34a;
              border-color: #16a34a;
              color: white;
            }
          }

          &.run-btn {
            background: #3b82f6;
            border-color: #3b82f6;
            color: white;

            &:hover {
              background: #2563eb;
              border-color: #2563eb;
            }

            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          }

          &.delete-btn {
            &:hover {
              background: #dc2626;
              border-color: #dc2626;
              color: white;
            }
          }
        }
      }

      .code-output {
        padding: 0.75rem 1rem;
        background: ${props => props.theme?.isDark ? '#111827' : '#f1f5f9'};
        border-top: 1px solid ${props => props.theme?.isDark ? '#374151' : '#d1d5db'};
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.8rem;
        color: ${props => props.theme?.isDark ? '#d1d5db' : '#4b5563'};
        white-space: pre-wrap;
        max-height: 200px;
        overflow-y: auto;
      }

      .code-content {
        padding: 1rem;
        background: ${props => props.theme?.isDark ? '#0f172a' : '#f8fafc'};
        color: ${props => props.theme?.isDark ? '#e2e8f0' : '#374151'};
        font-family: 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-x: auto;
      }
    }
  }
`;

const PlaceholderOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: ${props => props.theme?.isDark ? '#6b7280' : '#9ca3af'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: ${props => props.theme?.isDark ? '#9ca3af' : '#6b7280'};
    transform: translate(-50%, -50%) scale(1.05);
  }

  h3 {
    margin: 1rem 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
  }
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-top: 1px solid ${props => props.theme?.isDark ? '#374151' : '#e5e7eb'};
  background: ${props => props.theme?.isDark ? '#1f2937' : '#f9fafb'};
  font-size: 0.75rem;
  color: ${props => props.theme?.isDark ? '#9ca3af' : '#6b7280'};
  flex-shrink: 0;
`;

const SaveStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${props => props.$saving ? '#f59e0b' : '#10b981'};

  .spinner {
    width: 12px;
    height: 12px;
    border: 1px solid currentColor;
    border-top: 1px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
`;

export default OptimizedWordEditor;
