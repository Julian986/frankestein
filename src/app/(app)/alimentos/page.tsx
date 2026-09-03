import Link from "next/link";
import { db } from "@/lib/db/repository";
import { formatMacro } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

export default async function AlimentosPage() {
  const foods = await db.listFoods();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alimentos</h1>
          <p className="mt-1 text-sm text-muted">
            Base con macros por unidad
          </p>
        </div>
        <Link
          href="/alimentos/nuevo"
          className="inline-flex min-h-11 shrink-0 items-center rounded-2xl bg-primary px-3 text-sm font-semibold text-white"
        >
          + Nuevo
        </Link>
      </header>

      <div className="flex flex-col gap-3">
        {foods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center">
            <p className="font-medium">Todavía no hay alimentos</p>
            <Link
              href="/alimentos/nuevo"
              className="mt-2 inline-block text-sm font-semibold text-primary"
            >
              Cargar el primero
            </Link>
          </div>
        ) : (
          foods.map((food) => (
            <Link
              key={food.id}
              href={`/alimentos/${food.id}`}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm transition active:scale-[0.99]"
            >
              <div>
                <h2 className="font-semibold">{food.name}</h2>
                <p className="mt-1 text-sm text-muted">{food.unit}</p>
              </div>
              <p className="mt-2 text-sm text-muted">
                K {formatMacro(food.kcal)} · P {formatMacro(food.protein_g)}g · C{" "}
                {formatMacro(food.carbs_g)}g · G {formatMacro(food.fat_g)}g
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
