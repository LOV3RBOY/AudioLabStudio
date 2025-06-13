import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTheme } from "./ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

// Toast types
export type ToastType = "success" | "error" | "warning" | "info";

// Toast interface
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
}

// Toast context interface
interface ToastContextValue {
  toasts: Toast[];
  toast: (props: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Create context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Toast provider props
interface ToastProviderProps {
  children: ReactNode;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  maxToasts?: number;
}

// Toast provider component
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = "top-right",
  maxToasts = 5,
}) => {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add toast
  const toast = (props: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      ...props,
      id,
      duration: props.duration || 5000, // Default 5 seconds
    };

    setToasts((prevToasts) => {
      // Limit number of toasts
      const updatedToasts = [...prevToasts, newToast];
      return updatedToasts.slice(-maxToasts);
    });

    return id;
  };

  // Remove toast
  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // Clear all toasts
  const clearToasts = () => {
    setToasts([]);
  };

  // Get position styles
  const getPositionStyles = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-center":
        return "top-4 left-1/2 -translate-x-1/2";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-center":
        return "bottom-4 left-1/2 -translate-x-1/2";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "top-4 right-4";
    }
  };

  // Get toast icon
  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle size={18} />;
      case "error":
        return <AlertCircle size={18} />;
      case "warning":
        return <AlertTriangle size={18} />;
      case "info":
        return <Info size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  // Get toast color
  const getToastColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          background: theme.colors.success.muted,
          border: theme.colors.success.default,
          icon: theme.colors.success.default,
        };
      case "error":
        return {
          background: theme.colors.error.muted,
          border: theme.colors.error.default,
          icon: theme.colors.error.default,
        };
      case "warning":
        return {
          background: theme.colors.warning.muted,
          border: theme.colors.warning.default,
          icon: theme.colors.warning.default,
        };
      case "info":
        return {
          background: theme.colors.accent.muted,
          border: theme.colors.accent.default,
          icon: theme.colors.accent.default,
        };
      default:
        return {
          background: theme.colors.accent.muted,
          border: theme.colors.accent.default,
          icon: theme.colors.accent.default,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast, clearToasts }}>
      {children}
      <div
        className={`fixed z-50 flex flex-col gap-2 ${getPositionStyles()}`}
        style={{ maxWidth: "420px", pointerEvents: "none" }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => {
                removeToast(toast.id);
                if (toast.onClose) toast.onClose();
              }}
              getToastIcon={getToastIcon}
              getToastColor={getToastColor}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

// Toast item component
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
  getToastIcon: (type: ToastType) => JSX.Element;
  getToastColor: (type: ToastType) => {
    background: string;
    border: string;
    icon: string;
  };
}

const ToastItem: React.FC<ToastItemProps> = ({
  toast,
  onClose,
  getToastIcon,
  getToastColor,
}) => {
  const { theme } = useTheme();
  const colors = getToastColor(toast.type);

  // Auto-close after duration
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg shadow-md pointer-events-auto"
      style={{
        backgroundColor: colors.background,
        borderLeft: `4px solid ${colors.border}`,
        boxShadow: theme.shadows.md,
      }}
    >
      <div className="relative flex items-start p-4 pr-8 max-w-md">
        <div
          className="flex-shrink-0 mr-3"
          style={{ color: colors.icon }}
        >
          {getToastIcon(toast.type)}
        </div>
        <div className="flex-1 pt-0.5">
          <h3
            className="text-sm font-medium mb-1"
            style={{ color: theme.colors.foreground.primary }}
          >
            {toast.title}
          </h3>
          {toast.description && (
            <p
              className="text-sm"
              style={{ color: theme.colors.foreground.secondary }}
            >
              {toast.description}
            </p>
          )}
        </div>
        <button
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black hover:bg-opacity-10"
          onClick={onClose}
          style={{ color: theme.colors.foreground.tertiary }}
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// Custom hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastProvider;
