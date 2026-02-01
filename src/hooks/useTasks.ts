import { useState, useEffect } from 'react';
import { Task, DayTasks, Priority } from '@/types/task';
import { format, addDays, startOfDay, isToday, isBefore } from 'date-fns';
import { he } from 'date-fns/locale';

const STORAGE_KEY = 'daily-tasks';
const DAYS_AHEAD = 7;

const generateId = () => Math.random().toString(36).substring(2, 9);

const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

const getHebrewDayName = (date: Date) => format(date, 'EEEE', { locale: he });

const getFormattedDate = (date: Date) => format(date, 'd בMMMM', { locale: he });

export const useTasks = () => {
  const [daysTasks, setDaysTasks] = useState<DayTasks[]>([]);

  // Initialize days
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let existingTasks: Record<string, Task[]> = {};
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        existingTasks = parsed.reduce((acc: Record<string, Task[]>, day: DayTasks) => {
          acc[day.date] = day.tasks;
          return acc;
        }, {});
      } catch (e) {
        console.error('Failed to parse stored tasks');
      }
    }

    const today = startOfDay(new Date());
    const days: DayTasks[] = [];

    for (let i = 0; i < DAYS_AHEAD; i++) {
      const date = addDays(today, i);
      const dateKey = formatDateKey(date);
      days.push({
        date: dateKey,
        tasks: existingTasks[dateKey] || [],
      });
    }

    setDaysTasks(days);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (daysTasks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(daysTasks));
    }
  }, [daysTasks]);

  const addTask = (date: string, text: string, priority: Priority = 'medium') => {
    const newTask: Task = {
      id: generateId(),
      text,
      completed: false,
      priority,
      createdAt: new Date().toISOString(),
    };

    setDaysTasks(prev =>
      prev.map(day =>
        day.date === date
          ? { ...day, tasks: [...day.tasks, newTask] }
          : day
      )
    );
  };

  const toggleTask = (date: string, taskId: string) => {
    setDaysTasks(prev =>
      prev.map(day =>
        day.date === date
          ? {
              ...day,
              tasks: day.tasks.map(task =>
                task.id === taskId
                  ? { ...task, completed: !task.completed }
                  : task
              ),
            }
          : day
      )
    );
  };

  const deleteTask = (date: string, taskId: string) => {
    setDaysTasks(prev =>
      prev.map(day =>
        day.date === date
          ? { ...day, tasks: day.tasks.filter(task => task.id !== taskId) }
          : day
      )
    );
  };

  const updateTaskPriority = (date: string, taskId: string, priority: Priority) => {
    setDaysTasks(prev =>
      prev.map(day =>
        day.date === date
          ? {
              ...day,
              tasks: day.tasks.map(task =>
                task.id === taskId ? { ...task, priority } : task
              ),
            }
          : day
      )
    );
  };

  const getProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const getDayInfo = (dateString: string) => {
    const date = new Date(dateString);
    return {
      dayName: getHebrewDayName(date),
      formattedDate: getFormattedDate(date),
      isToday: isToday(date),
      isPast: isBefore(date, startOfDay(new Date())),
    };
  };

  return {
    daysTasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTaskPriority,
    getProgress,
    getDayInfo,
  };
};
