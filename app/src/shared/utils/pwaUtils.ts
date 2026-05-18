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
    getInstalledRelatedApps?: () => Promise<
      Array<{ platform?: string; url?: string; id?: string }>
    >;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const PWA_INSTALL_STATE_KEY = 'pwa:installed';
const INSTALL_PROMPT_UNAVAILABLE_EVENT = 'pwa:install-prompt-unavailable';

const INSTALLED_DISPLAY_MODES = [
  'standalone',
  'fullscreen',
  'minimal-ui',
  'window-controls-overlay',
] as const;

const VITE_DEV_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

const isViteDevServer = (): boolean =>
  VITE_DEV_HOSTS.includes(window.location.hostname) && window.location.port === '5173';

const setStoredInstalledState = (installed: boolean) => {
  try {
    if (installed) {
      window.localStorage.setItem(PWA_INSTALL_STATE_KEY, 'true');
    } else {
      window.localStorage.removeItem(PWA_INSTALL_STATE_KEY);
    }
  } catch {
    // Storage can be blocked in private contexts; runtime signals still apply.
  }
};

const getDisplayModeMediaQueries = () =>
  INSTALLED_DISPLAY_MODES.map((displayMode) => window.matchMedia(`(display-mode: ${displayMode})`));

export const hasStoredInstalledState = (): boolean => {
  try {
    return window.localStorage.getItem(PWA_INSTALL_STATE_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Register the service worker
 */
export const registerServiceWorker = async () => {
  if (isViteDevServer()) {
    await unregisterServiceWorkers();
    await deleteAppCaches();
    console.log('[PWA] Service Worker disabled in development');
    return;
  }

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

const unregisterServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
};

const deleteAppCaches = async () => {
  if (!('caches' in window)) {
    return;
  }

  const cacheNames = await window.caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith('minute-man'))
      .map((cacheName) => window.caches.delete(cacheName))
  );
};

/**
 * Set up install prompt listener
 * Stores the install prompt event for later triggering
 */
export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    if (isRunningAsInstalled()) {
      e.preventDefault();
      deferredPrompt = null;
      return;
    }

    console.log('[PWA] Install prompt triggered');
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    isInstalledAsync().then((installed) => {
      if (installed) {
        deferredPrompt = null;
        setStoredInstalledState(true);
        window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_UNAVAILABLE_EVENT));
        return;
      }

      setStoredInstalledState(false);
      // Store the event for later use
      deferredPrompt = e as BeforeInstallPromptEvent;
      // Signal that install prompt is available
      window.dispatchEvent(new CustomEvent('pwa:install-prompt-available'));
    });
  });

  // Handle app installed
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    setStoredInstalledState(true);
    window.dispatchEvent(new CustomEvent('pwa:app-installed'));
  });

  // Handle app being installed (PWA launch)
  if (isRunningAsInstalled()) {
    console.log('[PWA] Running as installed PWA');
    setStoredInstalledState(true);
    window.dispatchEvent(new CustomEvent('pwa:running-as-installed'));
  }
};

/**
 * Trigger the install prompt
 * Call this when user clicks "Install" button
 */
export const triggerInstallPrompt = async () => {
  if (isRunningAsInstalled()) {
    deferredPrompt = null;
    console.log('[PWA] App is already running as installed');
    window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_UNAVAILABLE_EVENT));
    return false;
  }

  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_UNAVAILABLE_EVENT));
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_UNAVAILABLE_EVENT));
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Error triggering install prompt:', error);
    window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_UNAVAILABLE_EVENT));
    return false;
  }
};

/**
 * Check if install prompt is available
 */
export const isInstallPromptAvailable = (): boolean => {
  return deferredPrompt !== null && !isInstalled();
};

/**
 * Check if the app is installed or currently running in an installed mode.
 */
export const isInstalled = (): boolean => {
  return isRunningAsInstalled() || hasStoredInstalledState();
};

export const isInstalledAsync = async (): Promise<boolean> => {
  if (isInstalled()) {
    return true;
  }

  try {
    const relatedApps = await window.navigator.getInstalledRelatedApps?.();
    const hasInstalledRelatedApp = Boolean(relatedApps?.length);
    if (hasInstalledRelatedApp) {
      setStoredInstalledState(true);
      return true;
    }
  } catch {
    // This Chromium-only API can reject when unavailable or unsupported by the manifest.
  }

  return isRunningAsInstalled();
};

/**
 * Check if the current browser needs manual install instructions because it
 * does not expose the beforeinstallprompt flow.
 */
export const supportsManualInstallInstructions = (): boolean => {
  const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
  const isIPadOS = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;

  return isIOS || isIPadOS;
};

/**
 * Check if app is running in an installed PWA display mode.
 *
 * Different browsers expose installed launches differently:
 * - Chromium PWAs use display-mode media queries.
 * - iOS Safari uses navigator.standalone.
 * - Trusted Web Activity launches can expose an android-app referrer.
 */
export const isRunningAsInstalled = (): boolean => {
  if (window.navigator.standalone === true) {
    return true;
  }

  if (document.referrer.startsWith('android-app://')) {
    return true;
  }

  if (typeof window.matchMedia !== 'function') {
    return false;
  }

  return getDisplayModeMediaQueries().some((mediaQuery) => mediaQuery.matches);
};

export const isStandalone = isRunningAsInstalled;

export const addInstalledStateChangeListeners = (listener: () => void): (() => void) => {
  const mediaQueries = typeof window.matchMedia === 'function' ? getDisplayModeMediaQueries() : [];

  mediaQueries.forEach((mediaQuery) => {
    mediaQuery.addEventListener?.('change', listener);
    mediaQuery.addListener?.(listener);
  });
  window.addEventListener('focus', listener);
  document.addEventListener('visibilitychange', listener);

  return () => {
    mediaQueries.forEach((mediaQuery) => {
      mediaQuery.removeEventListener?.('change', listener);
      mediaQuery.removeListener?.(listener);
    });
    window.removeEventListener('focus', listener);
    document.removeEventListener('visibilitychange', listener);
  };
};
