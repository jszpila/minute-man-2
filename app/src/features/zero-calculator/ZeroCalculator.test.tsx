import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ZeroCalculator from './ZeroCalculator';
import { getStorageItem } from '../../shared/utils/storage';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../shared/context/AppContext', () => ({
  useAppContext: () => ({
    units: 'merican',
  }),
}));

jest.mock('../../shared/utils/storage', () => ({
  getStorageItem: jest.fn((_key, defaultValue) => defaultValue),
  setStorageItem: jest.fn(),
  StorageKeys: {
    ZERO_DISTANCE_DEFAULT: 'mm_zeroDistanceDefault',
    ADJUSTMENT_TYPE_DEFAULT: 'mm_adjustmentTypeDefault',
    ADJUSTMENT_INCREMENT_DEFAULT: 'mm_adjustmentIncrementDefault',
    ZERO_CALC_FORM: 'mm_zeroCalcForm',
  },
}));

describe('ZeroCalculator', () => {
  const mockGetStorageItem = getStorageItem as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStorageItem.mockImplementation((_key, defaultValue) => defaultValue);
  });

  it('opens the help modal from the title row help button', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ZeroCalculator />);

    await user.click(screen.getByLabelText('zeroCalculator.helpOpenAria'));

    expect(screen.getByRole('heading', { name: 'common.help' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /point of aim and point of impact diagram/i }));
    expect(screen.getByText('zeroCalculator.pointOfAim')).toBeInTheDocument();
    expect(screen.getAllByText('zeroCalculator.pointOfImpact').length).toBeGreaterThan(0);
    expect(screen.getAllByText('zeroCalculator.horizontalOffset').length).toBeGreaterThan(0);
    expect(screen.getAllByText('zeroCalculator.verticalOffset').length).toBeGreaterThan(0);
    expect(screen.getByText('zeroCalculator.helpPointAimImpact')).toBeInTheDocument();
    expect(screen.getByText('zeroCalculator.helpPointImpactGroup')).toBeInTheDocument();
    expect(screen.getByText('zeroCalculator.helpOffsets')).toBeInTheDocument();
  });

  it('renders MOA adjustment type and 10-yard zero distance minimum by default', () => {
    render(<ZeroCalculator />);

    expect(
      screen.getByRole('combobox', { name: 'zeroCalculator.adjustmentType' })
    ).toHaveTextContent('settings.moa');
    expect(screen.getByLabelText('zeroCalculator.zeroRange (units.yards)')).toHaveAttribute(
      'min',
      '10'
    );
    expect(screen.getByLabelText('zeroCalculator.zeroRange (units.yards)')).toHaveAttribute(
      'step',
      '5'
    );
  });

  it('switches adjustment increment options when MRAD is selected', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ZeroCalculator />);

    await user.click(screen.getByRole('combobox', { name: 'zeroCalculator.adjustmentType' }));
    await user.click(screen.getByRole('option', { name: 'settings.mrad' }));

    expect(
      screen.getByRole('combobox', { name: 'zeroCalculator.adjustmentIncrement' })
    ).toHaveTextContent('0.1 settings.mradClick');
  });

  it('applies Settings defaults over a previously saved calculator form on reload', () => {
    mockGetStorageItem.mockImplementation((key, defaultValue) => {
      if (key === 'mm_zeroDistanceDefault') return 50;
      if (key === 'mm_adjustmentTypeDefault') return 'mrad';
      if (key === 'mm_adjustmentIncrementDefault') return '0.025';
      if (key === 'mm_zeroCalcForm') {
        return {
          horizontalOffsetDistance: '1',
          horizontalOffsetDirection: 'right',
          verticalOffsetDistance: '',
          verticalOffsetDirection: 'up',
          zeroDistance: '100',
          adjustmentType: 'moa',
          adjustmentIncrement: '0.25',
        };
      }
      return defaultValue;
    });

    render(<ZeroCalculator />);

    expect(screen.getByLabelText('zeroCalculator.zeroRange (units.yards)')).toHaveValue(50);
    expect(
      screen.getByRole('combobox', { name: 'zeroCalculator.adjustmentType' })
    ).toHaveTextContent('settings.mrad');
    expect(
      screen.getByRole('combobox', { name: 'zeroCalculator.adjustmentIncrement' })
    ).toHaveTextContent('0.025 settings.mradClick');
    expect(screen.getByLabelText('zeroCalculator.horizontalOffset (units.inches)')).toHaveValue(
      '1'
    );
  });

  it('matches snapshot with help modal open', async () => {
    const user = userEvent.setup({ delay: null });
    const { baseElement } = render(<ZeroCalculator />);

    await user.click(screen.getByLabelText('zeroCalculator.helpOpenAria'));

    expect(baseElement).toMatchSnapshot();
  });

  it('matches snapshot with error modal open', async () => {
    const user = userEvent.setup({ delay: null });
    const { baseElement } = render(<ZeroCalculator />);

    await user.click(screen.getByRole('button', { name: 'common.sendIt' }));

    expect(screen.getByRole('heading', { name: 'common.error' })).toBeInTheDocument();
    expect(baseElement).toMatchSnapshot();
  });

  it('matches snapshot with result modal open', async () => {
    const user = userEvent.setup({ delay: null });
    const { baseElement } = render(<ZeroCalculator />);

    await user.type(screen.getByLabelText('zeroCalculator.horizontalOffset (units.inches)'), '1');
    await user.click(screen.getByRole('button', { name: 'common.sendIt' }));

    expect(screen.getByRole('heading', { name: 'zeroCalculator.results' })).toBeInTheDocument();
    expect(baseElement).toMatchSnapshot();
  });
});
