const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail); // Add route for resend
router.post('/logout', authController.logout); // Use POST for logout to clear cookie

// Protected route to get current user info (relies on cookie)
const authMiddleware = require('../middleware/authMiddleware');
router.get('/me', authMiddleware.protect, authController.getMe);

// Password Reset Routes
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword); // Use PATCH to update password


module.exports = router;
