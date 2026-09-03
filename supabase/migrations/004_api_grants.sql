-- Permisos Data API para anon/authenticated.
-- Corregir "permission denied for table ..." cuando auto-expose está off.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on foods to anon, authenticated;
grant select, insert, update, delete on meals to anon, authenticated;
grant select, insert, update, delete on meal_items to anon, authenticated;
grant select, insert, update, delete on daily_entries to anon, authenticated;
