import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import io from 'socket.io-client';

const CodeEditor = ({ documentId, userId }) => {
  const [code, setCode] = useState('// Welcome to Real-time Code Editor\nconsole.log("Hello World!");');
  const [language, setLanguage] = useState('javascript');
  const [socket, setSocket] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);

  // Language extensions mapping
  const languageExtensions = {
    javascript: [javascript()],
    python: [python()],
    html: [html()],
    css: [css()],
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join document room
    newSocket.emit('join-document', { documentId, userId });

    // Listen for code changes from other users
    newSocket.on('code-changed', (data) => {
      setCode(data.code);
    });

    // Listen for user list updates
    newSocket.on('users-update', (users) => {
      setConnectedUsers(users);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [documentId, userId]);

  const handleCodeChange = (value) => {
    setCode(value);
    
    // Emit code changes to other users
    if (socket) {
      socket.emit('code-change', {
        documentId,
        code: value,
        userId
      });
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  return (
    <div className="code-editor-container">
      <div className="editor-header">
        <div className="editor-controls">
          <select 
            value={language} 
            onChange={handleLanguageChange}
            className="language-selector"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
        </div>
        
        <div className="connected-users">
          <span>Connected: {connectedUsers.length}</span>
          {connectedUsers.map((user, index) => (
            <span key={index} className="user-indicator">
              {user.name}
            </span>
          ))}
        </div>
      </div>

      <CodeMirror
        value={code}
        onChange={handleCodeChange}
        extensions={languageExtensions[language]}
        theme={oneDark}
        options={{
          lineNumbers: true,
          foldGutter: true,
          gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
          autoCloseBrackets: true,
          matchBrackets: true,
          indentUnit: 2,
          tabSize: 2,
        }}
        className="code-mirror-editor"
      />
    </div>
  );
};

export default CodeEditor;