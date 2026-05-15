import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  FormControl,
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
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import MicIcon from '@mui/icons-material/Mic';
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

  // Audio detection state - detect gunshots DURING timer run
  const [isListening, setIsListening] = useState(false);
  const [sensitivity, setSensitivity] = useState(() => {
    // Load default sensitivity from Settings
    return getStorageItem<number>(StorageKeys.SHOT_TIMER_DEFAULT_SENSITIVITY, 50) || 50;
  });
  const [audioAnalyser, setAudioAnalyser] = useState<AudioAnalyser | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [currentRMSLevel, setCurrentRMSLevel] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const parTimeBeepedRef = useRef(false);
  const parTimeStartBeepedRef = useRef(false);
  const visualizationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectionRAFRef = useRef<number | null>(null);
  const isRunningRef = useRef(false); // Track running state for detection loop

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (visualizationRef.current) {
        clearInterval(visualizationRef.current);
      }
      if (audioAnalyser) {
        stopListening(audioAnalyser.mediaStream);
      }
    };
  }, [audioAnalyser]);

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
    if (
      timerMode === 'par' &&
      isRunning &&
      elapsedMs >= parTimeMs &&
      !parTimeBeepedRef.current
    ) {
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

    // Always start gunshot detection when timer starts
    try {
      setDetectionError(null);

      // Request microphone access
      const mediaStream = await requestMicrophoneAccess();
      const analyser = createAudioAnalyser(mediaStream);
      setAudioAnalyser(analyser);
      setIsListening(true);

      // Start visualization loop
      if (visualizationRef.current) {
        clearInterval(visualizationRef.current);
      }
      let vizLoopCount = 0;
      visualizationRef.current = setInterval(() => {
        if (analyser) {
          try {
            const rmsLevel = getRMSLevel(analyser);
            setCurrentRMSLevel(rmsLevel);
            vizLoopCount++;
          } catch (error) {
            console.error('Error in viz loop:', error);
          }
        }
      }, 50);

      // Start continuous gunshot detection loop
      const threshold = 10 + (100 - sensitivity) * 0.4; // Lower threshold for better clap detection
      let lastDetectionTime = 0;
      let lastRMS = 0;
      let consecutiveHighSamples = 0;
      let loopCount = 0;

      const detectGunshotLoop = () => {
          if (!analyser) {
            return;
          }

          try {
            analyser.analyser.getByteFrequencyData(analyser.dataArray);
            const rms = calculateRMS(analyser.dataArray);

            loopCount++;

            // Detect sudden loud spike (key characteristic of claps/gunshots)
            const spike = rms - lastRMS > 20 && rms > threshold;
            const sustainedLoud = rms > threshold;
            
            // Track consecutive high samples for more reliable detection
            if (sustainedLoud) {
              consecutiveHighSamples++;
            } else {
              consecutiveHighSamples = 0;
            }

            const now = Date.now();
            // Trigger on: spike OR 2+ consecutive high samples
            const isDetected = (spike || consecutiveHighSamples >= 2) && now - lastDetectionTime > 250;

            if (isDetected) {
              lastDetectionTime = now;
              consecutiveHighSamples = 0;
              // Handle based on timer mode
              if (isRunningRef.current && startTimeRef.current !== null) {
                const gunShotTime = Date.now() - startTimeRef.current;
                
                if (timerMode === 'firstShot') {
                  // For firstShot mode: STOP the timer on gunshot detection
                  isRunningRef.current = false;
                  setIsRunning(false);
                  playBeep();
                } else {
                  // For other modes: record as a split
                  setSplits((prev) => [...prev, gunShotTime]);
                  playBeep();
                }
              }
            }

            lastRMS = rms;

            // Continue looping while running - use ref instead of state
            if (isRunningRef.current) {
              detectionRAFRef.current = requestAnimationFrame(detectGunshotLoop);
            }
          } catch (detectionError) {
            console.error('Error in detection loop:', detectionError);
          }
        };

        detectionRAFRef.current = requestAnimationFrame(detectGunshotLoop);
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

  const handleAddSplit = () => {
    if (isRunning) {
      setSplits([...splits, elapsedMs]);
    }
  };

  const displayTime = formatTimeMMSS(
    timerMode === 'par' ? Math.max(0, parTimeMs - elapsedMs) : elapsedMs
  );


  return (
    <Box sx={{ pb: 12 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('shotTimer.title')}
      </Typography>

      {/* Timer Display */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
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
        {isRunning && timerMode === 'split' && (
          <Button
            variant="outlined"
            onClick={handleAddSplit}
            sx={{ mt: 2 }}
          >
            {t('shotTimer.results')}
          </Button>
        )}
      </Box>

      {/* Gunshot Detection Visualization (during active timer) */}
      {isListening && isRunning && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MicIcon sx={{ color: 'error.main', animation: 'pulse 1s infinite' }} />
              <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                Listening...
              </Typography>
            </Stack>

            {/* Amplitude Visualization */}
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                Sound Level (RMS: {Math.round(currentRMSLevel)}/255 | Threshold: {Math.round(10 + (100 - sensitivity) * 0.4)})
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
                    backgroundColor: currentRMSLevel > 10 + (100 - sensitivity) * 0.4 ? '#4caf50' : '#2196f3',
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
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#ffebee', border: '1px solid #c62828', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: '#c62828', fontWeight: 'bold' }}>
            ⚠️ Error: {detectionError}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#c62828' }}>
            Check the browser console (F12) for more details. Make sure this site is HTTPS (not HTTP).
          </Typography>
        </Box>
      )}

      {/* Tabs Section */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Settings" />
          <Tab label="Splits" disabled={timerMode === 'firstShot'} />
        </Tabs>
      </Box>

      {/* Settings Tab */}
      {tabValue === 0 && (
        <Stack spacing={2} sx={{ mb: 3 }}>
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
              helperText="Seconds"
              fullWidth
            />
          )}

          {/* Gunshot Detection Sensitivity Slider */}
          <FormControl fullWidth>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Gunshot Detection Sensitivity: {sensitivity}%
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
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>
              {timerMode === 'firstShot'
                ? 'FirstShot mode: Gunshot will STOP the timer.'
                : 'Split/Par modes: Gunshots automatically recorded as splits.'}
            </Typography>
          </FormControl>
        </Stack>
      )}

      {/* Splits Tab */}
      {tabValue === 1 && timerMode !== 'firstShot' && (
        <Box sx={{ mb: 3 }}>
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
              No splits recorded yet. Start the timer and gunshots will appear here.
            </Typography>
          )}
        </Box>
      )}

      {/* Control Buttons */}
      <FixedButtonFooter>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            fullWidth
          >
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
    </Box>
  );
};

export default ShotTimer;
