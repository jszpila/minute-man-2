import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import HoldoverCalculator from './HoldoverCalculator';
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
    HOLDOVER_CALC_FORM: 'mm_holdoverCalcForm',
    HOLDOVER_ZERO_DISTANCE_DEFAULT: 'mm_holdoverZeroDistanceDefault',
    HOLDOVER_PROFILE_DEFAULT: 'mm_holdoverProfileDefault',
    HOLDOVER_HEIGHT_OVER_BORE_DEFAULT: 'mm_holdoverHeightOverBoreDefault',
    HOLDOVER_OUTPUT_UNIT_DEFAULT: 'mm_holdoverOutputUnitDefault',
    ADJUSTMENT_TYPE_DEFAULT: 'mm_adjustmentTypeDefault',
  },
}));

describe('HoldoverCalculator', () => {
  const mockGetStorageItem = getStorageItem as jest.Mock;

  beforeEach(() => {
    mockUnits = 'merican';
    jest.clearAllMocks();
    mockGetStorageItem.mockImplementation((_key, defaultValue) => defaultValue);
  });

  it('renders default imperial fields', () => {
    render(<HoldoverCalculator />);

    expect(screen.getByText('holdoverCalculator.title')).toBeInTheDocument();
    expect(screen.getByLabelText('holdoverCalculator.zeroDistance (units.yards)')).toHaveValue(
      '50'
    );
    expect(screen.getByLabelText('holdoverCalculator.heightOverBore (units.inches)')).toHaveValue(
      '2.5'
    );
  });

  it('renders metric units with metric height defaults', () => {
    mockUnits = 'metric';
    render(<HoldoverCalculator />);

    expect(screen.getByLabelText('holdoverCalculator.zeroDistance (units.meters)')).toHaveValue(
      '50'
    );
    expect(
      screen.getByLabelText('holdoverCalculator.heightOverBore (units.centimeters)')
    ).toHaveValue('6.35');
  });

  it('applies Settings defaults over stale saved calculator defaults on reload', () => {
    mockGetStorageItem.mockImplementation((key, defaultValue) => {
      if (key === 'mm_holdoverZeroDistanceDefault') return 100;
      if (key === 'mm_holdoverProfileDefault') return 'pistol';
      if (key === 'mm_holdoverHeightOverBoreDefault') return 1;
      if (key === 'mm_holdoverOutputUnitDefault') return 'mrad';
      if (key === 'mm_holdoverCalcForm') {
        return {
          zeroDistance: '50',
          targetDistance: '10',
          heightOverBore: '2.5',
          firearmProfile: 'arCarbine',
          outputUnit: 'moa',
        };
      }
      return defaultValue;
    });

    render(<HoldoverCalculator />);

    expect(screen.getByLabelText('holdoverCalculator.zeroDistance (units.yards)')).toHaveValue(
      '100'
    );
    expect(screen.getByLabelText('holdoverCalculator.heightOverBore (units.inches)')).toHaveValue(
      '1'
    );
    expect(
      screen.getByRole('combobox', { name: 'holdoverCalculator.firearmProfile' })
    ).toHaveTextContent('holdoverCalculator.profiles.pistol');
    expect(
      screen.getByRole('combobox', { name: 'holdoverCalculator.outputUnit' })
    ).toHaveTextContent('settings.mrad');
    expect(screen.getByLabelText('holdoverCalculator.targetDistance (units.yards)')).toHaveValue(
      '10'
    );
  });

  it('opens the help modal from the title row help button', async () => {
    const user = userEvent.setup({ delay: null });
    render(<HoldoverCalculator />);

    await user.click(screen.getByLabelText('holdoverCalculator.helpOpenAria'));

    expect(screen.getByRole('heading', { name: 'common.help' })).toBeInTheDocument();
    expect(screen.getByText('holdoverCalculator.helpZeroDistance')).toBeInTheDocument();
    expect(screen.getByText('holdoverCalculator.helpOutputUnit')).toBeInTheDocument();
  });

  it('updates height over bore from firearm profile when it has not been manually edited', async () => {
    const user = userEvent.setup({ delay: null });
    render(<HoldoverCalculator />);

    await user.click(screen.getByRole('combobox', { name: 'holdoverCalculator.firearmProfile' }));
    await user.click(screen.getByRole('option', { name: 'holdoverCalculator.profiles.pistol' }));

    expect(screen.getByLabelText('holdoverCalculator.heightOverBore (units.inches)')).toHaveValue(
      '1'
    );
  });

  it('shows validation errors and an error modal for missing target distance', async () => {
    const user = userEvent.setup({ delay: null });
    render(<HoldoverCalculator />);

    await user.click(screen.getByRole('button', { name: 'common.sendIt' }));

    expect(screen.getByRole('heading', { name: 'common.error' })).toBeInTheDocument();
    expect(screen.getByText('holdoverCalculator.invalidInput')).toBeInTheDocument();
    expect(
      screen.getByLabelText('holdoverCalculator.targetDistance (units.yards)')
    ).toHaveAttribute('aria-invalid', 'true');
  });

  it('opens the result modal for valid input', async () => {
    const user = userEvent.setup({ delay: null });
    render(<HoldoverCalculator />);

    await user.type(screen.getByLabelText('holdoverCalculator.targetDistance (units.yards)'), '10');
    await user.click(screen.getByRole('button', { name: 'common.sendIt' }));

    expect(screen.getByRole('heading', { name: 'holdoverCalculator.results' })).toBeInTheDocument();
    expect(screen.getByText('holdoverCalculator.disclaimer')).toBeInTheDocument();
  });

  it('matches snapshot with result modal open', async () => {
    const user = userEvent.setup({ delay: null });
    const { baseElement } = render(<HoldoverCalculator />);

    await user.type(screen.getByLabelText('holdoverCalculator.targetDistance (units.yards)'), '10');
    await user.click(screen.getByRole('button', { name: 'common.sendIt' }));

    expect(baseElement).toMatchSnapshot();
  });
});
