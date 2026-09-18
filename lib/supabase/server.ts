import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseKey, supabaseUrl } from './config';

export async function createClient() {
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase no está configurado.');
  const cookieStore = await cookies();
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Un Server Component no puede escribir cookies; el proxy de auth
            // se añadirá cuando se conecte la autenticación real.
          }
        },
      },
    },
  );
}
