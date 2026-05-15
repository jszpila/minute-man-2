import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Link, Table, TableBody, TableCell, TableRow, Stack } from '@mui/material';
import GitInfo from '../../shared/static/GitInfo';

export const About: React.FC = () => {
  const { t } = useTranslation();
  const isStandAlone = window.matchMedia('(display-mode: standalone)').matches;

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
