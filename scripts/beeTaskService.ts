import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskLog, TaskHistory, TaskStatus, TaskType, Priority } from '../src/types/index.js';

export class BeeTaskService {
  private db: admin.firestore.Firestore;
  private userId: string;

  constructor(serviceAccountPath: string, userId: string) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
    }
    this.db = admin.firestore();
    this.userId = userId;
  }

  private getDocRef() {
    return this.db.collection('users').doc(this.userId).collection('data').doc('tasks');
  }

  async getTasks(): Promise<Task[]> {
    const doc = await this.getDocRef().get();
    if (!doc.exists) return [];
    return (doc.data()?.items || []) as Task[];
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await this.getDocRef().set({ items: tasks }, { merge: true });
  }

  async addTask(title: string, description: string = "", projectId: string = "default", type: TaskType = "Development", priority: Priority = "medium"): Promise<Task> {
    const tasks = await this.getTasks();
    const now = Date.now();
    
    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      projectId,
      type,
      priority,
      status: "todo",
      logs: [],
      history: [
        { id: uuidv4(), action: "create", timestamp: now }
      ],
      createdAt: now,
    };

    tasks.push(newTask);
    await this.saveTasks(tasks);
    return newTask;
  }

  async toggleTask(taskId: string): Promise<Task | undefined> {
    const tasks = await this.getTasks();
    const now = Date.now();
    let updatedTask: Task | undefined;

    const newTasks = tasks.map(task => {
      if (task.id !== taskId) {
        // Pause other active tasks
        const activeLogIndex = task.logs.findIndex((l: TaskLog) => !l.endTime);
        if (activeLogIndex !== -1) {
          const newLogs = [...task.logs];
          const log = newLogs[activeLogIndex];
          if (log) {
            log.endTime = now;
            log.duration = now - log.startTime;
          }
          return { ...task, logs: newLogs };
        }
        return task;
      }

      const activeLogIndex = task.logs.findIndex((l: TaskLog) => !l.endTime);
      if (activeLogIndex !== -1) {
        // Pause
        const newLogs = [...task.logs];
        const log = newLogs[activeLogIndex];
        if (log) {
          log.endTime = now;
          log.duration = now - log.startTime;
          updatedTask = {
            ...task,
            logs: newLogs,
            history: [...(task.history || []), { id: uuidv4(), action: "pause", timestamp: now }]
          };
        }
        return updatedTask || task;
      } else {
        // Start
        updatedTask = {
          ...task,
          status: "in-progress",
          logs: [...task.logs, { id: uuidv4(), startTime: now, duration: 0 }],
          history: [
            ...(task.history || []),
            { id: uuidv4(), action: "start", timestamp: now }
          ]
        };
        return updatedTask;
      }
    });

    if (updatedTask) {
      await this.saveTasks(newTasks);
    }
    return updatedTask;
  }

  async finishTask(taskId: string): Promise<Task | undefined> {
    const tasks = await this.getTasks();
    const now = Date.now();
    let updatedTask: Task | undefined;

    const newTasks = tasks.map(task => {
      if (task.id !== taskId) return task;

      const activeLogIndex = task.logs.findIndex((l: TaskLog) => !l.endTime);
      const newLogs = [...task.logs];
      if (activeLogIndex !== -1) {
        const log = newLogs[activeLogIndex];
        if (log) {
          log.endTime = now;
          log.duration = now - log.startTime;
        }
      }

      updatedTask = {
        ...task,
        status: "done",
        logs: newLogs,
        history: [...(task.history || []), { id: uuidv4(), action: "finish", timestamp: now }]
      };
      return updatedTask;
    });

    if (updatedTask) {
      await this.saveTasks(newTasks);
    }
    return updatedTask;
  }
}
