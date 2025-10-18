import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/db/supabase.server";

export const prerender = false;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    const supabase = createSupabaseServerClient({ cookies, headers: request.headers });
    const { error } = await supabase.auth.signOut();
    if (error) {
      return json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
    }
    return json({ ok: true, redirect: "/" }, { status: 200 });
  } catch (e) {
    console.error("logout error", e);
    return json({ ok: false, code: "SERVER_ERROR" }, { status: 500 });
  }
};
