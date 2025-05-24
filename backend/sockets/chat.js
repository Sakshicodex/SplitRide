// backend/sockets/chat.js

const Conversation = require('../modals/conversationModel');
const Message = require('../modals/messageModel');

const chatHandler = (io, socket) => {
  /**
   * Join a conversation room
   * @param {string} conversationId
   */
  socket.on('joinConversation', async (conversationId) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', 'Conversation not found.');
        return;
      }

      // Check if the user is part of the conversation
      const isParticipant = conversation.participants.some(
        (participant) => participant.id === socket.user.id
      );

      if (!isParticipant) {
        socket.emit('error', 'Not authorized to join this conversation.');
        return;
      }

      socket.join(conversationId);
      socket.emit('joinedConversation', conversationId);
      console.log(`User ${socket.user.id} joined conversation ${conversationId}`);
    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit('error', 'Failed to join conversation.');
    }
  });

  /**
   * Handle sending a new message
   * @param {Object} data
   * @param {string} data.conversationId
   * @param {string} data.content
   */
  socket.on('sendMessage', async (data) => {
    const { conversationId, message } = data;

    if (!conversationId || !message) {
      socket.emit('error', 'Invalid message data.');
      return;
    }

    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', 'Conversation not found.');
        return;
      }

      // Check if the user is part of the conversation
      const isParticipant = conversation.participants.some(
        (participant) => participant.id === socket.user.id
      );

      if (!isParticipant) {
        socket.emit('error', 'Not authorized to send messages to this conversation.');
        return;
      }

      const newMessage = new Message({
        senderId: socket.user.id,
        senderName: socket.user.name,
        senderAvatar: socket.user.profilePicture,
        content: message.content,
        timestamp: new Date(),
      });

      await newMessage.save();

      // Update the conversation's last message
      conversation.lastMessage = newMessage;
      await conversation.save();

      // Emit the new message to all participants in the conversation
      io.to(conversationId).emit('newMessage', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message.');
    }
  });
};

module.exports = chatHandler;
