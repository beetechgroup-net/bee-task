import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { DailyStandupView } from "../Reports/DailyStandupView";
import { SummaryReport } from "../Reports/SummaryReport";
import { MonthlyCompletedTasks } from "./MonthlyCompletedTasks";
import type { Task, Project } from "../../types";
import { ArrowLeft, Mail, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PersonDetailProps {
  userId: string;
  onBack: () => void;
}

interface UserData {
  displayName: string;
  email: string;
  photoURL: string;
  lastSeen?: number;
}

export const PersonDetail: React.FC<PersonDetailProps> = ({
  userId,
  onBack,
}) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch User Profile
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          setUser(userSnap.data() as UserData);
        } else {
          setError("User not found");
          setLoading(false);
          return;
        }

        // Fetch Tasks
        const tasksDocRef = doc(db, "users", userId, "data", "tasks");
        const tasksSnap = await getDoc(tasksDocRef);
        if (tasksSnap.exists()) {
          setTasks(tasksSnap.data().items as Task[]);
        }

        // Fetch Projects
        const projectsDocRef = doc(db, "users", userId, "data", "projects");
        const projectsSnap = await getDoc(projectsDocRef);
        if (projectsSnap.exists()) {
          setProjects(projectsSnap.data().items as Project[]);
        }
      } catch (err: any) {
        console.error("Error fetching person details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--color-text-secondary)",
        }}
      >
        Loading person details...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ padding: "2rem" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
          }}
        >
          <ArrowLeft size={20} /> Back
        </button>
        <div style={{ color: "var(--color-danger)" }}>
          Error: {error || "User not found"}
        </div>
      </div>
    );
  }

  // Calculate stats for header
  const isOnline = user.lastSeen && Date.now() - user.lastSeen < 10 * 60 * 1000;

  return (
    <div
      style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
            fontSize: "0.9rem",
            padding: 0,
          }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "2rem",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: "4px solid var(--color-bg-primary)",
              }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "var(--color-bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-secondary)",
              }}
            >
              <User size={40} />
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              {user.displayName}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Mail size={16} />
                {user.email}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: isOnline
                      ? "var(--color-success)"
                      : "var(--color-text-secondary)",
                  }}
                />
                {isOnline
                  ? "Online"
                  : `Last seen ${user.lastSeen ? formatDistanceToNow(user.lastSeen, { addSuffix: true }) : "Unknown"}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "2rem" }}>
        {/* Daily Standup Section */}
        <section>
          <DailyStandupView tasks={tasks} />
        </section>

        {/* Summary Report Section */}
        <section
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <SummaryReport tasks={tasks} projects={projects} />
        </section>

        {/* Monthly Completed Section */}
        <section>
          <MonthlyCompletedTasks tasks={tasks} />
        </section>
      </div>
    </div>
  );
};
