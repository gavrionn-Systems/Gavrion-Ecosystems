'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Building2, CheckCircle2, Database, HardDrive, RefreshCw, Search, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEconexoData, type AccessRequest, type PlatformOrganization } from '@/lib/econexo-data';

const statusLabel: Record<PlatformOrganization['status'], string> = {
  active: 'Activa', pending: 'Pendiente', suspended: 'Suspendida', rejected: 'Rechazada', deleted: 'En papelera',
};
const requestStatusLabel: Record<AccessRequest['status'], string> = {
  pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada',
};
const dateLabel = (value?: string | null) => value ? new Intl.DateTimeFormat('es-HN', { dateStyle: 'medium' }).format(new Date(value)) : '—';
const sizeLabel = (value: number) => value >= 1024 * 1024 * 1024 ? `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB` : value >= 1024 * 1024 ? `${(value / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(value / 1024)} KB`;

function ExecutiveRequestCard({ request, busy, onReview }: { request: AccessRequest; busy: boolean; onReview: (request: AccessRequest, decision: 'approved' | 'rejected') => void }) {
  const pending = request.status === 'pending';
  return <article className="access-request-card">
    <div>
      <span className={`platform-status ${request.status}`}>{requestStatusLabel[request.status]}</span>
      <h3>{request.organization_name}</h3>
      <p><strong>{request.requested_name}</strong>{request.requested_email ? ` · ${request.requested_email}` : ''}</p>
      <p>Solicitud recibida el {dateLabel(request.created_at)}</p>
      {request.rejection_reason && <small>Motivo: {request.rejection_reason}</small>}
    </div>
    {pending && <div className="access-request-actions">
      <Button size="sm" onClick={() => onReview(request, 'approved')} disabled={busy}><CheckCircle2 />Aprobar</Button>
      <Button size="sm" variant="outline" onClick={() => onReview(request, 'rejected')} disabled={busy}><XCircle />Rechazar</Button>
    </div>}
  </article>;
}

function ExecutiveCompanyCard({ organization }: { organization: PlatformOrganization }) {
  return <article className="platform-org-card executive-company-card">
    <header className="platform-org-header">
      <span className={`platform-status ${organization.status}`}><i />{statusLabel[organization.status]}</span>
      <div><strong>{organization.name}</strong><small>{organization.slug}</small></div>
      <small>Alta: {dateLabel(organization.created_at)}</small>
    </header>
    <div className="platform-metrics">
      <span><Users />{organization.user_count}<small>usuarios</small></span>
      <span><Database />{organization.record_count}<small>registros</small></span>
      <span><HardDrive />{sizeLabel(organization.storage_bytes)}<small>almacenamiento</small></span>
    </div>
    <div className="executive-company-footer">
      <span>Última actividad</span><strong>{dateLabel(organization.last_activity_at)}</strong>
    </div>
  </article>;
}

