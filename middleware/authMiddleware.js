// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../modals/userModal'); // Ensure the path is correct

const protect = async (req, res, next) => {
  let token;

  // Check if the token is provided in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from the Authorization header
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from the database and exclude the password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'User not found.' });
      }

      // Attach the user information to the request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  } else {
    // If no token is provided
    return res.status(401).json({ message: 'Not authorized, no token.' });
  }
};

module.exports = protect;
