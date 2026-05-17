import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { useAppContext } from '../../shared/context/AppContext';
import Modal from '../../shared/components/Modal';
import FixedButtonFooter from '../../shared/components/FixedButtonFooter';
import NumericInput from '../../shared/components/NumericInput';
import {
  calculateMilDotDistance_Imperial,
  calculateMilDotSize_Imperial,
  calculateMilDotMils_Imperial,
  calculateMilDotDistance_Metric,
  calculateMilDotSize_Metric,
  calculateMilDotMils_Metric,
} from '../../shared/utils/calculations';
import { StorageKeys, getStorageItem, setStorageItem } from '../../shared/utils/storage';

interface MilDotFormState {
  milSize: string;
  physicalSize: string;
  distance: string;
}

interface MilDotCalculatorResult {
  calculated: string;
  value: number;
  label: string;
}

const MilDotCalculator: React.FC = () => {
  const { t } = useTranslation();
  const { units } = useAppContext();

  // Load saved defaults
  const defaultMilSize = getStorageItem<number>(StorageKeys.MILDOT_SIZE_DEFAULT, 0) || 0;
  const defaultPhysicalSize =
    getStorageItem<number>(StorageKeys.MILDOT_PHYSICAL_SIZE_DEFAULT, 0) || 0;
  const defaultDistance = getStorageItem<number>(StorageKeys.MILDOT_DISTANCE_DEFAULT, 0) || 0;

  // Form state
  const [formData, setFormData] = useState<MilDotFormState>(() => {
    const saved = getStorageItem<MilDotFormState>(StorageKeys.MILDOT_CALC_FORM);
    return (
      saved || {
        milSize: String(defaultMilSize),
        physicalSize: String(defaultPhysicalSize),
        distance: String(defaultDistance),
      }
    );
  });

  // Modal states
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [result, setResult] = useState<MilDotCalculatorResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isMetric = units === 'metric';
  const distanceUnit = isMetric ? t('units.meters') : t('units.yards');
  const sizeUnit = isMetric ? t('units.centimeters') : t('units.inches');

  // Count how many fields are filled (by numeric value, not string)
  const filledFields = useMemo(() => {
    const filled = [];
    const milNum = formData.milSize ? parseFloat(formData.milSize) : 0;
    const sizeNum = formData.physicalSize ? parseFloat(formData.physicalSize) : 0;
    const distNum = formData.distance ? parseFloat(formData.distance) : 0;

    if (milNum !== 0) filled.push('mil');
    if (sizeNum !== 0) filled.push('size');
    if (distNum !== 0) filled.push('distance');
    return filled;
  }, [formData]);

  const isValid = filledFields.length >= 2;

  const handleInputChange = (field: keyof MilDotFormState, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };
    setFormData(newFormData);
    setStorageItem(StorageKeys.MILDOT_CALC_FORM, newFormData);
  };

  const calculateResults = (): void => {
    if (!isValid) {
      setErrorMessage(t('mildotCalculator.invalidInput'));
      setErrorModalOpen(true);
      return;
    }

    try {
      const mil = formData.milSize ? parseFloat(formData.milSize) : 0;
      const size = formData.physicalSize ? parseFloat(formData.physicalSize) : 0;
      const distance = formData.distance ? parseFloat(formData.distance) : 0;

      let calculated: string = '';
      let value: number = 0;
      let label: string = '';

      // Case 1: Mil + Size → Distance
      if (
        filledFields.includes('mil') &&
        filledFields.includes('size') &&
        !filledFields.includes('distance')
      ) {
        if (isMetric) {
          value = calculateMilDotDistance_Metric(size, mil);
        } else {
          value = calculateMilDotDistance_Imperial(size, mil);
        }
        calculated = 'distance';
        label = `${value.toFixed(2)} ${distanceUnit}`;
      }
      // Case 2: Size + Distance → Mil
      else if (
        filledFields.includes('size') &&
        filledFields.includes('distance') &&
        !filledFields.includes('mil')
      ) {
        if (isMetric) {
          value = calculateMilDotMils_Metric(size, distance);
        } else {
          value = calculateMilDotMils_Imperial(size, distance);
        }
        calculated = 'mil';
        label = `${value.toFixed(2)} ${t('units.mils')}`;
      }
      // Case 3: Mil + Distance → Size
      else if (
        filledFields.includes('mil') &&
        filledFields.includes('distance') &&
        !filledFields.includes('size')
      ) {
        if (isMetric) {
          value = calculateMilDotSize_Metric(distance, mil);
        } else {
          value = calculateMilDotSize_Imperial(distance, mil);
        }
        calculated = 'size';
        label = `${value.toFixed(2)} ${sizeUnit}`;
      }

      setResult({
        calculated,
        value,
        label,
      });

      setResultModalOpen(true);
    } catch (error) {
      setErrorMessage(t('errors.genericError'));
      setErrorModalOpen(true);
    }
  };

  const handleReset = (): void => {
    const resetData: MilDotFormState = {
      milSize: String(defaultMilSize),
      physicalSize: String(defaultPhysicalSize),
      distance: String(defaultDistance),
    };
    setFormData(resetData);
    setStorageItem(StorageKeys.MILDOT_CALC_FORM, resetData);
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3, width: '100%' }}
      >
        <Typography variant="h4">{t('mildotCalculator.title')}</Typography>
        <IconButton
          aria-label={t('mildotCalculator.helpOpenAria')}
          color="inherit"
          onClick={() => setHelpModalOpen(true)}
          size="large"
        >
          <HelpOutlineIcon />
        </IconButton>
      </Stack>

      <Stack spacing={3} sx={{ pb: 14 }}>
        <Typography variant="body2" color="textSecondary">
          {t('mildotCalculator.description')}
        </Typography>

        {/* Mil Size */}
        <NumericInput
          label={t('mildotCalculator.milSize')}
          value={formData.milSize}
          onChange={(value) => handleInputChange('milSize', value)}
          placeholder="00.00"
          fullWidth
          maxDecimals={2}
          allowNegative={false}
        />

        {/* Physical Size */}
        <NumericInput
          label={`${t('mildotCalculator.physicalSize')} (${sizeUnit})`}
          value={formData.physicalSize}
          onChange={(value) => handleInputChange('physicalSize', value)}
          placeholder="00.00"
          fullWidth
          maxDecimals={2}
          allowNegative={false}
        />

        {/* Distance */}
        <NumericInput
          label={`${t('mildotCalculator.distance')} (${distanceUnit})`}
          value={formData.distance}
          onChange={(value) => handleInputChange('distance', value)}
          placeholder="00.00"
          fullWidth
          maxDecimals={2}
          allowNegative={false}
        />

        <Typography variant="caption" color="textSecondary">
          {t('mildotCalculator.invalidInput')}
        </Typography>

        {/* Buttons */}
        <FixedButtonFooter>
          <Button variant="outlined" onClick={handleReset} sx={{ flex: 1 }}>
            {t('common.reset')}
          </Button>

          <Button
            variant="contained"
            onClick={calculateResults}
            disabled={!isValid}
            sx={{ flex: 1 }}
          >
            {t('common.sendIt')}
          </Button>
        </FixedButtonFooter>
      </Stack>

      {/* Help Modal */}
      <Modal open={helpModalOpen} title={t('common.help')} onClose={() => setHelpModalOpen(false)}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2">{t('mildotCalculator.helpIntro')}</Typography>
          <Typography variant="body2">{t('mildotCalculator.helpTerms')}</Typography>
          <Typography variant="body2">{t('mildotCalculator.helpExample')}</Typography>
        </Stack>
      </Modal>

      {/* Result Modal */}
      <Modal
        open={resultModalOpen}
        title={t('mildotCalculator.results')}
        onClose={() => setResultModalOpen(false)}
      >
        {result && (
          <Stack spacing={1} sx={{ mt: 2 }}>
            <Typography>
              <strong>{t('mildotCalculator.calculated')}:</strong>
            </Typography>
            <Typography variant="h6">{result.label}</Typography>
          </Stack>
        )}
      </Modal>

      {/* Error Modal */}
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

export default MilDotCalculator;
