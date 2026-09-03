import Link from "next/link";
import { MacroSummary } from "@/components/MacroSummary";
import { MEAL_TYPE_LABELS, type MealWithItems } from "@/lib/types";

type Props = {
  meal: MealWithItems;
};

export function MealCard({ meal }: Props) {
  return (
    <Link
      href={`/comidas/${meal.id}`}
      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition active:scale-[0.99]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-snug">{meal.name}</h3>
          <p className="mt-1 text-xs text-muted">
            {MEAL_TYPE_LABELS[meal.meal_type]} · {meal.items.length} alimento
            {meal.items.length === 1 ? "" : "s"}
          </p>
        </div>
        {meal.is_favorite ? (
          <span className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white">
            ★ Fav
          </span>
        ) : null}
      </div>
      <MacroSummary macros={meal.macros} compact />
    </Link>
  );
}
