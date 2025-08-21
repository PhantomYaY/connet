import React, { useState, useEffect, useRef } from "react";
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
import InlineGoogleLoader from "./InlineGoogleLoader";
import DotsLoader from "./DotsLoader";
import AIInlineSuggestions from "./AIInlineSuggestions";
import AITextMenu from "./AITextMenu";
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
  ChevronDown,
  Type,
  Palette,
  Heading1,
  Heading2,
  Heading3,
  FileText,
  Link,
  Image,
  Plus
} from 'lucide-react';

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
        default: "python",
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
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});

const CodeBlockComponent = (props) => {
  const [lang, setLang] = useState(props.node.attrs.language || "python");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const languageMap = {
    python: "python",
    cpp: "cpp",
    c: "c"
  };

  const runCode = async () => {
    const code = props.node.textContent?.trim();
    if (!code) {
      setOutput("❌ No code to execute");
      return;
    }

    setIsRunning(true);
    setOutput("⏳ Running code...");

    try {
      if (languageMap[lang]) {
        // Use Piston API for all supported languages
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: languageMap[lang],
            version: "*",
            files: [
              {
                content: code,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.run) {
          const stdout = result.run.stdout?.trim();
          const stderr = result.run.stderr?.trim();

          if (stderr) {
            setOutput(`❌ Error:\n${stderr}`);
          } else if (stdout) {
            setOutput(`✅ Output:\n${stdout}`);
          } else {
            setOutput("✅ Code executed successfully (no output)");
          }
        } else {
          setOutput("❌ Execution failed - no result returned");
        }
      } else {
        setOutput("❌ Code execution not supported for this language");
      }
    } catch (error) {
      console.error("Code execution error:", error);
      setOutput(`❌ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const removeBlock = () => {
    props.deleteNode();
  };

  const copyCode = async () => {
    const code = props.node.textContent?.trim();
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  };

  const updateLanguage = (newLang) => {
    setLang(newLang);
    props.updateAttributes({ language: newLang });
  };

  return (
    <NodeViewWrapper>
      <CodeBlockContainer>
        <CodeBlockHeader>
          <LanguageSelect
            value={lang}
            onChange={(e) => updateLanguage(e.target.value)}
            disabled={isRunning}
          >
            <option value="python">🐍 Python</option>
            <option value="cpp">⚡ C++</option>
            <option value="c">🔧 C</option>
          </LanguageSelect>
          <ButtonGroup>
            <RunButton
              onClick={runCode}
              disabled={isRunning}
              style={{ opacity: isRunning ? 0.6 : 1 }}
            >
              {isRunning ? "..." : "Run"}
            </RunButton>
            <DeleteButton onClick={removeBlock}>
              ×
            </DeleteButton>
          </ButtonGroup>
        </CodeBlockHeader>
        <CodeContent as={NodeViewContent} />
        {output && (
          <OutputSection>
            <OutputHeader>Output:</OutputHeader>
            <OutputContent>{output}</OutputContent>
          </OutputSection>
        )}
      </CodeBlockContainer>
    </NodeViewWrapper>
  );
};

const WordEditor = ({ content = '', onChange, onAutoSave, fullWidth = false }) => {
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestionsPosition, setAiSuggestionsPosition] = useState({ x: 0, y: 0 });
  const [showAITextMenu, setShowAITextMenu] = useState(false);
  const [aiTextMenuPosition, setAiTextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const autoSaveTimeoutRef = useRef(null);
  const editorRef = useRef(null);
  const commandPalette = useCommandPalette();
  const { registerEditor } = commandPalette || {};

  const editor = useEditor({
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
      BulletList,
      OrderedList,
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
    content: content || `<h1>Untitled Document</h1><p>Start writing your document...</p>`,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }

      // Update word count and check for expansion
      const text = editor.getText();
      const words = text.split(/\s+/).filter(word => word.length > 0).length;
      setWordCount(words);

      // Auto-expand when content gets substantial
      if (words > 500 && !isExpanded) {
        setIsExpanded(true);
      } else if (words <= 200 && isExpanded) {
        setIsExpanded(false);
      }

      // Auto-save functionality
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(async () => {
        if (onAutoSave) {
          setSaving(true);
          try {
            await onAutoSave(editor.getHTML());
            setLastSaved(new Date());
          } catch (error) {
            console.error('Auto-save failed:', error);
          } finally {
            setSaving(false);
          }
        }
      }, 1000); // Auto-save after 1 second of inactivity
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        // Text is selected, show toolbar and AI text menu
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        const rect = editorRef.current?.getBoundingClientRect();
        const selectedContent = editor.state.doc.textBetween(from, to);

        if (rect && selectedContent.trim()) {
          setToolbarPosition({
            x: (start.left + end.left) / 2 - rect.left,
            y: start.top - rect.top - 60
          });
          setShowToolbar(true);

          // Show AI text menu for longer selections
          if (selectedContent.length > 5) {
            setSelectedText(selectedContent);
            setAiTextMenuPosition({
              x: (start.left + end.left) / 2 - rect.left,
              y: end.bottom - rect.top + 10
            });
            setShowAITextMenu(true);
          }
        }
      } else {
        // No selection, hide toolbar and AI menu
        setTimeout(() => {
          setShowToolbar(false);
          setShowAITextMenu(false);
          setSelectedText('');
          setShowAISuggestions(false);
        }, 200);
      }
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Register editor with command palette
  useEffect(() => {
    if (editor && registerEditor) {
      registerEditor(editor);
    }
  }, [editor, registerEditor]);

  // Listen for custom command events
  useEffect(() => {
    const handleInsertCodeBlock = () => {
      if (editor) {
        insertCodeBlock();
      }
    };

    const handleSaveNote = () => {
      if (onAutoSave && editor) {
        onAutoSave(editor.getHTML());
      }
    };

    window.addEventListener('insertCodeBlock', handleInsertCodeBlock);
    window.addEventListener('saveNote', handleSaveNote);

    return () => {
      window.removeEventListener('insertCodeBlock', handleInsertCodeBlock);
      window.removeEventListener('saveNote', handleSaveNote);
    };
  }, [editor, onAutoSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const insertCodeBlock = () => {
    editor.chain().focus().insertContent('<custom-code-block></custom-code-block>').run();
  };

  const handleAITextInsert = (text) => {
    if (editor && selectedText) {
      // Replace selected text with AI-generated content
      const { from, to } = editor.state.selection;
      editor.chain().focus().insertContentAt({ from, to }, text).run();
    } else if (editor) {
      // Insert at current cursor position
      editor.chain().focus().insertContent(text).run();
    }
  };

  const handleAITextReplace = (text) => {
    if (editor && selectedText) {
      const { from, to } = editor.state.selection;
      editor.chain().focus().deleteRange({ from, to }).insertContent(text).run();
    }
  };

  const handleAISuggestionInsert = (text) => {
    if (editor) {
      editor.chain().focus().insertContent(text).run();
    }
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <InlineGoogleLoader size={80} />
      </div>
    );
  }

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    return `Last saved at ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <EditorWrapper ref={editorRef}>
      {/* Main Formatting Toolbar */}
      <MainToolbar>
        {/* Style Section */}
        <ToolbarSection>
          <ToolbarButton
            $active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("paragraph")}
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Normal Text"
          >
            <FileText size={16} />
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarDivider />

        {/* Text Formatting */}
        <ToolbarSection>
          <ToolbarButton
            $active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarDivider />

        {/* Lists and Structure */}
        <ToolbarSection>
          <ToolbarButton
            $active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
          >
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={insertCodeBlock}
            title="Insert Code Block"
          >
            <Code size={16} />
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarDivider />

        {/* Actions */}
        <ToolbarSection>
          <ToolbarButton
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </ToolbarButton>
        </ToolbarSection>
      </MainToolbar>

      {/* Contextual Floating Toolbar - Only shows on text selection */}
      {showToolbar && (
        <ContextualToolbar
          style={{
            left: `${toolbarPosition.x}px`,
            top: `${toolbarPosition.y}px`,
          }}
          onMouseEnter={() => setShowToolbar(true)}
          onMouseLeave={() => setShowToolbar(false)}
        >
          <ToolbarButton
            $active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          <StyleSelect
            value={
              editor.isActive("heading", { level: 1 }) ? "h1" :
              editor.isActive("heading", { level: 2 }) ? "h2" :
              editor.isActive("heading", { level: 3 }) ? "h3" : "p"
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value.startsWith('h')) {
                const level = parseInt(value.charAt(1));
                editor.chain().focus().setHeading({ level }).run();
              } else {
                editor.chain().focus().setParagraph().run();
              }
            }}
          >
            <option value="p">Body</option>
            <option value="h1">Title</option>
            <option value="h2">Heading</option>
            <option value="h3">Subheading</option>
          </StyleSelect>
        </ContextualToolbar>
      )}

      {/* Status Bar */}
      <StatusBar>
        <StatusLeft>
          {saving ? (
            <SaveIndicator $saving={true}>Saving...</SaveIndicator>
          ) : lastSaved ? (
            <SaveIndicator>{formatLastSaved()}</SaveIndicator>
          ) : null}
        </StatusLeft>
        <StatusRight>
          <StatusInfo>Words: {editor.storage.characterCount?.words() || 0} | Characters: {editor.storage.characterCount?.characters() || 0}</StatusInfo>
        </StatusRight>
      </StatusBar>

      {/* Document Area */}
      <DocumentContainer>
        <DocumentPage className={isExpanded ? 'expanded' : ''}>
          <EditorContent editor={editor} />
          {wordCount > 0 && (
            <ContentMetrics>
              <span>{wordCount} words</span>
              {wordCount > 500 && <span className="expanded-indicator">📄 Expanded view</span>}
            </ContentMetrics>
          )}
        </DocumentPage>
      </DocumentContainer>

      {/* AI Text Menu for Selected Text */}
      {showAITextMenu && (
        <AITextMenu
          selectedText={selectedText}
          position={aiTextMenuPosition}
          onApply={handleAITextReplace}
          onClose={() => {
            setShowAITextMenu(false);
            setSelectedText('');
          }}
        />
      )}

      {/* AI Inline Suggestions */}
      {showAISuggestions && (
        <AIInlineSuggestions
          content={content}
          position={aiSuggestionsPosition}
          selectedText={selectedText}
          onInsert={handleAISuggestionInsert}
          onClose={() => setShowAISuggestions(false)}
        />
      )}
    </EditorWrapper>
  );
};

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(20px);
  
  .dark & {
    background: rgba(15, 23, 42, 0.8);
  }
