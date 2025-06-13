import React, { createContext, useContext, ReactNode } from "react";

// Define theme colors with semantic naming
export interface ThemeColors {
  // Base colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
  };
  foreground: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };
  border: {
    default: string;
    strong: string;
    focus: string;
  };
  // Semantic colors
  accent: {
    default: string;
    hover: string;
    pressed: string;
    muted: string;
  };
  success: {
    default: string;
    hover: string;
    muted: string;
  };
  warning: {
    default: string;
    hover: string;
    muted: string;
  };
  error: {
    default: string;
    hover: string;
    muted: string;
  };
  // Audio-specific colors
  waveform: {
    background: string;
    primary: string;
    secondary: string;
    played: string;
    cursor: string;
    grid: string;
  };
  stems: {
    drums: string;
    bass: string;
    vocals: string;
    guitar: string;
    keys: string;
    synth: string;
    strings: string;
    brass: string;
    fx: string;
    other: string;
  };
  // Visualization colors
  visualization: {
    low: string;
    lowMid: string;
    mid: string;
    highMid: string;
    high: string;
  };
  // Gradient presets
  gradients: {
    primary: string;
    accent: string;
    waveform: string;
  };
}

// Define typography system
export interface ThemeTypography {
  fontFamily: {
    sans: string;
    mono: string;
    display: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
  };
}

// Define spacing system
export interface ThemeSpacing {
  0: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

// Define shadows
export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
  focus: string;
  glow: string;
}

// Define animation timings
export interface ThemeAnimation {
  fast: string;
  normal: string;
  slow: string;
  curve: {
    default: string;
    smooth: string;
    bounce: string;
  };
}

// Define breakpoints
export interface ThemeBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
}

// Define z-index layers
export interface ThemeZIndex {
  background: number;
  default: number;
  dropdown: number;
  sticky: number;
  fixed: number;
  modal: number;
  popover: number;
  toast: number;
}

// Define the complete theme interface
export interface Theme {
  name: "light" | "dark";
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  animation: ThemeAnimation;
  breakpoints: ThemeBreakpoints;
  zIndex: ThemeZIndex;
  isDark: boolean;
}

// Light theme
const lightTheme: Theme = {
  name: "light",
  colors: {
    background: {
      primary: "#FFFFFF",
      secondary: "#F9FAFB",
      tertiary: "#F3F4F6",
      elevated: "#FFFFFF",
    },
    foreground: {
      primary: "#111827",
      secondary: "#4B5563",
      tertiary: "#6B7280",
      muted: "#9CA3AF",
    },
    border: {
      default: "#E5E7EB",
      strong: "#D1D5DB",
      focus: "#3B82F6",
    },
    accent: {
      default: "#6366F1",
      hover: "#4F46E5",
      pressed: "#4338CA",
      muted: "rgba(99, 102, 241, 0.1)",
    },
    success: {
      default: "#10B981",
      hover: "#059669",
      muted: "rgba(16, 185, 129, 0.1)",
    },
    warning: {
      default: "#F59E0B",
      hover: "#D97706",
      muted: "rgba(245, 158, 11, 0.1)",
    },
    error: {
      default: "#EF4444",
      hover: "#DC2626",
      muted: "rgba(239, 68, 68, 0.1)",
    },
    waveform: {
      background: "#F3F4F6",
      primary: "#6366F1",
      secondary: "#A5B4FC",
      played: "#4338CA",
      cursor: "#111827",
      grid: "#E5E7EB",
    },
    stems: {
      drums: "#EF4444",
      bass: "#F59E0B",
      vocals: "#10B981",
      guitar: "#3B82F6",
      keys: "#8B5CF6",
      synth: "#EC4899",
      strings: "#14B8A6",
      brass: "#F97316",
      fx: "#A855F7",
      other: "#6B7280",
    },
    visualization: {
      low: "#F59E0B",
      lowMid: "#10B981",
      mid: "#3B82F6",
      highMid: "#8B5CF6",
      high: "#EC4899",
    },
    gradients: {
      primary: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
      accent: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
      waveform: "linear-gradient(180deg, #A5B4FC 0%, #6366F1 100%)",
    },
  },
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      mono: "'IBM Plex Mono', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
      display: "'DrukMedium', 'Inter', sans-serif",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      md: "1.125rem",
      lg: "1.25rem",
      xl: "1.5rem",
      "2xl": "1.875rem",
      "3xl": "2.25rem",
      "4xl": "3rem",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0",
      wide: "0.025em",
    },
  },
  spacing: {
    0: "0",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    32: "8rem",
    40: "10rem",
    48: "12rem",
    56: "14rem",
    64: "16rem",
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    focus: "0 0 0 3px rgba(99, 102, 241, 0.5)",
    glow: "0 0 15px rgba(99, 102, 241, 0.5)",
  },
  animation: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
    curve: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      smooth: "cubic-bezier(0.65, 0, 0.35, 1)",
      bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  zIndex: {
    background: -10,
    default: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    popover: 50,
    toast: 60,
  },
  isDark: false,
};

