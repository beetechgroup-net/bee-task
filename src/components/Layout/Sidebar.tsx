import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  ClipboardList,
  StickyNote,
  MessageSquare,
  Activity,
  FolderKanban,
  Calendar,
  BarChart2,
  LogIn,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import classNames from "classnames";
import { PomodoroTimer } from "../Pomodoro/PomodoroTimer";
import { useAuth } from "../../context/AuthContext";
import { useChatContext } from "../../context/ChatContext";

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  isOpen,
}) => {
  const { user, signInWithGoogle, logout } = useAuth();
  const { unreadCount } = useChatContext();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: "blenda-dashboard",
      label: "Dashboard Blenda",
      icon: <Activity size={20} />,
      restricted: true,
    },
    { id: "projects", label: "Projects", icon: <FolderKanban size={20} /> },
    { id: "tasks", label: "Team Tasks", icon: <CheckSquare size={20} /> },
    {
      id: "standard-tasks",
      label: "My Tasks",
      icon: <ClipboardList size={20} />,
    },
    { id: "calendar", label: "Calendar", icon: <Calendar size={20} /> },
    { id: "notes", label: "Notes", icon: <StickyNote size={20} /> },
    {
      id: "chat",
      label: "Team Chat",
      icon: <MessageSquare size={20} />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { id: "reports", label: "Summary Report", icon: <BarChart2 size={20} /> },
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
        {menuItems.map((item) => {
          if (item.restricted && user?.email !== "gabrielufmscc@gmail.com") {
            return null;
          }
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                backgroundColor: isActive
                  ? "var(--color-accent-transparent)"
                  : "transparent",
                color: isActive
                  ? "var(--color-accent)"
                  : "var(--color-text-secondary)",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: isActive ? 600 : 500,
                position: "relative", // Added for badge positioning if needed, though flex handles it
              }}
            >
              {item.icon}
              <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    backgroundColor: "var(--color-danger)",
                    color: "white",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "1rem",
                    minWidth: "1.2rem",
                    textAlign: "center",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto" }}>
        <PomodoroTimer />

        <div
          style={{
            marginTop: "1rem",
            borderTop: "1px solid var(--color-bg-tertiary)",
            paddingTop: "1rem",
          }}
        >
          {user ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    style={{ width: 32, height: 32, borderRadius: "50%" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: "var(--color-bg-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <UserIcon size={16} />
                  </div>
                )}
                <div style={{ overflow: "hidden" }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.displayName}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--color-text-secondary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text-secondary)",
                  width: "100%",
                  fontSize: "0.85rem",
                }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-bg-primary)",
                border: "1px solid var(--color-bg-tertiary)",
                color: "var(--color-text-primary)",
                width: "100%",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              <LogIn size={18} />
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
