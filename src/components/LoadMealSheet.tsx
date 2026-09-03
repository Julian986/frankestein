"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { MacroSummary } from "@/components/MacroSummary";
import { Modal } from "@/components/Modal";
import {
  addDailyEntryAction,
  addDailyFoodEntryAction,
} from "@/lib/actions/daily";
import { scaleMacros } from "@/lib/nutrition";
import {
  MEAL_TYPE_LABELS,
  type Food,
  type MealWithItems,
} from "@/lib/types";

type Selection =
  | { kind: "meal"; id: string }
  | { kind: "food"; id: string };

type Props = {
  meals: MealWithItems[];
  foods: Food[];
};

export function LoadMealSheet({ meals, foods }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const favorites = useMemo(
    () => meals.filter((m) => m.is_favorite),
    [meals],
  );
  const others = useMemo(
    () => meals.filter((m) => !m.is_favorite),
    [meals],
  );

  const selectedMeal =
    selection?.kind === "meal"
      ? (meals.find((m) => m.id === selection.id) ?? null)
      : null;
  const selectedFood =
    selection?.kind === "food"
      ? (foods.find((f) => f.id === selection.id) ?? null)
      : null;

  const qty = Number(String(quantity).replace(",", "."));
  const foodMacros =
    selectedFood && qty > 0
      ? scaleMacros(
          {
            kcal: selectedFood.kcal,
            protein_g: selectedFood.protein_g,
            carbs_g: selectedFood.carbs_g,
            fat_g: selectedFood.fat_g,
          },
          qty,
        )
      : null;

  function close() {
    setOpen(false);
    setSelection(null);
    setQuantity("1");
    setQuantityError(null);
    setError(null);
  }

  function selectMeal(id: string) {
    setSelection({ kind: "meal", id });
    setQuantity("1");
    setQuantityError(null);
    setError(null);
  }

  function selectFood(id: string) {
    setSelection({ kind: "food", id });
    setQuantity("1");
    setQuantityError(null);
    setError(null);
  }

  function onQuantityChange(value: string) {
    let next = value.replace(/[^\d.,]/g, "");
    const sep = next.includes(",")
      ? ","
      : next.includes(".")
        ? "."
        : null;
    if (sep) {
      const [head, ...rest] = next.split(sep);
      next = `${head}${sep}${rest.join("").replace(/[.,]/g, "")}`;
    }
    setQuantity(next);
    setQuantityError(null);
  }

  function confirm() {
    if (!selection) return;
    setError(null);

    if (selection.kind === "food") {
      if (!(qty > 0)) {
        setQuantityError("Che, esto no se completa solo");
        return;
      }
    }

    startTransition(async () => {
      try {
        if (selection.kind === "meal") {
          await addDailyEntryAction(selection.id);
        } else {
          await addDailyFoodEntryAction(selection.id, qty);
        }
        close();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-semibold text-white shadow-sm active:bg-primary-dark"
      >
        <span aria-hidden>+</span> Cargar comida
      </button>

      {open ? (
        <Modal
          title="Cargar comida"
          onClose={close}
          footer={
            <div className="space-y-3">
              {selectedFood ? (
                <>
                  {foodMacros ? (
                    <div>
                      <p className="mb-2 text-sm font-semibold">
                        Macros de {selectedFood.name}
                      </p>
                      <MacroSummary macros={foodMacros} compact />
                    </div>
                  ) : null}
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Cantidad
                    <input
                      type="text"
                      inputMode="decimal"
                      enterKeyHint="done"
                      value={quantity}
                      onChange={(e) => onQuantityChange(e.target.value)}
                      className={`field w-full ${quantityError ? "field-error" : ""}`}
                      placeholder="Ej: 1"
                    />
                    {quantityError ? (
                      <span className="text-xs font-medium text-danger">
                        {quantityError}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">
                        × {selectedFood.unit}
                      </span>
                    )}
                  </label>
                </>
              ) : null}
              <button
                type="button"
                disabled={!selection || pending}
                onClick={confirm}
                className="min-h-12 w-full rounded-2xl bg-primary text-base font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Cargando…" : "Aceptar"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {favorites.length > 0 ? (
              <Section title="Favoritos">
                {favorites.map((meal) => (
                  <MealOption
                    key={meal.id}
                    meal={meal}
                    selected={
                      selection?.kind === "meal" && selection.id === meal.id
                    }
                    onSelect={() => selectMeal(meal.id)}
                  />
                ))}
              </Section>
            ) : null}

            <Section title={favorites.length ? "Todas" : "Tus comidas"}>
              {(favorites.length ? others : meals).map((meal) => (
                <MealOption
                  key={meal.id}
                  meal={meal}
                  selected={
                    selection?.kind === "meal" && selection.id === meal.id
                  }
                  onSelect={() => selectMeal(meal.id)}
                />
              ))}
              {meals.length === 0 ? (
                <p className="text-sm text-muted">
                  Todavía no hay conjuntos. Creá uno en Comidas.
                </p>
              ) : null}
            </Section>

            <Section title="Alimentos">
              {foods.map((food) => (
                <FoodOption
                  key={food.id}
                  food={food}
                  selected={
                    selection?.kind === "food" && selection.id === food.id
                  }
                  onSelect={() => selectFood(food.id)}
                />
              ))}
              {foods.length === 0 ? (
                <p className="text-sm text-muted">
                  Todavía no hay alimentos. Creá uno en Alimentos.
                </p>
              ) : null}
            </Section>

            {selectedMeal ? (
              <div>
                <p className="mb-2 text-sm font-semibold">
                  Macros de {selectedMeal.name}
                </p>
                <MacroSummary macros={selectedMeal.macros} />
              </div>
            ) : null}

            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function MealOption({
  meal,
  selected,
  onSelect,
}: {
  meal: MealWithItems;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border px-3 py-3 text-left transition ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-border bg-background text-foreground"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{meal.name}</span>
        <span className={`text-xs ${selected ? "text-white/80" : "text-muted"}`}>
          {Math.round(meal.macros.kcal)} kcal
        </span>
      </div>
      <p className={`mt-1 text-xs ${selected ? "text-white/80" : "text-muted"}`}>
        {MEAL_TYPE_LABELS[meal.meal_type]}
        {meal.is_favorite ? " · ★" : ""}
      </p>
    </button>
  );
}

function FoodOption({
  food,
  selected,
  onSelect,
}: {
  food: Food;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border px-3 py-3 text-left transition ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-border bg-background text-foreground"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{food.name}</span>
        <span className={`text-xs ${selected ? "text-white/80" : "text-muted"}`}>
          {Math.round(food.kcal)} kcal
        </span>
      </div>
      <p className={`mt-1 text-xs ${selected ? "text-white/80" : "text-muted"}`}>
        por {food.unit}
      </p>
    </button>
  );
}
