'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  FileCheck2,
  Handshake,
  LayoutDashboard,
  Activity,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Settings2,
  Truck,
  UsersRound,
} from 'lucide-react';

type PublicLandingProps = {
  logo: string;
  onLogin: () => void;
  onRequestAccess: () => void;
};

const features = [
  {
    icon: Boxes,
    title: 'Inventario siempre actualizado',
    text: 'Controla existencias, costos, monedas, movimientos y valorización en tiempo real.',
  },
  {
    icon: UsersRound,
    title: 'Control de clientes',
    text: 'Centraliza contactos, documentos, materiales asociados y el historial de cada cliente.',
  },
  {
    icon: Handshake,
    title: 'Gestión de proveedores',
    text: 'Organiza recolectores y empresas proveedoras con sus datos, categorías y movimientos.',
  },
  {
    icon: Truck,
    title: 'Operaciones conectadas',
    text: 'Registra compras, boletas, ventas y mermas desde un flujo claro y sin duplicar trabajo.',
  },
  {
    icon: BarChart3,
    title: 'Decisiones con datos',
    text: 'Convierte tu operación diaria en indicadores, reportes y tendencias fáciles de entender.',
  },
  {
    icon: FileCheck2,
    title: 'Documentos y trazabilidad',
    text: 'Genera boletas, certificados e informes y conserva el historial de cada operación.',
  },
];

const workflowSteps = [
  { icon: Send, title: 'Solicita tu acceso', text: 'Cuéntanos quién eres y qué empresa quieres configurar.' },
  { icon: Settings2, title: 'Configuramos tu espacio', text: 'Define usuarios, materiales, moneda y datos de la empresa.' },
  { icon: Activity, title: 'Opera con información real', text: 'Registra movimientos y consulta indicadores en un solo sistema.' },
];

