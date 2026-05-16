import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import GitInfo from '../../shared/static/GitInfo';
import packageJson from '../../../package.json';

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
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('about.title')}
      </Typography>

      <Stack spacing={3}>
        {/* Blurb content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body1">
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

          <Typography variant="body1">
            {t('about.contactUs')}{' '}
            <Link href="mailto:contact@ursine.llc">
              {t('about.contactEmail')}
            </Link>
          </Typography>

          <Typography variant="body1">
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

        {/* PWA Installation Instructions - show when NOT installed as app */}
        {!isStandAlone && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('about.installPWATitle')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {t('about.installPWADescription')}
              </Typography>
              <Stack spacing={1} sx={{ mb: showInstallPrompt && installPrompt ? 2 : 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {t('about.installation')}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 'bold' }}>
                    {t('about.android')}:
                  </Box>{' '}
                  {t('about.installAndroid')}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 'bold' }}>
                    {t('about.ios')}:
                  </Box>{' '}
                  {t('about.installIos')}
                </Typography>
              </Stack>
              {showInstallPrompt && installPrompt && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleInstall}
                >
                  {t('about.installButton')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Diagnostics table */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('about.diagnosticsTitle')}
            </Typography>
            <Table sx={{ '& td': { border: 'none', px: 0, py: 1 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                    {t('about.diagnosticVersion')}
                  </TableCell>
                  <TableCell>v{packageJson.version} ({GitInfo.sha})</TableCell>
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
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
