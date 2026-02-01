import { motion } from 'framer-motion';
import { Sun, Target, Clock, CheckCircle2 } from 'lucide-react';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface TodaySummaryProps {
  tasks: Task[];
  dayName: string;
  formattedDate: string;
}

export const TodaySummary = ({ tasks, dayName, formattedDate }: TodaySummaryProps) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter((t) => t.priority === 'high' && !t.completed);

  if (totalTasks === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 mb-6 gradient-primary text-primary-foreground"
      >
        <div className="flex items-center gap-3 mb-2">
          <Sun className="w-6 h-6" />
          <h2 className="text-xl font-bold">בוקר טוב!</h2>
        </div>
        <p className="opacity-90">אין לך משימות להיום - {dayName}, {formattedDate}</p>
        <p className="text-sm opacity-75 mt-1">לחץ על + כדי להוסיף משימה חדשה</p>
      </motion.div>
    );
  }

  const progress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6 mb-6 gradient-primary text-primary-foreground"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sun className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold">סיכום היום</h2>
            <p className="text-sm opacity-75">{dayName}, {formattedDate}</p>
          </div>
        </div>
        <div className="text-left">
          <div className="text-3xl font-bold">{progress}%</div>
          <p className="text-xs opacity-75">הושלם</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryStat
          icon={<Target className="w-4 h-4" />}
          value={totalTasks}
          label="סה״כ משימות"
        />
        <SummaryStat
          icon={<CheckCircle2 className="w-4 h-4" />}
          value={completedTasks}
          label="הושלמו"
        />
        <SummaryStat
          icon={<Clock className="w-4 h-4" />}
          value={pendingTasks}
          label="ממתינות"
        />
      </div>

      {/* High Priority Alert */}
      {highPriorityTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-3 rounded-xl bg-white/20 backdrop-blur-sm"
        >
          <p className="text-sm font-medium">
            ⚠️ יש לך {highPriorityTasks.length} משימות בעדיפות גבוהה שעדיין לא הושלמו
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

interface SummaryStatProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

const SummaryStat = ({ icon, value, label }: SummaryStatProps) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
    <div className="flex items-center justify-center gap-1 mb-1">
      {icon}
      <span className="text-xl font-bold">{value}</span>
    </div>
    <p className="text-xs opacity-75">{label}</p>
  </div>
);
