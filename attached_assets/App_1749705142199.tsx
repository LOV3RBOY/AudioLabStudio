import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createTheme, ThemeProvider } from "./components/shared/ThemeProvider";
import { ToastProvider } from "./components/shared/ToastProvider";
import Layout from "./components/shared/Layout";
import Dashboard from "./pages/Dashboard";
import ProjectView from "./pages/Project";
import NotFound from "./pages/NotFound";
import { useLocalStorage } from "react-use";

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function App() {
  // Theme state management
  const [themePreference, setThemePreference] = useLocalStorage<"dark" | "light" | "system">(
    "theme-preference",
    "dark"
  );
  const [theme, setTheme] = useState(createTheme(themePreference || "dark"));

  // Update theme when preference changes or system preference changes
  useEffect(() => {
    const updateTheme = () => {
      setTheme(createTheme(themePreference || "dark"));
    };

    // Initial theme setup
    updateTheme();

    // Listen for system preference changes
    if (themePreference === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    }
  }, [themePreference]);

  // Toggle theme function
  const toggleTheme = () => {
    setThemePreference((current) => {
      if (current === "light") return "dark";
      if (current === "dark") return "system";
      return "light";
    });
  };

  return (
    <ConvexProvider client={convex}>
      <ThemeProvider theme={theme} toggleTheme={toggleTheme}>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Main routes - directly accessible without auth */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="project/:projectId" element={<ProjectView />} />
                <Route path="projects" element={<Navigate to="/dashboard" replace />} />
                <Route path="mixes" element={<Navigate to="/dashboard" replace />} />
                <Route path="suggestions" element={<Navigate to="/dashboard" replace />} />
                <Route path="analytics" element={<Navigate to="/dashboard" replace />} />
                <Route path="settings" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}

export default App;
