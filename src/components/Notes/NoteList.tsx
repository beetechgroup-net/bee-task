import React, { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useNotes } from "../../context/NotesContext";

interface NoteListProps {
  selectedFolderId: string;
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  selectedFolderId,
  selectedNoteId,
  onSelectNote,
}) => {
  const { notes, addNote, deleteNote } = useNotes();
  const [search, setSearch] = useState("");

  const filteredNotes = useMemo(() => {
    return notes
      .filter(
        (n) =>
          n.folderId === selectedFolderId &&
          (n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.content.toLowerCase().includes(search.toLowerCase())),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, selectedFolderId, search]);

  const handleCreate = () => {
    const id = addNote("", selectedFolderId);
    onSelectNote(id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote(id);
      if (selectedNoteId === id) {
        onSelectNote("");
      }
    }
  };

  return (
    <div
      style={{
        width: "300px",
        height: "100%",
        backgroundColor: "var(--color-bg-primary)",
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
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Notes</h3>
          <button
            onClick={handleCreate}
            style={{
              color: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            <Plus size={18} />
          </button>
        </div>
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-secondary)",
            }}
          />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.5rem 0.5rem 2.25rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-bg-tertiary)",
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text-primary)",
              fontSize: "0.9rem",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
        {filteredNotes.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--color-text-secondary)",
              fontSize: "0.9rem",
            }}
          >
            No notes found.
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              style={{
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                backgroundColor:
                  selectedNoteId === note.id
                    ? "var(--color-bg-secondary)"
                    : "transparent",
                marginBottom: "0.5rem",
                border:
                  selectedNoteId === note.id
                    ? "1px solid var(--color-accent)"
                    : "1px solid transparent",
              }}
            >
              <h4
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "var(--color-text-primary)",
                }}
              >
                {note.title || "New Note"}
              </h4>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.8rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span>{format(note.updatedAt, "MMM d")}</span>
                <button
                  onClick={(e) => handleDelete(e, note.id)}
                  style={{
                    color: "var(--color-text-secondary)",
                    opacity: 0.6,
                    padding: "2px",
                  }}
                  title="Delete Note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
