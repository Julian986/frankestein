import { formatMacro } from "@/lib/nutrition";
import type { Macros } from "@/lib/types";

type Props = {
  macros: Macros;
  compact?: boolean;
};

export function MacroSummary({ macros, compact = false }: Props) {
  const items = [
    { label: "Kcal", value: macros.kcal, className: "text-kcal" },
    { label: "Prot", value: macros.protein_g, className: "text-protein", suffix: "g" },
    { label: "Carb", value: macros.carbs_g, className: "text-carbs", suffix: "g" },
    { label: "Gras", value: macros.fat_g, className: "text-fat", suffix: "g" },
  ];

  return (
    <div
      className={`grid grid-cols-4 gap-2 ${compact ? "" : "rounded-2xl bg-accent p-3"}`}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={`text-center ${compact ? "rounded-xl bg-accent px-1 py-2" : ""}`}
        >
          <div className={`text-lg font-bold leading-none ${item.className}`}>
            {formatMacro(item.value)}
            {item.suffix ? (
              <span className="text-xs font-semibold">{item.suffix}</span>
            ) : null}
          </div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
