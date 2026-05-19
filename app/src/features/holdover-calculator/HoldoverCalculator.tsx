import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { useAppContext } from '../../shared/context/AppContext';
import Modal from '../../shared/components/Modal';
import FixedButtonFooter from '../../shared/components/FixedButtonFooter';
import NumericInput from '../../shared/components/NumericInput';
import HoldoverHelpDiagram from './components/HoldoverHelpDiagram';
import {
  calculateHoldoverMoa,
  calculateHoldoverMrad,
  calculateHoldoverOffset,
  centimetersToInches,
  getHoldoverProfileHeight,
  HOLDOVER_DISTANCE_LIMITS,
  HOLDOVER_HEIGHT_LIMITS,
  metersToYards,
  DEFAULT_HOLDOVER_OUTPUT_UNIT,
  DEFAULT_HOLDOVER_PROFILE,
} from '../../shared/utils/calculations';
import type { HoldoverFirearmProfile, HoldoverOutputUnit } from '../../shared/utils/calculations';
import { StorageKeys, getStorageItem, setStorageItem } from '../../shared/utils/storage';

interface HoldoverFormState {
  zeroDistance: string;
  targetDistance: string;
  heightOverBore: string;
  firearmProfile: HoldoverFirearmProfile;
  outputUnit: HoldoverOutputUnit;
}

interface HoldoverCalculatorResult {
  impactOffset: number;
  impactAmount: number;
  impactDirection: 'high' | 'low' | 'deadOn';
  holdAmount: number;
  holdDirection: 'high' | 'low' | 'deadOn';
  outputUnit: HoldoverOutputUnit;
  outputUnitLabel: string;
  physicalOffset: number;
  physicalUnitLabel: string;
  zeroDistance: string;
  targetDistance: string;
  heightOverBore: string;
  firearmProfile: HoldoverFirearmProfile;
}

type ValidationErrors = Partial<
  Record<
    keyof Pick<HoldoverFormState, 'zeroDistance' | 'targetDistance' | 'heightOverBore'>,
    string
  >
>;

const isHoldoverProfile = (value: unknown): value is HoldoverFirearmProfile =>
  value === 'arCarbine' ||
  value === 'traditionalRifle' ||
  value === 'pistol' ||
  value === 'rimfire' ||
  value === 'custom';

const isHoldoverOutputUnit = (value: unknown): value is HoldoverOutputUnit =>
  value === 'physical' || value === 'moa' || value === 'mrad';

