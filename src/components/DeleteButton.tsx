"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";

type Props = {
  label?: string;
  confirmMessage: string;
  redirectTo: string;
  action: () => Promise<void>;
  title?: string;
};

export function DeleteButton({
  label = "Eliminar",
  confirmMessage,
  redirectTo,
  action,
  title = "¿Estás seguro?",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setOpen(false);
        router.push(redirectTo);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className="min-h-11 w-full rounded-2xl border border-danger/30 bg-card px-4 text-sm font-semibold text-danger disabled:opacity-60"
      >
        {label}
      </button>

      {open ? (
        <Modal
          title={title}
          onClose={close}
          footer={
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={confirmDelete}
                className="min-h-12 w-full rounded-2xl bg-danger px-4 text-base font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Eliminando…" : "Sí, eliminar"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={close}
                className="min-h-12 w-full rounded-2xl border border-border bg-card px-4 text-base font-semibold text-foreground disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          }
        >
          <p className="text-sm leading-relaxed text-muted">{confirmMessage}</p>
          {error ? (
            <p className="mt-3 text-sm font-medium text-danger">{error}</p>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}
