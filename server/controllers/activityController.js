const Complaint = require('../models/Complaint');
const Petition = require('../models/Petition');
// const Comment = require('../models/Comment'); // Could add recent comments later

// Helper function for error handling
const handleAsync = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

exports.getRecentActivity = handleAsync(async (req, res, next) => {
    const limit = 5; // Number of recent items to fetch per type

    // Fetch recent approved complaints (simplified view)
    const recentComplaints = await Complaint.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('text createdAt tags') // Select only public, relevant fields
        .lean();

    // Fetch recent approved petitions (simplified view)
    const recentPetitions = await Petition.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title createdAt signatureCount goal') // Select public fields
        .lean();

    // Combine and sort activities by date (newest first)
    const activities = [
        ...recentComplaints.map(c => ({ type: 'complaint', data: c, date: c.createdAt })),
        ...recentPetitions.map(p => ({ type: 'petition', data: p, date: p.createdAt }))
        // Add other activity types here (e.g., recent comments on approved items)
    ];

    // Sort combined activities by date, descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit the total number of activities sent
    const limitedActivities = activities.slice(0, limit * 2); // Example: show up to 10 total items

    res.status(200).json({
        status: 'success',
        results: limitedActivities.length,
        data: {
            activities: limitedActivities,
        },
    });
});
