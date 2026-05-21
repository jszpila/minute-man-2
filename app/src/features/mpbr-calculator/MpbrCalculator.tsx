import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';

import { useAppContext } from '../../shared/context/AppContext';
import FixedButtonFooter from '../../shared/components/FixedButtonFooter';
import Modal from '../../shared/components/Modal';
import NumericInput from '../../shared/components/NumericInput';
import { StorageKeys, getStorageItem, setStorageItem } from '../../shared/utils/storage';
import {
  calculateMpbr,
  centimetersToInches,
  DEFAULT_MPBR_PROFILE,
  getMpbrProfileHeight,
  getMpbrProfileVitalZone,
  inchesToCentimeters,
  MPBR_HEIGHT_LIMITS,
  MPBR_VITAL_ZONE_LIMITS,
  yardsToMeters,
} from '../../shared/utils/calculations';
import type {
  MpbrCalculationResult,
  MpbrProfile,
  MpbrUnitSystem,
} from '../../shared/utils/calculations';
import MpbrTrajectoryDiagram from './components/MpbrTrajectoryDiagram';

interface MpbrFormState {
  profile: MpbrProfile;
  vitalZone: string;
  heightOverBore: string;
}

type ValidationErrors = Partial<Record<'vitalZone' | 'heightOverBore', string>>;

const isMpbrProfile = (value: unknown): value is MpbrProfile =>
  value === '556Nato55' ||
  value === '556Nato77' ||
  value === '308Hunting' ||
  value === '9mmPcc' ||
  value === '22Lr' ||
  value === '12gaSlug' ||
  value === 'genericCarbine' ||
  value === 'genericHuntingRifle' ||
  value === 'custom';

const formatNumber = (value: number, decimals = 0) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

const convertDistanceFromYards = (yards: number, unitSystem: MpbrUnitSystem) =>
  unitSystem === 'metric' ? yardsToMeters(yards) : yards;

const convertHeightFromInches = (inches: number, unitSystem: MpbrUnitSystem) =>
  unitSystem === 'metric' ? inchesToCentimeters(inches) : inches;

