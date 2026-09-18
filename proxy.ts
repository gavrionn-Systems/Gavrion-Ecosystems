import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const publicKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();

/**
 * Refreshes the Supabase session before requests reach the app and blocks
 * privileged API endpoints when there is no authenticated session.
 * The root page intentionally remains public because it contains the login.
 */
export async function proxy(request: NextRequest) {
  if (!publicUrl || !publicKey) {
    if (request.nextUrl.pathname.startsWith('/api/admin/')) {
      return NextResponse.json({ error: 'Autenticación no configurada.' }, { status: 503 });
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(publicUrl, publicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (request.nextUrl.pathname.startsWith('/api/admin/') && !user) {
    return NextResponse.json({ error: 'Autenticación requerida.' }, { status: 401 });
  }

  return response;
}

export const config = {
  matcher: ['/api/admin/:path*', '/auth/callback'],
};
