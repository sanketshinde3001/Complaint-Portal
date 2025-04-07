import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecentActivity } from '../services/api';
import { FaRegCommentDots, FaRegFileAlt, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'; // Icons
import { TransitionGroup, CSSTransition } from 'react-transition-group'; // For animations
import './LandingPage.css'; // Import CSS for transitions

// Helper to format relative time
const timeAgo = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
      const minutes = Math.round(seconds / 60);
      const hours = Math.round(minutes / 60);
      const days = Math.round(hours / 24);

      if (seconds < 60) return `${seconds}s ago`;
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch (e) { return ''; }
};

// Component for the activity card
const ActivityCard = ({ activity }) => {
    if (!activity) return null;

    const { type, data, date } = activity;
    let icon, title, description, link;

    // Use optional chaining for safety
    const complaintId = data?._id;
    const petitionId = data?._id;

    if (type === 'complaint' && complaintId) {
        icon = <FaRegCommentDots className="text-red-400 text-xl mr-3 flex-shrink-0" />;
        title = "New Complaint Approved";
        description = data.text;
        link = `/complaint/${complaintId}`;
    } else if (type === 'petition' && petitionId) {
        icon = <FaRegFileAlt className="text-blue-400 text-xl mr-3 flex-shrink-0" />;
        title = "New Petition Approved";
        description = data.title;
        link = `/petition/${petitionId}`;
    } else {
        return null; // Invalid data
    }

    return (
        // Link opens in new tab for activity feed items
        <a href={link} target="_blank" rel="noopener noreferrer" className="block bg-gray-700 bg-opacity-80 backdrop-blur-sm p-3 rounded-lg shadow-lg hover:bg-opacity-90 transition duration-200">
            <div className="flex items-start">
                {icon}
                <div className="overflow-hidden">
                    <h4 className="font-semibold text-sm text-gray-100 mb-0.5 truncate">{title}</h4>
                    <p className="text-xs text-gray-300 line-clamp-2 mb-0.5">{description}</p>
                    <p className="text-xs text-gray-400">{timeAgo(date)}</p>
                </div>
            </div>
        </a>
    );
};


function LandingPage() {
    const [allActivities, setAllActivities] = useState([]); // Store all fetched activities
    const [displayedActivities, setDisplayedActivities] = useState([]); // Store the currently visible slice
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const displayCount = 3; // How many activities to show at once

    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await getRecentActivity();
                // Ensure activities have unique keys - using date + type + id/text/title
                const uniqueActivities = (response.data.data.activities || []).map((act, index) => ({
                    ...act,
                    // Create a more robust key, especially if IDs aren't guaranteed across types
                    key: `${act.date}-${act.type}-${act.data?._id || index}`
                }));
                setAllActivities(uniqueActivities);
            } catch (err) {
                console.error("Failed to fetch recent activity:", err);
                setError('Could not load recent activity.');
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, []);

    // Effect to initialize and cycle displayed activities
    useEffect(() => {
        if (allActivities.length > 0) {
            setDisplayedActivities(allActivities.slice(0, displayCount)); // Initial display

            if (allActivities.length > 1) { // Only cycle if there's more than one activity
                const intervalId = setInterval(() => {
                    setDisplayedActivities(prevDisplayed => {
                        // Find the index of the *first* currently displayed item in the full list
                        const firstDisplayedItem = prevDisplayed[0];
                        const firstIndexInAll = allActivities.findIndex(act => act.key === firstDisplayedItem.key);

                        // Determine the index of the *next* item to add (wrapping around)
                        const nextIndexToAdd = (firstIndexInAll + displayCount) % allActivities.length;
                        const nextActivity = allActivities[nextIndexToAdd];

                        // Create the new array: remove the first, add the next to the end
                        const newDisplayed = [...prevDisplayed.slice(1), nextActivity];
                        return newDisplayed;
                    });
                }, 3000); // Cycle every 3 seconds

                return () => clearInterval(intervalId); // Cleanup interval
            }
        } else {
             setDisplayedActivities([]); // Clear if no activities fetched
        }
    }, [allActivities]); // Rerun only when allActivities changes

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            {/* Hero Section */}
            <section className="container mx-auto px-6 py-16 md:py-24 text-center flex flex-col items-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                    Voice Your Concerns, Drive Change
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl">
                    A platform for students of GCOEARA to raise complaints and initiate petitions for a better campus experience.
                </p>
                <div className="flex flex-wrap justify-center space-x-4 mb-12">
                    <Link
                        to="/signup"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 md:py-3 md:px-8 rounded-lg shadow-md transition duration-200 mb-2 md:mb-0"
                    >
                        Get Started
                    </Link>
                    <Link
                        to="/home"
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 md:py-3 md:px-8 rounded-lg shadow-md transition duration-200 mb-2 md:mb-0"
                    >
                        Explore Issues
                    </Link>
                </div>

                {/* Dynamic Activity Feed */}
                <div className="w-full max-w-sm h-[260px] overflow-hidden relative border border-gray-700 rounded-lg p-2 bg-black bg-opacity-20"> {/* Adjusted height, added padding/border */}
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <FaSpinner className="animate-spin text-blue-400 text-2xl"/>
                        </div>
                    )}
                    {error && (
                         <div className="flex items-center justify-center h-full text-red-400">
                            <FaExclamationTriangle className="mr-2"/> {error}
                         </div>
                    )}
                    {!loading && !error && allActivities.length === 0 && (
                         <div className="flex items-center justify-center h-full text-gray-400">
                            No recent activity.
                         </div>
                    )}
                    {!loading && !error && displayedActivities.length > 0 && (
                        <TransitionGroup component="div" className="relative h-full">
                            {/* Map displayed activities */}
                            {displayedActivities.map((activity, index) => (
                                <CSSTransition
                                    key={activity.key} // Use the generated unique key
                                    timeout={1000} // Match CSS duration
                                    classNames="activity-item"
                                >
                                    {/* Position items absolutely within the container */}
                                    <div
                                        className="absolute w-full px-1 transition-all duration-1000 ease-in-out"
                                        style={{ bottom: `${index * (100 / displayCount)}%`, height: `${100 / displayCount}%` }} // Stack items vertically
                                    >
                                        <div className="h-full py-1"> {/* Add vertical padding */}
                                            <ActivityCard activity={activity} />
                                        </div>
                                    </div>
                                </CSSTransition>
                            ))}
                        </TransitionGroup>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-gray-800 py-16">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-8">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold mb-3">Submit Complaints</h3>
                            <p className="text-gray-300 text-sm">Anonymously report issues regarding academics, infrastructure, or hostel life.</p>
                        </div>
                        <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold mb-3">Create Petitions</h3>
                            <p className="text-gray-300 text-sm">Propose solutions or demand action by starting a petition for others to sign.</p>
                        </div>
                        <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
                            <p className="text-gray-300 text-sm">See the status of complaints and the signature count for petitions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} GCOEARA Complaint & Petition Portal.
            </footer>
        </div>
    );
}

export default LandingPage;
