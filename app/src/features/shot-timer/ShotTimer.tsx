import React, { useState, useEffect, useRef } from 'react';
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
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FixedButtonFooter from '../../shared/components/FixedButtonFooter';
import { getStorageItem, setStorageItem } from '../../shared/utils/storage';
import { formatTimeMMSS } from '../../shared/utils/timeUtils';
import { playBeep } from '../../shared/utils/beepUtils';

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
  const [parTimeMs, setParTimeMs] = useState(5000); // 5 seconds default
  const [splits, setSplits] = useState<number[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const parTimeBeepedRef = useRef(false);
  const parTimeStartBeepedRef = useRef(false);

  // Save preferences to storage
  useEffect(() => {
    setStorageItem(SHOT_TIMER_MODE_KEY, timerMode);
  }, [timerMode]);

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
        return;
      }

      // For par mode, stop at 0
      if (timerMode === 'par' && elapsed >= parTimeMs) {
        setElapsedMs(parTimeMs);
        setIsRunning(false);
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

    // Instant start - beep immediately
    if (startMode === 'instant') {
      await playBeep();
      parTimeStartBeepedRef.current = false; // Reset for par mode
      startTimeRef.current = null;
      setIsRunning(true);
      return;
    }

    // Handle start mode delays with countdown beeps
    if (startMode === 'delayed') {
      // 2 second delay: only beep ONCE at the end
      setIsRunning(false);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await playBeep(); // Single beep at end of delay
    } else if (startMode === 'random') {
      // Random 2-5 second delay: only beep ONCE at the end (just before start)
      const randomDelay = Math.random() * 3000 + 2000; // 2-5 seconds
      setIsRunning(false);
      await new Promise((resolve) => setTimeout(resolve, randomDelay));
      await playBeep(); // Single beep at end of delay
    }

    parTimeStartBeepedRef.current = false; // Reset for par mode
    startTimeRef.current = null;
    setIsRunning(true);
  };

  const handleStop = () => {
    if (isRunning) {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedMs(0);
    startTimeRef.current = null;
    setSplits([]);
    parTimeBeepedRef.current = false;
    parTimeStartBeepedRef.current = false;
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
    <Box>
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

      {/* Settings */}
      <Stack spacing={2} sx={{ mb: 3 }}>
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
      </Stack>

      {/* Splits Display */}
      {splits.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('shotTimer.splits')}
          </Typography>
          <Stack spacing={1}>
            {splits.map((split, index) => (
              <Typography key={index} variant="body2">
                {index + 1}. {formatTimeMMSS(split)}
              </Typography>
            ))}
          </Stack>
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