`;

const ContextualToolbar = styled.div`
  position: absolute;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  padding: 6px 10px;
  width: fit-content;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transform: translateX(-50%);
  animation: fadeIn 0.2s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(15, 23, 42, 0.95);
  }

  .dark & {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;

const MainToolbar = styled.div`
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(203, 213, 225, 0.3);
  padding: 12px 20px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  .dark & {
    background: rgba(30, 41, 59, 0.95);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }
`;

const ToolbarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 24px;
  background: rgba(203, 213, 225, 0.4);

  .dark & {
    background: rgba(148, 163, 184, 0.3);
  }
`;

const StyleSelect = styled.select`
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  min-width: 80px;
  color: rgba(226, 232, 240, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(59, 130, 246, 0.1);
  }

  &:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  option {
    background: #1e293b;
    color: #e2e8f0;
  }
`;

const ToolbarButton = styled.button`
  background: ${props => props.$active ? 'rgba(59, 130, 246, 0.15)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(59, 130, 246, 0.3)' : 'transparent'};
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.$active ? '#3b82f6' : 'rgba(71, 85, 105, 0.7)'};
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;

  &:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .dark & {
    color: ${props => props.$active ? '#60a5fa' : 'rgba(226, 232, 240, 0.7)'};

    &:hover:not(:disabled) {
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.15);
    }
  }
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(203, 213, 225, 0.3);
  font-size: 12px;
  
  .dark & {
    background: rgba(30, 41, 59, 0.6);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }
