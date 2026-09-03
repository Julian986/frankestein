# Frankestein — control de macronutrientes

App mobile-first para registrar alimentos, armar conjuntos/recetas y llevar el diario de macros.

## Correr en local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

Por defecto usa almacenamiento **local** en `data/db.json` (vacío al inicio).

## Pantallas

- **Hoy**: totales del día + “Cargar comida” (favoritos primero)
- **Comidas**: conjuntos con macros calculados (alimento × cantidad)
- **Alimentos**: catálogo base con macros por unidad

## Supabase (opcional, nube)

1. Creá un proyecto en [supabase.com](https://supabase.com)
2. Ejecutá el SQL de [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) en el SQL Editor
3. Copiá `.env.local.example` → `.env.local` y completá URL + anon key
4. Reiniciá `npm run dev`

Con esas variables, la app pasa a usar Postgres en Supabase automáticamente.
