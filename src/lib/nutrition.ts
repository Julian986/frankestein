import type { Macros, MealItemWithFood } from "./types";

export const emptyMacros = (): Macros => ({
  kcal: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
});

export function scaleMacros(macros: Macros, quantity: number): Macros {
  return {
    kcal: round1(macros.kcal * quantity),
    protein_g: round1(macros.protein_g * quantity),
    carbs_g: round1(macros.carbs_g * quantity),
    fat_g: round1(macros.fat_g * quantity),
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: round1(a.kcal + b.kcal),
    protein_g: round1(a.protein_g + b.protein_g),
    carbs_g: round1(a.carbs_g + b.carbs_g),
    fat_g: round1(a.fat_g + b.fat_g),
  };
}

export function sumMealMacros(items: MealItemWithFood[]): Macros {
  return items.reduce((acc, item) => {
    const scaled = scaleMacros(
      {
        kcal: item.food.kcal,
        protein_g: item.food.protein_g,
        carbs_g: item.food.carbs_g,
        fat_g: item.food.fat_g,
      },
      item.quantity,
    );
    return addMacros(acc, scaled);
  }, emptyMacros());
}

export function sumMacrosList(list: Macros[]): Macros {
  return list.reduce(addMacros, emptyMacros());
}

/** Fecha local de Argentina (uso diario de Frankestein). */
export function todayDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

const DAYS_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** Formato estable en español (evita mismatches de locale en SSR). */
export function formatDateLabelEs(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS_ES[date.getDay()]}, ${d} de ${MONTHS_ES[m - 1]}`;
}

export function formatMacro(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export type Period = "dia" | "semana" | "mes";

export const PERIOD_LABELS: Record<Period, string> = {
  dia: "Día",
  semana: "Semana",
  mes: "Mes",
};

export function parseIsoDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Semana lunes–domingo que contiene la fecha. */
export function startOfWeek(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  const day = date.getDay(); // 0 domingo
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toIsoDate(date);
}

export function startOfMonth(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  date.setDate(1);
  return toIsoDate(date);
}

export function endOfMonth(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  date.setMonth(date.getMonth() + 1, 0);
  return toIsoDate(date);
}

export type PeriodRange = {
  period: Period;
  anchor: string;
  start: string;
  end: string;
  label: string;
  totalsLabel: string;
};

export function getPeriodRange(period: Period, anchor: string): PeriodRange {
  if (period === "semana") {
    const start = startOfWeek(anchor);
    const end = addDays(start, 6);
    const startDate = parseIsoDate(start);
    const endDate = parseIsoDate(end);
    const sameMonth = startDate.getMonth() === endDate.getMonth();
    const label = sameMonth
      ? `${startDate.getDate()}–${endDate.getDate()} de ${MONTHS_ES[startDate.getMonth()]}`
      : `${startDate.getDate()} ${MONTHS_ES[startDate.getMonth()].slice(0, 3)} – ${endDate.getDate()} ${MONTHS_ES[endDate.getMonth()].slice(0, 3)}`;
    return {
      period,
      anchor: start,
      start,
      end,
      label,
      totalsLabel: "Totales de la semana",
    };
  }

  if (period === "mes") {
    const start = startOfMonth(anchor);
    const end = endOfMonth(anchor);
    const date = parseIsoDate(start);
    return {
      period,
      anchor: start,
      start,
      end,
      label: `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`,
      totalsLabel: "Totales del mes",
    };
  }

  return {
    period: "dia",
    anchor,
    start: anchor,
    end: anchor,
    label: formatDateLabelEs(anchor),
    totalsLabel: "Totales del día",
  };
}

export function shiftPeriod(period: Period, anchor: string, delta: number): string {
  if (period === "semana") {
    return addDays(startOfWeek(anchor), delta * 7);
  }
  if (period === "mes") {
    const date = parseIsoDate(startOfMonth(anchor));
    date.setMonth(date.getMonth() + delta);
    return toIsoDate(date);
  }
  return addDays(anchor, delta);
}

export function isValidPeriod(value: string | undefined): value is Period {
  return value === "dia" || value === "semana" || value === "mes";
}

export function isValidIsoDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseIsoDate(value);
  return toIsoDate(date) === value;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
