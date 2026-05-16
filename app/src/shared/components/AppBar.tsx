import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBar as MuiAppBar, Toolbar, IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import Logo from './Logo';
import InstallButton from './InstallButton';
import AppBarWeather from './AppBarWeather';
import { useAppContext } from '../context/AppContext';

interface AppBarProps {
  onNavToggle: () => void;
  navOpen?: boolean;
}

const AppBar: React.FC<AppBarProps> = ({ onNavToggle }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { navBurger } = useAppContext();

  return (
    <MuiAppBar position="fixed" sx={{ top: 0, zIndex: 1300 }}>
      <Toolbar>
        <Logo />

        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          {t('app.title')}
        </Typography>

        <InstallButton />
        <AppBarWeather />

        <IconButton
          size="large"
          edge="end"
          color="inherit"
          aria-label={t('nav.menu')}
          onClick={onNavToggle}
        >
          {navBurger ? <FastfoodIcon /> : <MenuIcon />}
        </IconButton>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
