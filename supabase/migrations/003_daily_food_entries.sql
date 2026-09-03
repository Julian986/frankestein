-- Permite cargar un alimento suelto (con cantidad) además de un conjunto.

alter table daily_entries
  alter column meal_id drop not null;

alter table daily_entries
  alter column meal_type drop not null;

alter table daily_entries
  add column if not exists food_id uuid references foods(id) on delete restrict;

alter table daily_entries
  add column if not exists quantity numeric;

alter table daily_entries drop constraint if exists daily_entries_quantity_check;
alter table daily_entries
  add constraint daily_entries_quantity_check
  check (quantity is null or quantity > 0);

alter table daily_entries drop constraint if exists daily_entries_meal_or_food_check;
alter table daily_entries
  add constraint daily_entries_meal_or_food_check
  check (
    (meal_id is not null and food_id is null)
    or
    (meal_id is null and food_id is not null and quantity > 0)
  );

create index if not exists daily_entries_food_id_idx on daily_entries(food_id);
