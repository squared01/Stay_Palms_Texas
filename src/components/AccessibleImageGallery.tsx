import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, Grid } from 'lucide-react';

interface Image {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

interface AccessibleImageGalleryProps {
  images: Image[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showThumbnails?: boolean;
  className?: string;
}

export const AccessibleImageGallery: React.FC<AccessibleImageGalleryProps> = ({
  images,
  autoPlay = false,
  autoPlayInterval = 5000,
  showThumbnails = true,
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [reducedMotion, setReducedMotion] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const carouselRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && !reducedMotion && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, reducedMotion, images.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    setIsPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
    setIsPlaying(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNext();
        break;
      case 'Home':
        event.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        event.preventDefault();
        goToSlide(images.length - 1);
        break;
      case ' ':
        event.preventDefault();
        setIsPlaying(!isPlaying);
        break;
      case 'Escape':
        if (showModal) {
          setShowModal(false);
        }
        break;
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 bg-gray-50 rounded-lg">
        <p>No images to display</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className={`relative ${className}`}>
      {/* View mode toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Image Gallery ({images.length} images)
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'carousel' ? 'grid' : 'carousel')}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label={`Switch to ${viewMode === 'carousel' ? 'grid' : 'carousel'} view`}
          >
            <Grid className="w-4 h-4 mr-2" />
            {viewMode === 'carousel' ? 'Grid View' : 'Carousel View'}
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        /* Grid View - Accessible alternative to carousel */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-48 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105 focus:scale-105"
                onClick={() => {
                  setCurrentIndex(index);
                  setShowModal(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentIndex(index);
                    setShowModal(true);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View image ${index + 1}: ${image.alt}`}
              />
              {image.caption && (
                <p className="mt-2 text-sm text-gray-600">{image.caption}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Carousel View */
        <div
          ref={carouselRef}
          className="relative bg-gray-100 rounded-lg overflow-hidden"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Image carousel"
          aria-live="polite"
        >
          {/* Main image */}
          <div className="relative aspect-video">
            <img
              src={currentImage.src}
              alt={currentImage.alt}
              className="w-full h-full object-cover"
              onClick={() => setShowModal(true)}
              role="button"
              tabIndex={0}
              aria-label="Click to view full size"
            />
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Play/Pause button */}
            {images.length > 1 && !reducedMotion && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}

            {/* Image counter */}
            <div className="absolute bottom-2 left-2 px-3 py-1 bg-black bg-opacity-50 text-white text-sm rounded-full">
              {currentIndex + 1} of {images.length}
            </div>
          </div>

          {/* Caption */}
          {currentImage.caption && (
            <div className="p-4 bg-white">
              <p className="text-sm text-gray-700">{currentImage.caption}</p>
            </div>
          )}
        </div>
      )}

      {/* Thumbnails */}
      {showThumbnails && viewMode === 'carousel' && images.length > 1 && (
        <div
          ref={thumbnailsRef}
          className="flex gap-2 mt-4 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Image thumbnails"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToSlide(index)}
              className={`
                flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${index === currentIndex 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`View image ${index + 1}: ${image.alt}`}
            >
              <img
                src={image.src}
                alt=""
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full-screen modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setShowModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowModal(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Full size image view"
        >
          <div className="relative max-w-full max-h-full p-4">
            <img
              src={currentImage.src}
              alt={currentImage.alt}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 focus:ring-2 focus:ring-white"
              aria-label="Close full size view"
            >
              <X className="w-5 h-5" />
            </button>

            {currentImage.caption && (
              <div className="absolute bottom-2 left-2 right-2 p-4 bg-black bg-opacity-50 text-white text-center rounded">
                <p>{currentImage.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};