import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { triggerInstallPrompt, isInstallPromptAvailable } from '../utils/pwaUtils';

const InstallButton: React.FC = () => {
  const { t } = useTranslation();
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Listen for install prompt availability
    const handleInstallPromptAvailable = () => {
      setShowInstall(true);
    };

    const handleAppInstalled = () => {
      setShowInstall(false);
    };

    window.addEventListener('pwa:install-prompt-available', handleInstallPromptAvailable);
    window.addEventListener('pwa:app-installed', handleAppInstalled);

    // Check if prompt is already available on mount
    if (isInstallPromptAvailable()) {
      setShowInstall(true);
    }

    return () => {
      window.removeEventListener('pwa:install-prompt-available', handleInstallPromptAvailable);
      window.removeEventListener('pwa:app-installed', handleAppInstalled);
    };
  }, []);

  if (!showInstall) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await triggerInstallPrompt();
    if (success) {
      setShowInstall(false);
    }
  };

  return (
    <IconButton
      color="inherit"
      onClick={handleInstallClick}
      title={t('about.installButton')}
      aria-label={t('about.installButton')}
      size="large"
    >
      <FileDownloadIcon />
    </IconButton>
  );
};

export default InstallButton;