// Dark theme
const darkTheme: Theme = {
  name: "dark",
  colors: {
    background: {
      primary: "#0F172A",
      secondary: "#1E293B",
      tertiary: "#334155",
      elevated: "#1E293B",
    },
    foreground: {
      primary: "#F8FAFC",
      secondary: "#E2E8F0",
      tertiary: "#CBD5E1",
      muted: "#94A3B8",
    },
    border: {
      default: "#334155",
      strong: "#475569",
      focus: "#6366F1",
    },
    accent: {
      default: "#818CF8",
      hover: "#6366F1",
      pressed: "#4F46E5",
      muted: "rgba(129, 140, 248, 0.2)",
    },
    success: {
      default: "#34D399",
      hover: "#10B981",
      muted: "rgba(52, 211, 153, 0.2)",
    },
    warning: {
      default: "#FBBF24",
      hover: "#F59E0B",
      muted: "rgba(251, 191, 36, 0.2)",
    },
    error: {
      default: "#F87171",
      hover: "#EF4444",
      muted: "rgba(248, 113, 113, 0.2)",
    },
    waveform: {
      background: "#1E293B",
      primary: "#818CF8",
      secondary: "#C7D2FE",
      played: "#6366F1",
      cursor: "#F8FAFC",
      grid: "#334155",
    },
    stems: {
      drums: "#F87171",
      bass: "#FBBF24",
      vocals: "#34D399",
      guitar: "#60A5FA",
      keys: "#A78BFA",
      synth: "#F472B6",
      strings: "#2DD4BF",
      brass: "#FB923C",
      fx: "#C084FC",
      other: "#94A3B8",
    },
    visualization: {
      low: "#FBBF24",
      lowMid: "#34D399",
      mid: "#60A5FA",
      highMid: "#A78BFA",
      high: "#F472B6",
    },
    gradients: {
      primary: "linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)",
      accent: "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)",
      waveform: "linear-gradient(180deg, #C7D2FE 0%, #818CF8 100%)",
    },
  },
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      mono: "'IBM Plex Mono', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
      display: "'DrukMedium', 'Inter', sans-serif",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      md: "1.125rem",
      lg: "1.25rem",
      xl: "1.5rem",
      "2xl": "1.875rem",
      "3xl": "2.25rem",
      "4xl": "3rem",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0",
      wide: "0.025em",
    },
  },
  spacing: {
    0: "0",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    32: "8rem",
    40: "10rem",
    48: "12rem",
    56: "14rem",
    64: "16rem",
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)",
    focus: "0 0 0 3px rgba(129, 140, 248, 0.5)",
    glow: "0 0 15px rgba(129, 140, 248, 0.5)",
  },
  animation: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
    curve: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      smooth: "cubic-bezier(0.65, 0, 0.35, 1)",
      bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  zIndex: {
    background: -10,
    default: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    popover: 50,
    toast: 60,
  },
  isDark: true,
};

// Create theme based on preference
export function createTheme(preference: "light" | "dark" | "system"): Theme {
  if (preference === "system") {
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? darkTheme : lightTheme;
  }
  return preference === "dark" ? darkTheme : lightTheme;
}

// Create theme context
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  theme: Theme;
  toggleTheme: () => void;
}

// Theme provider component
export function ThemeProvider({ children, theme, toggleTheme }: ThemeProviderProps) {
  // Apply theme variables to :root
  React.useEffect(() => {
    // Create CSS variables from theme
    const createCSSVariables = (obj: any, prefix = ""): Record<string, string> => {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        const varName = prefix ? `${prefix}-${key}` : `--${key}`;
        
        if (value !== null && typeof value === "object") {
          return { ...acc, ...createCSSVariables(value, varName) };
        }
        
        return { ...acc, [varName]: value as string };
      }, {});
    };

    // Generate CSS variables
    const colorVars = createCSSVariables(theme.colors, "--color");
    const typographyVars = createCSSVariables(theme.typography, "--typography");
    const spacingVars = createCSSVariables(theme.spacing, "--spacing");
    const shadowVars = createCSSVariables(theme.shadows, "--shadow");
    const animationVars = createCSSVariables(theme.animation, "--animation");
    const breakpointVars = createCSSVariables(theme.breakpoints, "--breakpoint");
    const zIndexVars = createCSSVariables(theme.zIndex, "--z");

    // Combine all variables
    const allVars = {
      ...colorVars,
      ...typographyVars,
      ...spacingVars,
      ...shadowVars,
      ...animationVars,
      ...breakpointVars,
      ...zIndexVars,
    };

    // Apply variables to :root
    Object.entries(allVars).forEach(([name, value]) => {
      document.documentElement.style.setProperty(name, value);
    });

    // Set data-theme attribute on document
    document.documentElement.setAttribute("data-theme", theme.name);
    
    // Set background color to prevent white flash during transitions
    document.body.style.backgroundColor = theme.colors.background.primary;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
