// backend/routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const Conversation = require('../modals/conversationModel'); // Ensure the path is correct
const Message = require('../modals/messageModel'); // Ensure the path is correct
const User = require('../modals/userModal'); // Ensure the path is correct
const protect = require('../middleware/authMiddleware'); // Ensure the path is correct

// @route   GET /api/chat/conversations
// @desc    Get all conversations for authenticated user
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants.user': req.user._id, // Use _id instead of id
    })
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error.message);
    res.status(500).json({ message: 'Failed to fetch conversations.', error: error.message });
  }
});

// @route   GET /api/chat/conversations/:conversationId/messages
// @desc    Get messages for a specific conversation
// @access  Private
router.get('/conversations/:conversationId/messages', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Validate conversationId format
    if (!conversationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid conversation ID format.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (participant) => participant.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this conversation.' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ timestamp: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ message: 'Failed to fetch messages.', error: error.message });
  }
});

// @route   POST /api/chat/conversations/:userId
// @desc    Create or get a conversation with another user
// @access  Private
router.post('/conversations/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants.user': { $all: [req.user._id, userId] },
    });

    if (!conversation) {
      // Fetch the other user's details
      const otherUser = await User.findById(userId).select('-password');
      if (!otherUser) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Create a new conversation
      conversation = new Conversation({
        participants: [
          {
            user: req.user._id,
            name: req.user.name,
            email: req.user.email,
            profilePicture: req.user.profilePicture,
          },
          {
            user: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            profilePicture: otherUser.profilePicture,
          },
        ],
      });

      await conversation.save();
    }

    res.status(200).json({ conversation });
  } catch (error) {
    console.error('Error creating/getting conversation:', error.message);
    res.status(500).json({ message: 'Failed to create/get conversation.', error: error.message });
  }
});

module.exports = router;
