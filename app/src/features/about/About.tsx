import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GitInfo from '../../shared/static/GitInfo';
import { isRunningAsInstalled, triggerInstallPrompt } from '../../shared/utils/pwaUtils';
import {
  usePwaInstalledState,
  usePwaInstallPromptVisibility,
} from '../../shared/hooks/usePwaInstallPromptVisibility';
import packageJson from '../../../package.json';

const AboutSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}> = ({ title, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <Card>
      <CardHeader
        title={title}
        onClick={() => setExpanded(!expanded)}
        sx={{
          cursor: 'pointer',
          backgroundColor: 'action.hover',
          '&:hover': { backgroundColor: 'action.selected' },
        }}
        avatar={
          <ExpandMoreIcon
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          />
        }
      />
      <Collapse in={expanded} unmountOnExit>
        <CardContent>{children}</CardContent>
      </Collapse>
    </Card>
  );
};

export const About: React.FC = () => {
  const { t } = useTranslation();
  const isInstalled = usePwaInstalledState();
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
            {t('about.weatherDataProvidedBy')}{' '}
            <Link href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
              {t('about.openMeteo')}
            </Link>
            .
          </Typography>
        </Box>

        {!isInstalled && (
          <AboutSection title={t('about.installPWATitle')}>
            <Stack spacing={2}>
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
              {shouldShowInstallPrompt && (
                <Button variant="contained" size="small" onClick={handleInstall}>
                  {t('about.installButton')}
                </Button>
              )}
            </Stack>
          </AboutSection>
        )}

        <AboutSection title={t('about.shareTitle')}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="body2">{t('about.shareDescription')}</Typography>
            <Box
              component="img"
              src="/assets/minman-v2-qr.png"
              alt={t('about.shareQrAlt')}
              width={656}
              height={656}
              sx={{
                display: 'block',
                width: '100%',
                maxWidth: 240,
                aspectRatio: '1 / 1',
                height: 'auto',
                mx: 'auto',
              }}
            />
          </Stack>
        </AboutSection>

        <AboutSection title={t('about.diagnosticsTitle')} defaultExpanded={false}>
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
        </AboutSection>
      </Stack>
    </Box>
  );
};
