'use client';
import { useMemo, useState } from 'react';
import { Bell, Boxes, Building2, Check, ChevronDown, CircleDollarSign, ClipboardList, Download, Edit3, Eye, FileBarChart, Filter, LayoutDashboard, Lock, Mail, Menu, PackageCheck, Plus, RefreshCw, Search, Settings, ShoppingCart, Trash2, TrendingDown, TrendingUp, Truck, UserCog, UserRound, Users, X, ReceiptText, } from 'lucide-react';
import { TableRow, TableAction, TableSkeleton, TableEmpty } from '@/components/table-effects';
import { BillingProvider, BillingView, useBilling } from '@/components/billing';
import { supplierDisplayId, clientDisplayId } from '@/lib/party-codes';
import { AddUser, SupplierCategories } from '@/components/admin-settings';
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { PlatformAdminPanel } from '@/components/platform-admin';
import { defaultSupplierCategories, supplierCategoryId } from '@/lib/supplier-categories';
import { CodeSettings } from '@/components/code-settings';
import { MaterialCatalog } from '@/components/material-catalog';
import { defaultMaterialGroups, materialBelongsToGroup, materialGroupId, weightUnitLabel } from '@/lib/material-groups';
import { FinancialReports } from '@/components/financial-reports';
import { BusinessDashboard } from '@/components/business-dashboard';
import { Certificates } from '@/components/certificates';
import { WeightTickets } from '@/components/weight-tickets';
import { Button } from '@/components/ui/button';
import { AnimatedValue, RefreshButton, NotificationBell, MobileDrawer } from '@/components/motion';
import { EconexoDataProvider, useEconexoData, type CategoryRecord, type ClientRecord, type InventoryRecord, type MaterialRecord, type ProfileRecord, type SupplierRecord, } from '@/lib/econexo-data';
type View = 'certificados' | 'dashboard' | 'inventarios' | 'inventario-form' | 'facturacion' | 'abastecimiento' | 'clientes' | 'reportes' | 'configuracion' | 'plataforma';
const PLATFORM_NAME = 'Gavrion EcoSystems';
const PLATFORM_LOGO = '/gavrion-ecosystems-logo.png';
type Notice = {
    message: string;
    tone?: 'success' | 'error';
};
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, admin: true },
    { id: 'inventarios', label: 'Inventario', icon: Boxes, admin: false },
    { id: 'facturacion', label: 'Boleta de peso', icon: ReceiptText, admin: true },
    { id: 'certificados', label: 'Certificado', icon: ClipboardList, admin: true },
    { id: 'abastecimiento', label: 'Generador de residuo', icon: Truck, admin: false },
    { id: 'clientes', label: 'Cliente', icon: Users, admin: false },
    { id: 'reportes', label: 'Reportería', icon: FileBarChart, admin: true },
    { id: 'configuracion', label: 'Configuración', icon: Settings, admin: true },
    { id: 'plataforma', label: 'Panel administrativo SaaS', icon: Building2, admin: true, platformOnly: true },
] as const;
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '—';
const number = (value: number, digits = 2) => new Intl.NumberFormat('es-HN', { maximumFractionDigits: digits }).format(value);
const money = (value: number | null | undefined, currency: 'LPS' | 'USD' = 'LPS') => value == null ? '—' : new Intl.NumberFormat('es-HN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
const providerType = (type: string) => type === 'company' ? 'Empresa' : 'Recolector';
const clientType = (type: string) => type === 'company' ? 'Empresa' : 'Persona';
const stockStatus = (status: string) => status === 'in_transit' ? 'En proceso' : status === 'reserved' ? 'Reservado' : 'Disponible';
const initials = (name: string) => name.split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase();
const asNumber = (value: unknown) => Number(value ?? 0);
const toCurrency = (amount: number, source: 'LPS' | 'USD', target: 'LPS' | 'USD', rate: number) => source === target ? amount : source === 'USD' ? amount * rate : amount / rate;
function StatusBadge({ children }: {
    children: React.ReactNode;
}) { const label = String(children); const tone = label.includes('Disponible') || label.includes('Activo') ? 'success' : label.includes('proceso') ? 'info' : 'warning'; return <span className={`status ${tone}`}>
<i />{children}</span>; }
function PageTitle({ eyebrow, title, subtitle, action }: {
    eyebrow: string;
    title: string;
    subtitle: string;
    action?: React.ReactNode;
}) { const editorial = ['Dashboard', 'Inventario', 'Inventarios', 'Compras', 'Generador de residuo', 'Generadores de residuos', 'Generadores de residuos (por proveedores)', 'Cliente', 'Clientes', 'Reportes', 'Reportería', 'Configuración'].includes(title); return <div className={`page-title ${['Inventario', 'Inventarios'].includes(title) ? 'inventory-title ' : ''}${editorial ? 'editorial-title' : ''}`}>
<div>
<p className="eyebrow">{eyebrow}</p>
<h1>{title}</h1>
<p>{subtitle}</p>
</div>{action}</div>; }
function Modal({ title, subtitle = 'Completa o revisa la información.', children, onClose }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onClose: () => void;
}) { return <div className="modal-layer" role="dialog" aria-modal="true">
<div className="modal">
<div className="modal-head">
<div>
<h2>{title}</h2>
<p>{subtitle}</p>
</div>
<Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
<X />
</Button>
</div>{children}</div>
</div>; }
function EmptyState({ message }: {
    message: string;
}) { return <div className="empty-state">
<Search />
<strong>Sin resultados</strong>
<span>{message}</span>
</div>; }
function FieldError({ children }: {
    children?: string;
}) { return children ? <small className="field-error">{children}</small> : null; }
function PasswordRecoveryModal({ onClose }: { onClose: () => void }) {
    const { requestPasswordReset, loading } = useEconexoData();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setMessage(''); setError('');
        try { await requestPasswordReset(email); setMessage('Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.'); }
        catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo solicitar el restablecimiento.'); }
    };
    return <Modal title="Recuperar contraseña" subtitle="Disponible para cuentas que tienen un correo registrado." onClose={onClose}>
<form onSubmit={submit}><label>Correo electrónico<input autoFocus required type="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
<p className="login-help">Los empleados sin correo deben pedir al administrador una contraseña temporal o cambiarla desde su cuenta.</p>
{error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}
<div className="modal-actions"><Button type="button" variant="outline" onClick={onClose}>Cerrar</Button><Button type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar enlace'}</Button></div></form>
</Modal>;
}
function AccessGate({ children }: {
    children: React.ReactNode;
}) {
    const { ready, user, loading, error, signIn, signUp, demoMode } = useEconexoData();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [localError, setLocalError] = useState('');
    const [success, setSuccess] = useState('');
    const [recoveryOpen, setRecoveryOpen] = useState(false);
    if (!ready)
        return <main className="setup-screen">
<div className="setup-card">
<div className="loader"/>
<p>Comprobando sesión…</p>
</div>
</main>;
    if (!user)
        return <main className="setup-screen">
<form className="setup-card login-card" onSubmit={async (e) => { e.preventDefault(); setLocalError(''); try {
            if (mode === 'signup') {
                const result = await signUp({ full_name: fullName, username, email, password, company_name: companyName });
                setSuccess(result.needsConfirmation ? 'Cuenta creada. Revisa tu correo para confirmar el acceso.' : 'Cuenta creada. Preparando tu empresa…');
                if (result.needsConfirmation) setMode('login');
            } else await signIn(username, password);
        }
        catch (err) {
            setLocalError(err instanceof Error ? err.message : 'No fue posible iniciar sesión');
        } }}>
<div className="platform-login-logo-frame"><img className="platform-login-logo" src={PLATFORM_LOGO} alt={PLATFORM_NAME}/></div>
<p className="eyebrow">GAVRION ECOSYSTEMS</p>
<h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
{mode === 'login' && <p className="login-description">Ingresa tus credenciales para acceder al sistema.</p>}
{mode === 'signup' && <label>Nombre completo<input type="text" required minLength={2} value={fullName} onChange={e => setFullName(e.target.value)}/></label>}
{mode === 'signup' && <label>Nombre de la empresa<input type="text" required minLength={2} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ej. Reciclajes del Norte"/></label>}
<label>Nombre de usuario<span className="login-input-wrap"><UserRound aria-hidden="true"/><input type="text" required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,31}" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)}/></span>
</label>
{mode === 'signup' && <label>Correo electrónico<span className="login-input-wrap"><Mail aria-hidden="true"/><input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></span></label>}
<label>Contraseña<span className="login-input-wrap"><Lock aria-hidden="true"/><input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}/></span>
</label>{(localError || error) && <div className="form-error">{localError || error}</div>}{success && <div className="form-success">{success}</div>}<Button size="lg" type="submit" disabled={loading}>{loading ? 'Procesando…' : mode === 'login' ? 'Ingresar al sistema' : 'Crear cuenta'}</Button>
{!demoMode && mode === 'login' && <button type="button" className="login-switch" onClick={() => setRecoveryOpen(true)}>¿Olvidaste tu contraseña?</button>}
{!demoMode && <button type="button" className="login-switch" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setLocalError(''); setSuccess(''); }}>{mode === 'login' ? '¿Primera vez? Crear cuenta' : 'Ya tengo una cuenta · Iniciar sesión'}</button>}
</form>
{recoveryOpen && <PasswordRecoveryModal onClose={() => setRecoveryOpen(false)}/>}</main>;
    return <>{children}</>;
}
function WasteModal({ inventory, onClose, notify }: {
    inventory: InventoryRecord[];
    onClose: () => void;
    notify: (n: Notice) => void;
}) {
    const { registerWaste, loading } = useEconexoData();
    const available = inventory.filter(row => row.status !== 'in_transit' && Number(row.pounds) > 0);
    const [entryId, setEntryId] = useState(available[0]?.id ?? '');
    const [quantity, setQuantity] = useState(0);
    const [unit, setUnit] = useState<'lb' | 'ton'>('lb');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const selected = available.find(row => row.id === entryId);
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        if (!selected || quantity <= 0) {
            setError('Selecciona un lote y una cantidad válida.');
            return;
        }
        const pounds = unit === 'ton' ? quantity * 2000 : quantity;
        if (pounds > Number(selected.pounds) + 0.0001) {
            setError('La merma no puede superar las existencias disponibles.');
            return;
        }
        try {
            await registerWaste({ entry_id: entryId, quantity, unit, reason });
            notify({ message: 'Merma registrada e inventario actualizado' });
            onClose();
        }
        catch (reasonValue) {
            setError(reasonValue instanceof Error ? reasonValue.message : 'No se pudo registrar la merma.');
        }
    };
    return <Modal title="Registrar merma" subtitle="La cantidad se descontará del lote y quedará en la bitácora." onClose={onClose}>
