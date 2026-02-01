import { motion } from 'framer-motion';
import { useTasks } from '@/hooks/useTasks';
import { Header } from '@/components/Header';
import { DayCard } from '@/components/DayCard';
import { BacklogSection } from '@/components/BacklogSection';
import { TodaySummary } from '@/components/TodaySummary';
import { format, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';

const Index = () => {
  const {
    daysTasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTaskPriority,
    getProgress,
    getDayInfo,
    backlogTasks,
    moveTaskToDate,
    todayTasks,
  } = useTasks();

  const today = startOfDay(new Date());
  const todayDayName = format(today, 'EEEE', { locale: he });
  const todayFormattedDate = format(today, 'd בMMMM', { locale: he });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <Header daysTasks={daysTasks} backlogCount={backlogTasks.length} />

        {/* Today's Summary */}
        <TodaySummary 
          tasks={todayTasks} 
          dayName={todayDayName} 
          formattedDate={todayFormattedDate} 
        />

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
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