`;

const StatusLeft = styled.div``;

const StatusRight = styled.div``;

const SaveIndicator = styled.span`
  color: ${props => props.$saving ? '#f59e0b' : '#10b981'};
  font-weight: 500;
`;

const StatusInfo = styled.span`
  color: rgba(71, 85, 105, 0.6);
  
  .dark & {
    color: rgba(148, 163, 184, 0.6);
  }
`;

const DocumentContainer = styled.div`
  flex: 1;
  padding: 20px;
  background: rgba(241, 245, 249, 0.5);
  overflow-y: auto;
  display: flex;
  justify-content: center;
  transition: all 0.3s ease;

  .dark & {
    background: rgba(15, 23, 42, 0.5);
  }

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const DocumentPage = styled.div`
  width: 100%;
  max-width: min(180mm, calc(100vw - 40px)); /* Responsive max-width */
  min-height: calc(100vh - 200px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 60px min(80px, 5vw); /* Responsive padding */
  margin: 0 auto 40px;
  position: relative;
  transition: all 0.3s ease;

  /* Dynamic width based on content */
  &.expanded {
    max-width: min(220mm, calc(100vw - 40px));
  }

  /* Improved mobile experience */
  @media (max-width: 768px) {
    padding: 40px 20px;
    margin: 0 auto 20px;
    border-radius: 8px;
    min-height: calc(100vh - 140px);
  }

  @media (max-width: 480px) {
    padding: 30px 15px;
    margin: 0 auto 10px;
  }

  .dark & {
    background: rgba(30, 41, 59, 0.95);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }

  .ProseMirror {
    outline: none;
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: clamp(14px, 2.5vw, 18px); /* Responsive font size */
    line-height: 1.7; /* Improved line spacing */
    color: rgba(15, 23, 42, 0.9);
    min-height: 300px; /* Increased minimum height */
    padding: 20px 0; /* Add vertical padding */
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    
    .dark & {
      color: rgba(226, 232, 240, 0.9);
    }

    h1 {
      color: #1e40af;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 1.5rem 0 1rem 0;
      line-height: 1.2;
      
      .dark & {
        color: #60a5fa;
      }
    }

    h2 {
      color: #1e40af;
      font-size: 2rem;
      font-weight: 600;
      margin: 1.25rem 0 0.75rem 0;
      line-height: 1.3;
      
      .dark & {
        color: #60a5fa;
      }
    }

    h3 {
      color: #1e40af;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 1rem 0 0.5rem 0;
      line-height: 1.4;
      
      .dark & {
        color: #60a5fa;
      }
    }

    h4, h5, h6 {
      color: #1e40af;
      font-weight: 600;
      margin: 0.75rem 0 0.25rem 0;
      
      .dark & {
        color: #60a5fa;
      }
    }

    h4 { font-size: 1.25rem; }
    h5 { font-size: 1.125rem; }
    h6 { font-size: 1rem; }

    p {
      margin: 0.75rem 0;
      text-align: justify;
    }

    ul, ol {
      padding-left: 1.5rem;
      margin: 1rem 0;

      li {
        margin: 0.5rem 0;
      }
    }

    ul li {
      list-style-type: disc;
    }

    ol li {
      list-style-type: decimal;
    }

    blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: rgba(71, 85, 105, 0.8);
      background: rgba(59, 130, 246, 0.05);
      border-radius: 0 8px 8px 0;
      padding: 1rem 1rem 1rem 1.5rem;

      .dark & {
        border-left-color: #60a5fa;
        color: rgba(148, 163, 184, 0.8);
        background: rgba(59, 130, 246, 0.1);
      }

      p {
        margin: 0;
      }
    }

    strong {
      font-weight: 700;
    }

    em {
      font-style: italic;
    }

    u {
      text-decoration: underline;
    }

    s {
      text-decoration: line-through;
    }
  }
`;

