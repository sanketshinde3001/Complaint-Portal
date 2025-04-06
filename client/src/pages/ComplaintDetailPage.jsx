import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
// Import default api instance AND named exports for comment functions
import api, { postComment, getComments } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import MediaCarousel from '../components/MediaCarousel';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; // For voting display

function ComplaintDetailPage() {
  const { id: complaintId } = useParams(); // Get complaint ID from URL
  const { user } = useContext(AuthContext);
  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoadingComplaint, setIsLoadingComplaint] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [error, setError] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isVoting, setIsVoting] = useState(false); // Add voting state

  // Fetch Complaint Details
  useEffect(() => {
    const fetchComplaint = async () => {
      setIsLoadingComplaint(true);
      setError('');
      try {
        const response = await api.get(`/complaints/${complaintId}`); // Use default api instance
        setComplaint(response.data.data.complaint);
      } catch (err) {
        console.error("Failed to fetch complaint details:", err);
        setError(err.response?.data?.message || 'Failed to load complaint details.');
      } finally {
        setIsLoadingComplaint(false);
      }
    };
    fetchComplaint();
  }, [complaintId]);

  // Fetch Comments function (to be reusable)
  const fetchComments = async () => {
    setIsLoadingComments(true);
    // Don't reset main error state here, could overwrite complaint fetch error
    try {
      // Use the named export 'getComments'
      const response = await getComments(complaintId);
      setComments(response.data.data.comments);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      // Set a specific comment error or append to main error?
      setError(prev => prev ? `${prev}\nFailed to load comments.` : 'Failed to load comments.');
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Fetch Comments on initial load or when complaintId changes
  useEffect(() => {
    if (complaintId) { // Only fetch if ID is available
        fetchComments();
    }
  }, [complaintId]); // Dependency array

  // Implement handleVote function
  const handleVote = async (voteType) => {
      if (!user || !complaint || isVoting) return; // Check user, complaint, and voting state

      setIsVoting(true);
      setError(''); // Clear previous errors

      try {
          const response = await api.post(`/complaints/${complaintId}/${voteType}`);
          const updatedVoteData = response.data.data;

          // Update the local complaint state with new vote data
          setComplaint(prevComplaint => ({
              ...prevComplaint,
              upvotes: updatedVoteData.upvotes,
              downvotes: updatedVoteData.downvotes,
              score: updatedVoteData.score,
              upvotedBy: Array.isArray(updatedVoteData.upvotedBy) ? updatedVoteData.upvotedBy : [],
              downvotedBy: Array.isArray(updatedVoteData.downvotedBy) ? updatedVoteData.downvotedBy : [],
          }));

      } catch (err) {
          console.error(`Failed to ${voteType} complaint:`, err);
          setError(err.response?.data?.message || `Failed to ${voteType}. Please try again.`);
          // Optionally revert optimistic update if implemented, but here we update after success
      } finally {
          setIsVoting(false);
      }
  };

  // Handle Top-Level Comment Submission
  const handleCommentSubmit = async (e) => {
      e.preventDefault();
      if (!newCommentText.trim() || !user) return; // Also check if user is logged in

      setIsSubmittingComment(true);
      setError(''); // Clear previous errors

      try {
          // Use imported postComment function
          await postComment(complaintId, newCommentText.trim());
          setNewCommentText(''); // Clear input
          await fetchComments(); // Refetch comments to show the new one
      } catch (err) {
          console.error("Failed to post comment:", err);
          setError(err.response?.data?.message || 'Failed to post comment.');
      } finally {
          setIsSubmittingComment(false);
      }
  };

  // Handle Reply Submission (passed down to CommentItem)
  const handleReplySubmit = async (parentCommentId, replyText) => {
      if (!replyText.trim() || !user) return false; // Indicate failure if text is empty or user not logged in

      // Consider adding a loading state specific to the reply form
      setError('');
      try {
          // Use imported postComment function with parentId
          await postComment(complaintId, replyText.trim(), parentCommentId);
          await fetchComments(); // Refetch comments to show the new reply
          return true; // Indicate success
      } catch (err) {
          console.error("Failed to post reply:", err);
          setError(err.response?.data?.message || 'Failed to post reply.');
          return false; // Indicate failure
      } finally {
          // Reset reply-specific loading state if implemented
      }
  };

  // --- Recursive Comment Rendering Component ---
  const MAX_REPLY_DEPTH = 3; // Define the maximum nesting level for replies

  const CommentItem = ({ comment, level = 0 }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // State for collapsing

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const submitReply = async (e) => {
        e.preventDefault();
        setIsSubmittingReply(true);
        const success = await handleReplySubmit(comment._id, replyText);
        setIsSubmittingReply(false);
        if (success) {
            setReplyText(''); // Clear reply form on success
            setShowReplyForm(false); // Hide form on success
        }
        // Error is handled globally in handleReplySubmit and shown at the bottom
    };

    // Determine if the comment has replies to allow collapsing
    const hasReplies = comment.replies && comment.replies.length > 0;

    // Limit visual indentation using max-w or specific ml classes
    const indentationClass = level > 0 ? `ml-${Math.min(level, 5) * 4}` : ''; // Cap indentation at level 5 visually

    return (
      // Use padding and border for separation, adjust dark mode border
      <div className={`py-3 ${indentationClass} ${level > 0 ? 'pl-4 border-l border-gray-200 dark:border-gray-600' : ''} ${level === 0 ? 'border-t border-gray-100 dark:border-gray-700 first:border-t-0' : ''}`}>
        <div className="flex items-center mb-1.5 text-xs"> {/* Adjusted spacing */}
           {/* Collapse/Expand Button - Styled */}
           {hasReplies && (
             <button
               onClick={toggleCollapse}
               className="mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
               aria-label={isCollapsed ? 'Expand comment thread' : 'Collapse comment thread'}
               title={isCollapsed ? 'Expand' : 'Collapse'} // Tooltip
             >
               {/* Use a more subtle icon or character */}
               {isCollapsed ? '⊕' : '⊖'}
             </button>
           )}
          {/* Author and Timestamp */}
          <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">{comment.author?.name || 'Anonymous'}</span>
          <span className="text-gray-500 dark:text-gray-400">{new Date(comment.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Conditionally render content based on collapsed state */}
        {!isCollapsed && (
          <>
            {/* Comment Text - Adjusted padding */}
            <p className="text-sm text-gray-800 dark:text-gray-200 mb-2 pl-4 leading-relaxed">{comment.text}</p>
            {/* Actions - Adjusted padding */}
            <div className="flex items-center space-x-4 pl-4">
              {/* Only show Reply button if max depth not reached */}
              {level < MAX_REPLY_DEPTH && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)} // Toggle reply form
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400 dark:disabled:text-gray-500"
                disabled={!user} // Disable reply if not logged in
              >
                Reply
                </button>
              )}
             {/* TODO: Add Edit/Delete buttons if needed, based on user permissions */}
            </div>

            {/* Reply Form - Only show if button is visible and toggled */}
            {/* Reply Form - Improved Styling */}
            {level < MAX_REPLY_DEPTH && showReplyForm && user && (
              <form onSubmit={submitReply} className="mt-3 pl-4"> {/* Consistent indent */}
                 <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Replying to ${comment.author?.name || 'Anonymous'}...`}
                    rows="2"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" // Enhanced styles
                 />
                 <div className="flex items-center gap-3"> {/* Increased gap */}
                     <button
                        type="submit"
                        disabled={!replyText.trim() || isSubmittingReply}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1.5 rounded-md shadow-sm disabled:opacity-60 transition duration-150" // Enhanced styles
                     >
                        {isSubmittingReply ? 'Submitting...' : 'Submit'}
                     </button>
                     <button
                        type="button"
                        onClick={() => setShowReplyForm(false)}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                 >
                    Cancel
                 </button>
             </div>
          </form>
        )}

        {/* Render Replies Recursively */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => (
              <CommentItem key={reply._id} comment={reply} level={level + 1} />
            ))}
          </div>
        )}
          </>
        )}
      </div>
    );
  };


  // --- Render Logic ---

  if (isLoadingComplaint) {
    return <p className="text-center mt-8">Loading complaint details...</p>;
  }

  if (error && !complaint) { // Show error only if complaint failed to load
    return <p className="text-red-500 text-center mt-8">{error}</p>;
  }

  if (!complaint) {
    return <p className="text-center mt-8">Complaint not found.</p>; // Should be caught by error state, but as fallback
  }

  // Determine user's vote status for styling buttons
  const userHasUpvoted = user && complaint.upvotedBy?.includes(user._id);
  const userHasDownvoted = user && complaint.downvotedBy?.includes(user._id);

  return (
    // Added dark mode background
    <div className="max-w-4xl mx-auto p-4 dark:text-gray-100">
      {/* Complaint Display */}
      {/* Added dark mode background/border */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 border dark:border-gray-700">
        <div className="flex">
           {/* Voting Column */}
           <div className="flex flex-col items-center mr-4 space-y-1 text-center w-10 flex-shrink-0">
             <button
                onClick={() => handleVote('upvote')}
                disabled={!user || isVoting} // Disable while voting
                // Added dark mode styles & voting state style
                className={`p-1 rounded ${userHasUpvoted ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500 hover:text-orange-500'} ${isVoting ? 'text-gray-400' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Upvote"
             >
                {isVoting ? <FaSpinner className="animate-spin" /> : <FaArrowUp size="1.2em" />}
             </button>
             <span className={`font-bold text-sm ${isVoting ? 'text-gray-400' : ''}`}> {/* Dim score while voting */}
                {complaint.score ?? (complaint.upvotes ?? 0) - (complaint.downvotes ?? 0)}
             </span>
             <button
                onClick={() => handleVote('downvote')}
                disabled={!user || isVoting} // Disable while voting
                // Added dark mode styles & voting state style
                className={`p-1 rounded ${userHasDownvoted ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500 hover:text-blue-500'} ${isVoting ? 'text-gray-400' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Downvote"
             >
                <FaArrowDown size="1.2em" />
             </button>
           </div>

           {/* Complaint Content */}
           <div className="flex-1">
              {/* Added dark mode text */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Submitted on: {new Date(complaint.createdAt).toLocaleString()}
              </p>
              {/* Added dark mode text */}
              <p className="mb-4 dark:text-gray-200">{complaint.text}</p>
              {complaint.media && complaint.media.length > 0 && (
                <MediaCarousel mediaUrls={complaint.media} />
              )}
              {/* Added dark mode text */}
              <p className="text-sm mt-4 dark:text-gray-300">Tags: <span className="font-medium">{complaint.tags.join(', ')}</span></p>
              {complaint.adminNotes && (
                 // Added dark mode text/border
                 <p className="text-sm mt-3 pt-3 border-t text-gray-600 dark:text-gray-400 dark:border-gray-700">Admin Notes: {complaint.adminNotes}</p>
              )}
           </div>
        </div>
      </div>

      {/* Comments Section */}
      {/* Added dark mode background/border */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Comments</h2> {/* Removed count initially, let fetch update */}

        {/* New Comment Form */}
        {user ? ( // Only show form if user is logged in
            <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows="3"
                required
                // Added dark mode styles
                className="w-full p-2 border rounded mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
                type="submit"
                disabled={!newCommentText.trim() || isSubmittingComment}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
                {isSubmittingComment ? 'Submitting...' : 'Post Comment'}
            </button>
            </form>
        ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You must be logged in to post comments.</p>
        )}


        {/* Display Comments */}
        {isLoadingComments ? (
          <p>Loading comments...</p>
        ) : comments.length > 0 ? (
          <div className="space-y-0"> {/* Remove space-y-4, CommentItem handles padding/borders */}
            {/* Map through top-level comments and render using CommentItem */}
            {comments.map(comment => (
              <CommentItem key={comment._id} comment={comment} level={0} />
            ))}
          </div>
        ) : (
          // Added dark mode text
          <p className="text-gray-500 dark:text-gray-400">No comments yet.</p>
        )}
         {/* Show general error related to comments */}
         {error && error.toLowerCase().includes('comment') && <p className="text-red-500 text-sm mt-4">{error}</p>}

      </div>
    </div>
  );
}

export default ComplaintDetailPage;
