import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/db/supabase.server";
import { registerSchema } from "@/lib/validation/auth.server.schemas";

export const prerender = false;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, code: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const supabase = createSupabaseServerClient({ headers: request.headers, cookies });

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const msg = error.message?.toLowerCase?.() || "";
      const already = msg.includes("already") || msg.includes("exists");
      return json({ ok: false, code: already ? "ALREADY_EXISTS" : "SERVER_ERROR" }, { status: already ? 409 : 500 });
    }

    // Default policy: auto-login assumed; if email confirmation enabled, client will stay unauthenticated until confirmation
    return json({ ok: true, redirect: "/app/generate" }, { status: 200 });
  } catch (e) {
    console.error("register error", e);
    return json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
};
