const jwt = require('jsonwebtoken');
const { promisify } = require('util'); // To use async/await with jwt.verify
const User = require('../models/User');
const dotenv = require('dotenv'); // Keep require if needed elsewhere, or remove if not

// dotenv.config({ path: '../.env' }); // REMOVED - .env should be loaded globally in server.js

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) { // Read token from cookie
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ status: 'fail', message: 'You are not logged in! Please log in to get access.' });
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ status: 'fail', message: 'The user belonging to this token does no longer exist.' });
    }

    // 4) Check if user changed password after the token was issued
    // (Requires adding a passwordChangedAt field to the User model if implementing this)
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //   return res.status(401).json({ status: 'fail', message: 'User recently changed password! Please log in again.' });
    // }

    // 5) Check if user is verified (important for accessing protected routes)
    if (!currentUser.isVerified) {
        return res.status(403).json({ status: 'fail', message: 'Please verify your email address to access this resource.' });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser; // Attach user to the request object
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again.' });
    } else if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ status: 'fail', message: 'Your token has expired! Please log in again.' });
    }
    res.status(401).json({ status: 'fail', message: 'Authentication failed.' });
  }
};

// Middleware to restrict routes to specific roles (e.g., 'admin')
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'fail', message: 'You do not have permission to perform this action.' });
    }
    next();
  };
};
