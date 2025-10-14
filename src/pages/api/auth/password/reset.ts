import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '@/db/supabase.server';
import { changePasswordSchema } from '@/lib/validation/auth.server.schemas';

export const prerender = false;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

/**
 * Reset password endpoint for password recovery flow
 * This is used when user clicks the link from password reset email
 * The user session is established via the recovery token in the URL
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }

    const { newPassword } = parsed.data;
    const supabase = createSupabaseServerClient({ headers: request.headers, cookies });

    // Check if user has a valid session (from recovery token)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return json({ ok: false, code: 'UNAUTHORIZED', message: 'Brak ważnej sesji. Link może być nieprawidłowy lub wygasł.' }, { status: 401 });
    }

    // Update the password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      console.error('password/reset error:', error.message);
      return json({ ok: false, code: 'UPDATE_FAILED', message: error.message }, { status: 400 });
    }

    return json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('password/reset error', e);
    return json({ ok: false, code: 'SERVER_ERROR' }, { status: 500 });
  }
};

