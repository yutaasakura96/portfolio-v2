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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard: must set mounted in effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "pressable p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
        className
      )}
    >
      <Sun
        className={cn(
          "h-5 w-5 transition-transform duration-300",
          mounted && isDark ? "hidden" : "block rotate-0"
        )}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          "h-5 w-5 transition-transform duration-300",
          mounted && isDark ? "block rotate-0" : "hidden"
        )}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
        aria-hidden="true"
      />
    </button>
  );
}
