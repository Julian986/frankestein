"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { MacroSummary } from "@/components/MacroSummary";
import { OptionPicker } from "@/components/OptionPicker";
import { createMealAction, updateMealAction } from "@/lib/actions/meals";
import { emptyMacros, scaleMacros, addMacros } from "@/lib/nutrition";
import type { Food, MealType, MealWithItems } from "@/lib/types";
import { MEAL_TYPE_LABELS } from "@/lib/types";

const MEAL_TYPE_OPTIONS = (
  Object.keys(MEAL_TYPE_LABELS) as MealType[]
).map((value) => ({
  value,
  label: MEAL_TYPE_LABELS[value],
}));

type DraftItem = { key: string; food_id: string; quantity: string };

type Props = {
  foods: Food[];
  meal?: MealWithItems;
};

export function MealForm({ foods, meal }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [mealTypeError, setMealTypeError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<
    Record<string, { food?: string; quantity?: string }>
  >({});
  const [name, setName] = useState(meal?.name ?? "");
  const [mealType, setMealType] = useState<MealType | "">(
    meal?.meal_type ?? "",
  );
  const [characteristics, setCharacteristics] = useState(
    meal?.characteristics ?? "",
  );
  const [isFavorite, setIsFavorite] = useState(meal?.is_favorite ?? false);
  const [items, setItems] = useState<DraftItem[]>(
    meal?.items.map((i) => ({
      key: i.id,
      food_id: i.food_id,
      quantity: String(i.quantity),
    })) ?? [{ key: crypto.randomUUID(), food_id: "", quantity: "1" }],
  );

  const foodMap = useMemo(
    () => new Map(foods.map((f) => [f.id, f])),
    [foods],
  );

  const foodOptions = useMemo(
    () =>
      foods.map((f) => ({
        value: f.id,
        label: `${f.name} · ${f.unit}`,
      })),
    [foods],
  );

  const preview = useMemo(() => {
    return items.reduce((acc, item) => {
      const food = foodMap.get(item.food_id);
      const qty = Number(String(item.quantity).replace(",", "."));
      if (!food || !(qty > 0)) return acc;
      return addMacros(
        acc,
        scaleMacros(
          {
            kcal: food.kcal,
            protein_g: food.protein_g,
            carbs_g: food.carbs_g,
            fat_g: food.fat_g,
          },
          qty,
        ),
      );
    }, emptyMacros());
  }, [items, foodMap]);

  function addRow() {
    setItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), food_id: "", quantity: "1" },
    ]);
  }

  function removeRow(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
    setItemErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const nextNameError = !name.trim() ? "Che, esto no se completa solo" : null;
    const nextMealTypeError = !mealType
      ? "Che, esto no se completa solo"
      : null;
    const nextItemErrors: Record<string, { food?: string; quantity?: string }> =
      {};
    let hasValidItem = false;

    for (const item of items) {
      const qty = Number(String(item.quantity).replace(",", "."));
      const row: { food?: string; quantity?: string } = {};
      if (!item.food_id) row.food = "Che, esto no se completa solo";
      if (!(qty > 0)) row.quantity = "Che, esto no se completa solo";
      if (row.food || row.quantity) nextItemErrors[item.key] = row;
      if (item.food_id && qty > 0) hasValidItem = true;
    }

    setNameError(nextNameError);
    setMealTypeError(nextMealTypeError);
    setItemErrors(nextItemErrors);

    if (
      nextNameError ||
      nextMealTypeError ||
      Object.keys(nextItemErrors).length > 0
    ) {
      return;
    }
    if (!hasValidItem) {
      setError("Agregá al menos un alimento");
      return;
    }

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("meal_type", mealType);
    formData.set("characteristics", characteristics);
    formData.set("is_favorite", isFavorite ? "true" : "false");
    for (const item of items) {
      formData.append("food_id", item.food_id);
      formData.append("quantity", String(item.quantity).replace(",", "."));
    }

    startTransition(async () => {
      try {
        if (meal) {
          await updateMealAction(meal.id, formData);
          router.push(`/comidas/${meal.id}`);
        } else {
          const id = await createMealAction(formData);
          router.push(`/comidas/${id}`);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Nombre del conjunto
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          placeholder="Ej: Conjunto desayuno 1"
          className={`field ${nameError ? "field-error" : ""}`}
        />
        {nameError ? (
          <span className="text-xs font-medium text-danger">{nameError}</span>
        ) : null}
      </label>

      <OptionPicker
        label="Tipo de comida"
        title="Elegir tipo"
        value={mealType}
        options={MEAL_TYPE_OPTIONS}
        placeholder="Elegí un tipo…"
        error={mealTypeError ?? undefined}
        onChange={(value) => {
          setMealType(value);
          if (mealTypeError) setMealTypeError(null);
        }}
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Alimentos</h3>
          <button
            type="button"
            onClick={addRow}
            className="shrink-0 text-sm font-semibold text-primary"
          >
            + Agregar
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="py-2 text-sm text-muted">
              No hay alimentos. Tocá “+ Agregar”.
            </p>
          ) : null}
          {items.map((item) => {
            const food = foodMap.get(item.food_id);
            const rowError = itemErrors[item.key];
            return (
              <div
                key={item.key}
                className="min-w-0 rounded-xl bg-background p-3"
              >
                <OptionPicker
                  label="Alimento"
                  title="Elegir alimento"
                  value={item.food_id}
                  options={foodOptions}
                  placeholder="Elegí un alimento…"
                  error={rowError?.food}
                  labelAction={
                    <button
                      type="button"
                      onClick={() => removeRow(item.key)}
                      aria-label="Quitar alimento"
                      title="Quitar"
                      className="inline-flex size-9 items-center justify-center rounded-xl text-lg text-danger transition active:bg-danger/10"
                    >
                      <span aria-hidden>🗑️</span>
                    </button>
                  }
                  onChange={(foodId) => {
                    setItems((prev) =>
                      prev.map((row) =>
                        row.key === item.key
                          ? { ...row, food_id: foodId }
                          : row,
                      ),
                    );
                    setItemErrors((prev) => {
                      if (!prev[item.key]?.food) return prev;
                      const copy = { ...prev };
                      const current = { ...copy[item.key] };
                      delete current.food;
                      if (!current.quantity) delete copy[item.key];
                      else copy[item.key] = current;
                      return copy;
                    });
                  }}
                />

                <label className="mt-3 flex flex-col gap-1.5 text-sm font-medium">
                  Cantidad
                  <input
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="done"
                    value={item.quantity}
                    onChange={(e) => {
                      let next = e.target.value.replace(/[^\d.,]/g, "");
                      const sep = next.includes(",")
                        ? ","
                        : next.includes(".")
                          ? "."
                          : null;
                      if (sep) {
                        const [head, ...rest] = next.split(sep);
                        next = `${head}${sep}${rest.join("").replace(/[.,]/g, "")}`;
                      }
                      setItems((prev) =>
                        prev.map((row) =>
                          row.key === item.key
                            ? { ...row, quantity: next }
                            : row,
                        ),
                      );
                      setItemErrors((prev) => {
                        if (!prev[item.key]?.quantity) return prev;
                        const copy = { ...prev };
                        const current = { ...copy[item.key] };
                        delete current.quantity;
                        if (!current.food) delete copy[item.key];
                        else copy[item.key] = current;
                        return copy;
                      });
                    }}
                    className={`field w-full ${rowError?.quantity ? "field-error" : ""}`}
                    placeholder="Ej: 1"
                  />
                  {rowError?.quantity ? (
                    <span className="text-xs font-medium text-danger">
                      {rowError.quantity}
                    </span>
                  ) : null}
                  {food ? (
                    <span className="text-xs text-muted">× {food.unit}</span>
                  ) : null}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Totales del conjunto</p>
        <MacroSummary macros={preview} />
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Características (opcional)
        <textarea
          value={characteristics}
          onChange={(e) => setCharacteristics(e.target.value)}
          rows={3}
          placeholder="Ej: Alta en proteínas, buena saciedad…"
          className="field resize-none"
        />
      </label>

      <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-card px-4 text-sm font-medium">
        <input
          type="checkbox"
          checked={isFavorite}
          onChange={(e) => setIsFavorite(e.target.checked)}
          className="size-5 accent-primary"
        />
        Marcar como favorito (acceso rápido en Hoy)
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || foods.length === 0}
        className="min-h-12 rounded-2xl bg-primary px-4 text-base font-semibold text-white disabled:opacity-60"
      >
        {pending
          ? "Guardando…"
          : meal
            ? "Guardar cambios"
            : "Crear conjunto"}
      </button>
      {foods.length === 0 ? (
        <p className="text-sm text-muted">
          Primero cargá al menos un alimento en la pestaña Alimentos.
        </p>
      ) : null}
    </form>
  );
}
