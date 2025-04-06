const Comment = require('../models/Comment');
const Complaint = require('../models/Complaint'); // Needed to check if complaint exists/is approved

// Helper function for error handling (optional, but good practice)
const handleAsync = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all top-level comments for a specific complaint
exports.getCommentsForComplaint = handleAsync(async (req, res, next) => {
    const complaintId = req.params.complaintId;

    // Find only top-level comments (parentComment is null) for the given complaint
    const comments = await Comment.find({ complaint: complaintId, parentComment: null })
        .populate({
            path: 'author',
            select: 'name', // Author of top-level comment
        })
        .populate({
            path: 'replies', // Populate Level 1 replies
            populate: [
                { path: 'author', select: 'name' }, // Author of Level 1 replies
                {
                    path: 'replies', // Populate Level 2 replies
                    populate: [
                        { path: 'author', select: 'name' }, // Author of Level 2 replies
                        {
                            path: 'replies', // Populate Level 3 replies
                            populate: { path: 'author', select: 'name' } // Author of Level 3 replies
                        }
                    ]
                }
            ]
        })
        .sort({ createdAt: 'desc' }); // Sort top-level comments by newest first

    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: {
            comments,
        },
    });
});

// Create a new comment (top-level or reply)
exports.createComment = handleAsync(async (req, res, next) => {
    const { text, parentCommentId } = req.body; // parentCommentId is optional (for replies)
    const complaintId = req.params.complaintId;
    const authorId = req.user._id; // From authMiddleware.protect

    if (!text) {
        return res.status(400).json({ status: 'fail', message: 'Comment text cannot be empty.' });
    }

    // 1. Check if the complaint exists and is approved (optional: allow comments on pending?)
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
         return res.status(404).json({ status: 'fail', message: 'Complaint not found.' });
    }
    // Add check for complaint status if needed:
    // if (complaint.status !== 'approved') {
    //     return res.status(403).json({ status: 'fail', message: 'Comments can only be added to approved complaints.' });
    // }

    // 2. If it's a reply, check if the parent comment exists and belongs to the same complaint
    let parentComment = null;
    if (parentCommentId) {
        parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
            return res.status(404).json({ status: 'fail', message: 'Parent comment not found.' });
        }
        if (parentComment.complaint.toString() !== complaintId) {
             return res.status(400).json({ status: 'fail', message: 'Reply must be associated with the same complaint as the parent comment.' });
        }
    }

    // 3. Create the comment
    const newComment = await Comment.create({
        text,
        author: authorId,
        complaint: complaintId,
        parentComment: parentComment ? parentComment._id : null, // Set parentComment if it's a reply
    });

    // 4. Populate author details for the response
    const populatedComment = await Comment.findById(newComment._id).populate({
        path: 'author',
        select: 'name',
    });

    res.status(201).json({
        status: 'success',
        data: {
            comment: populatedComment,
        },
    });
});

// TODO: Add controllers for updating/deleting comments if needed
// exports.updateComment = handleAsync(async (req, res, next) => { ... });
// exports.deleteComment = handleAsync(async (req, res, next) => { ... });
