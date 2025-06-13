import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Music,
  Layers,
  Settings,
  Sun,
  Moon,
  Monitor,
  HelpCircle,
  Bell,
  ChevronRight,
  ChevronLeft,
  Plus,
  Search,
  Wand2,
  Sliders,
  Volume2,
  BarChart2,
} from "lucide-react";

// Navigation items for sidebar
const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/projects", label: "Projects", icon: Music },
  { path: "/mixes", label: "Mixes", icon: Layers },
  { path: "/suggestions", label: "AI Suggestions", icon: Wand2 },
  { path: "/analytics", label: "Analytics", icon: BarChart2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

// Layout component
const Layout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Get theme icon
  const getThemeIcon = () => {
    if (theme.name === "dark") return <Sun size={20} />;
    if (theme.name === "light") return <Moon size={20} />;
    return <Monitor size={20} />;
  };

  // Get theme label
  const getThemeLabel = () => {
    if (theme.name === "dark") return "Light Mode";
    if (theme.name === "light") return "Dark Mode";
    return "System Theme";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col transition-all duration-300 ease-in-out border-r ${
          isSidebarOpen ? "w-64" : "w-16"
        }`}
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.default,
        }}
      >
        {/* Sidebar header */}
        <div
          className={`h-16 flex items-center px-4 border-b ${
            isSidebarOpen ? "justify-between" : "justify-center"
          }`}
          style={{ borderColor: theme.colors.border.default }}
        >
          {isSidebarOpen && (
            <Link to="/" className="flex items-center">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-md mr-2"
                style={{ backgroundColor: theme.colors.accent.default }}
              >
                <Volume2 size={18} color="white" />
              </div>
              <span
                className="font-bold text-lg"
                style={{ color: theme.colors.foreground.primary }}
              >
                Audio AI
              </span>
            </Link>
          )}
          <button
            className="p-1 rounded-md hover:bg-black hover:bg-opacity-10"
            onClick={toggleSidebar}
            style={{ color: theme.colors.foreground.secondary }}
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-opacity-10 font-medium"
                          : "hover:bg-black hover:bg-opacity-5"
                      } ${isSidebarOpen ? "" : "justify-center"}`
                    }
                    style={{
                      backgroundColor: isActive
                        ? theme.colors.accent.muted
                        : "transparent",
                      color: isActive
                        ? theme.colors.accent.default
                        : theme.colors.foreground.secondary,
                    }}
                  >
                    <Icon size={20} />
                    {isSidebarOpen && <span className="ml-3">{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div
          className="p-4 border-t"
          style={{ borderColor: theme.colors.border.default }}
        >
          <button
            className={`flex items-center rounded-md px-3 py-2 w-full hover:bg-black hover:bg-opacity-5 ${
              isSidebarOpen ? "" : "justify-center"
            }`}
            onClick={toggleTheme}
            style={{ color: theme.colors.foreground.secondary }}
          >
            {getThemeIcon()}
            {isSidebarOpen && <span className="ml-3">{getThemeLabel()}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileSidebar}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 w-64 z-50 md:hidden flex flex-col border-r"
              style={{
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.border.default,
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Mobile sidebar header */}
              <div
                className="h-16 flex items-center justify-between px-4 border-b"
                style={{ borderColor: theme.colors.border.default }}
              >
                <Link to="/" className="flex items-center">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-md mr-2"
                    style={{ backgroundColor: theme.colors.accent.default }}
                  >
                    <Volume2 size={18} color="white" />
                  </div>
                  <span
                    className="font-bold text-lg"
                    style={{ color: theme.colors.foreground.primary }}
                  >
                    Audio AI
                  </span>
                </Link>
                <button
                  className="p-1 rounded-md hover:bg-black hover:bg-opacity-10"
                  onClick={toggleMobileSidebar}
                  style={{ color: theme.colors.foreground.secondary }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile navigation links */}
              <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-md transition-colors ${
                              isActive
                                ? "bg-opacity-10 font-medium"
                                : "hover:bg-black hover:bg-opacity-5"
                            }`
                          }
                          style={{
                            backgroundColor: isActive
                              ? theme.colors.accent.muted
                              : "transparent",
                            color: isActive
                              ? theme.colors.accent.default
                              : theme.colors.foreground.secondary,
                          }}
                          onClick={toggleMobileSidebar}
                        >
                          <Icon size={20} />
                          <span className="ml-3">{item.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Mobile sidebar footer */}
              <div
                className="p-4 border-t"
                style={{ borderColor: theme.colors.border.default }}
              >
                <button
                  className="flex items-center rounded-md px-3 py-2 w-full hover:bg-black hover:bg-opacity-5"
                  onClick={toggleTheme}
                  style={{ color: theme.colors.foreground.secondary }}
                >
                  {getThemeIcon()}
                  <span className="ml-3">{getThemeLabel()}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header
          className="h-16 flex items-center px-4 border-b"
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border.default,
          }}
        >
          {/* Mobile menu button */}
          <button
            className="p-1 rounded-md mr-4 md:hidden hover:bg-black hover:bg-opacity-10"
            onClick={toggleMobileSidebar}
            style={{ color: theme.colors.foreground.secondary }}
          >
            <Menu size={24} />
          </button>

          {/* Search bar */}
          <div
            className="relative flex-1 max-w-md hidden sm:block"
          >
            <div
              className="flex items-center rounded-md border px-3 py-1.5"
              style={{
                backgroundColor: theme.colors.background.primary,
                borderColor: theme.colors.border.default,
              }}
            >
              <Search size={16} style={{ color: theme.colors.foreground.tertiary }} />
              <input
                type="text"
                placeholder="Search projects, mixes..."
                className="ml-2 bg-transparent border-none outline-none w-full"
                style={{ color: theme.colors.foreground.primary }}
              />
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center ml-auto space-x-2">
            {/* New project button */}
            <button
              className="hidden sm:flex items-center px-3 py-1.5 rounded-md"
              style={{
                backgroundColor: theme.colors.accent.default,
                color: theme.colors.background.primary,
              }}
              onClick={() => navigate("/new-project")}
            >
              <Plus size={16} className="mr-1" />
              <span>New Project</span>
            </button>

            {/* Help button */}
            <button
              className="p-2 rounded-full hover:bg-black hover:bg-opacity-10"
              style={{ color: theme.colors.foreground.secondary }}
            >
              <HelpCircle size={20} />
            </button>

            {/* Notifications button */}
            <button
              className="p-2 rounded-full hover:bg-black hover:bg-opacity-10"
              style={{ color: theme.colors.foreground.secondary }}
            >
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: theme.colors.background.primary }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
