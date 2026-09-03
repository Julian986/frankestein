-- Frankestein nutrition schema
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'unidad',
  kcal numeric not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  meal_type text not null check (meal_type in ('desayuno_merienda', 'almuerzo_cena', 'snack_colacion')),
  characteristics text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals(id) on delete cascade,
  food_id uuid not null references foods(id) on delete restrict,
  quantity numeric not null check (quantity > 0)
);

create table if not exists daily_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  meal_id uuid references meals(id) on delete cascade,
  food_id uuid references foods(id) on delete restrict,
  quantity numeric check (quantity is null or quantity > 0),
  meal_type text check (meal_type is null or meal_type in ('desayuno_merienda', 'almuerzo_cena', 'snack_colacion')),
  created_at timestamptz not null default now(),
  constraint daily_entries_meal_or_food_check check (
    (meal_id is not null and food_id is null)
    or
    (meal_id is null and food_id is not null and quantity > 0)
  )
);

create index if not exists meals_meal_type_idx on meals(meal_type);
create index if not exists meals_is_favorite_idx on meals(is_favorite);
create index if not exists meal_items_meal_id_idx on meal_items(meal_id);
create index if not exists daily_entries_entry_date_idx on daily_entries(entry_date);
create index if not exists daily_entries_food_id_idx on daily_entries(food_id);

-- MVP sin auth: lectura/escritura pública (endurecer después)
alter table foods enable row level security;
alter table meals enable row level security;
alter table meal_items enable row level security;
alter table daily_entries enable row level security;

create policy "public_all_foods" on foods for all using (true) with check (true);
create policy "public_all_meals" on meals for all using (true) with check (true);
create policy "public_all_meal_items" on meal_items for all using (true) with check (true);
create policy "public_all_daily_entries" on daily_entries for all using (true) with check (true);

-- Necesario si "Automatically expose new tables" está desactivado:
-- RLS permite filas, pero sin GRANT la Data API no puede tocar las tablas.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on foods to anon, authenticated;
grant select, insert, update, delete on meals to anon, authenticated;
grant select, insert, update, delete on meal_items to anon, authenticated;
grant select, insert, update, delete on daily_entries to anon, authenticated;
