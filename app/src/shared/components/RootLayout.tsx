import React, { type ReactNode } from 'react';
import { Container, Box } from '@mui/material';
import AppBar from './AppBar';
import SideNav from './SideNav';

interface RootLayoutProps {
  children: ReactNode;
  navOpen: boolean;
  onNavToggle: () => void;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children, navOpen, onNavToggle }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppBar onNavToggle={onNavToggle} />
      <SideNav open={navOpen} onClose={onNavToggle} />

      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          py: 3,
          pt: { xs: 11, sm: 12 },
          display: 'flex',
          flexDirection: 'column',
          mt: 0,
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default RootLayout;
