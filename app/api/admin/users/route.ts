import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request:Request){
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'');
 if(!token)return Response.json({error:'Autenticación requerida'},{status:401});
 let admin;
 try{admin=createAdminClient()}catch{return Response.json({error:'La creación de cuentas requiere configurar Supabase en el servidor.'},{status:503});}
 const {data:auth,error}=await admin.auth.getUser(token);
 if(error||!auth.user)return Response.json({error:'Sesión no válida'},{status:401});
 const {data:membership}=await admin.from('organization_members').select('organization_id,role,active').eq('user_id',auth.user.id).eq('active',true).order('created_at',{ascending:true}).limit(1).maybeSingle();
 if(membership?.role!=='admin')return Response.json({error:'Solo administradores de la empresa activa'},{status:403});
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
 const assigned=await admin.from('organization_members').upsert({organization_id:membership.organization_id,user_id:result.data.user.id,role,active:true});
 if(assigned.error)return Response.json({error:'La cuenta fue creada, pero no se pudo asociar a la empresa.'},{status:500});
 await admin.from('audit_log').insert({organization_id:membership.organization_id,actor_id:auth.user.id,action:'INSERT',table_name:'managed_users',record_id:result.data.user.id,new_data:{username:normalizedUsername,role}});
 return Response.json({id:result.data.user.id},{status:201});
}

export async function PATCH(request:Request){
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'');
 if(!token)return Response.json({error:'Autenticación requerida'},{status:401});
 let admin;
 try{admin=createAdminClient()}catch{return Response.json({error:'La administración de usuarios requiere configurar Supabase en el servidor.'},{status:503});}
 const {data:auth,error:authError}=await admin.auth.getUser(token);
 if(authError||!auth.user)return Response.json({error:'Sesión no válida'},{status:401});
 const {data:membership,error:membershipError}=await admin.from('organization_members').select('organization_id,role,active').eq('user_id',auth.user.id).eq('active',true).order('created_at',{ascending:true}).limit(1).maybeSingle();
 if(membershipError||membership?.role!=='admin')return Response.json({error:'Solo administradores pueden administrar usuarios.'},{status:403});

 let body:any;
 try{body=await request.json()}catch{return Response.json({error:'Solicitud inválida'},{status:400});}
 const userId=typeof body.user_id==='string'?body.user_id:'';
 if(!userId)return Response.json({error:'Falta el usuario que se actualizará.'},{status:400});
 const {data:target}=await admin.from('organization_members').select('organization_id,role,active').eq('organization_id',membership.organization_id).eq('user_id',userId).maybeSingle();
 if(!target)return Response.json({error:'El usuario no pertenece a la empresa activa.'},{status:404});

 const nextRole=body.role===undefined?target.role:body.role;
 const nextActive=body.active===undefined?target.active:Boolean(body.active);
 if(!['admin','employee'].includes(nextRole))return Response.json({error:'Rol inválido.'},{status:400});
 if(body.full_name!==undefined && (typeof body.full_name!=='string'||body.full_name.trim().length<2))return Response.json({error:'El nombre debe tener al menos 2 caracteres.'},{status:400});
 if(body.password!==undefined && (typeof body.password!=='string'||body.password.length<12))return Response.json({error:'La contraseña debe tener al menos 12 caracteres.'},{status:400});

 if((target.role==='admin'&&target.active)&&((nextRole!=='admin')||!nextActive)){
   const {count}=await admin.from('organization_members').select('user_id',{count:'exact',head:true}).eq('organization_id',membership.organization_id).eq('role','admin').eq('active',true);
   if((count??0)<=1)return Response.json({error:'La empresa debe conservar al menos un administrador activo.'},{status:400});
 }

 if(body.password!==undefined){
   const {error}=await admin.auth.admin.updateUserById(userId,{password:body.password});
   if(error)return Response.json({error:error.message},{status:400});
 }
 const profilePatch:any={};
 if(body.full_name!==undefined)profilePatch.full_name=body.full_name.trim();
 if(body.role!==undefined)profilePatch.role=nextRole;
 if(body.active!==undefined)profilePatch.active=nextActive;
 if(Object.keys(profilePatch).length){
   const {error}=await admin.from('profiles').update(profilePatch).eq('id',userId);
   if(error)return Response.json({error:error.message},{status:400});
 }
 if(body.role!==undefined||body.active!==undefined){
   const {error}=await admin.from('organization_members').update({role:nextRole,active:nextActive}).eq('organization_id',membership.organization_id).eq('user_id',userId);
   if(error)return Response.json({error:error.message},{status:400});
 }
 await admin.from('audit_log').insert({organization_id:membership.organization_id,actor_id:auth.user.id,action:'UPDATE',table_name:'managed_users',record_id:userId,new_data:{role:nextRole,active:nextActive,full_name:profilePatch.full_name??null,password_reset:body.password!==undefined}});
 return Response.json({id:userId},{status:200});
}
