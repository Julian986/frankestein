import { promises as fs } from "fs";
import path from "path";
import type {
  DailyEntry,
  Food,
  Meal,
  MealItem,
} from "@/lib/types";
import { getSeedData } from "./seed";

export type DbShape = {
  foods: Food[];
  meals: Meal[];
  meal_items: MealItem[];
  daily_entries: DailyEntry[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function assertLocalFsAllowed(): void {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    throw new Error(
      "Modo local no funciona en Vercel. Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

function normalizeDb(raw: DbShape): DbShape {
  return {
    ...raw,
    daily_entries: (raw.daily_entries ?? []).map((e) => ({
      ...e,
      meal_id: e.meal_id ?? null,
      food_id: e.food_id ?? null,
      quantity: e.quantity ?? null,
      meal_type: e.meal_type ?? null,
    })),
  };
}

async function ensureDb(): Promise<DbShape> {
  assertLocalFsAllowed();
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return normalizeDb(JSON.parse(raw) as DbShape);
  } catch {
    const seed = getSeedData();
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

export async function readDb(): Promise<DbShape> {
  return ensureDb();
}

export async function writeDb(db: DbShape): Promise<void> {
  assertLocalFsAllowed();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function newId(): string {
  return crypto.randomUUID();
}
