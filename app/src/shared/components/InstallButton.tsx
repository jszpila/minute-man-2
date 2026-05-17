import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { triggerInstallPrompt } from '../utils/pwaUtils';
import { usePwaInstallPromptVisibility } from '../hooks/usePwaInstallPromptVisibility';

const InstallButton: React.FC = () => {
  const { t } = useTranslation();
  const shouldShowInstallPrompt = usePwaInstallPromptVisibility();

  if (!shouldShowInstallPrompt) {
    return null;
  }

  const handleInstallClick = async () => {
    await triggerInstallPrompt();
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
