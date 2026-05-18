import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import HoldoverHelpDiagram from './HoldoverHelpDiagram';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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

    expect(screen.getByText('holdoverCalculator.diagramSightLine')).toBeInTheDocument();
    expect(screen.getByText('holdoverCalculator.diagramProjectilePath')).toBeInTheDocument();
    expect(screen.getByText('holdoverCalculator.heightOverBore')).toBeInTheDocument();
    expect(screen.getByText('holdoverCalculator.zeroDistance')).toBeInTheDocument();
    expect(screen.getByText('holdoverCalculator.diagramPointOfImpact')).toBeInTheDocument();
    expect(screen.getByText('Optic')).toBeInTheDocument();
    expect(screen.getByText('Muzzle')).toBeInTheDocument();
  });

  it('provides accessible title and description', () => {
    renderWithTheme('light');

    expect(screen.getByText('Holdover and sight height diagram')).toBeInTheDocument();
    expect(screen.getByText(/diagram showing an optic above a muzzle/i)).toBeInTheDocument();
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
    expect(screen.getByText('holdoverCalculator.diagramProjectilePath')).toBeInTheDocument();
  });
});
