"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";

export type OptionPickerItem<T extends string = string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  label: string;
  title?: string;
  value: T | "";
  options: OptionPickerItem<T>[];
  onChange: (value: T) => void;
  error?: string;
  placeholder?: string;
  labelAction?: React.ReactNode;
};

export function OptionPicker<T extends string>({
  label,
  title,
  value,
  options,
  onChange,
  error,
  placeholder = "Elegí una opción",
  labelAction,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = value
    ? options.find((o) => o.value === value)
    : undefined;

  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium">
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        {labelAction}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`field flex w-full min-w-0 items-center justify-between gap-2 text-left ${
          error ? "field-error" : ""
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? "text-foreground" : "text-muted"
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <span className="shrink-0 text-muted" aria-hidden>
          ▾
        </span>
      </button>
      {error ? (
        <span className="text-xs font-medium text-danger">{error}</span>
      ) : null}

      {open ? (
        <Modal title={title ?? label} onClose={() => setOpen(false)}>
          <div className="space-y-2">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold transition ${
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected ? <span aria-hidden>✓</span> : null}
                </button>
              );
            })}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
