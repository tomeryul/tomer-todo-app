import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, CalendarPlus } from 'lucide-react';
import { Priority } from '@/types/task';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { he } from 'date-fns/locale';

interface MultiDayTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDates: string[];
  onAddTask: (dates: string[], text: string, priority: Priority) => void;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'גבוהה', color: 'bg-destructive/10 text-destructive border-destructive/30' },
  { value: 'medium', label: 'בינונית', color: 'bg-warning/10 text-warning border-warning/30' },
  { value: 'low', label: 'נמוכה', color: 'bg-success/10 text-success border-success/30' },
];

export const MultiDayTaskModal = ({
  isOpen,
  onClose,
  availableDates,
  onAddTask,
}: MultiDayTaskModalProps) => {
  const [taskText, setTaskText] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>('medium');

  const handleSubmit = () => {
    if (taskText.trim() && selectedDates.length > 0) {
      onAddTask(selectedDates, taskText.trim(), priority);
      setTaskText('');
      setSelectedDates([]);
      setPriority('medium');
      onClose();
    }
  };

  const toggleDate = (date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const selectAllDates = () => {
    if (selectedDates.length === availableDates.slice(0, 14).length) {
      setSelectedDates([]);
    } else {
      setSelectedDates(availableDates.slice(0, 14));
    }
  };

  const handleClose = () => {
    setTaskText('');
    setSelectedDates([]);
    setPriority('medium');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] mx-auto max-w-lg bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">הוסף משימה לכמה ימים</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Task Text */}
              <div>
                <label className="block text-sm font-medium mb-2">תיאור המשימה</label>
                <input
                  type="text"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="מה צריך לעשות?"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl text-sm',
                    'bg-muted border border-border',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    'placeholder:text-muted-foreground'
                  )}
                  autoFocus
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">עדיפות</label>
                <div className="flex gap-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPriority(option.value)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                        priority === option.value
                          ? option.color
                          : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">בחר ימים</label>
                  <button
                    onClick={selectAllDates}
                    className="text-xs text-primary hover:underline"
                  >
                    {selectedDates.length === availableDates.slice(0, 14).length
                      ? 'בטל הכל'
                      : 'בחר את כל השבועיים'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {availableDates.slice(0, 14).map((date) => {
                    const dateObj = new Date(date);
                    const isSelected = selectedDates.includes(date);
                    const isTodayDate = isToday(dateObj);

                    return (
                      <button
                        key={date}
                        onClick={() => toggleDate(date)}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border transition-all',
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted border-border hover:border-primary/50',
                          isTodayDate && !isSelected && 'ring-2 ring-primary/20'
                        )}
                      >
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(dateObj, 'EEEE', { locale: he })}
                            {isTodayDate && (
                              <span className="mr-1 text-xs opacity-75">(היום)</span>
                            )}
                          </p>
                          <p className="text-xs opacity-75">
                            {format(dateObj, 'd/M', { locale: he })}
                          </p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedDates.length > 0
                    ? `נבחרו ${selectedDates.length} ימים`
                    : 'לא נבחרו ימים'}
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={!taskText.trim() || selectedDates.length === 0}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all',
                    taskText.trim() && selectedDates.length > 0
                      ? 'gradient-primary text-primary-foreground shadow-glow hover:opacity-90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  הוסף משימה
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
