import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ExcelUpload } from './ExcelUpload';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Priority } from '@/types/task';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDates: string[];
  onImportTasks: (date: string, tasks: string[], priority: Priority) => Promise<void>;
}

export const ExcelImportModal = ({
  isOpen,
  onClose,
  availableDates,
  onImportTasks,
}: ExcelImportModalProps) => {
  const [tasks, setTasks] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0] || '');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [isImporting, setIsImporting] = useState(false);

  const handleTasksImported = (importedTasks: string[]) => {
    setTasks(importedTasks);
  };

  const handleConfirmImport = async () => {
    if (tasks.length === 0 || !selectedDate) return;

    setIsImporting(true);
    try {
      await onImportTasks(selectedDate, tasks, selectedPriority);
      setTasks([]);
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setTasks([]);
    setSelectedDate(availableDates[0] || '');
    setSelectedPriority('medium');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-xl border border-border"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">ייבוא משימות מ-Excel</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* File Upload */}
              {tasks.length === 0 && (
                <ExcelUpload onTasksImported={handleTasksImported} />
              )}

              {/* Tasks Preview */}
              {tasks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      נמצאו {tasks.length} משימות
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTasks([])}
                    >
                      בחר קובץ אחר
                    </Button>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-2 bg-muted rounded-xl p-3">
                    {tasks.slice(0, 10).map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="truncate">{task}</span>
                      </div>
                    ))}
                    {tasks.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{tasks.length - 10} משימות נוספות...
                      </p>
                    )}
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      בחר תאריך
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                      {availableDates.slice(0, 14).map((date) => (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={cn(
                            'p-2 rounded-lg text-xs text-center transition-all',
                            selectedDate === date
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          )}
                        >
                          {format(new Date(date), 'EEE d/M', { locale: he })}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      עדיפות
                    </label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as Priority[]).map((priority) => (
                        <button
                          key={priority}
                          onClick={() => setSelectedPriority(priority)}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                            selectedPriority === priority
                              ? priority === 'high'
                                ? 'bg-destructive text-destructive-foreground'
                                : priority === 'medium'
                                ? 'bg-warning text-warning-foreground'
                                : 'bg-success text-success-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          )}
                        >
                          {priority === 'high' ? 'גבוהה' : priority === 'medium' ? 'בינונית' : 'נמוכה'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Import Button */}
                  <Button
                    onClick={handleConfirmImport}
                    disabled={isImporting || !selectedDate}
                    className="w-full"
                  >
                    {isImporting ? 'מייבא...' : `ייבא ${tasks.length} משימות`}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
