import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '@/db/supabase.server';
import { loginSchema } from '@/lib/validation/auth.server.schemas';

export const prerender = false;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { ok: false, code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password, next } = parsed.data as { email: string; password: string; next?: string };
    const supabase = createSupabaseServerClient({ headers: request.headers, cookies });

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const dest = typeof next === 'string' && next.startsWith('/') ? next : '/app/generate';
    return json({ ok: true, redirect: dest }, { status: 200 });
  } catch (e) {
    console.error('login error', e);
    return json({ ok: false, code: 'SERVER_ERROR' }, { status: 500 });
  }
};

