import Link from "next/link";
import {
  PERIOD_LABELS,
  type Period,
  type PeriodRange,
  shiftPeriod,
} from "@/lib/nutrition";

type Props = {
  range: PeriodRange;
  today: string;
};

function buildHref(period: Period, fecha: string) {
  const params = new URLSearchParams({
    periodo: period,
    fecha,
  });
  return `/hoy?${params.toString()}`;
}

export function PeriodFilter({ range, today }: Props) {
  const periods: Period[] = ["dia", "semana", "mes"];
  const prevFecha = shiftPeriod(range.period, range.anchor, -1);
  const nextFecha = shiftPeriod(range.period, range.anchor, 1);
  const isCurrent = range.start <= today && today <= range.end;
  const switchFecha = isCurrent ? today : range.anchor;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {periods.map((period) => {
          const active = range.period === period;
          return (
            <Link
              key={period}
              href={buildHref(period, switchFecha)}
              className={`flex-1 rounded-full px-3 py-2.5 text-center text-sm font-semibold transition ${
                active
                  ? "bg-primary text-white"
                  : "border border-border bg-card text-muted"
              }`}
            >
              {PERIOD_LABELS[period]}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-2 py-2">
        <Link
          href={buildHref(range.period, prevFecha)}
          className="inline-flex size-10 items-center justify-center rounded-xl text-lg font-semibold text-foreground active:bg-accent"
          aria-label="Período anterior"
        >
          ‹
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold capitalize">
            {range.label}
          </p>
          {!isCurrent ? (
            <Link
              href={buildHref(range.period, today)}
              className="text-xs font-semibold text-primary"
            >
              Volver a actual
            </Link>
          ) : null}
        </div>
        <Link
          href={buildHref(range.period, nextFecha)}
          className="inline-flex size-10 items-center justify-center rounded-xl text-lg font-semibold text-foreground active:bg-accent"
          aria-label="Período siguiente"
        >
          ›
        </Link>
      </div>
    </div>
  );
}
