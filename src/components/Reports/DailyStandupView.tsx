import React from "react";
import { useStore } from "../../context/StoreContext";
import { isToday, isYesterday, formatDuration } from "../../utils/dateUtils";
import { CheckCircle, Circle, Clock } from "lucide-react";
import type { Task } from "../../types";

export const DailyStandupView: React.FC<{ tasks?: Task[] }> = ({
  tasks: propTasks,
}) => {
  const { tasks: storeTasks, getTaskDuration } = useStore();
  const tasks = propTasks || storeTasks;

  const workedOnYesterday = (task: Task) => {
    return task.logs.some((log) => isYesterday(log.startTime));
  };

  const yesterdayTasks = tasks.filter((task) => workedOnYesterday(task));

  const workedOnToday = (task: Task) => {
    return task.logs.some(
      (log) => isToday(log.startTime) || (log.endTime && isToday(log.endTime)),
    );
  };

  // Actually simpler:
  // Did: In Progress OR (Done & WorkedToday)
  // Will Do: Todo

  const whatIDidTodayTasks = tasks.filter(
    (task) =>
      task.status === "in-progress" ||
      (task.status === "done" && workedOnToday(task)),
  );

  const whatIWillDoTodayTasks = tasks.filter((task) => task.status === "todo");

  const renderTaskItem = (task: Task, context: "yesterday" | "today") => {
    const duration = getTaskDuration(task);

    return (
      <div
        key={task.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem",
          backgroundColor: "var(--color-bg-tertiary)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "0.5rem",
        }}
      >
        {task.status === "done" ? (
          <CheckCircle size={18} color="var(--color-success)" />
        ) : (
          <Circle size={18} color="var(--color-text-secondary)" />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.95rem" }}>{task.title}</div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-secondary)",
              marginTop: "0.1rem",
            }}
          >
            {task.type} •{" "}
            {context === "yesterday"
              ? "Worked on"
              : task.status === "done"
                ? "Completed"
                : "Planned"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.85rem",
            color: "var(--color-text-secondary)",
          }}
        >
          <Clock size={14} />
          {formatDuration(duration)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "800px" }}>
      <h2
        style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem" }}
      >
        Daily Standup
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "var(--color-text-secondary)",
            }}
          >
            What I did yesterday
          </h3>
          <div
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              padding: "1.5rem",
              borderRadius: "var(--radius-lg)",
            }}
          >
            {yesterdayTasks.length > 0 ? (
              yesterdayTasks.map((t) => renderTaskItem(t, "yesterday"))
            ) : (
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  fontStyle: "italic",
                }}
              >
                No activity recorded yesterday.
              </p>
            )}
          </div>
        </div>

        <div>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "var(--color-accent)",
            }}
          >
            What I did today
          </h3>
          <div
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              padding: "1.5rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-accent)",
              marginBottom: "2rem",
            }}
          >
            {whatIDidTodayTasks.length > 0 ? (
              whatIDidTodayTasks.map((t) => renderTaskItem(t, "today"))
            ) : (
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  fontStyle: "italic",
                }}
              >
                No work tracked yet today.
              </p>
            )}
          </div>

          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "var(--color-text-primary)",
            }}
          >
            What I will do today
          </h3>
          <div
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              padding: "1.5rem",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--color-bg-tertiary)",
            }}
          >
            {whatIWillDoTodayTasks.length > 0 ? (
              whatIWillDoTodayTasks.map((t) => renderTaskItem(t, "today"))
            ) : (
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  fontStyle: "italic",
                }}
              >
                No pending tasks for today.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
