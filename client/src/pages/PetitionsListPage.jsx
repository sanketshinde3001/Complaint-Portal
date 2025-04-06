import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPetitions } from '../services/api'; // Import API function
import { FaPlus, FaSpinner, FaUsers, FaBullseye, FaCalendarTimes } from 'react-icons/fa'; // Icons

// Helper to format date or return 'N/A'
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return 'Invalid Date';
    }
};

// Petition Card Component
const PetitionCard = ({ petition }) => {
    const progress = petition.goal ? Math.min((petition.signatureCount / petition.goal) * 100, 100) : 0;

    return (
        <Link
            to={`/petition/${petition._id}`}
            className="block bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-150 ease-in-out"
        >
            <div className="p-5">
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-2">{petition.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Created by {petition.creator?.username || 'Unknown'} on {formatDate(petition.createdAt)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                    {petition.description}
                </p>

                {/* Signature Info & Progress */}
                <div className="flex items-center justify-between text-sm mb-3">
                    <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
                        <FaUsers className="mr-1.5" /> {petition.signatureCount || 0} Signatures
                    </span>
                    {petition.goal && (
                        <span className="flex items-center text-gray-600 dark:text-gray-400">
                            <FaBullseye className="mr-1.5" /> Goal: {petition.goal}
                        </span>
                    )}
                </div>

                {/* Progress Bar (if goal exists) */}
                {petition.goal && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                        <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${progress}%` }}
                            title={`${progress.toFixed(0)}% Reached`}
                        ></div>
                    </div>
                )}

                {/* Deadline */}
                {petition.deadline && (
                     <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
                        <FaCalendarTimes className="mr-1.5" /> Deadline: {formatDate(petition.deadline)}
                     </p>
                )}

                 {/* Tags */}
                 {Array.isArray(petition.tags) && petition.tags.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-1">
                        {petition.tags.map(tag => (
                        <span key={tag} className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                            #{tag}
                        </span>
                        ))}
                    </div>
                 )}
            </div>
        </Link>
    );
};


function PetitionsListPage() {
  const [petitions, setPetitions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('new'); // 'new', 'popular'

  const fetchPetitions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = { sort: sortBy };
      const response = await getPetitions(params);
      setPetitions(response.data.data.petitions);
    } catch (err) {
      console.error("Failed to fetch petitions:", err);
      setError(err.response?.data?.message || 'Failed to load petitions.');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchPetitions();
  }, [fetchPetitions]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-gray-100">Petitions</h1>
        <Link
          to="/petitions/new"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition-colors duration-150"
        >
          <FaPlus className="mr-2" /> Create Petition
        </Link>
      </div>

      {/* TODO: Add Sorting/Filtering Controls */}
      <div className="mb-4">
        <span className="mr-2 dark:text-gray-300">Sort by:</span>
        <button onClick={() => setSortBy('new')} className={`mr-2 px-3 py-1 rounded ${sortBy === 'new' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-700 dark:text-gray-200'}`}>Newest</button>
        <button onClick={() => setSortBy('popular')} className={`px-3 py-1 rounded ${sortBy === 'popular' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-700 dark:text-gray-200'}`}>Most Popular</button>
      </div>

      {isLoading && (
          <div className="text-center mt-16">
            <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto" />
            <p className="mt-3 text-gray-600 dark:text-gray-400">Loading petitions...</p>
          </div>
      )}
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      {!isLoading && petitions.length === 0 && !error && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No approved petitions found.</p>
      )}

      {!isLoading && petitions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {petitions.map((petition) => (
            <PetitionCard key={petition._id} petition={petition} />
          ))}
        </div>
      )}
       {/* TODO: Add Pagination if needed */}
    </div>
  );
}

export default PetitionsListPage;
