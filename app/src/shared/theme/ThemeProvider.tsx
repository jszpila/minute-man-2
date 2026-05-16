import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';

export type FontSize = 'microscopic' | 'diminutive' | 'normie' | 'embiggened' | 'thiccc';

const fontSizeScale: Record<FontSize, number> = {
  microscopic: 0.855,
  diminutive: 0.925,
  normie: 1,
  embiggened: 1.075,
  thiccc: 1.15,
};

const typography = (fontSize: FontSize) => ({
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  fontSize: 14 * fontSizeScale[fontSize],
});

const createMinuteManTheme = (mode: 'light' | 'dark' | 'rangerGreen', fontSize: FontSize) => {
  if (mode === 'rangerGreen') {
    return createTheme({
      palette: {
        mode: 'light',
        primary: {
          main: '#2d5016',
        },
        secondary: {
          main: '#5a7c3e',
        },
        background: {
          default: '#f5f7f2',
          paper: '#fff',
        },
      },
      typography: typography(fontSize),
    });
  }

  if (mode === 'dark') {
    return createTheme({
      palette: {
        mode: 'dark',
        primary: {
          main: '#90caf9',
        },
        secondary: {
          main: '#f48fb1',
        },
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
      },
      typography: typography(fontSize),
    });
  }

  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#fafafa',
        paper: '#fff',
      },
    },
    typography: typography(fontSize),
  });
};

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#fafafa',
      paper: '#fff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const rangerGreenLightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2d5016',
    },
    secondary: {
      main: '#5a7c3e',
    },
    background: {
      default: '#f5f7f2',
      paper: '#fff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const rangerGreenDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7cb342',
    },
    secondary: {
      main: '#9ccc65',
    },
    background: {
      default: '#1b1b1b',
      paper: '#2d2d2d',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

interface ThemeProviderProps {
  children: React.ReactNode;
  mode: 'light' | 'dark' | 'rangerGreen';
  fontSize: FontSize;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, mode, fontSize }) => {
  const theme = React.useMemo(() => createMinuteManTheme(mode, fontSize), [mode, fontSize]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export { darkTheme, lightTheme, rangerGreenLightTheme, rangerGreenDarkTheme };
