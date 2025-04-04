const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail); // Add route for resend

// Example of a protected route (e.g., get current user profile)
// We might move profile-related routes elsewhere later
// const authMiddleware = require('../middleware/authMiddleware');
// router.get('/me', authMiddleware.protect, (req, res) => {
//   res.status(200).json({ status: 'success', data: { user: req.user } });
// });

// TODO: Add routes for password reset, resend verification email, etc. if needed

module.exports = router;
