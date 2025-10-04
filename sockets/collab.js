const Document = require('../models/Document');

module.exports = function registerCollabSocket(io) {
  io.on('connection', (socket) => {
    // Join a document room
    socket.on('joinDoc', async ({ docId, token }) => {
      // TODO: verify token if you want socket-level auth
      socket.join(docId);
      socket.to(docId).emit('presence', { userId: socket.id, type: 'join' });
    });

    // Leave a document room
    socket.on('leaveDoc', ({ docId }) => {
      socket.leave(docId);
      socket.to(docId).emit('presence', { userId: socket.id, type: 'leave' });
    });

    // Live edits
    socket.on('editDoc', async ({ docId, content }) => {
      // Broadcast to others in the room
      socket.to(docId).emit('docUpdate', { content });
      // Persist (naive). Consider debounce/batch for perf.
      try {
        await Document.findByIdAndUpdate(docId, { content, updatedAt: new Date() });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to persist doc:', e.message);
      }
    });

    // Live cursors
    socket.on('cursor', ({ docId, cursor }) => {
      socket.to(docId).emit('cursor', { userId: socket.id, cursor });
    });
  });
};