// Code block styles
const CodeBlockContainer = styled.div`
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  margin: 16px 0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const CodeBlockHeader = styled.div`
  background: rgba(51, 65, 85, 0.8);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LanguageSelect = styled.select`
  background: rgba(30, 41, 59, 0.8);
  color: rgba(226, 232, 240, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const RunButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #2563eb;
  }
`;

const DeleteButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #dc2626;
  }
`;

const CodeContent = styled.pre`
  background: rgba(15, 23, 42, 0.9);
  color: rgba(226, 232, 240, 0.9);
  padding: 16px;
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace;
  font-size: 14px;
  line-height: 1.5;
  border: none;
  outline: none;
  white-space: pre-wrap;
  min-height: 80px;
`;

const OutputSection = styled.div`
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.8);
`;

const OutputHeader = styled.div`
  background: rgba(51, 65, 85, 0.6);
  color: rgba(226, 232, 240, 0.8);
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
`;

const OutputContent = styled.pre`
  background: rgba(15, 23, 42, 0.9);
  color: #10b981;
  padding: 12px;
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  max-height: 200px;
  overflow: auto;
`;

const ContentMetrics = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: rgba(107, 114, 128, 0.8);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  .dark & {
    background: rgba(30, 41, 59, 0.9);
    color: rgba(156, 163, 175, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .expanded-indicator {
    color: #059669;
    font-weight: 500;

    .dark & {
      color: #10b981;
    }
  }

  @media (max-width: 768px) {
    bottom: 10px;
    right: 10px;
    font-size: 0.7rem;
    padding: 0.375rem 0.75rem;
  }
`;

export default WordEditor;
