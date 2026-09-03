"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";

const UNIT_OPTIONS = [
  "unidad",
  "100 gramos",
  "50 gramos",
  "25 gramos",
  "cucharada sopera",
  "cucharada",
  "taza",
  "porción",
  "feta",
  "vaso",
] as const;

type Props = {
  value: string;
  onSelect: (unit: string) => void;
};

export function UnitPicker({ value, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-lg text-muted transition active:bg-accent"
        aria-label="Elegir unidad común"
        title="Elegir unidad"
      >
        <span aria-hidden>⚙️</span>
      </button>

      {open ? (
        <Modal title="Elegir unidad" onClose={() => setOpen(false)}>
          <p className="mb-3 text-sm text-muted">
            Opciones comunes. También podés escribirla a mano.
          </p>
          <div className="space-y-2">
            {UNIT_OPTIONS.map((option) => {
              const selected =
                value.trim().toLowerCase() === option.toLowerCase();
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                  className={`flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold transition ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  <span className="capitalize">{option}</span>
                  {selected ? <span aria-hidden>✓</span> : null}
                </button>
              );
            })}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
