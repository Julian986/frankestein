"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0b0f1a" : "#152a6e");
  }
}

function resolveTheme(): Theme {
  const stored = window.localStorage.getItem("theme");
  // Default global: oscuro (luna). Solo claro si el usuario lo eligió.
  if (stored === "light") return "light";
  return "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const initial = resolveTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggle() {
    const current = theme ?? resolveTheme();
    const next: Theme = current === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("theme", next);
    applyTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-lg shadow-sm transition active:scale-95"
      suppressHydrationWarning
    >
      <span aria-hidden suppressHydrationWarning>
        {theme === null ? "◐" : isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
