import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar as CalendarIcon,
  Layers,
  ClipboardList,
  StickyNote,
} from "lucide-react";
import classNames from "classnames";
import { PomodoroTimer } from "../Pomodoro/PomodoroTimer";

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  isOpen = false,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "My Tasks", icon: CheckSquare },
    { id: "projects", label: "Projects", icon: Layers },
    { id: "standard-tasks", label: "Standard Tasks", icon: ClipboardList },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
  ];

  return (
    <div
      className={classNames("sidebar-mobile", { open: isOpen })}
      style={{
        width: "var(--sidebar-width)",
        height: "100vh",
        backgroundColor: "var(--color-bg-secondary)",
        borderRight: "1px solid var(--color-bg-tertiary)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <img
          src="/logo.png"
          alt="BeeTask Logo"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            objectFit: "cover",
          }}
        />
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            letterSpacing: "-0.025em",
          }}
        >
          BeeTask
        </h1>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            color: "var(--color-text-secondary)",
            marginBottom: "0.5rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: isActive
                  ? "var(--color-accent)"
                  : "transparent",
                color: isActive ? "#fff" : "var(--color-text-secondary)",
                fontWeight: 500,
                transition: "all 0.2s ease",
                textAlign: "left",
                width: "100%",
                fontSize: "var(--font-size-base)",
              }}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto" }}>
        <PomodoroTimer />
      </div>
    </div>
  );
};
