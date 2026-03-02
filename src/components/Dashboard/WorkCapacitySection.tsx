import React, { useEffect, useState, useMemo } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import type { Task } from "../../types";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import {
  calculateCapacityInMs,
  calculateDurationInInterval,
} from "../../utils/capacityUtils";
import { Target } from "lucide-react";

interface WorkCapacitySectionProps {
  tasks?: Task[];
  dailyWorkHours?: number;
  userId?: string;
}

export const WorkCapacitySection: React.FC<WorkCapacitySectionProps> = ({
  tasks: propTasks,
  dailyWorkHours: propDailyWorkHours,
  userId: propUserId,
}) => {
  const { user: authUser } = useAuth();
  const { tasks: storeTasks } = useStore();
  const [fetchedHours, setFetchedHours] = useState<number | null>(null);

  const userId = propUserId || authUser?.uid;
  const tasks = propTasks || storeTasks;
  const defaultHours = propDailyWorkHours ?? fetchedHours ?? 0;

  useEffect(() => {
    const fetchHours = async () => {
      if (propDailyWorkHours !== undefined || !userId) return;
      try {
        const userRef = doc(db, "users", userId);
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
  }, [userId, propDailyWorkHours]);

  const metrics = useMemo(() => {
    if (!defaultHours) return null;

    const now = new Date();
    const intervals = [
      {
        label: "Today",
        start: startOfDay(now),
        end: endOfDay(now),
      },
      {
        label: "This Week",
        start: startOfWeek(now, { weekStartsOn: 1 }), // Week starts on Monday
        end: endOfWeek(now, { weekStartsOn: 1 }),
      },
      {
        label: "This Month",
        start: startOfMonth(now),
        end: endOfMonth(now),
      },
    ];

    const allLogs = tasks.flatMap((t) => t.logs);

    return intervals.map((interval) => {
      const capacityMs = calculateCapacityInMs(
        interval.start,
        interval.end,
        defaultHours,
      );
      const actualMs = calculateDurationInInterval(
        allLogs,
        interval.start.getTime(),
        interval.end.getTime(),
      );

      return {
        ...interval,
        capacityMs,
        actualMs,
        percentage:
          capacityMs > 0 ? Math.min((actualMs / capacityMs) * 100, 100) : 0,
      };
    });
  }, [tasks, defaultHours]);

  const formatHrsMins = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const rhours = hours;
    const rminutes = minutes % 60;
    return `${rhours}h ${rminutes}m`;
  };

  if (!defaultHours) {
    return null; // Don't show if they haven't set their hours
  }

  return (
    <section
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        padding: "1.5rem",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-bg-tertiary)",
        marginBottom: "2rem",
      }}
    >
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          marginBottom: "1rem",
          color: "var(--color-text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Target size={20} className="text-accent" />
        Work Capacity
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {metrics?.map((m) => (
          <div key={m.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                }}
              >
                {m.label}
              </span>
              <span style={{ color: "var(--color-text-primary)" }}>
                {formatHrsMins(m.actualMs)} / {formatHrsMins(m.capacityMs)}
              </span>
            </div>
            <div
              style={{
                height: "8px",
                backgroundColor: "var(--color-bg-tertiary)",
                borderRadius: "4px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${m.percentage}%`,
                  backgroundColor:
                    m.percentage >= 100
                      ? "var(--color-success)"
                      : "var(--color-accent)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
