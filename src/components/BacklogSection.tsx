import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Clock, ArrowRight } from 'lucide-react';
import { Task, DayTasks, Priority } from '@/types/task';
import { TaskItem } from './TaskItem';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface BacklogTask extends Task {
  originalDate: string;
}

interface BacklogSectionProps {
  backlogTasks: BacklogTask[];
  onToggleTask: (date: string, taskId: string) => void;
  onDeleteTask: (date: string, taskId: string) => void;
  onUpdatePriority: (date: string, taskId: string, priority: Priority) => void;
  onMoveToDate: (fromDate: string, taskId: string, toDate: string) => void;
  availableDates: string[];
}

export const BacklogSection = ({
  backlogTasks,
  onToggleTask,
  onDeleteTask,
  onUpdatePriority,
  onMoveToDate,
  availableDates,
}: BacklogSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [movingTask, setMovingTask] = useState<string | null>(null);

  if (backlogTasks.length === 0) return null;

  const formatOriginalDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, d בMMMM', { locale: he });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 mb-6 bg-destructive/5 border-2 border-destructive/20"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/10">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">משימות לא הושלמו</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                {backlogTasks.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">משימות מימים קודמים שטרם בוצעו</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Tasks */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {backlogTasks.map((task) => (
              <div key={task.id} className="relative">
                <div className="flex items-center gap-2 mb-1 px-3">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    מתאריך: {formatOriginalDate(task.originalDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <TaskItem
                      task={task}
                      onToggle={() => onToggleTask(task.originalDate, task.id)}
                      onDelete={() => onDeleteTask(task.originalDate, task.id)}
                      onPriorityChange={(priority) =>
                        onUpdatePriority(task.originalDate, task.id, priority)
                      }
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMovingTask(movingTask === task.id ? null : task.id)}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                      )}
                      title="העבר ליום אחר"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {movingTask === task.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute left-0 top-full mt-1 z-10 bg-background border border-border rounded-xl shadow-lg p-2 min-w-[180px]"
                        >
                          <p className="text-xs text-muted-foreground mb-2 px-2">העבר ליום:</p>
                          <div className="max-h-[200px] overflow-y-auto space-y-1">
                            {availableDates.slice(0, 7).map((date) => (
                              <button
                                key={date}
                                onClick={() => {
                                  onMoveToDate(task.originalDate, task.id, date);
                                  setMovingTask(null);
                                }}
                                className="w-full text-right px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                              >
                                {format(new Date(date), 'EEEE, d/M', { locale: he })}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
