import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MediaCarousel from '../components/MediaCarousel'; // Import the carousel component

function AdminDashboardPage() {
    const [pendingComplaints, setPendingComplaints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPendingComplaints = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get('/admin/complaints/pending'); // Use admin route
            setPendingComplaints(response.data.data.complaints);
        } catch (err) {
            console.error("Failed to fetch pending complaints:", err);
            setError(err.response?.data?.message || 'Failed to load pending complaints.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingComplaints();
    }, []);

    const handleUpdateStatus = async (id, status, notes = '') => {
        try {
            await api.patch(`/admin/complaints/${id}/status`, { status, adminNotes: notes });
            fetchPendingComplaints();
        } catch (err) {
            console.error(`Failed to ${status} complaint:`, err);
            alert(`Error: ${err.response?.data?.message || `Failed to ${status} complaint.`}`);
        }
    };

    // Helper function to calculate relative time (optional, install date-fns if needed: npm i date-fns)
    // import { formatDistanceToNow } from 'date-fns';
    // const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });
    const formatBasicDate = (date) => new Date(date).toLocaleString(); // Fallback

    return (
        // Use bg-gray-900 or a slightly different dark shade like #1A1A1B if preferred and configured in Tailwind
        <div className="bg-gray-900 min-h-screen text-gray-200 py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl"> {/* Constrain width */}
                <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-white text-center sm:text-left">Admin Dashboard - Pending Complaints</h1>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="ml-3 text-gray-400 text-lg">Loading...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded relative max-w-xl mx-auto" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {/* No Complaints State */}
                {!isLoading && !error && pendingComplaints.length === 0 && (
                    <p className="text-center text-gray-400 text-lg mt-6">No pending complaints found.</p>
                )}

                {/* Complaints List */}
                {!isLoading && !error && pendingComplaints.length > 0 && (
                    <div className="space-y-4"> {/* Reduced space for tighter look */}
                        {pendingComplaints.map((complaint) => (
                            // Card Styling - targeting the reference style
                            <div key={complaint._id} className="bg-gray-800 border border-gray-700 rounded-md overflow-hidden"> {/* Use gray-800 or #272729 */}
                                <div className="p-3 sm:p-4"> {/* Padding inside the card */}
                                    {/* Card Header: Metadata */}
                                    <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
                                        {/* Optional: Add user avatar/icon here */}
                                        <span className="font-medium text-gray-300">{complaint.user?.name || 'Unknown User'}</span>
                                        <span>•</span>
                                        {/* Use timeAgo(complaint.createdAt) if date-fns is installed */}
                                        <span>{formatBasicDate(complaint.createdAt)}</span>
                                        <span>•</span>
                                        <span className='truncate text-ellipsis overflow-hidden' title={complaint.user?.email || ''}>({complaint.user?.email || 'No email'})</span>
                                    </div>

                                    {/* Complaint Text/Title */}
                                    {/* <h2 className="text-lg font-medium text-gray-100 mb-1">{complaint.title || 'Complaint Details'}</h2> */}
                                    <p className="text-sm text-gray-200 leading-normal mb-3">
                                        {complaint.text}
                                    </p>

                                    {/* Media Carousel - Integrated into the flow */}
                                    {complaint.media && complaint.media.length > 0 && (
                                        <div className="my-3 bg-black rounded-md overflow-hidden"> {/* Black background for media container */}
                                            {/* Assuming MediaCarousel handles its aspect ratio and controls */}
                                            <MediaCarousel mediaUrls={complaint.media} />
                                        </div>
                                    )}

                                    {/* Tags / Flair */}
                                    <div className="flex flex-wrap gap-2 items-center mb-3">
                                        {complaint.tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300 capitalize"> {/* Flair style */}
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => handleUpdateStatus(complaint._id, 'approved')}
                                            title="Approve Complaint"
                                            className="flex items-center px-3 py-1 rounded text-xs font-medium text-green-400 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors duration-150"
                                        >
                                           {/* Optional Icon */} <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                const notes = prompt("Reason for rejection (optional):");
                                                if (notes !== null) {
                                                    handleUpdateStatus(complaint._id, 'rejected', notes);
                                                }
                                            }}
                                            title="Reject Complaint"
                                            className="flex items-center px-3 py-1 rounded text-xs font-medium text-red-400 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors duration-150"
                                        >
                                            {/* Optional Icon */} <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            Reject
                                        </button>
                                         {/* Placeholder for other actions like 'Add Note' */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboardPage;