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
      <div style={{ height: "36px" }} /> {/* Spacer for fixed Ticker */}
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
            top: "calc(1rem + 36px)", // Adjust for ticker
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
            minHeight: "calc(100vh - 36px)", // Adjust min-height
            overflowY: "auto",
            width: "100%", // Ensure it takes full width
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              width: "100%",
              flex: 1,
            }}
          >
            {children}
          </div>
          <footer
            style={{
              width: "100%",
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              justifyContent: "flex-end",
              paddingTop: "2rem",
              paddingBottom: "1rem",
              color: "var(--color-text-secondary)",
              fontSize: "0.875rem",
              opacity: 0.8,
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span>
                Inspired by a{" "}
                <a
                  href="https://kikey.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "inherit",
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                  }}
                >
                  kikey website
                </a>
              </span>
              <img
                src="https://lh3.googleusercontent.com/a/ACg8ocJE1yN5iVKxalU4OFncQsCmPIWhXrY5iMJxLCMSfBCA0cEEKHJV=s96-c"
                alt="Kikey"
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                }}
              />
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
