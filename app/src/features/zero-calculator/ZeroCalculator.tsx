import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useAppContext } from '../../shared/context/AppContext';
import Modal from '../../shared/components/Modal';
import FixedButtonFooter from '../../shared/components/FixedButtonFooter';
import NumericInput from '../../shared/components/NumericInput';
import {
  calculateZeroClicks,
  calculateClickValueInches,
  centimetersToInches,
} from '../../shared/utils/calculations';
import { StorageKeys, getStorageItem, setStorageItem } from '../../shared/utils/storage';

interface ZeroFormState {
  horizontalOffsetDistance: string;
  horizontalOffsetDirection: 'left' | 'right';
  verticalOffsetDistance: string;
  verticalOffsetDirection: 'up' | 'down';
  zeroDistance: string;
  adjustmentIncrement: string;
}

interface ZeroCalculatorResult {
  horizontalClicks: number;
  horizontalDirection: string;
  verticalClicks: number;
  verticalDirection: string;
}

const ZeroCalculator: React.FC = () => {
  const { t } = useTranslation();
  const { units } = useAppContext();

  // Load saved defaults
  const defaultZeroDistance = getStorageItem<number>(StorageKeys.ZERO_DISTANCE_DEFAULT, 100) || 100;
  const defaultIncrement =
    getStorageItem<string>(StorageKeys.ADJUSTMENT_INCREMENT_DEFAULT, '0.25') || '0.25';

  // Form state
  const [formData, setFormData] = useState<ZeroFormState>(() => {
    const saved = getStorageItem<ZeroFormState>(StorageKeys.ZERO_CALC_FORM);
    return saved || {
      horizontalOffsetDistance: '',
      horizontalOffsetDirection: 'left',
      verticalOffsetDistance: '',
      verticalOffsetDirection: 'up',
      zeroDistance: String(defaultZeroDistance),
      adjustmentIncrement: defaultIncrement,
    };
  });

  // Modal states
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [result, setResult] = useState<ZeroCalculatorResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync zero distance with storage when settings change
  useEffect(() => {
    const updatedDefault = getStorageItem<number>(StorageKeys.ZERO_DISTANCE_DEFAULT);
    if (updatedDefault !== null && updatedDefault !== undefined) {
      setFormData((prev) => ({
        ...prev,
        zeroDistance: String(updatedDefault),
      }));
    }
  }, [units]); // Re-sync when units change (default may have been converted)

  const isMetric = units === 'metric';
  const distanceUnit = isMetric ? t('units.meters') : t('units.yards');
  const sizeUnit = isMetric ? t('units.centimeters') : t('units.inches');

  // Dynamic min/max/step for zero distance based on units
  const zeroDistanceMin = isMetric ? 23 : 25; // ~25 yards = 23 meters
  const zeroDistanceMax = isMetric ? 457 : 500; // ~500 yards = 457 meters
  const zeroDistanceStep = isMetric ? 1 : 25;

  const handleInputChange = (field: keyof ZeroFormState, value: string | number) => {
    const newFormData = {
      ...formData,
      [field]: String(value),
    };
    setFormData(newFormData);
    setStorageItem(StorageKeys.ZERO_CALC_FORM, newFormData);
  };

  const validateForm = (): boolean => {
    const hoDistance = formData.horizontalOffsetDistance.trim();
    const voDistance = formData.verticalOffsetDistance.trim();

    // At least one offset must be provided
    if (!hoDistance && !voDistance) {
      setErrorMessage(t('zeroCalculator.invalidInput'));
      return false;
    }

    return true;
  };

  const calculateResults = (): void => {
    if (!validateForm()) {
      setErrorModalOpen(true);
      return;
    }

    try {
      const zeroDistance = parseInt(formData.zeroDistance, 10);
      const moaPerClick = parseFloat(formData.adjustmentIncrement);

      // Calculate click value in inches
      const clickValueInches = calculateClickValueInches(zeroDistance, moaPerClick);

      let horizontalClicks = 0;
      let verticalClicks = 0;

      // Calculate horizontal clicks
      if (formData.horizontalOffsetDistance) {
        let offsetInches = parseFloat(formData.horizontalOffsetDistance);

        // Convert from metric if needed
        if (isMetric) {
          offsetInches = centimetersToInches(offsetInches);
        }

        horizontalClicks = calculateZeroClicks(offsetInches, clickValueInches);
      }

      // Calculate vertical clicks
      if (formData.verticalOffsetDistance) {
        let offsetInches = parseFloat(formData.verticalOffsetDistance);

        // Convert from metric if needed
        if (isMetric) {
          offsetInches = centimetersToInches(offsetInches);
        }

        verticalClicks = calculateZeroClicks(offsetInches, clickValueInches);
      }

      setResult({
        horizontalClicks: Math.round(horizontalClicks * 100) / 100,
        horizontalDirection:
          formData.horizontalOffsetDirection === 'left' ? t('zeroCalculator.right') : t('zeroCalculator.left'),
        verticalClicks: Math.round(verticalClicks * 100) / 100,
        verticalDirection:
          formData.verticalOffsetDirection === 'up' ? t('zeroCalculator.down') : t('zeroCalculator.up'),
      });

      setResultModalOpen(true);
    } catch (error) {
      setErrorMessage(t('errors.genericError'));
      setErrorModalOpen(true);
    }
  };

  const handleReset = (): void => {
    const resetData: ZeroFormState = {
      horizontalOffsetDistance: '',
      horizontalOffsetDirection: 'left',
      verticalOffsetDistance: '',
      verticalOffsetDirection: 'up',
      zeroDistance: String(defaultZeroDistance),
      adjustmentIncrement: defaultIncrement,
    };
    setFormData(resetData);
    setStorageItem(StorageKeys.ZERO_CALC_FORM, resetData);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('zeroCalculator.title')}
      </Typography>

      <Stack spacing={3} sx={{ pb: 14 }}>
        {/* Point of Impact Header */}
        <Typography variant="h6" sx={{ mt: 0 }}>{t('zeroCalculator.pointOfImpact')}</Typography>

        {/* Horizontal Offset - Input and Direction Side-by-Side */}
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box sx={{ flex: '0 0 calc(66.667% - 8px)' }}>
            <NumericInput
              label={`${t('zeroCalculator.horizontalOffset')} (${sizeUnit})`}
              value={formData.horizontalOffsetDistance}
              onChange={(value) => handleInputChange('horizontalOffsetDistance', value)}
              placeholder="00.00"
              fullWidth
              maxDecimals={2}
              allowNegative={false}
            />
          </Box>
          <Box sx={{ flex: '0 0 calc(33.333% - 8px)' }}>
            <FormControl fullWidth>
              <InputLabel>{t('zeroCalculator.direction')}</InputLabel>
              <Select
                value={formData.horizontalOffsetDirection}
                label={t('zeroCalculator.direction')}
                onChange={(e) =>
                  handleInputChange('horizontalOffsetDirection', e.target.value)
                }
              >
                <MenuItem value="left">{t('zeroCalculator.left')}</MenuItem>
                <MenuItem value="right">{t('zeroCalculator.right')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>

        {/* Vertical Offset - Input and Direction Side-by-Side */}
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box sx={{ flex: '0 0 calc(66.667% - 8px)' }}>
            <NumericInput
              label={`${t('zeroCalculator.verticalOffset')} (${sizeUnit})`}
              value={formData.verticalOffsetDistance}
              onChange={(value) => handleInputChange('verticalOffsetDistance', value)}
              placeholder="00.00"
              fullWidth
              maxDecimals={2}
              allowNegative={false}
            />
          </Box>
          <Box sx={{ flex: '0 0 calc(33.333% - 8px)' }}>
            <FormControl fullWidth>
              <InputLabel>{t('zeroCalculator.direction')}</InputLabel>
              <Select
                value={formData.verticalOffsetDirection}
                label={t('zeroCalculator.direction')}
                onChange={(e) =>
                  handleInputChange('verticalOffsetDirection', e.target.value)
                }
              >
                <MenuItem value="up">{t('zeroCalculator.up')}</MenuItem>
                <MenuItem value="down">{t('zeroCalculator.down')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>

        {/* General Section */}
        <Typography variant="h6" sx={{ mt: 1 }}>{t('zeroCalculator.zeroDistance')}</Typography>

        <TextField
          label={`${t('zeroCalculator.zeroRange')} (${distanceUnit})`}
          type="number"
          value={formData.zeroDistance}
          onChange={(e) => handleInputChange('zeroDistance', e.target.value)}
          inputProps={{
            min: zeroDistanceMin,
            max: zeroDistanceMax,
            step: zeroDistanceStep,
          }}
          fullWidth
        />

        {/* Adjustment Increment Section */}
        <FormControl fullWidth>
          <InputLabel>{t('zeroCalculator.adjustmentIncrement')}</InputLabel>
          <Select
            value={formData.adjustmentIncrement}
            label={t('zeroCalculator.adjustmentIncrement')}
            onChange={(e) => handleInputChange('adjustmentIncrement', e.target.value)}
          >
            <MenuItem value="1">1 {t('settings.moaClick')}</MenuItem>
            <MenuItem value="0.5">0.5 {t('settings.moaClick')}</MenuItem>
            <MenuItem value="0.25">0.25 {t('settings.moaClick')}</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Fixed Buttons at Bottom */}
      <FixedButtonFooter>
        <Button variant="outlined" onClick={handleReset} sx={{ flex: 1 }}>
          {t('common.reset')}
        </Button>

        <Button variant="contained" onClick={calculateResults} sx={{ flex: 1 }}>
          {t('common.sendIt')}
        </Button>
      </FixedButtonFooter>

      {/* Result Modal */}
      <Modal
        open={resultModalOpen}
        title={t('zeroCalculator.results')}
        onClose={() => setResultModalOpen(false)}
        variant="success"
        isAlert
      >
        {result && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            {result.horizontalClicks !== 0 && (
              <Typography>
                <strong>
                  {Math.abs(result.horizontalClicks)} {t('zeroCalculator.clicks')}{' '}
                  {result.horizontalDirection}
                </strong>
              </Typography>
            )}
            {result.verticalClicks !== 0 && (
              <Typography>
                <strong>
                  {Math.abs(result.verticalClicks)} {t('zeroCalculator.clicks')}{' '}
                  {result.verticalDirection}
                </strong>
              </Typography>
            )}
          </Stack>
        )}
      </Modal>

      {/* Error Modal */}
      <Modal
        open={errorModalOpen}
        title={t('common.error')}
        onClose={() => setErrorModalOpen(false)}
        variant="error"
        isAlert
      >
        {errorMessage}
      </Modal>
    </Box>
  );
};

export default ZeroCalculator;
