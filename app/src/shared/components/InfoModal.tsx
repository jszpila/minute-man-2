import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getDiagnosticsVersionInfo } from '../utils/buildInfo';

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`info-tabpanel-${index}`}
      aria-labelledby={`info-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

const InfoModal: React.FC<InfoModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = React.useState(0);
  const isStandAlone = window.matchMedia('(display-mode: standalone)').matches;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const AboutPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2">
        {t('about.madeBy')}
        <Link
          href="https://www.ursine.llc"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ ml: 0.5 }}
        >
          {t('app.title')}
        </Link>
      </Typography>

      <Typography variant="body2">
        {t('about.contactUs')}
        <Link href="mailto:contact@ursine.llc" sx={{ ml: 0.5 }}>
          contact@ursine.llc
        </Link>
      </Typography>

      <Typography variant="body2">
        {t('about.donate')}
        <Link
          href="https://www.ursine.llc/donate"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ ml: 0.5 }}
        >
          ursine.llc/donate
        </Link>
      </Typography>
    </Box>
  );

  const DiagnosticsPanel = (
    <Table sx={{ '& td': { border: 'none', py: 1 } }}>
      <TableBody>
        <TableRow>
          <TableCell sx={{ fontWeight: 'bold', width: '140px' }}>
            {t('about.diagnosticVersion')}
          </TableCell>
          <TableCell>{getDiagnosticsVersionInfo()}</TableCell>
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
            {isStandAlone ? t('about.diagnosticModeStandalone') : t('about.diagnosticModeWeb')}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ fontWeight: 'bold' }}>{t('about.diagnosticPlatform')}</TableCell>
          <TableCell>{navigator.platform}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        {t('about.title')}
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label={t('common.close')}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label={t('about.infoTabs')}
        variant="fullWidth"
      >
        <Tab label={t('about.aboutTitle')} id="info-tab-0" aria-controls="info-tabpanel-0" />
        <Tab label={t('about.diagnosticsTitle')} id="info-tab-1" aria-controls="info-tabpanel-1" />
      </Tabs>

      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          {AboutPanel}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {DiagnosticsPanel}
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;
