import React, { useState } from "react";
import styled from "styled-components";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

const Block = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  background: #1e1e1e;
  border-radius: 8px;
  color: white;

  select {
    margin-bottom: 0.5rem;
    padding: 0.3rem;
    border-radius: 4px;
    border: none;
    font-size: 0.95rem;
  }

  button {
    margin-top: 0.5rem;
    background: #28a745;
    color: white;
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
      background: #218838;
    }
  }

  pre {
    background: #111;
    color: #0f0;
    padding: 0.5rem;
    margin-top: 0.75rem;
    border-radius: 6px;
  }
`;

const langMap = {
  javascript,
  python,
  java,
  cpp,
};

const CodeBlock = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

  const runCode = () => {
    if (language === "javascript") {
      try {
        const result = eval(code);
        setOutput(String(result));
      } catch (err) {
        setOutput(err.message);
      }
    } else {
      setOutput("Runnable only for JavaScript in browser.");
    }
  };

  return (
    <Block>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
      </select>

      <CodeMirror
        value={code}
        height="200px"
        theme={oneDark}
        extensions={[langMap[language]()]}
        onChange={(value) => setCode(value)}
      />

      <button onClick={runCode}>Run Code</button>

      {output && <pre>{output}</pre>}
    </Block>
  );
};

export default CodeBlock;
