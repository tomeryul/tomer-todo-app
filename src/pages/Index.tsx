import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarPlus, LogOut, Loader2 } from 'lucide-react';
import { useSupabaseTasks } from '@/hooks/useSupabaseTasks';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { DayCard } from '@/components/DayCard';
import { BacklogSection } from '@/components/BacklogSection';
import { TodaySummary } from '@/components/TodaySummary';
import { MultiDayTaskModal } from '@/components/MultiDayTaskModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { Button } from '@/components/ui/button';
import { format, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const [isMultiDayModalOpen, setIsMultiDayModalOpen] = useState(false);
  const [pomodoroTask, setPomodoroTask] = useState<string | null>(null);

  const {
    daysTasks,
    loading: tasksLoading,
    addTask,
    addTaskToMultipleDays,
    toggleTask,
    deleteTask,
    updateTaskPriority,
    getProgress,
    getDayInfo,
    backlogTasks,
    moveTaskToDate,
    todayTasks,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useSupabaseTasks(user?.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const today = startOfDay(new Date());
  const todayDayName = format(today, 'EEEE', { locale: he });
  const todayFormattedDate = format(today, 'd בMMMM', { locale: he });

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

        {/* Today's Summary */}
        <TodaySummary 
          tasks={todayTasks} 
          dayName={todayDayName} 
          formattedDate={todayFormattedDate} 
        />

        {/* Multi-day add button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsMultiDayModalOpen(true)}
          className={cn(
            'w-full mb-6 p-4 rounded-2xl border-2 border-dashed border-primary/30',
            'flex items-center justify-center gap-3',
            'text-primary hover:bg-primary/5 hover:border-primary/50 transition-all',
            'group'
          )}
        >
          <CalendarPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">הוסף משימה לכמה ימים</span>
        </motion.button>

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
                onMoveTask={(taskId, toDate) => moveTaskToDate(dayTask.date, taskId, toDate)}
                availableDates={daysTasks.map((d) => d.date)}
                onAddSubtask={(taskId, text) => addSubtask(dayTask.date, taskId, text)}
                onToggleSubtask={(taskId, subtaskId) => toggleSubtask(dayTask.date, taskId, subtaskId)}
                onDeleteSubtask={(taskId, subtaskId) => deleteSubtask(dayTask.date, taskId, subtaskId)}
                onStartPomodoro={(taskName) => setPomodoroTask(taskName)}
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

      {/* Pomodoro Timer */}
      <PomodoroTimer
        isOpen={pomodoroTask !== null}
        onClose={() => setPomodoroTask(pomodoroTask === null ? '' : null)}
        taskName={pomodoroTask || undefined}
      />
    </div>
  );
};

export default Index;
