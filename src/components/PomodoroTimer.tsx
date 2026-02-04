import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X, Timer, Plus, Minus, Clock, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  taskName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_TIME = 24 * 60 * 60; // 24 hours in seconds

export const PomodoroTimer = ({ taskName, isOpen, onClose }: PomodoroTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [isMinimized, setIsMinimized] = useState(false);
  const [scheduledStart, setScheduledStart] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const schedulerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    setScheduledStart(null);
    if (schedulerTimeoutRef.current) {
      clearTimeout(schedulerTimeoutRef.current);
    }
  }, [initialTime]);

  const handleToggle = () => {
    if (!isRunning && timeLeft === 0) {
      setTimeLeft(initialTime);
    }
    setIsRunning(!isRunning);
  };

  const handleCancelSchedule = () => {
    setScheduledStart(null);
    if (schedulerTimeoutRef.current) {
      clearTimeout(schedulerTimeoutRef.current);
    }
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

  const scheduleTimer = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;
    
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    
    // If the time is in the past, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    const delay = scheduled.getTime() - now.getTime();
    
    // Clear any existing timeout
    if (schedulerTimeoutRef.current) {
      clearTimeout(schedulerTimeoutRef.current);
      schedulerTimeoutRef.current = null;
    }
    
    setScheduledStart(timeString);
    setShowScheduler(false);
    
    // Store the timeout with proper typing
    const timeoutId = window.setTimeout(() => {
      setIsRunning(true);
      setScheduledStart(null);
      schedulerTimeoutRef.current = null;
      
      // Play a notification sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2VjX95dXiCi5eemZOJfXRxdoGNmZ6ZkoZ7cXB1gY6an5qTh3tycHWAjZqfmpOHe3Fwd4KOnJ+akod8cnF3go6cn5qSh3xycXeCjpyfmpKHfHJxd4KOnJ+akod8cnF3go6cn5qSh3xycXeCjpyfmpKHfHJxd4KOnJ+akoZ8cXB2gY2ZnpmShn1ycHaBjZqfmpKGfHFwd4KOnJ+akYZ8cXB2gY2ZnpmShn1ycHaBjZqfmpKGfHFwd4KOnJ+akYZ8cXB2gY2ZnpmShn1ycHaBjZqfmpKGfHFwd4KOnJ+akYZ8cXB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfQ==');
        audio.play().catch(() => {});
      } catch (e) {}
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ הטיימר התחיל!', { body: taskName || 'הטיימר המתוזמן שלך התחיל' });
      }
    }, delay);
    
    schedulerTimeoutRef.current = timeoutId as unknown as NodeJS.Timeout;
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
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ הזמן נגמר!', { body: taskName || 'המשימה הסתיימה' });
      }
      try {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2VjX95dXiCi5eemZOJfXRxdoGNmZ6ZkoZ7cXB1gY6an5qTh3tycHWAjZqfmpOHe3Fwd4KOnJ+akod8cnF3go6cn5qSh3xycXeCjpyfmpKHfHJxd4KOnJ+akod8cnF3go6cn5qSh3xycXeCjpyfmpKHfHJxd4KOnJ+akoZ8cXB2gY2ZnpmShn1ycHaBjZqfmpKGfHFwd4KOnJ+akYZ8cXB2gY2ZnpmShn1ycHaBjZqfmpKGfHFwd4KOnJ+akYZ8cXB2gY2ZnpmShn1ycHaBjZqfmpKGfHFwd4KOnJ+akYZ8cXB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfXJwdoGNmZ+ZkoZ9cnB2gY2Zn5mShn1ycHaBjZmfmZKGfQ==');
        audioRef.current.play().catch(() => {});
      } catch (e) {}
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, taskName]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (schedulerTimeoutRef.current) {
        clearTimeout(schedulerTimeoutRef.current);
      }
    };
  }, []);

  const shouldShowMinimized = !isOpen && (isRunning || scheduledStart);
  const shouldShowFull = isOpen && !isMinimized;

  return (
    <>
      {/* Minimized floating timer */}
      <AnimatePresence>
        {(shouldShowMinimized || (isOpen && isMinimized)) && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            drag
            dragMomentum={false}
            className="fixed bottom-4 right-4 z-50 cursor-move"
          >
            <div className="bg-background border border-border rounded-2xl shadow-2xl p-3 flex items-center gap-3">
              {/* Mini progress circle */}
              <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={2 * Math.PI * 20 * (1 - progress / 100)}
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {scheduledStart ? (
                    <Clock className="w-4 h-4 text-primary" />
                  ) : (
                    <Timer className="w-4 h-4 text-primary" />
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-lg font-bold tabular-nums">
                  {formatTime(timeLeft)}
                </span>
                {taskName && (
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {taskName}
                  </span>
                )}
                {scheduledStart && (
                  <span className="text-xs text-primary">מתוזמן ל-{scheduledStart}</span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Always show play/pause button */}
                <button
                  onClick={() => {
                    if (scheduledStart) {
                      handleCancelSchedule();
                    }
                    handleToggle();
                  }}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    isRunning
                      ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                {/* Expand button */}
                <button
                  onClick={() => setIsMinimized(false)}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                
                {/* Close/stop button */}
                <button
                  onClick={() => {
                    handleReset();
                    setIsMinimized(false);
                    onClose();
                  }}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full timer modal */}
      <AnimatePresence>
        {shouldShowFull && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (isRunning || scheduledStart) {
                  setIsMinimized(true);
                } else {
                  onClose();
                }
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

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
                <div className="flex items-center gap-1">
                  {(isRunning || scheduledStart) && (
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      title="מזער"
                    >
                      <Minimize2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isRunning || scheduledStart) {
                        setIsMinimized(true);
                      } else {
                        onClose();
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col items-center">
                {taskName && (
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    {taskName}
                  </p>
                )}

                {/* Scheduled indicator */}
                {scheduledStart && (
                  <div className="mb-4 px-4 py-2 bg-primary/10 text-primary rounded-xl flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">מתוזמן ל-{scheduledStart}</span>
                    <button
                      onClick={handleCancelSchedule}
                      className="mr-2 p-1 hover:bg-primary/20 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Timer Circle */}
                <div className="relative w-48 h-48 mb-6">
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

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tabular-nums">
                      {formatTime(timeLeft)}
                    </span>
                    {timeLeft === 0 && (
                      <span className="text-sm text-success mt-1">הזמן נגמר! ✓</span>
                    )}
                  </div>
                </div>

                {/* Time Adjustment - show when not running and not scheduled */}
                {!isRunning && !scheduledStart && (
                  <div className="w-full mb-4 space-y-3">
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

                    <div className="flex items-center justify-center gap-4">
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

                {/* Schedule Timer - only show when not running */}
                {!isRunning && !scheduledStart && (
                  <div className="w-full mb-4">
                    {showScheduler ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="time"
                          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                          onChange={(e) => {
                            if (e.target.value) {
                              scheduleTimer(e.target.value);
                            }
                          }}
                        />
                        <button
                          onClick={() => setShowScheduler(false)}
                          className="p-2 rounded-lg hover:bg-muted"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowScheduler(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        תזמן התחלה
                      </button>
                    )}
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
                    onClick={() => {
                      if (scheduledStart) {
                        handleCancelSchedule();
                      }
                      handleToggle();
                    }}
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
    </>
  );
};
