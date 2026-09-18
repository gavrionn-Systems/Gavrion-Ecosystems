'use client';

import { useMemo, useState } from 'react';
import { Building2, Check, ImagePlus, MailPlus, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEconexoData } from '@/lib/econexo-data';

const MATERIAL_OPTIONS = ['Hierro', 'Aluminio', 'Cobre', 'Zinc', 'Papel', 'Cartón', 'Pet Claro', 'Pet Verde'];
type Invite = { full_name: string; username: string; role: 'admin' | 'employee'; password: string };

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { settings, completeOnboarding, createProfile, uploadCompanyLogo, loading } = useEconexoData();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(settings?.name ?? '');
  const [phone, setPhone] = useState(settings?.fiscal_phone ?? '');
  const [address, setAddress] = useState(settings?.fiscal_address ?? '');
  const [logo, setLogo] = useState(settings?.logo_url ?? '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [materialNames, setMaterialNames] = useState<string[]>(MATERIAL_OPTIONS);
  const [invite, setInvite] = useState<Invite>({ full_name: '', username: '', role: 'employee', password: '' });
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState('');

  const selectedLabel = useMemo(() => materialNames.length === MATERIAL_OPTIONS.length ? 'Catálogo recomendado completo' : `${materialNames.length} materiales seleccionados`, [materialNames.length]);
  const readLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Selecciona una imagen válida para el logo.'); return; }
    if (file.size > 1.5 * 1024 * 1024) { setError('El logo no puede superar 1.5 MB en el onboarding.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setLogoFile(file); setLogo(String(reader.result ?? '')); setError(''); };
    reader.onerror = () => setError('No se pudo leer el logo.');
    reader.readAsDataURL(file);
  };
  const validateCompany = () => {
    if (name.trim().length < 2) return 'Escribe el nombre de la empresa.';
    if (phone.replace(/\D/g, '').length < 8) return 'Escribe un teléfono válido.';
    if (address.trim().length < 4) return 'Escribe la dirección de la empresa.';
    return '';
  };
  const goMaterials = () => { const message = validateCompany(); if (message) { setError(message); return; } setError(''); setStep(2); };
  const goInvites = () => { if (!materialNames.length) { setError('Selecciona al menos un material para iniciar el catálogo.'); return; } setError(''); setStep(3); };
  const addInvite = () => {
    if (invite.full_name.trim().length < 2 || !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(invite.username.trim().toLowerCase()) || invite.password.length < 12) {
      setError('Cada usuario necesita nombre, usuario válido y contraseña de mínimo 12 caracteres.'); return;
    }
    if (invites.some(item => item.username.toLowerCase() === invite.username.trim().toLowerCase())) { setError('Ese usuario ya está en la lista.'); return; }
    setInvites(current => [...current, { ...invite, username: invite.username.trim().toLowerCase() }]);
    setInvite({ full_name: '', username: '', role: 'employee', password: '' }); setError('');
  };
  const finish = async () => {
    setError('');
    try {
      const logoUrl = logoFile ? await uploadCompanyLogo(logoFile) : (logo || null);
      await completeOnboarding({ name, phone, address, logo_url: logoUrl, material_names: materialNames });
      for (const item of invites) await createProfile(item);
      onComplete();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo completar la configuración inicial.'); }
  };

  return <div className="onboarding-layer" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
    <section className="onboarding-card">
      <header className="onboarding-head"><div><span className="onboarding-step">Paso {step} de 3</span><h1 id="onboarding-title">Configura tu empresa</h1><p>Completa estos datos para comenzar a operar en Gavrion EcoSystems.</p></div><span className="onboarding-brand">GAVRION</span></header>
      <div className="onboarding-progress"><i style={{ width: `${step * 33.333}%` }} /></div>
      {step === 1 && <div className="onboarding-body">
        <div className="onboarding-icon"><Building2 /></div><h2>Datos de la empresa</h2><p className="onboarding-help">Estos datos aparecerán en boletas, certificados y reportes.</p>
        <div className="form-grid"><label>Nombre de la empresa<input autoFocus required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Reciclajes del Norte" /></label><label>Teléfono<input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+504 0000-0000" /></label><label className="full">Dirección<input required value={address} onChange={e => setAddress(e.target.value)} placeholder="Ciudad, departamento, país" /></label></div>
        <div className="onboarding-logo-row">{logo ? <img src={logo} alt="Vista previa del logo" /> : <span><ImagePlus /></span>}<div><strong>Logo de la empresa</strong><small>Opcional · PNG, JPG o WebP · máximo 1.5 MB</small><label className="logo-upload">Seleccionar logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => readLogo(e.target.files?.[0])} /></label></div></div>
        <div className="onboarding-actions"><Button type="button" onClick={goMaterials}>Continuar <Package /></Button></div>
      </div>}
      {step === 2 && <div className="onboarding-body"><div className="onboarding-icon"><Package /></div><h2>Catálogo inicial</h2><p className="onboarding-help">Selecciona los residuos que manejará esta empresa. Podrás editar el catálogo después.</p><div className="material-check-grid">{MATERIAL_OPTIONS.map(material => <label key={material}><input type="checkbox" checked={materialNames.includes(material)} onChange={e => setMaterialNames(current => e.target.checked ? [...current, material] : current.filter(item => item !== material))} /><span>{material}</span><Check /></label>)}</div><p className="onboarding-selection">{selectedLabel}</p><div className="onboarding-actions"><Button type="button" variant="outline" onClick={() => setStep(1)}>Atrás</Button><Button type="button" onClick={goInvites}>Continuar <MailPlus /></Button></div></div>}
      {step === 3 && <div className="onboarding-body"><div className="onboarding-icon"><MailPlus /></div><h2>Agrega usuarios</h2><p className="onboarding-help">Crea los accesos iniciales de tu equipo. También puedes hacerlo después desde Configuración.</p><div className="onboarding-invite-form"><label>Nombre completo<input value={invite.full_name} onChange={e => setInvite({ ...invite, full_name: e.target.value })} /></label><label>Nombre de usuario<input autoComplete="username" value={invite.username} onChange={e => setInvite({ ...invite, username: e.target.value })} placeholder="usuario.ejemplo" /></label><label>Rol<select value={invite.role} onChange={e => setInvite({ ...invite, role: e.target.value as Invite['role'] })}><option value="employee">Empleado</option><option value="admin">Administrador</option></select></label><label>Contraseña inicial<input type="password" autoComplete="new-password" minLength={12} value={invite.password} onChange={e => setInvite({ ...invite, password: e.target.value })} placeholder="Mínimo 12 caracteres" /></label><Button type="button" variant="outline" onClick={addInvite}>Agregar a la lista</Button></div>{invites.length > 0 && <div className="onboarding-invite-list">{invites.map(item => <div key={item.username}><span>{item.full_name}<small>{item.username} · {item.role === 'admin' ? 'Administrador' : 'Empleado'}</small></span><button type="button" onClick={() => setInvites(current => current.filter(candidate => candidate.username !== item.username))} aria-label={`Quitar ${item.username}`}><X /></button></div>)}</div>}<div className="onboarding-actions"><Button type="button" variant="outline" onClick={() => setStep(2)}>Atrás</Button><Button type="button" onClick={() => void finish()} disabled={loading}>{loading ? 'Guardando…' : invites.length ? 'Finalizar configuración' : 'Finalizar sin agregar usuarios'}</Button></div></div>}
      {error && <div className="form-error onboarding-error" role="alert">{error}</div>}
    </section>
  </div>;
}
