import { randomBytes } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ error: 'Autenticación requerida.' }, { status: 401 });

  let admin;
  try { admin = createAdminClient(); } catch { return Response.json({ error: 'Supabase no está configurado en el servidor.' }, { status: 503 }); }

  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return Response.json({ error: 'Sesión no válida.' }, { status: 401 });

  const { data: platformAdmin, error: platformError } = await admin
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', auth.user.id)
    .eq('active', true)
    .maybeSingle();
  if (platformError || !platformAdmin) return Response.json({ error: 'Solo el superadministrador puede restablecer cuentas.' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'Solicitud inválida.' }, { status: 400 }); }
  const userId = typeof body === 'object' && body !== null && 'user_id' in body ? (body as { user_id?: unknown }).user_id : undefined;
  if (!isUuid(userId)) return Response.json({ error: 'Usuario inválido.' }, { status: 400 });
  if (userId === auth.user.id) return Response.json({ error: 'Usa tu propio flujo de cambio de contraseña para tu cuenta.' }, { status: 400 });

  const { data: protectedAccount } = await admin.from('platform_admins').select('user_id').eq('user_id', userId).eq('active', true).maybeSingle();
  if (protectedAccount) return Response.json({ error: 'Las cuentas de plataforma están protegidas.' }, { status: 400 });

  const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
  if (targetError || !target.user) return Response.json({ error: 'No se encontró el usuario.' }, { status: 404 });

  const temporaryPassword = randomBytes(18).toString('base64url');
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password: temporaryPassword });
  if (updateError) return Response.json({ error: updateError.message }, { status: 400 });

  const { data: membership } = await admin.from('organization_members').select('organization_id').eq('user_id', userId).eq('active', true).order('created_at', { ascending: true }).limit(1).maybeSingle();
  if (membership?.organization_id) {
    await admin.from('audit_log').insert({
      organization_id: membership.organization_id,
      actor_id: auth.user.id,
      action: 'UPDATE',
      table_name: 'managed_users',
      record_id: userId,
      new_data: { password_reset: true, reset_by_platform_admin: true },
    });
  }

  return Response.json({ temporary_password: temporaryPassword }, { status: 200 });
}
