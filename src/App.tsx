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

function App() {
  const [currentView, setCurrentView] = useState("dashboard");

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
    <StoreProvider>
      <NotesProvider>
        <Layout currentView={currentView} onChangeView={setCurrentView}>
          {renderContent()}
        </Layout>
      </NotesProvider>
    </StoreProvider>
  );
}

export default App;
