"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Tooltip from "@/components/ui/Tooltip";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <Tooltip content={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} position="bottom">
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
        aria-label="Toggle theme"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>
    </Tooltip>
  );
}
