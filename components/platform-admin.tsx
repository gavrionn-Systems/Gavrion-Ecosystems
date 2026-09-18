'use client';

import { useState } from 'react';
import { Building2, Database, HardDrive, RefreshCw, Users, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEconexoData, type PlatformOrganization } from '@/lib/econexo-data';

const formatNumber = (value: number) => new Intl.NumberFormat('es-HN').format(value);
const formatBytes = (value: number) => value < 1024 * 1024 ? `${Math.max(0, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(2)} MB`;

export function PlatformAdminPanel() {
  const { platformOrganizations, refreshPlatform, setOrganizationStatus, loading } = useEconexoData();
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const updateStatus = async (organization: PlatformOrganization, status: PlatformOrganization['status']) => {
    setBusyId(organization.id); setMessage('');
    try { await setOrganizationStatus(organization.id, status); setMessage('Estado actualizado.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el estado.'); }
    finally { setBusyId(''); }
  };
  return <div className="platform-admin-panel">
    <div className="settings-head row"><div><h2>Panel administrativo SaaS</h2><p>Control interno de las empresas que utilizan Gavrion EcoSystems.</p></div><Button variant="outline" onClick={() => void refreshPlatform()} disabled={loading}><RefreshCw />Actualizar</Button></div>
    {message && <p className="platform-admin-message" role="status">{message}</p>}
    {!platformOrganizations.length ? <div className="empty-state"><Building2 /><strong>Sin empresas para mostrar</strong><span>Verifica que tu usuario esté registrado en <code>platform_admins</code> en Supabase.</span></div> : <div className="platform-org-list">{platformOrganizations.map(organization => <article key={organization.id} className="platform-org-card">
      <div className="platform-org-header"><span className={`platform-status ${organization.status}`}><i />{organization.status === 'active' ? 'Activa' : organization.status === 'suspended' ? 'Suspendida' : 'Pendiente'}</span><strong>{organization.name}</strong><small>{organization.slug} · Alta {new Date(organization.created_at).toLocaleDateString('es-HN')}</small></div>
      <div className="platform-metrics"><span><Users />{formatNumber(organization.user_count)}<small>usuarios</small></span><span><Database />{formatNumber(organization.record_count)}<small>registros</small></span><span><HardDrive />{formatBytes(organization.storage_bytes)}<small>almacenamiento</small></span></div>
      <details className="platform-users"><summary>Ver usuarios ({organization.user_count})</summary>{organization.users.map(user => <div key={user.id}><span>{user.full_name}<small>@{user.username || 'sin usuario'}</small></span><b>{user.role === 'admin' ? 'Admin' : 'Empleado'}</b><i className={user.active ? 'active' : ''}>{user.active ? 'Activo' : 'Inactivo'}</i></div>)}</details>
      <div className="platform-org-actions"><Button disabled={busyId === organization.id || organization.status === 'active'} onClick={() => void updateStatus(organization, 'active')}><CheckCircle2 />Activar</Button><Button variant="outline" disabled={busyId === organization.id || organization.status === 'suspended'} onClick={() => void updateStatus(organization, 'suspended')}><XCircle />Suspender</Button></div>
    </article>)}</div>}
  </div>;
}
