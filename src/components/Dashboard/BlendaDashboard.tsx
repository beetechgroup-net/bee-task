import React, { useEffect, useState, useMemo } from "react";
import { CompactTaskCard } from "../Task/CompactTaskCard";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import type { Task, Project, TaskLog } from "../../types";
import {
  formatDistanceToNow,
  startOfMonth,
  startOfDay,
  endOfDay,
} from "date-fns";

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  lastSeen: number;
}

interface UserTaskData {
  user: UserData;
  allTasks: Task[]; // Store all tasks to filter client-side
  projects: Project[];
}

interface BlendaDashboardProps {
  onChangeView: (view: string) => void;
}

export const BlendaDashboard: React.FC<BlendaDashboardProps> = ({
  onChangeView,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersData, setUsersData] = useState<UserTaskData[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: startOfMonth(new Date()).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

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

          allUsersData.push({
            user: safeUserData,
            allTasks: tasks,
            projects: userProjects,
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

  const calculateDurationInInterval = (
    logs: TaskLog[],
    rangeStart: number,
    rangeEnd: number,
  ) => {
    return logs.reduce((acc, log) => {
      const logStart = log.startTime;
      const logEnd = log.endTime || Date.now(); // If running, assume now

      // Check for overlap
      // Overlap exists if (LogStart < RangeEnd) and (LogEnd > RangeStart)
      if (logStart < rangeEnd && logEnd > rangeStart) {
        const effectiveStart = Math.max(logStart, rangeStart);
        const effectiveEnd = Math.min(logEnd, rangeEnd);
        return acc + (effectiveEnd - effectiveStart);
      }
      return acc;
    }, 0);
  };

  const dashboardStats = useMemo(() => {
    // Fix: Treat inputs as local dates.
    // "YYYY-MM-DD" -> new Date("YYYY-MM-DD") is UTC.
    // "YYYY-MM-DD" + "T00:00" -> new Date(...) is Local.
    const rangeStart = startOfDay(
      new Date(dateRange.start + "T00:00"),
    ).getTime();
    const rangeEnd = endOfDay(new Date(dateRange.end + "T00:00")).getTime();

    const processedUsers = usersData.map((userData) => {
      const sortedTasks = [...userData.allTasks].sort((a, b) => {
        const lastActivityA =
          a.history && a.history.length > 0
            ? Math.max(...a.history.map((h) => h.timestamp))
            : a.createdAt;
        const lastActivityB =
          b.history && b.history.length > 0
            ? Math.max(...b.history.map((h) => h.timestamp))
            : b.createdAt;
        return lastActivityB - lastActivityA;
      });

      const recentTasks = sortedTasks.slice(0, 2);

      const totalDurationByProject: Record<string, number> = {};
      const totalDurationByType: Record<string, number> = {};
      let totalDuration = 0;

      userData.allTasks.forEach((task) => {
        const duration = calculateDurationInInterval(
          task.logs,
          rangeStart,
          rangeEnd,
        );

        if (duration > 0) {
          totalDuration += duration;

          totalDurationByProject[task.projectId] =
            (totalDurationByProject[task.projectId] || 0) + duration;

          totalDurationByType[task.type] =
            (totalDurationByType[task.type] || 0) + duration;
        }
      });

      return {
        ...userData,
        recentTasks, // Still show most recent tasks regardless of filter? Or filter recent active?
        // Requirement implies "Filter... to view total time...", usually recent activity is independent.
        // Keeping recentTasks as "globally recent" but maybe we should show "recent in range"?
        // Detailed req: "Filtro de intervalo de data para ver o taotal time logged, total time by Project e total time by type"
        // It didn't explicitly ask to filter the "Recent Activity" list, but "Team Detail" has "Total Worked" which SHOULD be filtered.
        totalDuration,
        totalDurationByProject,
        totalDurationByType,
      };
    });

    // Global Aggregations
    const globalTotalDuration = processedUsers.reduce(
      (acc, d) => acc + d.totalDuration,
      0,
    );

    const allProjectsMap = new Map<string, Project>();
    processedUsers.forEach((ud) => {
      ud.projects.forEach((p) => allProjectsMap.set(p.id, p));
    });

    const globalProjectStats = processedUsers.reduce(
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

    const globalTypeStats = processedUsers.reduce(
      (acc, d) => {
        Object.entries(d.totalDurationByType).forEach(([type, duration]) => {
          acc[type] = (acc[type] || 0) + duration;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      processedUsers, // Use this for the list
      globalTotalDuration,
      globalProjectStats,
      globalTypeStats,
      allProjectsMap,
    };
  }, [usersData, dateRange]);

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

  return (
    <div
      style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}
    >
      <header
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Dashboard da Blenda
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Overview of team activity and performance.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              style={{
                padding: "0.5rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-bg-tertiary)",
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
                fontSize: "0.9rem",
              }}
            />
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              style={{
                padding: "0.5rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-bg-tertiary)",
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
                fontSize: "0.9rem",
              }}
            />
          </div>
        </div>
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
            {formatDuration(dashboardStats.globalTotalDuration)}
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-tertiary)",
              marginTop: "0.5rem",
            }}
          >
            in selected period
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
            data={dashboardStats.globalProjectStats}
            total={dashboardStats.globalTotalDuration}
            getColor={(name) => {
              // Find any project with this name to get its color
              for (const p of dashboardStats.allProjectsMap.values()) {
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
            data={dashboardStats.globalTypeStats}
            total={dashboardStats.globalTotalDuration}
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
        {dashboardStats.processedUsers.map((data) => {
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    cursor: "pointer",
                  }}
                  onClick={() => onChangeView(`person-detail:${data.user.uid}`)}
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
                    <h3
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 600,
                        textDecoration: "underline",
                        textDecorationStyle: "dotted",
                        textDecorationColor: "var(--color-text-secondary)",
                      }}
                    >
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
                      return (
                        <CompactTaskCard
                          key={task.id}
                          task={task}
                          project={project}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      fontStyle: "italic",
                      color: "var(--color-text-tertiary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    No recent tasks found.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
