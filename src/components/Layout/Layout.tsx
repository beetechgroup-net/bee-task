import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import classNames from "classnames";

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onChangeView,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 40,
          padding: "0.5rem",
          backgroundColor: "var(--color-bg-secondary)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
          color: "var(--color-text-primary)",
          display: "none", // Hidden by default, shown via CSS query
        }}
        className="mobile-menu-btn"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar Overlay */}
      <div
        className={classNames("sidebar-overlay", { open: isSidebarOpen })}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar
        currentView={currentView}
        onChangeView={(view) => {
          onChangeView(view);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
      />

      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 40,
        }}
        className="d-md-none" // Helper to show only on mobile if needed, but handled via media query above
      >
        <style>{`
              @media (max-width: 768px) {
                  .mobile-menu-btn { display: block !important; }
              }
          `}</style>
      </div>

      <main
        className="main-content-mobile"
        style={{
          marginLeft: "260px",
          flex: 1,
          padding: "2rem",
          backgroundColor: "var(--color-bg-primary)",
          minHeight: "100vh",
          overflowY: "auto",
          width: "100%", // Ensure it takes full width
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>{children}</div>
      </main>
    </div>
  );
};
