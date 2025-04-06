const Petition = require('../models/Petition');
const User = require('../models/User'); // Needed for populating creator/signer details

// Helper function for error handling
const handleAsync = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --- Public Petition Functions ---

// Create a new petition
exports.createPetition = handleAsync(async (req, res, next) => {
    const { title, description, demands, goal, deadline, tags } = req.body;
    const creatorId = req.user._id; // From authMiddleware.protect

    // Basic validation (more can be added based on model)
    if (!title || !description || !demands) {
        return res.status(400).json({ status: 'fail', message: 'Title, description, and demands are required.' });
    }

    const newPetition = await Petition.create({
        title,
        description,
        demands,
        creator: creatorId,
        goal: goal || undefined, // Set only if provided
        deadline: deadline || undefined, // Set only if provided
        tags: tags || [],
        status: 'pending', // Initial status
    });

    // Populate creator details for the response
    const populatedPetition = await Petition.findById(newPetition._id).populate({
        path: 'creator',
       select: 'name username email', // Select relevant fields
    });

    // Update user's last petition timestamp AFTER successful creation
    await User.findByIdAndUpdate(creatorId, { lastPetitionAt: new Date() });

    res.status(201).json({
        status: 'success',
        data: {
            petition: populatedPetition,
        },
    });
});

// Get all approved petitions (with sorting/filtering)
exports.getAllApprovedPetitions = handleAsync(async (req, res, next) => {
    // TODO: Implement filtering (tags?) and sorting (newest, most signed)
    const sortBy = req.query.sort || 'new'; // 'new', 'popular'
    let sortOptions = {};

    switch (sortBy) {
        case 'popular':
            sortOptions = { signatureCount: -1, createdAt: -1 };
            break;
        case 'new':
        default:
            sortOptions = { createdAt: -1 };
            break;
    }

    // TODO: Add pagination
    const petitions = await Petition.find({ status: 'approved' })
        .populate({
            path: 'creator',
            select: 'name username', // Show creator name/username
        })
        .sort(sortOptions)
        .lean(); // Use lean for performance

    res.status(200).json({
        status: 'success',
        results: petitions.length,
        data: {
            petitions,
        },
    });
});

// Get a single petition by ID
exports.getPetitionById = handleAsync(async (req, res, next) => {
    const petitionId = req.params.id;

    const petition = await Petition.findById(petitionId)
        .populate({
            path: 'creator',
            select: 'name username email', // Show more creator details on detail page
        })
        .populate({
            path: 'signatures', // Populate the users who signed
             select: 'name username', // Show signer names/usernames
         }); // REMOVED .lean() here to include virtuals like 'isActive'

     if (!petition) {
        return res.status(404).json({ status: 'fail', message: 'Petition not found.' });
    }

    // Optional: Restrict access based on status if needed (e.g., only show approved/closed)
    // if (petition.status !== 'approved' && petition.status !== 'closed') {
    //    // Check if user is creator or admin to allow viewing pending/rejected
    //    if (!req.user || (petition.creator._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
    //       return res.status(403).json({ status: 'fail', message: 'You do not have permission to view this petition.' });
    //    }
    // }

    res.status(200).json({
        status: 'success',
        data: {
            petition,
        },
    });
});

// Sign a petition
exports.signPetition = handleAsync(async (req, res, next) => {
    const petitionId = req.params.id;
    const userId = req.user._id; // From authMiddleware.protect

    // Use findOneAndUpdate for atomicity
    const petition = await Petition.findOneAndUpdate(
        {
            _id: petitionId,
            status: 'approved', // Can only sign approved petitions
            signatures: { $ne: userId }, // Ensure user hasn't already signed ($ne = not equal)
            // Optional: Add deadline check if applicable
            // deadline: { $gt: new Date() } // Ensure deadline hasn't passed
        },
        {
            $addToSet: { signatures: userId }, // Add user ID to signatures array (prevents duplicates)
            $inc: { signatureCount: 1 } // Increment the count
        },
        {
            new: true, // Return the updated document
            runValidators: true // Ensure model validators run
        }
    ).populate('signatures', 'name username'); // Populate signatures for response

    if (!petition) {
        // Determine why the update failed
        const existingPetition = await Petition.findById(petitionId);
        if (!existingPetition) {
            return res.status(404).json({ status: 'fail', message: 'Petition not found.' });
        }
        if (existingPetition.status !== 'approved') {
            return res.status(400).json({ status: 'fail', message: 'Petition is not currently active for signing.' });
        }
        if (existingPetition.signatures.includes(userId)) {
            return res.status(400).json({ status: 'fail', message: 'You have already signed this petition.' });
        }
        // Add deadline check message if applicable
        // if (existingPetition.deadline && existingPetition.deadline <= new Date()) {
        //     return res.status(400).json({ status: 'fail', message: 'The deadline for signing this petition has passed.' });
        // }
        // Generic fallback
        return res.status(400).json({ status: 'fail', message: 'Could not sign petition.' });
    }

    res.status(200).json({
        status: 'success',
        message: 'Petition signed successfully!',
        data: {
            // Return relevant updated data, e.g., new count and potentially the updated signatures list
            signatureCount: petition.signatureCount,
            signatures: petition.signatures, // Send updated list of signers
        },
    });
});


// --- Admin Petition Functions ---

// Get all pending petitions
exports.getPendingPetitions = handleAsync(async (req, res, next) => {
    const petitions = await Petition.find({ status: 'pending' })
        .populate('creator', 'name email') // Populate creator info
        .sort({ createdAt: 'asc' }); // Show oldest pending first

    res.status(200).json({
        status: 'success',
        results: petitions.length,
        data: {
            petitions,
        },
    });
});

// Update petition status (approve, reject, close)
exports.updatePetitionStatus = handleAsync(async (req, res, next) => {
    const petitionId = req.params.id;
    const { status, adminNotes } = req.body;
    const validStatuses = ['approved', 'rejected', 'closed'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid status provided.' });
    }

    const updateData = {
        status,
        adminNotes: adminNotes || undefined, // Add notes if provided
    };

    // Set timestamp based on status
    if (status === 'approved') updateData.approvedAt = new Date();
    if (status === 'rejected') updateData.rejectedAt = new Date();
    if (status === 'closed') updateData.closedAt = new Date();

    const updatedPetition = await Petition.findByIdAndUpdate(
        petitionId,
        updateData,
        { new: true, runValidators: true }
    );

    if (!updatedPetition) {
        return res.status(404).json({ status: 'fail', message: 'Petition not found.' });
    }

    // TODO: Optionally send notifications upon status change

    res.status(200).json({
        status: 'success',
        message: `Petition status updated to ${status}.`,
        data: {
            petition: updatedPetition,
        },
    });
});

// Delete a petition (Admin only)
exports.deletePetition = handleAsync(async (req, res, next) => {
    const petitionId = req.params.id;

    const petition = await Petition.findByIdAndDelete(petitionId);

    if (!petition) {
        return res.status(404).json({ status: 'fail', message: 'Petition not found.' });
    }

    // TODO: Consider deleting associated data if necessary (e.g., comments if petitions had them)

    res.status(204).json({ // 204 No Content for successful deletion
        status: 'success',
        data: null,
    });
});
