const express = require('express');
const router = express.Router();
const User = require('../modals/userModal');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Ride = require('../modals/rideModal'); 

const protect = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');

// User Registration Route
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate OTP and expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Create a new user
    const user = await User.create({
      name,
      email,
      password,
      otp,
      otpExpires,
    });

    // Send OTP to user email
    await sendEmail(
      user.email,
      'Verify Your Email - OTP',
      `Your OTP for email verification is: ${otp}`
    );

    res.status(201).json({
      message: 'User registered successfully. Check your email for the OTP.',
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP Route
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate OTP and expiry
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP and mark user as verified
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Sign-In Route
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password'); // Include the password field
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the account supports password login
    if (user.oauth) {
      return res.status(400).json({ message: 'Please sign in using your OAuth provider' });
    }

    // Check if password exists and matches
    if (!user.password) {
      return res.status(400).json({ message: 'This account does not support password login' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Sign-in successful',
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});







  
  
// User Logout Route
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return res.status(500).json({ message: 'Error during logout' });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