const MpbrCalculator: React.FC = () => {
  const { t } = useTranslation();
  const { units } = useAppContext();

  const defaultProfileValue = getStorageItem<MpbrProfile>(
    StorageKeys.MPBR_PROFILE_DEFAULT,
    DEFAULT_MPBR_PROFILE
  );
  const defaultProfile = isMpbrProfile(defaultProfileValue)
    ? defaultProfileValue
    : DEFAULT_MPBR_PROFILE;
  const defaultVitalZone =
    getStorageItem<number>(
      StorageKeys.MPBR_VITAL_ZONE_DEFAULT,
      getMpbrProfileVitalZone(defaultProfile, units)
    ) || getMpbrProfileVitalZone(defaultProfile, units);
  const defaultHeight =
    getStorageItem<number>(
      StorageKeys.MPBR_HEIGHT_OVER_BORE_DEFAULT,
      getMpbrProfileHeight(defaultProfile, units)
    ) || getMpbrProfileHeight(defaultProfile, units);

  const [formData, setFormData] = useState<MpbrFormState>(() => ({
    profile: defaultProfile,
    vitalZone: String(defaultVitalZone),
    heightOverBore: String(defaultHeight),
  }));
  const [vitalZoneTouched, setVitalZoneTouched] = useState(false);
  const [heightTouched, setHeightTouched] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [result, setResult] = useState<MpbrCalculationResult | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const previousUnitsRef = useRef<MpbrUnitSystem>(units);

  const isMetric = units === 'metric';
  const distanceUnit = isMetric ? t('units.meters') : t('units.yards');
  const heightUnit = isMetric ? t('units.centimeters') : t('units.inches');
  const vitalLimits = isMetric ? MPBR_VITAL_ZONE_LIMITS.metric : MPBR_VITAL_ZONE_LIMITS.merican;
  const heightLimits = isMetric ? MPBR_HEIGHT_LIMITS.metric : MPBR_HEIGHT_LIMITS.merican;

  const setAndPersistFormData = (nextFormData: MpbrFormState) => {
    setFormData(nextFormData);
    setStorageItem(StorageKeys.MPBR_CALC_FORM, nextFormData);
  };

  useEffect(() => {
    if (previousUnitsRef.current === units) return;

    const fromMetric = previousUnitsRef.current === 'metric';
    const convertToCurrentUnits = (value: string, decimals: number) => {
      if (!value) return '';
      const parsed = parseFloat(value);
      if (isNaN(parsed)) return value;
      const inches = fromMetric ? centimetersToInches(parsed) : parsed;
      const converted = convertHeightFromInches(inches, units);
      return String(Math.round(converted * 10 ** decimals) / 10 ** decimals);
    };
    previousUnitsRef.current = units;
    setValidationErrors({});
    setFormData((previousFormData) => {
      const nextFormData = {
        ...previousFormData,
        vitalZone: convertToCurrentUnits(previousFormData.vitalZone, 1),
        heightOverBore: convertToCurrentUnits(previousFormData.heightOverBore, 2),
      };
      setStorageItem(StorageKeys.MPBR_CALC_FORM, nextFormData);
      return nextFormData;
    });
  }, [units]);

  const handleInputChange = (field: 'vitalZone' | 'heightOverBore', value: string) => {
    setAndPersistFormData({ ...formData, [field]: value });
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleProfileChange = (profile: MpbrProfile) => {
    const nextFormData = {
      ...formData,
      profile,
      vitalZone: vitalZoneTouched
        ? formData.vitalZone
        : String(getMpbrProfileVitalZone(profile, units)),
      heightOverBore: heightTouched
        ? formData.heightOverBore
        : String(getMpbrProfileHeight(profile, units)),
    };
    setAndPersistFormData(nextFormData);
  };

  const validateForm = (): boolean => {
    const nextErrors: ValidationErrors = {};
    const vitalZone = parseFloat(formData.vitalZone);
    const heightOverBore = parseFloat(formData.heightOverBore);

    if (!formData.vitalZone || isNaN(vitalZone) || vitalZone <= 0) {
      nextErrors.vitalZone = t('validation.mustBePositive');
    } else if (vitalZone < vitalLimits.min || vitalZone > vitalLimits.max) {
      nextErrors.vitalZone = t('validation.outOfRange');
    }

    if (!formData.heightOverBore || isNaN(heightOverBore) || heightOverBore <= 0) {
      nextErrors.heightOverBore = t('validation.mustBePositive');
    } else if (heightOverBore < heightLimits.min || heightOverBore > heightLimits.max) {
      nextErrors.heightOverBore = t('validation.outOfRange');
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const calculateResults = () => {
    if (!validateForm()) {
      setErrorModalOpen(true);
      return;
    }

    const vitalZone = parseFloat(formData.vitalZone);
    const heightOverBore = parseFloat(formData.heightOverBore);
    const vitalZoneInches = isMetric ? centimetersToInches(vitalZone) : vitalZone;
    const heightInches = isMetric ? centimetersToInches(heightOverBore) : heightOverBore;

    setResult({
      ...calculateMpbr(formData.profile, vitalZoneInches, heightInches),
    });
    setResultModalOpen(true);
  };

  const handleReset = () => {
    const resetData: MpbrFormState = {
      profile: defaultProfile,
      vitalZone: String(defaultVitalZone),
      heightOverBore: String(defaultHeight),
    };
    setVitalZoneTouched(false);
    setHeightTouched(false);
    setValidationErrors({});
    setAndPersistFormData(resetData);
  };

  const formatDistance = (yards: number) => formatNumber(convertDistanceFromYards(yards, units));
  const formatRise = (inches: number) => formatNumber(convertHeightFromInches(inches, units), 1);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('mpbrCalculator.title')}
      </Typography>

      <Stack spacing={3} sx={{ pb: 14 }}>
        <Typography variant="body2" color="textSecondary">
          {t('mpbrCalculator.description')}
        </Typography>

        <FormControl fullWidth>
          <InputLabel id="mpbr-profile-label">{t('mpbrCalculator.profile')}</InputLabel>
          <Select
            labelId="mpbr-profile-label"
            value={formData.profile}
            label={t('mpbrCalculator.profile')}
            onChange={(e) => handleProfileChange(e.target.value as MpbrProfile)}
          >
            <MenuItem value="556Nato55">{t('mpbrCalculator.profiles.556Nato55')}</MenuItem>
            <MenuItem value="556Nato77">{t('mpbrCalculator.profiles.556Nato77')}</MenuItem>
            <MenuItem value="308Hunting">{t('mpbrCalculator.profiles.308Hunting')}</MenuItem>
            <MenuItem value="9mmPcc">{t('mpbrCalculator.profiles.9mmPcc')}</MenuItem>
            <MenuItem value="22Lr">{t('mpbrCalculator.profiles.22Lr')}</MenuItem>
            <MenuItem value="12gaSlug">{t('mpbrCalculator.profiles.12gaSlug')}</MenuItem>
            <MenuItem value="genericCarbine">
              {t('mpbrCalculator.profiles.genericCarbine')}
            </MenuItem>
            <MenuItem value="genericHuntingRifle">
              {t('mpbrCalculator.profiles.genericHuntingRifle')}
            </MenuItem>
            <MenuItem value="custom">{t('mpbrCalculator.profiles.custom')}</MenuItem>
          </Select>
        </FormControl>

        <NumericInput
          label={`${t('mpbrCalculator.vitalZone')} (${heightUnit})`}
          value={formData.vitalZone}
          onChange={(value) => {
            setVitalZoneTouched(true);
            handleInputChange('vitalZone', value);
          }}
          fullWidth
          maxDecimals={1}
          allowNegative={false}
          min={vitalLimits.min}
          max={vitalLimits.max}
          error={Boolean(validationErrors.vitalZone)}
          helperText={
            validationErrors.vitalZone ||
            t('mpbrCalculator.vitalZoneHelp', {
              half: formatNumber(parseFloat(formData.vitalZone || '0') / 2, 1),
            })
          }
        />

        <NumericInput
          label={`${t('mpbrCalculator.heightOverBore')} (${heightUnit})`}
          value={formData.heightOverBore}
          onChange={(value) => {
            setHeightTouched(true);
            handleInputChange('heightOverBore', value);
          }}
          fullWidth
          maxDecimals={2}
          allowNegative={false}
          min={heightLimits.min}
          max={heightLimits.max}
          error={Boolean(validationErrors.heightOverBore)}
          helperText={
            validationErrors.heightOverBore ||
            t('mpbrCalculator.heightOverBoreHelp', {
              min: heightLimits.min,
              max: heightLimits.max,
              unit: heightUnit,
            })
          }
        />

        <Typography variant="caption" color="textSecondary">
          {t('mpbrCalculator.estimateNotice')}
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

      <Modal
        open={resultModalOpen}
        title={t('mpbrCalculator.results')}
        onClose={() => setResultModalOpen(false)}
      >
        {result && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Card variant="outlined" data-testid="mpbr-primary-results-card">
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" color="textSecondary">
                      {t('mpbrCalculator.recommendedZero')}
                    </Typography>
                    <Typography variant="h5">
                      {formatDistance(result.recommendedZeroYards)} {distanceUnit}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" color="textSecondary">
                      {t('mpbrCalculator.mpbr')}
                    </Typography>
                    <Typography variant="h5">
                      {formatDistance(result.mpbrYards)} {distanceUnit}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Stack spacing={1}>
              <Typography>
                {t('mpbrCalculator.maximumRise')}: +{formatRise(result.maximumRiseInches)}
                {heightUnit}
              </Typography>
              <Typography>
                {t('mpbrCalculator.nearZero')}: {formatDistance(result.nearZeroYards)}{' '}
                {distanceUnit}
              </Typography>
              <Typography>
                {t('mpbrCalculator.farZero')}: {formatDistance(result.farZeroYards)} {distanceUnit}
              </Typography>
            </Stack>

            <MpbrTrajectoryDiagram result={result} distanceUnit={distanceUnit} />

            <Typography>
              {t('mpbrCalculator.resultExplanation', {
                mpbr: formatDistance(result.mpbrYards),
                distanceUnit,
              })}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {t('mpbrCalculator.disclaimer')}
            </Typography>
          </Stack>
        )}
      </Modal>

      <Modal
        open={errorModalOpen}
        title={t('common.error')}
        onClose={() => setErrorModalOpen(false)}
      >
        {t('mpbrCalculator.invalidInput')}
      </Modal>
    </Box>
  );
};

export default MpbrCalculator;
