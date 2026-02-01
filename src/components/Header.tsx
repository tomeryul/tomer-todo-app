import { motion } from 'framer-motion';
import { CheckCircle2, ListTodo, Flame } from 'lucide-react';
import { DayTasks } from '@/types/task';

interface HeaderProps {
  daysTasks: DayTasks[];
}

export const Header = ({ daysTasks }: HeaderProps) => {
  const totalTasks = daysTasks.reduce((acc, day) => acc + day.tasks.length, 0);
  const completedTasks = daysTasks.reduce(
    (acc, day) => acc + day.tasks.filter((t) => t.completed).length,
    0
  );
  const streak = calculateStreak(daysTasks);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8 pt-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4"
      >
        <ListTodo className="w-8 h-8 text-primary-foreground" />
      </motion.div>

      <h1 className="text-3xl font-bold text-foreground mb-2">המשימות שלי</h1>
      <p className="text-muted-foreground mb-6">נהל את המשימות שלך בקלות ויעילות</p>

      <div className="flex items-center justify-center gap-4">
        <StatBadge
          icon={<ListTodo className="w-4 h-4" />}
          label="סה״כ משימות"
          value={totalTasks}
        />
        <StatBadge
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="הושלמו"
          value={completedTasks}
          variant="success"
        />
        <StatBadge
          icon={<Flame className="w-4 h-4" />}
          label="רצף ימים"
          value={streak}
          variant="accent"
        />
      </div>
    </motion.header>
  );
};

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'accent';
}

const StatBadge = ({ icon, label, value, variant = 'default' }: StatBadgeProps) => {
  const variants = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    accent: 'bg-accent/10 text-accent',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl ${variants[variant]}`}
    >
      {icon}
      <div className="text-right">
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs opacity-80">{label}</p>
      </div>
    </motion.div>
  );
};

const calculateStreak = (daysTasks: DayTasks[]): number => {
  let streak = 0;
  for (const day of daysTasks) {
    if (day.tasks.length === 0) continue;
    const allCompleted = day.tasks.every((t) => t.completed);
    if (allCompleted && day.tasks.length > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};
