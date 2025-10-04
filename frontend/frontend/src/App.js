import React, { useState, useEffect } from 'react';
import EnhancedCodeEditor from './components/EnhancedCodeEditor';
import './components/EnhancedCodeEditor.css';
import './App.css';

function App() {
  const [documentId, setDocumentId] = useState('doc1');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    // Generate random user ID
    setUserId(`user_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  const handleJoinDocument = () => {
    if (userName.trim()) {
      setIsJoined(true);
    } else {
      alert('Please enter your name');
    }
  };

  const handleCreateNewDocument = () => {
    const newDocId = `doc_${Math.random().toString(36).substr(2, 9)}`;
    setDocumentId(newDocId);
  };

  if (!isJoined) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>Real-time Code Collaboration</h1>
          <div className="login-form">
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="name-input"
            />
            <input
              type="text"
              placeholder="Document ID (optional)"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className="document-input"
            />
            <div className="button-group">
              <button onClick={handleJoinDocument} className="join-btn">
                Join Document
              </button>
              <button onClick={handleCreateNewDocument} className="new-doc-btn">
                Create New Document
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Real-time Code Editor</h1>
        <div className="document-info">
          <span>Document: {documentId}</span>
          <span>User: {userName}</span>
        </div>
      </header>
      
      <main className="app-main">
        <EnhancedCodeEditor 
          documentId={documentId}
          userId={userId}
          userName={userName}
        />
      </main>
    </div>
  );
}

export default App;
