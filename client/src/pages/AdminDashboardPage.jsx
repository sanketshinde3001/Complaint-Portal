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
      // Refresh the list after updating status
      fetchPendingComplaints();
    } catch (err) {
       console.error(`Failed to ${status} complaint:`, err);
       alert(`Error: ${err.response?.data?.message || `Failed to ${status} complaint.`}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard - Pending Complaints</h1>

      {isLoading && <p>Loading pending complaints...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!isLoading && pendingComplaints.length === 0 && (
        <p>No pending complaints found.</p>
      )}

      {!isLoading && pendingComplaints.length > 0 && (
        <div className="space-y-4">
          {pendingComplaints.map((complaint) => (
            <div key={complaint._id} className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">
                Submitted by: {complaint.user?.name || 'Unknown'} ({complaint.user?.email || 'No email'}) on {new Date(complaint.createdAt).toLocaleString()}
              </p>
              <p className="mt-2">{complaint.text}</p>
              {/* Replace the media list with the MediaCarousel component */}
              {complaint.media && complaint.media.length > 0 && (
                 <MediaCarousel mediaUrls={complaint.media} />
              )}
              <p className="text-sm mt-3">Tags: <span className="font-medium">{complaint.tags.join(', ')}</span></p> {/* Added mt-3 for spacing */}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleUpdateStatus(complaint._id, 'approved')}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                      const notes = prompt("Reason for rejection (optional):");
                      handleUpdateStatus(complaint._id, 'rejected', notes || '');
                  }}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Reject
                </button>
                 {/* TODO: Add button/modal for adding admin notes without changing status */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
