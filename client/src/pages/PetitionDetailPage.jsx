import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPetition, signPetition } from '../services/api'; // Import API functions
import { AuthContext } from '../contexts/AuthContext';
import { FaUsers, FaBullseye, FaCalendarTimes, FaCheckCircle, FaSpinner, FaUserCircle } from 'react-icons/fa'; // Icons

// Helper to format date or return 'N/A'
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return 'Invalid Date';
    }
};

function PetitionDetailPage() {
  const { id: petitionId } = useParams();
  const { user, isLoggedIn } = useContext(AuthContext);
  const [petition, setPetition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState('');
  const [signSuccess, setSignSuccess] = useState(false);

  const fetchPetitionDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setSignError('');
    setSignSuccess(false);
    try {
      const response = await getPetition(petitionId);
      setPetition(response.data.data.petition);
    } catch (err) {
      console.error("Failed to fetch petition details:", err);
      setError(err.response?.data?.message || 'Failed to load petition details.');
    } finally {
      setIsLoading(false);
    }
  }, [petitionId]);

  useEffect(() => {
    fetchPetitionDetails();
  }, [fetchPetitionDetails]);

  const handleSignPetition = async () => {
    if (!isLoggedIn || !petition || !petition.isActive) return; // Guard clauses

    setIsSigning(true);
    setSignError('');
    setSignSuccess(false);
    try {
      const response = await signPetition(petitionId);
      setSignSuccess(true);
      // Update petition state locally with new signer count and list
      setPetition(prev => ({
          ...prev,
          signatureCount: response.data.data.signatureCount,
          signatures: response.data.data.signatures, // Assuming backend returns updated list
      }));
      // Optionally refetch all details: await fetchPetitionDetails();
    } catch (err) {
      console.error("Failed to sign petition:", err);
      setSignError(err.response?.data?.message || 'Failed to sign petition.');
    } finally {
      setIsSigning(false);
    }
  };

  // Check if the current user has already signed
  const hasUserSigned = petition?.signatures?.some(signer => signer._id === user?._id);
  const canSign = isLoggedIn && petition?.isActive && !hasUserSigned;

  // Calculate progress
  const progress = petition?.goal ? Math.min((petition.signatureCount / petition.goal) * 100, 100) : 0;

  if (isLoading) {
    return <div className="text-center mt-16"><FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto" /></div>;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">{error}</p>;
  }

  if (!petition) {
    return <p className="text-center text-gray-500 mt-8">Petition not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border dark:border-gray-700">
        <div className="p-6 md:p-8">
          {/* Title and Status */}
          <div className="mb-4">
             <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mr-2 ${
                 petition.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                 petition.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                 petition.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
             }`}>
                {petition.status.charAt(0).toUpperCase() + petition.status.slice(1)}
             </span>
             <h1 className="text-2xl md:text-3xl font-bold mt-1">{petition.title}</h1>
          </div>

          {/* Creator and Date */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Created by <span className="font-medium">{petition.creator?.username || 'Unknown'}</span> on {formatDate(petition.createdAt)}
          </p>

          {/* Description */}
          <div className="mb-5 prose prose-sm dark:prose-invert max-w-none">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p>{petition.description}</p>
          </div>

          {/* Demands */}
          <div className="mb-6 prose prose-sm dark:prose-invert max-w-none">
            <h2 className="text-lg font-semibold mb-2">Demands</h2>
            <p>{petition.demands}</p>
          </div>

          {/* Signature Goal and Deadline */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm mb-6 border-t dark:border-gray-700 pt-4">
            <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
                <FaUsers className="mr-1.5 text-lg" /> {petition.signatureCount || 0} Signatures
            </span>
            {petition.goal && (
                <span className="flex items-center text-gray-600 dark:text-gray-400">
                    <FaBullseye className="mr-1.5 text-lg" /> Goal: {petition.goal}
                </span>
            )}
            {petition.deadline && (
                <span className={`flex items-center ${new Date(petition.deadline) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    <FaCalendarTimes className="mr-1.5 text-lg" /> Deadline: {formatDate(petition.deadline)}
                </span>
            )}
          </div>

          {/* Progress Bar */}
          {petition.goal && (
            <div className="mb-6">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">{progress.toFixed(0)}% of goal reached</p>
            </div>
          )}

          {/* Sign Button Area */}
          <div className="mt-6 text-center border-t dark:border-gray-700 pt-6">
            {signSuccess ? (
                <p className="text-green-600 dark:text-green-400 font-semibold flex items-center justify-center"><FaCheckCircle className="mr-2"/> Thank you for signing!</p>
            ) : hasUserSigned ? (
                <p className="text-gray-600 dark:text-gray-400 font-semibold flex items-center justify-center"><FaCheckCircle className="mr-2 text-green-500"/> You have already signed this petition.</p>
            ) : !petition.isActive ? (
                 <p className="text-gray-500 dark:text-gray-400">This petition is no longer active for signing.</p>
            ) : !isLoggedIn ? (
                 <p className="text-gray-500 dark:text-gray-400">Please <Link to="/login" className="text-blue-500 hover:underline">log in</Link> to sign this petition.</p>
            ) : (
              <button
                onClick={handleSignPetition}
                disabled={isSigning}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-wait transition duration-150 inline-flex items-center"
              >
                {isSigning ? <FaSpinner className="animate-spin mr-2" /> : <FaUsers className="mr-2" />}
                {isSigning ? 'Signing...' : 'Sign this Petition'}
              </button>
            )}
            {signError && <p className="text-red-500 text-sm mt-2">{signError}</p>}
          </div>

        </div>

        {/* Signatures List */}
        {petition.signatures && petition.signatures.length > 0 && (
            <div className="border-t dark:border-gray-700 p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-4">Signers ({petition.signatureCount})</h2>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {petition.signatures.map(signer => (
                        <li key={signer._id} className="text-sm flex items-center">
                           <FaUserCircle className="mr-2 text-gray-400"/> {signer.name || signer.username || 'Signed'}
                        </li>
                    ))}
                </ul>
            </div>
        )}

      </div>
    </div>
  );
}

export default PetitionDetailPage;
