import Link from "next/link";
import { MealForm } from "@/components/MealForm";
import { db } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export default async function NuevaComidaPage() {
  const foods = await db.listFoods();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo conjunto</h1>
          <p className="mt-1 text-sm text-muted">
            Armá una comida con alimentos y cantidades
          </p>
        </div>
        <Link href="/comidas" className="text-sm font-semibold text-muted">
          Cerrar
        </Link>
      </header>
      <MealForm foods={foods} />
    </div>
  );
}
