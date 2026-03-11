import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import {
  isSameDay,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  formatDuration,
  formatDate,
} from "../../utils/dateUtils";
import { calculateCapacityInMs } from "../../utils/capacityUtils";
import type { Task } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useEffect } from "react";

type TimeRange = "day" | "week" | "month";

interface SummaryReportProps {
  tasks?: Task[];
  projects?: any[];
  dailyWorkHours?: number;
  userId?: string;
}

export const SummaryReport: React.FC<SummaryReportProps> = ({
  tasks: propTasks,
  projects: propProjects,
  dailyWorkHours: propDailyWorkHours,
  userId: propUserId,
}) => {
  const { user: authUser } = useAuth();
  const { tasks: storeTasks } = useStore();
  const tasks = propTasks || storeTasks;
  const projects = propProjects;
  const [range, setRange] = useState<TimeRange>("day");
  const [referenceDate] = useState(new Date());
  const [fetchedHours, setFetchedHours] = useState<number | null>(null);

  const targetUserId = propUserId || authUser?.uid;
  const defaultHours = propDailyWorkHours ?? fetchedHours ?? 0;

  useEffect(() => {
    const fetchHours = async () => {
      // Don't fetch if provided via prop or no target user
      if (propDailyWorkHours !== undefined || !targetUserId) return;
      try {
        const userRef = doc(db, "users", targetUserId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.dailyWorkHours) {
            setFetchedHours(data.dailyWorkHours);
          }
        }
      } catch (err) {
        console.error("Error fetching dailyWorkHours:", err);
      }
    };
    fetchHours();
  }, [targetUserId, propDailyWorkHours]);

  const filterTasksByRange = (tasks: Task[], range: TimeRange, date: Date) => {
    return tasks.filter((task) => {
      return task.logs.some((log) => {
        const logDate = new Date(log.startTime);
        if (range === "day")
          return isSameDay(logDate.getTime(), date.getTime());
        if (range === "week") {
          return isWithinInterval(logDate, {
            start: startOfWeek(date),
            end: endOfWeek(date),
          });
        }
        if (range === "month") {
          return isWithinInterval(logDate, {
            start: startOfMonth(date),
            end: endOfMonth(date),
          });
        }
        return false;
      });
    });
  };

  const filteredTasks = filterTasksByRange(tasks, range, referenceDate);

  // Helper to aggregate duration
  const aggregateDuration = (groupKeyFn: (t: Task) => string) => {
    return filteredTasks.reduce(
      (acc, t) => {
        const taskDurationInRange = t.logs.reduce((logAcc, log) => {
          const logDate = new Date(log.startTime);
          let inRange = false;
          // Check if log is within range (reusing logic or simplified since tasks are already filtered?
          // Note: Filtered tasks implies *some* log is in range, but we only want to sum logs IN range).
          if (range === "day")
            inRange = isSameDay(logDate.getTime(), referenceDate.getTime());
          else if (range === "week")
            inRange = isWithinInterval(logDate, {
              start: startOfWeek(referenceDate),
              end: endOfWeek(referenceDate),
            });
          else if (range === "month")
            inRange = isWithinInterval(logDate, {
              start: startOfMonth(referenceDate),
              end: endOfMonth(referenceDate),
            });

          return inRange ? logAcc + log.duration : logAcc;
        }, 0);

        if (taskDurationInRange > 0) {
          const key = groupKeyFn(t);
          acc[key] = (acc[key] || 0) + taskDurationInRange;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  };

  const durationByProject = aggregateDuration((t) => t.projectId);
  const durationByType = aggregateDuration((t) => t.type);

  const totalDuration = Object.values(durationByProject).reduce(
    (a, b) => a + b,
    0,
  );

  // Calculate Capacity
  let capacityMs = 0;
  if (defaultHours > 0) {
    let start, end;
    if (range === "day") {
      start = referenceDate;
      end = referenceDate;
    } else if (range === "week") {
      start = startOfWeek(referenceDate);
      end = endOfWeek(referenceDate);
    } else {
      start = startOfMonth(referenceDate);
      end = endOfMonth(referenceDate);
    }
    capacityMs = calculateCapacityInMs(start, end, defaultHours);
  }

  // Reusable Chart Component (Simple CSS Bar Chart)
  const SimpleBarChart = ({
    data,
    getColor,
    getLabel,
  }: {
    data: Record<string, number>;
    getColor: (key: string) => string;
    getLabel: (key: string) => string;
  }) => {
    const sortedEntries = Object.entries(data).sort(([, a], [, b]) => b - a);
    const maxVal = sortedEntries[0]?.[1] || 1;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {sortedEntries.map(([key, val]) => {
          const percentage = (val / totalDuration) * 100;
          const widthPercentage = (val / maxVal) * 100;
          return (
            <div key={key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ fontWeight: 500 }}>{getLabel(key)}</span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {formatDuration(val)} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${widthPercentage}%`,
                    backgroundColor: getColor(key),
                    borderRadius: "4px",
                    transition: "width 0.5s ease-out",
                  }}
                />
              </div>
            </div>
          );
        })}
        {sortedEntries.length === 0 && (
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontStyle: "italic",
            }}
          >
            No data for this period.
          </p>
        )}
      </div>
    );
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Summary Report</h2>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            backgroundColor: "var(--color-bg-secondary)",
            padding: "0.25rem",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {(["day", "week", "month"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-md)",
                backgroundColor:
                  range === r ? "var(--color-bg-tertiary)" : "transparent",
                color: range === r ? "#fff" : "var(--color-text-secondary)",
                textTransform: "capitalize",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{ fontSize: "1.25rem", color: "var(--color-text-secondary)" }}
        >
          {range === "day" && formatDate(referenceDate)}
          {range === "week" &&
            `Week of ${formatDate(startOfWeek(referenceDate))}`}
          {range === "month" && formatDate(referenceDate, "MMMM yyyy")}
        </div>
        <div
          style={{
            fontSize: "3rem",
            fontWeight: 700,
            color: "var(--color-accent)",
            marginTop: "0.5rem",
          }}
        >
          {formatDuration(totalDuration)}
          {capacityMs > 0 && (
            <span
              style={{
                fontSize: "1.5rem",
                color: "var(--color-text-tertiary)",
                marginLeft: "0.5rem",
              }}
            >
              / {formatDuration(capacityMs)}
            </span>
          )}
          <span
            style={{
              fontSize: "1rem",
              color: "var(--color-text-secondary)",
              fontWeight: 400,
              marginLeft: "0.5rem",
            }}
          >
            total logged
          </span>
        </div>

        {capacityMs > 0 && (
          <div
            style={{
              height: "8px",
              backgroundColor: "var(--color-bg-tertiary)",
              borderRadius: "4px",
              overflow: "hidden",
              position: "relative",
              marginTop: "1rem",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min((totalDuration / capacityMs) * 100, 100)}%`,
                backgroundColor:
                  totalDuration >= capacityMs
                    ? "var(--color-success)"
                    : "var(--color-accent)",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* By Project Chart */}
        <div
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Time by Project
          </h3>
          {/* <SimpleBarChart
            data={durationByProject}
            getColor={(id) =>
              projects.find((p) => p.id === id)?.color ||
              "var(--color-text-secondary)"
            }
            getLabel={(id) =>
              projects.find((p) => p.id === id)?.name || "Unknown"
            }
          /> */}
        </div>

        {/* By Type Chart */}
        <div
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Time by Type
          </h3>
          <SimpleBarChart
            data={durationByType}
            getColor={(type) => {
              switch (type) {
                case "Development":
                  return "#38bdf8"; // Sky
                case "Meeting":
                  return "#f472b6"; // Pink
                case "PR Review":
                  return "#a78bfa"; // Purple
                default:
                  return "#94a3b8"; // Slate
              }
            }}
            getLabel={(type) => type}
          />
        </div>
      </div>
    </div>
  );
};
