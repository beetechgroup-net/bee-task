import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import { X } from "lucide-react";

export const TaskForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const { addTask, projects } = useStore();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [type, setType] = useState("Development");
  const [isCustomType, setIsCustomType] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title, projectId, type);
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
            padding: "0.75rem",
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
              padding: "0.5rem",
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
                padding: "0.5rem",
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
                padding: "0.5rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-bg-tertiary)",
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
              }}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={!title.trim()}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            padding: "0.75rem",
            borderRadius: "var(--radius-sm)",
            fontWeight: 500,
            marginTop: "0.5rem",
          }}
        >
          Add Task
        </button>
      </div>
    </form>
  );
};
