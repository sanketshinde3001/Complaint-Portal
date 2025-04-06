const Complaint = require('../models/Complaint');
const User = require('../models/User'); // Needed for gender filtering

// --- Helper Functions ---

/**
 * Atomically updates vote counts and score for a complaint.
 * @param {string} complaintId - The ID of the complaint to vote on.
 * @param {string} userId - The ID of the user voting.
 * @param {'upvote' | 'downvote'} voteType - The type of vote being cast.
 * @returns {Promise<object>} - The updated complaint document.
 * @throws {Error} - Throws error if complaint not found, not approved, or DB update fails.
 */
const updateVote = async (complaintId, userId, voteType) => {
  // 1. Find the complaint to check status and current vote state *without* selecting vote arrays initially
  // We need status to check if voting is allowed.
  const complaintCheck = await Complaint.findById(complaintId).select('status upvotedBy downvotedBy'); // Select only needed fields

  if (!complaintCheck) {
    const error = new Error('Complaint not found.');
    error.statusCode = 404;
    throw error;
  }

  if (complaintCheck.status !== 'approved') {
    const error = new Error('Voting is only allowed on approved complaints.');
    error.statusCode = 403;
    throw error;
  }

  // Define fields based on vote type
  const voteArrayField = voteType === 'upvote' ? 'upvotedBy' : 'downvotedBy';
  const oppositeVoteArrayField = voteType === 'upvote' ? 'downvotedBy' : 'upvotedBy';

  // Check user's current vote state from the initial check
  const hasVoted = complaintCheck[voteArrayField].some(id => id.equals(userId));
  const hasOppositeVoted = complaintCheck[oppositeVoteArrayField].some(id => id.equals(userId));

  // 2. Construct the atomic update operation
  const update = {};
  const conditions = {
      _id: complaintId,
      status: 'approved' // Ensure it's still approved when we update
  };

  // Build the update logic atomically
  if (hasVoted) {
    // User is removing their vote
    conditions[voteArrayField] = userId; // Ensure user is still in the array before pulling
    update.$pull = { [voteArrayField]: userId };
    update.$inc = {
        [voteType === 'upvote' ? 'upvotes' : 'downvotes']: -1,
        score: voteType === 'upvote' ? -1 : 1
    };
  } else {
    // User is adding a new vote
    conditions[voteArrayField] = { $ne: userId }; // Ensure user is NOT already in the array
    update.$addToSet = { [voteArrayField]: userId };
    update.$inc = {
        [voteType === 'upvote' ? 'upvotes' : 'downvotes']: 1,
        score: voteType === 'upvote' ? 1 : -1
    };

    // If user had the opposite vote, remove it atomically as well
    if (hasOppositeVoted) {
        // We need to ensure the opposite vote is still present when removing
        // This makes the condition more complex, maybe handle in two steps or accept minor race condition here?
        // For simplicity, let's assume the initial check is sufficient for this part.
        if (!update.$pull) update.$pull = {};
        update.$pull[oppositeVoteArrayField] = userId;

        // Adjust the increment for the opposite vote count
        if (!update.$inc) update.$inc = {};
        update.$inc[voteType === 'upvote' ? 'downvotes' : 'upvotes'] = -1;
        // Adjust score increment based on whether we are adding AND removing opposite
        update.$inc.score = voteType === 'upvote' ? (update.$inc.score + 1) : (update.$inc.score - 1);
    }
  }

   // 3. Perform the atomic update
   const updatedComplaint = await Complaint.findOneAndUpdate(
       conditions, // Only update if conditions are met (status, user vote state)
       update,
       { new: true, runValidators: true }
   ).select('+upvotedBy +downvotedBy +upvotes +downvotes +score'); // Select fields needed for response

  // 4. Check if update was successful
  if (!updatedComplaint) {
    // If conditions weren't met (e.g., user already voted/unvoted, status changed), throw specific error
    // Re-fetch to give a more specific reason
    const currentComplaint = await Complaint.findById(complaintId).select('status upvotedBy downvotedBy');
    if (!currentComplaint) {
        const error = new Error('Complaint not found.');
        error.statusCode = 404;
        throw error;
    }
    if (currentComplaint.status !== 'approved') {
        const error = new Error('Voting is only allowed on approved complaints.');
        error.statusCode = 403;
        throw error;
    }
    // Check if the vote state already matches the attempted action
    const currentHasVoted = currentComplaint[voteArrayField].some(id => id.equals(userId));
    if (hasVoted && !currentHasVoted) { // Tried to remove vote, but wasn't there
         const error = new Error('You have not voted this way.');
         error.statusCode = 400;
         throw error;
    }
     if (!hasVoted && currentHasVoted) { // Tried to add vote, but was already there
         const error = new Error('You have already voted this way.');
         error.statusCode = 400;
         throw error;
    }

    // Generic failure if specific condition wasn't met
    const error = new Error('Failed to update complaint votes.');
    error.statusCode = 500;
    throw error;
  }

  return updatedComplaint;
};

