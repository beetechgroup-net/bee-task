import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { User, Mail, Briefcase, Save, Loader2, Clock } from "lucide-react";

export const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const [role, setRole] = useState("");
  const [dailyWorkHours, setDailyWorkHours] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRole(data.role || "");
        setDailyWorkHours(data.dailyWorkHours || "");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        role: role,
        dailyWorkHours: dailyWorkHours === "" ? null : Number(dailyWorkHours),
      });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
      >
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>
        Profile Settings
      </h1>

      <div
        style={{
          backgroundColor: "var(--color-bg-secondary)",
          padding: "2rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-bg-tertiary)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            marginBottom: "2rem",
          }}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                border: "4px solid var(--color-bg-tertiary)",
              }}
            />
          ) : (
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "var(--color-bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={48} />
            </div>
          )}

          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
              {user?.displayName}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--color-text-secondary)",
                marginTop: "0.5rem",
              }}
            >
              <Mail size={16} />
              {user?.email}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              Role / Job Title
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-tertiary)",
                }}
              >
                <Briefcase size={18} />
              </div>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  paddingLeft: "3rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-bg-tertiary)",
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                  fontSize: "1rem",
                }}
              />
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-tertiary)",
                marginTop: "0.5rem",
              }}
            >
              This will be displayed next to your name in chats and on your
              profile.
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              Daily Work Hours
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-tertiary)",
                }}
              >
                <Clock size={18} />
              </div>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={dailyWorkHours}
                onChange={(e) =>
                  setDailyWorkHours(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="e.g. 8"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  paddingLeft: "3rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-bg-tertiary)",
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                  fontSize: "1rem",
                }}
              />
            </div>
          </div>

          {message && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                backgroundColor:
                  message.type === "success"
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                color:
                  message.type === "success"
                    ? "var(--color-success)"
                    : "var(--color-danger)",
                fontSize: "0.9rem",
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-accent)",
                color: "white",
                border: "none",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
