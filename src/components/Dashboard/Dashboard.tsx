import React from "react";
import { DailyStandupView } from "../Reports/DailyStandupView";
import { SummaryReport } from "../Reports/SummaryReport";
import { useStore } from "../../context/StoreContext";
import { TaskCard } from "../Task/TaskCard";

export const Dashboard: React.FC = () => {
  const { tasks } = useStore();

  const priorityTasks = tasks.filter(
    (t) => t.priority === "high" && t.status !== "done",
  );

  return (
    <div>
      <h2
        style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem" }}
      >
        Dashboard
      </h2>

      {priorityTasks.length > 0 && (
        <section
          style={{
            marginBottom: "2rem",
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "var(--color-accent)",
            }}
          >
            Priority Tasks
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {priorityTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <section
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <DailyStandupView />
        </section>

        <section
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <SummaryReport />
        </section>
      </div>
    </div>
  );
};
