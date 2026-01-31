import React, { createContext, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Folder, Note } from "../types";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface NotesContextType {
  folders: Folder[];
  notes: Note[];
  addFolder: (name: string) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  addNote: (title: string, folderId: string, content?: string) => string; // Returns ID
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [folders, setFolders] = useLocalStorage<Folder[]>("folders", [
    { id: "default", name: "Notes", createdAt: Date.now() },
  ]);
  const [notes, setNotes] = useLocalStorage<Note[]>("notes", []);

  const addFolder = (name: string) => {
    setFolders([...folders, { id: uuidv4(), name, createdAt: Date.now() }]);
  };

  const updateFolder = (id: string, name: string) => {
    setFolders(folders.map((f) => (f.id === id ? { ...f, name } : f)));
  };

  const deleteFolder = (id: string) => {
    if (id === "default") {
      alert("Cannot delete default folder.");
      return;
    }
    // Delete folder and its notes (or move them to default? let's delete for now)
    // Actually, safer to just restrict delete if notes exist, or delete all.
    // Let's simple delete all notes in folder.
    if (confirm("Delete folder and all its notes?")) {
      setFolders(folders.filter((f) => f.id !== id));
      setNotes(notes.filter((n) => n.folderId !== id));
    }
  };

  const addNote = (title: string, folderId: string, content: string = "") => {
    const id = uuidv4();
    const newNote: Note = {
      id,
      title: title || "New Note",
      content,
      folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes([...notes, newNote]);
    return id;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(
      notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n,
      ),
    );
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <NotesContext.Provider
      value={{
        folders,
        notes,
        addFolder,
        updateFolder,
        deleteFolder,
        addNote,
        updateNote,
        deleteNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};
