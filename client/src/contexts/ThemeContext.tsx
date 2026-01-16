import React, { createContext, useContext, useEffect, useState } from "react";

// 支援的風格類型
export type StyleTheme = "dark-gradient" | "light-contour";

interface ThemeContextType {
  styleTheme: StyleTheme;
  setStyleTheme: (theme: StyleTheme) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: StyleTheme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light-contour",
  switchable = true,
}: ThemeProviderProps) {
  const [styleTheme, setStyleThemeState] = useState<StyleTheme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("styleTheme");
      return (stored as StyleTheme) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // 移除所有風格類別
    root.classList.remove("dark-gradient", "light-contour", "dark");
    
    // 添加當前風格類別
    root.classList.add(styleTheme);
    
    // 深色主題需要添加 dark 類別
    if (styleTheme === "dark-gradient") {
      root.classList.add("dark");
    }

    if (switchable) {
      localStorage.setItem("styleTheme", styleTheme);
    }
  }, [styleTheme, switchable]);

  const setStyleTheme = (theme: StyleTheme) => {
    setStyleThemeState(theme);
  };

  return (
    <ThemeContext.Provider value={{ styleTheme, setStyleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// 風格名稱對照
export const STYLE_THEME_NAMES: Record<StyleTheme, string> = {
  "dark-gradient": "深色漸層",
  "light-contour": "白色等高線",
};
