import { useEffect, useState } from 'react';
import { isInstalled, isInstallPromptAvailable } from '../utils/pwaUtils';

export const usePwaInstallPromptVisibility = () => {
  const [shouldShowInstallPrompt, setShouldShowInstallPrompt] = useState(() =>
    isInstallPromptAvailable()
  );

  useEffect(() => {
    const refreshInstallPromptVisibility = () => {
      setShouldShowInstallPrompt(isInstallPromptAvailable());
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
  }, []);

  return shouldShowInstallPrompt && !isInstalled();
};
