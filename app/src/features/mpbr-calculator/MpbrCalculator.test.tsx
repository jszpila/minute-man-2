import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import MpbrCalculator from './MpbrCalculator';
import { getStorageItem } from '../../shared/utils/storage';

let mockUnits: 'merican' | 'metric' = 'merican';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../shared/context/AppContext', () => ({
  useAppContext: () => ({
    units: mockUnits,
  }),
}));

jest.mock('../../shared/utils/storage', () => ({
  getStorageItem: jest.fn((_key, defaultValue) => defaultValue),
  setStorageItem: jest.fn(),
  StorageKeys: {
    MPBR_CALC_FORM: 'mm_mpbrCalcForm',
    MPBR_PROFILE_DEFAULT: 'mm_mpbrProfileDefault',
    MPBR_VITAL_ZONE_DEFAULT: 'mm_mpbrVitalZoneDefault',
    MPBR_HEIGHT_OVER_BORE_DEFAULT: 'mm_mpbrHeightOverBoreDefault',
  },
}));

describe('MpbrCalculator', () => {
  const mockGetStorageItem = getStorageItem as jest.Mock;

  beforeEach(() => {
    mockUnits = 'merican';
    jest.clearAllMocks();
    mockGetStorageItem.mockImplementation((_key, defaultValue) => defaultValue);
  });

  it('renders default fields', () => {
    render(<MpbrCalculator />);

    expect(screen.getByText('mpbrCalculator.title')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'mpbrCalculator.profile' })).toHaveTextContent(
      'mpbrCalculator.profiles.556Nato55'
    );
    expect(screen.getByLabelText('mpbrCalculator.vitalZone (units.inches)')).toHaveValue('6');
    expect(screen.getByLabelText('mpbrCalculator.heightOverBore (units.inches)')).toHaveValue(
      '2.5'
    );
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });

  it('updates default inputs when preset changes', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MpbrCalculator />);

    await user.click(screen.getByRole('combobox', { name: 'mpbrCalculator.profile' }));
    await user.click(screen.getByRole('option', { name: 'mpbrCalculator.profiles.9mmPcc' }));

    expect(screen.getByLabelText('mpbrCalculator.vitalZone (units.inches)')).toHaveValue('4');
    expect(screen.getByLabelText('mpbrCalculator.heightOverBore (units.inches)')).toHaveValue('2');
  });

  it('shows validation and error modal for invalid submission', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MpbrCalculator />);

    await user.clear(screen.getByLabelText('mpbrCalculator.vitalZone (units.inches)'));
    await user.click(screen.getByRole('button', { name: 'common.sendIt' }));

    expect(screen.getByRole('heading', { name: 'common.error' })).toBeInTheDocument();
    expect(screen.getByText('mpbrCalculator.invalidInput')).toBeInTheDocument();
    expect(screen.getByLabelText('mpbrCalculator.vitalZone (units.inches)')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('opens result modal with practical outputs and SVG diagram', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MpbrCalculator />);

    await user.click(screen.getByRole('button', { name: 'common.sendIt' }));

    expect(screen.getByRole('heading', { name: 'mpbrCalculator.results' })).toBeInTheDocument();
    expect(screen.getByText('mpbrCalculator.recommendedZero')).toBeInTheDocument();
    expect(screen.getByText('mpbrCalculator.mpbr')).toBeInTheDocument();
    expect(screen.getByTestId('mpbr-primary-results-card')).toHaveTextContent(
      'mpbrCalculator.recommendedZero'
    );
    expect(screen.getByTestId('mpbr-primary-results-card')).toHaveTextContent(
      'mpbrCalculator.mpbr'
    );
    expect(
      screen.getByRole('img', { name: /Practical MPBR trajectory diagram/i })
    ).toBeInTheDocument();
    expect(screen.getByText('mpbrCalculator.disclaimer')).toBeInTheDocument();
  });

  it('resets to settings defaults', async () => {
    const user = userEvent.setup({ delay: null });
    mockGetStorageItem.mockImplementation((key, defaultValue) => {
      if (key === 'mm_mpbrProfileDefault') return '12gaSlug';
      if (key === 'mm_mpbrVitalZoneDefault') return 8;
      if (key === 'mm_mpbrHeightOverBoreDefault') return 1.5;
      return defaultValue;
    });
    render(<MpbrCalculator />);

    await user.clear(screen.getByLabelText('mpbrCalculator.vitalZone (units.inches)'));
    await user.type(screen.getByLabelText('mpbrCalculator.vitalZone (units.inches)'), '12');
    await user.click(screen.getByRole('button', { name: 'common.reset' }));

    expect(screen.getByRole('combobox', { name: 'mpbrCalculator.profile' })).toHaveTextContent(
      'mpbrCalculator.profiles.12gaSlug'
    );
    expect(screen.getByLabelText('mpbrCalculator.vitalZone (units.inches)')).toHaveValue('8');
  });

  it('renders with metric defaults and mobile-friendly diagram sizing', async () => {
    const user = userEvent.setup({ delay: null });
    mockUnits = 'metric';
    render(<MpbrCalculator />);

    expect(screen.getByLabelText('mpbrCalculator.vitalZone (units.centimeters)')).toHaveValue(
      '15.2'
    );

    await user.click(screen.getByRole('button', { name: 'common.sendIt' }));

    const svg = screen.getByRole('img', { name: /Practical MPBR trajectory diagram/i });
    expect(svg).toHaveAttribute('width', '100%');
    expect(svg).toHaveStyle({
      width: '100%',
      maxWidth: '100%',
      display: 'block',
    });
  });
});
