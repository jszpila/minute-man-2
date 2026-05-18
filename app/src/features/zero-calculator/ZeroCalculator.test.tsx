import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ZeroCalculator from './ZeroCalculator';

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
    ADJUSTMENT_INCREMENT_DEFAULT: 'mm_adjustmentIncrementDefault',
    ZERO_CALC_FORM: 'mm_zeroCalcForm',
  },
}));

describe('ZeroCalculator', () => {
  it('opens the help modal from the title row help button', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ZeroCalculator />);

    await user.click(screen.getByLabelText('zeroCalculator.helpOpenAria'));

    expect(screen.getByRole('heading', { name: 'common.help' })).toBeInTheDocument();
    expect(screen.getByAltText('zeroCalculator.helpDiagramAlt')).toHaveAttribute(
      'src',
      '/assets/zero-calculator-diagram.png'
    );
    expect(screen.getByText('zeroCalculator.helpPointAimImpact')).toBeInTheDocument();
    expect(screen.getByText('zeroCalculator.helpPointImpactGroup')).toBeInTheDocument();
    expect(screen.getByText('zeroCalculator.helpOffsets')).toBeInTheDocument();
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
