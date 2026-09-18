const value = (input?: string) => {
  const trimmed = input?.trim();
  return trimmed && !trimmed.startsWith('TU_') ? trimmed : undefined;
};

// Supabase renamed the browser key from `anon` to `publishable`. Accept both
// names so existing Vercel projects do not silently fall back to demo mode.
export const supabaseUrl = value(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseKey = value(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  || value(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const demoMode = !supabaseConfigured && process.env.NODE_ENV !== 'production';
