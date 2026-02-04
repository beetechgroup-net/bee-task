import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import classNames from "classnames";
import { Ticker } from "../Ticker/Ticker";

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
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Ticker />
      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        {/* Mobile Menu Button - Adjust top position since Ticker pushes down? 
            Actually if fixed relative to viewport, it stays top. 
            Ticker is 32px height.
            Sidebar usually fixed? Let's check styling. 
            Sidebar is fixed inside its component usually? 
            If Ticker scroll with page, Sidebar top might need adjustment if Sidebar is fixed.
            If Ticker is fixed, it covers top.
            
            Let's assume standard scroll behavior first.
        */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            position: "fixed",
            top: "calc(1rem + 32px)", // Adjust for ticker
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
          className="d-md-none"
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
            minHeight: "calc(100vh - 32px)", // Adjust min-height
            overflowY: "auto",
            width: "100%", // Ensure it takes full width
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>{children}</div>
        </main>
      </div>
    </div>
  );
};
