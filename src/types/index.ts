export interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  createdAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}