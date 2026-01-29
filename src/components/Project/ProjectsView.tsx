import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import { Plus, Trash2, Edit2, Check, X, FolderOpen } from "lucide-react";
import type { Project } from "../../types";

export const ProjectsView: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Creation state
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");

  // Edit state
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addProject(newName, newColor);
      setNewName("");
      setNewColor("#6366f1");
      setIsCreating(false);
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditColor(project.color);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      updateProject(id, { name: editName, color: editColor });
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(id);
    }
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
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Projects</h2>
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
          New Project
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Creation Card */}
        {isCreating && (
          <form
            onSubmit={handleCreate}
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              padding: "1.5rem",
              borderRadius: "var(--radius-lg)",
              border: "2px solid var(--color-accent)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--color-accent)",
              }}
            >
              New Project
            </h3>
            <input
              autoFocus
              placeholder="Project Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-bg-tertiary)",
                backgroundColor: "var(--color-bg-primary)",
                color: "#fff",
                width: "100%",
              }}
            />
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                style={{
                  border: "none",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                }}
              />
              <span
                style={{
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Pick a color
              </span>
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
                onClick={() => setIsCreating(false)}
                style={{
                  padding: "0.5rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--color-accent)",
                  borderRadius: "var(--radius-sm)",
                  color: "#fff",
                }}
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Project List */}
        {projects.map((project) => {
          const isEditing = editingId === project.id;
          return (
            <div
              key={project.id}
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                padding: "1.5rem",
                borderRadius: "var(--radius-lg)",
                position: "relative",
                borderLeft: `4px solid ${project.color}`,
                transition: "transform 0.2s",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {isEditing ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-bg-tertiary)",
                      backgroundColor: "var(--color-bg-primary)",
                      color: "#fff",
                      width: "100%",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      style={{
                        border: "none",
                        width: "30px",
                        height: "30px",
                        cursor: "pointer",
                        backgroundColor: "transparent",
                      }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => setEditingId(null)}>
                        <X size={18} color="var(--color-text-secondary)" />
                      </button>
                      <button onClick={() => saveEdit(project.id)}>
                        <Check size={18} color="var(--color-success)" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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
                      <FolderOpen size={20} color={project.color} />
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                        {project.name}
                      </h3>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => startEdit(project)}
                        style={{
                          color: "var(--color-text-secondary)",
                          opacity: 0.6,
                        }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      {project.id !==
                        "default" /* Prevent deleting default project? User choice. Let's allowing it but valid check. */ && (
                        <button
                          onClick={() => handleDelete(project.id)}
                          style={{ color: "var(--color-danger)", opacity: 0.6 }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {project.id === "default"
                      ? "Default Project"
                      : "Custom Project"}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
