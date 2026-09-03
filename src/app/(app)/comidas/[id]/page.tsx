import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";
import { ExpandableText } from "@/components/ExpandableText";
import { FavoriteButton } from "@/components/FavoriteButton";
import { MacroSummary } from "@/components/MacroSummary";
import { deleteMealAction } from "@/lib/actions/meals";
import { db } from "@/lib/db/repository";
import { formatMacro, scaleMacros } from "@/lib/nutrition";
import { MEAL_TYPE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ComidaDetailPage({ params }: Props) {
  const { id } = await params;
  const meal = await db.getMeal(id);
  if (!meal) notFound();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="flex items-center gap-2">
          <Link
            href="/comidas"
            aria-label="Volver a comidas"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-2xl font-semibold text-primary"
          >
            ←
          </Link>
          <h1 className="min-w-0 text-2xl font-bold tracking-tight">
            {meal.name}
          </h1>
        </div>
        <p className="mt-1 pl-12 text-sm text-muted">
          {MEAL_TYPE_LABELS[meal.meal_type]}
        </p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Totales
        </h2>
        <MacroSummary macros={meal.macros} />
      </section>

      <div className="flex gap-2">
        <FavoriteButton mealId={meal.id} isFavorite={meal.is_favorite} />
        <Link
          href={`/comidas/${meal.id}/editar`}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold"
        >
          Editar
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Alimentos</h2>
        {meal.items.map((item) => {
          const scaled = scaleMacros(
            {
              kcal: item.food.kcal,
              protein_g: item.food.protein_g,
              carbs_g: item.food.carbs_g,
              fat_g: item.food.fat_g,
            },
            item.quantity,
          );
          return (
            <Link
              key={item.id}
              href={`/alimentos/${item.food.id}`}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm transition active:scale-[0.99]"
            >
              <div>
                <h3 className="font-semibold">{item.food.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  {formatMacro(item.quantity)} × {item.food.unit}
                </p>
              </div>
              <p className="mt-2 text-sm text-muted">
                K {formatMacro(scaled.kcal)} · P {formatMacro(scaled.protein_g)}
                g · C {formatMacro(scaled.carbs_g)}g · G{" "}
                {formatMacro(scaled.fat_g)}g
              </p>
            </Link>
          );
        })}
      </section>

      {meal.characteristics ? (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Características
          </h2>
          <ExpandableText text={meal.characteristics} />
        </section>
      ) : null}

      <DeleteButton
        title="Eliminar conjunto"
        confirmMessage="Si lo borrás, no hay vuelta atrás."
        redirectTo="/comidas"
        action={async () => {
          "use server";
          await deleteMealAction(meal.id);
        }}
      />
    </div>
  );
}
