"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render the resolved icon after mount.
  // This is the canonical next-themes pattern; the setState-in-effect lint
  // rule does not apply here because the value is hydration-gating, not
  // derivable from props/state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
        className
      )}
    >
      {/* Render both icons so server output is stable; toggle visibility via classes once mounted. */}
      <Sun className={cn("h-5 w-5", mounted && isDark ? "hidden" : "block")} aria-hidden="true" />
      <Moon className={cn("h-5 w-5", mounted && isDark ? "block" : "hidden")} aria-hidden="true" />
    </button>
  );
}
