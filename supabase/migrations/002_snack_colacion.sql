-- Agrega tipo Snack/Colación a meals y daily_entries

alter table meals drop constraint if exists meals_meal_type_check;
alter table meals
  add constraint meals_meal_type_check
  check (meal_type in ('desayuno_merienda', 'almuerzo_cena', 'snack_colacion'));

alter table daily_entries drop constraint if exists daily_entries_meal_type_check;
alter table daily_entries
  add constraint daily_entries_meal_type_check
  check (meal_type in ('desayuno_merienda', 'almuerzo_cena', 'snack_colacion'));
