import React from "react";
import { DailyStandupView } from "../Reports/DailyStandupView";
import { SummaryReport } from "../Reports/SummaryReport";

export const Dashboard: React.FC = () => {
  return (
    <div>
      <h2
        style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem" }}
      >
        Dashboard
      </h2>
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
