import { db } from "@/lib/db/repository";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Health check + ping a la DB.
 * Con Supabase: hace un SELECT mínimo (sirve para keep-alive).
 * Sin Supabase: responde ok en modo local.
 */
export async function GET() {
  const mode = db.storageMode();

  if (!isSupabaseConfigured()) {
    return Response.json({
      ok: true,
      mode,
      message: "Modo local (data/db.json). Supabase no configurado.",
    });
  }

  try {
    const sb = createServerClient();
    const { error } = await sb.from("foods").select("id").limit(1);
    if (error) {
      return Response.json(
        { ok: false, mode, error: error.message },
        { status: 503 },
      );
    }
    return Response.json({
      ok: true,
      mode,
      message: "Supabase respondió. Ping OK.",
    });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        mode,
        error: e instanceof Error ? e.message : "Error de salud",
      },
      { status: 503 },
    );
  }
}
