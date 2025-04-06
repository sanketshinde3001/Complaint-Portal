const User = require('../models/User'); // Need User model to check timestamps

// Helper function to check if a date is within the last 24 hours
const isWithinLast24Hours = (date) => {
    if (!date) return false;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return date > twentyFourHoursAgo;
};

// Middleware to limit complaint creation to one per day
exports.limitComplaintCreation = async (req, res, next) => {
    try {
        // req.user should be populated by authMiddleware.protect
        if (!req.user) {
            return res.status(401).json({ status: 'fail', message: 'Authentication required.' });
        }

        // Fetch the user document again to get the latest timestamps (or ensure protect middleware populates them)
        const user = await User.findById(req.user._id).select('+lastComplaintAt');
        if (!user) {
             return res.status(401).json({ status: 'fail', message: 'User not found.' });
        }

        if (user.lastComplaintAt && isWithinLast24Hours(user.lastComplaintAt)) {
            return res.status(429).json({ // 429 Too Many Requests
                status: 'fail',
                message: 'You can only submit one complaint per 24 hours.',
            });
        }

        // If limit not reached, proceed to the next middleware/controller
        next();
    } catch (error) {
        console.error("Rate limit check error (Complaint):", error);
        res.status(500).json({ status: 'error', message: 'Error checking submission limit.' });
    }
};

// Middleware to limit petition creation to one per day
exports.limitPetitionCreation = async (req, res, next) => {
     try {
        if (!req.user) {
            return res.status(401).json({ status: 'fail', message: 'Authentication required.' });
        }

        const user = await User.findById(req.user._id).select('+lastPetitionAt');
         if (!user) {
             return res.status(401).json({ status: 'fail', message: 'User not found.' });
        }

        if (user.lastPetitionAt && isWithinLast24Hours(user.lastPetitionAt)) {
            return res.status(429).json({
                status: 'fail',
                message: 'You can only submit one petition per 24 hours.',
            });
        }
        next();
    } catch (error) {
        console.error("Rate limit check error (Petition):", error);
        res.status(500).json({ status: 'error', message: 'Error checking submission limit.' });
    }
};
