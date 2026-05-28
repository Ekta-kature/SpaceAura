const jwt = require('jsonwebtoken');

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
      }
    } catch {}
    next();
  });

  const online = new Map();

  io.on('connection', (socket) => {
    const uid = socket.userId;
    if (uid) {
      if (!online.has(uid)) online.set(uid, new Set());
      online.get(uid).add(socket.id);
      io.emit('user_online', { userId: uid, online: true });
    }

    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) socket.join(conversationId);
    });

    socket.on('send_message', ({ conversationId, content }) => {
      if (!uid || !conversationId || !content) return;
      io.to(conversationId).emit('new_message', {
        conversationId, content,
        senderId: uid,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('typing_start', ({ conversationId }) => socket.to(conversationId).emit('user_typing', { userId: uid, typing: true }));
    socket.on('typing_stop',  ({ conversationId }) => socket.to(conversationId).emit('user_typing', { userId: uid, typing: false }));

    socket.on('disconnect', () => {
      if (uid) {
        const s = online.get(uid);
        if (s) { s.delete(socket.id); if (!s.size) { online.delete(uid); io.emit('user_online', { userId: uid, online: false }); } }
      }
    });
  });

  console.log('✅ Socket.io initialized');
};
