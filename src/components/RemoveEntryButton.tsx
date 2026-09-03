"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { removeDailyEntryAction } from "@/lib/actions/daily";

type Props = {
  entryId: string;
  name: string;
};

export function RemoveEntryButton({ entryId, name }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  function confirmRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await removeDailyEntryAction(entryId);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo sacar");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        aria-label={`Sacar ${name} del día`}
        title="Sacar del día"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-lg text-danger transition active:bg-danger/10 disabled:opacity-60"
      >
        <span aria-hidden>🗑️</span>
      </button>

      {open ? (
        <Modal
          title="¿Estás seguro?"
          onClose={close}
          footer={
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={confirmRemove}
                className="min-h-12 w-full rounded-2xl bg-danger px-4 text-base font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Sacando…" : "Sí, eliminar"}
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
          <p className="text-sm leading-relaxed text-muted">
            Esto saca “{name}” de las comidas cargadas. No borra el alimento ni
            el conjunto.
          </p>
          {error ? (
            <p className="mt-3 text-sm font-medium text-danger">{error}</p>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}
