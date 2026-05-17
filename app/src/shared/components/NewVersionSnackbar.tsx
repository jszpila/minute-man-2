import React from 'react';
import { Button, Snackbar } from '@mui/material';
import { useTranslation } from 'react-i18next';

const NewVersionSnackbar: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleUpdateAvailable = () => {
      setOpen(true);
    };

    window.addEventListener('pwa:update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('pwa:update-available', handleUpdateAvailable);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      open={open}
      message={t('app.newVersionAvailable')}
      sx={{
        top: { xs: 72, sm: 80 },
      }}
      action={
        <Button color="inherit" size="small" onClick={handleReload}>
          {t('app.reload')}
        </Button>
      }
    />
  );
};

export default NewVersionSnackbar;
