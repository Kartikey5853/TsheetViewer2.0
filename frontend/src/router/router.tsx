import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { Particles } from "@/components/ui/particles";
import { FloatingHeader } from "@/components/ui/floating-header";
import Compare from "@/pages/Compare";
import CompareStudentDetail from "@/pages/CompareStudentDetail";
import Dashboard from "@/pages/Dashboard";
import DataViewer from "@/pages/DataViewer";
import StudentPage from "@/pages/StudentPage";
import Upload from "@/pages/Upload";
import VisualizationDrilldown from "@/pages/VisualizationDrilldown";
import Visualizations from "@/pages/Visualizations";

function AppShell() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Particles className="absolute inset-0 opacity-40" quantity={55} ease={80} color="#1e9df1" refresh />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-3 md:px-6">
        <FloatingHeader />
        <main className="pt-5 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Upload />,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "visualizations", element: <Visualizations /> },
      { path: "visualizations/drilldown", element: <VisualizationDrilldown /> },
      { path: "data-viewer", element: <DataViewer /> },
      { path: "student/:rollNo", element: <StudentPage /> },
      { path: "compare", element: <Compare /> },
      { path: "compare/student/:rollNo", element: <CompareStudentDetail /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
