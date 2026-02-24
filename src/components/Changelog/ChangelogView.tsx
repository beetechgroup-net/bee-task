import React from "react";
import { versionHistory } from "../../config/version";
import { Sparkles, ArrowUpCircle } from "lucide-react";

export const ChangelogView: React.FC = () => {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Sparkles color="var(--color-accent)" /> Changelog
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Timeline of all updates and new features added to the application.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {versionHistory.map((release, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-bg-tertiary)",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <ArrowUpCircle
                  size={24}
                  style={{ color: "var(--color-accent)" }}
                />
                {release.title}
              </h2>
              <span
                style={{
                  backgroundColor: "var(--color-accent-transparent)",
                  color: "var(--color-accent)",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                v{release.version}
              </span>
            </div>

            <ul
              style={{
                listStyleType: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {release.features.map((feature, fIndex) => (
                <li
                  key={fIndex}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <div
                    style={{
                      minWidth: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-accent)",
                      marginTop: "0.5rem",
                    }}
                  />
                  <span style={{ lineHeight: 1.5 }}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
