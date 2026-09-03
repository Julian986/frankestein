import Link from "next/link";
import { LoadMealSheet } from "@/components/LoadMealSheet";
import { MacroSummary } from "@/components/MacroSummary";
import { MacrosColorToggle } from "@/components/MacrosColorToggle";
import { PeriodFilter } from "@/components/PeriodFilter";
import { RemoveEntryButton } from "@/components/RemoveEntryButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { db } from "@/lib/db/repository";
import {
  emptyMacros,
  addMacros,
  formatDateLabelEs,
  getPeriodRange,
  isValidIsoDate,
  isValidPeriod,
  todayDateString,
  type Period,
} from "@/lib/nutrition";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ periodo?: string; fecha?: string }>;
};

export default async function HoyPage({ searchParams }: Props) {
  const params = await searchParams;
  const today = todayDateString();
  const period: Period = isValidPeriod(params.periodo) ? params.periodo : "dia";
  const anchor = isValidIsoDate(params.fecha) ? params.fecha : today;
  const range = getPeriodRange(period, anchor);

  const [entries, meals, foods] = await Promise.all([
    db.listDailyEntries({ from: range.start, to: range.end }),
    db.listMeals(),
    db.listFoods(),
  ]);

  const totals = entries.reduce(
    (acc, entry) => addMacros(acc, entry.macros),
    emptyMacros(),
  );

  const viewingToday = range.start <= today && today <= range.end;
  const showDateOnCards = period !== "dia";

  const emptyCopy =
    period === "dia"
      ? {
          title: viewingToday
            ? "Todavía no cargaste nada hoy"
            : "No hay comidas este día",
          subtitle: viewingToday
            ? "Tocá “Cargar comida” y elegí un conjunto o un alimento."
            : "Probá otro día o volvé a hoy.",
        }
      : period === "semana"
        ? {
            title: "No hay comidas esta semana",
            subtitle: "Cargá comidas en Hoy (día) para verlas acá.",
          }
        : {
            title: "No hay comidas este mes",
            subtitle: "Cargá comidas en Hoy (día) para verlas acá.",
          };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Frankestein app</h1>
          <ThemeToggle />
        </div>
        <p className="mt-1 text-sm text-muted">
          Filtrá por día, semana o mes
        </p>
      </header>

      <PeriodFilter range={range} today={today} />

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {range.totalsLabel} 
          </h2>
          <MacrosColorToggle />
        </div>
        <MacroSummary macros={totals} />
      </section>

      {viewingToday ? <LoadMealSheet meals={meals} foods={foods} /> : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Comidas cargadas</h2>
          <span className="text-xs text-muted">{entries.length}</span>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center">
            <p className="font-medium">{emptyCopy.title}</p>
            <p className="mt-1 text-sm text-muted">{emptyCopy.subtitle}</p>
          </div>
        ) : (
          entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={entry.href}
                    className="text-base font-semibold hover:text-primary"
                  >
                    {entry.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {[
                      showDateOnCards
                        ? formatDateLabelEs(entry.entry_date)
                        : null,
                      entry.subtitle,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <RemoveEntryButton entryId={entry.id} name={entry.name} />
              </div>
              <MacroSummary macros={entry.macros} compact />
            </article>
          ))
        )}
      </section>
    </div>
  );
}
