import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAppContext } from '../../shared/context/AppContext';
import { StorageKeys, getStorageItem, setStorageItem } from '../../shared/utils/storage';
import { yardsToMeters, metersToYards } from '../../shared/utils/calculations';

const SettingsSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}> = ({ title, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={title}
        onClick={() => setExpanded(!expanded)}
        sx={{
          cursor: 'pointer',
          backgroundColor: 'action.hover',
          '&:hover': { backgroundColor: 'action.selected' },
        }}
        avatar={
          <ExpandMoreIcon
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          />
        }
      />
      <Collapse in={expanded}>
        <CardContent>{children}</CardContent>
      </Collapse>
    </Card>
  );
};

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme, fontSize, setFontSize, units, setUnits, language, setLanguage, navBurger, setNavBurger } = useAppContext();

  // Zero Calculator settings - initialize with 100 yards, convert to meters if metric
  const [zeroDistance, setZeroDistance] = React.useState<number>(100);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const prevUnitsRef = React.useRef<'merican' | 'metric'>('merican');

  // Load saved value or set default on mount only
  React.useEffect(() => {
    const savedValue = getStorageItem<number>(StorageKeys.ZERO_DISTANCE_DEFAULT);
    if (savedValue !== null && savedValue !== undefined) {
      setZeroDistance(savedValue);
    } else {
      // Default: 100 yards in imperial, ~91.44 meters in metric
      const defaultValue = units === 'merican' ? 100 : Math.round(yardsToMeters(100) * 100) / 100;
      setZeroDistance(defaultValue);
      setStorageItem(StorageKeys.ZERO_DISTANCE_DEFAULT, defaultValue);
    }
    prevUnitsRef.current = units;
    setIsInitialized(true);
  }, []); // Run only once on mount

  // Handle unit changes - convert existing value to new units
  React.useEffect(() => {
    if (!isInitialized) return; // Skip until initialization is complete
    if (prevUnitsRef.current === units) return; // Skip if units haven't actually changed

    const currentValue = getStorageItem<number>(StorageKeys.ZERO_DISTANCE_DEFAULT) || zeroDistance;
    if (currentValue && currentValue > 0) {
      const convertedValue =
        units === 'metric'
          ? Math.round(yardsToMeters(currentValue) * 100) / 100
          : Math.round(metersToYards(currentValue) * 100) / 100;
      setZeroDistance(convertedValue);
      setStorageItem(StorageKeys.ZERO_DISTANCE_DEFAULT, convertedValue);
    }
    prevUnitsRef.current = units;
  }, [units, isInitialized]); // Re-run when units actually change

  const [adjustmentIncrement, setAdjustmentIncrementState] = React.useState<string>(() => {
    return getStorageItem<string>(StorageKeys.ADJUSTMENT_INCREMENT_DEFAULT, '0.25') || '0.25';
  });

  // MilDot Calculator settings
  const [milSizeDefault, setMilSizeDefault] = React.useState<number>(() => {
    return getStorageItem<number>(StorageKeys.MILDOT_SIZE_DEFAULT, 0) || 0;
  });

  const [physicalSizeDefault, setPhysicalSizeDefault] = React.useState<number>(() => {
    return getStorageItem<number>(StorageKeys.MILDOT_PHYSICAL_SIZE_DEFAULT, 0) || 0;
  });

  const [distanceDefault, setDistanceDefault] = React.useState<number>(() => {
    return getStorageItem<number>(StorageKeys.MILDOT_DISTANCE_DEFAULT, 0) || 0;
  });

  const handleZeroDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setZeroDistance(value);
      setStorageItem(StorageKeys.ZERO_DISTANCE_DEFAULT, value);
    }
  };

  const handleAdjustmentIncrementChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as string;
    setAdjustmentIncrementState(value);
    setStorageItem(StorageKeys.ADJUSTMENT_INCREMENT_DEFAULT, value);
  };

  const handleMilSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setMilSizeDefault(value);
      setStorageItem(StorageKeys.MILDOT_SIZE_DEFAULT, value);
    }
  };

  const handlePhysicalSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setPhysicalSizeDefault(value);
      setStorageItem(StorageKeys.MILDOT_PHYSICAL_SIZE_DEFAULT, value);
    }
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setDistanceDefault(value);
      setStorageItem(StorageKeys.MILDOT_DISTANCE_DEFAULT, value);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('settings.title')}
      </Typography>

      {/* App Settings */}
      <SettingsSection title={t('settings.appSettings')}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>{t('settings.theme')}</InputLabel>
            <Select
              value={theme}
              label={t('settings.theme')}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
            >
              <MenuItem value="light">{t('settings.light')}</MenuItem>
              <MenuItem value="dark">{t('settings.dark')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('settings.fontSize')}</InputLabel>
            <Select
              value={fontSize}
              label={t('settings.fontSize')}
              onChange={(e) =>
                setFontSize(
                  e.target.value as
                    | 'microscopic'
                    | 'diminutive'
                    | 'normie'
                    | 'embiggened'
                    | 'thiccc'
                )
              }
            >
              <MenuItem value="microscopic">{t('settings.microscopic')}</MenuItem>
              <MenuItem value="diminutive">{t('settings.diminutive')}</MenuItem>
              <MenuItem value="normie">{t('settings.normie')}</MenuItem>
              <MenuItem value="embiggened">{t('settings.embiggened')}</MenuItem>
              <MenuItem value="thiccc">{t('settings.thiccc')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('settings.language')}</InputLabel>
            <Select
              value={language}
              label={t('settings.language')}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="de">Deutsch</MenuItem>
              <MenuItem value="pl">Polski</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('settings.units')}</InputLabel>
            <Select
              value={units}
              label={t('settings.units')}
              onChange={(e) => setUnits(e.target.value as 'merican' | 'metric')}
            >
              <MenuItem value="merican">{t('settings.merican')}</MenuItem>
              <MenuItem value="metric">{t('settings.notMerican')}</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={navBurger}
                onChange={(e) => setNavBurger(e.target.checked)}
              />
            }
            label={t('settings.navBurger')}
          />
        </Stack>
      </SettingsSection>

      {/* Zero Calculator Settings */}
      <SettingsSection title={t('settings.zeroCalculatorSettings')} defaultExpanded={false}>
        <Stack spacing={2}>
          <TextField
            label={t('settings.defaultZeroDistance')}
            type="number"
            value={zeroDistance}
            onChange={handleZeroDistanceChange}
            inputProps={{
              min: units === 'metric' ? 23 : 25,
              max: units === 'metric' ? 457 : 500,
              step: units === 'metric' ? 1 : 25,
            }}
            fullWidth
            helperText={`Min: ${units === 'metric' ? 23 : 25}, Max: ${units === 'metric' ? 457 : 500}, ${units === 'metric' ? t('units.meters') : t('units.yards')}`}
          />

          <FormControl fullWidth>
            <InputLabel>{t('settings.defaultAdjustmentIncrement')}</InputLabel>
            <Select
              value={adjustmentIncrement}
              label={t('settings.defaultAdjustmentIncrement')}
              onChange={handleAdjustmentIncrementChange as any}
            >
              <MenuItem value="1">1 {t('settings.moaClick')}</MenuItem>
              <MenuItem value="0.5">0.5 {t('settings.moaClick')}</MenuItem>
              <MenuItem value="0.25">0.25 {t('settings.moaClick')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </SettingsSection>

      {/* MilDot Calculator Settings */}
      <SettingsSection title={t('settings.mildotCalculatorSettings')} defaultExpanded={false}>
        <Stack spacing={2}>
          <TextField
            label={t('settings.defaultMilSize')}
            type="number"
            inputProps={{ step: '0.01' }}
            value={milSizeDefault}
            onChange={handleMilSizeChange}
            fullWidth
          />

          <TextField
            label={t('settings.defaultPhysicalSize')}
            type="number"
            inputProps={{ step: '0.01' }}
            value={physicalSizeDefault}
            onChange={handlePhysicalSizeChange}
            fullWidth
          />

          <TextField
            label={t('settings.defaultDistance')}
            type="number"
            inputProps={{ step: '0.01' }}
            value={distanceDefault}
            onChange={handleDistanceChange}
            fullWidth
          />
        </Stack>
      </SettingsSection>
    </Box>
  );
};

export default Settings;
