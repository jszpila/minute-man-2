import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import HoldoverHelpDiagram from './HoldoverHelpDiagram';

const renderWithTheme = (mode: 'light' | 'dark') => {
  return render(
    <ThemeProvider theme={createTheme({ palette: { mode } })}>
      <HoldoverHelpDiagram />
    </ThemeProvider>
  );
};

describe('HoldoverHelpDiagram', () => {
  it('renders without crashing', () => {
    renderWithTheme('light');

    expect(
      screen.getByRole('img', { name: /holdover and sight height diagram/i })
    ).toBeInTheDocument();
  });

  it('renders an SVG with required labels', () => {
    renderWithTheme('light');

    expect(screen.getByText('Sight Line')).toBeInTheDocument();
    expect(screen.getByText('Projectile Path')).toBeInTheDocument();
    expect(screen.getByText('Height Over Bore')).toBeInTheDocument();
    expect(screen.getByText('Close Range Impact')).toBeInTheDocument();
    expect(screen.getByText('Zero Distance')).toBeInTheDocument();
  });

  it('provides accessible title and description', () => {
    renderWithTheme('light');

    expect(screen.getByText('Holdover and sight height diagram')).toBeInTheDocument();
    expect(
      screen.getByText(/diagram showing a sight line above a projectile path\. at close range/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /holdover and sight height diagram/i })).toHaveAttribute(
      'aria-labelledby',
      'holdover-diagram-title holdover-diagram-desc'
    );
  });

  it('works in a dark theme context', () => {
    renderWithTheme('dark');

    expect(
      screen.getByRole('img', { name: /holdover and sight height diagram/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Projectile Path')).toBeInTheDocument();
  });
});
