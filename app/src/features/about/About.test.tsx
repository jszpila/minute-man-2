import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { About } from './About';

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock GitInfo
jest.mock('../../shared/static/GitInfo', () => ({
  default: {
    sha: 'abc123def456',
  },
}));

describe('About component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.matchMedia for standalone check
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('renders About title', () => {
    render(<About />);
    expect(screen.getByText('about.title')).toBeInTheDocument();
  });

  it('renders company info links', () => {
    render(<About />);
    // Check for company info by looking for specific keywords
    const companyElements = screen.getAllByText(/about\.(madeBy|ursineSoftware|contactUs|contactEmail)/);
    expect(companyElements.length).toBeGreaterThan(0);
  });

  it('renders diagnostics table when not standalone', () => {
    render(<About />);
    expect(screen.getByText('about.diagnosticsTitle')).toBeInTheDocument();
    expect(screen.getByText('about.diagnosticVersion')).toBeInTheDocument();
    expect(screen.getByText('about.diagnosticNetwork')).toBeInTheDocument();
    expect(screen.getByText('about.diagnosticMode')).toBeInTheDocument();
    expect(screen.getByText('about.diagnosticPlatform')).toBeInTheDocument();
  });

  it('shows installation instructions when not standalone', () => {
    render(<About />);
    // Check for PWA section header and description
    expect(screen.getByText('about.installPWATitle')).toBeInTheDocument();
    expect(screen.getByText('about.installPWADescription')).toBeInTheDocument();
    expect(screen.getByText('about.installation')).toBeInTheDocument();
  });

  it('hides installation instructions when in standalone mode', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<About />);
    expect(screen.queryByText('about.installPWATitle')).not.toBeInTheDocument();
  });

  it('displays diagnostics information correctly', () => {
    render(<About />);
    // Version should include the SHA
    const versionCell = screen.getByText(/v2\.0\.1/);
    expect(versionCell).toBeInTheDocument();
  });

  it('shows network status in diagnostics', () => {
    render(<About />);
    const networkLabel = screen.getByText('about.diagnosticNetwork');
    expect(networkLabel).toBeInTheDocument();
    // Network status cell should be near the label
    expect(networkLabel.closest('tr')).toBeInTheDocument();
  });

  it('renders company donation link', () => {
    render(<About />);
    const donateLink = screen.getByText('about.donate');
    expect(donateLink).toBeInTheDocument();
  });

  it('matches snapshot when not standalone', () => {
    const { container } = render(<About />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when in standalone mode', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { container } = render(<About />);
    expect(container).toMatchSnapshot();
  });
});
