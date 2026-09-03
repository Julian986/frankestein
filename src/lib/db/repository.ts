import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  formatMacro,
  scaleMacros,
  sumMealMacros,
  todayDateString,
} from "@/lib/nutrition";
import type {
  DailyEntry,
  DailyEntryLog,
  Food,
  FoodInput,
  MealInput,
  MealType,
  MealWithItems,
} from "@/lib/types";
import { MEAL_TYPE_LABELS } from "@/lib/types";
import { newId, readDb, writeDb } from "./store";

function normalizeDailyEntry(raw: Partial<DailyEntry> & { id: string }): DailyEntry {
  return {
    id: raw.id,
    entry_date: raw.entry_date ?? todayDateString(),
    meal_id: raw.meal_id ?? null,
    food_id: raw.food_id ?? null,
    quantity: raw.quantity ?? null,
    meal_type: raw.meal_type ?? null,
    created_at: raw.created_at ?? new Date().toISOString(),
  };
}

function attachMeal(
  meal: {
    id: string;
    name: string;
    meal_type: MealType;
    characteristics: string | null;
    is_favorite: boolean;
    created_at: string;
  },
  items: {
    id: string;
    meal_id: string;
    food_id: string;
    quantity: number;
    food: Food;
  }[],
): MealWithItems {
  const mealItems = items.map(({ food, ...item }) => ({ ...item, food }));
  return {
    ...meal,
    items: mealItems,
    macros: sumMealMacros(mealItems),
  };
}

/* -------------------- Local JSON -------------------- */

