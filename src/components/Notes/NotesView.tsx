import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { NoteList } from "./NoteList";
import { NoteEditor } from "./NoteEditor";
import { useNotes } from "../../context/NotesContext";

export const NotesView: React.FC = () => {
  const { folders } = useNotes();
  const [selectedFolderId, setSelectedFolderId] = useState("default");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Ensure selected folder exists
  React.useEffect(() => {
    if (!folders.find((f) => f.id === selectedFolderId)) {
      setSelectedFolderId(folders[0]?.id || "default");
    }
  }, [folders, selectedFolderId]);

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 4rem)", // Adjust based on layout header? Or assume full height container
        margin: "-2rem", // Counteract default padding from dashboard content
        backgroundColor: "var(--color-bg-primary)",
      }}
    >
      <Sidebar
        selectedFolderId={selectedFolderId}
        onSelectFolder={(id) => {
          setSelectedFolderId(id);
          setSelectedNoteId(null);
        }}
      />
      <NoteList
        selectedFolderId={selectedFolderId}
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
      />
      <div style={{ flex: 1, height: "100%", overflow: "hidden" }}>
        {selectedNoteId ? (
          <NoteEditor noteId={selectedNoteId} />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "var(--color-text-secondary)",
              fontSize: "1.1rem",
            }}
          >
            Select a note to view or create a new one.
          </div>
        )}
      </div>
    </div>
  );
};
