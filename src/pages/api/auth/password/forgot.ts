import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '@/db/supabase.server';
import { forgotPasswordSchema } from '@/lib/validation/auth.server.schemas';

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
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email } = parsed.data;
    const supabase = createSupabaseServerClient({ headers: request.headers, cookies });

    const base = import.meta.env.APP_BASE_URL as string | undefined;
    const redirectTo = base ? `${base}/auth/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
    if (error) {
      // Do not leak information; return neutral 200
      console.warn('password/forgot error (masked):', error?.message);
    }

    return json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('password/forgot error', e);
    // Still do not leak; return neutral 200
    return json({ ok: true }, { status: 200 });
  }
};