// --- Controller Functions ---

// Create a new complaint (Looks mostly good, minor refinement)
exports.createComplaint = async (req, res, next) => {
  try {
    const { text, tags } = req.body;
    const userId = req.user._id; // User ID from protect middleware

    // Improved validation message check
    if (!text || typeof text !== 'string' || text.trim() === '') {
         return res.status(400).json({ status: 'fail', message: 'Complaint text cannot be empty.' });
    }
    if (!tags || (Array.isArray(tags) && tags.length === 0) || (typeof tags === 'string' && tags.trim() === '')) {
      return res.status(400).json({ status: 'fail', message: 'At least one tag is required.' });
    }

    const mediaUrls = req.body.mediaUrls || []; // From upload middleware

    // Ensure tags is an array of trimmed, non-empty strings
    const processedTags = (Array.isArray(tags) ? tags : [tags])
                            .map(tag => typeof tag === 'string' ? tag.trim().toLowerCase() : '')
                            .filter(tag => tag !== '');

    if (processedTags.length === 0) {
        return res.status(400).json({ status: 'fail', message: 'At least one valid tag is required.' });
    }

    const newComplaint = await Complaint.create({
      user: userId,
      text: text.trim(), // Trim text as well
      tags: processedTags,
      media: mediaUrls,
      // Status defaults to 'pending' based on schema
    });

    // Prepare response, excluding sensitive fields
    // Using .toObject() and delete is fine, or lean() + manual object creation
    const responseComplaint = newComplaint.toObject();
    delete responseComplaint.user;
    delete responseComplaint.__v; // Often removed
    // Keep status so frontend knows it's pending if needed, or remove if only showing approved
    // delete responseComplaint.status;

    // Update user's last complaint timestamp AFTER successful creation
    await User.findByIdAndUpdate(userId, { lastComplaintAt: new Date() });

    res.status(201).json({
      status: 'success',
      data: {
        complaint: responseComplaint,
      },
    });
  } catch (err) {
    console.error("Create Complaint Error:", err);
     if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({ status: 'fail', message: `Invalid input data: ${messages.join('. ')}` });
    }
    // Handle potential duplicate key errors if you have unique indexes
    if (err.code === 11000) {
         return res.status(409).json({ status: 'fail', message: 'Duplicate field value entered.' }); // Conflict
    }
    res.status(500).json({ status: 'error', message: 'Failed to create complaint.' });
  }
};

