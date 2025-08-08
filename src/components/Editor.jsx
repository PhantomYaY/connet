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
import CodeBlock from "@tiptap/extension-code-block";
import { Node } from "@tiptap/core";

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

  const runCode = async () => {
    setOutput("⏳ Running...");
    const code = props.node.textContent;

    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: lang,
          source: code,
        }),
      });

      const result = await response.json();

      setOutput(
        result?.run?.output?.trim() ||
          result?.run?.stdout?.trim() ||
          result?.run?.stderr?.trim() ||
          "✅ Finished with no output"
      );
    } catch (err) {
      setOutput("❌ Failed to run code");
    }
  };

  const removeBlock = () => {
    props.deleteNode();
  };

  return (
    <NodeViewWrapper className="glass-code-block">
      <div style={styles.codeBlockWrapper}>
        <div style={styles.codeBlockToolbar}>
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value);
              props.updateAttributes({ language: e.target.value });
            }}
            style={styles.langSelect}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>
          <div style={styles.buttonGroup}>
            <button onClick={runCode} style={styles.runButton}>
              ▶ Run
            </button>
            <button onClick={removeBlock} style={styles.deleteButton}>
              ✕
            </button>
          </div>
        </div>
        <NodeViewContent as="pre" style={styles.codeContent} />
        {output && (
          <div style={styles.outputSection}>
            <div style={styles.outputHeader}>Output:</div>
            <pre style={styles.outputContent}>{output}</pre>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

const Editor = ({ content = '', onChange }) => {
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
    content: content || `<p>Start writing your document here...</p>`,
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
    editor
      .chain()
      .focus()
      .insertContent({
        type: "customCodeBlock",
        attrs: { language: "python" },
        content: [{ type: "text", text: "# Write Python code here" }],
      })
      .run();
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.toolbar}>
        <ToolbarButton
          label="B"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor?.isActive("bold")}
          style={{ fontWeight: "bold" }}
        />
        <ToolbarButton
          label="I"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor?.isActive("italic")}
          style={{ fontStyle: "italic" }}
        />
        <ToolbarButton
          label="U"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor?.isActive("underline")}
          style={{ textDecoration: "underline" }}
        />
        <ToolbarButton
          label="S"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor?.isActive("strike")}
          style={{ textDecoration: "line-through" }}
        />
        <select
          style={styles.select}
          value={
            editor?.isActive("heading", { level: 1 })
              ? "h1"
              : editor?.isActive("heading", { level: 2 })
              ? "h2"
              : editor?.isActive("heading", { level: 3 })
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
        </select>
        <ToolbarButton
          label="• List"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor?.isActive("bulletList")}
        />
        <ToolbarButton label="Code" onClick={insertCodeBlock} />
        <ToolbarButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />
      </div>
      <div style={styles.pageWrapper}>
        <EditorContent editor={editor} style={styles.editorContent} />
      </div>
    </div>
  );
};

const ToolbarButton = ({ label, onClick, active, disabled, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      ...styles.button,
      ...(active ? styles.activeButton : {}),
      ...(disabled ? styles.disabledButton : {}),
      ...style,
    }}
  >
    {label}
  </button>
);

const styles = {
  wrapper: {
    background: "transparent",
    minHeight: "100%",
    padding: "0",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#1e293b",
  },
  toolbar: {
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(12px)",
    padding: "12px 16px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    marginBottom: "24px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
    border: "1px solid rgba(226, 232, 240, 0.8)",
  },
  button: {
    padding: "8px 12px",
    fontSize: "14px",
    background: "rgba(248, 250, 252, 0.8)",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#475569",
    transition: "all 0.2s ease",
    fontWeight: "500",
  },
  activeButton: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
    color: "white",
  },
  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  select: {
    padding: "8px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    background: "rgba(248, 250, 252, 0.8)",
    color: "#475569",
    cursor: "pointer",
    fontWeight: "500",
  },
  pageWrapper: {
    display: "flex",
    justifyContent: "center",
    paddingBottom: "60px",
  },
  editorContent: {
    background: "white",
    width: "100%",
    maxWidth: "800px",
    minHeight: "500px",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    fontSize: "16px",
    lineHeight: "1.7",
    color: "#1e293b",
    outline: "none",
    fontFamily: "'Georgia', serif",
    border: "1px solid rgba(226, 232, 240, 0.8)",
  },
  codeBlockWrapper: {
    borderRadius: "12px",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    background: "rgba(248, 250, 252, 0.5)",
    backdropFilter: "blur(8px)",
    margin: "20px 0",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  codeBlockToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "rgba(248, 250, 252, 0.8)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
  },
  langSelect: {
    fontSize: "13px",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    background: "white",
    color: "#475569",
    fontWeight: "500",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
  },
  runButton: {
    fontSize: "13px",
    padding: "6px 12px",
    borderRadius: "6px",
    background: "#10b981",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.2s ease",
  },
  deleteButton: {
    fontSize: "13px",
    padding: "6px 12px",
    borderRadius: "6px",
    background: "#ef4444",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.2s ease",
  },
  codeContent: {
    padding: "20px",
    fontSize: "14px",
    fontFamily: "'JetBrains Mono', 'Monaco', 'Consolas', monospace",
    whiteSpace: "pre-wrap",
    color: "#1e293b",
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "none",
    minHeight: "100px",
  },
  outputSection: {
    borderTop: "1px solid rgba(226, 232, 240, 0.8)",
    background: "rgba(241, 245, 249, 0.5)",
  },
  outputHeader: {
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    borderBottom: "1px solid rgba(226, 232, 240, 0.5)",
  },
  outputContent: {
    padding: "16px",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', 'Monaco', 'Consolas', monospace",
    color: "#1e293b",
    background: "transparent",
    margin: 0,
    whiteSpace: "pre-wrap",
    maxHeight: "200px",
    overflowY: "auto",
  },
};

export default Editor;
