import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import { Plus } from "lucide-react";

export const TasksView: React.FC = () => {
  const { tasks } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  const filteredTasks = tasks
    .filter((t) => {
      if (filter === "all") return true;
      if (filter === "todo") return t.status !== "done";
      if (filter === "done") return t.status === "done";
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700 }}>My Tasks</h2>
        <button
          onClick={() => setShowForm(true)}
          disabled={showForm}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            opacity: showForm ? 0.5 : 1,
          }}
        >
          <Plus size={18} />
          New Task
        </button>
      </div>

      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        {(["all", "todo", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.375rem 1rem",
              borderRadius: "var(--radius-lg)",
              backgroundColor:
                filter === f ? "var(--color-bg-tertiary)" : "transparent",
              color: filter === f ? "#fff" : "var(--color-text-secondary)",
              fontWeight: 500,
              fontSize: "0.9rem",
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {showForm && <TaskForm onCancel={() => setShowForm(false)} />}

      <div>
        {filteredTasks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 0",
              color: "var(--color-text-secondary)",
              border: "2px dashed var(--color-bg-tertiary)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p>No tasks found.</p>
          </div>
        ) : (
          filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
};