<form onSubmit={submit}>
<div className="form-grid">
<label className="full">Lote de inventario<select required value={entryId} onChange={event => setEntryId(event.target.value)}><option value="">Selecciona</option>{available.map(row => <option value={row.id} key={row.id}>{row.inventory_code} · {row.material} · {row.category} · {number(row.tons)} ton disponibles</option>)}</select></label>
<label>Cantidad<input required type="number" min="0.0001" step="0.0001" value={quantity || ''} onChange={event => setQuantity(Number(event.target.value))}/></label>
<label>Unidad<select value={unit} onChange={event => setUnit(event.target.value as 'lb' | 'ton')}><option value="lb">Libras (lb)</option><option value="ton">Toneladas</option></select></label>
<label className="full">Motivo (opcional)<input value={reason} onChange={event => setReason(event.target.value)} placeholder="Daño, contaminación, humedad…" /></label>
</div>
{selected && <p className="chart-note">Existencia disponible: {number(selected.pounds)} lb · {number(selected.tons)} toneladas</p>}
{error && <div className="form-error">{error}</div>}
<div className="modal-actions"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={loading || !available.length}>{loading ? 'Guardando…' : 'Registrar merma'}</Button></div>
</form>
</Modal>;
}
function Inventory({ onEdit, notify }: {
    onEdit: (record?: InventoryRecord) => void;
    notify: (n: Notice) => void;
}) {
    const { inventory, settings, deleteInventory, loading } = useEconexoData();
    const [query, setQuery] = useState('');
    const [viewing, setViewing] = useState<InventoryRecord | null>(null);
    const [confirm, setConfirm] = useState<InventoryRecord | null>(null);
    const [deleting, setDeleting] = useState<InventoryRecord | null>(null);
    const [deleteSucceeded, setDeleteSucceeded] = useState(false);
    const [deletingIndex, setDeletingIndex] = useState(0);
    const [wasteOpen, setWasteOpen] = useState(false);
    const source = [...inventory];
    if (deleting && !source.some(r => r.id === deleting.id))
        source.splice(deletingIndex, 0, deleting);
    const rows = source.filter(r => [r.inventory_code, r.material, r.category, r.supplier].join(' ').toLowerCase().includes(query.toLowerCase()));
    const inventoryWithStock = inventory.filter(row => Number(row.tons) > 0 && row.status !== 'in_transit');
    const inventoryTypes = new Set(inventoryWithStock.map(row => row.material_id ?? row.material.trim().toLocaleLowerCase('es'))).size;
    const totalTons = inventoryWithStock.reduce((total, row) => total + Number(row.tons || 0), 0);
    const inventoryValue = inventoryWithStock.reduce((total, row) => total + toCurrency(asNumber(row.cost_total), row.currency ?? 'LPS', settings?.default_currency ?? 'LPS', settings?.usd_to_lps_rate ?? 24.75), 0);
    return <>
<PageTitle eyebrow="CONTROL DE EXISTENCIAS" title="Inventarios" subtitle="Crea, consulta, edita y elimina registros de residuos." action={<div className="page-title-actions"><Button variant="outline" size="lg" onClick={() => setWasteOpen(true)}>
<TrendingDown />Registrar merma</Button><Button size="lg" onClick={() => onEdit()}>
<Plus />Agregar inventario</Button></div>}/>
<div className="summary-strip">
<div>
<span>Tipo de residuos</span>
<strong>{inventoryTypes} activos</strong>
</div>
<div>
<span>Inventario inicial (T)</span>
<strong>{number(totalTons)} toneladas</strong>
</div>
<div>
<span>Inventario final (T)</span>
<strong>{number(totalTons)} toneladas</strong>
</div>
<div>
<span>Valor de Inventario (L)</span>
<strong>{money(inventoryValue, 'LPS')}</strong>
</div>
</div>
<section className="panel table-panel">
<div className="toolbar">
<label className="search">
<Search />
<input placeholder="Buscar residuo, proveedor o ID…" value={query} onChange={e => setQuery(e.target.value)}/>
</label>
</div>
<div className="table-wrap fluid-table" role="region" aria-label="Inventarios" tabIndex={0} aria-busy={loading && !deleting}>
<table>
<thead>
<tr>{['ID / Fecha', 'Residuo / Categoría', 'Peso', 'Equivalencias', 'Generador', 'Costo / Venta', 'Moneda', 'Estado', 'Acciones'].map(h => <th scope="col" key={h}>{h}</th>)}</tr>
</thead>
<tbody>{loading && !deleting ? <TableSkeleton columns={9}/> : rows.length ? rows.map((r, index) => <TableRow key={r.id} id={r.id} index={index} exiting={deleteSucceeded && deleting?.id === r.id}>
<td>
<strong>{r.inventory_code}</strong>
<small>{formatDate(r.received_at)}</small>
</td>
<td>
<strong>{r.material}</strong>
<small>{r.category}</small>
</td>
<td>
<strong>{number(r.quantity)} {weightUnitLabel(r.unit)}</strong>
<small>Unidad original</small>
</td>
<td>
<span>{number(r.pounds)} lb</span>
<small>{number(r.tons)} toneladas</small>
</td>
<td>
<strong>{r.supplier}</strong>
<small>{providerType(r.supplier_type)}</small>
</td>
<td>
<span>{money(r.cost_price, r.currency ?? 'LPS')}</span>
<small>Venta {money(r.sale_price, r.currency ?? 'LPS')}</small>
</td>
<td>{r.currency ?? '—'}</td>
<td>
<StatusBadge>{stockStatus(r.status)}</StatusBadge>
</td>
<td>
<div className="row-actions">
<TableAction label="Ver detalle" onClick={() => setViewing(r)}>
<Eye />
</TableAction>
<TableAction label="Editar" onClick={() => onEdit(r)}>
<Edit3 />
</TableAction>
<TableAction label="Eliminar" danger onClick={() => setConfirm(r)}>
<Trash2 />
</TableAction>
</div>
</td>
</TableRow>) : <TableEmpty columns={9} message="No hay registros que coincidan."/>}</tbody>
</table>
</div>
</section>{viewing && <Modal title={viewing.inventory_code} subtitle="Detalle completo del registro" onClose={() => setViewing(null)}>
<div className="detail-grid">
<div>
<span>Material</span>
<strong>{viewing.material} · {viewing.category}</strong>
</div>
<div>
<span>Fecha</span>
<strong>{formatDate(viewing.received_at)}</strong>
</div>
<div>
<span>Cantidad original</span>
<strong>{number(viewing.quantity)} {weightUnitLabel(viewing.unit)}</strong>
</div>
<div>
<span>Conversión</span>
<strong>{number(viewing.pounds)} lb / {number(viewing.tons)} toneladas</strong>
</div>
<div>
<span>Proveedor</span>
<strong>{viewing.supplier}</strong>
</div>
<div>
<span>Entregado por</span>
<strong>{viewing.delivered_by}</strong>
</div>
<div>
<span>Costo total</span>
<strong>{money(viewing.cost_total, viewing.currency ?? 'LPS')}</strong>
</div>
<div>
<span>Venta estimada</span>
<strong>{money(viewing.estimated_sale, viewing.currency ?? 'LPS')}</strong>
</div>
<div>
<span>Ganancia estimada</span>
<strong>{money(viewing.estimated_profit, viewing.currency ?? 'LPS')}</strong>
</div>
<div className="full">
<span>Observaciones</span>
<strong>{viewing.notes || 'Sin observaciones'}</strong>
</div>
</div>
<div className="modal-actions">
<Button variant="outline" onClick={() => setViewing(null)}>Cerrar</Button>
<Button onClick={() => { setViewing(null); onEdit(viewing); }}>
<Edit3 />Editar</Button>
</div>
</Modal>}{confirm && <Modal title="Eliminar inventario" subtitle="Esta acción no se puede deshacer." onClose={() => setConfirm(null)}>
<p>¿Deseas eliminar <strong>{confirm.inventory_code}</strong>?</p>
<div className="modal-actions">
<Button variant="outline" onClick={() => setConfirm(null)}>Cancelar</Button>
<Button variant="destructive" disabled={loading} onClick={async () => { try {
        setDeletingIndex(inventory.findIndex(r => r.id === confirm.id));
        setDeleting(confirm);
        setDeleteSucceeded(false);
        await deleteInventory(confirm.id);
        setConfirm(null);
        setDeleteSucceeded(true);
        await new Promise(resolve => setTimeout(resolve, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220));
        setDeleting(null);
        setDeleteSucceeded(false);
        notify({ message: 'Inventario eliminado' });
    }
    catch (e) {
        setDeleting(null);
        setDeleteSucceeded(false);
        notify({ message: e instanceof Error ? e.message : 'No se pudo eliminar', tone: 'error' });
    } }}>{loading ? 'Eliminando…' : 'Eliminar'}</Button>
</div>
</Modal>}{wasteOpen && <WasteModal inventory={inventory} onClose={() => setWasteOpen(false)} notify={notify}/>}</>;
}
function LegacyInventoryForm({ record, onBack, notify }: {
    record?: InventoryRecord;
    onBack: () => void;
    notify: (n: Notice) => void;
}) {
    const { materials, categories, suppliers, settings, createInventory, updateInventory, loading } = useEconexoData();
    const rate = settings?.usd_to_lps_rate ?? 24.75;
    const [materialId, setMaterialId] = useState(record?.material_id ?? materials.find(x => x.active)?.id ?? '');
    const availableCategories = categories.filter(x => x.material_id === materialId && x.active);
    const [categoryId, setCategoryId] = useState(record?.category_id ?? '');
    const [supplierId, setSupplierId] = useState(record?.supplier_id ?? suppliers.find(x => x.active)?.id ?? '');
    const [deliveredBy, setDeliveredBy] = useState(record?.delivered_by ?? '');
    const [qty, setQty] = useState(record?.quantity ?? 0);
    const [unit, setUnit] = useState<'lb' | 'ton'>(record?.unit ?? settings?.default_weight_unit ?? 'lb');
    const [currency, setCurrency] = useState<'LPS' | 'USD'>(record?.currency ?? settings?.default_currency ?? 'LPS');
    const [cost, setCost] = useState(record?.cost_price ?? 0);
    const [sale, setSale] = useState(record?.sale_price ?? 0);
    const [date, setDate] = useState(record?.received_at ?? new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState(record?.notes ?? '');
    const [error, setError] = useState('');
    const pounds = unit === 'lb' ? qty : qty * 2000, tons = unit === 'ton' ? qty : qty / 2000, totalCost = qty * cost, totalSale = qty * sale, otherCurrency = currency === 'LPS' ? 'USD' : 'LPS';
    const submit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); const effectiveCategory = categoryId || availableCategories[0]?.id; if (!materialId || !effectiveCategory || !supplierId || !deliveredBy.trim() || qty <= 0) {
        setError('Completa material, categoría, proveedor, persona que entrega y una cantidad válida.');
        return;
    } try {
        const input = { material_id: materialId, category_id: effectiveCategory, supplier_id: supplierId, delivered_by: deliveredBy.trim(), quantity: qty, unit, currency, cost_price: cost, sale_price: sale, exchange_rate: rate, received_at: date, notes };
        if (record)
            await updateInventory(record.id, input);
        else
            await createInventory(input);
        notify({ message: record ? 'Inventario actualizado' : 'Inventario guardado' });
        onBack();
    }
    catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible guardar');
    } };
    return <>
