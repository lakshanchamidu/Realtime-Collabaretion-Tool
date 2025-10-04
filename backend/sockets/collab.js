const Document = require('../models/Document');

// Store connected users per document
const documentUsers = new Map();

module.exports = function registerCollabSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a document room - updated for frontend compatibility
    socket.on('join-document', async ({ documentId, userId, userName }) => {
      try {
        socket.join(documentId);
        
        // Add user to document users map
        if (!documentUsers.has(documentId)) {
          documentUsers.set(documentId, new Map());
        }
        documentUsers.get(documentId).set(socket.id, { userId, userName });
        
        // Get current document content
        let document = await Document.findById(documentId);
        if (!document) {
          // Create new document if it doesn't exist
          document = new Document({
            _id: documentId,
            title: `Document ${documentId}`,
            content: '// Welcome to Real-time Code Editor\nconsole.log("Hello World!");'
          });
          await document.save();
        }
        
        // Send current document content to the user
        socket.emit('document-content', { content: document.content });
        
        // Notify others about new user
        const users = Array.from(documentUsers.get(documentId).values());
        io.to(documentId).emit('users-update', users);
        
        console.log(`User ${userName} joined document ${documentId}`);
      } catch (error) {
        console.error('Error joining document:', error);
        socket.emit('error', { message: 'Failed to join document' });
      }
    });

    // Handle code changes
    socket.on('code-change', async ({ documentId, code, userId }) => {
      try {
        // Broadcast to others in the room (excluding sender)
        socket.to(documentId).emit('code-changed', { code });
        
        // Save to database (with debounce in production)
        await Document.findByIdAndUpdate(documentId, { 
          content: code, 
          updatedAt: new Date() 
        });
      } catch (error) {
        console.error('Error updating document:', error);
      }
    });

    // Legacy support for existing events
    socket.on('joinDoc', async ({ docId, token }) => {
      socket.join(docId);
      socket.to(docId).emit('presence', { userId: socket.id, type: 'join' });
    });

    socket.on('leaveDoc', ({ docId }) => {
      socket.leave(docId);
      socket.to(docId).emit('presence', { userId: socket.id, type: 'leave' });
    });

    socket.on('editDoc', async ({ docId, content }) => {
      socket.to(docId).emit('docUpdate', { content });
      try {
        await Document.findByIdAndUpdate(docId, { content, updatedAt: new Date() });
      } catch (e) {
        console.error('Failed to persist doc:', e.message);
      }
    });

    socket.on('cursor', ({ docId, cursor }) => {
      socket.to(docId).emit('cursor', { userId: socket.id, cursor });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove user from all documents
      for (const [documentId, users] of documentUsers.entries()) {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          
          // Update users list for the document
          const remainingUsers = Array.from(users.values());
          io.to(documentId).emit('users-update', remainingUsers);
          
          // Clean up empty document user maps
          if (users.size === 0) {
            documentUsers.delete(documentId);
          }
        }
      }
    });
  });
};