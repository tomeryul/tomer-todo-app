import { motion } from 'framer-motion';
import { Check, Trash2, Flag } from 'lucide-react';
import { Task, Priority } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onPriorityChange: (priority: Priority) => void;
}

const priorityColors: Record<Priority, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  low: 'bg-success/10 text-success border-success/30',
};

const priorityLabels: Record<Priority, string> = {
  high: 'גבוהה',
  medium: 'בינונית',
  low: 'נמוכה',
};

export const TaskItem = ({ task, onToggle, onDelete, onPriorityChange }: TaskItemProps) => {
  const cyclePriority = () => {
    const priorities: Priority[] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(task.priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    onPriorityChange(priorities[nextIndex]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 50 }}
      layout
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
        'bg-background/50 hover:bg-background border border-transparent hover:border-border',
        task.completed && 'opacity-60'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-300',
          'flex items-center justify-center',
          task.completed
            ? 'bg-primary border-primary'
            : 'border-muted-foreground/30 hover:border-primary'
        )}
      >
        {task.completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <Check className="w-3.5 h-3.5 text-primary-foreground" />
          </motion.div>
        )}
      </button>

      <span
        className={cn(
          'flex-1 text-sm transition-all duration-200',
          task.completed && 'line-through text-muted-foreground'
        )}
      >
        {task.text}
      </span>

      <button
        onClick={cyclePriority}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all',
          priorityColors[task.priority]
        )}
      >
        <Flag className="w-3 h-3" />
        {priorityLabels[task.priority]}
      </button>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
