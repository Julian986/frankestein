"use client";

import { useEffect, useState } from "react";

type MacrosColorMode = "color" | "mono";

function applyMacrosColor(mode: MacrosColorMode) {
  document.documentElement.classList.toggle("macros-mono", mode === "mono");
}

function resolveMacrosColor(): MacrosColorMode {
  return window.localStorage.getItem("macrosColor") === "mono"
    ? "mono"
    : "color";
}

/** Toggle global: macros a color ↔ blanco/negro según el tema. */
export function MacrosColorToggle() {
  const [mode, setMode] = useState<MacrosColorMode | null>(null);

  useEffect(() => {
    const initial = resolveMacrosColor();
    setMode(initial);
    applyMacrosColor(initial);
  }, []);

  function toggle() {
    const current = mode ?? resolveMacrosColor();
    const next: MacrosColorMode = current === "color" ? "mono" : "color";
    setMode(next);
    window.localStorage.setItem("macrosColor", next);
    applyMacrosColor(next);
  }

  const isMono = mode === "mono";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        isMono
          ? "Usar macros a color"
          : "Usar macros en blanco y negro"
      }
      title={isMono ? "Macros a color" : "Macros B&N"}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background transition active:scale-95"
      suppressHydrationWarning
    >
      <span aria-hidden className="flex items-center justify-center">
        {isMono ? <ColorDots /> : <MonoDot />}
      </span>
    </button>
  );
}

function ColorDots() {
  return (
    <span className="macros-color-preview grid grid-cols-2 gap-0.5">
      <span className="size-1.5 rounded-full bg-kcal" />
      <span className="size-1.5 rounded-full bg-protein" />
      <span className="size-1.5 rounded-full bg-carbs" />
      <span className="size-1.5 rounded-full bg-fat" />
    </span>
  );
}

function MonoDot() {
  return <span className="size-2 rounded-full bg-foreground" />;
}
