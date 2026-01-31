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

export interface StandardTaskInterval {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface StandardTask {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  type?: TaskType;
  priority?: Priority;
  intervals?: StandardTaskInterval[]; // Optional for backward compatibility during dev, but ideally required
  // Deprecated fields (optional to keep for a moment or remove)
  startTime?: string;
  endTime?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string; // For nested folders if needed
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string; // HTML string or JSON string from Tiptap
  folderId: string;
  createdAt: number;
  updatedAt: number;
}
