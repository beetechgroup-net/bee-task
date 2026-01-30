import React from "react";
import { Play, Pause, Trash2, Clock, Check, RotateCcw } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import type { Task } from "../../types";
import { formatDuration } from "../../utils/dateUtils";

export const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const { toggleTaskLog, deleteTask, updateTask, getTaskDuration, projects } =
    useStore();
  const [showHistory, setShowHistory] = React.useState(false);

  const isActive = task.logs.some((l) => !l.endTime);
  const duration = getTaskDuration(task);
  const project = projects.find((p) => p.id === task.projectId);

  const handleToggleStatus = () => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    updateTask(task.id, { status: nextStatus });
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create":
        return "Created";
      case "start":
        return "Started";
      case "pause":
        return "Paused";
      case "finish":
        return "Finished";
      case "restart":
        return "Restarted";
      default:
        return action;
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        padding: "1rem",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-bg-tertiary)",
        marginBottom: "0.75rem",
        opacity: task.status === "done" ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
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
            <span style={{ color: "var(--color-text-secondary)" }}>•</span>
            <span
              style={{
                color:
                  task.priority === "high"
                    ? "var(--color-accent)"
                    : task.priority === "medium"
                      ? "#eab308"
                      : "var(--color-text-secondary)",
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              {task.priority || "low"}
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
          onClick={handleToggleStatus}
          style={{
            backgroundColor:
              task.status === "done"
                ? "var(--color-bg-tertiary)"
                : "var(--color-success)",
            color:
              task.status === "done" ? "var(--color-text-secondary)" : "#fff",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            opacity: task.status === "done" ? 0.7 : 1,
          }}
          title={task.status === "done" ? "Reopen task" : "Finish task"}
        >
          {task.status === "done" ? (
            <RotateCcw size={18} />
          ) : (
            <Check size={18} />
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

      {task.history && task.history.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-secondary)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            {showHistory ? "Hide History" : "Show History"}
          </button>

          {showHistory && (
            <div
              style={{
                marginTop: "0.5rem",
                paddingTop: "0.5rem",
                borderTop: "1px solid var(--color-bg-tertiary)",
                fontSize: "0.85rem",
                color: "var(--color-text-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              {task.history
                .slice()
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((h) => (
                  <div
                    key={h.id}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>{getActionLabel(h.action)}</span>
                    <span
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        opacity: 0.8,
                      }}
                    >
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