async function localListFoods(): Promise<Food[]> {
  const db = await readDb();
  return [...db.foods].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

async function localGetFood(id: string): Promise<Food | null> {
  const db = await readDb();
  return db.foods.find((f) => f.id === id) ?? null;
}

async function localCreateFood(input: FoodInput): Promise<Food> {
  const db = await readDb();
  const food: Food = {
    id: newId(),
    name: input.name.trim(),
    unit: input.unit.trim() || "unidad",
    kcal: Number(input.kcal) || 0,
    protein_g: Number(input.protein_g) || 0,
    carbs_g: Number(input.carbs_g) || 0,
    fat_g: Number(input.fat_g) || 0,
    notes: input.notes?.trim() || null,
    created_at: new Date().toISOString(),
  };
  db.foods.push(food);
  await writeDb(db);
  return food;
}

async function localUpdateFood(id: string, input: FoodInput): Promise<Food> {
  const db = await readDb();
  const idx = db.foods.findIndex((f) => f.id === id);
  if (idx < 0) throw new Error("Alimento no encontrado");
  db.foods[idx] = {
    ...db.foods[idx],
    name: input.name.trim(),
    unit: input.unit.trim() || "unidad",
    kcal: Number(input.kcal) || 0,
    protein_g: Number(input.protein_g) || 0,
    carbs_g: Number(input.carbs_g) || 0,
    fat_g: Number(input.fat_g) || 0,
    notes: input.notes?.trim() || null,
  };
  await writeDb(db);
  return db.foods[idx];
}

async function localDeleteFood(id: string): Promise<void> {
  const db = await readDb();
  if (db.meal_items.some((i) => i.food_id === id)) {
    throw new Error("No se puede borrar: está usado en un conjunto");
  }
  if (db.daily_entries.some((e) => e.food_id === id)) {
    throw new Error("No se puede borrar: está cargado en el diario");
  }
  db.foods = db.foods.filter((f) => f.id !== id);
  await writeDb(db);
}

async function localBuildMeals(filter?: {
  meal_type?: MealType | "all";
  favoritesOnly?: boolean;
}): Promise<MealWithItems[]> {
  const db = await readDb();
  let meals = [...db.meals];
  if (filter?.meal_type && filter.meal_type !== "all") {
    meals = meals.filter((m) => m.meal_type === filter.meal_type);
  }
  if (filter?.favoritesOnly) {
    meals = meals.filter((m) => m.is_favorite);
  }
  const foodMap = new Map(db.foods.map((f) => [f.id, f]));
  return meals
    .map((meal) => {
      const items = db.meal_items
        .filter((i) => i.meal_id === meal.id)
        .map((i) => {
          const food = foodMap.get(i.food_id);
          if (!food) return null;
          return { ...i, food };
        })
        .filter(Boolean) as {
        id: string;
        meal_id: string;
        food_id: string;
        quantity: number;
        food: Food;
      }[];
      return attachMeal(meal, items);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

async function localGetMeal(id: string): Promise<MealWithItems | null> {
  const meals = await localBuildMeals();
  return meals.find((m) => m.id === id) ?? null;
}

async function localCreateMeal(input: MealInput): Promise<MealWithItems> {
  const db = await readDb();
  const meal = {
    id: newId(),
    name: input.name.trim(),
    meal_type: input.meal_type,
    characteristics: input.characteristics?.trim() || null,
    is_favorite: Boolean(input.is_favorite),
    created_at: new Date().toISOString(),
  };
  db.meals.push(meal);
  for (const item of input.items) {
    if (!item.food_id || !(item.quantity > 0)) continue;
    db.meal_items.push({
      id: newId(),
      meal_id: meal.id,
      food_id: item.food_id,
      quantity: Number(item.quantity),
    });
  }
  await writeDb(db);
  const created = await localGetMeal(meal.id);
  if (!created) throw new Error("Error al crear conjunto");
  return created;
}

async function localUpdateMeal(
  id: string,
  input: MealInput,
): Promise<MealWithItems> {
  const db = await readDb();
  const idx = db.meals.findIndex((m) => m.id === id);
  if (idx < 0) throw new Error("Conjunto no encontrado");
  db.meals[idx] = {
    ...db.meals[idx],
    name: input.name.trim(),
    meal_type: input.meal_type,
    characteristics: input.characteristics?.trim() || null,
    is_favorite: Boolean(input.is_favorite),
  };
  db.meal_items = db.meal_items.filter((i) => i.meal_id !== id);
  for (const item of input.items) {
    if (!item.food_id || !(item.quantity > 0)) continue;
    db.meal_items.push({
      id: newId(),
      meal_id: id,
      food_id: item.food_id,
      quantity: Number(item.quantity),
    });
  }
  await writeDb(db);
  const updated = await localGetMeal(id);
  if (!updated) throw new Error("Error al actualizar conjunto");
  return updated;
}

async function localDeleteMeal(id: string): Promise<void> {
  const db = await readDb();
  db.meals = db.meals.filter((m) => m.id !== id);
  db.meal_items = db.meal_items.filter((i) => i.meal_id !== id);
  db.daily_entries = db.daily_entries.filter((e) => e.meal_id !== id);
  await writeDb(db);
}

async function localToggleFavorite(id: string): Promise<void> {
  const db = await readDb();
  const meal = db.meals.find((m) => m.id === id);
  if (!meal) throw new Error("Conjunto no encontrado");
  meal.is_favorite = !meal.is_favorite;
  await writeDb(db);
}

async function localListDaily(options?: {
  date?: string;
  from?: string;
  to?: string;
}): Promise<DailyEntryLog[]> {
  const db = await readDb();
  const meals = await localBuildMeals();
  const mealMap = new Map(meals.map((m) => [m.id, m]));
  const foodMap = new Map(db.foods.map((f) => [f.id, f]));
  const from = options?.from ?? options?.date ?? todayDateString();
  const to = options?.to ?? options?.date ?? from;

  return db.daily_entries
    .map(normalizeDailyEntry)
    .filter((e) => e.entry_date >= from && e.entry_date <= to)
    .map((e): DailyEntryLog | null => {
      if (e.meal_id) {
        const meal = mealMap.get(e.meal_id);
        if (!meal) return null;
        return {
          id: e.id,
          entry_date: e.entry_date,
          created_at: e.created_at,
          kind: "meal",
          name: meal.name,
          href: `/comidas/${meal.id}`,
          subtitle: MEAL_TYPE_LABELS[meal.meal_type],
          macros: meal.macros,
          meal_type: meal.meal_type,
        };
      }
      if (e.food_id) {
        const food = foodMap.get(e.food_id);
        const qty = e.quantity && e.quantity > 0 ? e.quantity : 1;
        if (!food) return null;
        return {
          id: e.id,
          entry_date: e.entry_date,
          created_at: e.created_at,
          kind: "food",
          name: food.name,
          href: `/alimentos/${food.id}`,
          subtitle: `${formatMacro(qty)} × ${food.unit}`,
          macros: scaleMacros(
            {
              kcal: food.kcal,
              protein_g: food.protein_g,
              carbs_g: food.carbs_g,
              fat_g: food.fat_g,
            },
            qty,
          ),
          meal_type: e.meal_type,
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a!.entry_date !== b!.entry_date) {
        return a!.entry_date < b!.entry_date ? 1 : -1;
      }
      return a!.created_at < b!.created_at ? 1 : -1;
    }) as DailyEntryLog[];
}

async function localAddDailyEntry(
  mealId: string,
  date = todayDateString(),
): Promise<void> {
  const db = await readDb();
  const meal = db.meals.find((m) => m.id === mealId);
  if (!meal) throw new Error("Conjunto no encontrado");
  db.daily_entries.push({
    id: newId(),
    entry_date: date,
    meal_id: mealId,
    food_id: null,
    quantity: null,
    meal_type: meal.meal_type,
    created_at: new Date().toISOString(),
  });
  await writeDb(db);
}

async function localAddDailyFoodEntry(
  foodId: string,
  quantity: number,
  date = todayDateString(),
): Promise<void> {
  const db = await readDb();
  const food = db.foods.find((f) => f.id === foodId);
  if (!food) throw new Error("Alimento no encontrado");
  if (!(quantity > 0)) throw new Error("La cantidad tiene que ser mayor a 0");
  db.daily_entries.push({
    id: newId(),
    entry_date: date,
    meal_id: null,
    food_id: foodId,
    quantity,
    meal_type: null,
    created_at: new Date().toISOString(),
  });
  await writeDb(db);
}

async function localRemoveDailyEntry(id: string): Promise<void> {
  const db = await readDb();
  db.daily_entries = db.daily_entries.filter((e) => e.id !== id);
  await writeDb(db);
}

/* -------------------- Supabase -------------------- */

async function sbListFoods(): Promise<Food[]> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("foods")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Food[];
}

async function sbGetFood(id: string): Promise<Food | null> {
  const sb = createServerClient();
  const { data, error } = await sb.from("foods").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Food) ?? null;
}

async function sbCreateFood(input: FoodInput): Promise<Food> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("foods")
    .insert({
      name: input.name.trim(),
      unit: input.unit.trim() || "unidad",
      kcal: Number(input.kcal) || 0,
      protein_g: Number(input.protein_g) || 0,
      carbs_g: Number(input.carbs_g) || 0,
      fat_g: Number(input.fat_g) || 0,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Food;
}

async function sbUpdateFood(id: string, input: FoodInput): Promise<Food> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("foods")
    .update({
      name: input.name.trim(),
      unit: input.unit.trim() || "unidad",
      kcal: Number(input.kcal) || 0,
      protein_g: Number(input.protein_g) || 0,
      carbs_g: Number(input.carbs_g) || 0,
      fat_g: Number(input.fat_g) || 0,
      notes: input.notes?.trim() || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Food;
}

async function sbDeleteFood(id: string): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb.from("foods").delete().eq("id", id);
  if (error) {
    const msg = error.message || "";
    if (/foreign key|violates/i.test(msg)) {
      throw new Error(
        "No se puede borrar: está usado en un conjunto o en el diario",
      );
    }
    throw new Error(msg || "No se pudo borrar el alimento");
  }
}

async function sbBuildMeals(filter?: {
  meal_type?: MealType | "all";
  favoritesOnly?: boolean;
}): Promise<MealWithItems[]> {
  const sb = createServerClient();
  let query = sb.from("meals").select("*").order("name", { ascending: true });
  if (filter?.meal_type && filter.meal_type !== "all") {
    query = query.eq("meal_type", filter.meal_type);
  }
  if (filter?.favoritesOnly) {
    query = query.eq("is_favorite", true);
  }
  const { data: meals, error } = await query;
  if (error) throw error;
  if (!meals?.length) return [];

  const ids = meals.map((m) => m.id);
  const { data: items, error: itemsError } = await sb
    .from("meal_items")
    .select("*, food:foods(*)")
    .in("meal_id", ids);
  if (itemsError) throw itemsError;

  return meals.map((meal) => {
    const mealItems = (items ?? [])
      .filter((i) => i.meal_id === meal.id && i.food)
      .map((i) => ({
        id: i.id,
        meal_id: i.meal_id,
        food_id: i.food_id,
        quantity: Number(i.quantity),
        food: i.food as Food,
      }));
    return attachMeal(meal as MealWithItems, mealItems);
  });
}

async function sbGetMeal(id: string): Promise<MealWithItems | null> {
  const meals = await sbBuildMeals();
  return meals.find((m) => m.id === id) ?? null;
}

async function sbCreateMeal(input: MealInput): Promise<MealWithItems> {
  const sb = createServerClient();
  const { data: meal, error } = await sb
    .from("meals")
    .insert({
      name: input.name.trim(),
      meal_type: input.meal_type,
      characteristics: input.characteristics?.trim() || null,
      is_favorite: Boolean(input.is_favorite),
    })
    .select("*")
    .single();
  if (error) throw error;

  const rows = input.items
    .filter((i) => i.food_id && i.quantity > 0)
    .map((i) => ({
      meal_id: meal.id,
      food_id: i.food_id,
      quantity: Number(i.quantity),
    }));
  if (rows.length) {
    const { error: itemsError } = await sb.from("meal_items").insert(rows);
    if (itemsError) throw itemsError;
  }
  const created = await sbGetMeal(meal.id);
  if (!created) throw new Error("Error al crear conjunto");
  return created;
}

async function sbUpdateMeal(id: string, input: MealInput): Promise<MealWithItems> {
  const sb = createServerClient();
  const { error } = await sb
    .from("meals")
    .update({
      name: input.name.trim(),
      meal_type: input.meal_type,
      characteristics: input.characteristics?.trim() || null,
      is_favorite: Boolean(input.is_favorite),
    })
    .eq("id", id);
  if (error) throw error;

  await sb.from("meal_items").delete().eq("meal_id", id);
  const rows = input.items
    .filter((i) => i.food_id && i.quantity > 0)
    .map((i) => ({
      meal_id: id,
      food_id: i.food_id,
      quantity: Number(i.quantity),
    }));
  if (rows.length) {
    const { error: itemsError } = await sb.from("meal_items").insert(rows);
    if (itemsError) throw itemsError;
  }
  const updated = await sbGetMeal(id);
  if (!updated) throw new Error("Error al actualizar conjunto");
  return updated;
}

async function sbDeleteMeal(id: string): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb.from("meals").delete().eq("id", id);
  if (error) throw error;
}

async function sbToggleFavorite(id: string): Promise<void> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("meals")
    .select("is_favorite")
    .eq("id", id)
    .single();
  if (error) throw error;
  const { error: upError } = await sb
    .from("meals")
    .update({ is_favorite: !data.is_favorite })
    .eq("id", id);
  if (upError) throw upError;
}

async function sbListDaily(options?: {
  date?: string;
  from?: string;
  to?: string;
}): Promise<DailyEntryLog[]> {
  const sb = createServerClient();
  const from = options?.from ?? options?.date ?? todayDateString();
  const to = options?.to ?? options?.date ?? from;

  const { data, error } = await sb
    .from("daily_entries")
    .select("*")
    .gte("entry_date", from)
    .lte("entry_date", to)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!data?.length) return [];

  const meals = await sbBuildMeals();
  const mealMap = new Map(meals.map((m) => [m.id, m]));
  const foods = await sbListFoods();
  const foodMap = new Map(foods.map((f) => [f.id, f]));

  return data
    .map((raw) => normalizeDailyEntry(raw as DailyEntry))
    .map((e): DailyEntryLog | null => {
      if (e.meal_id) {
        const meal = mealMap.get(e.meal_id);
        if (!meal) return null;
        return {
          id: e.id,
          entry_date: e.entry_date,
          created_at: e.created_at,
          kind: "meal",
          name: meal.name,
          href: `/comidas/${meal.id}`,
          subtitle: MEAL_TYPE_LABELS[meal.meal_type],
          macros: meal.macros,
          meal_type: meal.meal_type,
        };
      }
      if (e.food_id) {
        const food = foodMap.get(e.food_id);
        const qty = e.quantity && e.quantity > 0 ? e.quantity : 1;
        if (!food) return null;
        return {
          id: e.id,
          entry_date: e.entry_date,
          created_at: e.created_at,
          kind: "food",
          name: food.name,
          href: `/alimentos/${food.id}`,
          subtitle: `${formatMacro(qty)} × ${food.unit}`,
          macros: scaleMacros(
            {
              kcal: food.kcal,
              protein_g: food.protein_g,
              carbs_g: food.carbs_g,
              fat_g: food.fat_g,
            },
            qty,
          ),
          meal_type: e.meal_type,
        };
      }
      return null;
    })
    .filter(Boolean) as DailyEntryLog[];
}

async function sbAddDailyEntry(mealId: string, date = todayDateString()): Promise<void> {
  const sb = createServerClient();
  const { data: meal, error } = await sb
    .from("meals")
    .select("meal_type")
    .eq("id", mealId)
    .single();
  if (error) throw error;
  const { error: insertError } = await sb.from("daily_entries").insert({
    entry_date: date,
    meal_id: mealId,
    food_id: null,
    quantity: null,
    meal_type: meal.meal_type,
  });
  if (insertError) throw insertError;
}

async function sbAddDailyFoodEntry(
  foodId: string,
  quantity: number,
  date = todayDateString(),
): Promise<void> {
  const sb = createServerClient();
  if (!(quantity > 0)) throw new Error("La cantidad tiene que ser mayor a 0");
  const { data: food, error } = await sb
    .from("foods")
    .select("id")
    .eq("id", foodId)
    .single();
  if (error || !food) throw new Error("Alimento no encontrado");
  const { error: insertError } = await sb.from("daily_entries").insert({
    entry_date: date,
    meal_id: null,
    food_id: foodId,
    quantity,
    meal_type: null,
  });
  if (insertError) throw insertError;
}

async function sbRemoveDailyEntry(id: string): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb.from("daily_entries").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------- Public API -------------------- */

const useSupabase = () => isSupabaseConfigured();

export const db = {
  storageMode: () => (useSupabase() ? "supabase" : "local") as "supabase" | "local",
  listFoods: () => (useSupabase() ? sbListFoods() : localListFoods()),
  getFood: (id: string) => (useSupabase() ? sbGetFood(id) : localGetFood(id)),
  createFood: (input: FoodInput) =>
    useSupabase() ? sbCreateFood(input) : localCreateFood(input),
  updateFood: (id: string, input: FoodInput) =>
    useSupabase() ? sbUpdateFood(id, input) : localUpdateFood(id, input),
  deleteFood: (id: string) =>
    useSupabase() ? sbDeleteFood(id) : localDeleteFood(id),
  listMeals: (filter?: { meal_type?: MealType | "all"; favoritesOnly?: boolean }) =>
    useSupabase() ? sbBuildMeals(filter) : localBuildMeals(filter),
  getMeal: (id: string) => (useSupabase() ? sbGetMeal(id) : localGetMeal(id)),
  createMeal: (input: MealInput) =>
    useSupabase() ? sbCreateMeal(input) : localCreateMeal(input),
  updateMeal: (id: string, input: MealInput) =>
    useSupabase() ? sbUpdateMeal(id, input) : localUpdateMeal(id, input),
  deleteMeal: (id: string) =>
    useSupabase() ? sbDeleteMeal(id) : localDeleteMeal(id),
  toggleFavorite: (id: string) =>
    useSupabase() ? sbToggleFavorite(id) : localToggleFavorite(id),
  listDailyEntries: (options?: { date?: string; from?: string; to?: string }) =>
    useSupabase() ? sbListDaily(options) : localListDaily(options),
  addDailyEntry: (mealId: string, date?: string) =>
    useSupabase() ? sbAddDailyEntry(mealId, date) : localAddDailyEntry(mealId, date),
  addDailyFoodEntry: (foodId: string, quantity: number, date?: string) =>
    useSupabase()
      ? sbAddDailyFoodEntry(foodId, quantity, date)
      : localAddDailyFoodEntry(foodId, quantity, date),
  removeDailyEntry: (id: string) =>
    useSupabase() ? sbRemoveDailyEntry(id) : localRemoveDailyEntry(id),
};
