'use client';

import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  LayoutDashboard,
  ShieldCheck,
  Truck,
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
    icon: Truck,
    title: 'Operaciones sin duplicar trabajo',
    text: 'Registra compras, boletas, ventas y mermas desde un flujo claro y conectado.',
  },
  {
    icon: BarChart3,
    title: 'Decisiones con datos',
    text: 'Convierte tu operación diaria en indicadores, reportes y tendencias fáciles de entender.',
  },
  {
    icon: ShieldCheck,
    title: 'Una empresa aislada y segura',
    text: 'Cada organización trabaja con sus propios usuarios, permisos, configuraciones y registros.',
  },
];

const benefits = [
  'Usuarios y permisos por empresa',
  'Boletas y certificados listos para imprimir',
  'Reportes operativos y financieros',
  'Soporte y acompañamiento para comenzar',
];

export function PublicLanding({ logo, onLogin, onRequestAccess }: PublicLandingProps) {
  return <main className="public-landing">
    <header className="landing-nav">
      <button className="landing-brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Volver al inicio">
        <span className="landing-brand-mark"><img src={logo} alt="" /></span>
        <span><strong>Gavrion</strong><small>EcoSystems</small></span>
      </button>
      <nav aria-label="Navegación de presentación">
        <a href="#solucion">La solución</a>
        <a href="#funciones">Funciones</a>
        <a href="#como-funciona">Cómo funciona</a>
      </nav>
      <div className="landing-nav-actions">
        <button className="landing-login-link" type="button" onClick={onLogin}>Iniciar sesión</button>
        <button className="landing-nav-cta" type="button" onClick={onRequestAccess}>Solicitar acceso <ArrowRight aria-hidden="true" /></button>
      </div>
    </header>

    <section className="landing-hero" id="solucion">
      <div className="landing-hero-copy">
        <p className="landing-eyebrow"><span /> Gestión inteligente para reciclaje y materiales</p>
        <h1>Tu operación, <em>más clara</em>. Tu empresa, más preparada.</h1>
        <p className="landing-lead">Gavrion EcoSystems reúne inventario, boletas, ventas, clientes y reportes en un solo lugar para que puedas operar mejor y crecer con información confiable.</p>
        <div className="landing-hero-actions">
          <button className="landing-primary-cta" type="button" onClick={onRequestAccess}>Quiero conocer el sistema <ArrowRight aria-hidden="true" /></button>
          <button className="landing-secondary-cta" type="button" onClick={onLogin}>Ya tengo una cuenta</button>
        </div>
        <div className="landing-hero-note"><CheckCircle2 aria-hidden="true" /> Solicitud sujeta a aprobación para proteger cada empresa.</div>
      </div>
      <div className="landing-hero-visual" aria-label="Vista previa de la plataforma">
        <div className="landing-orbit landing-orbit-one" />
        <div className="landing-orbit landing-orbit-two" />
        <div className="landing-preview-card landing-preview-main">
          <div className="landing-preview-head"><span><LayoutDashboard aria-hidden="true" /> Resumen general</span><b>Mensual</b></div>
          <strong>Dashboard</strong>
          <p>Todo lo importante de tu operación, en una sola vista.</p>
          <div className="landing-preview-kpis"><span><small>Inventario actual</small><b>8.74 t</b></span><span><small>Valor inventario</small><b>LPS 87,999</b></span><span><small>Movimientos</small><b>24</b></span></div>
          <div className="landing-preview-chart"><i style={{ height: '42%' }} /><i style={{ height: '66%' }} /><i style={{ height: '52%' }} /><i style={{ height: '82%' }} /><i style={{ height: '61%' }} /><i style={{ height: '92%' }} /></div>
        </div>
        <div className="landing-preview-card landing-preview-float"><span className="landing-float-icon"><Boxes aria-hidden="true" /></span><span><small>Existencias disponibles</small><b>Control en tiempo real</b></span><CheckCircle2 aria-hidden="true" /></div>
      </div>
    </section>

    <section className="landing-proof" aria-label="Beneficios principales">
      <div><strong>Una plataforma para ordenar el día a día</strong><span>Menos hojas sueltas. Más control.</span></div>
      <div><b>Inventario</b><span>Conectado con tus movimientos</span></div>
      <div><b>Boletas</b><span>Documentos listos para tu operación</span></div>
      <div><b>Reportes</b><span>Información para decidir mejor</span></div>
    </section>

    <section className="landing-section landing-features" id="funciones">
      <div className="landing-section-heading"><p className="landing-eyebrow"><span /> Lo que puedes hacer</p><h2>Todo el control que tu empresa necesita para trabajar con confianza.</h2><p>Diseñado para equipos que reciben, clasifican, venden y reportan materiales todos los días.</p></div>
      <div className="landing-feature-grid">{features.map(({ icon: Icon, title, text }) => <article key={title} className="landing-feature-card"><span className="landing-feature-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p><button type="button" onClick={onRequestAccess}>Conocer más <ArrowRight aria-hidden="true" /></button></article>)}</div>
    </section>

    <section className="landing-section landing-workflow" id="como-funciona">
      <div className="landing-workflow-copy"><p className="landing-eyebrow"><span /> Empieza de forma ordenada</p><h2>De la solicitud a una operación lista para crecer.</h2><p>Te acompañamos en el inicio para que tu equipo pueda trabajar con una base clara desde el primer día.</p><button className="landing-primary-cta" type="button" onClick={onRequestAccess}>Solicitar acceso <ArrowRight aria-hidden="true" /></button></div>
      <div className="landing-steps"><article><span>01</span><div><h3>Solicita tu acceso</h3><p>Cuéntanos quién eres y qué empresa quieres configurar.</p></div></article><article><span>02</span><div><h3>Configuramos tu espacio</h3><p>Define usuarios, materiales, moneda y datos de la empresa.</p></div></article><article><span>03</span><div><h3>Opera con información real</h3><p>Registra movimientos y consulta indicadores en un solo sistema.</p></div></article></div>
    </section>

    <section className="landing-cta-section"><div><p className="landing-eyebrow"><span /> Gavrion EcoSystems</p><h2>Haz que cada movimiento cuente.</h2><p>Conoce una forma más ordenada de administrar tu empresa de reciclaje.</p></div><div className="landing-cta-actions"><ul>{benefits.map(benefit => <li key={benefit}><CheckCircle2 aria-hidden="true" />{benefit}</li>)}</ul><button className="landing-primary-cta" type="button" onClick={onRequestAccess}>Solicitar acceso <ArrowRight aria-hidden="true" /></button></div></section>

    <footer className="landing-footer"><span>© {new Date().getFullYear()} Gavrion EcoSystems</span><span>Gestión empresarial para una operación más eficiente.</span><button type="button" onClick={onLogin}>Ingresar al sistema</button></footer>
  </main>;
}
