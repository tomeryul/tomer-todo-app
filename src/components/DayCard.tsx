import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CalendarDays, Sparkles } from 'lucide-react';
import { DayTasks, Priority, Tag } from '@/types/task';
import { TaskItem } from './TaskItem';
import { Progress } from '@/components/ui/progress';
import { useCompletionSound } from '@/hooks/useCompletionSound';
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
  onUpdateTag?: (taskId: string, tag: Tag | null) => void;
  onMoveTask?: (taskId: string, toDate: string) => void;
  availableDates?: string[];
  onAddSubtask?: (taskId: string, text: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  onUpdateSubtaskText?: (taskId: string, subtaskId: string, newText: string) => void;
  onUpdateTaskText?: (taskId: string, newText: string) => void;
  onReorderTask?: (taskId: string, newPosition: number) => void;
}

export const DayCard = ({
  dayTasks,
  dayInfo,
  progress,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdatePriority,
  onUpdateTag,
  onMoveTask,
  availableDates = [],
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateSubtaskText,
  onUpdateTaskText,
  onReorderTask,
}: DayCardProps) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const tasksContainerRef = useRef<HTMLDivElement>(null);
  const { playCompletionSound } = useCompletionSound();

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

  const handleToggleWithSound = (taskId: string) => {
    const task = dayTasks.tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      playCompletionSound();
    }
    onToggleTask(taskId);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTaskId && index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedTaskId && onReorderTask) {
      onReorderTask(draggedTaskId, targetIndex);
    }
    setDraggedTaskId(null);
    setDragOverIndex(null);
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
      <div ref={tasksContainerRef} className="space-y-2">
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
            dayTasks.tasks.map((task, index) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  'transition-all duration-150',
                  dragOverIndex === index && draggedTaskId !== task.id && 'border-t-2 border-primary pt-1',
                  draggedTaskId === task.id && 'opacity-50'
                )}
              >
                <TaskItem
                  task={task}
                  onToggle={() => handleToggleWithSound(task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                  onPriorityChange={(priority) => onUpdatePriority(task.id, priority)}
                  onTagChange={onUpdateTag ? (tag) => onUpdateTag(task.id, tag) : undefined}
                  onMoveToDate={onMoveTask ? (toDate) => onMoveTask(task.id, toDate) : undefined}
                  availableDates={availableDates}
                  currentDate={dayTasks.date}
                  onAddSubtask={onAddSubtask ? (text) => onAddSubtask(task.id, text) : undefined}
                  onToggleSubtask={onToggleSubtask ? (subtaskId) => onToggleSubtask(task.id, subtaskId) : undefined}
                  onDeleteSubtask={onDeleteSubtask ? (subtaskId) => onDeleteSubtask(task.id, subtaskId) : undefined}
                  onUpdateSubtaskText={onUpdateSubtaskText ? (subtaskId, newText) => onUpdateSubtaskText(task.id, subtaskId, newText) : undefined}
                  onUpdateText={onUpdateTaskText ? (newText) => onUpdateTaskText(task.id, newText) : undefined}
                  isDragging={draggedTaskId === task.id}
                />
              </div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
