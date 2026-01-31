import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useNotes } from "../../context/NotesContext";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Image as ImageIcon,
  Download,
} from "lucide-react";
// @ts-ignore
import html2pdf from "html2pdf.js";
import { compressImage } from "../../utils/imageUtils";
import "./NoteEditor.css"; // We'll need some styles

interface NoteEditorProps {
  noteId: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ noteId }) => {
  const { notes, updateNote } = useNotes();
  const note = notes.find((n) => n.id === noteId);
  const [title, setTitle] = useState(note?.title || "");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: note?.content || "",
    onUpdate: ({ editor }) => {
      // Auto-save content
      if (note) {
        updateNote(note.id, { content: editor.getHTML() });
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (note && editor) {
      if (editor.getHTML() !== note.content) {
        // Avoid cursor jump loops if possible, or just strict compare
        // For now, only set content if noteId changed or drastically different?
        // This is tricky with collab/realtime.
        // Simple app: Just update on mount or note switch.
      }
    }
  }, [noteId, editor]); // Dep only noteId to re-init content?

  // Better approach: when noteId changes, set content.
  useEffect(() => {
    if (editor && note) {
      editor.commands.setContent(note.content || "");
      setTitle(note.title);
    }
  }, [noteId, editor]); // Removing 'note' from dep to avoid loop on every keystroke update

  if (!note) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "var(--color-text-secondary)",
        }}
      >
        Select a note to view
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    updateNote(noteId, { title: e.target.value });
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      try {
        const base64 = await compressImage(file);
        editor.chain().focus().setImage({ src: base64 }).run();
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image.");
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExportPDF = () => {
    if (!editor) return;

    const element = document.createElement("div");
    // Clone editor content style for PDF
    element.innerHTML = editor.getHTML();
    element.style.padding = "2rem";
    element.style.fontFamily = "outfit, sans-serif"; // Ensure font matches
    element.style.color = "#000"; // Enforce black text for PDF likely

    // We might need to append styles manually or use option in html2pdf
    // Simple approach:
    const opt = {
      margin: 1,
      filename: `${title || "note"}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
    };

    html2pdf().set(opt).from(element).save();
  };

  if (!editor) {
    return null;
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--color-bg-primary)",
      }}
    >
      <div
        style={{
          padding: "1.5rem 2rem",
          borderBottom: "1px solid var(--color-bg-tertiary)",
        }}
      >
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note Title"
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            border: "none",
            outline: "none",
            width: "100%",
            backgroundColor: "transparent",
            color: "var(--color-text-primary)",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "1rem",
            color: "var(--color-text-secondary)",
          }}
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            style={{
              padding: "0.25rem",
              color: editor.isActive("bold")
                ? "var(--color-accent)"
                : "inherit",
            }}
          >
            <Bold size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            style={{
              padding: "0.25rem",
              color: editor.isActive("italic")
                ? "var(--color-accent)"
                : "inherit",
            }}
          >
            <Italic size={20} />
          </button>
          <div
            style={{
              width: "1px",
              backgroundColor: "var(--color-bg-tertiary)",
              margin: "0 0.5rem",
            }}
          />
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            style={{
              padding: "0.25rem",
              color: editor.isActive("bulletList")
                ? "var(--color-accent)"
                : "inherit",
            }}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            style={{
              padding: "0.25rem",
              color: editor.isActive("orderedList")
                ? "var(--color-accent)"
                : "inherit",
            }}
          >
            <ListOrdered size={20} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            style={{
              padding: "0.25rem",
              color: editor.isActive("taskList")
                ? "var(--color-accent)"
                : "inherit",
            }}
          >
            <CheckSquare size={20} />
          </button>
          <button
            onClick={addImage}
            style={{ padding: "0.25rem", color: "#fff" }}
            title="Insert Image"
          >
            <ImageIcon size={20} />
          </button>
          <div
            style={{
              width: "1px",
              backgroundColor: "var(--color-bg-tertiary)",
              margin: "0 0.5rem",
            }}
          />
          <button
            onClick={handleExportPDF}
            style={{ padding: "0.25rem", color: "#fff" }}
            title="Export PDF"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*"
      />
    </div>
  );
};
