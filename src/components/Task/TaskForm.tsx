import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import { X } from "lucide-react";

export const TaskForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const { addTask, projects } = useStore();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [type, setType] = useState("Development");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isCustomType, setIsCustomType] = useState(false);
  const [isPastTask, setIsPastTask] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isPastTask) {
      if (!startTime || !endTime) return;
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (end <= start) {
        alert("End time must be after start time");
        return;
      }

      addTask(title, projectId, type, priority, {
        startTime: start,
        endTime: end,
      });
    } else {
      addTask(title, projectId, type, priority);
    }
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        padding: "1rem",
        borderRadius: "var(--radius-md)",
        marginBottom: "1rem",
        border: "1px solid var(--color-bg-tertiary)",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>New Task</h3>
        <button
          type="button"
          onClick={onCancel}
          style={{ color: "var(--color-text-secondary)" }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input
          autoFocus
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            height: "46px",
            padding: "0 0.75rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-bg-tertiary)",
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
            fontSize: "1rem",
          }}
        />

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{
              flex: 1,
              height: "46px",
              padding: "0 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-bg-tertiary)",
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-primary)",
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {!isCustomType ? (
            <select
              value={type}
              onChange={(e) => {
                if (e.target.value === "custom") setIsCustomType(true);
                else setType(e.target.value);
              }}
              style={{
                flex: 1,
                height: "46px",
                padding: "0 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-bg-tertiary)",
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
              }}
            >
              <option value="Development">Development</option>
              <option value="Meeting">Meeting</option>
              <option value="PR Review">PR Review</option>
              <option value="custom">+ Custom...</option>
            </select>
          ) : (
            <input
              type="text"
              placeholder="Type..."
              value={type}
              onChange={(e) => setType(e.target.value)}
              onBlur={() => !type && setIsCustomType(false)}
              style={{
                flex: 1,
                height: "46px",
                padding: "0 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-bg-tertiary)",
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
              }}
            />
          )}

          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as "low" | "medium" | "high")
            }
            style={{
              flex: 0.8,
              height: "46px",
              padding: "0 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-bg-tertiary)",
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-primary)",
            }}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            id="isPastTask"
            checked={isPastTask}
            onChange={(e) => setIsPastTask(e.target.checked)}
            style={{ accentColor: "var(--color-accent)" }}
          />
          <label htmlFor="isPastTask" style={{ fontSize: "0.9rem" }}>
            Log work done in the past
          </label>
        </div>

        {isPastTask && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  marginBottom: "0.25rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-bg-tertiary)",
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  marginBottom: "0.25rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                End Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-bg-tertiary)",
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!title.trim() || (isPastTask && (!startTime || !endTime))}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            padding: "0.75rem",
            borderRadius: "var(--radius-sm)",
            fontWeight: 500,
            marginTop: "0.5rem",
            opacity:
              !title.trim() || (isPastTask && (!startTime || !endTime))
                ? 0.5
                : 1,
          }}
        >
          Add Task
        </button>
      </div>
    </form>
  );
};
