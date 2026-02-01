import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X, Timer, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  taskName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_TIME = 24 * 60 * 60; // 24 hours in seconds

export const PomodoroTimer = ({ taskName, isOpen, onClose }: PomodoroTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0;

  const handleReset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsRunning(false);
  }, [initialTime]);

  const handleToggle = () => {
    if (!isRunning && timeLeft === 0) {
      // If timer finished, reset before starting
      setTimeLeft(initialTime);
    }
    setIsRunning(!isRunning);
  };

  const updateTime = (hours: number, minutes: number) => {
    const newHours = Math.max(0, Math.min(23, hours));
    const newMinutes = Math.max(0, Math.min(59, minutes));
    setCustomHours(newHours);
    setCustomMinutes(newMinutes);
    const totalSeconds = (newHours * 3600) + (newMinutes * 60);
    setTimeLeft(Math.min(totalSeconds, MAX_TIME));
    setInitialTime(Math.min(totalSeconds, MAX_TIME));
  };

  const presetTimes = [
    { label: '5 דק׳', minutes: 5 },
    { label: '15 דק׳', minutes: 15 },
    { label: '25 דק׳', minutes: 25 },
    { label: '45 דק׳', minutes: 45 },
    { label: '1 שעה', minutes: 60 },
    { label: '2 שעות', minutes: 120 },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Play notification sound
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ הזמן נגמר!', { body: taskName || 'המשימה הסתיימה' });
      }
      // Try to play audio
      try {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2VjX95dXiCi5eemZOJfXRxdoGNmZ6ZkoZ7cXB1gY6an5qTh3tycHWAjZqfmpOHe3Fwd4KOnJ+akod8cnF3go6cn5qSh3xycXeCjpyfmpKHfHJxd4KOnJ+akod8cnF3go6cn5qSh3xycXeCjpyfmpKHfHJxd4KOnJ+akoZ8cXB2gY2ZnpmShn1ycHaBjZqfmpKGfHFwd4KOnJ+akYZ8cXB2gY2ZnpmShn1ycHaBjZqfmpKGfHFwd4KOnJ+akYZ8cXB2gY2ZnpmShn1ycHaBjZqfmpKGfHFwd4KOnJ+akYZ8cXB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfQ==');
        audioRef.current.play().catch(() => {});
      } catch (e) {
        // Ignore audio errors
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, taskName]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Reset when opening with new task
  useEffect(() => {
    if (isOpen) {
      setIsRunning(false);
    }
  }, [isOpen, taskName]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Timer Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-[10%] mx-auto max-w-sm bg-background border border-border rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">טיימר</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center">
              {/* Task Name */}
              {taskName && (
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  {taskName}
                </p>
              )}

              {/* Timer Circle */}
              <div className="relative w-48 h-48 mb-6">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                    className="text-primary transition-all duration-1000"
                  />
                </svg>

                {/* Time Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                  {timeLeft === 0 && (
                    <span className="text-sm text-success mt-1">הזמן נגמר! ✓</span>
                  )}
                </div>
              </div>

              {/* Time Adjustment (only when not running) */}
              {!isRunning && (
                <div className="w-full mb-4 space-y-3">
                  {/* Preset buttons */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {presetTimes.map((preset) => (
                      <button
                        key={preset.minutes}
                        onClick={() => updateTime(Math.floor(preset.minutes / 60), preset.minutes % 60)}
                        className={cn(
                          'px-3 py-1.5 text-xs rounded-lg border transition-all',
                          initialTime === preset.minutes * 60
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted border-border hover:border-primary/50'
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom time input */}
                  <div className="flex items-center justify-center gap-4">
                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => updateTime(customHours + 1, customMinutes)}
                        className="p-1 rounded hover:bg-muted"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-2xl font-bold w-12 text-center tabular-nums">
                        {customHours.toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => updateTime(customHours - 1, customMinutes)}
                        className="p-1 rounded hover:bg-muted"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-muted-foreground">שעות</span>
                    </div>
                    
                    <span className="text-2xl font-bold">:</span>
                    
                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => updateTime(customHours, customMinutes + 5)}
                        className="p-1 rounded hover:bg-muted"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-2xl font-bold w-12 text-center tabular-nums">
                        {customMinutes.toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => updateTime(customHours, customMinutes - 5)}
                        className="p-1 rounded hover:bg-muted"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-muted-foreground">דקות</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggle}
                  disabled={initialTime === 0}
                  className={cn(
                    'p-5 rounded-2xl transition-all',
                    isRunning
                      ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                      : 'gradient-primary text-primary-foreground shadow-glow',
                    initialTime === 0 && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isRunning ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 mr-0.5" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
