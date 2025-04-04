import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
// Import necessary icons
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaCommentAlt, 
  FaShareAlt, 
  FaSpinner, 
  FaRegClock, 
  FaUserCircle,
  FaBookmark,
  FaEllipsisH,
  FaRegBookmark
} from 'react-icons/fa';
import MediaCarousel from '../components/MediaCarousel';

// Filter Button Component
const FilterButton = ({ value, label, currentFilter, setFilter }) => (
  <button
    onClick={() => setFilter(value)}
    className={`px-3 py-1 text-sm rounded-full transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 dark:focus:ring-offset-gray-800 ${
      currentFilter === value
        ? 'bg-orange-500 text-white font-semibold shadow-sm'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
    }`}
  >
    {label}
  </button>
);

// Complaint Card Component to clean up main component
const ComplaintCard = ({ complaint, user, handleVote, votingStates, showComingSoon, comingSoonState, timeAgo }) => {
  const [saved, setSaved] = useState(false);
  
  // Safely check vote status
  const userHasUpvoted = user && Array.isArray(complaint.upvotedBy) && complaint.upvotedBy.includes(user._id);
  const userHasDownvoted = user && Array.isArray(complaint.downvotedBy) && complaint.downvotedBy.includes(user._id);
  const isVoting = votingStates[complaint._id];

  const handleSave = () => {
    setSaved(!saved);
    // TODO: Implement save functionality with API
  };

  return (
    <div className="flex bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-150 ease-in-out group">
      {/* Voting Column */}
      <div className="flex flex-col items-center w-14 p-2 bg-gray-50 dark:bg-gray-900/30 space-y-1 flex-shrink-0">
        <button
          onClick={() => handleVote(complaint._id, 'upvote')}
          disabled={!user || isVoting}
          className={`p-1.5 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400 dark:focus:ring-offset-gray-800 ${
            userHasUpvoted
              ? 'text-orange-500 bg-orange-100 dark:bg-orange-800/30'
              : 'text-gray-400 dark:text-gray-500 hover:text-orange-500 hover:bg-gray-200 dark:hover:bg-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Upvote"
        >
          <FaArrowUp size="1.2em" />
        </button>

        <span className={`font-bold text-sm min-h-[20px] flex items-center justify-center ${
          isVoting
            ? 'text-blue-500'
            : userHasUpvoted
              ? 'text-orange-600 dark:text-orange-400'
              : userHasDownvoted
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-800 dark:text-gray-200'
        }`}>
          {isVoting ? <FaSpinner className="animate-spin" size="1em" /> : (complaint.score ?? 0)}
        </span>

        <button
          onClick={() => handleVote(complaint._id, 'downvote')}
          disabled={!user || isVoting}
          className={`p-1.5 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 dark:focus:ring-offset-gray-800 ${
            userHasDownvoted
              ? 'text-blue-500 bg-blue-100 dark:bg-blue-800/30'
              : 'text-gray-400 dark:text-gray-500 hover:text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Downvote"
        >
          <FaArrowDown size="1.2em" />
        </button>
      </div>

      {/* Complaint Content Area */}
      <div className="flex-1 p-4 overflow-hidden">
        {/* Metadata Line */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center flex-wrap gap-x-2">
          <span className="flex items-center gap-1">
            <FaUserCircle className="inline-block text-gray-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">
              {complaint.author?.username || 'Anonymous'}
            </span>
          </span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="flex items-center gap-1">
            <FaRegClock className="inline-block" />
            {timeAgo(complaint.createdAt)}
          </span>
        </div>

        {/* Complaint Text */}
        <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 leading-relaxed break-words">
          {complaint.text}
        </p>

        {/* Media Display */}
        {Array.isArray(complaint.media) && complaint.media.length > 0 && (
          <div className="mb-3 max-h-[500px] overflow-hidden rounded-lg flex justify-center items-center bg-black/90">
            <MediaCarousel mediaUrls={complaint.media} />
          </div>
        )}

        {/* Tags */}
        {Array.isArray(complaint.tags) && complaint.tags.length > 0 && (
          <div className="mt-2 mb-3 flex flex-wrap gap-1">
            {complaint.tags.map(tag => (
              <span key={tag} className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* Comments Button */}
          <div className="relative">
            <button
              onClick={() => showComingSoon(complaint._id, 'comment')}
              className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-md transition-colors duration-150"
              aria-label={`View comments for complaint ${complaint._id}`}
            >
              <FaCommentAlt />
              <span>{complaint.commentCount || 0} Comments</span>
            </button>
            {comingSoonState.id === complaint._id && comingSoonState.type === 'comment' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-10">
                Coming soon...
              </div>
            )}
          </div>

          {/* Share Button */}
          <div className="relative">
            <button
              onClick={() => showComingSoon(complaint._id, 'share')}
              className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-md transition-colors duration-150"
              aria-label={`Share complaint ${complaint._id}`}
            >
              <FaShareAlt />
              <span>Share</span>
            </button>
            {comingSoonState.id === complaint._id && comingSoonState.type === 'share' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-10">
                Coming soon...
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-md transition-colors duration-150"
            aria-label={`Save complaint ${complaint._id}`}
          >
            {saved ? <FaBookmark className="text-blue-500" /> : <FaRegBookmark />}
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>

          {/* More Options */}
          <div className="relative ml-auto">
            <button
              onClick={() => showComingSoon(complaint._id, 'more')}
              className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-md transition-colors duration-150"
              aria-label="More options"
            >
              <FaEllipsisH />
            </button>
            {comingSoonState.id === complaint._id && comingSoonState.type === 'more' && (
              <div className="absolute bottom-full right-0 mb-1.5 px-2 py-0.5 bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-10">
                More options coming soon...
              </div>
            )}
          </div>
        </div>

        {/* Admin Notes (Optional) */}
        {complaint.adminNotes && (
          <p className="text-xs mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 italic bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded">
            <span className="font-semibold">Admin Note:</span> {complaint.adminNotes}
          </p>
        )}
      </div>
    </div>
  );
};

function HomePage() {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('new');
  const [timeFilter, setTimeFilter] = useState('all');
  const [votingStates, setVotingStates] = useState({});
  const [comingSoonState, setComingSoonState] = useState({ id: null, type: null });
  const comingSoonTimeoutRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // --- Data Fetching ---
  const fetchComplaints = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    
    if (reset) {
      setPage(1);
      setComplaints([]);
    }
    
    console.log(`Fetching complaints: sort=${sortBy}, time=${timeFilter}, page=${currentPage}`);
    setIsLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({ 
        sort: sortBy,
        page: currentPage,
        limit: 10
      });
      
      if ((sortBy === 'top' || sortBy === 'best') && timeFilter !== 'all') {
        params.append('t', timeFilter);
      }
      
      const response = await api.get(`/complaints?${params.toString()}`);
      const newComplaints = Array.isArray(response.data?.data?.complaints) ? response.data.data.complaints : [];
      
      if (reset) {
        setComplaints(newComplaints);
      } else {
        setComplaints(prev => [...prev, ...newComplaints]);
      }
      
      // Check if we have more pages
      const totalComplaints = response.data?.total || 0;
      const fetchedCount = (currentPage * 10);
      setHasMore(fetchedCount < totalComplaints);
      
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      const errorMsg = err.response?.data?.message || 'Failed to load complaints. Please check your connection and try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, timeFilter]);

  // Load more complaints
  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  // --- Voting Logic ---
  const handleVote = async (id, voteType) => {
    if (!user) {
      setError('Please log in to vote.');
      return;
    }
    if (votingStates[id]) return;

    setVotingStates(prev => ({ ...prev, [id]: true }));
    setError('');

    try {
      const response = await api.post(`/complaints/${id}/${voteType}`);
      const updatedVoteData = response.data.data;

      setComplaints(prevComplaints =>
        prevComplaints.map(c => {
          if (c._id === id) {
            return {
              ...c,
              upvotes: updatedVoteData.upvotes,
              downvotes: updatedVoteData.downvotes,
              score: updatedVoteData.score,
              upvotedBy: Array.isArray(updatedVoteData.upvotedBy) ? updatedVoteData.upvotedBy : [],
              downvotedBy: Array.isArray(updatedVoteData.downvotedBy) ? updatedVoteData.downvotedBy : [],
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error(`Failed to ${voteType} complaint ${id}:`, err);
      setError(err.response?.data?.message || `Failed to ${voteType}. Please try again.`);
    } finally {
      setVotingStates(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  // --- "Coming Soon" Logic ---
  const showComingSoon = (id, type) => {
    if (comingSoonTimeoutRef.current) {
      clearTimeout(comingSoonTimeoutRef.current);
    }
    setComingSoonState({ id, type });
    comingSoonTimeoutRef.current = setTimeout(() => {
      setComingSoonState({ id: null, type: null });
      comingSoonTimeoutRef.current = null;
    }, 2000);
  };

  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (comingSoonTimeoutRef.current) {
        clearTimeout(comingSoonTimeoutRef.current);
      }
    };
  }, []);

  // --- Effects ---
  useEffect(() => {
    fetchComplaints(true); // Reset and fetch when filters change
  }, [sortBy, timeFilter]);

  useEffect(() => {
    if (page > 1) {
      fetchComplaints(false); // Fetch more data when page changes
    }
  }, [page]);

  // --- Helper Functions ---
  const timeAgo = (dateString) => {
    if (!dateString) return 'some time ago';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
      const minutes = Math.round(seconds / 60);
      const hours = Math.round(minutes / 60);
      const days = Math.round(hours / 24);
      const weeks = Math.round(days / 7);
      const months = Math.round(days / 30.44);
      const years = Math.round(days / 365.25);

      if (isNaN(seconds) || seconds < 0) return 'in the future?';
      if (seconds < 60) return `${seconds}s ago`;
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      if (weeks < 5) return `${weeks}w ago`;
      if (months < 12) return `${months}mo ago`;
      return `${years}y ago`;
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'invalid date';
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-2 sm:px-4 py-4 max-w-3xl">
        {/* Filtering UI - Reddit-style Card */}
        <div className="mb-6 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Sort By Buttons */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-2">
              <span className="font-semibold text-sm text-gray-600 dark:text-gray-400 mr-2 whitespace-nowrap">Sort by:</span>
              <FilterButton value="new" label="New" currentFilter={sortBy} setFilter={setSortBy} />
              <FilterButton value="top" label="Top" currentFilter={sortBy} setFilter={setSortBy} />
              <FilterButton value="best" label="Best" currentFilter={sortBy} setFilter={setSortBy} />
            </div>

            {/* Time Filter Buttons (Conditional) */}
            {(sortBy === 'top' || sortBy === 'best') && (
              <div className="flex items-center flex-wrap gap-x-2 gap-y-2 sm:border-l sm:border-gray-300 sm:dark:border-gray-600 sm:pl-4">
                <span className="font-semibold text-sm text-gray-600 dark:text-gray-400 mr-2 whitespace-nowrap">Time:</span>
                <FilterButton value="day" label="Day" currentFilter={timeFilter} setFilter={setTimeFilter} />
                <FilterButton value="week" label="Week" currentFilter={timeFilter} setFilter={setTimeFilter} />
                <FilterButton value="month" label="Month" currentFilter={timeFilter} setFilter={setTimeFilter} />
                <FilterButton value="all" label="All Time" currentFilter={timeFilter} setFilter={setTimeFilter} />
              </div>
            )}
          </div>
        </div>

        {/* Loading State - Initial */}
        {isLoading && complaints.length === 0 && (
          <div className="text-center mt-16">
            <FaSpinner className="animate-spin text-5xl text-orange-500 mx-auto" />
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">Loading complaints...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300 rounded-md text-center" role="alert">
            <p className="font-bold">Oops!</p>
            <p>{error}</p>
          </div>
        )}

        {/* No Complaints Found State */}
        {!isLoading && complaints.length === 0 && !error && (
          <div className="text-center mt-16 text-gray-500 dark:text-gray-400">
            <FaCommentAlt className="text-6xl mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-xl font-semibold mb-2">No complaints found</p>
            <p>Try adjusting the filters or check back later.</p>
          </div>
        )}

        {/* Complaints List */}
        {complaints.length > 0 && (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <ComplaintCard 
                key={complaint._id}
                complaint={complaint}
                user={user}
                handleVote={handleVote}
                votingStates={votingStates}
                showComingSoon={showComingSoon}
                comingSoonState={comingSoonState}
                timeAgo={timeAgo}
              />
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-6 mb-8">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading && complaints.length > 0 ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
            
            {/* End of results message */}
            {!hasMore && complaints.length > 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                You've reached the end of the list!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;