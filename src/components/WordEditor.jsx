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
import ListItem from "@tiptap/extension-list-item";
import { Extension, Node } from "@tiptap/core";
import styled from "styled-components";
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
  Palette
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
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});

const CodeBlockComponent = (props) => {
  const [lang, setLang] = useState(props.node.attrs.language || "javascript");
  const [output, setOutput] = useState("");

  const runCode = async () => {
    setOutput("⏳ Running...");
    const code = props.node.textContent;

    try {
      if (lang === "javascript") {
        const result = new Function(code)();
        setOutput(result ? String(result) : "Code executed successfully");
      } else {
        setOutput("Code execution not supported for this language");
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const removeBlock = () => {
    props.deleteNode();
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
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
          </LanguageSelect>
          <ButtonGroup>
            <RunButton onClick={runCode}>
              ▶ Run
            </RunButton>
            <DeleteButton onClick={removeBlock}>
              ✕
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

const WordEditor = ({ content = '', onChange, onAutoSave }) => {
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        listItem: false,
        codeBlock: false,
      }),
      Underline,
      Strike,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      BulletList,
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
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

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

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    return `Last saved at ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <EditorWrapper>
      {/* Minimal Floating Toolbar */}
      <FloatingToolbar>
        <ToolbarSection>
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
        </ToolbarSection>

        <ToolbarDivider />

        <ToolbarSection>
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
        </ToolbarSection>

        <ToolbarDivider />

        <ToolbarSection>
          <ToolbarButton
            $active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={insertCodeBlock}
            title="Insert Code Block"
          >
            <Code size={14} />
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarDivider />

        <ToolbarSection>
          <ToolbarButton
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={14} />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={14} />
          </ToolbarButton>
        </ToolbarSection>
      </FloatingToolbar>

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
        <DocumentPage>
          <EditorContent editor={editor} />
        </DocumentPage>
      </DocumentContainer>
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

const RibbonContainer = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(203, 213, 225, 0.3);
  
  .dark & {
    background: rgba(30, 41, 59, 0.9);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }
`;

const RibbonTab = styled.div`
  padding: 8px 16px 0;
`;

const TabName = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: rgba(71, 85, 105, 0.8);
  margin-bottom: 8px;
  
  .dark & {
    color: rgba(226, 232, 240, 0.8);
  }
`;

const RibbonContent = styled.div`
  display: flex;
  gap: 16px;
  padding-bottom: 8px;
`;

const RibbonGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 8px;
  border-right: 1px solid rgba(203, 213, 225, 0.3);
  
  &:last-child {
    border-right: none;
  }
  
  .dark & {
    border-right: 1px solid rgba(148, 163, 184, 0.2);
  }
`;

const GroupLabel = styled.div`
  font-size: 10px;
  color: rgba(71, 85, 105, 0.6);
  margin-bottom: 4px;
  text-align: center;
  
  .dark & {
    color: rgba(148, 163, 184, 0.6);
  }
`;

const GroupContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const FontControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FontSelect = styled.select`
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(203, 213, 225, 0.5);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  min-width: 120px;
  color: rgba(15, 23, 42, 0.9);
  
  .dark & {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.3);
    color: rgba(226, 232, 240, 0.9);
  }
`;

const FontRow = styled.div`
  display: flex;
  gap: 2px;
`;

const RibbonButton = styled.button`
  background: ${props => props.$active ? 'rgba(59, 130, 246, 0.2)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(59, 130, 246, 0.4)' : 'transparent'};
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.$active ? '#3b82f6' : 'rgba(71, 85, 105, 0.8)'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .dark & {
    color: ${props => props.$active ? '#60a5fa' : 'rgba(226, 232, 240, 0.8)'};
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
  
  .dark & {
    background: rgba(15, 23, 42, 0.5);
  }
`;

const DocumentPage = styled.div`
  width: 100%;
  max-width: 210mm; /* A4 width */
  min-height: 297mm; /* A4 height */
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 40px 60px;
  margin-bottom: 40px;
  
  .dark & {
    background: rgba(30, 41, 59, 0.95);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }

  .ProseMirror {
    outline: none;
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 16px;
    line-height: 1.6;
    color: rgba(15, 23, 42, 0.9);
    min-height: 200px;
    
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

export default WordEditor;
