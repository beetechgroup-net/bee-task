import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import type { Task, Project } from "../../types";
import { formatDistanceToNow } from "date-fns";

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  lastSeen: number;
}

interface UserTaskData {
  user: UserData;
  recentTasks: Task[];
  projects: Project[]; // Added projects here
  totalDurationByProject: Record<string, number>;
  totalDurationByType: Record<string, number>;
  totalDuration: number;
}

export const BlendaDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersData, setUsersData] = useState<UserTaskData[]>([]);
  // Removed global projects state as it's not sufficient for all users

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const usersRef = collection(db, "users");
        let usersSnap;
        try {
          usersSnap = await getDocs(usersRef);
        } catch (e: any) {
          console.error("Error fetching users:", e);
          throw new Error(
            `Failed to list users: ${e.message}. CHECK FIRESTORE RULES.`,
          );
        }

        const allUsersData: UserTaskData[] = [];

        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data() as UserData;
          const uid = userDoc.id;
          const safeUserData = { ...userData, uid };

          // Fetch Tasks
          const tasksDocRef = doc(db, "users", uid, "data", "tasks");
          let tasks: Task[] = [];
          try {
            const tasksSnap = await getDoc(tasksDocRef);
            if (tasksSnap.exists()) {
              tasks = tasksSnap.data().items as Task[];
            }
          } catch (e: any) {
            console.error(
              `Error fetching tasks for ${safeUserData.email}: ${e.message}`,
            );
          }

          // Fetch Projects
          const projectsDocRef = doc(db, "users", uid, "data", "projects");
          let userProjects: Project[] = [];
          try {
            const projectsSnap = await getDoc(projectsDocRef);
            if (projectsSnap.exists()) {
              userProjects = projectsSnap.data().items as Project[];
            }
          } catch (e: any) {
            console.error(
              `Error fetching projects for ${safeUserData.email}: ${e.message}`,
            );
          }

          const sortedTasks = [...tasks].sort((a, b) => {
            const lastActivityA = getLastActivity(a);
            const lastActivityB = getLastActivity(b);
            return lastActivityB - lastActivityA;
          });

          const recentTasks = sortedTasks.slice(0, 2);

          const totalDurationByProject: Record<string, number> = {};
          const totalDurationByType: Record<string, number> = {};
          let totalDuration = 0;

          tasks.forEach((task) => {
            const duration = getTaskDuration(task);
            totalDuration += duration;

            // Use project name as key if possible slightly safer for aggregation across users
            // if ids are random but names match. But here we stick to IDs for now, or maybe Names?
            // Issue: Project IDs are likely UUIDs specific to that user.
            // Aggregating by ID globally won't work if everyone has different IDs for "BeeTask".
            // Let's aggregate by ID for now as requested by previous logic,
            // BUT for the "Global Chart" we might need a unified way.
            // For now, let's just make the "Detail View" work correctly.

            totalDurationByProject[task.projectId] =
              (totalDurationByProject[task.projectId] || 0) + duration;

            totalDurationByType[task.type] =
              (totalDurationByType[task.type] || 0) + duration;
          });

          allUsersData.push({
            user: safeUserData,
            recentTasks,
            projects: userProjects,
            totalDurationByProject,
            totalDurationByType,
            totalDuration,
          });
        }

        allUsersData.sort(
          (a, b) => (b.user.lastSeen || 0) - (a.user.lastSeen || 0),
        );

        setUsersData(allUsersData);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getLastActivity = (task: Task) => {
    if (task.history && task.history.length > 0) {
      return Math.max(...task.history.map((h) => h.timestamp));
    }
    return task.createdAt;
  };

  const getTaskDuration = (task: Task) => {
    return task.logs.reduce((acc, log) => {
      if (log.endTime) {
        return acc + log.duration;
      }
      return acc + (Date.now() - log.startTime);
    }, 0);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const SimpleBarChart = ({
    data,
    getColor,
    getLabel,
    total,
  }: {
    data: Record<string, number>;
    getColor: (key: string) => string;
    getLabel: (key: string) => string;
    total: number;
  }) => {
    const sortedEntries = Object.entries(data).sort(([, a], [, b]) => b - a);
    const maxVal = sortedEntries[0]?.[1] || 1;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {sortedEntries.map(([key, val]) => {
          const percentage = total > 0 ? (val / total) * 100 : 0;
          const widthPercentage = (val / maxVal) * 100;
          return (
            <div key={key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                  fontSize: "0.85rem",
                }}
              >
                <span style={{ fontWeight: 500 }}>{getLabel(key)}</span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {formatDuration(val)} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${widthPercentage}%`,
                    backgroundColor: getColor(key),
                    borderRadius: "3px",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading dashboard data...</div>;
  }

  const globalTotalDuration = usersData.reduce(
    (acc, d) => acc + d.totalDuration,
    0,
  );

  // Note: Aggregating by Project ID across users is tricky if IDs are unique per user.
  // We'll collect all projects from all users to find names for the global chart,
  // but be aware that different users might have different IDs for the "same" project.
  // For the purpose of this request (fixing the detail view), this implementation
  // aggregates by ID. For the chart labels, we will search across ALL users' projects.

  const allProjectsMap = new Map<string, Project>();
  usersData.forEach((ud) => {
    ud.projects.forEach((p) => allProjectsMap.set(p.id, p));
  });

  const globalProjectStats = usersData.reduce(
    (acc, d) => {
      Object.entries(d.totalDurationByProject).forEach(
        ([projectId, duration]) => {
          const projectName =
            allProjectsMap.get(projectId)?.name || "Unknown Project";
          acc[projectName] = (acc[projectName] || 0) + duration;
        },
      );
      return acc;
    },
    {} as Record<string, number>,
  );

  const globalTypeStats = usersData.reduce(
    (acc, d) => {
      Object.entries(d.totalDurationByType).forEach(([type, duration]) => {
        acc[type] = (acc[type] || 0) + duration;
      });
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div
      style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1
          style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}
        >
          Dashboard da Blenda
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Overview of team activity and performance.
        </p>
      </header>

      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "2rem",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Error Loading Data
          </h3>
          <p>{error}</p>
          <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Please verify your Firestore Security Rules.
          </p>
        </div>
      )}

      {/* Global Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "3rem",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3
            style={{
              fontSize: "0.9rem",
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
            }}
          >
            Total Time Logged
          </h3>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-accent)",
            }}
          >
            {formatDuration(globalTotalDuration)}
          </div>
        </div>
        <div
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3
            style={{
              fontSize: "0.9rem",
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
            }}
          >
            Active Users (24h)
          </h3>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {
              usersData.filter(
                (u) =>
                  Date.now() - (u.user.lastSeen || 0) < 24 * 60 * 60 * 1000,
              ).length
            }
          </div>
        </div>
      </div>

      {/* Global Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
          marginBottom: "3rem",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3 style={{ marginBottom: "1rem", fontWeight: 600 }}>
            Total Time by Project
          </h3>
          <SimpleBarChart
            data={globalProjectStats}
            total={globalTotalDuration}
            getColor={(name) => {
              // Find any project with this name to get its color
              for (const p of allProjectsMap.values()) {
                if (p.name === name) return p.color;
              }
              return "gray";
            }}
            getLabel={(name) => name}
          />
        </div>
        <div
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3 style={{ marginBottom: "1rem", fontWeight: 600 }}>
            Total Time by Type
          </h3>
          <SimpleBarChart
            data={globalTypeStats}
            total={globalTotalDuration}
            getColor={(type) => {
              switch (type) {
                case "Development":
                  return "#38bdf8";
                case "Meeting":
                  return "#f472b6";
                case "PR Review":
                  return "#a78bfa";
                default:
                  return "#94a3b8";
              }
            }}
            getLabel={(type) => type}
          />
        </div>
      </div>

      <h2
        style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}
      >
        Team Detail
      </h2>
      <div style={{ display: "grid", gap: "2rem" }}>
        {usersData.map((data) => {
          const isOnline =
            Date.now() - (data.user.lastSeen || 0) < 10 * 60 * 1000; // 10 mins

          return (
            <div
              key={data.user.uid}
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: isOnline
                  ? "1px solid var(--color-success)"
                  : "1px solid transparent",
              }}
            >
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid var(--color-bg-tertiary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  {data.user.photoURL ? (
                    <img
                      src={data.user.photoURL}
                      alt={data.user.displayName}
                      style={{ width: 48, height: 48, borderRadius: "50%" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        backgroundColor: "var(--color-bg-tertiary)",
                      }}
                    />
                  )}
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                      {data.user.displayName || data.user.email}
                    </h3>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: isOnline
                          ? "var(--color-success)"
                          : "var(--color-text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <span
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
                        : `Last seen ${formatDistanceToNow(data.user.lastSeen || 0, { addSuffix: true })}`}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Total Worked
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                    {formatDuration(data.totalDuration)}
                  </div>
                </div>
              </div>

              <div style={{ padding: "1.5rem" }}>
                <h4
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    marginBottom: "1rem",
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Recent Activity
                </h4>
                {data.recentTasks.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gap: "1rem",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                    }}
                  >
                    {data.recentTasks.map((task) => {
                      const project = data.projects.find(
                        (p) => p.id === task.projectId,
                      );
                      const isTaskActive = task.status === "in-progress";

                      return (
                        <div
                          key={task.id}
                          style={{
                            backgroundColor: "var(--color-bg-primary)",
                            padding: "1rem",
                            borderRadius: "var(--radius-md)",
                            borderLeft: `4px solid ${project?.color || "var(--color-text-secondary)"}`,
                            boxShadow: isTaskActive
                              ? "0 0 0 2px var(--color-accent)"
                              : "none",
                            position: "relative",
                          }}
                        >
                          {isTaskActive && (
                            <div
                              style={{
                                position: "absolute",
                                top: "-8px",
                                right: "10px",
                                backgroundColor: "var(--color-accent)",
                                color: "white",
                                fontSize: "0.65rem",
                                fontWeight: "bold",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                textTransform: "uppercase",
                              }}
                            >
                              Running
                            </div>
                          )}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.2rem 0.6rem",
                                borderRadius: "1rem",
                                backgroundColor: "var(--color-bg-tertiary)",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {project?.name || "Unknown Project"}
                            </span>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {formatDuration(getTaskDuration(task))}
                            </span>
                          </div>
                          <div
                            style={{ fontWeight: 500, marginBottom: "0.25rem" }}
                          >
                            {task.title}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.85rem",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {task.status} • {task.type}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-tertiary)",
                              }}
                            >
                              Created:{" "}
                              {new Date(task.createdAt).toLocaleDateString()}{" "}
                              {new Date(task.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p
                    style={{
                      color: "var(--color-text-secondary)",
                      fontStyle: "italic",
                    }}
                  >
                    No recent activity found.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
