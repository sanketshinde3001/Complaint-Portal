const Complaint = require('../models/Complaint');
const User = require('../models/User'); // Needed to populate user details

// --- Admin Controller Functions ---

// Get all complaints (regardless of status, with user info)
exports.getAllComplaintsAdmin = async (req, res, next) => {
  try {
    // Admins can see all complaints and the user who submitted them
    // We use .populate() to get user details (specifically email and name for identification)
    // Ensure the 'user' field in Complaint model does NOT have select: false if you need populate here,
    // OR explicitly select it ONLY for admin routes. Let's adjust the query to select it.
    const complaints = await Complaint.find()
      .populate({
          path: 'user',
          select: 'name email gender' // Select specific user fields needed by admin
      })
      .sort('-createdAt'); // Show newest first

    res.status(200).json({
      status: 'success',
      results: complaints.length,
      data: {
        complaints,
      },
    });
  } catch (err) {
    console.error("Admin Get All Complaints Error:", err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch complaints for admin.' });
  }
};

// Get pending complaints (with user info)
exports.getPendingComplaints = async (req, res, next) => {
    try {
      const complaints = await Complaint.find({ status: 'pending' })
        .populate({
            path: 'user',
            select: 'name email gender' // Select specific user fields needed by admin
        })
        .sort('-createdAt');

      res.status(200).json({
        status: 'success',
        results: complaints.length,
        data: {
          complaints,
        },
      });
    } catch (err) {
      console.error("Admin Get Pending Complaints Error:", err);
      res.status(500).json({ status: 'error', message: 'Failed to fetch pending complaints.' });
    }
};


// Update complaint status (approve/reject)
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const complaintId = req.params.id;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid status provided. Must be "approved" or "rejected".' });
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        status: status,
        reviewedAt: Date.now(),
        adminNotes: adminNotes || undefined, // Add notes if provided
      },
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators on update
      }
    ).populate({ // Populate user details in the response as well
        path: 'user',
        select: 'name email gender'
    });

    if (!updatedComplaint) {
      return res.status(404).json({ status: 'fail', message: 'Complaint not found.' });
    }

    // TODO: Optionally notify the user who submitted the complaint about the status change

    res.status(200).json({
      status: 'success',
      data: {
        complaint: updatedComplaint,
      },
    });
  } catch (err) {
    console.error("Admin Update Complaint Status Error:", err);
     if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({ status: 'fail', message: `Invalid input data. ${messages.join('. ')}` });
    }
    res.status(500).json({ status: 'error', message: 'Failed to update complaint status.' });
  }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    // Exclude passwords from the result
    const users = await User.find().select('-password');

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    console.error("Admin Get All Users Error:", err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch users.' });
  }
};

// Update user role (Admin only)
exports.updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!role || !['student', 'admin'].includes(role)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid role provided. Must be "student" or "admin".' });
        }

        // Prevent admin from changing their own role accidentally via this route? Optional check.
        // if (req.user.id === userId) {
        //     return res.status(400).json({ status: 'fail', message: 'Admins cannot change their own role via this endpoint.' });
        // }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role: role },
            { new: true, runValidators: true }
        ).select('-password'); // Exclude password from response

        if (!updatedUser) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser,
            },
        });
    } catch (err) {
        console.error("Admin Update User Role Error:", err);
        res.status(500).json({ status: 'error', message: 'Failed to update user role.' });
    }
};


// Delete a complaint (Admin only)
exports.deleteComplaint = async (req, res, next) => {
    try {
        const complaintId = req.params.id;
        const complaint = await Complaint.findByIdAndDelete(complaintId);

        if (!complaint) {
            return res.status(404).json({ status: 'fail', message: 'Complaint not found.' });
        }

        // TODO: Optionally delete associated media files from storage (fs.unlink)

        res.status(204).json({ // 204 No Content for successful deletion
            status: 'success',
            data: null,
        });
    } catch (err) {
        console.error("Admin Delete Complaint Error:", err);
        res.status(500).json({ status: 'error', message: 'Failed to delete complaint.' });
    }
};
