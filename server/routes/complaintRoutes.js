const express = require('express');
const complaintController = require('../controllers/complaintController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

const router = express.Router();

// REMOVED Global Auth Protection - Will apply specifically where needed
// router.use(authMiddleware.protect);

router.route('/')
  // Apply protect middleware specifically to GET route if needed
  .get(authMiddleware.protect, complaintController.getAllComplaints)
  .post(
    // 1. Use Multer to handle form-data (populates req.body and req.files)
    uploadMiddleware.handleUpload.array('media', 5),
    // Logging removed
    // 2. Upload files from memory to Cloudinary (populates req.body.mediaUrls)
    uploadMiddleware.uploadToCloudinary,
    // 3. NOW ensure user is logged in (populates req.user)
    authMiddleware.protect,
    // 4. Proceed to create the complaint (needs req.body and req.user)
    complaintController.createComplaint
  );

router.route('/:id')
  // Apply protect middleware specifically to GET route
  .get(authMiddleware.protect, complaintController.getComplaint);

// --- Voting Routes ---
// Apply protect middleware as users must be logged in to vote
router.post('/:id/upvote', authMiddleware.protect, complaintController.upvoteComplaint);
router.post('/:id/downvote', authMiddleware.protect, complaintController.downvoteComplaint);


// TODO: Add routes for users to potentially update/delete their own complaints (if feature is desired) - Apply protect middleware here too

module.exports = router;
