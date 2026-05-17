import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import MilDotCalculator from './MilDotCalculator';

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
    MILDOT_SIZE_DEFAULT: 'mm_mildotSizeDefault',
    MILDOT_PHYSICAL_SIZE_DEFAULT: 'mm_mildotPhysicalSizeDefault',
    MILDOT_DISTANCE_DEFAULT: 'mm_mildotDistanceDefault',
    MILDOT_CALC_FORM: 'mm_mildotCalcForm',
  },
}));

describe('MilDotCalculator', () => {
  it('opens the help modal from the title row help button', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MilDotCalculator />);

    await user.click(screen.getByLabelText('mildotCalculator.helpOpenAria'));

    expect(screen.getByRole('heading', { name: 'common.help' })).toBeInTheDocument();
    expect(screen.getByText('mildotCalculator.helpIntro')).toBeInTheDocument();
    expect(screen.getByText('mildotCalculator.helpTerms')).toBeInTheDocument();
    expect(screen.getByText('mildotCalculator.helpExample')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<MilDotCalculator />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with help modal open', async () => {
    const user = userEvent.setup({ delay: null });
    const { baseElement } = render(<MilDotCalculator />);

    await user.click(screen.getByLabelText('mildotCalculator.helpOpenAria'));

    expect(baseElement).toMatchSnapshot();
  });

  it('matches snapshot with result modal open', async () => {
    const user = userEvent.setup({ delay: null });
    const { baseElement } = render(<MilDotCalculator />);

    await user.clear(screen.getByLabelText('mildotCalculator.milSize'));
    await user.type(screen.getByLabelText('mildotCalculator.milSize'), '2');
    await user.clear(screen.getByLabelText('mildotCalculator.physicalSize (units.inches)'));
    await user.type(screen.getByLabelText('mildotCalculator.physicalSize (units.inches)'), '12');
    await user.click(screen.getByRole('button', { name: 'common.sendIt' }));

    expect(screen.getByRole('heading', { name: 'mildotCalculator.results' })).toBeInTheDocument();
    expect(baseElement).toMatchSnapshot();
  });
});
