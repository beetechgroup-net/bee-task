import React, { useMemo } from "react";
import { format, isSameMonth } from "date-fns";
import { useStore } from "../../context/StoreContext";
import { CalendarCheck, Clock } from "lucide-react";
import type { TaskHistory, Task } from "../../types";

export const MonthlyCompletedTasks: React.FC<{ tasks?: Task[] }> = ({
  tasks: propTasks,
}) => {
  const { tasks: storeTasks, getTaskDuration } = useStore();
  const tasks = propTasks || storeTasks;

  const completedTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((task) => {
        if (task.status !== "done") return false;

        // Determine completion time
        // Prefer history 'finish' event, fallback to last log end time
        const finishEvent = [...(task.history || [])]
          .reverse()
          .find((h: TaskHistory) => h.action === "finish");

        if (finishEvent) {
          return isSameMonth(new Date(finishEvent.timestamp), now);
        }

        // If no history event, check logs (not ideal but fallback)
        const lastLog = task.logs[task.logs.length - 1];
        if (lastLog?.endTime) {
          return isSameMonth(new Date(lastLog.endTime), now);
        }

        return false;
      })
      .sort((a, b) => {
        // Sort by completion time, descending
        const getEndTime = (t: typeof a) => {
          const finishEvent = [...(t.history || [])]
            .reverse()
            .find((h: TaskHistory) => h.action === "finish");
          if (finishEvent) return finishEvent.timestamp;
          const lastLog = t.logs[t.logs.length - 1];
          return lastLog?.endTime || 0;
        };
        return getEndTime(b) - getEndTime(a);
      });
  }, [tasks]);

  if (completedTasks.length === 0) {
    return null;
  }

  return (
    <div>
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          marginBottom: "1rem",
          color: "var(--color-text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <CalendarCheck size={20} className="text-accent" />
        Completed This Month ({completedTasks.length})
      </h3>
      <div
        style={{
          backgroundColor: "var(--color-bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-bg-tertiary)",
          overflow: "hidden",
        }}
      >
        {completedTasks.map((task, index) => {
          const finishEvent = [...(task.history || [])]
            .reverse()
            .find((h: TaskHistory) => h.action === "finish");
          const lastLog = task.logs[task.logs.length - 1];
          const completedAt = finishEvent
            ? finishEvent.timestamp
            : lastLog?.endTime || 0;

          const duration = getTaskDuration(task);
          const hours = Math.floor(duration / 3600000);
          const minutes = Math.floor((duration % 3600000) / 60000);
          const durationString = `${hours}h ${minutes}m`;

          return (
            <div
              key={task.id}
              style={{
                padding: "0.75rem 1rem",
                borderBottom:
                  index !== completedTasks.length - 1
                    ? "1px solid var(--color-bg-tertiary)"
                    : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-accent)",
                    opacity: 0.7,
                  }}
                />
                <span
                  style={{
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {task.title}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    color: "var(--color-text-secondary)",
                    fontSize: "0.85rem",
                  }}
                >
                  <Clock size={14} />
                  <span>{durationString}</span>
                </div>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {format(completedAt, "MMM d, HH:mm")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
