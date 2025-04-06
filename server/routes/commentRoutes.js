const express = require('express');
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

// Create a router instance.
// We use mergeParams: true because we need access to :complaintId from the parent router (complaintRoutes)
const router = express.Router({ mergeParams: true });

// --- Comment Routes ---

// GET all comments for a specific complaint
// POST a new comment for a specific complaint (requires login)
router.route('/')
    .get(commentController.getCommentsForComplaint) // No auth needed to view comments (usually)
    .post(
        authMiddleware.protect, // User must be logged in to comment
        commentController.createComment
    );

// Routes for specific comments (e.g., update, delete) could be added here
// router.route('/:commentId')
//     .patch(authMiddleware.protect, commentController.updateComment) // Add authorization check (is user the author?)
//     .delete(authMiddleware.protect, commentController.deleteComment); // Add authorization check

module.exports = router;
