import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

// Hook for detecting online/offline status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Hook for detecting reduced motion preference
export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
};

// Hook for detecting color scheme preference
export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => 
      setColorScheme(e.matches ? 'dark' : 'light');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
};

// Progressive enhancement wrapper component
interface ProgressiveWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiresOnline?: boolean;
  className?: string;
}

export const ProgressiveWrapper: React.FC<ProgressiveWrapperProps> = ({
  children,
  fallback,
  requiresOnline = false,
  className = "",
}) => {
  const isOnline = useOnlineStatus();
  const [hasJavaScript] = useState(true); // In React, we know JS is available

  if (requiresOnline && !isOnline) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <WifiOff className="w-5 h-5 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              This feature requires an internet connection
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please check your connection and try again.
            </p>
          </div>
        </div>
        {fallback && <div className="mt-4">{fallback}</div>}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

// Connection status indicator
export const ConnectionStatus: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowStatus(true);
    } else {
      // Show "back online" message briefly
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showStatus) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all
        ${isOnline 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
        }
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center">
        {isOnline ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">You're offline</span>
          </>
        )}
      </div>
    </div>
  );
};

// Form with progressive enhancement
interface ProgressiveFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  requiresOnline?: boolean;
}

export const ProgressiveForm: React.FC<ProgressiveFormProps> = ({
  onSubmit,
  children,
  className = "",
  requiresOnline = true,
}) => {
  const isOnline = useOnlineStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<FormData | null>(null);

  // Auto-retry when coming back online
  useEffect(() => {
    if (isOnline && pendingData) {
      handleSubmit(pendingData);
      setPendingData(null);
    }
  }, [isOnline, pendingData]);

  const handleSubmit = async (data: FormData) => {
    if (requiresOnline && !isOnline) {
      setPendingData(data);
      setError('Form will be submitted when connection is restored.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      if (!isOnline) {
        setPendingData(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleSubmit(formData);
      }}
      className={className}
      noValidate // We'll handle validation ourselves
    >
      {children}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {pendingData && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <WifiOff className="w-4 h-4 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-700">
              Form data saved. Will submit automatically when connection is restored.
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || (requiresOnline && !isOnline)}
        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

// Lazy loading image with progressive enhancement
interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder,
  className = "",
  loading = 'lazy',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!imageLoaded && !imageError && placeholder && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      )}
      
      {imageError ? (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          className={`transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};