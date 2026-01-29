import React from "react";
import { Play, Pause, Trash2, Clock, CheckCircle } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import type { Task } from "../../types";
import { formatDuration } from "../../utils/dateUtils";

export const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const { toggleTaskLog, deleteTask, updateTask, getTaskDuration, projects } =
    useStore();

  const isActive = task.logs.some((l) => !l.endTime);
  const duration = getTaskDuration(task);
  const project = projects.find((p) => p.id === task.projectId);

  const handleToggleStatus = () => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    updateTask(task.id, { status: nextStatus });
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        padding: "1rem",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-bg-tertiary)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "0.75rem",
        opacity: task.status === "done" ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <button
        onClick={handleToggleStatus}
        style={{
          color:
            task.status === "done"
              ? "var(--color-success)"
              : "var(--color-text-secondary)",
        }}
      >
        <CheckCircle
          size={20}
          fill={task.status === "done" ? "currentColor" : "none"}
        />
      </button>

      <div style={{ flex: 1 }}>
        <h4
          style={{
            fontSize: "1rem",
            fontWeight: 500,
            textDecoration: task.status === "done" ? "line-through" : "none",
          }}
        >
          {task.title}
        </h4>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            fontSize: "0.8rem",
            marginTop: "0.25rem",
          }}
        >
          <span
            style={{
              color: project ? project.color : "var(--color-text-secondary)",
              fontWeight: 500,
            }}
          >
            {project?.name || "Unknown Project"}
          </span>
          <span style={{ color: "var(--color-text-secondary)" }}>•</span>
          <span style={{ color: "var(--color-text-secondary)" }}>
            {task.type}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          backgroundColor: "var(--color-bg-primary)",
          padding: "0.25rem 0.75rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-bg-tertiary)",
        }}
      >
        <Clock size={14} color="var(--color-text-secondary)" />
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600,
            color: isActive
              ? "var(--color-text-accent)"
              : "var(--color-text-secondary)",
          }}
        >
          {formatDuration(duration)}
        </span>
      </div>

      <button
        onClick={() => toggleTaskLog(task.id)}
        style={{
          backgroundColor: isActive
            ? "var(--color-bg-tertiary)"
            : "var(--color-accent)",
          color: isActive ? "var(--color-text-accent)" : "#fff",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
        title={isActive ? "Pause" : "Start"}
      >
        {isActive ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" style={{ marginLeft: "2px" }} />
        )}
      </button>

      <button
        onClick={() => deleteTask(task.id)}
        style={{
          color: "var(--color-text-secondary)",
          opacity: 0.5,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        title="Delete"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};
