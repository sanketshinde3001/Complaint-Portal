import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Optimized MediaCarousel for fitting inside a post card
function MediaCarousel({ mediaUrls }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  const goToPrevious = (e) => {
    e.stopPropagation(); // Prevent card click event if needed
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

  const currentUrl = mediaUrls[currentIndex];
  // More robust check for media types
  const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(currentUrl);
  const isVideo = /\.(mp4|webm|ogg|mov|avi|quicktime)$/i.test(currentUrl);

  return (
    // Use relative positioning for arrows. Control max height via parent in HomePage.
    // Make background black or dark grey for better contrast if media doesn't fill space.
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Media Item */}
      <div className="w-full h-full flex items-center justify-center">
        {isImage ? (
          <img
            src={currentUrl}
            alt={`Complaint media ${currentIndex + 1}`}
            // Use object-contain to see the whole image, limited by parent's max-h
            className="block max-w-full max-h-full object-contain"
            loading="lazy" // Add lazy loading for images
          />
        ) : isVideo ? (
          <video
            src={currentUrl}
            controls
            // Use object-contain, limited by parent's max-h
            className="block max-w-full max-h-full object-contain"
            preload="metadata" // Only load metadata initially
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline p-4 text-center break-all">
            View unsupported media: {currentUrl.split('/').pop()}
          </a>
        )}
      </div>

      {/* Navigation (Only show if more than one item) */}
      {mediaUrls.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-1 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-opacity duration-150 z-10"
            aria-label="Previous media"
          >
            <FaChevronLeft size="1em" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-1 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-opacity duration-150 z-10"
            aria-label="Next media"
          >
            <FaChevronRight size="1em" />
          </button>

          {/* Index Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded-full z-10">
            {currentIndex + 1} / {mediaUrls.length}
          </div>
        </>
      )}
    </div>
  );
}

export default MediaCarousel;