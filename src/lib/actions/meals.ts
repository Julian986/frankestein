"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/repository";
import type { MealInput, MealType } from "@/lib/types";

function parseMealForm(formData: FormData): MealInput {
  const foodIds = formData.getAll("food_id").map(String);
  const quantities = formData.getAll("quantity").map(Number);
  const items = foodIds.map((food_id, i) => ({
    food_id,
    quantity: quantities[i] || 0,
  }));

  return {
    name: String(formData.get("name") ?? ""),
    meal_type: String(formData.get("meal_type") ?? "desayuno_merienda") as MealType,
    characteristics: String(formData.get("characteristics") ?? "") || null,
    is_favorite: formData.get("is_favorite") === "on" || formData.get("is_favorite") === "true",
    items,
  };
}

export async function createMealAction(formData: FormData) {
  const input = parseMealForm(formData);
  if (!input.name.trim()) throw new Error("El nombre es obligatorio");
  if (!input.items.some((i) => i.food_id && i.quantity > 0)) {
    throw new Error("Agregá al menos un alimento");
  }
  const meal = await db.createMeal(input);
  revalidatePath("/comidas");
  revalidatePath("/hoy");
  return meal.id;
}

export async function updateMealAction(id: string, formData: FormData) {
  const input = parseMealForm(formData);
  if (!input.name.trim()) throw new Error("El nombre es obligatorio");
  if (!input.items.some((i) => i.food_id && i.quantity > 0)) {
    throw new Error("Agregá al menos un alimento");
  }
  await db.updateMeal(id, input);
  revalidatePath("/comidas");
  revalidatePath(`/comidas/${id}`);
  revalidatePath("/hoy");
}

export async function deleteMealAction(id: string) {
  await db.deleteMeal(id);
  revalidatePath("/comidas");
  revalidatePath("/hoy");
}

export async function toggleFavoriteAction(id: string) {
  await db.toggleFavorite(id);
  revalidatePath("/comidas");
  revalidatePath(`/comidas/${id}`);
  revalidatePath("/hoy");
}
