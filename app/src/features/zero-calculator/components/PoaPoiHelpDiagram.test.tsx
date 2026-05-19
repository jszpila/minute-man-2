import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PoaPoiHelpDiagram from './PoaPoiHelpDiagram';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithTheme = (mode: 'light' | 'dark') => {
  return render(
    <ThemeProvider theme={createTheme({ palette: { mode } })}>
      <PoaPoiHelpDiagram />
    </ThemeProvider>
  );
};

describe('PoaPoiHelpDiagram', () => {
  it('renders without crashing', () => {
    renderWithTheme('light');

    expect(
      screen.getByRole('img', { name: /point of aim and point of impact diagram/i })
    ).toBeInTheDocument();
  });

  it('renders an SVG with required labels', () => {
    renderWithTheme('light');

    expect(screen.getByText('zeroCalculator.pointOfAim')).toBeInTheDocument();
    expect(screen.getByText('zeroCalculator.pointOfImpact')).toBeInTheDocument();
    expect(screen.getByText('zeroCalculator.horizontalOffset')).toBeInTheDocument();
    expect(screen.getByText('zeroCalculator.verticalOffset')).toBeInTheDocument();
  });

  it('provides accessible title and description', () => {
    renderWithTheme('light');

    expect(screen.getByText('Point of aim and point of impact diagram')).toBeInTheDocument();
    expect(
      screen.getByText(/diagram showing a target center as the point of aim/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /point of aim and point of impact diagram/i })
    ).toHaveAttribute('aria-labelledby', 'poa-poi-diagram-title poa-poi-diagram-desc');
  });

  it('works in a dark theme context', () => {
    renderWithTheme('dark');

    expect(
      screen.getByRole('img', { name: /point of aim and point of impact diagram/i })
    ).toBeInTheDocument();
    expect(screen.getByText('zeroCalculator.verticalOffset')).toBeInTheDocument();
  });
});
