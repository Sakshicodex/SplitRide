const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const chatHandler = require('./chatHandler');
const User = require('../modals/userModal'); // adjust path to your user model

/**
 * Initialize Socket.io
 */
function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173', // or 5173, or your actual React port
      methods: ['GET', 'POST'],
    },
  });

  // JWT auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token; // Provided from client
      if (!token) {
        return next(new Error('No token'));
      }

      // Strip "Bearer " if present
      const rawToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        _id: user._id.toString(),
        name: user.name,
        profilePicture: user.profilePicture,
      };
      next();
    } catch (err) {
      next(new Error('Auth error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.user?._id);

    // Chat Events
    chatHandler(io, socket);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.user?._id);
    });
  });

  return io;
}

module.exports = initializeSocket;
