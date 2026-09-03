import Link from "next/link";
import { MealCard } from "@/components/MealCard";
import { db } from "@/lib/db/repository";
import type { MealType } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tipo?: string }>;
};

export default async function ComidasPage({ searchParams }: Props) {
  const params = await searchParams;
  const tipo = (params.tipo as MealType | "all" | undefined) ?? "all";
  const meals = await db.listMeals({
    meal_type: tipo === "all" ? "all" : tipo,
  });

  const filters: { key: MealType | "all"; label: string }[] = [
    { key: "all", label: "Todo" },
    { key: "desayuno_merienda", label: "Desayuno/Merienda" },
    { key: "almuerzo_cena", label: "Almuerzo/Cena" },
    { key: "snack_colacion", label: "Colación" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comidas</h1>
          <p className="mt-1 text-sm text-muted">
            Conjuntos / recetas con macros calculados
          </p>
        </div>
        <Link
          href="/comidas/nueva"
          className="inline-flex min-h-11 shrink-0 items-center rounded-2xl bg-primary px-3 text-sm font-semibold text-white"
        >
          + Nueva
        </Link>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => {
          const active = tipo === f.key;
          const href =
            f.key === "all" ? "/comidas" : `/comidas?tipo=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-primary text-white"
                  : "bg-card text-muted border border-border"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {meals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center">
            <p className="font-medium">No hay conjuntos en este filtro</p>
            <Link
              href="/comidas/nueva"
              className="mt-2 inline-block text-sm font-semibold text-primary"
            >
              Crear el primero
            </Link>
          </div>
        ) : (
          meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
        )}
      </div>
    </div>
  );
}
