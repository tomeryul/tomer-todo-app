import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarPlus, LogOut, Loader2, FileSpreadsheet, Repeat } from 'lucide-react';
import { useSupabaseTasks } from '@/hooks/useSupabaseTasks';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { DayCard } from '@/components/DayCard';
import { BacklogSection } from '@/components/BacklogSection';
import { MultiDayTaskModal } from '@/components/MultiDayTaskModal';
import { ExcelImportModal } from '@/components/ExcelImportModal';
import { RecurringTaskModal } from '@/components/RecurringTaskModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Priority } from '@/types/task';
import { format, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const [isMultiDayModalOpen, setIsMultiDayModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

  const {
    daysTasks,
    loading: tasksLoading,
    addTask,
    addMultipleTasks,
    addTaskToMultipleDays,
    toggleTask,
    deleteTask,
    updateTaskPriority,
    updateTaskTag,
    updateTaskText,
    reorderTasks,
    addRecurringTask,
    addIntervalRecurringTask,
    getProgress,
    getDayInfo,
    backlogTasks,
    moveTaskToDate,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateSubtaskText,
  } = useSupabaseTasks(user?.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleExcelImport = async (date: string, tasks: string[], priority: Priority) => {
    await addMultipleTasks(date, tasks, priority);
  };

  if (authLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle & Sign Out - Fixed position */}
      <div className="fixed top-4 left-4 z-30 flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="rounded-full"
          title="התנתק"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        <Header daysTasks={daysTasks} backlogCount={backlogTasks.length} />

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setIsMultiDayModalOpen(true)}
            className={cn(
              'flex-1 min-w-[140px] p-4 rounded-2xl border-2 border-dashed border-primary/30',
              'flex items-center justify-center gap-3',
              'text-primary hover:bg-primary/5 hover:border-primary/50 transition-all',
              'group'
            )}
          >
            <CalendarPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">הוסף לכמה ימים</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => setIsRecurringModalOpen(true)}
            className={cn(
              'flex-1 min-w-[140px] p-4 rounded-2xl border-2 border-dashed border-accent/50',
              'flex items-center justify-center gap-3',
              'text-accent-foreground hover:bg-accent/10 hover:border-accent transition-all',
              'group'
            )}
          >
            <Repeat className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">משימה קבועה</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setIsExcelModalOpen(true)}
            className={cn(
              'p-4 rounded-2xl border-2 border-dashed border-success/30',
              'flex items-center justify-center gap-3',
              'text-success hover:bg-success/5 hover:border-success/50 transition-all',
              'group'
            )}
          >
            <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium hidden sm:inline">ייבוא Excel</span>
          </motion.button>
        </div>

        {/* Backlog Section */}
        <BacklogSection
          backlogTasks={backlogTasks}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onUpdatePriority={updateTaskPriority}
          onMoveToDate={moveTaskToDate}
          availableDates={daysTasks.map((d) => d.date)}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {daysTasks.map((dayTask, index) => (
            <motion.div
              key={dayTask.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * Math.min(index, 10) }}
            >
              <DayCard
                dayTasks={dayTask}
                dayInfo={getDayInfo(dayTask.date)}
                progress={getProgress(dayTask.tasks)}
                onAddTask={(text, priority) => addTask(dayTask.date, text, priority)}
                onToggleTask={(taskId) => toggleTask(dayTask.date, taskId)}
                onDeleteTask={(taskId) => deleteTask(dayTask.date, taskId)}
                onUpdatePriority={(taskId, priority) =>
                  updateTaskPriority(dayTask.date, taskId, priority)
                }
                onUpdateTag={(taskId, tag) => updateTaskTag(dayTask.date, taskId, tag)}
                onMoveTask={(taskId, toDate) => moveTaskToDate(dayTask.date, taskId, toDate)}
                availableDates={daysTasks.map((d) => d.date)}
                onAddSubtask={(taskId, text) => addSubtask(dayTask.date, taskId, text)}
                onToggleSubtask={(taskId, subtaskId) => toggleSubtask(dayTask.date, taskId, subtaskId)}
                onDeleteSubtask={(taskId, subtaskId) => deleteSubtask(dayTask.date, taskId, subtaskId)}
                onUpdateSubtaskText={(taskId, subtaskId, newText) => updateSubtaskText(dayTask.date, taskId, subtaskId, newText)}
                onUpdateTaskText={(taskId, newText) => updateTaskText(dayTask.date, taskId, newText)}
                onMoveTaskUp={(taskId) => reorderTasks(dayTask.date, taskId, -1)}
                onMoveTaskDown={(taskId) => reorderTasks(dayTask.date, taskId, 1)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Multi-day Task Modal */}
      <MultiDayTaskModal
        isOpen={isMultiDayModalOpen}
        onClose={() => setIsMultiDayModalOpen(false)}
        availableDates={daysTasks.map((d) => d.date)}
        onAddTask={addTaskToMultipleDays}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        availableDates={daysTasks.map((d) => d.date)}
        onImportTasks={handleExcelImport}
      />

      {/* Recurring Task Modal */}
      <RecurringTaskModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onAddRecurringTask={addRecurringTask}
        onAddIntervalRecurringTask={addIntervalRecurringTask}
      />
    </div>
  );
};

export default Index;