// Get all approved complaints (Refined tag handling and query building)
exports.getAllComplaints = async (req, res, next) => {
  try {
    const user = req.user; // Authenticated user

    // --- Build Query Conditions ---
    const conditions = { status: 'approved' };

    // 1. Tag Filtering (Case-insensitive and handles multiple tags)
    if (req.query.tags) {
      const tags = req.query.tags.split(',')
                     .map(tag => tag.trim().toLowerCase())
                     .filter(tag => tag !== '');
      if (tags.length > 0) {
          // Use $all for multiple tags (must have all specified) or $in (must have at least one)
          // $in is usually more appropriate for typical tag filtering
          conditions.tags = { $in: tags };
          // If you want complaints that have ALL specified tags:
          // conditions.tags = { $all: tags };
      }
    }

    // 2. Gender-based Filtering
    const genderExclusionTags = [];
    if (user.gender === 'male') {
      genderExclusionTags.push('girls only');
    } else if (user.gender === 'female') {
      genderExclusionTags.push('boys only');
    }
    // Add 'boys only' and 'girls only' to exclusion list if the user explicitly filtered them out via query params? (Optional complexity)

    if (genderExclusionTags.length > 0) {
        // Add to conditions using $nin (not in)
        // If conditions.tags already exists (from tag filtering), merge using $and
        if (conditions.tags) {
            // Need to ensure we don't overwrite the $in/$all from previous step
            conditions.$and = [
                { tags: conditions.tags }, // Keep original tag filter
                { tags: { $nin: genderExclusionTags } } // Add gender exclusion
            ];
            delete conditions.tags; // Remove the original key as it's now inside $and
        } else {
            conditions.tags = { $nin: genderExclusionTags };
        }
    }

    // 3. Time Filtering
    const timeFilter = req.query.t || 'all';
    if (timeFilter !== 'all') {
        let startDate;
        const now = new Date();
        switch (timeFilter) {
            case 'hour': startDate = new Date(now.getTime() - 60 * 60 * 1000); break;
            case 'day': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
            case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case 'month': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break; // Approx 30 days
            // case 'year': startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
            default: startDate = null;
        }
        if (startDate) {
            conditions.createdAt = { $gte: startDate };
        }
    }

    // --- Build Sort Options ---
    let sortOptions = {};
    const sortBy = req.query.sort || 'new';
    switch (sortBy) {
      case 'top': // Sort by score (desc), then date (desc)
      case 'best': // Often 'best' involves confidence intervals (Wilson score), but 'top' is a good approximation
        sortOptions = { score: -1, createdAt: -1 };
        break;
      case 'new': // Sort by date (desc)
      default:
        sortOptions = { createdAt: -1 };
        break;
       // case 'old': sortOptions = { createdAt: 1 }; break;
       // case 'controversial': // Requires more complex logic (e.g., close up/down votes, high activity) - skip for now
    }

    // --- Pagination --- (Using example values)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Set a reasonable default limit
    const skip = (page - 1) * limit;

    // --- Execute Query ---
    // Use lean() for performance if you don't need Mongoose documents (virtuals, methods) afterwards
    // Keep full Mongoose docs if you might modify them before sending (less common here)
    const complaints = await Complaint.find(conditions)
                                      .sort(sortOptions)
                                      .skip(skip)
                                      .limit(limit)
                                      .lean(); // Use .lean() for better performance

    // We used lean(), so no need to call .toObject() or delete fields manually
    // The `select: false` in the model schema prevents 'user' field from being included by default

    // Optional: Get total count for pagination metadata
    const totalComplaints = await Complaint.countDocuments(conditions);

    res.status(200).json({
      status: 'success',
      results: complaints.length,
      total: totalComplaints, // Send total count for pagination UI
      page: page,
      limit: limit,
      data: {
        complaints,
      },
    });
  } catch (err) {
    console.error("Get All Complaints Error:", err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch complaints.' });
  }
};

// Get a single complaint (Looks good, minor consistency check)
exports.getComplaint = async (req, res, next) => {
    try {
        // Use lean() here too if you don't need Mongoose methods after fetching
        const complaint = await Complaint.findById(req.params.id).lean();

        if (!complaint || complaint.status !== 'approved') {
            return res.status(404).json({ status: 'fail', message: 'Complaint not found or not approved.' });
        }

        // Check gender restrictions (ensure req.user is available)
        const user = req.user;
        if (!user) {
             // Should be handled by 'protect' middleware, but double-check
             return res.status(401).json({ status: 'fail', message: 'Authentication required.'});
        }
        if ((user.gender === 'male' && complaint.tags.includes('girls only')) ||
            (user.gender === 'female' && complaint.tags.includes('boys only'))) {
             return res.status(403).json({ status: 'fail', message: 'You do not have permission to view this complaint.' });
        }

        // User field should already be excluded by `select: false` or `lean()`

        res.status(200).json({
            status: 'success',
            data: {
                complaint: complaint, // Already a plain object due to lean()
            },
        });
    } catch (err) {
        console.error("Get Single Complaint Error:", err);
        if (err.name === 'CastError') { // Handle invalid MongoDB ID format
             return res.status(400).json({ status: 'fail', message: 'Invalid complaint ID format.' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to fetch complaint.' });
    }
};


// --- Voting Controllers (Using the improved updateVote helper) ---

exports.upvoteComplaint = async (req, res, next) => {
  try {
    const complaintId = req.params.id;
    const userId = req.user._id;

    const updatedComplaint = await updateVote(complaintId, userId, 'upvote');

    // Send back only the necessary updated voting state for the frontend
    res.status(200).json({
      status: 'success',
      data: {
        upvotes: updatedComplaint.upvotes,
        downvotes: updatedComplaint.downvotes,
        score: updatedComplaint.score,
        upvotedBy: updatedComplaint.upvotedBy, // Include for frontend state update
        downvotedBy: updatedComplaint.downvotedBy, // Include for frontend state update
      },
    });
  } catch (err) {
    console.error("Upvote Error:", err);
    // Use statusCode from the helper function if available
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Failed to upvote complaint.'
    });
  }
};

exports.downvoteComplaint = async (req, res, next) => {
  try {
    const complaintId = req.params.id;
    const userId = req.user._id;

    const updatedComplaint = await updateVote(complaintId, userId, 'downvote');

    // Send back only the necessary updated voting state
    res.status(200).json({
      status: 'success',
      data: {
        upvotes: updatedComplaint.upvotes,
        downvotes: updatedComplaint.downvotes,
        score: updatedComplaint.score,
        upvotedBy: updatedComplaint.upvotedBy, // Include for frontend state update
        downvotedBy: updatedComplaint.downvotedBy, // Include for frontend state update
      },
    });
  } catch (err) {
    console.error("Downvote Error:", err);
    // Use statusCode from the helper function if available
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Failed to downvote complaint.'
    });
  }
};

// TODO: Add functions for admin actions (get pending, approve, reject)
// TODO: Add functions for updating/deleting complaints (if allowed for users/admins)
