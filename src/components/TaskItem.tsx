import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, Flag, ArrowLeftRight, Plus, ChevronDown, ChevronUp, Timer, Tag } from 'lucide-react';
import { Task, Priority, SubTask, Tag as TagType, TAG_CONFIG } from '@/types/task';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onPriorityChange: (priority: Priority) => void;
  onTagChange?: (tag: TagType | null) => void;
  onMoveToDate?: (toDate: string) => void;
  availableDates?: string[];
  currentDate?: string;
  onAddSubtask?: (subtaskText: string) => void;
  onToggleSubtask?: (subtaskId: string) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onStartPomodoro?: () => void;
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


export const TaskItem = ({ 
  task, 
  onToggle, 
  onDelete, 
  onPriorityChange,
  onTagChange,
  onMoveToDate,
  availableDates = [],
  currentDate,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onStartPomodoro,
}: TaskItemProps) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const cyclePriority = () => {
    const priorities: Priority[] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(task.priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    onPriorityChange(priorities[nextIndex]);
  };

  const filteredDates = availableDates.filter(date => date !== currentDate).slice(0, 7);
  
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const hasSubtasks = subtasks.length > 0;
  const subtaskProgress = hasSubtasks ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const handleAddSubtask = () => {
    if (newSubtaskText.trim() && onAddSubtask) {
      onAddSubtask(newSubtaskText.trim());
      setNewSubtaskText('');
      setIsAddingSubtask(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 50 }}
      layout
      className={cn(
        'rounded-lg transition-all duration-200 border group',
        'bg-background/50 hover:bg-background border-transparent hover:border-border',
        task.completed && 'opacity-60'
      )}
    >
      {/* Main Task Content */}
      <div className="p-3">
        {/* First Row: Checkbox + Task Text */}
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-300 mt-0.5',
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

          <p
            className={cn(
              'flex-1 text-sm leading-relaxed transition-all duration-200',
              task.completed && 'line-through text-muted-foreground'
            )}
          >
            {task.text}
          </p>
        </div>

        {/* Second Row: Actions & Info */}
        <div className="flex items-center gap-2 mt-3 mr-9 flex-wrap">
          {/* Subtask Progress */}
          {hasSubtasks && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {completedSubtasks}/{subtasks.length}
              </span>
            </div>
          )}

          {/* Tag Badge */}
          {task.tag && TAG_CONFIG[task.tag] && (
            <span
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
                TAG_CONFIG[task.tag].color
              )}
            >
              <span>{TAG_CONFIG[task.tag].icon}</span>
              <span>{TAG_CONFIG[task.tag].label}</span>
            </span>
          )}

          {/* Priority Button */}
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

          {/* Tag Selector */}
          {onTagChange && (
            <div className="relative">
              <button
                onClick={() => setShowTagMenu(!showTagMenu)}
                className={cn(
                  'p-1.5 rounded-md transition-all flex items-center gap-1 text-xs',
                  'text-muted-foreground hover:text-primary hover:bg-primary/10',
                  showTagMenu && 'text-primary bg-primary/10'
                )}
                title="שנה תיוג"
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">תיוג</span>
              </button>
              <AnimatePresence>
                {showTagMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute left-0 top-full mt-1 z-20 bg-background border border-border rounded-xl shadow-lg p-2 min-w-[140px]"
                  >
                    <p className="text-xs text-muted-foreground mb-2 px-2">בחר תיוג:</p>
                    <div className="space-y-1">
                      {task.tag && (
                        <button
                          onClick={() => {
                            onTagChange(null);
                            setShowTagMenu(false);
                          }}
                          className="w-full text-right px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        >
                          ❌ הסר תיוג
                        </button>
                      )}
                      {(Object.entries(TAG_CONFIG) as [TagType, typeof TAG_CONFIG[TagType]][]).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => {
                            onTagChange(key);
                            setShowTagMenu(false);
                          }}
                          className={cn(
                            'w-full text-right px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2',
                            task.tag === key ? 'bg-primary/10' : 'hover:bg-muted'
                          )}
                        >
                          <span>{config.icon}</span>
                          <span>{config.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Subtasks Toggle */}
          {onAddSubtask && (
            <button
              onClick={() => setShowSubtasks(!showSubtasks)}
              className={cn(
                'p-1.5 rounded-md transition-all text-xs flex items-center gap-1',
                'text-muted-foreground hover:text-primary hover:bg-primary/10',
                showSubtasks && 'text-primary bg-primary/10'
              )}
              title="תתי משימות"
            >
              {showSubtasks ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>משימות משנה</span>
            </button>
          )}

          {/* Pomodoro Button */}
          {onStartPomodoro && (
            <button
              onClick={onStartPomodoro}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center gap-1 text-xs"
              title="התחל טיימר"
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">טיימר</span>
            </button>
          )}

          {/* Move Button */}
          {onMoveToDate && filteredDates.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                className={cn(
                  'p-1.5 rounded-md transition-all flex items-center gap-1 text-xs',
                  'text-muted-foreground hover:text-primary hover:bg-primary/10',
                  showMoveMenu && 'text-primary bg-primary/10'
                )}
                title="העבר ליום אחר"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">העבר</span>
              </button>
              <AnimatePresence>
                {showMoveMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute left-0 top-full mt-1 z-20 bg-background border border-border rounded-xl shadow-lg p-2 min-w-[180px]"
                  >
                    <p className="text-xs text-muted-foreground mb-2 px-2">העבר ליום:</p>
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                      {filteredDates.map((date) => (
                        <button
                          key={date}
                          onClick={() => {
                            onMoveToDate(date);
                            setShowMoveMenu(false);
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
          )}

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all mr-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtasks Section */}
      <AnimatePresence>
        {showSubtasks && onAddSubtask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border/50 px-3 pb-3"
          >
            <div className="pt-2 pr-9 space-y-2">
              {/* Existing Subtasks */}
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 group/sub">
                  <button
                    onClick={() => onToggleSubtask?.(subtask.id)}
                    className={cn(
                      'flex-shrink-0 w-4 h-4 rounded border transition-all',
                      'flex items-center justify-center',
                      subtask.completed
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30 hover:border-primary'
                    )}
                  >
                    {subtask.completed && (
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    )}
                  </button>
                  <span
                    className={cn(
                      'flex-1 text-xs',
                      subtask.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {subtask.text}
                  </span>
                  <button
                    onClick={() => onDeleteSubtask?.(subtask.id)}
                    className="opacity-0 group-hover/sub:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Subtask */}
              {isAddingSubtask ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubtask();
                      if (e.key === 'Escape') {
                        setIsAddingSubtask(false);
                        setNewSubtaskText('');
                      }
                    }}
                    onBlur={() => {
                      if (!newSubtaskText.trim()) setIsAddingSubtask(false);
                    }}
                    placeholder="תת-משימה חדשה..."
                    className="flex-1 px-2 py-1 text-xs rounded bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingSubtask(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  הוסף תת-משימה
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
