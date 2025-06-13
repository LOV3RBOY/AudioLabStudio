/**
 * Service Worker Registration Utility
 * 
 * Handles registration and lifecycle events for the service worker
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(config: ServiceWorkerConfig = {}) {
  if ('serviceWorker' in navigator) {
    // Wait for window load to register service worker
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';
      
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          // Registration successful
          console.log('Service Worker registered with scope:', registration.scope);
          
          if (config.onSuccess) {
            config.onSuccess(registration);
          }
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New update available
                    console.log('New content available; please refresh.');
                    
                    if (config.onUpdate) {
                      config.onUpdate(registration);
                    }
                  } else {
                    // Content cached for offline use
                    console.log('Content cached for offline use.');
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
          
          if (config.onError) {
            config.onError(error);
          }
        });
    });
  } else {
    console.log('Service Worker is not supported in this browser.');
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Service Worker unregistration failed:', error);
      });
  }
} 