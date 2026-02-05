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
  LogIn,
  LogOut,
  User as UserIcon,
  Timer,
  Lightbulb,
} from "lucide-react";
import classNames from "classnames";
import { PomodoroTimer } from "../Pomodoro/PomodoroTimer";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
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
  const [showPomodoro, setShowPomodoro] = React.useState(false);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] =
    React.useState(0);

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "suggestions"),
      where("status", "==", "pending"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingSuggestionsCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

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
    },
    {
      id: "chat",
      label: "Team Chat",
      icon: <MessageSquare size={20} />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { id: "projects", label: "Projects", icon: <FolderKanban size={20} /> },
    { id: "tasks", label: "My Tasks", icon: <CheckSquare size={20} /> },
    {
      id: "standard-tasks",
      label: "Standard Tasks",
      icon: <ClipboardList size={20} />,
    },
    { id: "calendar", label: "Calendar", icon: <Calendar size={20} /> },
    { id: "notes", label: "Notes", icon: <StickyNote size={20} /> },
    {
      id: "suggestions",
      label: "Suggestions",
      icon: <Lightbulb size={20} />,
      badge: pendingSuggestionsCount > 0 ? pendingSuggestionsCount : undefined,
    },
  ];

  return (
    <div
      className={classNames("sidebar-mobile", { open: isOpen })}
      style={{
        width: "var(--sidebar-width)",
        height: "calc(100vh - 36px)",
        backgroundColor: "var(--color-bg-secondary)",
        borderRight: "1px solid var(--color-bg-tertiary)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem",
        position: "fixed",
        left: 0,
        top: "36px", // Below Ticker
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

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          flex: 1,
          overflowY: "auto",
          minHeight: 0, // Important for nested flex scrolling
        }}
      >
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
        {/* Toggle Pomodoro Button */}
        <button
          onClick={() => setShowPomodoro(!showPomodoro)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            backgroundColor: showPomodoro
              ? "var(--color-accent-transparent)"
              : "transparent",
            color: showPomodoro
              ? "var(--color-accent)"
              : "var(--color-text-secondary)",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            transition: "all 0.2s",
            fontWeight: 500,
            marginBottom: "0.5rem",
          }}
        >
          <Timer size={20} />
          <span style={{ flex: 1, textAlign: "left" }}>Pomodoro</span>
          {!showPomodoro && (
            <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>Hidden</span>
          )}
        </button>

        <div style={{ display: showPomodoro ? "block" : "none" }}>
          <PomodoroTimer />
        </div>

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

      {/* BeeTech Tools - Icons Only */}
      <div
        style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--color-bg-tertiary)",
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
        }}
      >
        <a
          href="https://www.beetechgroup.net"
          target="_blank"
          rel="noopener noreferrer"
          title="https://www.beetechgroup.net"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.4rem",
            borderRadius: "var(--radius-md)",
            transition: "background-color 0.2s",
            opacity: 0.7,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          <img
            src="https://www.google.com/s2/favicons?domain=www.beetechgroup.net&sz=64"
            alt="BeeTech Group"
            style={{ width: "20px", height: "20px", borderRadius: "4px" }}
          />
        </a>
        <a
          href="https://beexp.beetechgroup.net"
          target="_blank"
          rel="noopener noreferrer"
          title="https://beexp.beetechgroup.net"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.4rem",
            borderRadius: "var(--radius-md)",
            transition: "background-color 0.2s",
            opacity: 0.7,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          <img
            src="https://www.google.com/s2/favicons?domain=beexp.beetechgroup.net&sz=64"
            alt="BeeXP"
            style={{ width: "20px", height: "20px", borderRadius: "4px" }}
          />
        </a>
        <a
          href="https://beefan.beetechgroup.net"
          target="_blank"
          rel="noopener noreferrer"
          title="https://beefan.beetechgroup.net"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.4rem",
            borderRadius: "var(--radius-md)",
            transition: "background-color 0.2s",
            opacity: 0.7,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          <img
            src="https://www.google.com/s2/favicons?domain=beefan.beetechgroup.net&sz=64"
            alt="BeeFan"
            style={{ width: "20px", height: "20px", borderRadius: "4px" }}
          />
        </a>
      </div>
    </div>
  );
};
