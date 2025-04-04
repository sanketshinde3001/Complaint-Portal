const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes below and restrict to admins only
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

// Define admin-specific routes
router.get('/complaints', adminController.getAllComplaintsAdmin); // Get all complaints (admin view)
router.get('/complaints/pending', adminController.getPendingComplaints); // Get only pending complaints
router.patch('/complaints/:id/status', adminController.updateComplaintStatus); // Approve or reject a complaint
router.delete('/complaints/:id', adminController.deleteComplaint); // Delete a complaint

// User Management Routes
router.get('/users', adminController.getAllUsers); // Get all users
router.patch('/users/:id/role', adminController.updateUserRole); // Update a user's role

module.exports = router;
