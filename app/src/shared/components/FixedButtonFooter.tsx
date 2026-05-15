import React, { type ReactNode } from 'react';
import { Box, Stack } from '@mui/material';

interface FixedButtonFooterProps {
  children: ReactNode;
}

const FixedButtonFooter: React.FC<FixedButtonFooterProps> = ({ children }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'inherit',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          p: 2,
          maxWidth: 'md',
          mx: 'auto',
          width: '100%',
        }}
      >
        {children}
      </Stack>
    </Box>
  );
};

export default FixedButtonFooter;
