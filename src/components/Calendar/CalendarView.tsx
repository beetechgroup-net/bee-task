import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const CalendarView: React.FC = () => {
  const { tasks, projects } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const resetToToday = () => setCurrentMonth(new Date());

  // Generate calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Helper to find tasks for a specific date
  // We check if a task has logs on this date OR was created on this date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      // Check logs
      const hasLogs = task.logs.some((log) => isSameDay(log.startTime, date));
      // Check creation date (optional, but good for context)
      const isCreated = isSameDay(task.createdAt, date);

      return hasLogs || isCreated;
    });
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
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Calendar</h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            backgroundColor: "var(--color-bg-secondary)",
            padding: "0.5rem",
            borderRadius: "var(--radius-md)",
          }}
        >
          <button
            onClick={prevMonth}
            style={{
              padding: "0.25rem",
              color: "var(--color-text-secondary)",
              display: "flex",
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <span
            style={{ fontWeight: 600, minWidth: "140px", textAlign: "center" }}
          >
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={nextMonth}
            style={{
              padding: "0.25rem",
              color: "var(--color-text-secondary)",
              display: "flex",
            }}
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={resetToToday}
            style={{
              fontSize: "0.8rem",
              marginLeft: "0.5rem",
              color: "var(--color-accent)",
              fontWeight: 500,
            }}
          >
            Today
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "1px",
          backgroundColor: "var(--color-bg-tertiary)",
          border: "1px solid var(--color-bg-tertiary)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            style={{
              padding: "1rem",
              textAlign: "center",
              fontWeight: 600,
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text-secondary)",
              fontSize: "0.9rem",
            }}
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, _idx) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isSameDay(day, new Date());
          const dayTasks = getTasksForDate(day);

          return (
            <div
              key={day.toISOString()}
              style={{
                minHeight: "120px",
                backgroundColor: isCurrentMonth
                  ? "var(--color-bg-primary)"
                  : "var(--color-bg-secondary)",
                opacity: isCurrentMonth ? 1 : 0.5,
                padding: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                position: "relative",
              }}
            >
              <div
                style={{
                  textAlign: "right",
                  fontWeight: isTodayDate ? 700 : 400,
                  color: isTodayDate ? "var(--color-accent)" : "inherit",
                  marginBottom: "0.25rem",
                }}
              >
                {format(day, "d")}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  overflowY: "auto",
                  maxHeight: "100px",
                }}
              >
                {dayTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.4rem",
                        backgroundColor: "var(--color-bg-secondary)",
                        borderLeft: `3px solid ${project?.color || "var(--color-text-secondary)"}`,
                        borderRadius: "2px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
