import Link from "next/link";
import { notFound } from "next/navigation";
import { FoodForm } from "@/components/FoodForm";
import { db } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarAlimentoPage({ params }: Props) {
  const { id } = await params;
  const food = await db.getFood(id);
  if (!food) notFound();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/alimentos/${food.id}`}
            aria-label="Volver al alimento"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-2xl font-semibold text-primary"
          >
            ←
          </Link>
          <h1 className="min-w-0 text-2xl font-bold tracking-tight">
            Editar alimento
          </h1>
        </div>
        <Link
          href="/alimentos"
          className="shrink-0 text-sm font-semibold text-muted"
        >
          Cerrar
        </Link>
      </header>
      <FoodForm food={food} />
    </div>
  );
}
