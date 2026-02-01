import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  taskName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const WORK_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60; // 5 minutes

export const PomodoroTimer = ({ taskName, isOpen, onClose }: PomodoroTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100 
    : ((WORK_TIME - timeLeft) / WORK_TIME) * 100;

  const handleReset = useCallback(() => {
    setTimeLeft(isBreak ? BREAK_TIME : WORK_TIME);
    setIsRunning(false);
  }, [isBreak]);

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const switchMode = useCallback(() => {
    if (!isBreak) {
      setSessions((prev) => prev + 1);
    }
    setIsBreak(!isBreak);
    setTimeLeft(!isBreak ? BREAK_TIME : WORK_TIME);
    setIsRunning(false);
  }, [isBreak]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Play notification sound
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(isBreak ? 'ההפסקה נגמרה!' : 'הזמן נגמר! זמן להפסקה');
      }
      switchMode();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, isBreak, switchMode]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
            className="fixed inset-x-4 top-[15%] mx-auto max-w-sm bg-background border border-border rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Pomodoro</h2>
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

              {/* Mode Badge */}
              <div
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium mb-6',
                  isBreak
                    ? 'bg-success/10 text-success'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {isBreak ? '🧘 הפסקה' : '🎯 עבודה'}
              </div>

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
                    className={cn(
                      'transition-all duration-1000',
                      isBreak ? 'text-success' : 'text-primary'
                    )}
                  />
                </svg>

                {/* Time Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    סשנים: {sessions}
                  </span>
                </div>
              </div>

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
                  className={cn(
                    'p-5 rounded-2xl transition-all',
                    isRunning
                      ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                      : 'gradient-primary text-primary-foreground shadow-glow'
                  )}
                >
                  {isRunning ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 mr-0.5" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={switchMode}
                  className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-xs font-medium"
                >
                  {isBreak ? 'עבודה' : 'הפסקה'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