function AnimatedNumber({ value, decimals = 0, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (reduced) { setDisplay(value); return; }
      const duration = 520;
      const started = performance.now();
      const animate = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(value * eased);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, { threshold: .6 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);
  const formatted = display.toLocaleString('es-HN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <b ref={ref} aria-label={`${prefix}${value.toLocaleString('es-HN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`}>{prefix}{formatted}{suffix}</b>;
}

export function PublicLanding({ logo, onLogin, onRequestAccess }: PublicLandingProps) {
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add('landing-motion-ready');
    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { elements.forEach(element => element.classList.add('is-visible')); return; }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .04, rootMargin: '0px 0px -20px' });
    elements.forEach(element => observer.observe(element));
    const revealReachedElements = () => elements.forEach(element => {
      if (element.classList.contains('is-visible')) return;
      if (element.getBoundingClientRect().top <= window.innerHeight * .94) {
        element.classList.add('is-visible');
        observer.unobserve(element);
      }
    });
    revealReachedElements();
    window.addEventListener('scroll', revealReachedElements, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', revealReachedElements); };
  }, []);
  return <main className="public-landing" ref={rootRef}>
    <header className="landing-nav">
      <button className="landing-brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Volver al inicio">
        <span className="landing-brand-mark"><img src={logo} alt="" /></span>
        <span><strong>Gavrion</strong><small>EcoSystems</small></span>
      </button>
      <nav aria-label="Navegación de presentación">
        <a href="#solucion">La solución</a>
        <a href="#funciones">Funciones</a>
        <a href="#como-funciona">Cómo funciona</a>
        <a href="#contacto">Contacto</a>
      </nav>
      <div className="landing-nav-actions">
        <button className="landing-login-link" type="button" onClick={onLogin}>Iniciar sesión</button>
        <button className="landing-nav-cta" type="button" onClick={onRequestAccess}>Solicitar acceso <ArrowRight aria-hidden="true" /></button>
      </div>
    </header>

    <section className="landing-hero" id="solucion">
      <div className="landing-hero-copy" data-reveal>
        <p className="landing-eyebrow"><span /> Gestión inteligente para reciclaje y materiales</p>
        <h1>Tu operación, <em>más clara</em>. Tu empresa, más preparada.</h1>
        <p className="landing-lead">Gavrion EcoSystems reúne inventario, boletas, ventas, clientes y reportes en un solo lugar para que puedas operar mejor y crecer con información confiable.</p>
        <div className="landing-hero-actions">
          <button className="landing-primary-cta" type="button" onClick={onRequestAccess}>Quiero conocer el sistema <ArrowRight aria-hidden="true" /></button>
          <a className="landing-secondary-cta" href="#funciones">Explorar funciones</a>
        </div>
        <div className="landing-hero-note"><CheckCircle2 aria-hidden="true" /> Solicitud sujeta a aprobación para proteger cada empresa.</div>
      </div>
      <div className="landing-hero-visual" aria-label="Vista previa de la plataforma" data-reveal>
        <div className="landing-orbit landing-orbit-one" />
        <div className="landing-orbit landing-orbit-two" />
        <div className="landing-preview-card landing-preview-main">
          <div className="landing-preview-head"><span><LayoutDashboard aria-hidden="true" /> Resumen general</span><b>Mensual</b></div>
          <strong>Dashboard</strong>
          <p>Todo lo importante de tu operación, en una sola vista.</p>
          <div className="landing-preview-kpis"><span><small>Inventario actual</small><AnimatedNumber value={8.74} decimals={2} suffix=" t" /></span><span><small>Valor inventario</small><AnimatedNumber value={87999} prefix="LPS " /></span><span><small>Movimientos</small><AnimatedNumber value={24} /></span></div>
          <div className="landing-preview-chart"><i style={{ height: '42%' }} /><i style={{ height: '66%' }} /><i style={{ height: '52%' }} /><i style={{ height: '82%' }} /><i style={{ height: '61%' }} /><i style={{ height: '92%' }} /></div>
        </div>
        <div className="landing-preview-card landing-preview-float"><span className="landing-float-icon"><Boxes aria-hidden="true" /></span><span><small>Existencias disponibles</small><b>Control en tiempo real</b></span><CheckCircle2 aria-hidden="true" /></div>
      </div>
    </section>

    <section className="landing-section landing-ecosystem" aria-labelledby="landing-ecosystem-title">
      <div className="landing-ecosystem-copy" data-reveal>
        <p className="landing-eyebrow"><span /> Una operación conectada</p>
        <h2 id="landing-ecosystem-title">Cada registro alimenta una visión más completa de tu empresa.</h2>
        <p>Desde quién entrega el material hasta quién lo compra, Gavrion EcoSystems mantiene la información relacionada y disponible para tu equipo.</p>
        <ul>
          <li data-reveal><Handshake aria-hidden="true" /><span><strong>Proveedores organizados</strong> por categoría, datos de contacto y materiales.</span></li>
          <li data-reveal><Boxes aria-hidden="true" /><span><strong>Inventario actualizado</strong> después de cada entrada, venta o ajuste.</span></li>
          <li data-reveal><UsersRound aria-hidden="true" /><span><strong>Clientes centralizados</strong> con documentos e historial operativo.</span></li>
        </ul>
      </div>
      <div className="landing-ecosystem-board" aria-label="Flujo visual entre proveedores, inventario y clientes" data-reveal>
        <div className="landing-board-head"><span><Building2 aria-hidden="true" /> Centro de operaciones</span><b><i /> Información conectada</b></div>
        <div className="landing-flow">
          <article><span><Handshake aria-hidden="true" /></span><small>Origen</small><strong>Proveedores</strong><em>12 activos</em></article>
          <ArrowRight className="landing-flow-arrow" aria-hidden="true" />
          <article className="featured"><b className="landing-active-label"><CheckCircle2 aria-hidden="true" /> Activo</b><span><Boxes aria-hidden="true" /></span><small>Control</small><strong>Inventario</strong><em>8.74 toneladas</em></article>
          <ArrowRight className="landing-flow-arrow" aria-hidden="true" />
          <article><span><UsersRound aria-hidden="true" /></span><small>Destino</small><strong>Clientes</strong><em>18 registrados</em></article>
        </div>
        <div className="landing-board-records">
          <div><span className="landing-record-avatar">PR</span><p><strong>Recolector principal</strong><small>Entrada registrada · Hierro</small></p><b>+ 1.25 t</b></div>
          <div><span className="landing-record-avatar client">CL</span><p><strong>Cliente empresarial</strong><small>Boleta emitida · Aluminio</small></p><b>- 0.80 t</b></div>
        </div>
        <div className="landing-board-summary"><span><small>Documentos</small><b>36</b></span><span><small>Operaciones</small><b>24</b></span><span><small>Estado</small><b>Al día</b></span></div>
      </div>
    </section>

    <section className="landing-section landing-features" id="funciones">
      <div className="landing-section-heading" data-reveal><p className="landing-eyebrow"><span /> Lo que puedes hacer</p><h2>Todo el control que tu empresa necesita para trabajar con confianza.</h2><p>Diseñado para equipos que reciben, clasifican, venden y reportan materiales todos los días.</p></div>
      <div className="landing-feature-grid">{features.map(({ icon: Icon, title, text }) => <article key={title} className="landing-feature-card" data-reveal><span className="landing-feature-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="landing-section landing-workflow" id="como-funciona">
      <div className="landing-workflow-copy" data-reveal><p className="landing-eyebrow"><span /> Empieza de forma ordenada</p><h2>De la solicitud a una operación lista para crecer.</h2><p>Te acompañamos en el inicio para que tu equipo pueda trabajar con una base clara desde el primer día.</p></div>
      <div className="landing-steps">{workflowSteps.map(({ icon: Icon, title, text }) => <article key={title} data-reveal><span className="landing-step-icon"><Icon aria-hidden="true" /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
    </section>

    <section className="landing-contact" id="contacto" aria-labelledby="landing-contact-title">
      <div className="landing-contact-copy" data-reveal><p className="landing-eyebrow"><span /> Contacto directo</p><h2 id="landing-contact-title">¿Quieres conocer mejor el sistema?</h2><p>Conversemos sobre tu empresa y las herramientas que necesitas para controlar tu operación.</p></div>
      <div className="landing-contact-options">
        <a href="mailto:gavrionn@gmail.com" data-reveal><span><Mail aria-hidden="true" /></span><div><small>Escríbenos por correo</small><strong>gavrionn@gmail.com</strong></div><ArrowRight aria-hidden="true" /></a>
        <a href="https://wa.me/50498433252" target="_blank" rel="noreferrer" data-reveal><span><MessageCircle aria-hidden="true" /></span><div><small>Conversemos por WhatsApp</small><strong>+504 9843-3252</strong></div><ArrowRight aria-hidden="true" /></a>
        <a href="tel:+50498433252" data-reveal><span><Phone aria-hidden="true" /></span><div><small>Llámanos directamente</small><strong>+504 9843-3252</strong></div><ArrowRight aria-hidden="true" /></a>
      </div>
    </section>

    <footer className="landing-footer"><span>© {new Date().getFullYear()} Gavrion EcoSystems</span><span>Gestión empresarial para una operación más eficiente.</span></footer>
  </main>;
}
