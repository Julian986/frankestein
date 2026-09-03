import type { DbShape } from "./store";

/** Base vacía: Frankestein carga sus propios alimentos y conjuntos. */
export function getSeedData(): DbShape {
  return {
    foods: [],
    meals: [],
    meal_items: [],
    daily_entries: [],
  };
}
