import React, { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import { X, Plus, Trash2 } from "lucide-react";
import type { Task } from "../../types";

interface TaskFormProps {
  onCancel: () => void;
  initialTask?: Task;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onCancel,
  initialTask,
}) => {
  const { addTask, updateTask, projects, standardTasks } = useStore();
  const [title, setTitle] = useState(initialTask?.title || "");
  const [projectId, setProjectId] = useState(
    initialTask?.projectId || projects[0]?.id || "",
  );
  const [type, setType] = useState(initialTask?.type || "Development");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    initialTask?.priority || "medium",
  );
  const [status, setStatus] = useState<"todo" | "in-progress" | "done">(
    initialTask?.status || "todo",
  );
  const [isCustomType, setIsCustomType] = useState(false);

  // Initialize logs/intervals from existing task logs
  const [isPastTask, setIsPastTask] = useState(!!initialTask || false);
  const [intervals, setIntervals] = useState<
    { id?: string; startTime: string; endTime: string }[]
  >(
    initialTask && initialTask.logs.length > 0
      ? initialTask.logs.map((log) => ({
          id: log.id,
          startTime: new Date(log.startTime).toISOString().slice(0, 16), // Format for datetime-local
          endTime: log.endTime
            ? new Date(log.endTime).toISOString().slice(0, 16)
            : "",
        }))
      : [{ startTime: "", endTime: "" }],
  );

  useEffect(() => {
    // If switching to past task mode manually, ensure at least one empty interval
    if (isPastTask && intervals.length === 0) {
      setIntervals([{ startTime: "", endTime: "" }]);
    }
  }, [isPastTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isPastTask) {
      // Validate all intervals that have at least a start time
      // (Allow empty rows if user just added them but didn't fill?) - No, require fill if present or filter out empty
      const validIntervals = intervals.filter((i) => i.startTime); // End time optional? If active?
      // For editing, if end time is missing, it means it's active.
      // But Multi-log assumes mostly past work.
      // Let's enforce full logs for "Past Task" mode usually, unless we support "Start active task with history"

      if (validIntervals.length === 0 && !initialTask) return; // Allow update without logs if removing all?

      const parsedLogs = validIntervals.map((i) => {
        const start = new Date(i.startTime).getTime();
        const end = i.endTime ? new Date(i.endTime).getTime() : undefined;
        return { id: i.id, startTime: start, endTime: end };
      });

      // Validate times
      for (const log of parsedLogs) {
        if (log.endTime && log.endTime <= log.startTime) {
          alert("End time must be after start time for all intervals");
          return;
        }
      }

      if (initialTask) {
        // We need to preserve original logs' IDs if possible, or mapping them
        // The parsedLogs already includes ID if it came from initialTask

        // Construct new logs array
        const newLogs = parsedLogs.map((log) => ({
          id: log.id || crypto.randomUUID(), // Use existing or new ID
          startTime: log.startTime,
          endTime: log.endTime,
          duration: log.endTime ? log.endTime - log.startTime : 0,
        }));

        updateTask(initialTask.id, {
          title,
          projectId,
          type,
          priority,
          status, // Allow status update
          logs: newLogs,
          // We might need to recalc history if logs changed drastically, but StoreContext doesn't expose easy history recalc.
          // For now, let's assume history appends. If we edit past logs, history might be out of sync.
          // User asked to "alterar o historico", which is ambiguous: TaskHistory vs Logs.
          // Usually implies Times.
        });
      } else {
        // Creating new task with history
        // We can't map 'id' here easily in addTask unless we change it again.
        // But `addTask` generates IDs.
        addTask(
          title,
          projectId,
          type,
          priority,
          parsedLogs.map((l) => ({
            startTime: l.startTime,
            endTime: l.endTime || 0,
          })),
        );
        // Note: addTask expects complete logs (start+end) for initialLogs based on my previous edit?
        // Let's check StoreContext. addTask types: initialLogs?: { startTime: number; endTime: number }[]
        // So for NEW tasks, end time is required (or 0?).
      }
    } else {
      if (initialTask) {
        updateTask(initialTask.id, {
          title,
          projectId,
          type,
          priority,
          status,
        });
      } else {
        addTask(title, projectId, type, priority);
      }
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
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>
          {initialTask ? "Edit Task" : "New Task"}
        </h3>
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

        {standardTasks.length > 0 && (
          <select
            onChange={(e) => {
              const task = standardTasks.find((t) => t.id === e.target.value);
              if (task) {
                setTitle(task.title);
                if (task.projectId) setProjectId(task.projectId);
                if (task.type) setType(task.type);
                if (task.priority) setPriority(task.priority);

                const today = new Date().toISOString().split("T")[0];

                // Handle intervals
                if (task.intervals && task.intervals.length > 0) {
                  const newIntervals = task.intervals.map((i) => ({
                    startTime: `${today}T${i.startTime}`,
                    endTime: `${today}T${i.endTime}`,
                  }));
                  setIntervals(newIntervals);
                } else if (task.startTime && task.endTime) {
                  // Backward compatibility for dev state
                  setIntervals([
                    {
                      startTime: `${today}T${task.startTime}`,
                      endTime: `${today}T${task.endTime}`,
                    },
                  ]);
                }

                setIsPastTask(true);
              }
            }}
            style={{
              width: "100%",
              height: "36px",
              padding: "0 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px dashed var(--color-accent)",
              backgroundColor: "transparent",
              color: "var(--color-accent)",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            <option value="">Load Standard Task...</option>
            {standardTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        )}

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

          {initialTask && (
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "todo" | "in-progress" | "done")
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
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          )}
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
            {initialTask ? "Edit Work Logs" : "Log work done in the past"}
          </label>
        </div>

        {isPastTask && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {intervals.map((interval, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-end",
                }}
              >
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
                    value={interval.startTime}
                    onChange={(e) => {
                      const newIntervals = [...intervals];
                      newIntervals[index].startTime = e.target.value;
                      setIntervals(newIntervals);
                    }}
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
                    value={interval.endTime}
                    onChange={(e) => {
                      const newIntervals = [...intervals];
                      newIntervals[index].endTime = e.target.value;
                      setIntervals(newIntervals);
                    }}
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
                {/* Only allow removing if > 1 or just clear it? Allow adding more rows */}
                <button
                  type="button"
                  onClick={() => {
                    const newIntervals = intervals.filter(
                      (_, i) => i !== index,
                    );
                    setIntervals(
                      newIntervals.length
                        ? newIntervals
                        : [{ startTime: "", endTime: "" }],
                    );
                  }}
                  style={{
                    marginBottom: "0.5rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <Trash2 size={18} />
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
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Plus size={16} /> Add another interval
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={
            !title.trim() || (isPastTask && !intervals.some((i) => i.startTime))
          }
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            padding: "0.75rem",
            borderRadius: "var(--radius-sm)",
            fontWeight: 500,
            marginTop: "0.5rem",
            opacity:
              !title.trim() ||
              (isPastTask && !intervals.some((i) => i.startTime))
                ? 0.5
                : 1,
          }}
        >
          {initialTask ? "Update Task" : "Add Task"}
        </button>
      </div>
    </form>
  );
};
