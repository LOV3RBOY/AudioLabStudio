import React, { StrictMode, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { PerformanceMonitor } from './utils/performance';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

// Initialize performance monitoring
PerformanceMonitor.init({
  captureErrors: true,
  captureNavigation: true,
  captureNetworkRequests: true,
  sampleRate: 0.1, // Sample 10% of users in production
  reportingEndpoint: import.meta.env.VITE_PERFORMANCE_ENDPOINT,
});

// Add performance marks for initial load
performance.mark('app-init-start');

// Create fallback loading component
const LoadingFallback = () => (
  <div className="app-loading-fallback">
    <div className="spinner"></div>
    <p>Loading application...</p>
  </div>
);

// Mount the React application
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <pre>{error.message}</pre>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
      onError={(error, errorInfo) => {
        // Log errors to monitoring service
        PerformanceMonitor.captureException(error, errorInfo);
        console.error('Application error:', error, errorInfo);
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);

// Register service worker for offline capabilities and PWA support
registerServiceWorker({
  onSuccess: () => console.log('Service worker registered successfully'),
  onUpdate: (registration) => {
    // Notify user about new version
    const updateAvailable = confirm(
      'New version available! Would you like to update now?'
    );
    
    if (updateAvailable && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },
  onError: (error) => {
    console.error('Service worker registration failed:', error);
    // Still allow app to work without service worker
  },
});

// Add performance mark for completed initialization
performance.mark('app-init-end');
performance.measure('app-initialization', 'app-init-start', 'app-init-end');

// Remove preloader once app is mounted
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('hidden');
    
    // Remove preloader from DOM after animation completes
    setTimeout(() => {
      preloader.remove();
    }, 500);
  }
  
  // Report initial load metrics
  PerformanceMonitor.reportWebVitals();
});
