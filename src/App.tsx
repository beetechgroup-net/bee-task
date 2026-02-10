import { useState } from "react";
import { StoreProvider } from "./context/StoreContext";
import { Layout } from "./components/Layout/Layout";
import { TasksView } from "./components/Task/TasksView";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { BlendaDashboard } from "./components/Dashboard/BlendaDashboard";
import { CalendarView } from "./components/Calendar/CalendarView";
import { SummaryReport } from "./components/Reports/SummaryReport";
import { ProjectsView } from "./components/Project/ProjectsView";
import { StandardTasksView } from "./components/StandardTask/StandardTasksView";
import { NotesProvider } from "./context/NotesContext";
import { NotesView } from "./components/Notes/NotesView";
import { ChatView } from "./components/Chat/ChatView";
import { SuggestionsView } from "./components/Suggestions/SuggestionsView";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { PersonDetail } from "./components/Dashboard/PersonDetail";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/Auth/LoginPage";
import { ThemeProvider } from "./context/ThemeContext";
import { VersionBanner } from "./components/VersionBanner/VersionBanner";

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
      case "blenda-dashboard":
        return <BlendaDashboard onChangeView={setCurrentView} />;
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
        return <ChatView onChangeView={setCurrentView} />;
      case "reports":
        return <SummaryReport />;
      case "suggestions":
        return <SuggestionsView />;
      default:
        if (currentView.startsWith("person-detail:")) {
          const uid = currentView.split(":")[1];
          return (
            <PersonDetail
              userId={uid}
              onBack={() => setCurrentView("blenda-dashboard")}
            />
          );
        }
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
      <ThemeProvider>
        <StoreProvider>
          <NotesProvider>
            <ChatProvider>
              <AppContent />
              <VersionBanner
                currentVersion="0.2.0"
                releaseNotes={
                  <div>
                    <h4
                      style={{
                        marginBottom: "0.5rem",
                        fontWeight: 600,
                        color: "var(--color-accent)",
                      }}
                    >
                      🚀 What's New:
                    </h4>
                    <ul
                      style={{
                        paddingLeft: "1.2rem",
                        marginBottom: "1rem",
                        listStyleType: "disc",
                      }}
                    >
                      <li>
                        <strong>Auto-Create Standard Tasks:</strong> Now you can
                        set standard tasks to be automatically created every
                        weekday!
                      </li>
                      <li>
                        <strong>Version Banner:</strong> You're looking at it!
                        Stay updated with the latest changes.
                      </li>
                      <li>
                        <strong>Bug Fixes & Improvements:</strong> General
                        stability and performance updates.
                      </li>
                    </ul>
                    <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                      Enjoy the new update! 🐝
                    </p>
                  </div>
                }
              />
            </ChatProvider>
          </NotesProvider>
        </StoreProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
