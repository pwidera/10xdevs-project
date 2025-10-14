import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '@/db/supabase.server';
import { createSupabaseAdminClient } from '@/db/supabase.admin';
import { deleteAccountSchema } from '@/lib/validation/auth.server.schemas';

export const prerender = false;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    if (!locals.user) {
      return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }

    // Optionally: delete domain data first. Assuming FK + CASCADE enabled (confirmed), we can directly delete user.
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(locals.user.id);
    if (error) {
      console.error('deleteAccount admin error', error);
      return json({ ok: false, code: 'SERVER_ERROR' }, { status: 500 });
    }

    // Sign out current session and clear cookies
    const supabase = createSupabaseServerClient({ headers: request.headers, cookies });
    await supabase.auth.signOut();

    return json({ ok: true, redirect: '/' }, { status: 200 });
  } catch (e) {
    console.error('account/delete error', e);
    return json({ ok: false, code: 'SERVER_ERROR' }, { status: 500 });
  }
};

