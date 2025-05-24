const express = require('express');
const router = express.Router();
const User = require('../modals/userModal');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const path = require('path');
const fs = require('fs');

// GET /api/profile - Get current user's profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/profile - Update current user's profile
router.put('/profile', protect, upload.single('profilePicture'), async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Update fields if they are present in the request body
      const { name, email, phoneNumber } = req.body;
  
      if (name) user.name = name; // Use 'name' directly
      if (email) user.email = email;
      if (phoneNumber) user.phoneNumber = phoneNumber;
  
      // Handle profile picture upload
      if (req.file) {
        if (user.profilePicture && user.profilePicture !== 'https://example.com/default-profile.png') {
          const oldPicturePath = path.join(__dirname, '..', user.profilePicture);
          fs.unlink(oldPicturePath, (err) => {
            if (err) {
              console.error('Failed to delete old profile picture:', err);
            }
          });
        }
        user.profilePicture = `/uploads/profilePictures/${req.file.filename}`;
      }
  
      await user.save();
  
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name, // Return updated name
          email: user.email,
          phoneNumber: user.phoneNumber,
          profilePicture: user.profilePicture,
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

module.exports = router;