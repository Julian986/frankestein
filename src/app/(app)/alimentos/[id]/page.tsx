import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";
import { ExpandableText } from "@/components/ExpandableText";
import { MacroSummary } from "@/components/MacroSummary";
import { deleteFoodAction } from "@/lib/actions/foods";
import { db } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AlimentoDetailPage({ params }: Props) {
  const { id } = await params;
  const food = await db.getFood(id);
  if (!food) notFound();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="flex items-center gap-2">
          <Link
            href="/alimentos"
            aria-label="Volver a alimentos"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-2xl font-semibold text-primary"
          >
            ←
          </Link>
          <h1 className="min-w-0 text-2xl font-bold tracking-tight">
            {food.name}
          </h1>
        </div>
        <p className="mt-1 pl-12 text-base text-muted">{food.unit}</p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <MacroSummary
          macros={{
            kcal: food.kcal,
            protein_g: food.protein_g,
            carbs_g: food.carbs_g,
            fat_g: food.fat_g,
          }}
        />
      </section>

      {food.notes ? (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Notas
          </h2>
          <ExpandableText text={food.notes} />
        </section>
      ) : null}

      <Link
        href={`/alimentos/${food.id}/editar`}
        className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold"
      >
        Editar alimento
      </Link>

      <DeleteButton
        title="Eliminar alimento"
        confirmMessage="Si lo borrás, no hay vuelta atrás. Además no se puede si está metido en algún conjunto."
        redirectTo="/alimentos"
        action={async () => {
          "use server";
          await deleteFoodAction(food.id);
        }}
      />
    </div>
  );
}
