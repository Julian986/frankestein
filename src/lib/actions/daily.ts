"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/repository";
import { todayDateString } from "@/lib/nutrition";

export async function addDailyEntryAction(mealId: string, date?: string) {
  await db.addDailyEntry(mealId, date || todayDateString());
  revalidatePath("/hoy");
}

export async function addDailyFoodEntryAction(
  foodId: string,
  quantity: number,
  date?: string,
) {
  await db.addDailyFoodEntry(foodId, quantity, date || todayDateString());
  revalidatePath("/hoy");
}

export async function removeDailyEntryAction(id: string) {
  await db.removeDailyEntry(id);
  revalidatePath("/hoy");
}
