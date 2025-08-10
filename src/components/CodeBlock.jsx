import React, { useState } from "react";
import styled from "styled-components";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { Play, Copy, Trash2, Check } from "lucide-react";

const Block = styled.div`
  margin: 1.5rem 0;
  background: #1e1e1e;
  border-radius: 12px;
  color: white;
  overflow: hidden;
  border: 1px solid #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  .code-header {
    background: #2d2d2d;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .language-select {
    background: #404040;
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    border: 1px solid #555;
    font-size: 0.9rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    background: transparent;
    color: #999;
    padding: 0.4rem 0.6rem;
    border: 1px solid #555;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;

    &:hover {
      background: #404040;
      color: white;
      border-color: #666;
    }

    &.run-btn {
      background: #0ea5e9;
      color: white;
      border-color: #0ea5e9;

      &:hover {
        background: #0284c7;
        border-color: #0284c7;
      }
    }

    &.delete-btn {
      &:hover {
        background: #dc2626;
        border-color: #dc2626;
        color: white;
      }
    }

    &.copied {
      background: #16a34a;
      border-color: #16a34a;
      color: white;
    }
  }

  .code-content {
    padding: 0;
  }

  .output {
    background: #111;
    color: #22c55e;
    padding: 1rem;
    margin: 0;
    border-top: 1px solid #333;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.9rem;
    white-space: pre-wrap;
  }
`;

const langMap = {
  javascript,
  python,
  java,
  cpp,
};

const CodeBlock = ({ onDelete, initialCode = "", initialLanguage = "javascript" }) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const runCode = () => {
    if (language === "javascript") {
      try {
        const result = eval(code);
        setOutput(String(result));
      } catch (err) {
        setOutput(`Error: ${err.message}`);
      }
    } else {
      setOutput("Code execution is only available for JavaScript in browser environment.");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this code block?')) {
      if (onDelete) {
        onDelete();
      }
    }
  };

  return (
    <Block>
      <div className="code-header">
        <select
          className="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        <div className="actions">
          <button
            className={`action-btn ${copied ? 'copied' : ''}`}
            onClick={copyToClipboard}
            title="Copy code"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            className="action-btn run-btn"
            onClick={runCode}
            title="Run code (JavaScript only)"
          >
            <Play size={14} />
            Run
          </button>

          {onDelete && (
            <button
              className="action-btn delete-btn"
              onClick={handleDelete}
              title="Delete code block"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="code-content">
        <CodeMirror
          value={code}
          height="250px"
          theme={oneDark}
          extensions={[langMap[language]()]}
          onChange={(value) => setCode(value)}
        />
      </div>

      {output && <pre className="output">{output}</pre>}
    </Block>
  );
};

export default CodeBlock;
