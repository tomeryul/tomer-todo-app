import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, DayTasks, Priority, SubTask, Tag } from '@/types/task';
import { format, addDays, startOfDay, isToday, isBefore, getDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';

const DAYS_AHEAD = 60;

const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
const getHebrewDayName = (date: Date) => format(date, 'EEEE', { locale: he });
const getFormattedDate = (date: Date) => format(date, 'd בMMMM', { locale: he });

interface DbTask {
  id: string;
  user_id: string;
  date: string;
  text: string;
  completed: boolean;
  priority: string;
  tag: string | null;
  created_at: string;
  updated_at: string;
}

interface DbSubtask {
  id: string;
  task_id: string;
  user_id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export const useSupabaseTasks = (userId: string | undefined) => {
  const [daysTasks, setDaysTasks] = useState<DayTasks[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate days structure
  const generateDays = useCallback((tasks: Task[]): DayTasks[] => {
    const today = startOfDay(new Date());
    const days: DayTasks[] = [];
    const tasksByDate: Record<string, Task[]> = {};

    // Group tasks by date
    tasks.forEach(task => {
      if (!tasksByDate[task.date!]) {
        tasksByDate[task.date!] = [];
      }
      tasksByDate[task.date!].push(task);
    });

    for (let i = 0; i < DAYS_AHEAD; i++) {
      const date = addDays(today, i);
      const dateKey = formatDateKey(date);
      days.push({
        date: dateKey,
        tasks: tasksByDate[dateKey] || [],
      });
    }

    return days;
  }, []);

  // Fetch tasks and subtasks from database
  const fetchTasks = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch subtasks
      const { data: subtasksData, error: subtasksError } = await supabase
        .from('subtasks')
        .select('*')
        .eq('user_id', userId);

      if (subtasksError) throw subtasksError;

      // Map subtasks to tasks
      const subtasksByTaskId: Record<string, SubTask[]> = {};
      (subtasksData as DbSubtask[] || []).forEach(subtask => {
        if (!subtasksByTaskId[subtask.task_id]) {
          subtasksByTaskId[subtask.task_id] = [];
        }
        subtasksByTaskId[subtask.task_id].push({
          id: subtask.id,
          text: subtask.text,
          completed: subtask.completed,
        });
      });

      // Convert to Task format
      const tasks: Task[] = (tasksData as DbTask[] || []).map(task => ({
        id: task.id,
        text: task.text,
        completed: task.completed,
        priority: task.priority as Priority,
        createdAt: task.created_at,
        date: task.date,
        tag: task.tag as Tag | null,
        subtasks: subtasksByTaskId[task.id] || [],
      }));

      setDaysTasks(generateDays(tasks));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('שגיאה בטעינת המשימות');
    } finally {
      setLoading(false);
    }
  }, [userId, generateDays]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (date: string, text: string, priority: Priority = 'medium', tag: Tag | null = null) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          date,
          text,
          priority,
          tag,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        text: data.text,
        completed: data.completed,
        priority: data.priority as Priority,
        createdAt: data.created_at,
        date: data.date,
        tag: data.tag as Tag | null,
        subtasks: [],
      };

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? { ...day, tasks: [...day.tasks, newTask] }
            : day
        )
      );
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('שגיאה בהוספת משימה');
    }
  };

  const addMultipleTasks = async (date: string, texts: string[], priority: Priority = 'medium') => {
    if (!userId) return;

    try {
      const tasksToInsert = texts.map(text => ({
        user_id: userId,
        date,
        text,
        priority,
        completed: false,
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (error) throw error;

      const newTasks = (data as DbTask[]).map(task => ({
        id: task.id,
        text: task.text,
        completed: task.completed,
        priority: task.priority as Priority,
        createdAt: task.created_at,
        date: task.date,
        tag: task.tag as Tag | null,
        subtasks: [],
      }));

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? { ...day, tasks: [...day.tasks, ...newTasks] }
            : day
        )
      );

      toast.success(`${texts.length} משימות נוספו בהצלחה`);
    } catch (error) {
      console.error('Error adding tasks:', error);
      toast.error('שגיאה בהוספת משימות');
    }
  };

  const addTaskToMultipleDays = async (dates: string[], text: string, priority: Priority = 'medium') => {
    if (!userId) return;

    try {
      const tasksToInsert = dates.map(date => ({
        user_id: userId,
        date,
        text,
        priority,
        completed: false,
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (error) throw error;

      const newTasks = (data as DbTask[]).map(task => ({
        id: task.id,
        text: task.text,
        completed: task.completed,
        priority: task.priority as Priority,
        createdAt: task.created_at,
        date: task.date,
        tag: task.tag as Tag | null,
        subtasks: [],
      }));

      setDaysTasks(prev =>
        prev.map(day => {
          const tasksForDay = newTasks.filter(t => t.date === day.date);
          if (tasksForDay.length > 0) {
            return { ...day, tasks: [...day.tasks, ...tasksForDay] };
          }
          return day;
        })
      );
    } catch (error) {
      console.error('Error adding tasks:', error);
      toast.error('שגיאה בהוספת משימות');
    }
  };

  const toggleTask = async (date: string, taskId: string) => {
    const day = daysTasks.find(d => d.date === date);
    const task = day?.tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId);

      if (error) throw error;

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? {
                ...day,
                tasks: day.tasks.map(t =>
                  t.id === taskId ? { ...t, completed: !t.completed } : t
                ),
              }
            : day
        )
      );
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('שגיאה בעדכון משימה');
    }
  };

  const deleteTask = async (date: string, taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? { ...day, tasks: day.tasks.filter(t => t.id !== taskId) }
            : day
        )
      );
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('שגיאה במחיקת משימה');
    }
  };

  const updateTaskPriority = async (date: string, taskId: string, priority: Priority) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority })
        .eq('id', taskId);

      if (error) throw error;

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? {
                ...day,
                tasks: day.tasks.map(t =>
                  t.id === taskId ? { ...t, priority } : t
                ),
              }
            : day
        )
      );
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('שגיאה בעדכון עדיפות');
    }
  };

  const updateTaskTag = async (date: string, taskId: string, tag: Tag | null) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ tag })
        .eq('id', taskId);

      if (error) throw error;

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? {
                ...day,
                tasks: day.tasks.map(t =>
                  t.id === taskId ? { ...t, tag } : t
                ),
              }
            : day
        )
      );
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('שגיאה בעדכון תיוג');
    }
  };

  const moveTaskToDate = async (fromDate: string, taskId: string, toDate: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ date: toDate })
        .eq('id', taskId);

      if (error) throw error;

      let movedTask: Task | undefined;

      setDaysTasks(prev =>
        prev.map(day => {
          if (day.date === fromDate) {
            const task = day.tasks.find(t => t.id === taskId);
            if (task) {
              movedTask = { ...task, date: toDate };
            }
            return { ...day, tasks: day.tasks.filter(t => t.id !== taskId) };
          }
          if (day.date === toDate && movedTask) {
            return { ...day, tasks: [...day.tasks, movedTask] };
          }
          return day;
        })
      );
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('שגיאה בהעברת משימה');
    }
  };

  const addSubtask = async (date: string, taskId: string, text: string) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          task_id: taskId,
          user_id: userId,
          text,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      const newSubtask: SubTask = {
        id: data.id,
        text: data.text,
        completed: data.completed,
      };

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? {
                ...day,
                tasks: day.tasks.map(task =>
                  task.id === taskId
                    ? { ...task, subtasks: [...(task.subtasks || []), newSubtask] }
                    : task
                ),
              }
            : day
        )
      );
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast.error('שגיאה בהוספת תת-משימה');
    }
  };

  const toggleSubtask = async (date: string, taskId: string, subtaskId: string) => {
    const day = daysTasks.find(d => d.date === date);
    const task = day?.tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks?.find(s => s.id === subtaskId);
    if (!subtask) return;

    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed: !subtask.completed })
        .eq('id', subtaskId);

      if (error) throw error;

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? {
                ...day,
                tasks: day.tasks.map(task =>
                  task.id === taskId
                    ? {
                        ...task,
                        subtasks: (task.subtasks || []).map(s =>
                          s.id === subtaskId ? { ...s, completed: !s.completed } : s
                        ),
                      }
                    : task
                ),
              }
            : day
        )
      );
    } catch (error) {
      console.error('Error toggling subtask:', error);
      toast.error('שגיאה בעדכון תת-משימה');
    }
  };

  const deleteSubtask = async (date: string, taskId: string, subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? {
                ...day,
                tasks: day.tasks.map(task =>
                  task.id === taskId
                    ? {
                        ...task,
                        subtasks: (task.subtasks || []).filter(s => s.id !== subtaskId),
                      }
                    : task
                ),
              }
            : day
        )
      );
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast.error('שגיאה במחיקת תת-משימה');
    }
  };

  const updateSubtaskText = async (date: string, taskId: string, subtaskId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ text: newText })
        .eq('id', subtaskId);

      if (error) throw error;

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? {
                ...day,
                tasks: day.tasks.map(task =>
                  task.id === taskId
                    ? {
                        ...task,
                        subtasks: (task.subtasks || []).map(s =>
                          s.id === subtaskId ? { ...s, text: newText } : s
                        ),
                      }
                    : task
                ),
              }
            : day
        )
      );
    } catch (error) {
      console.error('Error updating subtask text:', error);
      toast.error('שגיאה בעדכון תת-משימה');
    }
  };

  const getProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;

    let totalItems = 0;
    let completedItems = 0;

    tasks.forEach(task => {
      const subtasks = task.subtasks || [];
      if (subtasks.length > 0) {
        totalItems += subtasks.length;
        completedItems += subtasks.filter(s => s.completed).length;
      } else {
        totalItems += 1;
        completedItems += task.completed ? 1 : 0;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
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

  const getBacklogTasks = () => {
    const today = startOfDay(new Date());
    const backlog: Array<Task & { originalDate: string }> = [];

    daysTasks.forEach(day => {
      if (isBefore(new Date(day.date), today)) {
        day.tasks
          .filter(task => !task.completed)
          .forEach(task => {
            backlog.push({ ...task, originalDate: day.date });
          });
      }
    });

    return backlog;
  };

  const getTodayTasks = () => {
    const todayKey = formatDateKey(startOfDay(new Date()));
    const today = daysTasks.find(d => d.date === todayKey);
    return today?.tasks || [];
  };

  const updateTaskText = async (date: string, taskId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ text: newText })
        .eq('id', taskId);

      if (error) throw error;

      setDaysTasks(prev =>
        prev.map(day =>
          day.date === date
            ? {
                ...day,
                tasks: day.tasks.map(t =>
                  t.id === taskId ? { ...t, text: newText } : t
                ),
              }
            : day
        )
      );
    } catch (error) {
      console.error('Error updating task text:', error);
      toast.error('שגיאה בעדכון המשימה');
    }
  };

  const reorderTasks = async (date: string, taskId: string, newPosition: number) => {
    const day = daysTasks.find(d => d.date === date);
    if (!day) return;

    const tasks = [...day.tasks];
    const oldIndex = tasks.findIndex(t => t.id === taskId);
    if (oldIndex === -1) return;

    const [movedTask] = tasks.splice(oldIndex, 1);
    tasks.splice(newPosition, 0, movedTask);

    // Optimistic update
    setDaysTasks(prev =>
      prev.map(d =>
        d.date === date ? { ...d, tasks } : d
      )
    );

    // Update positions in database
    try {
      const updates = tasks.map((task, index) => 
        supabase
          .from('tasks')
          .update({ position: index })
          .eq('id', task.id)
      );
      
      await Promise.all(updates);
    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast.error('שגיאה בסידור המשימות');
      // Revert on error
      fetchTasks();
    }
  };

  const addRecurringTask = async (text: string, dayOfWeek: number, priority: Priority = 'medium') => {
    if (!userId) return;

    const today = startOfDay(new Date());
    const datesToAdd: string[] = [];

    // Find all dates within DAYS_AHEAD that match the given day of week
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const date = addDays(today, i);
      if (getDay(date) === dayOfWeek) {
        datesToAdd.push(formatDateKey(date));
      }
    }

    if (datesToAdd.length === 0) return;

    try {
      const tasksToInsert = datesToAdd.map((date, index) => ({
        user_id: userId,
        date,
        text,
        priority,
        completed: false,
        position: index,
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (error) throw error;

      const newTasks = (data as any[]).map(task => ({
        id: task.id,
        text: task.text,
        completed: task.completed,
        priority: task.priority as Priority,
        createdAt: task.created_at,
        date: task.date,
        tag: task.tag as Tag | null,
        subtasks: [],
      }));

      setDaysTasks(prev =>
        prev.map(day => {
          const tasksForDay = newTasks.filter(t => t.date === day.date);
          if (tasksForDay.length > 0) {
            return { ...day, tasks: [...day.tasks, ...tasksForDay] };
          }
          return day;
        })
      );

      toast.success(`נוספו ${datesToAdd.length} משימות קבועות`);
    } catch (error) {
      console.error('Error adding recurring tasks:', error);
      toast.error('שגיאה בהוספת משימות קבועות');
    }
  };

  const backlogTasks = getBacklogTasks();
  const todayTasks = getTodayTasks();

  return {
    daysTasks,
    loading,
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
    getProgress,
    getDayInfo,
    backlogTasks,
    moveTaskToDate,
    todayTasks,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateSubtaskText,
  };
};
