import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Project,
  Task,
  TaskType,
  StandardTask,
  TaskHistory,
} from "../types";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useFirestoreSync } from "../hooks/useFirestoreSync";
import { useAuth } from "./AuthContext";

interface StoreContextType {
  tasks: Task[];
  projects: Project[];

  addTask: (
    title: string,
    projectId: string,
    type: TaskType,
    priority: "low" | "medium" | "high",
    initialLogs?: { startTime: number; endTime: number }[],
  ) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskLog: (id: string) => void;

  addProject: (name: string, color: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  getTaskDuration: (task: Task) => number;

  standardTasks: StandardTask[];
  addStandardTask: (task: Omit<StandardTask, "id">) => void;
  updateStandardTask: (id: string, updates: Partial<StandardTask>) => void;
  deleteStandardTask: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_PROJECTS: Project[] = [
  { id: "default", name: "General", color: "#94a3b8" },
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);
  const [projects, setProjects] = useLocalStorage<Project[]>(
    "projects",
    DEFAULT_PROJECTS,
  );
  const [standardTasks, setStandardTasks] = useLocalStorage<StandardTask[]>(
    "standardTasks",
    [],
  );

  useEffect(() => {
    console.log(`[StoreContext] Current tasks state:`, tasks.length, "items");
    // console.log(tasks);
  }, [tasks]);

  const { user } = useAuth();
  // Pass user.uid if available. If not, pass null (disable sync) OR pass a flag to use anonymous?
  // Current plan: Segregate by user in database.
  // If user is null, we can opt to NOT sync (local only) or sync to local-ID.
  // User asked to "separando no banco, cada usuario".
  // Let's pass user?.uid. If null, hook will handle it (likely not sync).

  // Sync to Firestore
  useFirestoreSync<Task[]>("tasks", tasks, setTasks, user?.uid);
  useFirestoreSync<Project[]>("projects", projects, setProjects, user?.uid);
  useFirestoreSync<StandardTask[]>(
    "standardTasks",
    standardTasks,
    setStandardTasks,
    user?.uid,
  );

  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const hasActive = tasks.some((t) => t.logs.some((l) => !l.endTime));
      if (hasActive) {
        setTick((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const addTask = (
    title: string,
    projectId: string,
    type: string,
    priority: "low" | "medium" | "high",
    initialLogs?: { startTime: number; endTime: number }[],
  ) => {
    const isPastTask = !!initialLogs && initialLogs.length > 0;

    // Generate logs
    const logs =
      isPastTask && initialLogs
        ? initialLogs.map((log) => ({
            id: uuidv4(),
            startTime: log.startTime,
            endTime: log.endTime,
            duration: log.endTime - log.startTime,
          }))
        : [];

    // Generate history based on logs
    const history: TaskHistory[] = [];
    if (isPastTask && logs.length > 0) {
      // Create event at first log start
      history.push({
        id: uuidv4(),
        action: "create",
        timestamp: logs[0].startTime,
      });

      // Removed unused loop

      // Finish event at last log end
      const lastLog = logs[logs.length - 1];
      if (lastLog.endTime) {
        history.push({
          id: uuidv4(),
          action: "finish",
          timestamp: lastLog.endTime,
        });
      }
    } else {
      history.push({
        id: uuidv4(),
        action: "create",
        timestamp: Date.now(),
      });
    }

    const newTask: Task = {
      id: uuidv4(),
      title,
      projectId,
      type,
      priority,
      status: isPastTask ? "done" : "todo",
      logs,
      history,
      createdAt: isPastTask && logs.length > 0 ? logs[0].startTime : Date.now(),
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prevTasks) => {
      const now = Date.now();
      return prevTasks.map((t) => {
        if (t.id !== id) return t;

        // Apply updates
        const updatedTask = { ...t, ...updates };

        // If status changed to done, stop any active logs
        if (updates.status === "done") {
          const activeLogIndex = updatedTask.logs.findIndex((l) => !l.endTime);
          if (activeLogIndex !== -1) {
            const newLogs = [...updatedTask.logs];
            newLogs[activeLogIndex].endTime = now;
            newLogs[activeLogIndex].duration =
              now - newLogs[activeLogIndex].startTime;
            updatedTask.logs = newLogs;
          }
          updatedTask.history = [
            ...(updatedTask.history || []),
            { id: uuidv4(), action: "finish", timestamp: now },
          ];
        } else if (updates.status === "todo" && t.status === "done") {
          updatedTask.history = [
            ...(updatedTask.history || []),
            { id: uuidv4(), action: "restart", timestamp: now },
          ];
        }
        return updatedTask;
      });
    });
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const toggleTaskLog = (id: string) => {
    setTasks((prevTasks) => {
      const now = Date.now();
      return prevTasks.map((task) => {
        if (task.id !== id) {
          const activeLogIndex = task.logs.findIndex((l) => !l.endTime);
          if (activeLogIndex !== -1) {
            const newLogs = [...task.logs];
            newLogs[activeLogIndex].endTime = now;
            newLogs[activeLogIndex].duration =
              now - newLogs[activeLogIndex].startTime;
            return { ...task, logs: newLogs };
          }
          return task;
        }

        const activeLogIndex = task.logs.findIndex((l) => !l.endTime);
        if (activeLogIndex !== -1) {
          const newLogs = [...task.logs];
          newLogs[activeLogIndex].endTime = now;
          newLogs[activeLogIndex].duration =
            now - newLogs[activeLogIndex].startTime;
          return {
            ...task,
            logs: newLogs,
            history: [
              ...(task.history || []),
              { id: uuidv4(), action: "pause", timestamp: now },
            ],
          };
        } else {
          return {
            ...task,
            status: "in-progress",
            logs: [...task.logs, { id: uuidv4(), startTime: now, duration: 0 }],
            history: [
              ...(task.history || []),
              { id: uuidv4(), action: "start", timestamp: now },
            ],
          };
        }
      });
    });
  };

  const addProject = (name: string, color: string) => {
    setProjects([...projects, { id: uuidv4(), name, color }]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProject = (id: string) => {
    // Optionally remove tasks associated with this project or reassign them?
    // For now, let's keep it simple and just delete the project.
    // Tasks might show "Unknown Project" which we handled in TaskCard.
    setProjects(projects.filter((p) => p.id !== id));
  };

  const getTaskDuration = (task: Task) => {
    return task.logs.reduce((acc, log) => {
      if (log.endTime) {
        return acc + log.duration;
      }
      return acc + (Date.now() - log.startTime);
    }, 0);
  };

  const addStandardTask = (task: Omit<StandardTask, "id">) => {
    setStandardTasks([...standardTasks, { ...task, id: uuidv4() }]);
  };

  const updateStandardTask = (id: string, updates: Partial<StandardTask>) => {
    setStandardTasks(
      standardTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const deleteStandardTask = (id: string) => {
    setStandardTasks(standardTasks.filter((t) => t.id !== id));
  };

  return (
    <StoreContext.Provider
      value={{
        tasks,
        projects,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskLog,
        addProject,
        updateProject,
        deleteProject,
        getTaskDuration,
        standardTasks,
        addStandardTask,
        updateStandardTask,
        deleteStandardTask,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
