import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { About } from './About';
import { setupInstallPrompt } from '../../shared/utils/pwaUtils';

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../shared/utils/buildInfo', () => ({
  getDiagnosticsVersionInfo: () => 'v0.0.0-test (abc123def456, 05/19/26)',
}));

describe('About component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
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
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: false,
    });
  });

  it('renders About title', () => {
    render(<About />);
    expect(screen.getByText('about.title')).toBeInTheDocument();
  });

  it('renders company info links', () => {
    render(<About />);
    // Check for company info by looking for specific keywords
    const companyElements = screen.getAllByText(
      /about\.(madeBy|ursineSoftware|contactUs|contactEmail)/
    );
    expect(companyElements.length).toBeGreaterThan(0);
  });

  it('renders Open Meteo weather attribution', () => {
    render(<About />);
    expect(screen.getByText(/about\.weatherDataProvidedBy/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'about.openMeteo' })).toHaveAttribute(
      'href',
      'https://open-meteo.com/'
    );
  });

  it('renders diagnostics as a collapsed card', () => {
    render(<About />);
    expect(screen.getByText('about.diagnosticsTitle')).toBeInTheDocument();
    expect(screen.queryByText('about.diagnosticVersion')).not.toBeInTheDocument();
  });

  it('expands diagnostics details when clicked', () => {
    render(<About />);
    fireEvent.click(screen.getByText('about.diagnosticsTitle'));
    expect(screen.getByText('about.diagnosticVersion')).toBeInTheDocument();
    expect(screen.getByText('about.diagnosticNetwork')).toBeInTheDocument();
    expect(screen.getByText('about.diagnosticMode')).toBeInTheDocument();
    expect(screen.getByText('about.diagnosticPlatform')).toBeInTheDocument();
  });

  it('renders share app QR code card', () => {
    render(<About />);
    expect(screen.getByText('about.shareTitle')).toBeInTheDocument();
    expect(screen.getByText('about.shareDescription')).toBeInTheDocument();
    expect(screen.getByAltText('about.shareQrAlt')).toHaveAttribute(
      'src',
      '/assets/minman-v2-qr.png'
    );
  });

  it('collapses and expands the share section', async () => {
    render(<About />);

    expect(screen.getByText('about.shareDescription')).toBeVisible();
    fireEvent.click(screen.getByText('about.shareTitle'));
    await waitFor(() =>
      expect(screen.queryByText('about.shareDescription')).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('about.shareTitle'));
    expect(screen.getByText('about.shareDescription')).toBeVisible();
  });

  it('collapses and expands the install section', async () => {
    render(<About />);

    expect(screen.getByText('about.installPWADescription')).toBeVisible();
    fireEvent.click(screen.getByText('about.installPWATitle'));
    await waitFor(() =>
      expect(screen.queryByText('about.installPWADescription')).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('about.installPWATitle'));
    expect(screen.getByText('about.installPWADescription')).toBeVisible();
  });

  it('shows installation instructions in a browser tab without a native install prompt', () => {
    render(<About />);
    expect(screen.getByText('about.installPWATitle')).toBeInTheDocument();
    expect(screen.getByText('about.installPWADescription')).toBeInTheDocument();
    expect(screen.queryByText('about.installButton')).not.toBeInTheDocument();
  });

  it('shows installation instructions when install is available', async () => {
    setupInstallPrompt();
    render(<About />);

    const installPromptEvent = new Event('beforeinstallprompt');
    const prompt = jest.fn().mockResolvedValue(undefined);
    Object.defineProperties(installPromptEvent, {
      prompt: {
        value: prompt,
      },
      userChoice: {
        value: Promise.resolve({ outcome: 'accepted' }),
      },
    });

    fireEvent(window, installPromptEvent);

    // Check for PWA section header and description
    expect(screen.getByText('about.installPWATitle')).toBeInTheDocument();
    expect(screen.getByText('about.installPWADescription')).toBeInTheDocument();
    expect(screen.getByText('about.installation')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('about.installButton')).toBeInTheDocument());
    fireEvent.click(screen.getByText('about.installButton'));
    await waitFor(() => expect(prompt).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('about.installButton')).not.toBeInTheDocument());
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

  it('hides installation instructions when iOS reports standalone mode', () => {
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: true,
    });

    render(<About />);
    expect(screen.queryByText('about.installPWATitle')).not.toBeInTheDocument();
  });

  it('hides installation instructions when app has been installed previously', () => {
    window.localStorage.setItem('pwa:installed', 'true');

    render(<About />);
    expect(screen.queryByText('about.installPWATitle')).not.toBeInTheDocument();
  });

  it('displays diagnostics information correctly', () => {
    render(<About />);
    fireEvent.click(screen.getByText('about.diagnosticsTitle'));
    const versionCell = screen.getByText(
      (_content, element) => element?.textContent === 'v0.0.0-test (abc123def456, 05/19/26)'
    );
    expect(versionCell).toBeInTheDocument();
  });

  it('shows network status in diagnostics', () => {
    render(<About />);
    fireEvent.click(screen.getByText('about.diagnosticsTitle'));
    const networkLabel = screen.getByText('about.diagnosticNetwork');
    expect(networkLabel).toBeInTheDocument();
    // Network status cell should be near the label
    expect(networkLabel.closest('tr')).toBeInTheDocument();
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
