/**
 * Service Worker registration and PWA install prompt handling
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Register the service worker
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    console.log('[PWA] Service Worker registered:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every 60 seconds

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is ready, notify the user
          console.log('[PWA] New version available. Refresh to update.');
          // Optionally dispatch custom event for UI notification
          window.dispatchEvent(new CustomEvent('pwa:update-available'));
        }
      });
    });
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
  }
};

/**
 * Set up install prompt listener
 * Stores the install prompt event for later triggering
 */
export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Install prompt triggered');
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Store the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;
    // Signal that install prompt is available
    window.dispatchEvent(new CustomEvent('pwa:install-prompt-available'));
  });

  // Handle app installed
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa:app-installed'));
  });

  // Handle app being installed (PWA launch)
  if (window.navigator.standalone === true) {
    console.log('[PWA] Running as installed PWA');
    window.dispatchEvent(new CustomEvent('pwa:running-as-installed'));
  }
};

/**
 * Trigger the install prompt
 * Call this when user clicks "Install" button
 */
export const triggerInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Error triggering install prompt:', error);
    return false;
  }
};

/**
 * Check if install prompt is available
 */
export const isInstallPromptAvailable = (): boolean => {
  return deferredPrompt !== null;
};

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export const isStandalone = (): boolean => {
  return window.navigator.standalone === true;
};
