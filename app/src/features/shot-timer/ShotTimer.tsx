import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import MicIcon from '@mui/icons-material/Mic';
import Modal from '../../shared/components/Modal';
import FixedButtonFooter from '../../shared/components/FixedButtonFooter';
import { StorageKeys, getStorageItem, setStorageItem } from '../../shared/utils/storage';
import { formatTimeMMSS } from '../../shared/utils/timeUtils';
import { playBeep } from '../../shared/utils/beepUtils';
import type { AudioAnalyser } from '../../shared/utils/audioDetectionUtils';
import {
  requestMicrophoneAccess,
  createAudioAnalyser,
  stopListening,
  getRMSLevel,
  calculateRMS,
  calculateHighFrequencyContent,
  getFrequencyRatio,
  analyzeShotCharacteristics,
  applyNoiseGate,
} from '../../shared/utils/audioDetectionUtils';

type TimerMode = 'par' | 'split' | 'firstShot';
type StartMode = 'instant' | 'delayed' | 'random';

const SHOT_TIMER_MODE_KEY = 'SHOT_TIMER_MODE';
const SHOT_TIMER_START_MODE_KEY = 'SHOT_TIMER_START_MODE';

const ShotTimer: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [timerMode, setTimerMode] = useState<TimerMode>(() => {
    const saved = getStorageItem<TimerMode>(SHOT_TIMER_MODE_KEY, 'split');
    return saved;
  });

  const [startMode, setStartMode] = useState<StartMode>(() => {
    const saved = getStorageItem<StartMode>(SHOT_TIMER_START_MODE_KEY, 'instant');
    return saved;
  });

  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [parTimeMs, setParTimeMs] = useState(() => {
    // Load default par time from Settings
    return getStorageItem<number>(StorageKeys.SHOT_TIMER_DEFAULT_PAR_TIME, 5000) || 5000;
  });
  const [splits, setSplits] = useState<number[]>([]);

  // Audio detection state - detect shots DURING timer run
  const [isListening, setIsListening] = useState(false);
  const [sensitivity, setSensitivity] = useState(() => {
    // Load default sensitivity from Settings
    return getStorageItem<number>(StorageKeys.SHOT_TIMER_DEFAULT_SENSITIVITY, 50) || 50;
  });
  const [audioAnalyser, setAudioAnalyser] = useState<AudioAnalyser | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [currentRMSLevel, setCurrentRMSLevel] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const parTimeBeepedRef = useRef(false);
  const parTimeStartBeepedRef = useRef(false);
  const visualizationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectionRAFRef = useRef<number | null>(null);
  const isRunningRef = useRef(false); // Track running state for detection loop
  const analyserRef = useRef<AudioAnalyser | null>(null); // Store current analyser for visualization

  // Auto-request microphone permission on mount
  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        await requestMicrophoneAccess();
      } catch (error) {
        // Silently handle permission denial
      }
    };

    requestMicPermission();
  }, []);

  // Track isRunning changes
  useEffect(() => {
    // Track running state for detection loop
  }, [isRunning]);

  // Cleanup on unmount or when stopping
  useEffect(() => {
    return () => {
      // Only clear visualization if we're stopping, not when starting
      if (!isRunning && visualizationRef.current) {
        clearInterval(visualizationRef.current);
      }
      if (audioAnalyser) {
        stopListening(audioAnalyser.mediaStream);
      }
    };
  }, [audioAnalyser, isRunning]);

  useEffect(() => {
    setStorageItem(SHOT_TIMER_START_MODE_KEY, startMode);
  }, [startMode]);

  // Beep at start and end of par time
  useEffect(() => {
    if (
      timerMode === 'par' &&
      isRunning &&
      !parTimeStartBeepedRef.current &&
      elapsedMs >= 0 &&
      elapsedMs < 100 // Within first 100ms of running
    ) {
      // Beep at start
      playBeep();
      parTimeStartBeepedRef.current = true;
    }
  }, [timerMode, isRunning, elapsedMs]);

  // Beep when par time is reached (end)
  useEffect(() => {
    if (timerMode === 'par' && isRunning && elapsedMs >= parTimeMs && !parTimeBeepedRef.current) {
      playBeep();
      parTimeBeepedRef.current = true;
    }
  }, [timerMode, isRunning, elapsedMs, parTimeMs]);

  // Timer interval
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now() - elapsedMs;
    }

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;
      const now = Date.now();
      const elapsed = now - startTimeRef.current;

      // Auto-stop at 15 minutes
      const maxTime = 15 * 60 * 1000; // 900,000 ms
      if (elapsed >= maxTime) {
        setElapsedMs(maxTime);
        setIsRunning(false);
        isRunningRef.current = false;
        return;
      }

      // For par mode, stop at 0
      if (timerMode === 'par' && elapsed >= parTimeMs) {
        setElapsedMs(parTimeMs);
        setIsRunning(false);
        isRunningRef.current = false;
      } else {
        setElapsedMs(elapsed);
      }
    }, 10); // Update every 10ms for smooth display

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timerMode, parTimeMs]);

  const handleStart = async () => {
    if (isRunning) return;

    // Handle start mode delays (with optional beep)
    if (startMode === 'delayed') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await playBeep();
    } else if (startMode === 'random') {
      const randomDelay = Math.random() * 3000 + 2000;
      await new Promise((resolve) => setTimeout(resolve, randomDelay));
      await playBeep();
    } else {
      // instant
      await playBeep();
    }

    // Reset refs and start timer
    parTimeStartBeepedRef.current = false;
    startTimeRef.current = null;
    isRunningRef.current = true; // Set running ref IMMEDIATELY
    setIsRunning(true); // Also update state for UI

    // Always start shot detection when timer starts
    try {
      setDetectionError(null);

      // Request microphone access
      const mediaStream = await requestMicrophoneAccess();
      const analyser = createAudioAnalyser(mediaStream);
      analyserRef.current = analyser; // Store in ref for visualization loop
      setAudioAnalyser(analyser);
      setIsListening(true);

      // Start visualization loop - copied from Settings which works
      if (visualizationRef.current) {
        clearInterval(visualizationRef.current);
      }
      visualizationRef.current = setInterval(() => {
        if (analyserRef.current) {
          const rmsLevel = getRMSLevel(analyserRef.current);
          setCurrentRMSLevel(rmsLevel);
        }
      }, 50);

      // Start continuous shot detection loop
      // Convert sensitivity (0-100) to noise gate threshold (5-50)
      // Higher sensitivity = lower threshold = more responsive
      const noiseGateThreshold = 5 + (100 - sensitivity) * 0.45;

      let lastDetectionTime = 0;
      let lastRMS = 0;
      let baselineRMS = 30; // Start with reasonable baseline
      let baselineSamples = 0;
      let loopCount = 0;

      const detectShotLoop = () => {
        if (!analyser) {
          return;
        }

        try {
          analyser.analyser.getByteFrequencyData(analyser.dataArray);
          const rms = calculateRMS(analyser.dataArray);
          const highFreqRatio = getFrequencyRatio(analyser.dataArray);

          loopCount++;

          // Build baseline during first 500ms (samples at 60fps ≈ 30 samples)
          if (baselineSamples < 30 && rms < 60) {
            baselineRMS = baselineRMS * 0.9 + rms * 0.1; // Exponential moving average
            baselineSamples++;
          }

          const now = Date.now();

          // Skip if we're in beep immunity window (prevents feedback loop)
          if (now - lastDetectionTime > 250) {
            // Apply noise gate: only consider loud enough sounds
            if (applyNoiseGate(rms, noiseGateThreshold)) {
              // Analyze shot characteristics
              const characteristics = analyzeShotCharacteristics(
                rms,
                lastRMS,
                highFreqRatio,
                baselineRMS
              );

              // Detect shot: must have both sharp attack and high-frequency content
              // AND be significantly above baseline RMS (2.5x threshold for low false positives)
              const isShot =
                characteristics.isShot && rms > baselineRMS * 2.5 && now - lastDetectionTime > 250;

              if (isShot) {
                lastDetectionTime = now;
                // Handle based on timer mode
                if (isRunningRef.current && startTimeRef.current !== null) {
                  const shotTime = Date.now() - startTimeRef.current;

                  if (timerMode === 'firstShot') {
                    // For firstShot mode: STOP the timer on shot detection
                    isRunningRef.current = false;
                    setIsRunning(false);
                  } else {
                    // For other modes: record as a split
                    setSplits((prev) => [...prev, shotTime]);
                  }
                }
              }
            }
          }

          lastRMS = rms;

          // Continue looping while running - use ref instead of state
          if (isRunningRef.current) {
            detectionRAFRef.current = requestAnimationFrame(detectShotLoop);
          }
        } catch (detectionError) {
          console.error('Error in detection loop:', detectionError);
        }
      };

      detectionRAFRef.current = requestAnimationFrame(detectShotLoop);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Microphone access denied';
      setDetectionError(errorMsg);
      setIsListening(false);
      setCurrentRMSLevel(0);
    }
  };

  const handleStop = () => {
    if (isRunning) {
      setIsRunning(false);
      isRunningRef.current = false;
      // Clean up audio detection when paused
      if (audioAnalyser) {
        stopListening(audioAnalyser.mediaStream);
        setAudioAnalyser(null);
        analyserRef.current = null;
        setIsListening(false);
        setCurrentRMSLevel(0);
      }
      if (visualizationRef.current) {
        clearInterval(visualizationRef.current);
      }
      if (detectionRAFRef.current) {
        cancelAnimationFrame(detectionRAFRef.current);
        detectionRAFRef.current = null;
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    setElapsedMs(0);
    startTimeRef.current = null;
    setSplits([]);
    parTimeBeepedRef.current = false;
    parTimeStartBeepedRef.current = false;

    // Clean up audio detection
    if (audioAnalyser) {
      stopListening(audioAnalyser.mediaStream);
      setAudioAnalyser(null);
      analyserRef.current = null;
      setIsListening(false);
      setCurrentRMSLevel(0);
    }
    if (visualizationRef.current) {
      clearInterval(visualizationRef.current);
      visualizationRef.current = null;
    }
    if (detectionRAFRef.current) {
      cancelAnimationFrame(detectionRAFRef.current);
      detectionRAFRef.current = null;
    }
  };

  const displayTime = formatTimeMMSS(
    timerMode === 'par' ? Math.max(0, parTimeMs - elapsedMs) : elapsedMs
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flex: '0 0 auto' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2, width: '100%' }}
        >
          <Typography variant="h4">{t('shotTimer.title')}</Typography>
          <IconButton
            aria-label={t('shotTimer.helpOpenAria')}
            color="inherit"
            onClick={() => setHelpModalOpen(true)}
            size="large"
          >
            <HelpOutlineIcon />
          </IconButton>
        </Stack>

        {/* Timer Display */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '72px',
            }}
          >
            {displayTime}
          </Typography>

          {/* Add Split Button (visible during run in split mode) */}
        </Box>

        {/* Shot Detection Visualization (during active timer) */}
        {isListening && isRunning && (
          <Box sx={{ mb: 1, p: 1, backgroundColor: 'action.hover', borderRadius: 1 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <MicIcon sx={{ color: 'error.main', animation: 'pulse 1s infinite' }} />
                <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                  {t('shotTimer.listening')}
                </Typography>
              </Stack>

              {/* Amplitude Visualization */}
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                  {t('shotTimer.soundLevelDetails', {
                    rms: Math.round(currentRMSLevel),
                    threshold: Math.round(10 + (100 - sensitivity) * 0.4),
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
                      left: `${((10 + (100 - sensitivity) * 0.4) / 255) * 100}%`,
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
                        currentRMSLevel > 10 + (100 - sensitivity) * 0.4 ? '#4caf50' : '#2196f3',
                      transition: 'width 0.05s linear',
                    }}
                  />
                </Box>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Detection Error - Show at top */}
        {detectionError && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: '#ffebee',
              border: '1px solid #c62828',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: '#c62828', fontWeight: 'bold' }}>
              ⚠️ {t('shotTimer.detectionError')}: {detectionError}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#c62828' }}>
              {t('shotTimer.consoleHint')}
            </Typography>
          </Box>
        )}

        {/* Tabs Section */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label={t('shotTimer.settingsTab')} />
            <Tab label={t('shotTimer.splitsTab')} disabled={timerMode === 'firstShot'} />
          </Tabs>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 0, minHeight: 0, pb: 2 }}>
        {/* Settings Tab */}
        {tabValue === 0 && (
          <Box sx={{ px: 2, pt: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h6">{t('shotTimer.currentSettings')}</Typography>

              {/* Start Mode Dropdown */}
              <FormControl fullWidth>
                <InputLabel>{t('shotTimer.startMode')}</InputLabel>
                <Select
                  value={startMode}
                  label={t('shotTimer.startMode')}
                  onChange={(e) => {
                    if (isRunning) handleReset();
                    setStartMode(e.target.value as StartMode);
                  }}
                >
                  <MenuItem value="instant">{t('shotTimer.instantStart')}</MenuItem>
                  <MenuItem value="delayed">{t('shotTimer.delayedStart')}</MenuItem>
                  <MenuItem value="random">{t('shotTimer.randomStart')}</MenuItem>
                </Select>
              </FormControl>

              {/* Timer Mode Dropdown */}
              <FormControl fullWidth>
                <InputLabel>{t('shotTimer.timerMode')}</InputLabel>
                <Select
                  value={timerMode}
                  label={t('shotTimer.timerMode')}
                  onChange={(e) => {
                    if (isRunning) handleReset();
                    setTimerMode(e.target.value as TimerMode);
                  }}
                >
                  <MenuItem value="split">{t('shotTimer.splitTimer')}</MenuItem>
                  <MenuItem value="par">{t('shotTimer.parTimer')}</MenuItem>
                  <MenuItem value="firstShot">{t('shotTimer.firstShot')}</MenuItem>
                </Select>
              </FormControl>

              {/* Par Time Input (for par mode) */}
              {timerMode === 'par' && (
                <TextField
                  label={t('shotTimer.parTime')}
                  type="number"
                  value={Math.round(parTimeMs / 1000)}
                  onChange={(e) => {
                    if (isRunning) handleReset();
                    setParTimeMs(Math.max(1, parseInt(e.target.value) || 1) * 1000);
                  }}
                  inputProps={{ min: 1, step: 1, max: 600 }}
                  helperText={t('settings.seconds')}
                  fullWidth
                />
              )}

              {/* Shot Detection Sensitivity Slider */}
              <FormControl fullWidth>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {t('shotTimer.sensitivity', { sensitivity })}
                </Typography>
                <Box sx={{ px: 1.5 }}>
                  <Slider
                    value={sensitivity}
                    onChange={(_, newValue) => setSensitivity(newValue as number)}
                    min={0}
                    max={100}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 100, label: '100%' },
                    ]}
                    disabled={isListening}
                    valueLabelDisplay="auto"
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{ mt: 1, display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}
                >
                  {timerMode === 'firstShot'
                    ? t('shotTimer.firstShotSensitivityHint')
                    : t('shotTimer.splitSensitivityHint')}
                </Typography>
              </FormControl>
            </Stack>
          </Box>
        )}

        {/* Splits Tab */}
        {tabValue === 1 && timerMode !== 'firstShot' && (
          <Box sx={{ px: 2, pt: 2 }}>
            {splits.length > 0 ? (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {t('shotTimer.splits')} ({splits.length})
                </Typography>
                <Stack spacing={1}>
                  {splits.map((split, index) => (
                    <Typography key={index} variant="body2">
                      {index + 1}. {formatTimeMMSS(split)}
                    </Typography>
                  ))}
                </Stack>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('shotTimer.noSplits')}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Control Buttons */}
      <FixedButtonFooter>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleReset} fullWidth>
            {t('common.reset')}
          </Button>

          {!isRunning ? (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleStart}
              fullWidth
            >
              {t('shotTimer.start')}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<PauseIcon />}
              onClick={handleStop}
              fullWidth
            >
              {t('shotTimer.stop')}
            </Button>
          )}
        </Stack>
      </FixedButtonFooter>

      <Modal open={helpModalOpen} title={t('common.help')} onClose={() => setHelpModalOpen(false)}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2">{t('shotTimer.helpIntro')}</Typography>
          <Typography variant="body2">{t('shotTimer.helpStartMode')}</Typography>
          <Typography variant="body2">{t('shotTimer.helpTimerMode')}</Typography>
          <Typography variant="body2">{t('shotTimer.helpSensitivity')}</Typography>
        </Stack>
      </Modal>
    </Box>
  );
};

export default ShotTimer;
