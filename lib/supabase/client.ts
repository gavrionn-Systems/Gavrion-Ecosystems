import { createBrowserClient } from '@supabase/ssr';
import { supabaseKey, supabaseUrl } from './config';

export function createClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  }
  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
}
