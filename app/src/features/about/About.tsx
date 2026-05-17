import React from 'react';
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
import { isRunningAsInstalled, triggerInstallPrompt } from '../../shared/utils/pwaUtils';
import { usePwaInstallPromptVisibility } from '../../shared/hooks/usePwaInstallPromptVisibility';
import packageJson from '../../../package.json';

export const About: React.FC = () => {
  const { t } = useTranslation();
  const shouldShowInstallPrompt = usePwaInstallPromptVisibility();
  const isStandAlone = isRunningAsInstalled();

  const handleInstall = async () => {
    await triggerInstallPrompt();
  };

  return (
    <Box sx={{ width: '100%', textAlign: 'left' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('about.title')}
      </Typography>

      <Stack spacing={3}>
        {/* Blurb content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body1">
            {t('about.madeBy')}{' '}
            <Link href="https://www.ursine.llc" target="_blank" rel="noopener noreferrer">
              {t('about.ursineSoftware')}
            </Link>
            .
          </Typography>

          <Typography variant="body1">
            {t('about.contactUs')}{' '}
            <Link href="mailto:contact@ursine.llc">{t('about.contactEmail')}</Link>.
          </Typography>

          <Typography variant="body1">
            {t('about.donate')}{' '}
            <Link href="https://www.ursine.llc/donate" target="_blank" rel="noopener noreferrer">
              {t('about.donateUrl')}
            </Link>
            .
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('about.shareTitle')}
            </Typography>
            <Box
              component="img"
              src="/assets/minman-v2-qr.png"
              alt={t('about.shareQrAlt')}
              sx={{
                display: 'block',
                width: '100%',
                maxWidth: 240,
                height: 'auto',
                mx: 'auto',
              }}
            />
          </CardContent>
        </Card>

        {/* PWA Installation Instructions - mirrors app-bar install button visibility */}
        {shouldShowInstallPrompt && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('about.installPWATitle')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {t('about.installPWADescription')}
              </Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
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
              <Button variant="contained" size="small" onClick={handleInstall}>
                {t('about.installButton')}
              </Button>
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
                  <TableCell>
                    v{packageJson.version} ({GitInfo.sha})
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('about.diagnosticNetwork')}</TableCell>
                  <TableCell>
                    {navigator.onLine
                      ? t('about.diagnosticNetworkConnected')
                      : t('about.diagnosticNetworkNotConnected')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('about.diagnosticMode')}</TableCell>
                  <TableCell>
                    {isStandAlone
                      ? t('about.diagnosticModeStandalone')
                      : t('about.diagnosticModeWeb')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('about.diagnosticPlatform')}</TableCell>
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
