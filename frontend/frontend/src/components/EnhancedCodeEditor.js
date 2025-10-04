import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import io from 'socket.io-client';

const EnhancedCodeEditor = ({ documentId, userId, userName }) => {
  const [code, setCode] = useState('// Welcome to Enhanced Real-time Code Editor\n// Multiple users can code together!\nconsole.log("Hello World!");');
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);
  const [socket, setSocket] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [connectionHistory, setConnectionHistory] = useState([]);
  const editorRef = useRef(null);

  // Language configurations
  const languageConfigs = {
    javascript: { 
      extension: [javascript()], 
      icon: '🟨', 
      name: 'JavaScript',
      runnable: true,
      template: '// JavaScript Code\nconsole.log("Hello from JavaScript!");'
    },
    python: { 
      extension: [python()], 
      icon: '🐍', 
      name: 'Python',
      runnable: true,
      template: '# Python Code\nprint("Hello from Python!")'
    },
    html: { 
      extension: [html()], 
      icon: '🌐', 
      name: 'HTML',
      runnable: false,
      template: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>'
    },
    css: { 
      extension: [css()], 
      icon: '🎨', 
      name: 'CSS',
      runnable: false,
      template: '/* CSS Styles */\nbody {\n    background-color: #f0f0f0;\n    font-family: Arial, sans-serif;\n}'
    }
  };

  // Editor extensions with enhanced features
  const getExtensions = () => [
    ...languageConfigs[language].extension,
    EditorView.theme({
      '&': { 
        fontSize: `${fontSize}px`,
        height: '100%'
      },
      '.cm-content': { 
        padding: '16px',
        minHeight: '400px'
      },
      '.cm-focused': { outline: 'none' },
      '.cm-editor': { 
        height: '100%',
        border: '1px solid #444'
      },
      '.cm-scroller': { 
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        lineHeight: '1.5'
      },
      '.cm-gutters': {
        backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f5f5f5',
        borderRight: '1px solid #444'
      },
      '.cm-activeLineGutter': {
        backgroundColor: theme === 'dark' ? '#404040' : '#e0e0e0'
      }
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        updateStats(update.state.doc.toString());
      }
      if (update.selectionSet) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        setCursorPosition({
          line: line.number,
          column: pos - line.from + 1
        });
      }
    })
  ];

  // Update code statistics
  const updateStats = (text) => {
    const lines = text.split('\n').length;
    const characters = text.length;
    setLineCount(lines);
    setCharacterCount(characters);
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      setIsConnected(true);
      addToHistory('Connected to server', 'success');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      addToHistory('Disconnected from server', 'error');
    });

    // Join document room
    newSocket.emit('join-document', { documentId, userId, userName });

    // Listen for document content
    newSocket.on('document-content', (data) => {
      setCode(data.content);
      updateStats(data.content);
      addToHistory(`Loaded document: ${documentId}`, 'info');
    });

    // Listen for code changes from other users
    newSocket.on('code-changed', (data) => {
      setCode(data.code);
      updateStats(data.code);
      addToHistory('Code updated by another user', 'info');
    });

    // Listen for user list updates
    newSocket.on('users-update', (users) => {
      setConnectedUsers(users);
      addToHistory(`Users online: ${users.length}`, 'info');
    });

    // Error handling
    newSocket.on('error', (error) => {
      addToHistory(`Error: ${error.message}`, 'error');
    });

    // Initial stats
    updateStats(code);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [documentId, userId, userName]);

  const addToHistory = (message, type) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionHistory(prev => [...prev.slice(-4), { message, type, timestamp }]);
  };

  const handleCodeChange = (value) => {
    setCode(value);
    updateStats(value);
    
    // Emit code changes to other users
    if (socket && isConnected) {
      socket.emit('code-change', {
        documentId,
        code: value,
        userId
      });
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    // Optionally set template code for new language
    const template = languageConfigs[newLanguage].template;
    setCode(template);
    handleCodeChange(template);
  };

  const handleRunCode = () => {
    if (!languageConfigs[language].runnable) {
      setOutput('This language cannot be executed in the browser.');
      setShowOutput(true);
      return;
    }

    try {
      if (language === 'javascript') {
        // Simple JavaScript execution (be careful with eval in production)
        const originalLog = console.log;
        let output = '';
        console.log = (...args) => {
          output += args.join(' ') + '\n';
        };
        
        // Execute code
        eval(code);
        
        // Restore console.log
        console.log = originalLog;
        
        setOutput(output || 'Code executed successfully (no output)');
      } else if (language === 'python') {
        setOutput('Python execution not implemented in browser. Use a backend service.');
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
    setShowOutput(true);
  };

  const clearOutput = () => {
    setOutput('');
    setShowOutput(false);
  };

  const saveDocument = () => {
    // Save functionality (could trigger backend API)
    addToHistory('Document saved', 'success');
  };

  return (
    <div className="enhanced-code-editor">
      {/* Header with enhanced toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <div className="language-selector-group">
            <select 
              value={language} 
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="language-selector enhanced"
            >
              {Object.entries(languageConfigs).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="toolbar-buttons">
            {languageConfigs[language].runnable && (
              <button onClick={handleRunCode} className="run-btn" title="Run Code">
                ▶️ Run
              </button>
            )}
            <button onClick={saveDocument} className="save-btn" title="Save Document">
              💾 Save
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className="settings-btn"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢' : '🔴'}
            </span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <div className="users-online">
            <span className="user-count">👥 {connectedUsers.length}</span>
            <div className="users-dropdown">
              {connectedUsers.map((user, index) => (
                <div key={index} className="user-item">
                  <span className="user-indicator">{user.userName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="setting-group">
            <label>Theme:</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="setting-group">
            <label>Font Size:</label>
            <input 
              type="range" 
              min="12" 
              max="24" 
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
            <span>{fontSize}px</span>
          </div>
        </div>
      )}

      {/* Main Editor Container */}
      <div className="editor-container">
        <div className="editor-main">
          <CodeMirror
            ref={editorRef}
            value={code}
            onChange={handleCodeChange}
            extensions={getExtensions()}
            theme={theme === 'dark' ? oneDark : undefined}
            placeholder="Start coding here..."
            className="code-mirror-enhanced"
          />
        </div>

        {/* Output Panel */}
        {showOutput && (
          <div className="output-panel">
            <div className="output-header">
              <span>Output</span>
              <div className="output-controls">
                <button onClick={clearOutput} className="clear-btn">Clear</button>
                <button onClick={() => setShowOutput(false)} className="close-btn">×</button>
              </div>
            </div>
            <div className="output-content">
              <pre>{output}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>Line {cursorPosition.line}, Column {cursorPosition.column}</span>
          <span>Lines: {lineCount}</span>
          <span>Characters: {characterCount}</span>
        </div>
        
        <div className="status-right">
          <span className="document-id">Doc: {documentId}</span>
          {connectionHistory.length > 0 && (
            <span className={`last-action ${connectionHistory[connectionHistory.length - 1].type}`}>
              {connectionHistory[connectionHistory.length - 1].message}
            </span>
          )}
        </div>
      </div>

      {/* Connection History (Debug Panel) */}
      <div className="connection-history">
        {connectionHistory.map((entry, index) => (
          <div key={index} className={`history-item ${entry.type}`}>
            <span className="timestamp">{entry.timestamp}</span>
            <span className="message">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedCodeEditor;