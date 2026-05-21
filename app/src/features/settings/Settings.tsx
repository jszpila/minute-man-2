import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAppContext } from '../../shared/context/AppContext';
import { StorageKeys, getStorageItem, setStorageItem } from '../../shared/utils/storage';
import {
  yardsToMeters,
  metersToYards,
  ZERO_ADJUSTMENT_INCREMENTS,
  DEFAULT_ZERO_ADJUSTMENT_TYPE,
  DEFAULT_ZERO_ADJUSTMENT_INCREMENT,
  ZERO_DISTANCE_LIMITS,
  HOLDOVER_DISTANCE_LIMITS,
  HOLDOVER_HEIGHT_LIMITS,
  DEFAULT_HOLDOVER_OUTPUT_UNIT,
  DEFAULT_HOLDOVER_PROFILE,
  getHoldoverProfileHeight,
  DEFAULT_MPBR_PROFILE,
  getMpbrProfileHeight,
  getMpbrProfileVitalZone,
  MPBR_HEIGHT_LIMITS,
  MPBR_VITAL_ZONE_LIMITS,
  inchesToCentimeters,
  centimetersToInches,
} from '../../shared/utils/calculations';
import type {
  HoldoverFirearmProfile,
  HoldoverOutputUnit,
  MpbrProfile,
  ZeroAdjustmentType,
} from '../../shared/utils/calculations';
import {
  requestMicrophoneAccess,
  createAudioAnalyser,
  stopListening,
  getRMSLevel,
  DEFAULT_SHOT_TIMER_SENSITIVITY,
  getShotDetectionThreshold,
} from '../../shared/utils/audioDetectionUtils';

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

const requestLocationPermission = async (): Promise<boolean> => {
  if (!navigator.geolocation) {
    return false;
  }

  if (navigator.permissions?.query) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'granted') {
        return true;
      }
      if (permission.state === 'denied') {
        return false;
      }
    } catch {
      // Fall through to getCurrentPosition for browsers with partial Permissions API support.
    }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      {
        enableHighAccuracy: false,
        maximumAge: 15 * 60 * 1000,
        timeout: 8000,
      }
    );
  });
};

const isZeroAdjustmentType = (value: unknown): value is ZeroAdjustmentType =>
  value === 'moa' || value === 'mrad';

const isHoldoverProfile = (value: unknown): value is HoldoverFirearmProfile =>
  value === 'arCarbine' ||
  value === 'traditionalRifle' ||
  value === 'pistol' ||
  value === 'rimfire' ||
  value === 'custom';

const isHoldoverOutputUnit = (value: unknown): value is HoldoverOutputUnit =>
  value === 'physical' || value === 'moa' || value === 'mrad';

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

const getDefaultIncrementForType = (adjustmentType: ZeroAdjustmentType) =>
  adjustmentType === DEFAULT_ZERO_ADJUSTMENT_TYPE ? DEFAULT_ZERO_ADJUSTMENT_INCREMENT : '0.1';

const normalizeAdjustmentIncrement = (
  adjustmentType: ZeroAdjustmentType,
  adjustmentIncrement: string | null
) => {
  const options = ZERO_ADJUSTMENT_INCREMENTS[adjustmentType];
  return adjustmentIncrement && options.includes(adjustmentIncrement)
    ? adjustmentIncrement
    : getDefaultIncrementForType(adjustmentType);
};

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    units,
    setUnits,
    language,
    setLanguage,
    navBurger,
    setNavBurger,
    showWeatherInAppBar,
    setShowWeatherInAppBar,
  } = useAppContext();

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
    const savedAdjustmentType = getStorageItem<ZeroAdjustmentType>(
      StorageKeys.ADJUSTMENT_TYPE_DEFAULT,
      DEFAULT_ZERO_ADJUSTMENT_TYPE
    );
    const adjustmentType = isZeroAdjustmentType(savedAdjustmentType)
      ? savedAdjustmentType
      : DEFAULT_ZERO_ADJUSTMENT_TYPE;
    const savedIncrement = getStorageItem<string>(
      StorageKeys.ADJUSTMENT_INCREMENT_DEFAULT,
      getDefaultIncrementForType(adjustmentType)
    );
    return normalizeAdjustmentIncrement(adjustmentType, savedIncrement);
  });
  const [adjustmentType, setAdjustmentType] = React.useState<ZeroAdjustmentType>(() => {
    const saved = getStorageItem<ZeroAdjustmentType>(
      StorageKeys.ADJUSTMENT_TYPE_DEFAULT,
      DEFAULT_ZERO_ADJUSTMENT_TYPE
    );
    return isZeroAdjustmentType(saved) ? saved : DEFAULT_ZERO_ADJUSTMENT_TYPE;
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

  const handleAdjustmentTypeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as ZeroAdjustmentType;
    const nextIncrement = getDefaultIncrementForType(value);
    setAdjustmentType(value);
    setAdjustmentIncrementState(nextIncrement);
    setStorageItem(StorageKeys.ADJUSTMENT_TYPE_DEFAULT, value);
    setStorageItem(StorageKeys.ADJUSTMENT_INCREMENT_DEFAULT, nextIncrement);
  };

  const [holdoverZeroDistance, setHoldoverZeroDistance] = React.useState<number>(() => {
    return getStorageItem<number>(StorageKeys.HOLDOVER_ZERO_DISTANCE_DEFAULT, 50) || 50;
  });

  const [holdoverProfile, setHoldoverProfile] = React.useState<HoldoverFirearmProfile>(() => {
    const saved = getStorageItem<HoldoverFirearmProfile>(
      StorageKeys.HOLDOVER_PROFILE_DEFAULT,
      DEFAULT_HOLDOVER_PROFILE
    );
    return isHoldoverProfile(saved) ? saved : DEFAULT_HOLDOVER_PROFILE;
  });

  const [holdoverHeightOverBore, setHoldoverHeightOverBore] = React.useState<number>(() => {
    const savedProfile = getStorageItem<HoldoverFirearmProfile>(
      StorageKeys.HOLDOVER_PROFILE_DEFAULT,
      DEFAULT_HOLDOVER_PROFILE
    );
    const profile = isHoldoverProfile(savedProfile) ? savedProfile : DEFAULT_HOLDOVER_PROFILE;
    return (
      getStorageItem<number>(
        StorageKeys.HOLDOVER_HEIGHT_OVER_BORE_DEFAULT,
        getHoldoverProfileHeight(profile, units)
      ) || getHoldoverProfileHeight(profile, units)
    );
  });

  const [holdoverOutputUnit, setHoldoverOutputUnit] = React.useState<HoldoverOutputUnit>(() => {
    const saved = getStorageItem<HoldoverOutputUnit>(StorageKeys.HOLDOVER_OUTPUT_UNIT_DEFAULT);
    if (isHoldoverOutputUnit(saved)) return saved;
    return DEFAULT_HOLDOVER_OUTPUT_UNIT;
  });

  const holdoverPrevUnitsRef = React.useRef<'merican' | 'metric'>(units);

  React.useEffect(() => {
    if (holdoverPrevUnitsRef.current === units) return;

    const convertedZeroDistance =
      units === 'metric'
        ? Math.round(yardsToMeters(holdoverZeroDistance) * 100) / 100
        : Math.round(metersToYards(holdoverZeroDistance) * 100) / 100;
    const convertedHeight =
      units === 'metric'
        ? Math.round(inchesToCentimeters(holdoverHeightOverBore) * 100) / 100
        : Math.round(centimetersToInches(holdoverHeightOverBore) * 100) / 100;
    setHoldoverZeroDistance(convertedZeroDistance);
    setHoldoverHeightOverBore(convertedHeight);
    setStorageItem(StorageKeys.HOLDOVER_ZERO_DISTANCE_DEFAULT, convertedZeroDistance);
    setStorageItem(StorageKeys.HOLDOVER_HEIGHT_OVER_BORE_DEFAULT, convertedHeight);
    holdoverPrevUnitsRef.current = units;
  }, [units, holdoverHeightOverBore, holdoverZeroDistance]);

  const handleHoldoverZeroDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setHoldoverZeroDistance(value);
      setStorageItem(StorageKeys.HOLDOVER_ZERO_DISTANCE_DEFAULT, value);
    }
  };

  const handleHoldoverProfileChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as HoldoverFirearmProfile;
    const nextHeight = getHoldoverProfileHeight(value, units);
    setHoldoverProfile(value);
    setHoldoverHeightOverBore(nextHeight);
    setStorageItem(StorageKeys.HOLDOVER_PROFILE_DEFAULT, value);
    setStorageItem(StorageKeys.HOLDOVER_HEIGHT_OVER_BORE_DEFAULT, nextHeight);
  };

  const handleHoldoverHeightOverBoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setHoldoverHeightOverBore(value);
      setStorageItem(StorageKeys.HOLDOVER_HEIGHT_OVER_BORE_DEFAULT, value);
    }
  };

  const handleHoldoverOutputUnitChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as HoldoverOutputUnit;
    setHoldoverOutputUnit(value);
    setStorageItem(StorageKeys.HOLDOVER_OUTPUT_UNIT_DEFAULT, value);
  };

  const [mpbrProfile, setMpbrProfile] = React.useState<MpbrProfile>(() => {
    const saved = getStorageItem<MpbrProfile>(
      StorageKeys.MPBR_PROFILE_DEFAULT,
      DEFAULT_MPBR_PROFILE
    );
    return isMpbrProfile(saved) ? saved : DEFAULT_MPBR_PROFILE;
  });

  const [mpbrVitalZone, setMpbrVitalZone] = React.useState<number>(() => {
    const savedProfile = getStorageItem<MpbrProfile>(
      StorageKeys.MPBR_PROFILE_DEFAULT,
      DEFAULT_MPBR_PROFILE
    );
    const profile = isMpbrProfile(savedProfile) ? savedProfile : DEFAULT_MPBR_PROFILE;
    return (
      getStorageItem<number>(
        StorageKeys.MPBR_VITAL_ZONE_DEFAULT,
        getMpbrProfileVitalZone(profile, units)
      ) || getMpbrProfileVitalZone(profile, units)
    );
  });

  const [mpbrHeightOverBore, setMpbrHeightOverBore] = React.useState<number>(() => {
    const savedProfile = getStorageItem<MpbrProfile>(
      StorageKeys.MPBR_PROFILE_DEFAULT,
      DEFAULT_MPBR_PROFILE
    );
    const profile = isMpbrProfile(savedProfile) ? savedProfile : DEFAULT_MPBR_PROFILE;
    return (
      getStorageItem<number>(
        StorageKeys.MPBR_HEIGHT_OVER_BORE_DEFAULT,
        getMpbrProfileHeight(profile, units)
      ) || getMpbrProfileHeight(profile, units)
    );
  });

  const mpbrPrevUnitsRef = React.useRef<'merican' | 'metric'>(units);

  React.useEffect(() => {
    if (mpbrPrevUnitsRef.current === units) return;

    const convertedVitalZone =
      units === 'metric'
        ? Math.round(inchesToCentimeters(mpbrVitalZone) * 10) / 10
        : Math.round(centimetersToInches(mpbrVitalZone) * 10) / 10;
    const convertedHeight =
      units === 'metric'
        ? Math.round(inchesToCentimeters(mpbrHeightOverBore) * 100) / 100
        : Math.round(centimetersToInches(mpbrHeightOverBore) * 100) / 100;
    setMpbrVitalZone(convertedVitalZone);
    setMpbrHeightOverBore(convertedHeight);
    setStorageItem(StorageKeys.MPBR_VITAL_ZONE_DEFAULT, convertedVitalZone);
    setStorageItem(StorageKeys.MPBR_HEIGHT_OVER_BORE_DEFAULT, convertedHeight);
    mpbrPrevUnitsRef.current = units;
  }, [units, mpbrHeightOverBore, mpbrVitalZone]);

  const handleMpbrProfileChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as MpbrProfile;
    const nextVitalZone = getMpbrProfileVitalZone(value, units);
    const nextHeight = getMpbrProfileHeight(value, units);
    setMpbrProfile(value);
    setMpbrVitalZone(nextVitalZone);
    setMpbrHeightOverBore(nextHeight);
    setStorageItem(StorageKeys.MPBR_PROFILE_DEFAULT, value);
    setStorageItem(StorageKeys.MPBR_VITAL_ZONE_DEFAULT, nextVitalZone);
    setStorageItem(StorageKeys.MPBR_HEIGHT_OVER_BORE_DEFAULT, nextHeight);
  };

  const handleMpbrVitalZoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setMpbrVitalZone(value);
      setStorageItem(StorageKeys.MPBR_VITAL_ZONE_DEFAULT, value);
    }
  };

  const handleMpbrHeightOverBoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setMpbrHeightOverBore(value);
      setStorageItem(StorageKeys.MPBR_HEIGHT_OVER_BORE_DEFAULT, value);
    }
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

  // Shot Timer Settings
  type TimerMode = 'par' | 'split' | 'firstShot';
  type StartMode = 'instant' | 'delayed' | 'random';

  const [shotTimerDefaultStartMode, setShotTimerDefaultStartMode] = React.useState<StartMode>(
    () => {
      return (
        getStorageItem<StartMode>(StorageKeys.SHOT_TIMER_DEFAULT_START_MODE, 'instant') || 'instant'
      );
    }
  );

  const [shotTimerDefaultTimerMode, setShotTimerDefaultTimerMode] = React.useState<TimerMode>(
    () => {
      return (
        getStorageItem<TimerMode>(StorageKeys.SHOT_TIMER_DEFAULT_TIMER_MODE, 'split') || 'split'
      );
    }
  );

  const [shotTimerDefaultParTime, setShotTimerDefaultParTime] = React.useState<number>(() => {
    return getStorageItem<number>(StorageKeys.SHOT_TIMER_DEFAULT_PAR_TIME, 5000) || 5000;
  });

  const [shotTimerDefaultSensitivity, setShotTimerDefaultSensitivity] = React.useState<number>(
    () => {
      return (
        getStorageItem<number>(
          StorageKeys.SHOT_TIMER_DEFAULT_SENSITIVITY,
          DEFAULT_SHOT_TIMER_SENSITIVITY
        ) || DEFAULT_SHOT_TIMER_SENSITIVITY
      );
    }
  );

  const handleShotTimerStartModeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as StartMode;
    setShotTimerDefaultStartMode(value);
    setStorageItem(StorageKeys.SHOT_TIMER_DEFAULT_START_MODE, value);
  };

  const handleShotTimerTimerModeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as TimerMode;
    setShotTimerDefaultTimerMode(value);
    setStorageItem(StorageKeys.SHOT_TIMER_DEFAULT_TIMER_MODE, value);
  };

  const handleShotTimerParTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, parseInt(e.target.value) || 1) * 1000;
    setShotTimerDefaultParTime(value);
    setStorageItem(StorageKeys.SHOT_TIMER_DEFAULT_PAR_TIME, value);
  };

  const handleShowWeatherInAppBarChange = async (showWeather: boolean) => {
    if (!showWeather) {
      setShowWeatherInAppBar(false);
      return;
    }

    const hasLocationPermission = await requestLocationPermission();
    if (hasLocationPermission) {
      setShowWeatherInAppBar(true);
    }
  };

  // Sensitivity testing
  const [listeningForSensitivity, setListeningForSensitivity] = React.useState(false);
  const [currentRMSLevel, setCurrentRMSLevel] = React.useState(0);
  const sensitivityAudioAnalyserRef = React.useRef<any>(null);
  const sensitivityVisualizationRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const zeroDistanceLimits =
    units === 'metric' ? ZERO_DISTANCE_LIMITS.metric : ZERO_DISTANCE_LIMITS.merican;
  const holdoverHeightLimits =
    units === 'metric' ? HOLDOVER_HEIGHT_LIMITS.metric : HOLDOVER_HEIGHT_LIMITS.merican;
  const holdoverDistanceUnit = units === 'metric' ? t('units.meters') : t('units.yards');
  const holdoverHeightUnit = units === 'metric' ? t('units.centimeters') : t('units.inches');
  const mpbrVitalLimits =
    units === 'metric' ? MPBR_VITAL_ZONE_LIMITS.metric : MPBR_VITAL_ZONE_LIMITS.merican;
  const mpbrHeightLimits =
    units === 'metric' ? MPBR_HEIGHT_LIMITS.metric : MPBR_HEIGHT_LIMITS.merican;
  const mpbrHeightUnit = units === 'metric' ? t('units.centimeters') : t('units.inches');

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('settings.title')}
      </Typography>

      {/* App Settings */}
      <SettingsSection title={t('settings.appSettings')} defaultExpanded={false}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>{t('settings.theme')}</InputLabel>
            <Select
              value={theme}
              label={t('settings.theme')}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'rangerGreen')}
            >
              <MenuItem value="light">{t('settings.light')}</MenuItem>
              <MenuItem value="dark">{t('settings.dark')}</MenuItem>
              <MenuItem value="rangerGreen">{t('settings.rangerGreen')}</MenuItem>
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
              <MenuItem value="en">{t('settings.languages.english')}</MenuItem>
              <MenuItem value="es">{t('settings.languages.spanish')}</MenuItem>
              <MenuItem value="fr">{t('settings.languages.french')}</MenuItem>
              <MenuItem value="de">{t('settings.languages.german')}</MenuItem>
              <MenuItem value="pl">{t('settings.languages.polish')}</MenuItem>
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
              <Switch checked={navBurger} onChange={(e) => setNavBurger(e.target.checked)} />
            }
            label={t('settings.navBurger')}
          />

          <FormControlLabel
            control={
              <Switch
                checked={showWeatherInAppBar}
                onChange={(e) => {
                  void handleShowWeatherInAppBarChange(e.target.checked);
                }}
              />
            }
            label={t('settings.showWeatherInAppBar')}
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
              min: zeroDistanceLimits.min,
              max: zeroDistanceLimits.max,
              step: zeroDistanceLimits.step,
            }}
            fullWidth
            helperText={t('settings.minMaxHelper', {
              min: zeroDistanceLimits.min,
              max: zeroDistanceLimits.max,
              unit: units === 'metric' ? t('units.meters') : t('units.yards'),
            })}
          />

          <FormControl fullWidth>
            <InputLabel id="settings-default-adjustment-type-label">
              {t('settings.defaultAdjustmentType')}
            </InputLabel>
            <Select
              labelId="settings-default-adjustment-type-label"
              value={adjustmentType}
              label={t('settings.defaultAdjustmentType')}
              onChange={handleAdjustmentTypeChange as any}
            >
              <MenuItem value="moa">{t('settings.moa')}</MenuItem>
              <MenuItem value="mrad">{t('settings.mrad')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="settings-default-adjustment-increment-label">
              {t('settings.defaultAdjustmentIncrement')}
            </InputLabel>
            <Select
              labelId="settings-default-adjustment-increment-label"
              value={adjustmentIncrement}
              label={t('settings.defaultAdjustmentIncrement')}
              onChange={handleAdjustmentIncrementChange as any}
            >
              {ZERO_ADJUSTMENT_INCREMENTS[adjustmentType].map((increment) => (
                <MenuItem key={increment} value={increment}>
                  {increment}{' '}
                  {adjustmentType === 'moa' ? t('settings.moaClick') : t('settings.mradClick')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </SettingsSection>

      {/* Holdover Calculator Settings */}
      <SettingsSection title={t('settings.holdoverCalculatorSettings')} defaultExpanded={false}>
        <Stack spacing={2}>
          <TextField
            label={t('settings.defaultHoldoverZeroDistance')}
            type="number"
            value={holdoverZeroDistance}
            onChange={handleHoldoverZeroDistanceChange}
            inputProps={{
              min: HOLDOVER_DISTANCE_LIMITS.zero.min,
              max: HOLDOVER_DISTANCE_LIMITS.zero.max,
              step: 1,
            }}
            fullWidth
            helperText={t('settings.minMaxHelper', {
              min: HOLDOVER_DISTANCE_LIMITS.zero.min,
              max: HOLDOVER_DISTANCE_LIMITS.zero.max,
              unit: holdoverDistanceUnit,
            })}
          />

          <FormControl fullWidth>
            <InputLabel id="settings-holdover-profile-label">
              {t('settings.defaultHoldoverProfile')}
            </InputLabel>
            <Select
              labelId="settings-holdover-profile-label"
              value={holdoverProfile}
              label={t('settings.defaultHoldoverProfile')}
              onChange={handleHoldoverProfileChange as any}
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

          <TextField
            label={t('settings.defaultHoldoverHeightOverBore')}
            type="number"
            value={holdoverHeightOverBore}
            onChange={handleHoldoverHeightOverBoreChange}
            inputProps={{
              min: holdoverHeightLimits.min,
              max: holdoverHeightLimits.max,
              step: 0.01,
            }}
            fullWidth
            helperText={t('settings.minMaxHelper', {
              min: holdoverHeightLimits.min,
              max: holdoverHeightLimits.max,
              unit: holdoverHeightUnit,
            })}
          />

          <FormControl fullWidth>
            <InputLabel id="settings-holdover-output-unit-label">
              {t('settings.defaultHoldoverOutputUnit')}
            </InputLabel>
            <Select
              labelId="settings-holdover-output-unit-label"
              value={holdoverOutputUnit}
              label={t('settings.defaultHoldoverOutputUnit')}
              onChange={handleHoldoverOutputUnitChange as any}
            >
              <MenuItem value="physical">{holdoverHeightUnit}</MenuItem>
              <MenuItem value="moa">{t('settings.moa')}</MenuItem>
              <MenuItem value="mrad">{t('settings.mrad')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </SettingsSection>

      {/* MPBR Calculator Settings */}
      <SettingsSection title={t('settings.mpbrCalculatorSettings')} defaultExpanded={false}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="settings-mpbr-profile-label">
              {t('settings.defaultMpbrProfile')}
            </InputLabel>
            <Select
              labelId="settings-mpbr-profile-label"
              value={mpbrProfile}
              label={t('settings.defaultMpbrProfile')}
              onChange={handleMpbrProfileChange as any}
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

          <TextField
            label={t('settings.defaultMpbrVitalZone')}
            type="number"
            value={mpbrVitalZone}
            onChange={handleMpbrVitalZoneChange}
            inputProps={{
              min: mpbrVitalLimits.min,
              max: mpbrVitalLimits.max,
              step: 0.1,
            }}
            fullWidth
            helperText={t('settings.minMaxHelper', {
              min: mpbrVitalLimits.min,
              max: mpbrVitalLimits.max,
              unit: mpbrHeightUnit,
            })}
          />

          <TextField
            label={t('settings.defaultMpbrHeightOverBore')}
            type="number"
            value={mpbrHeightOverBore}
            onChange={handleMpbrHeightOverBoreChange}
            inputProps={{
              min: mpbrHeightLimits.min,
              max: mpbrHeightLimits.max,
              step: 0.01,
            }}
            fullWidth
            helperText={t('settings.minMaxHelper', {
              min: mpbrHeightLimits.min,
              max: mpbrHeightLimits.max,
              unit: mpbrHeightUnit,
            })}
          />
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

      {/* Shot Timer Settings */}
      <SettingsSection title={t('settings.shotTimerSettings')} defaultExpanded={false}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>{t('settings.defaultStartMode')}</InputLabel>
            <Select
              value={shotTimerDefaultStartMode}
              label={t('settings.defaultStartMode')}
              onChange={handleShotTimerStartModeChange as any}
            >
              <MenuItem value="instant">{t('shotTimer.instantStart')}</MenuItem>
              <MenuItem value="delayed">{t('shotTimer.delayedStart')}</MenuItem>
              <MenuItem value="random">{t('shotTimer.randomStart')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('settings.defaultTimerMode')}</InputLabel>
            <Select
              value={shotTimerDefaultTimerMode}
              label={t('settings.defaultTimerMode')}
              onChange={handleShotTimerTimerModeChange as any}
            >
              <MenuItem value="split">{t('shotTimer.splitTimer')}</MenuItem>
              <MenuItem value="par">{t('shotTimer.parTimer')}</MenuItem>
              <MenuItem value="firstShot">{t('shotTimer.firstShot')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label={t('settings.defaultParTime')}
            type="number"
            value={Math.round(shotTimerDefaultParTime / 1000)}
            onChange={handleShotTimerParTimeChange}
            inputProps={{ min: 1, step: 1, max: 600 }}
            helperText={t('settings.seconds')}
            fullWidth
          />

          <FormControl fullWidth>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
              {t('settings.defaultSensitivity', { sensitivity: shotTimerDefaultSensitivity })}
            </Typography>
            <Box sx={{ px: 1.5, mb: 2 }}>
              <Slider
                value={shotTimerDefaultSensitivity}
                onChange={(_, newValue) => {
                  const value = newValue as number;
                  setShotTimerDefaultSensitivity(value);
                  setStorageItem(StorageKeys.SHOT_TIMER_DEFAULT_SENSITIVITY, value);
                }}
                min={0}
                max={100}
                step={1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 100, label: '100%' },
                ]}
                disabled={listeningForSensitivity}
                valueLabelDisplay="auto"
              />
            </Box>
            <Button
              size="small"
              variant={listeningForSensitivity ? 'contained' : 'outlined'}
              onClick={async () => {
                if (listeningForSensitivity) {
                  // Stop listening
                  setListeningForSensitivity(false);
                  if (sensitivityAudioAnalyserRef.current) {
                    stopListening(sensitivityAudioAnalyserRef.current.mediaStream);
                    sensitivityAudioAnalyserRef.current = null;
                  }
                  if (sensitivityVisualizationRef.current) {
                    clearInterval(sensitivityVisualizationRef.current);
                    sensitivityVisualizationRef.current = null;
                  }
                  setCurrentRMSLevel(0);
                } else {
                  // Start listening
                  try {
                    const mediaStream = await requestMicrophoneAccess();
                    const analyser = createAudioAnalyser(mediaStream);
                    sensitivityAudioAnalyserRef.current = analyser;
                    setListeningForSensitivity(true);

                    // Visualization loop
                    if (sensitivityVisualizationRef.current) {
                      clearInterval(sensitivityVisualizationRef.current);
                    }
                    sensitivityVisualizationRef.current = setInterval(() => {
                      if (sensitivityAudioAnalyserRef.current) {
                        const rmsLevel = getRMSLevel(sensitivityAudioAnalyserRef.current);
                        setCurrentRMSLevel(rmsLevel);
                      }
                    }, 50);
                  } catch (error) {
                    alert(t('errors.microphone'));
                  }
                }
              }}
            >
              {listeningForSensitivity ? t('shotTimer.stop') : t('settings.testSensitivity')}
            </Button>

            {/* Visualization when testing */}
            {listeningForSensitivity && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                  {t('shotTimer.soundLevelDetails', {
                    rms: Math.round(currentRMSLevel),
                    threshold: Math.round(getShotDetectionThreshold(shotTimerDefaultSensitivity)),
                  })}
                </Typography>
                <Box
                  sx={{
                    height: 32,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 1,
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #999',
                  }}
                >
                  {/* Threshold line */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${(getShotDetectionThreshold(shotTimerDefaultSensitivity) / 255) * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      backgroundColor: '#ff0000',
                      zIndex: 2,
                    }}
                  />
                  {/* Current level bar */}
                  <Box
                    sx={{
                      height: '100%',
                      width: `${(currentRMSLevel / 255) * 100}%`,
                      backgroundColor:
                        currentRMSLevel > getShotDetectionThreshold(shotTimerDefaultSensitivity)
                          ? '#4caf50'
                          : '#2196f3',
                      transition: 'width 0.05s linear',
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'error.main' }}>
                  {t('settings.sensitivityTestHint')}
                </Typography>
              </Box>
            )}
          </FormControl>
        </Stack>
      </SettingsSection>
    </Box>
  );
};

export default Settings;
