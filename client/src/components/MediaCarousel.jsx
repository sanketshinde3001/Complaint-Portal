import React, { useState, useEffect, useRef } from 'react';

import { FaChevronLeft, FaChevronRight, FaExpand, FaSpinner, FaExclamationTriangle } from 'react-icons/fa'; // Added spinner/error

function MediaCarousel({ mediaUrls }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLoading, setErrorLoading] = useState(false); // State for loading errors
  // Removed dimensions state as it wasn't used
  const containerRef = useRef(null);
  const mediaRef = useRef(null); // Ref for the img/video element

  // Effect to check loading status when index changes
  useEffect(() => {
    setErrorLoading(false); // Reset error on slide change
    const mediaElement = mediaRef.current;
    const currentUrl = mediaUrls[currentIndex];
    const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(currentUrl);
    const isVideo = /\.(mp4|webm|ogg|mov|avi|quicktime)$/i.test(currentUrl);

    if (mediaElement) {
        // Check if the element source matches the current URL to avoid stale checks
        if (mediaElement.src !== currentUrl) {
             // Source is changing, assume loading
             setIsLoading(true);
             return;
        }

        // Check loaded status based on type
        if (isImage) {
            // For images, check if naturalWidth > 0 (already loaded/cached)
             setIsLoading(!mediaElement.complete || mediaElement.naturalWidth === 0);
        } else if (isVideo) {
            // For videos, check readyState (>= 2 means metadata loaded, >= 3 means data available)
            setIsLoading(mediaElement.readyState < 2);
        } else {
            // Unsupported type, stop loading indicator
            setIsLoading(false);
        }
    } else {
        // Element not rendered yet, assume loading
        setIsLoading(true);
    }
  }, [currentIndex, mediaUrls]); // Rerun when index or the media list changes

  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  const goToPrevious = (e) => {
    e.stopPropagation();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? mediaUrls.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e) => {
    e.stopPropagation();
    const isLastSlide = currentIndex === mediaUrls.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious(e);
    } else if (e.key === 'ArrowRight') {
      goToNext(e);
    }
  };

  const handleMediaLoad = () => {
    setIsLoading(false);
    setErrorLoading(false); // Clear error on successful load
  };

  const handleMediaError = () => {
    console.error("Failed to load media:", currentUrl);
    setIsLoading(false);
    setErrorLoading(true); // Set error state
  };

  const currentUrl = mediaUrls[currentIndex];
  const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(currentUrl);
  const isVideo = /\.(mp4|webm|ogg|mov|avi|quicktime)$/i.test(currentUrl);

  return (
    <div 
      className="relative w-full bg-gray-900 flex items-center justify-center overflow-hidden"
      style={{ aspectRatio: '16/9' }}
      ref={containerRef}
      tabIndex="0"
      onKeyDown={handleKeyDown}
    >
      {/* Loading/Error Overlay */}
      {(isLoading || errorLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-10">
          {isLoading && !errorLoading && (
             <FaSpinner className="animate-spin text-3xl text-blue-400" />
          )}
          {errorLoading && (
             <div className="text-center text-red-400">
                <FaExclamationTriangle className="text-3xl mx-auto mb-2"/>
                <p className="text-sm">Failed to load media</p>
             </div>
          )}
        </div>
      )}

      {/* Media Item */}
      <div className="w-full h-full flex items-center justify-center">
        {isImage ? (
          <img
            src={currentUrl}
            alt={`Complaint media ${currentIndex + 1}`}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoading || errorLoading ? 'opacity-0' : 'opacity-100'}`} // Fade in on load
            loading="lazy" // Native lazy loading
            onLoad={handleMediaLoad}
            onError={handleMediaError} // Handle image load errors
            ref={mediaRef} // Attach ref
          />
        ) : isVideo ? (
          <video
            key={currentUrl} // Add key to force re-render on src change if needed
            src={currentUrl}
            controls
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoading || errorLoading ? 'opacity-0' : 'opacity-100'}`} // Fade in on load
            preload="metadata"
            onLoadedData={handleMediaLoad}
            onError={handleMediaError} // Handle video load errors
            ref={mediaRef} // Attach ref
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <span className="block text-gray-400 mb-2">Unsupported media format</span>
              <a 
                href={currentUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:underline break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {currentUrl.split('/').pop()}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Navigation (Only show if more than one item) */}
      {mediaUrls.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 z-20"
            aria-label="Previous media"
          >
            <FaChevronLeft size="1em" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 z-20"
            aria-label="Next media"
          >
            <FaChevronRight size="1em" />
          </button>

          {/* Fullscreen button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(currentUrl, '_blank');
            }}
            className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 z-20"
            aria-label="View full size"
          >
            <FaExpand size="0.9em" />
          </button>

          {/* Index Indicator with improved visibility */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full z-20">
            {currentIndex + 1} / {mediaUrls.length}
          </div>
        </>
      )}

      {/* Mini thumbnails for navigation (optional, can be enabled for better UX) */}
      {mediaUrls.length > 2 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1 pb-1 z-20">
          {mediaUrls.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              aria-label={`Go to media ${index + 1}`}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex ? 'bg-blue-500 scale-125' : 'bg-gray-400 bg-opacity-70 hover:bg-opacity-100'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaCarousel;