export function PlatformExecutivePanel() {
  const { platformOrganizations, accessRequests, loading, refreshPlatform, refreshAccessRequests, reviewAccessRequest } = useEconexoData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | PlatformOrganization['status']>('all');
  const [section, setSection] = useState<'overview' | 'requests' | 'companies'>('overview');
  const [message, setMessage] = useState('');
  const [busyRequest, setBusyRequest] = useState<string | null>(null);
  useEffect(() => { void Promise.all([refreshPlatform(), refreshAccessRequests()]); }, [refreshPlatform, refreshAccessRequests]);

  const filtered = useMemo(() => platformOrganizations.filter(org => {
    const matchesQuery = !query.trim() || `${org.name} ${org.slug}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (status === 'all' || org.status === status);
  }), [platformOrganizations, query, status]);
  const pendingRequests = accessRequests.filter(request => request.status === 'pending');
  const totals = useMemo(() => ({
    companies: platformOrganizations.length,
    active: platformOrganizations.filter(org => org.status === 'active').length,
    users: platformOrganizations.reduce((total, org) => total + Number(org.user_count || 0), 0),
    records: platformOrganizations.reduce((total, org) => total + Number(org.record_count || 0), 0),
    storage: platformOrganizations.reduce((total, org) => total + Number(org.storage_bytes || 0), 0),
  }), [platformOrganizations]);

  const review = async (request: AccessRequest, decision: 'approved' | 'rejected') => {
    let reason: string | undefined;
    if (decision === 'rejected') {
      reason = window.prompt('Indica el motivo del rechazo:')?.trim() || undefined;
      if (!reason) return;
    }
    setBusyRequest(request.id); setMessage('');
    try {
      await reviewAccessRequest(request.id, decision, reason);
      setMessage(decision === 'approved' ? 'Empresa aprobada correctamente.' : 'Solicitud rechazada correctamente.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la solicitud.');
    } finally { setBusyRequest(null); }
  };
  const reload = () => { setMessage(''); void Promise.all([refreshPlatform(), refreshAccessRequests()]); };

  return <div className="platform-page executive-platform-page">
    <PageHeader onRefresh={reload} loading={loading} />
    <div className="platform-global-metrics executive-metrics">
      <Metric icon={<Building2 />} label="Empresas registradas" value={totals.companies} />
      <Metric icon={<CheckCircle2 />} label="Empresas activas" value={totals.active} success />
      <Metric icon={<Users />} label="Usuarios" value={totals.users} />
      <Metric icon={<Database />} label="Registros globales" value={totals.records} />
      <Metric icon={<HardDrive />} label="Almacenamiento" value={sizeLabel(totals.storage)} />
    </div>
    {message && <div className={`platform-admin-message ${message.includes('correctamente') ? '' : 'platform-executive-error'}`}>{message}</div>}
    <div className="platform-admin-tabs executive-tabs">
      <button className={section === 'overview' ? 'active' : ''} onClick={() => setSection('overview')}><BarChart3 />Resumen general</button>
      <button className={section === 'requests' ? 'active' : ''} onClick={() => setSection('requests')}><CheckCircle2 />Solicitudes {pendingRequests.length ? `(${pendingRequests.length})` : ''}</button>
      <button className={section === 'companies' ? 'active' : ''} onClick={() => setSection('companies')}><Building2 />Empresas</button>
    </div>
    {section === 'overview' && <div className="platform-summary-grid">
      <section className="platform-subpanel"><header><div><h3>Actividad de la plataforma</h3><p>Resumen consolidado de las empresas registradas.</p></div></header>
        {platformOrganizations.length ? platformOrganizations.slice(0, 6).map(org => <div className="platform-ranking" key={org.id}><span><strong>{org.name}</strong><small>{statusLabel[org.status]} · {org.user_count} usuarios</small></span><b>{org.record_count} registros</b></div>) : <div className="platform-empty"><Building2 />Aún no hay empresas registradas.</div>}
      </section>
      <section className="platform-subpanel"><header><div><h3>Solicitudes pendientes</h3><p>Empresas que requieren revisión.</p></div><button className="platform-refresh-button" onClick={reload} aria-label="Actualizar"><RefreshCw /></button></header>
        {pendingRequests.length ? pendingRequests.slice(0, 5).map(request => <div className="platform-ranking" key={request.id}><span><strong>{request.organization_name}</strong><small>{request.requested_name} · {dateLabel(request.created_at)}</small></span><button className="platform-transfer-button" onClick={() => setSection('requests')}>Revisar</button></div>) : <div className="platform-empty"><CheckCircle2 />No hay solicitudes pendientes.</div>}
      </section>
    </div>}
    {section === 'requests' && <section className="platform-subpanel executive-requests-panel"><header><div><h3>Solicitudes de acceso</h3><p>Aprueba o rechaza nuevas empresas. Las decisiones quedan registradas.</p></div></header>{accessRequests.length ? <div className="access-requests-list">{accessRequests.map(request => <ExecutiveRequestCard key={request.id} request={request} busy={busyRequest === request.id} onReview={review} />)}</div> : <div className="platform-empty"><CheckCircle2 />No hay solicitudes para revisar.</div>}</section>}
    {section === 'companies' && <section className="platform-subpanel"><header><div><h3>Empresas del sistema</h3><p>Vista de consulta para seguimiento ejecutivo. Las acciones sensibles están reservadas al propietario global.</p></div></header><div className="platform-toolbar"><label className="platform-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar empresa…" /></label><label className="platform-filter"><select value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="all">Todos los estados</option><option value="active">Activas</option><option value="pending">Pendientes</option><option value="suspended">Suspendidas</option><option value="rejected">Rechazadas</option></select></label></div><div className="platform-org-list">{filtered.length ? filtered.map(org => <ExecutiveCompanyCard organization={org} key={org.id} />) : <div className="platform-empty"><Search />No se encontraron empresas.</div>}</div></section>}
  </div>;
}

function Metric({ icon, label, value, success = false }: { icon: React.ReactNode; label: string; value: string | number; success?: boolean }) { return <div className={`platform-global-metric ${success ? 'success' : ''}`}>{icon}<span><small>{label}</small><strong>{value}</strong></span></div>; }
function PageHeader({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) { return <header className="page-title editorial-title executive-page-title"><div><p className="eyebrow">PLATAFORMA</p><h1>Panel ejecutivo</h1><p>Supervisa empresas y aprueba solicitudes de acceso.</p></div><Button variant="outline" onClick={onRefresh} disabled={loading}><RefreshCw />{loading ? 'Actualizando…' : 'Actualizar'}</Button></header>; }
