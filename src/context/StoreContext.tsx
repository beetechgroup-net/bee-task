import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Task, TaskType, TaskHistory } from "../types";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useFirestoreSync } from "../hooks/useFirestoreSync";
import { useAuth } from "./AuthContext";
import { useOrganizations } from "../hooks/useOrganizations";
import type { OrganizationProject } from "../types";

// Extended window interface for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface StoreContextType {
  tasks: Task[];

  addTask: (
    title: string,
    description: string,
    projectId: string,
    type: TaskType,
    priority: "low" | "medium" | "high",
    initialLogs?: { startTime: number; endTime?: number }[],
  ) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskLog: (id: string) => void;

  getTaskDuration: (task: Task) => number;

  projects: OrganizationProject[];

  // Version control
  checkVersionBanner: (currentVersion: string) => boolean;
  dismissVersionBanner: (currentVersion: string) => void;
  resetVersionSeen: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);

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

  const { organizations } = useOrganizations();
  const projects = React.useMemo(() => {
    const allProjects: OrganizationProject[] = [];
    organizations.forEach((org) => {
      const isMember = org.members?.some((m) => m.userId === user?.uid);
      if (isMember && org.projects) {
        allProjects.push(...org.projects);
      }
    });
    return allProjects;
  }, [organizations, user]);

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
    description: string,
    projectId: string,
    type: TaskType,
    priority: "low" | "medium" | "high",
    initialLogs?: { startTime: number; endTime?: number }[],
  ) => {
    const isPastTask = !!initialLogs && initialLogs.length > 0;

    // Generate logs
    const logs =
      isPastTask && initialLogs
        ? initialLogs.map((log) => ({
            id: uuidv4(),
            startTime: log.startTime,
            endTime: log.endTime,
            duration: log.endTime ? log.endTime - log.startTime : 0,
          }))
        : [];

    // Check if any log is active (no endTime)
    const hasActiveLog = logs.some((l) => !l.endTime);

    // Generate history based on logs
    const history: TaskHistory[] = [];
    if (isPastTask && logs.length > 0) {
      // Create event at first log start
      history.push({
        id: uuidv4(),
        action: "create",
        timestamp: logs[0].startTime,
      });

      // Finish event at last log end IF it has an end time
      const lastLog = logs[logs.length - 1];
      if (lastLog.endTime) {
        history.push({
          id: uuidv4(),
          action: "finish",
          timestamp: lastLog.endTime,
        });
      } else {
        // If last log is active, we might want a "start" event for it?
        // But "create" at start time covers it for now.
        // Actually, if it's active, we should probably add a "start" event
        // corresponding to the active log's start time if it's different/same?
        // The first log start time is the creation time.
        // If there are multiple logs and the last one is active:
        if (logs.length > 1) {
          history.push({
            id: uuidv4(),
            action: "start",
            timestamp: lastLog.startTime,
          });
        } else {
          // Only one log and it's active. "create" is enough?
          // Maybe explicitly "start" too?
          history.push({
            id: uuidv4(),
            action: "start",
            timestamp: lastLog.startTime,
          });
        }
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
      description,
      projectId,
      type,
      priority,
      status: hasActiveLog ? "in-progress" : isPastTask ? "done" : "todo",
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

  const getTaskDuration = (task: Task) => {
    return task.logs.reduce((acc, log) => {
      if (log.endTime) {
        return acc + log.duration;
      }
      return acc + (Date.now() - log.startTime);
    }, 0);
  };

  const checkVersionBanner = (currentVersion: string) => {
    const lastSeen = localStorage.getItem("bee-task-last-seen-version");
    // Show if never seen (null) or if last seen version is different from current
    return lastSeen !== currentVersion;
  };

  const dismissVersionBanner = (currentVersion: string) => {
    localStorage.setItem("bee-task-last-seen-version", currentVersion);
  };

  const resetVersionSeen = () => {
    localStorage.removeItem("bee-task-last-seen-version");
    window.location.reload();
  };

  return (
    <StoreContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskLog,
        getTaskDuration,
        projects,
        checkVersionBanner,
        dismissVersionBanner,
        resetVersionSeen,
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
