import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import { Plus, Trash2, Edit2, Clock } from "lucide-react";
import { StandardTaskForm } from "./StandardTaskForm";
import type { StandardTask } from "../../types";

export const StandardTasksView: React.FC = () => {
  const { standardTasks, deleteStandardTask, projects } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<StandardTask | undefined>(
    undefined,
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this standard task?")) {
      deleteStandardTask(id);
    }
  };

  const handleEdit = (task: StandardTask) => {
    setEditingTask(task);
    setIsCreating(true);
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingTask(undefined);
  };

  const getProjectName = (id?: string) => {
    const p = projects.find((proj) => proj.id === id);
    return p ? p.name : "Unknown Project";
  };

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
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Standard Tasks</h2>
        <button
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            opacity: isCreating ? 0.5 : 1,
          }}
        >
          <Plus size={18} />
          New Standard Task
        </button>
      </div>

      {isCreating && (
        <StandardTaskForm onCancel={closeForm} initialValues={editingTask} />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {standardTasks.map((task) => (
          <div
            key={task.id}
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              padding: "1.5rem",
              borderRadius: "var(--radius-lg)",
              position: "relative",
              borderLeft: "4px solid var(--color-accent)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                  {task.title}
                </h3>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleEdit(task)}
                  style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  style={{ color: "var(--color-danger)", opacity: 0.6 }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
              }}
            >
              <Clock size={16} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                {task.intervals && task.intervals.length > 0 ? (
                  task.intervals.map((interval, idx) => (
                    <span key={idx}>
                      {interval.startTime} - {interval.endTime}
                    </span>
                  ))
                ) : (
                  <span>
                    {task.startTime} - {task.endTime}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.85rem",
                color: "var(--color-text-secondary)",
              }}
            >
              <span>{getProjectName(task.projectId)}</span>
              <span
                style={{
                  padding: "0.2rem 0.5rem",
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.75rem",
                }}
              >
                {task.type}
              </span>
            </div>
          </div>
        ))}

        {standardTasks.length === 0 && !isCreating && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "3rem",
              color: "var(--color-text-secondary)",
            }}
          >
            No standard tasks defined yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
};
