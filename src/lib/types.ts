export type MealType =
  | "desayuno_merienda"
  | "almuerzo_cena"
  | "snack_colacion";

export type Macros = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type Food = {
  id: string;
  name: string;
  unit: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string | null;
  created_at: string;
};

export type Meal = {
  id: string;
  name: string;
  meal_type: MealType;
  characteristics: string | null;
  is_favorite: boolean;
  created_at: string;
};

export type MealItem = {
  id: string;
  meal_id: string;
  food_id: string;
  quantity: number;
};

export type DailyEntry = {
  id: string;
  entry_date: string;
  meal_id: string | null;
  food_id: string | null;
  quantity: number | null;
  meal_type: MealType | null;
  created_at: string;
};

export type MealItemWithFood = MealItem & {
  food: Food;
};

export type MealWithItems = Meal & {
  items: MealItemWithFood[];
  macros: Macros;
};

/** Entrada del día lista para mostrar (conjunto o alimento suelto). */
export type DailyEntryLog = {
  id: string;
  entry_date: string;
  created_at: string;
  kind: "meal" | "food";
  name: string;
  href: string;
  subtitle: string;
  macros: Macros;
  meal_type: MealType | null;
};

export type FoodInput = {
  name: string;
  unit: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes?: string | null;
};

export type MealInput = {
  name: string;
  meal_type: MealType;
  characteristics?: string | null;
  is_favorite?: boolean;
  items: { food_id: string; quantity: number }[];
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  desayuno_merienda: "Desayuno/Merienda",
  almuerzo_cena: "Almuerzo/Cena",
  snack_colacion: "Colación",
};
