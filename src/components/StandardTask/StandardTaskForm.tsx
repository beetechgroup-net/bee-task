import React, { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import { X } from "lucide-react";
import type { StandardTask } from "../../types";

interface StandardTaskFormProps {
  onCancel: () => void;
  initialValues?: StandardTask;
}

export const StandardTaskForm: React.FC<StandardTaskFormProps> = ({
  onCancel,
  initialValues,
}) => {
  const { addStandardTask, updateStandardTask, projects } = useStore();
  const [title, setTitle] = useState(initialValues?.title || "");
  const [projectId, setProjectId] = useState(
    initialValues?.projectId || projects[0]?.id || "",
  );
  const [type, setType] = useState(initialValues?.type || "Development");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    initialValues?.priority || "medium",
  );
  const [intervals, setIntervals] = useState<
    { startTime: string; endTime: string }[]
  >([{ startTime: "", endTime: "" }]);
  const [isCustomType, setIsCustomType] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title);
      setProjectId(initialValues.projectId || projects[0]?.id || "");
      setType(initialValues.type || "Development");
      setPriority(initialValues.priority || "medium");

      if (initialValues.intervals && initialValues.intervals.length > 0) {
        setIntervals(initialValues.intervals);
      } else if (initialValues.startTime && initialValues.endTime) {
        // Backward compatibility
        setIntervals([
          {
            startTime: initialValues.startTime,
            endTime: initialValues.endTime,
          },
        ]);
      }
    }
  }, [initialValues, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validIntervals = intervals.filter((i) => i.startTime && i.endTime);
    if (!title.trim() || validIntervals.length === 0) return;

    // Validate times
    for (const interval of validIntervals) {
      if (interval.endTime <= interval.startTime) {
        alert("End time must be after start time for all intervals");
        return;
      }
    }

    const taskData = {
      title,
      projectId,
      type,
      priority,
      intervals: validIntervals,
      // Clear deprecated fields if we want, or keep first one for compat?
      // Let's just use intervals.
    };

    if (initialValues) {
      updateStandardTask(initialValues.id, taskData);
    } else {
      addStandardTask(taskData);
    }
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        padding: "1.5rem",
        borderRadius: "var(--radius-lg)",
        border: "2px solid var(--color-accent)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-accent)",
          }}
        >
          {initialValues ? "Edit Standard Task" : "New Standard Task"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          style={{ color: "var(--color-text-secondary)" }}
        >
          <X size={18} />
        </button>
      </div>

      <input
        autoFocus
        type="text"
        placeholder="Task Title (e.g., Daily)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-bg-tertiary)",
          backgroundColor: "var(--color-bg-primary)",
          color: "var(--color-text-primary)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {intervals.map((interval, index) => (
          <div
            key={index}
            style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Start Time
              </label>
              <input
                type="time"
                value={interval.startTime}
                onChange={(e) => {
                  const newIntervals = [...intervals];
                  newIntervals[index].startTime = e.target.value;
                  setIntervals(newIntervals);
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem",
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
                  marginBottom: "0.25rem",
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                End Time
              </label>
              <input
                type="time"
                value={interval.endTime}
                onChange={(e) => {
                  const newIntervals = [...intervals];
                  newIntervals[index].endTime = e.target.value;
                  setIntervals(newIntervals);
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-bg-tertiary)",
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const newIntervals = intervals.filter((_, i) => i !== index);
                setIntervals(
                  newIntervals.length
                    ? newIntervals
                    : [{ startTime: "", endTime: "" }],
                );
              }}
              style={{
                marginBottom: "0.8rem",
                color: "var(--color-text-secondary)",
              }}
            >
              <X size={18} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setIntervals([...intervals, { startTime: "", endTime: "" }])
          }
          style={{
            alignSelf: "flex-start",
            fontSize: "0.85rem",
            color: "var(--color-accent)",
            fontWeight: 500,
            marginBottom: "1rem",
          }}
        >
          + Add another interval
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={{
            flex: 1,
            padding: "0.75rem",
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
              padding: "0.75rem",
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
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-bg-tertiary)",
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-primary)",
            }}
          />
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "flex-end",
          marginTop: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "0.5rem 1rem",
            color: "var(--color-text-secondary)",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={
            !title.trim() || !intervals.some((i) => i.startTime && i.endTime)
          }
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-accent)",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            opacity:
              !title.trim() || !intervals.some((i) => i.startTime && i.endTime)
                ? 0.5
                : 1,
          }}
        >
          {initialValues ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
};
