"use client";

import { useRouter } from "next/navigation";
import {
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type TextareaHTMLAttributes,
} from "react";
import { UnitPicker } from "@/components/UnitPicker";
import { createFoodAction, updateFoodAction } from "@/lib/actions/foods";
import type { Food } from "@/lib/types";

const NOTES_MAX_HEIGHT_PX = 180;

type Props = {
  food?: Food;
};

type FieldKey = "name" | "unit" | "kcal" | "protein_g" | "carbs_g" | "fat_g";
type FieldErrors = Partial<Record<FieldKey, string>>;

function sanitizeDecimal(raw: string): string {
  let next = raw.replace(/[^\d.,]/g, "");
  const sep = next.includes(",") ? "," : next.includes(".") ? "." : null;
  if (sep) {
    const [head, ...rest] = next.split(sep);
    next = `${head}${sep}${rest.join("").replace(/[.,]/g, "")}`;
  }
  return next;
}

function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function FoodForm({ food }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [name, setName] = useState(food?.name ?? "");
  const [unit, setUnit] = useState(food?.unit ?? "");
  const [kcal, setKcal] = useState(
    food?.kcal === undefined || food?.kcal === null ? "" : String(food.kcal),
  );
  const [protein, setProtein] = useState(
    food?.protein_g === undefined || food?.protein_g === null
      ? ""
      : String(food.protein_g),
  );
  const [carbs, setCarbs] = useState(
    food?.carbs_g === undefined || food?.carbs_g === null
      ? ""
      : String(food.carbs_g),
  );
  const [fat, setFat] = useState(
    food?.fat_g === undefined || food?.fat_g === null ? "" : String(food.fat_g),
  );
  const [notes, setNotes] = useState(food?.notes ?? "");

  function clearError(key: FieldKey) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Che, esto no se completa solo";
    if (!unit.trim()) next.unit = "Che, esto no se completa solo";

    const kcalN = toNumber(kcal);
    const proteinN = toNumber(protein);
    const carbsN = toNumber(carbs);
    const fatN = toNumber(fat);

    if (kcalN === null) next.kcal = "Che, esto no se completa solo";
    else if (kcalN < 0) next.kcal = "Tiene que ser 0 o más";

    if (proteinN === null) next.protein_g = "Che, esto no se completa solo";
    else if (proteinN < 0) next.protein_g = "Tiene que ser 0 o más";

    if (carbsN === null) next.carbs_g = "Che, esto no se completa solo";
    else if (carbsN < 0) next.carbs_g = "Tiene que ser 0 o más";

    if (fatN === null) next.fat_g = "Che, esto no se completa solo";
    else if (fatN < 0) next.fat_g = "Tiene que ser 0 o más";

    return next;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("unit", unit.trim());
    formData.set("kcal", String(toNumber(kcal) ?? 0));
    formData.set("protein_g", String(toNumber(protein) ?? 0));
    formData.set("carbs_g", String(toNumber(carbs) ?? 0));
    formData.set("fat_g", String(toNumber(fat) ?? 0));
    formData.set("notes", notes);

    startTransition(async () => {
      try {
        if (food) {
          await updateFoodAction(food.id, formData);
          router.push(`/alimentos/${food.id}`);
        } else {
          await createFoodAction(formData);
          router.push("/alimentos");
        }
        router.refresh();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field
        label="Nombre"
        error={errors.name}
      >
        <input
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          placeholder="Ej: Huevo"
          className={`field ${errors.name ? "field-error" : ""}`}
        />
      </Field>

      <Field
        label="Unidad (por la que cargás macros)"
        error={errors.unit}
      >
        <div className="flex items-center gap-2">
          <input
            name="unit"
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              clearError("unit");
            }}
            placeholder="Ej: unidad, 100 gramos, cucharada"
            className={`field min-w-0 flex-1 ${errors.unit ? "field-error" : ""}`}
          />
          <UnitPicker
            value={unit}
            onSelect={(next) => {
              setUnit(next);
              clearError("unit");
            }}
          />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Kcal" error={errors.kcal}>
          <input
            type="text"
            inputMode="decimal"
            enterKeyHint="next"
            autoComplete="off"
            value={kcal}
            onChange={(e) => {
              setKcal(sanitizeDecimal(e.target.value));
              clearError("kcal");
            }}
            placeholder="70"
            className={`field ${errors.kcal ? "field-error" : ""}`}
          />
        </Field>
        <Field label="Proteínas (g)" error={errors.protein_g}>
          <input
            type="text"
            inputMode="decimal"
            enterKeyHint="next"
            autoComplete="off"
            value={protein}
            onChange={(e) => {
              setProtein(sanitizeDecimal(e.target.value));
              clearError("protein_g");
            }}
            placeholder="6.5"
            className={`field ${errors.protein_g ? "field-error" : ""}`}
          />
        </Field>
        <Field label="Carbohidratos (g)" error={errors.carbs_g}>
          <input
            type="text"
            inputMode="decimal"
            enterKeyHint="next"
            autoComplete="off"
            value={carbs}
            onChange={(e) => {
              setCarbs(sanitizeDecimal(e.target.value));
              clearError("carbs_g");
            }}
            placeholder="0.5"
            className={`field ${errors.carbs_g ? "field-error" : ""}`}
          />
        </Field>
        <Field label="Grasas (g)" error={errors.fat_g}>
          <input
            type="text"
            inputMode="decimal"
            enterKeyHint="next"
            autoComplete="off"
            value={fat}
            onChange={(e) => {
              setFat(sanitizeDecimal(e.target.value));
              clearError("fat_g");
            }}
            placeholder="5"
            className={`field ${errors.fat_g ? "field-error" : ""}`}
          />
        </Field>
      </div>

      <Field label="Notas (opcional)">
        <AutoGrowTextarea
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
          className="field resize-none overflow-y-auto"
          rows={3}
          maxHeight={NOTES_MAX_HEIGHT_PX}
        />
      </Field>

      {formError ? <p className="text-sm text-danger">{formError}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 min-h-12 rounded-2xl bg-primary px-4 text-base font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando…" : food ? "Guardar cambios" : "Crear alimento"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
}

function AutoGrowTextarea({
  value,
  maxHeight,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
  maxHeight: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      className={className}
      style={{ maxHeight }}
    />
  );
}
