export type Priority = 'high' | 'medium' | 'low';

export type Tag = 'work' | 'studies' | 'personal' | 'urgent';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  date?: string;
  subtasks?: SubTask[];
}

export interface DayTasks {
  date: string;
  tasks: Task[];
}

export const TAG_CONFIG: Record<Tag, { label: string; color: string; icon: string }> = {
  work: { label: 'עבודה', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: '💼' },
  studies: { label: 'לימודים', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: '📚' },
  personal: { label: 'אישי', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: '🏠' },
  urgent: { label: 'דחוף', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: '🔥' },
};
