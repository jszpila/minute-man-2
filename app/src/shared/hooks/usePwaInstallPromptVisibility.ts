import { useEffect, useState } from 'react';
import {
  addInstalledStateChangeListeners,
  isInstalled,
  isInstalledAsync,
  isInstallPromptAvailable,
} from '../utils/pwaUtils';

export const usePwaInstalledState = () => {
  const [installed, setInstalled] = useState(() => isInstalled());

  useEffect(() => {
    let mounted = true;

    const refreshInstalledState = async () => {
      const nextInstalled = window.navigator.getInstalledRelatedApps
        ? await isInstalledAsync()
        : isInstalled();
      if (mounted && nextInstalled !== installed) {
        setInstalled(nextInstalled);
      }
    };

    void refreshInstalledState();
    const removeInstalledStateListeners = addInstalledStateChangeListeners(() => {
      void refreshInstalledState();
    });
    window.addEventListener('pwa:app-installed', refreshInstalledState);
    window.addEventListener('pwa:running-as-installed', refreshInstalledState);

    return () => {
      mounted = false;
      removeInstalledStateListeners();
      window.removeEventListener('pwa:app-installed', refreshInstalledState);
      window.removeEventListener('pwa:running-as-installed', refreshInstalledState);
    };
  }, [installed]);

  return installed;
};

export const usePwaInstallPromptVisibility = () => {
  const installed = usePwaInstalledState();
  const [shouldShowInstallPrompt, setShouldShowInstallPrompt] = useState(false);

  useEffect(() => {
    const refreshInstallPromptVisibility = () => {
      setShouldShowInstallPrompt(!installed && isInstallPromptAvailable());
    };

    const hideInstallPrompt = () => {
      setShouldShowInstallPrompt(false);
    };

    window.addEventListener('pwa:install-prompt-available', refreshInstallPromptVisibility);
    window.addEventListener('pwa:install-prompt-unavailable', hideInstallPrompt);
    window.addEventListener('pwa:app-installed', hideInstallPrompt);
    window.addEventListener('pwa:running-as-installed', hideInstallPrompt);
    refreshInstallPromptVisibility();

    return () => {
      window.removeEventListener('pwa:install-prompt-available', refreshInstallPromptVisibility);
      window.removeEventListener('pwa:install-prompt-unavailable', hideInstallPrompt);
      window.removeEventListener('pwa:app-installed', hideInstallPrompt);
      window.removeEventListener('pwa:running-as-installed', hideInstallPrompt);
    };
  }, [installed]);

  return shouldShowInstallPrompt && !installed;
};