const roundTo = (value: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const formatNumber = (value: number) => {
  const rounded = roundTo(value);
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

const HoldoverCalculator: React.FC = () => {
  const { t } = useTranslation();
  const { units } = useAppContext();
  const isMetric = units === 'metric';
  const distanceUnit = isMetric ? t('units.meters') : t('units.yards');
  const heightUnit = isMetric ? t('units.centimeters') : t('units.inches');
  const heightLimits = isMetric ? HOLDOVER_HEIGHT_LIMITS.metric : HOLDOVER_HEIGHT_LIMITS.merican;

  const defaultProfileValue = getStorageItem<HoldoverFirearmProfile>(
    StorageKeys.HOLDOVER_PROFILE_DEFAULT,
    DEFAULT_HOLDOVER_PROFILE
  );
  const defaultProfile = isHoldoverProfile(defaultProfileValue)
    ? defaultProfileValue
    : DEFAULT_HOLDOVER_PROFILE;
  const defaultZeroDistance =
    getStorageItem<number>(StorageKeys.HOLDOVER_ZERO_DISTANCE_DEFAULT, 50) || 50;
  const defaultHeight =
    getStorageItem<number>(
      StorageKeys.HOLDOVER_HEIGHT_OVER_BORE_DEFAULT,
      getHoldoverProfileHeight(defaultProfile, units)
    ) || getHoldoverProfileHeight(defaultProfile, units);
  const defaultOutputUnitValue = getStorageItem<HoldoverOutputUnit>(
    StorageKeys.HOLDOVER_OUTPUT_UNIT_DEFAULT
  );
  const defaultOutputUnit = isHoldoverOutputUnit(defaultOutputUnitValue)
    ? defaultOutputUnitValue
    : DEFAULT_HOLDOVER_OUTPUT_UNIT;

  const [formData, setFormData] = useState<HoldoverFormState>(() => {
    const saved = getStorageItem<HoldoverFormState>(StorageKeys.HOLDOVER_CALC_FORM);
    return {
      zeroDistance: String(defaultZeroDistance),
      targetDistance: saved?.targetDistance || '',
      heightOverBore: String(defaultHeight),
      firearmProfile: defaultProfile,
      outputUnit: defaultOutputUnit,
    };
  });
  const [heightOverBoreTouched, setHeightOverBoreTouched] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [result, setResult] = useState<HoldoverCalculatorResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const setAndPersistFormData = (nextFormData: HoldoverFormState) => {
    setFormData(nextFormData);
    setStorageItem(StorageKeys.HOLDOVER_CALC_FORM, nextFormData);
  };

  const handleInputChange = (field: keyof HoldoverFormState, value: string) => {
    const nextFormData = {
      ...formData,
      [field]: value,
    };
    setAndPersistFormData(nextFormData);
    setValidationErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handleHeightOverBoreChange = (value: string) => {
    setHeightOverBoreTouched(true);
    handleInputChange('heightOverBore', value);
  };

  const handleProfileChange = (firearmProfile: HoldoverFirearmProfile) => {
    const nextHeightOverBore = heightOverBoreTouched
      ? formData.heightOverBore
      : String(getHoldoverProfileHeight(firearmProfile, units));
    setAndPersistFormData({
      ...formData,
      firearmProfile,
      heightOverBore: nextHeightOverBore,
    });
  };

  const handleOutputUnitChange = (outputUnit: HoldoverOutputUnit) => {
    setAndPersistFormData({
      ...formData,
      outputUnit,
    });
  };

  const validateForm = (): boolean => {
    const nextErrors: ValidationErrors = {};
    const zeroDistance = parseFloat(formData.zeroDistance);
    const targetDistance = parseFloat(formData.targetDistance);
    const heightOverBore = parseFloat(formData.heightOverBore);

    if (!formData.zeroDistance || isNaN(zeroDistance) || zeroDistance <= 0) {
      nextErrors.zeroDistance = t('validation.mustBePositive');
    } else if (
      zeroDistance < HOLDOVER_DISTANCE_LIMITS.zero.min ||
      zeroDistance > HOLDOVER_DISTANCE_LIMITS.zero.max
    ) {
      nextErrors.zeroDistance = t('validation.outOfRange');
    }

    if (!formData.targetDistance || isNaN(targetDistance) || targetDistance <= 0) {
      nextErrors.targetDistance = t('validation.mustBePositive');
    } else if (
      targetDistance < HOLDOVER_DISTANCE_LIMITS.target.min ||
      targetDistance > HOLDOVER_DISTANCE_LIMITS.target.max
    ) {
      nextErrors.targetDistance = t('validation.outOfRange');
    }

    if (!formData.heightOverBore || isNaN(heightOverBore) || heightOverBore <= 0) {
      nextErrors.heightOverBore = t('validation.mustBePositive');
    } else if (heightOverBore < heightLimits.min || heightOverBore > heightLimits.max) {
      nextErrors.heightOverBore = t('validation.outOfRange');
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const calculateResults = (): void => {
    if (!validateForm()) {
      setErrorMessage(t('holdoverCalculator.invalidInput'));
      setErrorModalOpen(true);
      return;
    }

    try {
      const zeroDistance = parseFloat(formData.zeroDistance);
      const targetDistance = parseFloat(formData.targetDistance);
      const heightOverBore = parseFloat(formData.heightOverBore);
      const physicalOffset = calculateHoldoverOffset(heightOverBore, targetDistance, zeroDistance);
      const offsetInches = isMetric ? centimetersToInches(physicalOffset) : physicalOffset;
      const targetDistanceYards = isMetric ? metersToYards(targetDistance) : targetDistance;

      let impactOffset = physicalOffset;
      let outputUnitLabel = heightUnit;
      if (formData.outputUnit === 'moa') {
        impactOffset = calculateHoldoverMoa(offsetInches, targetDistanceYards);
        outputUnitLabel = t('settings.moa');
      } else if (formData.outputUnit === 'mrad') {
        impactOffset = calculateHoldoverMrad(offsetInches, targetDistanceYards);
        outputUnitLabel = t('settings.mrad');
      }

      const impactDirection = impactOffset < 0 ? 'low' : impactOffset > 0 ? 'high' : 'deadOn';
      const holdDirection = impactOffset < 0 ? 'high' : impactOffset > 0 ? 'low' : 'deadOn';

      setResult({
        impactOffset,
        impactAmount: Math.abs(impactOffset),
        impactDirection,
        holdAmount: Math.abs(impactOffset),
        holdDirection,
        outputUnit: formData.outputUnit,
        outputUnitLabel,
        physicalOffset,
        physicalUnitLabel: heightUnit,
        zeroDistance: formData.zeroDistance,
        targetDistance: formData.targetDistance,
        heightOverBore: formData.heightOverBore,
        firearmProfile: formData.firearmProfile,
      });
      setResultModalOpen(true);
    } catch {
      setErrorMessage(t('errors.genericError'));
      setErrorModalOpen(true);
    }
  };

  const handleReset = (): void => {
    const resetData: HoldoverFormState = {
      zeroDistance: String(defaultZeroDistance),
      targetDistance: '',
      heightOverBore: String(defaultHeight),
      firearmProfile: defaultProfile,
      outputUnit: defaultOutputUnit,
    };
    setHeightOverBoreTouched(false);
    setValidationErrors({});
    setAndPersistFormData(resetData);
  };

  const getFieldHelperText = (
    field: keyof ValidationErrors,
    min: number,
    max: number,
    unit: string
  ) => validationErrors[field] || t('settings.minMaxHelper', { min, max, unit });

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3, width: '100%' }}
      >
        <Typography variant="h4">{t('holdoverCalculator.title')}</Typography>
        <IconButton
          aria-label={t('holdoverCalculator.helpOpenAria')}
          color="inherit"
          onClick={() => setHelpModalOpen(true)}
          size="large"
        >
          <HelpOutlineIcon />
        </IconButton>
      </Stack>

      <Stack spacing={3} sx={{ pb: 14 }}>
        <Typography variant="body2" color="textSecondary">
          {t('holdoverCalculator.description')}
        </Typography>

        <NumericInput
          label={`${t('holdoverCalculator.zeroDistance')} (${distanceUnit})`}
          value={formData.zeroDistance}
          onChange={(value) => handleInputChange('zeroDistance', value)}
          placeholder="00.00"
          fullWidth
          maxDecimals={2}
          allowNegative={false}
          min={HOLDOVER_DISTANCE_LIMITS.zero.min}
          max={HOLDOVER_DISTANCE_LIMITS.zero.max}
          error={Boolean(validationErrors.zeroDistance)}
          helperText={getFieldHelperText(
            'zeroDistance',
            HOLDOVER_DISTANCE_LIMITS.zero.min,
            HOLDOVER_DISTANCE_LIMITS.zero.max,
            distanceUnit
          )}
        />

        <NumericInput
          label={`${t('holdoverCalculator.targetDistance')} (${distanceUnit})`}
          value={formData.targetDistance}
          onChange={(value) => handleInputChange('targetDistance', value)}
          placeholder="00.00"
          fullWidth
          maxDecimals={2}
          allowNegative={false}
          min={HOLDOVER_DISTANCE_LIMITS.target.min}
          max={HOLDOVER_DISTANCE_LIMITS.target.max}
          error={Boolean(validationErrors.targetDistance)}
          helperText={getFieldHelperText(
            'targetDistance',
            HOLDOVER_DISTANCE_LIMITS.target.min,
            HOLDOVER_DISTANCE_LIMITS.target.max,
            distanceUnit
          )}
        />

        <FormControl fullWidth>
          <InputLabel id="holdover-firearm-profile-label">
            {t('holdoverCalculator.firearmProfile')}
          </InputLabel>
          <Select
            labelId="holdover-firearm-profile-label"
            value={formData.firearmProfile}
            label={t('holdoverCalculator.firearmProfile')}
            onChange={(e) => handleProfileChange(e.target.value as HoldoverFirearmProfile)}
          >
            <MenuItem value="arCarbine">{t('holdoverCalculator.profiles.arCarbine')}</MenuItem>
            <MenuItem value="traditionalRifle">
              {t('holdoverCalculator.profiles.traditionalRifle')}
            </MenuItem>
            <MenuItem value="pistol">{t('holdoverCalculator.profiles.pistol')}</MenuItem>
            <MenuItem value="rimfire">{t('holdoverCalculator.profiles.rimfire')}</MenuItem>
            <MenuItem value="custom">{t('holdoverCalculator.profiles.custom')}</MenuItem>
          </Select>
        </FormControl>

        <NumericInput
          label={`${t('holdoverCalculator.heightOverBore')} (${heightUnit})`}
          value={formData.heightOverBore}
          onChange={handleHeightOverBoreChange}
          placeholder="00.00"
          fullWidth
          maxDecimals={2}
          allowNegative={false}
          min={heightLimits.min}
          max={heightLimits.max}
          error={Boolean(validationErrors.heightOverBore)}
          helperText={getFieldHelperText(
            'heightOverBore',
            heightLimits.min,
            heightLimits.max,
            heightUnit
          )}
        />

        <FormControl fullWidth>
          <InputLabel id="holdover-output-unit-label">
            {t('holdoverCalculator.outputUnit')}
          </InputLabel>
          <Select
            labelId="holdover-output-unit-label"
            value={formData.outputUnit}
            label={t('holdoverCalculator.outputUnit')}
            onChange={(e) => handleOutputUnitChange(e.target.value as HoldoverOutputUnit)}
          >
            <MenuItem value="physical">{heightUnit}</MenuItem>
            <MenuItem value="moa">{t('settings.moa')}</MenuItem>
            <MenuItem value="mrad">{t('settings.mrad')}</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="caption" color="textSecondary">
          {t('holdoverCalculator.estimateNotice')}
        </Typography>
      </Stack>

      <FixedButtonFooter>
        <Button variant="outlined" onClick={handleReset} sx={{ flex: 1 }}>
          {t('common.reset')}
        </Button>

        <Button variant="contained" onClick={calculateResults} sx={{ flex: 1 }}>
          {t('common.sendIt')}
        </Button>
      </FixedButtonFooter>

      <Modal open={helpModalOpen} title={t('common.help')} onClose={() => setHelpModalOpen(false)}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2">{t('holdoverCalculator.helpZeroDistance')}</Typography>
          <Typography variant="body2">{t('holdoverCalculator.helpDiagramIntro')}</Typography>
          <HoldoverHelpDiagram />
          <Typography variant="body2">{t('holdoverCalculator.helpCloseRangeImpact')}</Typography>
          <Typography variant="body2">{t('holdoverCalculator.helpDiagramDisclaimer')}</Typography>
          <Typography variant="body2">{t('holdoverCalculator.helpTargetDistance')}</Typography>
          <Typography variant="body2">{t('holdoverCalculator.helpHeightOverBore')}</Typography>
          <Typography variant="body2">{t('holdoverCalculator.helpFirearmProfile')}</Typography>
          <Typography variant="body2">{t('holdoverCalculator.helpOutputUnit')}</Typography>
        </Stack>
      </Modal>

      <Modal
        open={resultModalOpen}
        title={t('holdoverCalculator.results')}
        onClose={() => setResultModalOpen(false)}
      >
        {result && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Typography>
              {t('holdoverCalculator.resultSummary', {
                targetDistance: result.targetDistance,
                distanceUnit,
                zeroDistance: result.zeroDistance,
                heightOverBore: result.heightOverBore,
                heightUnit,
                impactAmount: formatNumber(result.impactAmount),
                outputUnit: result.outputUnitLabel,
                impactDirection: t(`holdoverCalculator.directions.${result.impactDirection}`),
              })}
            </Typography>
            <Typography>
              <strong>
                {t('holdoverCalculator.holdSummary', {
                  holdAmount: formatNumber(result.holdAmount),
                  outputUnit: result.outputUnitLabel,
                  holdDirection: t(`holdoverCalculator.directions.${result.holdDirection}`),
                })}
              </strong>
            </Typography>
            {result.outputUnit !== 'physical' && (
              <Typography variant="body2">
                {t('holdoverCalculator.physicalOffsetSummary', {
                  impactAmount: formatNumber(Math.abs(result.physicalOffset)),
                  outputUnit: result.physicalUnitLabel,
                  impactDirection: t(`holdoverCalculator.directions.${result.impactDirection}`),
                })}
              </Typography>
            )}
            <Typography variant="body2">
              {t('holdoverCalculator.inputSummary', {
                firearmProfile: t(`holdoverCalculator.profiles.${result.firearmProfile}`),
              })}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {t('holdoverCalculator.disclaimer')}
            </Typography>
          </Stack>
        )}
      </Modal>

      <Modal
        open={errorModalOpen}
        title={t('common.error')}
        onClose={() => setErrorModalOpen(false)}
      >
        {errorMessage}
      </Modal>
    </Box>
  );
};

export default HoldoverCalculator;
