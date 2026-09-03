"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/repository";
import type { FoodInput } from "@/lib/types";

function parseFoodForm(formData: FormData): FoodInput {
  return {
    name: String(formData.get("name") ?? ""),
    unit: String(formData.get("unit") ?? ""),
    kcal: Number(formData.get("kcal") ?? 0),
    protein_g: Number(formData.get("protein_g") ?? 0),
    carbs_g: Number(formData.get("carbs_g") ?? 0),
    fat_g: Number(formData.get("fat_g") ?? 0),
    notes: String(formData.get("notes") ?? "") || null,
  };
}

export async function createFoodAction(formData: FormData) {
  const input = parseFoodForm(formData);
  if (!input.name.trim()) throw new Error("El nombre es obligatorio");
  await db.createFood(input);
  revalidatePath("/alimentos");
  revalidatePath("/comidas");
  revalidatePath("/hoy");
}

export async function updateFoodAction(id: string, formData: FormData) {
  const input = parseFoodForm(formData);
  if (!input.name.trim()) throw new Error("El nombre es obligatorio");
  await db.updateFood(id, input);
  revalidatePath("/alimentos");
  revalidatePath(`/alimentos/${id}`);
  revalidatePath("/comidas");
  revalidatePath("/hoy");
}

export async function deleteFoodAction(id: string) {
  await db.deleteFood(id);
  revalidatePath("/alimentos");
  revalidatePath("/comidas");
  revalidatePath("/hoy");
}
