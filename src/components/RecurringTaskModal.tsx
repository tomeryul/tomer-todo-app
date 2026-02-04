import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Repeat } from 'lucide-react';
import { Priority } from '@/types/task';
import { cn } from '@/lib/utils';

interface RecurringTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecurringTask: (text: string, dayOfWeek: number, priority: Priority) => void;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'גבוהה', color: 'bg-destructive/10 text-destructive border-destructive/30' },
  { value: 'medium', label: 'בינונית', color: 'bg-warning/10 text-warning border-warning/30' },
  { value: 'low', label: 'נמוכה', color: 'bg-success/10 text-success border-success/30' },
];

const daysOfWeek = [
  { value: 0, label: 'ראשון' },
  { value: 1, label: 'שני' },
  { value: 2, label: 'שלישי' },
  { value: 3, label: 'רביעי' },
  { value: 4, label: 'חמישי' },
  { value: 5, label: 'שישי' },
  { value: 6, label: 'שבת' },
];

export const RecurringTaskModal = ({
  isOpen,
  onClose,
  onAddRecurringTask,
}: RecurringTaskModalProps) => {
  const [taskText, setTaskText] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [priority, setPriority] = useState<Priority>('medium');

  const handleSubmit = () => {
    if (taskText.trim()) {
      onAddRecurringTask(taskText.trim(), selectedDay, priority);
      setTaskText('');
      setSelectedDay(0);
      setPriority('medium');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-[15%] mx-auto max-w-md bg-background border border-border rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">משימה קבועה שבועית</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Task Text */}
              <div>
                <label className="block text-sm font-medium mb-2">טקסט המשימה</label>
                <input
                  type="text"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="הכנס את המשימה..."
                  className={cn(
                    'w-full px-4 py-3 rounded-xl text-sm',
                    'bg-muted border border-border',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    'placeholder:text-muted-foreground'
                  )}
                />
              </div>

              {/* Day Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline ml-1" />
                  בחר יום בשבוע
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => setSelectedDay(day.value)}
                      className={cn(
                        'p-2 text-xs rounded-lg border transition-all text-center',
                        selectedDay === day.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted border-border hover:border-primary/50'
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">עדיפות</label>
                <div className="flex gap-2">
                  {priorityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPriority(opt.value)}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all',
                        priority === opt.value
                          ? opt.color
                          : 'bg-muted border-border hover:border-primary/50'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors font-medium"
              >
                ביטול
              </button>
              <button
                onClick={handleSubmit}
                disabled={!taskText.trim()}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium transition-all',
                  'gradient-primary text-primary-foreground shadow-glow',
                  !taskText.trim() && 'opacity-50 cursor-not-allowed'
                )}
              >
                הוסף לכל ימי {daysOfWeek[selectedDay].label}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
