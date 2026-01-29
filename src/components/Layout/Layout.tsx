import React from "react";
import { Sidebar } from "./Sidebar";

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
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Sidebar currentView={currentView} onChangeView={onChangeView} />
      <main
        style={{
          marginLeft: "260px",
          flex: 1,
          padding: "2rem",
          backgroundColor: "var(--color-bg-primary)",
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>{children}</div>
      </main>
    </div>
  );
};
