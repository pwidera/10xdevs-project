import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.server.ts";

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  // Public API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/password/forgot",
  "/api/auth/logout",
]);

const PROTECTED_EXACT = new Set<string>(["/auth/change-password", "/auth/delete-account"]);

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  locals.supabase = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  locals.user = user ? { id: user.id, email: user.email || null } : null;

  if (PUBLIC_PATHS.has(url.pathname)) {
    return next();
  }

  const isProtected = url.pathname.startsWith("/app/") || PROTECTED_EXACT.has(url.pathname);
  if (isProtected && !locals.user) {
    const nextUrl = encodeURIComponent(url.pathname + url.search);
    return redirect(`/auth/login?next=${nextUrl}`);
  }

  return next();
});
