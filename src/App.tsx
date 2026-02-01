import { useState } from "react";
import { StoreProvider } from "./context/StoreContext";
import { Layout } from "./components/Layout/Layout";
import { TasksView } from "./components/Task/TasksView";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { CalendarView } from "./components/Calendar/CalendarView";
import { SummaryReport } from "./components/Reports/SummaryReport";
import { ProjectsView } from "./components/Project/ProjectsView";
import { StandardTasksView } from "./components/StandardTask/StandardTasksView";
import { NotesProvider } from "./context/NotesContext";
import { NotesView } from "./components/Notes/NotesView";
import { ChatView } from "./components/Chat/ChatView";
import { AuthProvider } from "./context/AuthContext";

import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/Auth/LoginPage";

function AppContent() {
  const [currentView, setCurrentView] = useState("dashboard");
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-bg-primary)",
          color: "var(--color-text-primary)",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "tasks":
        return <TasksView />;
      case "calendar":
        return <CalendarView />;
      case "projects":
        return <ProjectsView />;
      case "standard-tasks":
        return <StandardTasksView />;
      case "notes":
        return <NotesView />;
      case "chat":
        return <ChatView />;
      case "reports":
        return <SummaryReport />;
      default:
        // Handle Project views
        if (currentView.startsWith("project-")) {
          return (
            <div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                Project View
              </h2>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Project filtering coming soon. Use "My Tasks" for now.
              </p>
            </div>
          );
        }
        return <TasksView />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <NotesProvider>
          <AppContent />
        </NotesProvider>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