<PageTitle eyebrow={record ? 'EDICIÓN DE MOVIMIENTO' : 'NUEVO MOVIMIENTO'} title={record ? 'Editar inventario' : 'Agregar inventario'} subtitle="Las conversiones de peso y moneda se calculan automáticamente." action={<Button variant="outline" onClick={onBack}>Volver al inventario</Button>}/>
<form className="form-layout" onSubmit={submit}>
<section className="panel form-card">
<h2>Información del material</h2>
<div className="form-grid">
<label>Material<select required value={materialId} onChange={e => { setMaterialId(e.target.value); setCategoryId(''); }}>
<option value="">Selecciona</option>{materials.filter(x => x.active).map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select>
</label>
<label>Categoría<select required value={categoryId || availableCategories[0]?.id || ''} onChange={e => setCategoryId(e.target.value)}>
<option value="">Selecciona</option>{availableCategories.map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select>
</label>
<label>Cantidad<input type="number" min="0.0001" step="0.0001" value={qty || ''} onChange={e => setQty(Number(e.target.value))} required/>
</label>
<label>Unidad<select value={unit} onChange={e => setUnit(e.target.value as 'lb' | 'ton')}>
<option value="lb">Libras (lb)</option>
<option value="ton">Toneladas</option>
</select>
</label>
</div>
<div className="converter">
<div>
<span>Cantidad ingresada</span>
<strong>{number(qty, 4)} {weightUnitLabel(unit)}</strong>
</div>
<span className="equals">=</span>
<div>
<span>Equivalencia</span>
<strong>{unit === 'lb' ? `${number(tons, 4)} toneladas` : `${number(pounds, 4)} lb`}</strong>
</div>
<small>1 tonelada = 2,000 libras</small>
</div>
<h2>Origen y compra</h2>
<div className="form-grid">
<label>Proveedor<select required value={supplierId} onChange={e => setSupplierId(e.target.value)}>
<option value="">Selecciona</option>{suppliers.filter(x => x.active).map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select>
</label>
<label>Persona que entregó<input required value={deliveredBy} onChange={e => setDeliveredBy(e.target.value)}/>
</label>
<label>Tipo de proveedor<input readOnly value={providerType(suppliers.find(x => x.id === supplierId)?.type ?? 'collector')}/>
</label>
<label>Fecha de ingreso<input type="date" required value={date} onChange={e => setDate(e.target.value)}/>
</label>
<label>Precio de costo / {weightUnitLabel(unit)}<input type="number" min="0" step="0.0001" value={cost} onChange={e => setCost(Number(e.target.value))}/>
</label>
<label>Precio de venta / {weightUnitLabel(unit)}<input type="number" min="0" step="0.0001" value={sale} onChange={e => setSale(Number(e.target.value))}/>
</label>
<label>Moneda<select value={currency} onChange={e => setCurrency(e.target.value as 'LPS' | 'USD')}>
<option value="LPS">LPS — Lempiras</option>
<option value="USD">USD — Dólares</option>
</select>
<small>1 USD = {number(rate, 4)} LPS</small>
</label>
<label className="full">Observaciones<textarea value={notes ?? ''} onChange={e => setNotes(e.target.value)} placeholder="Detalles adicionales…"/>
</label>
</div>{error && <div className="form-error">{error}</div>}</section>
<aside className="panel totals-card">
<h2>Resumen del registro</h2>
<dl>
<div>
<dt>Peso en libras</dt>
<dd>{number(pounds, 4)} lb</dd>
</div>
<div>
<dt>Peso en toneladas</dt>
<dd>{number(tons, 4)} toneladas</dd>
</div>
<div>
<dt>Costo total</dt>
<dd>{money(totalCost, currency)}</dd>
</div>
<div>
<dt>Costo en {otherCurrency}</dt>
<dd>{money(toCurrency(totalCost, currency, otherCurrency, rate), otherCurrency)}</dd>
</div>
<div>
<dt>Venta estimada</dt>
<dd>{money(totalSale, currency)}</dd>
</div>
<div>
<dt>Venta en {otherCurrency}</dt>
<dd>{money(toCurrency(totalSale, currency, otherCurrency, rate), otherCurrency)}</dd>
</div>
<div className="profit">
<dt>Ganancia estimada</dt>
<dd>{money(totalSale - totalCost, currency)}</dd>
</div>
</dl>
<Button size="lg" type="submit" disabled={loading}>{loading ? 'Guardando…' : <>
<Check />{record ? 'Actualizar inventario' : 'Guardar inventario'}</>}</Button>
<Button variant="outline" type="button" onClick={onBack}>Cancelar</Button>
</aside>
</form>
</>;
}
function InventoryForm({ record, onBack, notify }: {
    record?: InventoryRecord;
    onBack: () => void;
    notify: (n: Notice) => void;
}) {
    const { materials, categories, suppliers, settings, createInventory, updateInventory, loading } = useEconexoData();
    const groups=settings?.material_groups??defaultMaterialGroups;
    const [groupId,setGroupId]=useState(materialGroupId(materials.find(m=>m.id===record?.material_id)??materials.find(m=>m.active)??{name:''}));
    const rate = settings?.usd_to_lps_rate ?? 24.75;
    const [materialId, setMaterialId] = useState(record?.material_id ?? materials.find(x => x.active)?.id ?? '');
    const availableCategories = categories.filter(x => x.material_id === materialId && x.active);
    const [categoryId, setCategoryId] = useState(record?.category_id ?? '');
    const [supplierId, setSupplierId] = useState(record?.supplier_id ?? suppliers.find(x => x.active)?.id ?? '');
    const [deliveredBy, setDeliveredBy] = useState(record?.delivered_by ?? '');
    const [qty, setQty] = useState(record?.quantity ?? 0);
    const [unit, setUnit] = useState<'lb' | 'ton'>(record?.unit ?? settings?.default_weight_unit ?? 'lb');
    const [currency, setCurrency] = useState<'LPS' | 'USD'>(record?.currency ?? settings?.default_currency ?? 'LPS');
    const [status, setStatus] = useState<InventoryRecord['status']>(record?.status ?? 'available');
    const [cost, setCost] = useState(record?.cost_price ?? 0);
    const [sale, setSale] = useState(record?.sale_price ?? 0);
    const [date, setDate] = useState(record?.received_at ?? new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState(record?.notes ?? '');
    const [error, setError] = useState('');
    const pounds = unit === 'lb' ? qty : qty * 2000, tons = unit === 'ton' ? qty : qty / 2000;
    const totalCost = qty * cost, totalSale = qty * sale, otherCurrency = currency === 'LPS' ? 'USD' : 'LPS';
    const submit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); const effectiveCategory = categoryId || availableCategories[0]?.id; if (!materialId || !effectiveCategory || !supplierId || !deliveredBy.trim() || qty <= 0) {
        setError('Completa material, categoría, proveedor, persona que entrega y una cantidad válida.');
        return;
    } try {
        const input = { material_id: materialId, category_id: effectiveCategory, supplier_id: supplierId, delivered_by: deliveredBy.trim(), quantity: qty, unit, currency, status, cost_price: cost, sale_price: sale, exchange_rate: rate, received_at: date, notes };
        if (record)
            await updateInventory(record.id, input);
        else
            await createInventory(input);
        notify({ message: record ? 'Inventario actualizado' : 'Inventario guardado' });
        onBack();
    }
    catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible guardar');
    } };
    return <>
    <PageTitle eyebrow={record ? 'ACTUALIZAR EXISTENCIA' : 'NUEVA ENTRADA'} title={record ? 'Editar inventario' : 'Agregar inventario'} subtitle="Registra el peso, origen, estado y precios unitarios del material." action={<Button variant="outline" onClick={onBack}>Volver al inventario</Button>}/>
    <form className="form-layout" onSubmit={submit}>
      <section className="panel form-card">
        <h2>Información del residuo</h2>
        <div className="form-grid">
          <label>Categoría principal<select required value={groupId} onChange={e=>{setGroupId(e.target.value);setMaterialId('');setCategoryId('')}}><option value="">Selecciona</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
          <label>Tipo de residuo<select required value={materialId} onChange={e => { setMaterialId(e.target.value); setCategoryId(''); }}>
<option value="">Selecciona</option>{materials.filter(x => x.active&&(!groupId||materialBelongsToGroup(x, groups.find(g=>g.id===groupId)??{id:groupId,name:groupId}))).map(x => <option value={x.id} key={x.id}>{x.name}</option>)}{groupId&&!materials.some(x=>x.active&&materialBelongsToGroup(x, groups.find(g=>g.id===groupId)??{id:groupId,name:groupId}))&&<option value="" disabled>No hay tipos de residuo registrados</option>}</select>
</label>
          <label>Categoría<select required value={categoryId || availableCategories[0]?.id || ''} onChange={e => setCategoryId(e.target.value)}>
<option value="">Selecciona</option>{availableCategories.map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select>
</label>
          <label>Cantidad<input type="number" min="0.0001" step="0.0001" value={qty || ''} onChange={e => setQty(Number(e.target.value))} required/>
</label>
          <label>Unidad<select value={unit} onChange={e => setUnit(e.target.value as 'lb' | 'ton')}>
<option value="lb">Libras (lb)</option>
<option value="ton">Toneladas</option>
</select>
</label>
        </div>
        <div className="converter">
<div>
<span>Cantidad ingresada</span>
<strong>{number(qty, 4)} {weightUnitLabel(unit)}</strong>
</div>
<span className="equals">=</span>
<div>
<span>Equivalencia</span>
<strong>{unit === 'lb' ? `${number(tons, 4)} toneladas` : `${number(pounds, 4)} lb`}</strong>
</div>
<small>Conversión fija: 1 tonelada = 2,000 libras</small>
</div>
        <h2>Origen y control</h2>
        <div className="form-grid">
          <label>Generador de residuos<select required value={supplierId} onChange={e => setSupplierId(e.target.value)}>
<option value="">Selecciona</option>{suppliers.filter(x => x.active).map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select>
</label>
          <label>Persona que entregó<input required value={deliveredBy} onChange={e => setDeliveredBy(e.target.value)}/>
</label>
          <label>Tipo de proveedor<input readOnly value={providerType(suppliers.find(x => x.id === supplierId)?.type ?? 'collector')}/>
</label>
          <label>Fecha de ingreso<input type="date" required value={date} onChange={e => setDate(e.target.value)}/>
</label>
          <label>Estado del inventario<select value={status} onChange={e => setStatus(e.target.value as InventoryRecord['status'])}>
<option value="available">Disponible</option>
<option value="in_transit">En proceso</option>
<option value="reserved">Reservado</option>
</select>
<small>Disponible: listo para vender · En proceso: material pendiente de clasificación o preparación · Reservado: comprometido con un cliente.</small>
</label>
        </div>
        <h2>Precios unitarios</h2>
        <div className="pricing-help">
<CircleDollarSign />
<div>
<strong>¿Cómo se calculan?</strong>
<p>Ingresa el precio por cada {unit === 'lb' ? 'libra' : 'tonelada'} en {currency}. El sistema multiplica la cantidad original por el precio unitario. Ejemplo: {number(qty)} {weightUnitLabel(unit)} × {money(cost, currency)} = {money(totalCost, currency)}.</p>
</div>
</div>
        <div className="form-grid">
          <label>Precio de costo por {weightUnitLabel(unit)}<input type="number" min="0" step="0.0001" value={cost} onChange={e => setCost(Number(e.target.value))}/>
<small>Lo que pagas por cada {weightUnitLabel(unit)}.</small>
</label>
          <label>Precio de venta por {weightUnitLabel(unit)}<input type="number" min="0" step="0.0001" value={sale} onChange={e => setSale(Number(e.target.value))}/>
<small>Lo que esperas cobrar por cada {weightUnitLabel(unit)}.</small>
</label>
          <label>Moneda<select value={currency} onChange={e => setCurrency(e.target.value as 'LPS' | 'USD')}>
<option value="LPS">LPS — Lempiras</option>
<option value="USD">USD — Dólares</option>
</select>
<small>Conversión: 1 USD = {number(rate, 4)} LPS.</small>
</label>
          <label className="full">Observaciones<textarea value={notes ?? ''} onChange={e => setNotes(e.target.value)} placeholder="Detalles adicionales…"/>
</label>
        </div>{error && <div className="form-error">{error}</div>}
      </section>
      <aside className="panel totals-card">
<h2>Resumen del registro</h2>
<StatusBadge>{stockStatus(status)}</StatusBadge>
<dl>
<div>
<dt>Peso en libras</dt>
<dd>{number(pounds, 4)} lb</dd>
</div>
<div>
<dt>Peso en toneladas</dt>
<dd>{number(tons, 4)} toneladas</dd>
</div>
<div>
<dt>Costo total</dt>
<dd>{money(totalCost, currency)}</dd>
</div>
<div>
<dt>Costo en {otherCurrency}</dt>
<dd>{money(toCurrency(totalCost, currency, otherCurrency, rate), otherCurrency)}</dd>
</div>
<div>
<dt>Venta estimada</dt>
<dd>{money(totalSale, currency)}</dd>
</div>
<div>
<dt>Venta en {otherCurrency}</dt>
<dd>{money(toCurrency(totalSale, currency, otherCurrency, rate), otherCurrency)}</dd>
</div>
<div className="profit">
<dt>Ganancia estimada</dt>
<dd>{money(totalSale - totalCost, currency)}</dd>
</div>
</dl>
<Button size="lg" type="submit" disabled={loading}>{loading ? 'Guardando…' : <>
<Check />{record ? 'Actualizar inventario' : 'Guardar inventario'}</>}</Button>
<Button variant="outline" type="button" onClick={onBack}>Cancelar</Button>
</aside>
    </form>
  </>;
}
function SupplierForm({ supplier, type, onClose, notify }: {
    supplier?: SupplierRecord;
    type: string;
    onClose: () => void;
    notify: (n: Notice) => void;
}) {
    const { saveSupplier, loading, settings } = useEconexoData();
    const supplierCategories=settings?.supplier_categories??defaultSupplierCategories;
    const [categoryId,setCategoryId]=useState(supplier?.category_id??supplier?.type??type);
    const [name, setName] = useState(supplier?.name ?? '');
    const [phone, setPhone] = useState(supplier?.phone ?? '');
    const [idNumber, setIdNumber] = useState(supplier?.identity_number ?? '');
    const [rtn, setRtn] = useState(supplier?.rtn ?? '');
    const [contact, setContact] = useState(supplier?.contact_name ?? '');
    const [address, setAddress] = useState(supplier?.address ?? '');
    const [error, setError] = useState('');
    const submit = async (e: React.FormEvent) => { e.preventDefault(); if (name.trim().length < 2 || phone.trim().length < 8) {
        setError('Ingresa un nombre y un teléfono de al menos 8 caracteres.');
        return;
    } try {
        await saveSupplier({ name: name.trim(), phone: phone.trim(), type: categoryId==='company'?'company':'collector', category_id:categoryId, identity_number: idNumber || null, rtn: rtn || null, contact_name: contact || null, address: address || null, active: supplier?.active ?? true }, supplier?.id);
        notify({ message: supplier ? 'Proveedor actualizado' : 'Proveedor agregado' });
        onClose();
    }
    catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible guardar');
    } };
    return <Modal title={supplier ? 'Editar proveedor' : 'Agregar proveedor'} onClose={onClose}>
<form onSubmit={submit}>
<div className="form-grid">
<label>Categoría de proveedor<select value={categoryId} onChange={e=>setCategoryId(e.target.value)}>{supplierCategories.filter(c=>c.active||c.id===categoryId).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
<label>ID del proveedor<input readOnly value={supplier ? supplierDisplayId(supplier) : 'Se asignará automáticamente'}/>
</label>
<label>{categoryId === 'company' ? 'Nombre de la empresa' : 'Nombre completo'}<input autoFocus required value={name} onChange={e => setName(e.target.value)}/>
</label>
<label>Teléfono<input required minLength={8} value={phone} onChange={e => setPhone(e.target.value)}/>
</label>{categoryId === 'company' ? <label>RTN (opcional)<input value={rtn} onChange={e => setRtn(e.target.value)}/>
</label> : <label>Identidad (opcional)<input value={idNumber} onChange={e => setIdNumber(e.target.value)}/>
</label>}<label>Contacto<input value={contact} onChange={e => setContact(e.target.value)}/>
</label>
<label className="full">Dirección<input value={address} onChange={e => setAddress(e.target.value)}/>
</label>
</div>{error && <div className="form-error">{error}</div>}<div className="modal-actions">
<Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
<Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar proveedor'}</Button>
</div>
</form>
</Modal>;
}
function Supply({ notify }: {
    notify: (n: Notice) => void;
}) {
    const { suppliers, inventory, supplierHistory,settings } = useEconexoData();
    const supplierCategories=settings?.supplier_categories??defaultSupplierCategories;
    const [tab, setTab] = useState<string>('collector');
    const [editing, setEditing] = useState<SupplierRecord | null | undefined>();
    const [historyOwner, setHistoryOwner] = useState<SupplierRecord | null>(null);
    const [history, setHistory] = useState<Record<string, unknown>[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const filtered = suppliers.filter(x => supplierCategoryId(x) === tab);
    const openHistory = async (s: SupplierRecord) => { setHistoryOwner(s); setHistoryLoading(true); try {
        setHistory(await supplierHistory(s.id));
    }
    catch (e) {
        notify({ message: e instanceof Error ? e.message : 'No se pudo cargar el historial', tone: 'error' });
    }
    finally {
        setHistoryLoading(false);
    } };
    return <>
<PageTitle eyebrow="REGISTRO DE GENERADORES DE RESIDUOS" title="Generadores de residuos" subtitle="Registra los generadores de residuos que suministran a la empresa." action={<Button size="lg" onClick={() => setEditing(null)}>
<Plus />Agregar proveedor</Button>}/>
<div className="tabs">
{supplierCategories.filter(c=>c.active||suppliers.some(p=>supplierCategoryId(p)===c.id)).map(c=><button key={c.id} className={tab===c.id?'active':''} onClick={()=>setTab(c.id)}>{c.name}<span>{suppliers.filter(p=>supplierCategoryId(p)===c.id).length}</span></button>)}
</div>
<div className="provider-grid">{filtered.map(p => { const entries = inventory.filter(x => x.supplier_id === p.id); return <article className="panel provider-card" key={p.id}>
<div className="provider-head">
<span className={p.type === 'company' ? 'company-icon' : 'person-icon'}>{p.type === 'company' ? <Building2 /> : <Users />}</span>
<div>
<h3>{p.name}</h3>
<StatusBadge>{p.active ? 'Activo' : 'Inactivo'}</StatusBadge>
</div>
<button title="Editar" onClick={() => setEditing(p)}>
<Edit3 />
</button>
</div>
<dl>
<div>
<dt>ID</dt>
<dd>{supplierDisplayId(p)}</dd>
</div>
<div>
<dt>Tipo</dt>
<dd>{supplierCategories.find(c=>c.id===supplierCategoryId(p))?.name??providerType(p.type)}</dd>
</div>
<div>
<dt>Teléfono</dt>
<dd>{p.phone}</dd>
</div>
<div>
<dt>Entregas</dt>
<dd>{entries.length}</dd>
</div>
<div>
<dt>Peso recibido</dt>
<dd>{number(entries.reduce((s, x) => s + asNumber(x.pounds), 0))} lb</dd>
</div>
<div>
<dt>Total comprado</dt>
<dd>{money(entries.reduce((s, x) => s + asNumber(x.cost_total), 0), entries[0]?.currency ?? 'LPS')}</dd>
</div>
</dl>
<div className="card-actions">
<Button variant="outline" onClick={() => void openHistory(p)}>
<Eye />Ver historial</Button>
<Button variant="ghost" onClick={() => setEditing(p)}>Editar</Button>
</div>
</article>; })}</div>{!filtered.length && <section className="panel">
<EmptyState message={`No hay proveedores registrados en esta categoría.`}/>
</section>}<section className="panel recent-moves">
<div className="section-title">
<div>
<Truck />
<div>
<h2>Movimientos recientes</h2>
<p>Últimos ingresos de proveedores</p>
</div>
</div>
</div>{inventory.slice(0, 6).map(r => <div className="timeline-row" key={r.id}>
<span className="timeline-icon">
<PackageCheck />
</span>
<div>
<strong>{r.supplier}</strong>
<small>{providerType(r.supplier_type)}</small>
</div>
<p>Ingreso de {number(r.quantity)} {weightUnitLabel(r.unit)} de {r.material}</p>
<time>{formatDate(r.received_at)}</time>
</div>)}</section>{editing !== undefined && <SupplierForm supplier={editing ?? undefined} type={editing? supplierCategoryId(editing):tab} onClose={() => setEditing(undefined)} notify={notify}/>} {historyOwner && <Modal title={`Historial de ${historyOwner.name}`} subtitle="Materiales entregados y total comprado" onClose={() => setHistoryOwner(null)}>{historyLoading ? <div className="loading-state">
<RefreshCw />Cargando historial…</div> : history.length ? <div className="history-list">{history.map((row, i) => <div key={String(row.inventory_entry_id ?? i)}>
<span className="timeline-icon">
<Boxes />
</span>
<p>
<strong>{String(row.material)} · {String(row.category)}</strong>
<small>{formatDate(String(row.received_at))} · {number(asNumber(row.quantity))} {weightUnitLabel(String(row.unit))}</small>
</p>
<b>{money(asNumber(row.cost_total), (row.currency as 'LPS' | 'USD') ?? 'LPS')}</b>
</div>)}</div> : <EmptyState message="Este proveedor todavía no tiene entregas."/>}</Modal>}</>;
}
function ClientForm({ client, onClose, notify }: {
    client?: ClientRecord;
    onClose: () => void;
    notify: (n: Notice) => void;
}) {
    const { materials, categories, settings, saveClient, loading } = useEconexoData();
    const [codeGroup,setCodeGroup]=useState(client?.code_group_id??'*');
    const [documentType, setDocumentType] = useState<'invoice'|'other'>(client?.document_type??'invoice');
    const [name, setName] = useState(client?.name ?? '');
    const [type, setType] = useState<'person' | 'company'>(client?.type ?? 'person');
    const [phone, setPhone] = useState(client?.phone ?? '');
    const [address, setAddress] = useState(client?.address ?? '');
    const [tax, setTax] = useState(client?.tax_or_identity ?? '');
    const [notes, setNotes] = useState(client?.notes ?? '');
    const [materialIds, setMaterialIds] = useState<string[]>(client?.material_ids ?? []);
    const [categoryIds, setCategoryIds] = useState<string[]>(client?.category_ids ?? []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const toggle = (list: string[], id: string, setter: (v: string[]) => void) => setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
    const activeMaterials = [...new Map(materials.filter(m => m.active).map(m => [m.name.toLocaleLowerCase('es'), m])).values()];
    const categoryOptions = [...new Map(categories.filter(c => c.active && materialIds.includes(c.material_id)).reduce((map, c) => { const key = c.name.trim().toLocaleLowerCase('es'); const current = map.get(key); map.set(key, { name: c.name, ids: [...(current?.ids ?? []), c.id] }); return map; }, new Map<string, { name: string; ids: string[] }>())).values()];
    const toggleCategoryGroup = (ids: string[]) => setCategoryIds(categoryIds.some(id => ids.includes(id)) ? categoryIds.filter(id => !ids.includes(id)) : [...new Set([...categoryIds, ...ids])]);
    const submit = async (e: React.FormEvent) => { e.preventDefault(); const next: Record<string, string> = {}; if (name.trim().length < 2)
        next.name = 'El nombre debe tener al menos 2 caracteres.'; if (phone.trim().length < 8)
        next.phone = 'El teléfono debe tener al menos 8 caracteres.'; if (address.trim().length < 4)
        next.address = 'La dirección debe tener al menos 4 caracteres.'; if (!materialIds.length)
        next.materials = 'Selecciona al menos un material.'; if (!categoryIds.length)
        next.categories = 'Selecciona al menos una categoría.'; setErrors(next); if (Object.keys(next).length)
        return; try {
        await saveClient({ code_group_id:codeGroup, document_type:documentType, name: name.trim(), type, phone: phone.trim(), address: address.trim(), tax_or_identity: tax || null, notes: notes || null, active: client?.active ?? true }, materialIds, categoryIds, client?.id);
        notify({ message: client ? 'Cliente actualizado' : 'Cliente agregado' });
        onClose();
    }
    catch (err) {
        setErrors({ form: err instanceof Error ? err.message : 'No fue posible guardar' });
    } };
    return <Modal title={client ? 'Editar cliente' : 'Agregar cliente'} onClose={onClose}>
<form onSubmit={submit} noValidate>
<div className="form-grid">
<label>Categoría para código<select value={codeGroup} onChange={e=>setCodeGroup(e.target.value)}><option value="*">General</option>{(settings?.material_groups??defaultMaterialGroups).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><small>{client?'Se conserva el código existente: '+clientDisplayId(client):'El código se asigna automáticamente al guardar.'}</small></label>
<label>Tipo de documento<select value={documentType} onChange={e=>setDocumentType(e.target.value as 'invoice'|'other')}><option value="invoice">Facturas</option><option value="other">Otros</option></select></label>
<label>Nombre<input autoFocus value={name} onChange={e => setName(e.target.value)}/>
<FieldError>{errors.name}</FieldError>
</label>
<label>Tipo<select value={type} onChange={e => setType(e.target.value as 'person' | 'company')}>
<option value="person">Persona</option>
<option value="company">Empresa</option>
</select>
</label>
<label>Teléfono<input value={phone} onChange={e => setPhone(e.target.value)}/>
<FieldError>{errors.phone}</FieldError>
</label>
<label>RTN / Identificación (opcional)<input value={tax} onChange={e => setTax(e.target.value)}/>
</label>
<label className="full">Dirección<input value={address} onChange={e => setAddress(e.target.value)}/>
<FieldError>{errors.address}</FieldError>
</label>
<fieldset className="choice-group">
<legend>Materiales que compra</legend>{activeMaterials.map(m => <label key={m.id}>
<input type="checkbox" checked={materialIds.includes(m.id)} onChange={() => { const next = materialIds.includes(m.id) ? materialIds.filter(x => x !== m.id) : [...materialIds, m.id]; setMaterialIds(next); setCategoryIds(categoryIds.filter(id => categories.some(c => c.id === id && next.includes(c.material_id)))); }}/>{m.name}</label>)}{!activeMaterials.length&&<small>No hay materiales activos configurados.</small>}<FieldError>{errors.materials}</FieldError>
</fieldset>
<fieldset className="choice-group">
<legend>Categorías</legend>{categoryOptions.map(c => <label key={c.name}>
<input type="checkbox" checked={c.ids.some(id => categoryIds.includes(id))} onChange={() => toggleCategoryGroup(c.ids)}/>{c.name}</label>)}{materialIds.length>0&&!categoryOptions.length&&<small>No hay categorías activas para los materiales seleccionados.</small>}<FieldError>{errors.categories}</FieldError>
</fieldset>
<label className="full">Observaciones<textarea value={notes} onChange={e => setNotes(e.target.value)}/>
</label>
</div>{errors.form && <div className="form-error">{errors.form}</div>}<div className="modal-actions">
<Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
<Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar cliente'}</Button>
</div>
</form>
</Modal>;
}
function Clients({ notify }: {
    notify: (n: Notice) => void;
}) {
    const { configured, clients, materials, categories, clientHistory } = useEconexoData();
    const { invoices } = useBilling();
    const [query, setQuery] = useState('');
    const [editing, setEditing] = useState<ClientRecord | null | undefined>();
    const [historyOwner, setHistoryOwner] = useState<ClientRecord | null>(null);
    const [history, setHistory] = useState<Record<string, unknown>[]>([]);
    const rows = clients.filter(x => x.name.toLowerCase().includes(query.toLowerCase()));
    const openHistory = async (c: ClientRecord) => { setHistoryOwner(c); setHistory([]); try {
        const base = await clientHistory(c.id);
        const billed = configured ? [] : invoices.filter(invoice => invoice.client_id === c.id && invoice.status !== 'void').flatMap(invoice => invoice.lines.map(line => ({ sale_id: invoice.id, sold_at: invoice.issued_at, material: line.material, category: line.category, quantity: line.quantity, unit: line.unit, total: line.total, currency: invoice.currency })));
        setHistory([...billed, ...base]);
    }
    catch (e) {
        notify({ message: e instanceof Error ? e.message : 'No se pudo cargar el historial', tone: 'error' });
    } };
    const labels = (c: ClientRecord) => [...(c.material_ids ?? []).map(id => materials.find(x => x.id === id)?.name), ...(c.category_ids ?? []).map(id => categories.find(x => x.id === id)?.name)].filter(Boolean).join(' · ') || 'Sin categorías';
    return <>
<PageTitle eyebrow="REGISTRO DE CLIENTES" title="Clientes" subtitle="Registra a las personas y empresas que compran residuos." action={<Button size="lg" onClick={() => setEditing(null)}>
<Plus />Agregar cliente</Button>}/>
<section className="panel">
<div className="toolbar">
<label className="search">
<Search />
<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cliente…"/>
</label>
</div>{rows.length ? <div className="client-grid">{rows.map(c => <article className="client-card" key={c.id}>
<div className="client-top">
<span className="large-avatar">{initials(c.name)}</span>
<div>
<h3>{c.name}</h3>
<span>{clientType(c.type)} · {clientDisplayId(c)}</span>
</div>
<button title="Editar" onClick={() => setEditing(c)}>
<Edit3 />
</button>
</div>
<div className="client-meta">
<span>Teléfono<strong>{c.phone}</strong>
</span>
<span>Dirección<strong>{c.address}</strong>
</span>
<span>Tipo de documento<strong>{c.document_type==='other'?'Otros':'Facturas'}</strong></span>
<span>Materiales y categorías<strong>{labels(c)}</strong>
</span>
</div>
<div className="client-foot">
<StatusBadge>{c.active ? 'Activo' : 'Inactivo'}</StatusBadge>
<Button variant="outline" size="sm" onClick={() => void openHistory(c)}>
<Eye />Ver historial</Button>
</div>
</article>)}</div> : <EmptyState message="No hay clientes que coincidan."/>}</section>{editing !== undefined && <ClientForm client={editing ?? undefined} onClose={() => setEditing(undefined)} notify={notify}/>} {historyOwner && <Modal title={`Historial de ${historyOwner.name}`} subtitle="Compras realizadas por este cliente" onClose={() => setHistoryOwner(null)}>{history.length ? <div className="history-list">{history.map((row, i) => <div key={String(row.sale_id ?? i)}>
<span className="timeline-icon">
<ShoppingCart />
</span>
<p>
<strong>{String(row.material)} · {String(row.category)}</strong>
<small>{formatDate(String(row.sold_at))} · {number(asNumber(row.quantity))} {weightUnitLabel(String(row.unit))}</small>
</p>
<b>{money(asNumber(row.total), (row.currency as 'LPS' | 'USD') ?? 'LPS')}</b>
</div>)}</div> : <EmptyState message="Este cliente todavía no tiene compras registradas."/>}</Modal>}</>;
}
function CatalogEditor({ kind, item, onClose, notify }: {
    kind: 'material' | 'category';
    item?: MaterialRecord | CategoryRecord;
    onClose: () => void;
    notify: (n: Notice) => void;
}) {
    const { materials, saveMaterial, saveCategory, loading } = useEconexoData();
    const [name, setName] = useState(item?.name ?? '');
    const [materialId, setMaterialId] = useState('material_id' in (item ?? {}) ? (item as CategoryRecord).material_id : materials[0]?.id ?? '');
    const [error, setError] = useState('');
    const submit = async (e: React.FormEvent) => { e.preventDefault(); if (name.trim().length < 2) {
        setError('El nombre debe tener al menos 2 caracteres.');
        return;
    } try {
        if (kind === 'material')
            await saveMaterial(name.trim(), item?.id);
        else
            await saveCategory(materialId, name.trim(), item?.id);
        notify({ message: `${kind === 'material' ? 'Material' : 'Categoría'} guardado` });
        onClose();
    }
    catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible guardar');
    } };
    return <Modal title={`${item ? 'Editar' : 'Agregar'} ${kind === 'material' ? 'material' : 'categoría'}`} onClose={onClose}>
<form onSubmit={submit}>
<div className="form-grid">{kind === 'category' && <label>Material<select value={materialId} onChange={e => setMaterialId(e.target.value)}>{materials.map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select>
</label>}<label>Nombre<input autoFocus value={name} onChange={e => setName(e.target.value)}/>
</label>
</div>{error && <div className="form-error">{error}</div>}<div className="modal-actions">
<Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
<Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</Button>
</div>
</form>
</Modal>;
}
function PasswordModal({ onClose, notify }: { onClose: () => void; notify: (n: Notice) => void }) {
    const { changePassword, loading } = useEconexoData();
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (password.length < 12) { setError('La contraseña debe tener al menos 12 caracteres.'); return; }
        if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
        try { await changePassword(password); notify({ message: 'Contraseña actualizada correctamente' }); onClose(); }
        catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la contraseña.'); }
    };
    return <Modal title="Cambiar contraseña" subtitle="Puedes actualizarla desde tu cuenta sin usar correo electrónico." onClose={onClose}>
<form onSubmit={submit}>
<div className="form-grid"><label className="full">Nueva contraseña<input autoFocus required type="password" minLength={12} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Mínimo 12 caracteres" /></label><label className="full">Confirmar contraseña<input required type="password" minLength={12} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label></div>
{error && <div className="form-error">{error}</div>}
<div className="modal-actions"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={loading}>{loading ? 'Actualizando…' : 'Actualizar contraseña'}</Button></div>
</form>
</Modal>;
}
function SettingsView({ notify }: {
    notify: (n: Notice) => void;
}) {
    const { settings, materials, categories, profiles, saveSettings, uploadCompanyLogo, toggleMaterial, toggleCategory, saveProfile, loading } = useEconexoData();
    const [tab, setTab] = useState('Empresa');
    const [name, setName] = useState(settings?.name ?? 'Gavrion EcoSystems');
    const [logo, setLogo] = useState(settings?.logo_url ?? '');
    const [currency, setCurrency] = useState<'LPS' | 'USD'>(settings?.default_currency ?? 'LPS');
    const [rate, setRate] = useState(settings?.usd_to_lps_rate ?? 24.75);
    const [unit, setUnit] = useState<'lb' | 'ton'>(settings?.default_weight_unit ?? 'lb');
    const [fiscalAddress, setFiscalAddress] = useState(settings?.fiscal_address ?? '');
    const [fiscalPhone, setFiscalPhone] = useState(settings?.fiscal_phone ?? '');
    const [logoError, setLogoError] = useState('');
    const [catalog, setCatalog] = useState<{
        kind: 'material' | 'category';
        item?: MaterialRecord | CategoryRecord;
    } | null>(null);
    const [error, setError] = useState('');
    const resetPassword = async (profile: ProfileRecord) => {
      const temporary = window.prompt(`Nueva contraseña temporal para ${profile.username || profile.full_name} (mínimo 12 caracteres):`);
      if (temporary === null) return;
      if (temporary.length < 12) { notify({ message: 'La contraseña debe tener al menos 12 caracteres.', tone: 'error' }); return; }
      try { await saveProfile(profile.id, { password: temporary }); notify({ message: 'Contraseña temporal actualizada' }); }
      catch (reason) { notify({ message: reason instanceof Error ? reason.message : 'No se pudo actualizar la contraseña.', tone: 'error' }); }
    };
    const saveCompany = async () => {
      if(name.trim().length<2 || !Number.isFinite(rate) || rate<=0 || fiscalAddress.trim().length<4 || fiscalPhone.replace(/\D/g,'').length<8){setError('Ingresa nombre, dirección, teléfono válido y una tasa mayor que cero.');return;}
      try{await saveSettings({name:name.trim(),logo_url:logo||null,default_currency:currency,usd_to_lps_rate:rate,default_weight_unit:unit,fiscal_address:fiscalAddress.trim(),fiscal_phone:fiscalPhone.trim()});setError('');notify({message:'Identidad de la empresa guardada'});}catch(e){setError(e instanceof Error?e.message:'No fue posible guardar');}
    };
    const handleLogoFile = async (file?: File) => {
      if(!file) return;
      if(!file.type.startsWith('image/')){setLogoError('Selecciona un archivo de imagen válido.');return;}
      if(file.size>2*1024*1024){setLogoError('La imagen no puede superar 2 MB.');return;}
      setLogoError('');
      try { setLogo(await uploadCompanyLogo(file)); }
      catch (reason) { setLogoError(reason instanceof Error ? reason.message : 'No se pudo subir la imagen.'); }
    };
    return <>
<PageTitle eyebrow="ADMINISTRACIÓN" title="Configuración" subtitle="Cambios persistentes para empresa, usuarios y catálogo."/>
<div className="settings-layout">
<aside className="settings-nav">{['Empresa', 'Usuarios', 'Agregar usuarios', 'Categorías de proveedores', 'Materiales y categorías', 'Códigos'].map(t => <button aria-label={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)} key={t}>{t === 'Empresa' ? <Building2 /> : t === 'Usuarios' ? <UserCog /> : <Boxes />}<span>{t}</span>
</button>)}</aside>
<section className="panel settings-content">{tab === 'Agregar usuarios' && <AddUser/>}{tab === 'Categorías de proveedores' && <SupplierCategories/>}{tab === 'Empresa' && <>
<div className="settings-head">
<h2>Identidad de la empresa</h2>
<p>Estos datos se muestran en boletas, certificados y reportes. La marca de la plataforma permanece como Gavrion EcoSystems.</p>
</div>
<div className="logo-editor">{logo ? <img className="company-logo-preview" src={logo} alt="Logo de la empresa"/> : <span className="brand-mark">{name[0]?.toUpperCase() || 'E'}</span>}<div>
<strong>Logo de la empresa</strong>
<small>Sube una imagen desde tu computadora o usa una URL pública.</small>
<label className="logo-upload">Seleccionar imagen<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>void handleLogoFile(e.target.files?.[0])}/></label>
</div>
</div>
<div className="form-grid">
<label>Dirección de la empresa<input value={fiscalAddress} onChange={e=>setFiscalAddress(e.target.value)}/></label>
<label>Teléfono de la empresa<input type="tel" value={fiscalPhone} onChange={e=>setFiscalPhone(e.target.value)}/></label>
<label>Nombre de la empresa para documentos<input value={name} onChange={e => setName(e.target.value)}/>
</label>
<label>URL del logo<input type="url" value={logo.startsWith('data:') ? '' : logo} onChange={e => {setLogo(e.target.value);setLogoError('')}} placeholder="https://…"/>
</label>
<label>Moneda predeterminada<select value={currency} onChange={e => setCurrency(e.target.value as 'LPS' | 'USD')}>
<option>LPS</option>
<option>USD</option>
</select>
</label>
<label>Tasa LPS / USD<input type="number" min="0.0001" step="0.0001" value={rate} onChange={e => setRate(Number(e.target.value))}/>
<small>1 USD = {number(rate, 4)} LPS</small>
</label>
<label>Unidad predeterminada<select value={unit} onChange={e => setUnit(e.target.value as 'lb' | 'ton')}>
<option value="lb">Libras (lb)</option>
<option value="ton">Toneladas</option>
</select>
</label>
</div>
{(error||logoError) && <div className="form-error">{error||logoError}</div>}<div className="settings-save">
<Button disabled={loading} onClick={() => void saveCompany()}>
<Check />{loading ? 'Guardando…' : 'Guardar cambios'}</Button>
</div>
</>}{tab === 'Usuarios' && <>
<div className="settings-head">
<h2>Usuarios y permisos</h2>
<p>Activa usuarios y cambia su rol. Crea nuevos perfiles desde Agregar usuarios.</p>
</div>
<div className="user-list">{profiles.map(p => <div key={p.id}>
<span className="large-avatar">{initials(p.full_name)}</span>
<p>
<strong>{p.full_name}</strong>
<small>Usuario: {p.username || p.id.slice(0, 8) + '…'}</small>
</p>
<select className="inline-select" value={p.role} onChange={async (e) => { try {
        await saveProfile(p.id, { role: e.target.value as 'admin' | 'employee' });
        notify({ message: 'Rol actualizado' });
    }
    catch (err) {
        notify({ message: err instanceof Error ? err.message : 'No se pudo actualizar', tone: 'error' });
    } }}>
<option value="admin">Administrador</option>
<option value="employee">Empleado</option>
</select>
<label className="toggle">
<input type="checkbox" checked={p.active} onChange={async (e) => { try {
        await saveProfile(p.id, { active: e.target.checked });
        notify({ message: 'Estado actualizado' });
    }
    catch (err) {
        notify({ message: err instanceof Error ? err.message : 'No se pudo actualizar', tone: 'error' });
    } }}/>
<i />
</label><button type="button" className="icon-button" aria-label={`Restablecer contraseña de ${p.full_name}`} onClick={() => void resetPassword(p)}><Lock /></button>
</div>)}</div>
<div className="permission-card">
<h3>Permisos por rol</h3>
<div>
<strong>Dueño / Administrador</strong>
<p>Dashboard, finanzas, reportes, usuarios y configuración.</p>
</div>
<div>
<strong>Empleado</strong>
<p>Inventarios, generadores de residuos y clientes; sin información financiera global.</p>
</div>
</div>
</>}{tab === 'Códigos' && <CodeSettings/>}{tab === 'Materiales y categorías' && <MaterialCatalog notify={(message,tone)=>notify({message,tone})}/>}</section>
</div>{catalog && <CatalogEditor kind={catalog.kind} item={catalog.item?.id ? catalog.item : undefined} onClose={() => setCatalog(null)} notify={notify}/>}</>;
}
function EconexoApp() {
    const { user, profiles, settings, error, loading, refresh, signOut, platformOrganizations } = useEconexoData();
    const profile = profiles.find(x => x.id === user?.id);
    const isAdmin = profile?.role === 'admin';
    const isPlatformAdmin = platformOrganizations.length > 0;
    const [view, setView] = useState<View>(isAdmin ? 'dashboard' : 'inventarios');
    const [editingInventory, setEditingInventory] = useState<InventoryRecord | undefined>();
    const [drawer, setDrawer] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [securityOpen, setSecurityOpen] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const title = useMemo(() => navItems.find(n => n.id === view)?.label ?? 'Inventario', [view]);
    const company = PLATFORM_NAME;
    const notify = (next: Notice) => { setNotice(next); window.setTimeout(() => setNotice(null), 3000); };
    const go = (id: View) => { if (!isAdmin && ['dashboard', 'facturacion', 'certificados', 'reportes', 'configuracion', 'plataforma'].includes(id))
        return; if (id === 'plataforma' && !isPlatformAdmin)
        return; setView(id); setDrawer(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const editInventory = (record?: InventoryRecord) => { setEditingInventory(record); go('inventario-form'); };
    const nav = <>
<div className="brand platform-brand"><div className="platform-logo-frame"><img className="platform-logo" src={PLATFORM_LOGO} alt={company}/></div><strong className="platform-brand-name">{company}</strong><small>Sistema empresarial</small>
</div>
<nav>{navItems.filter(n => (isAdmin || !n.admin) && (!('platformOnly' in n) || !n.platformOnly || isPlatformAdmin)).map(({ id, label, icon: Icon }) => <button className={(view === id || (view === 'inventario-form' && id === 'inventarios')) ? 'nav-item active' : 'nav-item'} key={id} onClick={() => go(id)}>
<Icon />
<span>{label}</span>
</button>)}</nav>
<div className="sidebar-foot">
<PackageCheck />
<span>
<strong>Operación segura</strong>
<small>{loading ? 'Cargando información…' : 'Sistema listo'}</small>
</span>
</div>
</>;
    return <main className="app-shell">
<aside className="sidebar">{nav}</aside>
<MobileDrawer open={drawer} onClose={() => setDrawer(false)}>{nav}</MobileDrawer>
<section className="workspace">
<header className="topbar">
<Button variant="ghost" size="icon" className="mobile-menu" aria-label="Abrir menú" onClick={() => setDrawer(true)}>
<Menu />
</Button>
<div className="mobile-brand">
<div className="platform-logo-mobile-frame"><img className="platform-logo-mobile" src={PLATFORM_LOGO} alt={company}/></div>
</div>
<span className="breadcrumb">Sistema / <strong>{title}</strong>
</span>
<div className="topbar-spacer"/>
<RefreshButton refresh={refresh}/>
<NotificationBell count={0}/>
<div className="profile-wrap">
<button className="profile" onClick={() => setProfileOpen(!profileOpen)}>
<span className="avatar">{initials(profile?.full_name ?? user?.email ?? 'Usuario')}</span>
<div>
<strong>{profile?.full_name ?? user?.email}</strong>
<small>{isAdmin ? 'Administrador' : 'Empleado'}</small>
</div>
<ChevronDown />
</button>{profileOpen && <div className="profile-menu">
<p>CUENTA</p>
<button disabled>
<UserCog />{isAdmin ? 'Administrador' : 'Empleado'}</button>
<button onClick={() => { setSecurityOpen(true); setProfileOpen(false); }}><Lock />Cambiar contraseña</button>
<hr />
<button onClick={() => void signOut()}>Cerrar sesión</button>
</div>}</div>
</header>
<div key={view} className="content page-enter">{error && <div className="data-error">
<strong>Error de sincronización</strong>
<span>{error}</span>
<button onClick={() => void refresh()}>Reintentar</button>
</div>}{view === 'dashboard' && isAdmin && <BusinessDashboard />}{view === 'inventarios' && <Inventory onEdit={editInventory} notify={notify}/>} {view === 'facturacion' && isAdmin && <WeightTickets notify={(message, tone) => notify({ message, tone })}/>} {view === 'inventario-form' && <InventoryForm record={editingInventory} onBack={() => go('inventarios')} notify={notify}/>} {view === 'abastecimiento' && <Supply notify={notify}/>} {view === 'clientes' && <Clients notify={notify}/>} {view === 'certificados' && isAdmin && <Certificates/>} {view === 'reportes' && isAdmin && <FinancialReports notify={(message,tone)=>notify({message,tone})}/>} {view === 'configuracion' && isAdmin && <SettingsView notify={notify}/>} {view === 'plataforma' && isPlatformAdmin && <PlatformAdminPanel/>}</div>
</section>{securityOpen && <PasswordModal onClose={() => setSecurityOpen(false)} notify={notify}/>}<footer className="site-footer">Derechos reservados · Gavrion EcoSystems</footer>{notice && <div className={`toast ${notice.tone === 'error' ? 'toast-error' : ''}`}>
<span>{notice.tone === 'error' ? <X /> : <Check />}</span>{notice.message}</div>}{settings?.onboarding_completed === false && <OnboardingWizard onComplete={() => void refresh()} />}</main>;
}
export default function Home() { return <EconexoDataProvider>
<BillingProvider>
<AccessGate>
<EconexoApp />
</AccessGate>
</BillingProvider>
</EconexoDataProvider>; }

