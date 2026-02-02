import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { Lightbulb, Plus, CheckCircle, XCircle, Trash2 } from "lucide-react";

interface Suggestion {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  status: "pending" | "completed" | "discarded";
  createdAt: any;
}

export const SuggestionsView: React.FC = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSuggestionText, setNewSuggestionText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "suggestions"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Suggestion[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Suggestion);
      });
      setSuggestions(items);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuggestionText.trim() || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "suggestions"), {
        text: newSuggestionText.trim(),
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        userPhotoURL: user.photoURL,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setNewSuggestionText("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding suggestion:", error);
      alert("Failed to add suggestion.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: "completed" | "discarded" | "pending",
  ) => {
    try {
      await updateDoc(doc(db, "suggestions", id), {
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this suggestion?")) return;
    try {
      await deleteDoc(doc(db, "suggestions", id));
    } catch (error) {
      console.error("Error deleting suggestion:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "var(--color-success)";
      case "discarded":
        return "var(--color-text-tertiary)"; // dim
      default:
        return "var(--color-accent)";
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        height: "100%",
        overflowY: "auto",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "12px",
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-accent)",
            }}
          >
            <Lightbulb size={24} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.025em",
                margin: 0,
              }}
            >
              Suggestions Box
            </h1>
            <p
              style={{
                color: "var(--color-text-secondary)",
                marginTop: "0.25rem",
              }}
            >
              Share your ideas to improve BeeTask
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem 1.25rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Plus size={18} />
          New Suggestion
        </button>
      </div>

      {suggestions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            backgroundColor: "var(--color-bg-secondary)",
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--color-bg-tertiary)",
            color: "var(--color-text-secondary)",
          }}
        >
          <Lightbulb size={48} style={{ opacity: 0.2, marginBottom: "1rem" }} />
          <h3>No suggestions yet</h3>
          <p>Be the first to share an idea!</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {suggestions.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                border: "1px solid var(--color-bg-tertiary)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "transform 0.2s, box-shadow 0.2s",
                opacity: item.status === "discarded" ? 0.6 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {item.userPhotoURL ? (
                    <img
                      src={item.userPhotoURL}
                      alt={item.userName}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: "var(--color-bg-tertiary)",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {item.userName}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "2rem",
                    backgroundColor:
                      item.status === "completed"
                        ? "rgba(16, 185, 129, 0.1)"
                        : item.status === "discarded"
                          ? "rgba(107, 114, 128, 0.1)"
                          : "rgba(245, 158, 11, 0.1)",
                    color: getStatusColor(item.status),
                  }}
                >
                  {item.status}
                </div>
              </div>

              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--color-text-primary)",
                  lineHeight: 1.5,
                  marginBottom: "1.5rem",
                  flex: 1,
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.text}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  borderTop: "1px solid var(--color-bg-tertiary)",
                  paddingTop: "1rem",
                  justifyContent: "flex-end",
                }}
              >
                {/* Actions available to everyone or just admin/owner? 
                    User requested: "A sugestao pode ser marcada como concluida ou Descardata"
                    Assuming open for now or owner based. Let's allow everyone for simplicity as per request context,
                    or strictly admin? Usually these apps are small teams. I'll allow interaction.
                */}
                {item.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(item.id, "discarded")}
                      title="Discard"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-tertiary)",
                        padding: "0.25rem",
                      }}
                    >
                      <XCircle size={20} />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, "completed")}
                      title="Mark as Completed"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-success)",
                        padding: "0.25rem",
                      }}
                    >
                      <CheckCircle size={20} />
                    </button>
                  </>
                )}

                {(item.userId === user?.uid ||
                  user?.email === "gabrielufmscc@gmail.com") && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-danger)",
                      padding: "0.25rem",
                      marginLeft: "0.5rem",
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--color-bg-primary)",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              border: "1px solid var(--color-bg-tertiary)",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>
              New Suggestion
            </h2>
            <form onSubmit={handleAddSuggestion}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Description
                </label>
                <textarea
                  value={newSuggestionText}
                  onChange={(e) => setNewSuggestionText(e.target.value)}
                  placeholder="Describe your feature request or idea..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-bg-tertiary)",
                    backgroundColor: "var(--color-bg-secondary)",
                    color: "var(--color-text-primary)",
                    resize: "vertical",
                    fontSize: "0.95rem",
                  }}
                  autoFocus
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-bg-tertiary)",
                    backgroundColor: "transparent",
                    color: "var(--color-text-primary)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newSuggestionText.trim()}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    backgroundColor: "var(--color-accent)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    opacity: loading || !newSuggestionText.trim() ? 0.7 : 1,
                  }}
                >
                  {loading ? "Submitting..." : "Submit Suggestion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
