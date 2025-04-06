const express = require('express');
const petitionController = require('../controllers/petitionController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware'); // Import rate limit middleware

const router = express.Router();

// --- Public Petition Routes ---

// GET all approved petitions
// POST create a new petition (requires login & rate limit)
router.route('/')
    .get(petitionController.getAllApprovedPetitions) // Publicly viewable
    .post(
        authMiddleware.protect, // Must be logged in
        rateLimitMiddleware.limitPetitionCreation, // Apply rate limit
        petitionController.createPetition
    );

// GET a specific petition by ID
router.route('/:id')
    .get(petitionController.getPetitionById); // Publicly viewable (controller might add checks)

// POST to sign a specific petition (requires login)
router.route('/:id/sign')
    .post(authMiddleware.protect, petitionController.signPetition); // Must be logged in to sign

// --- Admin-Only Petition Routes (Could be moved to adminRoutes.js) ---
// These routes are examples; adjust based on where you want admin logic
// Ensure these routes are protected by admin role check if kept separate

// GET pending petitions (Admin only)
// router.route('/admin/pending') // Example path
//     .get(authMiddleware.protect, authMiddleware.restrictTo('admin'), petitionController.getPendingPetitions);

// PATCH update petition status (Admin only)
// router.route('/admin/:id/status') // Example path
//     .patch(authMiddleware.protect, authMiddleware.restrictTo('admin'), petitionController.updatePetitionStatus);

// DELETE a petition (Admin only)
// router.route('/admin/:id') // Example path
//     .delete(authMiddleware.protect, authMiddleware.restrictTo('admin'), petitionController.deletePetition);


module.exports = router;
