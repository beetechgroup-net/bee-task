import React from "react";
import type { Task, Project } from "../../types";

interface CompactTaskCardProps {
  task: Task;
  project?: Project;
  onClick?: () => void;
  showRunningBadge?: boolean;
}

export const CompactTaskCard: React.FC<CompactTaskCardProps> = ({
  task,
  project,
  onClick,
  showRunningBadge = true,
}) => {
  const isTaskActive = task.status === "in-progress";

  const getTaskDurationTotal = (task: Task) => {
    return task.logs.reduce((acc, log) => {
      if (log.endTime) {
        return acc + log.duration;
      }
      return acc + (Date.now() - log.startTime);
    }, 0);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "var(--color-bg-primary)",
        padding: "1rem",
        borderRadius: "var(--radius-md)",
        borderLeft: `4px solid ${project?.color || "var(--color-text-secondary)"}`,
        boxShadow: isTaskActive ? "0 0 0 2px var(--color-accent)" : "none",
        position: "relative",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {showRunningBadge && isTaskActive && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "10px",
            backgroundColor: "var(--color-accent)",
            color: "white",
            fontSize: "0.65rem",
            fontWeight: "bold",
            padding: "2px 8px",
            borderRadius: "10px",
            textTransform: "uppercase",
          }}
        >
          Running
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            padding: "0.2rem 0.6rem",
            borderRadius: "1rem",
            backgroundColor: "var(--color-bg-tertiary)",
            color: "var(--color-text-secondary)",
          }}
        >
          {project?.name || "Unknown Project"}
        </span>
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--color-text-secondary)",
          }}
        >
          {formatDuration(getTaskDurationTotal(task))}
        </span>
      </div>
      <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>
        {task.title}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "0.5rem",
        }}
      >
        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--color-text-secondary)",
          }}
        >
          {task.status} • {task.type}
        </div>
      </div>
    </div>
  );
};
