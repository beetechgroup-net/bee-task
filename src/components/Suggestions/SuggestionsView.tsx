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
import {
  Lightbulb,
  Plus,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronDown,
  ThumbsUp,
  Pencil,
} from "lucide-react";

interface Suggestion {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  status: "pending" | "completed" | "discarded";
  createdAt: any;
  votes: number;
  votedBy: string[]; // List of user IDs who voted
}

export const SuggestionsView: React.FC = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(
    null,
  );
  const [newSuggestionText, setNewSuggestionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState({
    pending: true,
    completed: false,
    discarded: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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
      if (editingSuggestion) {
        // Update existing suggestion
        await updateDoc(doc(db, "suggestions", editingSuggestion.id), {
          text: newSuggestionText.trim(),
        });
      } else {
        // Create new suggestion
        await addDoc(collection(db, "suggestions"), {
          text: newSuggestionText.trim(),
          userId: user.uid,
          userName: user.displayName || "Anonymous",
          userEmail: user.email,
          userPhotoURL: user.photoURL,
          status: "pending",
          votes: 0,
          votedBy: [],
          createdAt: serverTimestamp(),
        });
      }
      setNewSuggestionText("");
      setEditingSuggestion(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving suggestion:", error);
      alert("Failed to save suggestion.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
    setNewSuggestionText(suggestion.text);
    setIsModalOpen(true);
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

  const handleVote = async (
    id: string,
    currentVotes: number,
    votedBy: string[],
  ) => {
    if (!user) return;
    const hasVoted = votedBy?.includes(user.uid);
    const newVotedBy = hasVoted
      ? votedBy.filter((uid) => uid !== user.uid)
      : [...(votedBy || []), user.uid];
    const newVotes = hasVoted ? currentVotes - 1 : currentVotes + 1;

    try {
      await updateDoc(doc(db, "suggestions", id), {
        votes: newVotes,
        votedBy: newVotedBy,
      });
    } catch (error) {
      console.error("Error updating vote:", error);
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
          onClick={() => {
            setEditingSuggestion(null);
            setNewSuggestionText("");
            setIsModalOpen(true);
          }}
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
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Pending Section */}
          <CollapsibleSection
            title="Pending"
            count={
              suggestions.filter((s) => s.status === "pending" || !s.status)
                .length
            }
            isOpen={openSections.pending}
            onToggle={() => toggleSection("pending")}
            color="var(--color-accent)"
          >
            {suggestions
              .sort((a, b) => (b.votes || 0) - (a.votes || 0))
              .filter((s) => s.status === "pending" || !s.status)
              .map((item) => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  user={user}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDelete}
                  onVote={handleVote}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDelete}
                  onVote={handleVote}
                  onEdit={openEditModal}
                  getStatusColor={getStatusColor}
                />
              ))}
          </CollapsibleSection>

          {/* Completed Section */}
          <CollapsibleSection
            title="Completed"
            count={suggestions.filter((s) => s.status === "completed").length}
            isOpen={openSections.completed}
            onToggle={() => toggleSection("completed")}
            color="var(--color-success)"
          >
            {suggestions
              .filter((s) => s.status === "completed")
              .map((item) => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  user={user}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDelete}
                  onVote={handleVote}
                  getStatusColor={getStatusColor}
                />
              ))}
          </CollapsibleSection>

          {/* Discarded Section */}
          <CollapsibleSection
            title="Discarded"
            count={suggestions.filter((s) => s.status === "discarded").length}
            isOpen={openSections.discarded}
            onToggle={() => toggleSection("discarded")}
            color="var(--color-text-tertiary)"
          >
            {suggestions
              .filter((s) => s.status === "discarded")
              .map((item) => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  user={user}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDelete}
                  onVote={handleVote}
                  getStatusColor={getStatusColor}
                />
              ))}
          </CollapsibleSection>
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
          onClick={() => {
            setIsModalOpen(false);
            setEditingSuggestion(null);
            setNewSuggestionText("");
          }}
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
              {editingSuggestion ? "Edit Suggestion" : "New Suggestion"}
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
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSuggestion(null);
                    setNewSuggestionText("");
                  }}
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
                  {loading
                    ? "Submitting..."
                    : editingSuggestion
                      ? "Save Changes"
                      : "Submit Suggestion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
interface CollapsibleSectionProps {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  color?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  isOpen,
  onToggle,
  children,
  color,
}) => {
  return (
    <div
      style={{
        border: "1px solid var(--color-bg-tertiary)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        backgroundColor: "var(--color-bg-secondary)",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          backgroundColor: isOpen ? "var(--color-bg-tertiary)" : "transparent",
          transition: "background-color 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              margin: 0,
              color: color || "var(--color-text-primary)",
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontSize: "0.75rem",
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-secondary)",
              padding: "0.1rem 0.5rem",
              borderRadius: "1rem",
              fontWeight: 600,
            }}
          >
            {count}
          </span>
        </div>
      </div>
      {isOpen && (
        <div
          style={{
            padding: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
            borderTop: "1px solid var(--color-bg-tertiary)",
          }}
        >
          {count === 0 ? (
            <p
              style={{
                fontStyle: "italic",
                color: "var(--color-text-secondary)",
                gridColumn: "1 / -1",
                textAlign: "center",
              }}
            >
              No {title.toLowerCase()} suggestions.
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
};

interface SuggestionCardProps {
  item: Suggestion;
  user: any;
  onUpdateStatus: (id: string, status: any) => void;
  onDelete: (id: string) => void;
  onVote: (id: string, votes: number, votedBy: string[]) => void;

  onEdit: (suggestion: Suggestion) => void;
  onVote: (id: string, votes: number, votedBy: string[]) => void;
  getStatusColor: (status: string) => string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  item,
  user,
  onUpdateStatus,
  onDelete,

  onEdit,
  getStatusColor,
}) => {
  const hasVoted = item.votedBy?.includes(user?.uid);

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-primary)",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        border: "1px solid var(--color-bg-tertiary)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {item.userPhotoURL ? (
            <img
              src={item.userPhotoURL}
              alt={item.userName}
              style={{ width: 24, height: 24, borderRadius: "50%" }}
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
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Vote Button */}
        <button
          onClick={() => onVote(item.id, item.votes || 0, item.votedBy || [])}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: hasVoted ? "rgba(59, 130, 246, 0.1)" : "transparent",
            border: "1px solid",
            borderColor: hasVoted
              ? "var(--color-accent)"
              : "var(--color-bg-tertiary)",
            borderRadius: "var(--radius-md)",
            padding: "0.4rem 0.8rem",
            cursor: "pointer",
            color: hasVoted
              ? "var(--color-accent)"
              : "var(--color-text-secondary)",
            transition: "all 0.2s",
          }}
        >
          <ThumbsUp size={16} fill={hasVoted ? "currentColor" : "none"} />
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
            {item.votes || 0}
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center" }}>
          {item.status === "pending" && (
            <>
              <button
                onClick={() => onUpdateStatus(item.id, "discarded")}
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
                onClick={() => onUpdateStatus(item.id, "completed")}
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
            <>
              <button
                onClick={() => onDelete(item.id)}
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
              <button
                onClick={() => onEdit(item)}
                title="Edit"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-primary)",
                  padding: "0.25rem",
                  marginLeft: "0.5rem",
                }}
              >
                <Pencil size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
