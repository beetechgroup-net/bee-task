import type { Task } from "../types";

export const getActiveTask = (tasks: Task[]): Task | undefined => {
  const activeTasks = tasks.filter(
    (t) => t.status === "in-progress" || t.logs.some((l) => !l.endTime),
  );

  if (activeTasks.length === 0) return undefined;

  return activeTasks.sort((a, b) => {
    // 1. Prioritize tasks with currently running active logs
    const aActiveLog = a.logs.find((l) => !l.endTime);
    const bActiveLog = b.logs.find((l) => !l.endTime);

    if (aActiveLog && !bActiveLog) return -1; // a comes first
    if (!aActiveLog && bActiveLog) return 1; // b comes first

    // 2. If both have active logs, sort by start time of that log (newest first)
    if (aActiveLog && bActiveLog) {
      return bActiveLog.startTime - aActiveLog.startTime;
    }

    // 3. If neither has active logs (just in-progress status?), sort by most recent log end time?
    // Or just most recent log start time overall?
    // Let's go with most recent log start time.
    const aLastLogStart =
      a.logs.length > 0 ? Math.max(...a.logs.map((l) => l.startTime)) : 0;
    const bLastLogStart =
      b.logs.length > 0 ? Math.max(...b.logs.map((l) => l.startTime)) : 0;

    if (aLastLogStart !== bLastLogStart) {
      return bLastLogStart - aLastLogStart;
    }

    // 4. Fallback to createdAt
    return b.createdAt - a.createdAt;
  })[0];
};
