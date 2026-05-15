import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Link, Table, TableBody, TableCell, TableRow, Stack, Button } from '@mui/material';
import GitInfo from '../../shared/static/GitInfo';

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const About: React.FC = () => {
  const { t } = useTranslation();
  const isStandAlone = window.matchMedia('(display-mode: standalone)').matches;
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
      setInstallPrompt(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        {t('about.title')}
      </Typography>

      <Stack spacing={4}>
        {/* Blurb content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">
            {t('about.madeBy')}{' '}
            <Link
              href="https://www.ursine.llc"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('about.ursineSoftware')}
            </Link>
            .
          </Typography>

          <Typography variant="body2">
            {t('about.contactUs')}{' '}
            <Link href="mailto:contact@ursine.llc">
              {t('about.contactEmail')}
            </Link>
          </Typography>

          <Typography variant="body2">
            {t('about.donate')}{' '}
            <Link
              href="https://www.ursine.llc/donate"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('about.donateUrl')}
            </Link>
          </Typography>
        </Box>

        {/* PWA Install Prompt */}
        {!isStandAlone && showInstallPrompt && installPrompt && (
          <Box sx={{ p: 2, backgroundColor: 'action.hover', border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
              {t('about.installPWATitle')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('about.installPWADescription')}
            </Typography>
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleInstall}
            >
              {t('about.installButton')}
            </Button>
          </Box>
        )}

        {/* Diagnostics table */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            {t('about.diagnosticsTitle')}
          </Typography>
          <Table sx={{ '& td': { border: 'none', py: 1 } }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '140px' }}>
                  {t('about.diagnosticVersion')}
                </TableCell>
                <TableCell>v2.0.0 ({GitInfo.sha})</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {t('about.diagnosticNetwork')}
                </TableCell>
                <TableCell>
                  {navigator.onLine
                    ? t('about.diagnosticNetworkConnected')
                    : t('about.diagnosticNetworkNotConnected')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {t('about.diagnosticMode')}
                </TableCell>
                <TableCell>
                  {isStandAlone
                    ? t('about.diagnosticModeStandalone')
                    : t('about.diagnosticModeWeb')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {t('about.diagnosticPlatform')}
                </TableCell>
                <TableCell>{navigator.platform}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Stack>
    </Box>
  );
};
