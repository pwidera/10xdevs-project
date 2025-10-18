import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/db/supabase.server";
import { changePasswordSchema } from "@/lib/validation/auth.server.schemas";

export const prerender = false;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    if (!locals.user) {
      return json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, code: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createSupabaseServerClient({ headers: request.headers, cookies });
    const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
    if (error) {
      return json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
    }

    return json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("password/change error", e);
    return json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
};
