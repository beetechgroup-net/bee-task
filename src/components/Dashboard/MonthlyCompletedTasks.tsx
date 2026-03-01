import React, { useMemo, useState } from "react";
import { format, isSameMonth } from "date-fns";
import { useStore } from "../../context/StoreContext";
import {
  CalendarCheck,
  Clock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import type { TaskHistory, Task } from "../../types";

interface CollapsibleSectionProps {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  isOpen,
  onToggle,
  children,
  actions,
}) => {
  return (
    <div
      style={{
        border: "1px solid var(--color-bg-tertiary)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        backgroundColor: "var(--color-bg-secondary)",
        marginBottom: "1rem",
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
              color: "var(--color-text-primary)",
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
        {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </div>
      {isOpen && (
        <div
          style={{
            borderTop: "1px solid var(--color-bg-tertiary)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const MonthlyCompletedTasks: React.FC<{ tasks?: Task[] }> = ({
  tasks: propTasks,
}) => {
  const { tasks: storeTasks, getTaskDuration } = useStore();
  const tasks = propTasks || storeTasks;

  const completedTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((task) => {
        if (task.status !== "done") return false;

        // Determine completion time
        // Prefer history 'finish' event, fallback to last log end time
        const finishEvent = [...(task.history || [])]
          .reverse()
          .find((h: TaskHistory) => h.action === "finish");

        if (finishEvent) {
          return isSameMonth(new Date(finishEvent.timestamp), now);
        }

        // If no history event, check logs (not ideal but fallback)
        const lastLog = task.logs[task.logs.length - 1];
        if (lastLog?.endTime) {
          return isSameMonth(new Date(lastLog.endTime), now);
        }

        return false;
      })
      .sort((a, b) => {
        // Sort by completion time, descending
        const getEndTime = (t: typeof a) => {
          const finishEvent = [...(t.history || [])]
            .reverse()
            .find((h: TaskHistory) => h.action === "finish");
          if (finishEvent) return finishEvent.timestamp;
          const lastLog = t.logs[t.logs.length - 1];
          return lastLog?.endTime || 0;
        };
        return getEndTime(b) - getEndTime(a);
      });
  }, [tasks]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    completedTasks.forEach((task) => {
      const type = task.type || "Outros";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(task);
    });
    return groups;
  }, [completedTasks]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [copiedCategory, setCopiedCategory] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const isCurrentlyOpen =
        prev[section] !== undefined ? prev[section] : true;
      return { ...prev, [section]: !isCurrentlyOpen };
    });
  };

  const handleCopyCategory = (type: string, typeTasks: Task[]) => {
    const textToCopy = typeTasks
      .map((task) => {
        const duration = getTaskDuration(task);
        const hours = Math.floor(duration / 3600000);
        const minutes = Math.floor((duration % 3600000) / 60000);
        const durationString = `${hours}h ${minutes}m`;
        return `- ${task.title} (${durationString})`;
      })
      .join("\n");

    const header = `${type} (${typeTasks.length} tarefas):\n`;
    navigator.clipboard.writeText(header + textToCopy).then(() => {
      setCopiedCategory(type);
      setTimeout(() => setCopiedCategory(null), 2000);
    });
  };

  if (completedTasks.length === 0) {
    return null;
  }

  return (
    <div>
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
        <CalendarCheck size={20} className="text-accent" />
        Completed This Month ({completedTasks.length})
      </h3>
      <div>
        {Object.entries(groupedTasks).map(([type, typeTasks]) => {
          const isOpen =
            openSections[type] !== undefined ? openSections[type] : true;

          return (
            <CollapsibleSection
              key={type}
              title={type}
              count={typeTasks.length}
              isOpen={isOpen}
              onToggle={() => toggleSection(type)}
              actions={
                <button
                  onClick={() => handleCopyCategory(type, typeTasks)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.25rem",
                    borderRadius: "0.25rem",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                  }}
                  title="Copiar lista de tarefas"
                >
                  {copiedCategory === type ? (
                    <Check size={18} color="var(--color-success)" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              }
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                {typeTasks.map((task, index) => {
                  const finishEvent = [...(task.history || [])]
                    .reverse()
                    .find((h: TaskHistory) => h.action === "finish");
                  const lastLog = task.logs[task.logs.length - 1];
                  const completedAt = finishEvent
                    ? finishEvent.timestamp
                    : lastLog?.endTime || 0;

                  const duration = getTaskDuration(task);
                  const hours = Math.floor(duration / 3600000);
                  const minutes = Math.floor((duration % 3600000) / 60000);
                  const durationString = `${hours}h ${minutes}m`;

                  return (
                    <div
                      key={task.id}
                      style={{
                        padding: "0.75rem 1rem",
                        borderBottom:
                          index !== typeTasks.length - 1
                            ? "1px solid var(--color-bg-tertiary)"
                            : "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "var(--color-accent)",
                            opacity: 0.7,
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {task.title}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            color: "var(--color-text-secondary)",
                            fontSize: "0.85rem",
                          }}
                        >
                          <Clock size={14} />
                          <span>{durationString}</span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {format(completedAt, "MMM d, HH:mm")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          );
        })}
      </div>
    </div>
  );
};
