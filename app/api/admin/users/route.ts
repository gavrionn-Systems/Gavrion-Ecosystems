import {createClient} from '@supabase/supabase-js';
export async function POST(request:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return Response.json({error:'La creación de cuentas requiere configurar Supabase en el servidor.'},{status:503});
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'');
 if(!token)return Response.json({error:'Autenticación requerida'},{status:401});
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:auth,error}=await admin.auth.getUser(token);
 if(error||!auth.user)return Response.json({error:'Sesión no válida'},{status:401});
 const {data:profile}=await admin.from('profiles').select('role,active').eq('id',auth.user.id).single();
 if(profile?.role!=='admin'||!profile.active)return Response.json({error:'Solo administradores'},{status:403});
 let body;try{body=await request.json()}catch{return Response.json({error:'Solicitud inválida'},{status:400})}
 const {full_name,username,password,role}=body;
 const normalizedUsername=typeof username==='string'?username.trim().toLowerCase():'';
 if(typeof full_name!=='string'||full_name.trim().length<2||!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(normalizedUsername)||typeof password!=='string'||password.length<12||!['admin','employee'].includes(role))return Response.json({error:'Revisa nombre, usuario, rol y contraseña (mínimo 12 caracteres).'},{status:400});
 const {data:existing}=await admin.from('profiles').select('id').ilike('username',normalizedUsername).maybeSingle();
 if(existing)return Response.json({error:'Ese nombre de usuario ya está registrado.'},{status:409});
 const internalEmail=`${normalizedUsername}@accounts.gavrion.local`;
 const result=await admin.auth.admin.createUser({email:internalEmail,password,email_confirm:true,user_metadata:{full_name:full_name.trim(),username:normalizedUsername,managed_by_admin:'true'}});
 if(result.error)return Response.json({error:result.error.message},{status:400});
 const saved=await admin.from('profiles').upsert({id:result.data.user.id,full_name:full_name.trim(),username:normalizedUsername,role,active:true});
 if(saved.error)return Response.json({error:'La cuenta fue creada, pero no se pudo asignar el perfil. Revísala en Usuarios antes de volver a crearla.'},{status:500});
 const {data:membership}=await admin.from('organization_members').select('organization_id').eq('user_id',auth.user.id).eq('active',true).order('created_at',{ascending:true}).limit(1).maybeSingle();
 if(membership?.organization_id){
  const assigned=await admin.from('organization_members').upsert({organization_id:membership.organization_id,user_id:result.data.user.id,role,active:true});
  if(assigned.error)return Response.json({error:'La cuenta fue creada, pero no se pudo asociar a la empresa.'},{status:500});
 }
 return Response.json({id:result.data.user.id},{status:201});
}
