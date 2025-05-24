// chatHandler.js
const Conversation = require('../modals/conversationModel'); // adjust path
const Message = require('../modals/messageModel');           // adjust path

function chatHandler(io, socket) {
  /**
   * Join a conversation room
   */
  socket.on('joinConversation', async (conversationId, callback) => {
    try {
      const convo = await Conversation.findById(conversationId);
      if (!convo) {
        return callback({
          status: 'error',
          message: 'Conversation not found',
        });
      }

      // Ensure user is a participant
      const isParticipant = convo.participants.some(
        (p) => p.user.toString() === socket.user._id
      );
      if (!isParticipant) {
        return callback({
          status: 'error',
          message: 'Not authorized to join this conversation',
        });
      }

      // Join the Socket.IO room
      socket.join(conversationId);
      console.log(`User ${socket.user._id} joined conversation ${conversationId}`);
      callback({ status: 'ok' });
    } catch (err) {
      console.error('joinConversation error:', err);
      callback({ status: 'error', message: 'Failed to join conversation' });
    }
  });

  /**
   * Send a message
   */
  socket.on('sendMessage', async (data) => {
    const { conversationId, content } = data;
    if (!conversationId || !content) {
      return socket.emit('error', 'Invalid sendMessage payload');
    }

    try {
      // Verify that conversation exists and user is a participant
      const convo = await Conversation.findById(conversationId);
      if (!convo) {
        return socket.emit('error', 'Conversation not found');
      }
      const isParticipant = convo.participants.some(
        (p) => p.user.toString() === socket.user._id
      );
      if (!isParticipant) {
        return socket.emit('error', 'Not authorized for this conversation');
      }

      // Create new message
      const newMsg = new Message({
        conversation: conversationId,
        sender: socket.user._id,
        senderName: socket.user.name,
        senderAvatar: socket.user.profilePicture,
        content,
        timestamp: new Date(),
      });
      await newMsg.save();

      // Update convo’s lastMessage
      convo.lastMessage = newMsg._id;
      await convo.save();

      // Emit to everyone in this conversation room
      io.to(conversationId).emit('newMessage', {
        _id: newMsg._id,
        sender: socket.user._id,
        senderName: socket.user.name,
        senderAvatar: socket.user.profilePicture,
        content: newMsg.content,
        timestamp: newMsg.timestamp,
        conversation: conversationId,
      });

      console.log(`Message sent by ${socket.user._id} in convo ${conversationId}`);
    } catch (err) {
      console.error('sendMessage error:', err);
      socket.emit('error', 'Failed to send message');
    }
  });

  /**
   * Optionally handle leaving all rooms (if you want)
   */
  socket.on('leaveAllConversations', () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
        console.log(`User ${socket.user._id} left room ${room}`);
      }
    });
  });
}

module.exports = chatHandler;
