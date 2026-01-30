export type TaskStatus = "todo" | "in-progress" | "done";

export type TaskType = "Meeting" | "Development" | "PR Review" | string;

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface TaskLog {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number; // in milliseconds
}

export interface TaskHistory {
  id: string;
  action: "create" | "start" | "pause" | "finish" | "restart";
  timestamp: number;
}

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  priority: Priority;
  type: TaskType;
  status: TaskStatus;
  logs: TaskLog[];
  history?: TaskHistory[];
  createdAt: number;
}
