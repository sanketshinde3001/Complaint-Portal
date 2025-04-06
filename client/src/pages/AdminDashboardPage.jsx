import React, { useState, useEffect, useCallback } from 'react';
import api, { getPendingPetitionsAdmin, updatePetitionStatusAdmin, deletePetitionAdmin } from '../services/api'; // Import petition admin functions
import MediaCarousel from '../components/MediaCarousel'; // Import the carousel component

// Helper function to calculate relative time (optional, install date-fns if needed: npm i date-fns)
// import { formatDistanceToNow } from 'date-fns';
// const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });
const formatBasicDate = (date) => new Date(date).toLocaleString(); // Fallback

function AdminDashboardPage() {
    const [pendingComplaints, setPendingComplaints] = useState([]);
    const [pendingPetitions, setPendingPetitions] = useState([]); // State for pending petitions
    const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
    const [isLoadingPetitions, setIsLoadingPetitions] = useState(true); // Separate loading state
    const [complaintsError, setComplaintsError] = useState('');
    const [petitionsError, setPetitionsError] = useState(''); // Separate error state

    const fetchPendingComplaints = useCallback(async () => {
        setIsLoadingComplaints(true);
        setComplaintsError('');
        try {
            const response = await api.get('/admin/complaints/pending');
            setPendingComplaints(response.data.data.complaints);
        } catch (err) {
            console.error("Failed to fetch pending complaints:", err);
            setComplaintsError(err.response?.data?.message || 'Failed to load pending complaints.');
        } finally {
            setIsLoadingComplaints(false);
        }
    }, []);

    const fetchPendingPetitions = useCallback(async () => {
        setIsLoadingPetitions(true);
        setPetitionsError('');
        try {
            const response = await getPendingPetitionsAdmin();
            setPendingPetitions(response.data.data.petitions);
        } catch (err) {
            console.error("Failed to fetch pending petitions:", err);
            setPetitionsError(err.response?.data?.message || 'Failed to load pending petitions.');
        } finally {
            setIsLoadingPetitions(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingComplaints();
        fetchPendingPetitions(); // Fetch both on mount
    }, [fetchPendingComplaints, fetchPendingPetitions]);

    // --- Complaint Handlers ---
    const handleUpdateComplaintStatus = async (id, status, notes = '') => {
        try {
            await api.patch(`/admin/complaints/${id}/status`, { status, adminNotes: notes });
            fetchPendingComplaints(); // Refetch complaints
        } catch (err) {
            console.error(`Failed to ${status} complaint:`, err);
            alert(`Error updating complaint: ${err.response?.data?.message || `Failed to ${status} complaint.`}`);
        }
    };

    // --- Petition Handlers ---
    const handleUpdatePetitionStatus = async (id, status, notes = '') => {
        try {
            await updatePetitionStatusAdmin(id, status, notes);
            fetchPendingPetitions(); // Refetch petitions
        } catch (err) {
            console.error(`Failed to ${status} petition:`, err);
            alert(`Error updating petition: ${err.response?.data?.message || `Failed to ${status} petition.`}`);
        }
    };

    const handleDeletePetition = async (id) => {
        if (!window.confirm('Are you sure you want to delete this petition permanently?')) {
            return;
        }
        try {
            await deletePetitionAdmin(id);
            fetchPendingPetitions(); // Refetch petitions
        } catch (err) {
            console.error(`Failed to delete petition:`, err);
            alert(`Error deleting petition: ${err.response?.data?.message || `Failed to delete petition.`}`);
        }
    };


    return (
        <div className="bg-gray-900 min-h-screen text-gray-200 py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl"> {/* Wider container */}
                <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-white text-center">Admin Dashboard</h1>

                {/* --- Pending Complaints Section --- */}
                <section className="mb-12">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-blue-300 border-b border-gray-700 pb-2">Pending Complaints</h2>
                    {/* Loading State */}
                    {isLoadingComplaints && (
                        <div className="flex justify-center items-center py-10">
                            {/* Simple Spinner */}
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                            <p className="ml-3 text-gray-400 text-lg">Loading Complaints...</p>
                        </div>
                    )}
                    {/* Error State */}
                    {complaintsError && (
                        <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded relative max-w-xl mx-auto" role="alert">
                            <span className="block sm:inline">{complaintsError}</span>
                        </div>
                    )}
                    {/* No Complaints State */}
                    {!isLoadingComplaints && !complaintsError && pendingComplaints.length === 0 && (
                        <p className="text-center text-gray-400 text-lg mt-6">No pending complaints found.</p>
                    )}
                    {/* Complaints List */}
                    {!isLoadingComplaints && !complaintsError && pendingComplaints.length > 0 && (
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
                                            onClick={() => handleUpdateComplaintStatus(complaint._id, 'approved')}
                                            title="Approve Complaint"
                                            className="flex items-center px-3 py-1 rounded text-xs font-medium text-green-400 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors duration-150"
                                        >
                                           {/* Optional Icon */} <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                const notes = prompt("Reason for rejection (optional):");
                                                if (notes !== null) { // Check if user cancelled prompt
                                                    handleUpdateComplaintStatus(complaint._id, 'rejected', notes);
                                                }
                                            }}
                                            title="Reject Complaint"
                                            className="flex items-center px-3 py-1 rounded text-xs font-medium text-red-400 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors duration-150"
                                        >
                                            {/* Optional Icon */} <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            Reject
                                        </button>
                                         {/* TODO: Add Delete Complaint Button */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                </section>

                 {/* --- Pending Petitions Section --- */}
                 <section>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-blue-300 border-b border-gray-700 pb-2">Pending Petitions</h2>
                    {/* Loading State */}
                    {isLoadingPetitions && (
                        <div className="flex justify-center items-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                            <p className="ml-3 text-gray-400 text-lg">Loading Petitions...</p>
                        </div>
                    )}
                    {/* Error State */}
                    {petitionsError && (
                        <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded relative max-w-xl mx-auto" role="alert">
                            <span className="block sm:inline">{petitionsError}</span>
                        </div>
                    )}
                    {/* No Petitions State */}
                    {!isLoadingPetitions && !petitionsError && pendingPetitions.length === 0 && (
                        <p className="text-center text-gray-400 text-lg mt-6">No pending petitions found.</p>
                    )}
                    {/* Petitions List */}
                    {!isLoadingPetitions && !petitionsError && pendingPetitions.length > 0 && (
                        <div className="space-y-4">
                            {pendingPetitions.map((petition) => (
                                <div key={petition._id} className="bg-gray-800 border border-gray-700 rounded-md p-3 sm:p-4">
                                    <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
                                        <span className="font-medium text-gray-300">{petition.creator?.name || 'Unknown User'}</span>
                                        <span>•</span>
                                        <span>{formatBasicDate(petition.createdAt)}</span>
                                        <span>•</span>
                                        <span className='truncate text-ellipsis overflow-hidden' title={petition.creator?.email || ''}>({petition.creator?.email || 'No email'})</span>
                                    </div>
                                    <h3 className="text-md font-semibold text-gray-100 mb-1">{petition.title}</h3>
                                    <p className="text-sm text-gray-300 mb-2 line-clamp-2">{petition.description}</p>
                                    <p className="text-sm text-gray-300 mb-3"><span className="font-medium">Demands:</span> {petition.demands}</p>
                                    {/* Optional: Display Goal/Deadline */}
                                    <div className="text-xs text-gray-400 mb-3 space-x-4">
                                        {petition.goal && <span>Goal: {petition.goal}</span>}
                                        {petition.deadline && <span>Deadline: {formatBasicDate(petition.deadline)}</span>}
                                    </div>
                                    {/* Action Bar */}
                                    <div className="flex items-center space-x-3 border-t border-gray-700 pt-3 mt-3">
                                        <button
                                            onClick={() => handleUpdatePetitionStatus(petition._id, 'approved')}
                                            title="Approve Petition"
                                            className="flex items-center px-3 py-1 rounded text-xs font-medium text-green-400 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors duration-150"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                const notes = prompt("Reason for rejection (optional):");
                                                if (notes !== null) {
                                                    handleUpdatePetitionStatus(petition._id, 'rejected', notes);
                                                }
                                            }}
                                            title="Reject Petition"
                                            className="flex items-center px-3 py-1 rounded text-xs font-medium text-yellow-400 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-yellow-500 transition-colors duration-150"
                                        >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleDeletePetition(petition._id)}
                                            title="Delete Petition Permanently"
                                            className="flex items-center px-3 py-1 rounded text-xs font-medium text-red-400 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors duration-150 ml-auto" // Push to right
                                        >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </section>
            </div>
        </div>
    );
}

export default AdminDashboardPage;
