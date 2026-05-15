import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Divider,
  Typography,
} from '@mui/material';
import packageJson from '../../../package.json';

interface NavItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    { label: t('nav.zeroCalculator'), path: '/zero' },
    { label: t('nav.mildotCalculator'), path: '/mildot' },
    { label: t('nav.shotTimer'), path: '/shot-timer' },
    { label: t('nav.rangeConditions'), path: '/conditions' },
    { label: t('nav.settings'), path: '/settings' },
    { label: t('nav.about'), path: '/about' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{ 
          width: 250, 
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        role="presentation"
      >
        <Typography variant="h6" sx={{ px: 2, mb: 2 }}>
          {t('app.title')}
        </Typography>

        <List sx={{ flex: 1 }}>
          {navItems.map((item) => (
            <React.Fragment key={item.path}>
              {item.path === '/settings' && <Divider />}
              <ListItem disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>

        {/* Version number */}
        <Box sx={{ px: 2, pb: 2, textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            v{packageJson.version}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SideNav;
