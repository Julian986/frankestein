import Link from "next/link";
import { notFound } from "next/navigation";
import { MealForm } from "@/components/MealForm";
import { db } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarComidaPage({ params }: Props) {
  const { id } = await params;
  const [meal, foods] = await Promise.all([db.getMeal(id), db.listFoods()]);
  if (!meal) notFound();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Editar conjunto</h1>
        <Link
          href={`/comidas/${meal.id}`}
          className="text-sm font-semibold text-muted"
        >
          Cerrar
        </Link>
      </header>
      <MealForm foods={foods} meal={meal} />
    </div>
  );
}
