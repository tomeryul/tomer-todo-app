export type Priority = 'high' | 'medium' | 'low';

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
  subtasks?: SubTask[];
}

export interface DayTasks {
  date: string;
  tasks: Task[];
}
