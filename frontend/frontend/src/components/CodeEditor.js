import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import io from 'socket.io-client';

const CodeEditor = ({ documentId, userId, userName }) => {
  const [code, setCode] = useState('// Welcome to Real-time Code Editor\nconsole.log("Hello World!");');
  const [language, setLanguage] = useState('javascript');
  const [socket, setSocket] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [debugOutput, setDebugOutput] = useState([]);
  const [isDebuging, setIsDebugging] = useState(false);
  const outputRef = useRef(null);

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
    
    // Connection status handlers
    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      addDebugMessage('Connected to server');
    });
    
    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      addDebugMessage('Disconnected from server');
    });

    // Join document room
    newSocket.emit('join-document', { documentId, userId, userName });
    addDebugMessage(`Joining document: ${documentId}`);

    // Listen for document content (initial load)
    newSocket.on('document-content', (data) => {
      setCode(data.content);
      addDebugMessage('Received document content from server');
    });

    // Listen for code changes from other users
    newSocket.on('code-changed', (data) => {
      setCode(data.code);
      addDebugMessage('Code updated by another user');
    });

    // Listen for user list updates
    newSocket.on('users-update', (users) => {
      setConnectedUsers(users);
      addDebugMessage(`Users updated: ${users.length} connected`);
    });

    // Error handling
    newSocket.on('error', (error) => {
      addDebugMessage(`Error: ${error.message}`, 'error');
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [documentId, userId, userName]);

  const addDebugMessage = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugOutput(prev => [...prev, { message, type, timestamp }].slice(-50)); // Keep last 50 messages
  };

  const handleCodeChange = (value) => {
    setCode(value);
    
    // Emit code changes to other users
    if (socket) {
      socket.emit('code-change', {
        documentId,
        code: value,
        userId
      });
      addDebugMessage('Code change sent to server');
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
    addDebugMessage(`Language changed to: ${event.target.value}`);
  };

  const runCode = () => {
    setIsDebugging(true);
    addDebugMessage('Running code...', 'info');
    
    try {
      if (language === 'javascript') {
        // Create a safe environment to run JavaScript
        const originalLog = console.log;
        const logs = [];
        
        console.log = (...args) => {
          logs.push(args.join(' '));
          originalLog(...args);
        };
        
        // Run the code
        eval(code);
        
        // Restore console.log
        console.log = originalLog;
        
        logs.forEach(log => addDebugMessage(`Output: ${log}`, 'success'));
        
      } else {
        addDebugMessage(`Code execution not supported for ${language}`, 'warning');
      }
    } catch (error) {
      addDebugMessage(`Error: ${error.message}`, 'error');
    }
    
    setIsDebugging(false);
  };

  const clearDebugOutput = () => {
    setDebugOutput([]);
  };

  const toggleDebugPanel = () => {
    const panel = outputRef.current;
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
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
          
          <button 
            onClick={runCode} 
            className="run-btn"
            disabled={isDebuging}
            title="Run code (JavaScript only)"
          >
            {isDebuging ? 'Running...' : '▶ Run'}
          </button>
          
          <button 
            onClick={toggleDebugPanel} 
            className="debug-btn"
            title="Toggle debug panel"
          >
            🐛 Debug
          </button>
          
          <div className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '🟢' : '🔴'} {connectionStatus}
          </div>
        </div>
        
        <div className="connected-users">
          <span>Connected: {connectedUsers.length}</span>
          {connectedUsers.map((user, index) => (
            <span key={index} className="user-indicator" title={user.userName}>
              {user.userName || user.name}
            </span>
          ))}
        </div>
      </div>

      <div className="editor-main">
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
        
        <div ref={outputRef} className="debug-panel" style={{ display: 'none' }}>
          <div className="debug-panel-header">
            <h4>Debug Output</h4>
            <button onClick={clearDebugOutput} className="clear-btn">Clear</button>
          </div>
          <div className="debug-output">
            {debugOutput.map((item, index) => (
              <div key={index} className={`debug-message ${item.type}`}>
                <span className="timestamp">{item.timestamp}</span>
                <span className="message">{item.message}</span>
              </div>
            ))}
            {debugOutput.length === 0 && (
              <div className="debug-message info">
                <span className="message">No debug output yet. Click "Run" to execute JavaScript code.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;