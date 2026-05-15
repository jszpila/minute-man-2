import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';

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
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, mode }) => {
  let theme;
  if (mode === 'rangerGreen') {
    // Use light ranger green for 'rangerGreen' mode (can be toggled in settings)
    theme = rangerGreenLightTheme;
  } else if (mode === 'dark') {
    theme = darkTheme;
  } else {
    theme = lightTheme;
  }

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export { darkTheme, lightTheme, rangerGreenLightTheme, rangerGreenDarkTheme };
