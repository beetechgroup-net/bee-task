import React, { useState } from "react";
import { Folder as FolderIcon, Trash2, Edit2, Plus } from "lucide-react";
import { useNotes } from "../../context/NotesContext";

interface SidebarProps {
  selectedFolderId: string;
  onSelectFolder: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedFolderId,
  onSelectFolder,
}) => {
  const { folders, addFolder, updateFolder, deleteFolder } = useNotes();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const startEdit = (
    e: React.MouseEvent,
    folder: { id: string; name: string },
  ) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditName(folder.name);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim() && editingFolderId) {
      updateFolder(editingFolderId, editName.trim());
      setEditingFolderId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteFolder(id);
  };

  return (
    <div
      style={{
        width: "250px",
        height: "100%",
        backgroundColor: "var(--color-bg-secondary)",
        borderRight: "1px solid var(--color-bg-tertiary)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "1rem",
          borderBottom: "1px solid var(--color-bg-tertiary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          FOLDERS
        </h3>
        <button
          onClick={() => setIsCreating(true)}
          style={{ color: "var(--color-text-secondary)" }}
          title="New Folder"
        >
          <Plus size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
        {folders.map((folder) => (
          <div
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              backgroundColor:
                selectedFolderId === folder.id
                  ? "var(--color-accent)"
                  : "transparent",
              color:
                selectedFolderId === folder.id
                  ? "#fff"
                  : "var(--color-text-primary)",
              marginBottom: "0.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.5rem",
            }}
          >
            {editingFolderId === folder.id ? (
              <form
                onSubmit={handleUpdate}
                onClick={(e) => e.stopPropagation()}
                style={{ flex: 1, display: "flex" }}
              >
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => setEditingFolderId(null)}
                  style={{
                    width: "100%",
                    padding: "0.25rem",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    outline: "none",
                    fontSize: "0.9rem",
                    color: "#000",
                  }}
                />
              </form>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    overflow: "hidden",
                  }}
                >
                  <FolderIcon
                    size={16}
                    fill={
                      selectedFolderId === folder.id ? "currentColor" : "none"
                    }
                  />
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: "0.9rem",
                    }}
                  >
                    {folder.name}
                  </span>
                </div>
                {folder.id !== "default" && (
                  <div
                    style={{ display: "flex", gap: "0.25rem" }}
                    className="folder-actions"
                  >
                    <button
                      onClick={(e) => startEdit(e, folder)}
                      style={{
                        padding: "2px",
                        color:
                          selectedFolderId === folder.id
                            ? "#fff"
                            : "var(--color-text-secondary)",
                        opacity: 0.7,
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, folder.id)}
                      style={{
                        padding: "2px",
                        color:
                          selectedFolderId === folder.id
                            ? "#fff"
                            : "var(--color-text-secondary)",
                        opacity: 0.7,
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {isCreating && (
          <form onSubmit={handleCreate} style={{ padding: "0.5rem 0.75rem" }}>
            <input
              autoFocus
              type="text"
              placeholder="Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => !newFolderName && setIsCreating(false)}
              style={{
                width: "100%",
                padding: "0.4rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-accent)",
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
                fontSize: "0.9rem",
              }}
            />
          </form>
        )}
      </div>
    </div>
  );
};
