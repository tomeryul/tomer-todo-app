import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CalendarDays, Sparkles } from 'lucide-react';
import { DayTasks, Priority } from '@/types/task';
import { TaskItem } from './TaskItem';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DayCardProps {
  dayTasks: DayTasks;
  dayInfo: {
    dayName: string;
    formattedDate: string;
    isToday: boolean;
    isPast: boolean;
  };
  progress: number;
  onAddTask: (text: string, priority: Priority) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdatePriority: (taskId: string, priority: Priority) => void;
  onMoveTask?: (taskId: string, toDate: string) => void;
  availableDates?: string[];
}

export const DayCard = ({
  dayTasks,
  dayInfo,
  progress,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdatePriority,
  onMoveTask,
  availableDates = [],
}: DayCardProps) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      onAddTask(newTaskText.trim(), 'medium');
      setNewTaskText('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTaskText('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl p-5 transition-all duration-300 shadow-card hover:shadow-card-hover',
        dayInfo.isToday
          ? 'gradient-today border-2 border-primary/20'
          : 'gradient-card border border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              dayInfo.isToday ? 'gradient-primary shadow-glow' : 'bg-muted'
            )}
          >
            <CalendarDays
              className={cn(
                'w-5 h-5',
                dayInfo.isToday ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{dayInfo.dayName}</h3>
              {dayInfo.isToday && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium gradient-primary text-primary-foreground">
                  <Sparkles className="w-3 h-3" />
                  היום
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{dayInfo.formattedDate}</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className={cn(
            'p-2 rounded-xl transition-all duration-200',
            'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground',
            'hover:shadow-glow'
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Progress */}
      {dayTasks.tasks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">התקדמות</span>
            <span className="text-xs font-medium text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Add Task Input */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <input
              autoFocus
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newTaskText.trim()) setIsAdding(false);
              }}
              placeholder="הוסף משימה חדשה..."
              className={cn(
                'w-full px-4 py-3 rounded-xl text-sm',
                'bg-background border border-border',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                'placeholder:text-muted-foreground'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {dayTasks.tasks.length === 0 && !isAdding ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-muted-foreground py-6"
            >
              אין משימות ליום זה
            </motion.p>
          ) : (
            dayTasks.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => onToggleTask(task.id)}
                onDelete={() => onDeleteTask(task.id)}
                onPriorityChange={(priority) => onUpdatePriority(task.id, priority)}
                onMoveToDate={onMoveTask ? (toDate) => onMoveTask(task.id, toDate) : undefined}
                availableDates={availableDates}
                currentDate={dayTasks.date}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
