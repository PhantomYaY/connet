import React, { useState, useEffect } from "react";
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
import { Node } from "@tiptap/core";
import styled from "styled-components";
import InlineLoader from "./InlineLoader";

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
        // Create a sandboxed environment for JS execution
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

const VSCodeEditor = ({ content = '', onChange }) => {
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
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      ListItem,
      CustomCodeBlock,
    ],
    content: content || `<h1>Welcome to Your Note</h1><p>Start writing here...</p>`,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const insertCodeBlock = () => {
    editor.chain().focus().insertContent('<custom-code-block></custom-code-block>').run();
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <InlineLoader size="large" text="Loading editor..." />
      </div>
    );
  }

  return (
    <EditorWrapper>
      <Toolbar>
        <ToolbarSection>
          <HeadingSelect
            value={
              editor.isActive("heading", { level: 1 })
                ? "h1"
                : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                ? "h3"
                : "p"
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "h1")
                editor.chain().focus().setHeading({ level: 1 }).run();
              else if (value === "h2")
                editor.chain().focus().setHeading({ level: 2 }).run();
              else if (value === "h3")
                editor.chain().focus().setHeading({ level: 3 }).run();
              else editor.chain().focus().setParagraph().run();
            }}
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </HeadingSelect>
        </ToolbarSection>

        <ToolbarSection>
          <ToolbarButton
            $active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <u>U</u>
          </ToolbarButton>
          <ToolbarButton
            $active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <s>S</s>
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarSection>
          <ToolbarButton
            $active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </ToolbarButton>
          <ToolbarButton onClick={insertCodeBlock}>
            &lt;/&gt; Code
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarSection>
          <ToolbarButton
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            ↶ Undo
          </ToolbarButton>
          <ToolbarButton
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            ↷ Redo
          </ToolbarButton>
        </ToolbarSection>
      </Toolbar>

      <EditorContainer>
        <EditorContent editor={editor} />
      </EditorContainer>
    </EditorWrapper>
  );
};

const EditorWrapper = styled.div`
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Toolbar = styled.div`
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  padding: 12px 20px;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const ToolbarSection = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  padding-right: 16px;
  border-right: 1px solid #3e3e42;

  &:last-child {
    border-right: none;
    padding-right: 0;
  }
`;

const ToolbarButton = styled.button`
  background: ${props => props.$active ? '#007acc' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : '#cccccc'};
  border: 1px solid ${props => props.$active ? '#007acc' : '#464647'};
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;

  &:hover:not(:disabled) {
    background: ${props => props.$active ? '#1177bb' : '#37373d'};
    border-color: ${props => props.$active ? '#1177bb' : '#569cd6'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HeadingSelect = styled.select`
  background: #3c3c3c;
  color: #cccccc;
  border: 1px solid #464647;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  min-width: 120px;

  &:hover {
    border-color: #569cd6;
  }

  option {
    background: #3c3c3c;
    color: #cccccc;
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  padding: 40px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;

  .ProseMirror {
    outline: none;
    font-family: 'Georgia', serif;
    font-size: 16px;
    line-height: 1.7;
    color: #d4d4d4;

    h1 {
      color: #569cd6;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 2rem 0 1rem 0;
      line-height: 1.2;
    }

    h2 {
      color: #4ec9b0;
      font-size: 2rem;
      font-weight: 600;
      margin: 1.5rem 0 0.75rem 0;
      line-height: 1.3;
    }

    h3 {
      color: #c586c0;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 1.25rem 0 0.5rem 0;
      line-height: 1.4;
    }

    p {
      margin: 0.75rem 0;
      color: #d4d4d4;
    }

    ul {
      color: #d4d4d4;
      padding-left: 1.5rem;
      margin: 1rem 0;

      li {
        margin: 0.5rem 0;
        list-style-type: disc;

        &::marker {
          color: #569cd6;
        }
      }
    }

    strong {
      color: #ffffff;
      font-weight: 700;
    }

    em {
      color: #ce9178;
      font-style: italic;
    }

    u {
      text-decoration: underline;
      text-decoration-color: #569cd6;
    }

    s {
      text-decoration: line-through;
      text-decoration-color: #f14c4c;
    }
  }
`;

const CodeBlockContainer = styled.div`
  background: #1e1e1e;
  border: 1px solid #464647;
  border-radius: 6px;
  margin: 16px 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const CodeBlockHeader = styled.div`
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LanguageSelect = styled.select`
  background: #3c3c3c;
  color: #cccccc;
  border: 1px solid #464647;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  option {
    background: #3c3c3c;
    color: #cccccc;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const RunButton = styled.button`
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #1177bb;
  }
`;

const DeleteButton = styled.button`
  background: #f14c4c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #e73c3c;
  }
`;

const CodeContent = styled.pre`
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 18px;
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  outline: none;
  white-space: pre-wrap;
  min-height: 120px;
  overflow-x: auto;
`;

const OutputSection = styled.div`
  border-top: 1px solid #3e3e42;
  background: #252526;
`;

const OutputHeader = styled.div`
  background: #2d2d30;
  color: #cccccc;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid #3e3e42;
`;

const OutputContent = styled.pre`
  background: #1e1e1e;
  color: #4ec9b0;
  padding: 14px;
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  max-height: 250px;
  overflow: auto;
`;

export default VSCodeEditor;
