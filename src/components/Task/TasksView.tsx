import React, { useState, useMemo } from "react";
import { useStore } from "../../context/StoreContext";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  CalendarCheck,
  Clock,
  Search,
  X,
  ChevronsUpDown,
} from "lucide-react";

import { getActiveTask } from "../../utils/taskLogic";
import { formatDuration } from "../../utils/dateUtils";
import type { Task, TaskHistory } from "../../types";

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const getTaskCompletionTime = (task: Task): number => {
  const finishEvent = [...(task.history || [])]
    .reverse()
    .find((h: TaskHistory) => h.action === "finish");
  if (finishEvent) return finishEvent.timestamp;

  const lastLog = task.logs[task.logs.length - 1];
  if (lastLog?.endTime) return lastLog.endTime;

  return task.createdAt;
};

export const TasksView: React.FC = () => {
  const { tasks, projects, getTaskDuration } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [filter, setFilter] = useState<"todo" | "done">("todo");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Separate the active task from the list if there is one
  const activeTask = getActiveTask(tasks);

  const todoTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Exclude active task from main list if shown above
        if (activeTask && t.id === activeTask.id) return false;
        return t.status !== "done";
      })
      .sort((a, b) => {
        // Sort by priority first (high > medium > low)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityOrder[a.priority || "low"];
        const priorityB = priorityOrder[b.priority || "low"];

        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }

        // Then by creation date (newest first)
        return b.createdAt - a.createdAt;
      });
  }, [tasks, activeTask]);

  const doneGroups = useMemo(() => {
    const doneTasks = tasks.filter((t) => t.status === "done");

    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? doneTasks.filter((t) => {
          const titleMatch = t.title.toLowerCase().includes(query);
          const descMatch = t.description?.toLowerCase().includes(query);
          const project = projects.find((p) => p.id === t.projectId);
          const projectMatch = project?.name.toLowerCase().includes(query);
          const typeMatch = t.type?.toLowerCase().includes(query);
          return titleMatch || descMatch || projectMatch || typeMatch;
        })
      : doneTasks;

    const groupsMap = new Map<
      string,
      {
        key: string;
        label: string;
        tasks: Task[];
        totalDuration: number;
      }
    >();

    for (const task of filtered) {
      const completionTime = getTaskCompletionTime(task);
      const date = new Date(completionTime);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          label: `${MONTHS_PT[date.getMonth()]} de ${date.getFullYear()}`,
          tasks: [],
          totalDuration: 0,
        });
      }

      const group = groupsMap.get(key)!;
      group.tasks.push(task);
      group.totalDuration += getTaskDuration(task);
    }

    // Sort groups descending (most recent month first)
    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) =>
      b.key.localeCompare(a.key)
    );

    // Sort tasks within each month descending by completion time (newest finished first)
    for (const group of sortedGroups) {
      group.tasks.sort(
        (a, b) => getTaskCompletionTime(b) - getTaskCompletionTime(a)
      );
    }

    return sortedGroups;
  }, [tasks, searchQuery, projects, getTaskDuration]);

  const totalDoneCount = useMemo(() => {
    return tasks.filter((t) => t.status === "done").length;
  }, [tasks]);

  const isSectionOpen = (key: string) => {
    return openSections[key] === true;
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !isSectionOpen(key),
    }));
  };

  const allExpanded =
    doneGroups.length > 0 && doneGroups.every((g) => isSectionOpen(g.key));

  const toggleAllSections = () => {
    const shouldExpand = !allExpanded;
    const newOpen: Record<string, boolean> = {};
    if (shouldExpand) {
      doneGroups.forEach((g) => {
        newOpen[g.key] = true;
      });
    }
    setOpenSections(newOpen);
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
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700 }}>My Tasks</h2>
        <button
          onClick={() => setShowForm(true)}
          disabled={showForm}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            opacity: showForm ? 0.5 : 1,
            cursor: showForm ? "not-allowed" : "pointer",
          }}
        >
          <Plus size={18} />
          New Task
        </button>
      </div>

      {filter === "todo" && activeTask && (
        <div style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              textTransform: "uppercase",
              color: "var(--color-text-secondary)",
              marginBottom: "0.75rem",
              letterSpacing: "0.05em",
            }}
          >
            Working On Now
          </h3>
          <TaskCard
            task={activeTask}
            onEdit={(t) => {
              setEditingTask(t);
              setShowForm(true);
            }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {(["todo", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.375rem 1rem",
                borderRadius: "var(--radius-lg)",
                backgroundColor:
                  filter === f ? "var(--color-bg-tertiary)" : "transparent",
                color: filter === f ? "#fff" : "var(--color-text-secondary)",
                fontWeight: 500,
                fontSize: "0.9rem",
                textTransform: "capitalize",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                border: "none",
              }}
            >
              <span>{f}</span>
              {f === "done" && totalDoneCount > 0 && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    backgroundColor:
                      filter === f
                        ? "var(--color-bg-primary)"
                        : "var(--color-bg-secondary)",
                    color: "var(--color-text-secondary)",
                    padding: "0.05rem 0.45rem",
                    borderRadius: "1rem",
                  }}
                >
                  {totalDoneCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {filter === "done" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "var(--color-bg-secondary)",
                border: "1px solid var(--color-bg-tertiary)",
                borderRadius: "var(--radius-md)",
                padding: "0.4rem 0.75rem",
                gap: "0.5rem",
                width: "240px",
              }}
            >
              <Search size={15} color="var(--color-text-secondary)" />
              <input
                type="text"
                placeholder="Buscar em concluídas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--color-text-primary)",
                  fontSize: "0.85rem",
                  width: "100%",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                  title="Limpar busca"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {doneGroups.length > 1 && (
              <button
                onClick={toggleAllSections}
                style={{
                  background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-bg-tertiary)",
                  color: "var(--color-text-secondary)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-text-primary)";
                  e.currentTarget.style.borderColor = "var(--color-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                  e.currentTarget.style.borderColor =
                    "var(--color-bg-tertiary)";
                }}
                title={
                  allExpanded
                    ? "Recolher todos os meses"
                    : "Expandir todos os meses"
                }
              >
                <ChevronsUpDown size={14} />
                <span>{allExpanded ? "Recolher todos" : "Expandir todos"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <TaskForm
          onCancel={() => {
            setShowForm(false);
            setEditingTask(undefined);
          }}
          initialTask={editingTask}
        />
      )}

      {filter === "todo" ? (
        <div>
          {todoTasks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 0",
                color: "var(--color-text-secondary)",
                border: "2px dashed var(--color-bg-tertiary)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <p>No tasks found.</p>
            </div>
          ) : (
            todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setEditingTask(t);
                  setShowForm(true);
                }}
              />
            ))
          )}
        </div>
      ) : (
        <div>
          {doneGroups.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 0",
                color: "var(--color-text-secondary)",
                border: "2px dashed var(--color-bg-tertiary)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <p>
                {searchQuery.trim()
                  ? "Nenhuma tarefa concluída encontrada para essa busca."
                  : "Nenhuma tarefa concluída ainda."}
              </p>
            </div>
          ) : (
            doneGroups.map((group) => {
              const isOpen = isSectionOpen(group.key);
              return (
                <div key={group.key} style={{ marginBottom: "1.5rem" }}>
                  <div
                    onClick={() => toggleSection(group.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      backgroundColor: "var(--color-bg-secondary)",
                      border: "1px solid var(--color-bg-tertiary)",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      userSelect: "none",
                      marginBottom: isOpen ? "0.75rem" : 0,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--color-bg-tertiary)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                      }}
                    >
                      {isOpen ? (
                        <ChevronDown
                          size={18}
                          style={{ color: "var(--color-text-secondary)" }}
                        />
                      ) : (
                        <ChevronRight
                          size={18}
                          style={{ color: "var(--color-text-secondary)" }}
                        />
                      )}
                      <CalendarCheck
                        size={18}
                        style={{ color: "var(--color-accent)" }}
                      />
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "1rem",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {group.label}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "var(--color-bg-primary)",
                          color: "var(--color-text-secondary)",
                          padding: "0.15rem 0.55rem",
                          borderRadius: "1rem",
                          fontWeight: 600,
                          border: "1px solid var(--color-bg-tertiary)",
                        }}
                      >
                        {group.tasks.length}{" "}
                        {group.tasks.length === 1 ? "tarefa" : "tarefas"}
                      </span>
                    </div>

                    {group.totalDuration > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          color: "var(--color-text-secondary)",
                          fontSize: "0.85rem",
                        }}
                        title="Tempo total trabalhado nas tarefas deste mês"
                      >
                        <Clock size={14} />
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatDuration(group.totalDuration)}
                        </span>
                      </div>
                    )}
                  </div>

                  {isOpen && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {group.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={(t) => {
                            setEditingTask(t);
                            setShowForm(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
