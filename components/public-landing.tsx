'use client';

import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  FileCheck2,
  Handshake,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Phone,
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

const benefits = [
  'Usuarios y permisos por empresa',
  'Control de clientes y proveedores',
  'Boletas y certificados listos para imprimir',
  'Reportes operativos y financieros',
  'Soporte directo para comenzar',
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
        <a href="#contacto">Contacto</a>
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
      <div><b>Clientes y proveedores</b><span>Relaciones comerciales organizadas</span></div>
      <div><b>Reportes</b><span>Información para decidir mejor</span></div>
    </section>

    <section className="landing-section landing-ecosystem" aria-labelledby="landing-ecosystem-title">
      <div className="landing-ecosystem-copy">
        <p className="landing-eyebrow"><span /> Una operación conectada</p>
        <h2 id="landing-ecosystem-title">Cada registro alimenta una visión más completa de tu empresa.</h2>
        <p>Desde quién entrega el material hasta quién lo compra, Gavrion EcoSystems mantiene la información relacionada y disponible para tu equipo.</p>
        <ul>
          <li><CheckCircle2 aria-hidden="true" /><span><strong>Proveedores organizados</strong> por categoría, datos de contacto y materiales.</span></li>
          <li><CheckCircle2 aria-hidden="true" /><span><strong>Inventario actualizado</strong> después de cada entrada, venta o ajuste.</span></li>
          <li><CheckCircle2 aria-hidden="true" /><span><strong>Clientes centralizados</strong> con documentos e historial operativo.</span></li>
        </ul>
      </div>
      <div className="landing-ecosystem-board" aria-label="Flujo visual entre proveedores, inventario y clientes">
        <div className="landing-board-head"><span><Building2 aria-hidden="true" /> Centro de operaciones</span><b><i /> Información conectada</b></div>
        <div className="landing-flow">
          <article><span><Handshake aria-hidden="true" /></span><small>Origen</small><strong>Proveedores</strong><em>12 activos</em></article>
          <ArrowRight className="landing-flow-arrow" aria-hidden="true" />
          <article className="featured"><span><Boxes aria-hidden="true" /></span><small>Control</small><strong>Inventario</strong><em>8.74 toneladas</em></article>
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
      <div className="landing-section-heading"><p className="landing-eyebrow"><span /> Lo que puedes hacer</p><h2>Todo el control que tu empresa necesita para trabajar con confianza.</h2><p>Diseñado para equipos que reciben, clasifican, venden y reportan materiales todos los días.</p></div>
      <div className="landing-feature-grid">{features.map(({ icon: Icon, title, text }) => <article key={title} className="landing-feature-card"><span className="landing-feature-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p><button type="button" onClick={onRequestAccess}>Conocer más <ArrowRight aria-hidden="true" /></button></article>)}</div>
    </section>

    <section className="landing-section landing-workflow" id="como-funciona">
      <div className="landing-workflow-copy"><p className="landing-eyebrow"><span /> Empieza de forma ordenada</p><h2>De la solicitud a una operación lista para crecer.</h2><p>Te acompañamos en el inicio para que tu equipo pueda trabajar con una base clara desde el primer día.</p><button className="landing-primary-cta" type="button" onClick={onRequestAccess}>Solicitar acceso <ArrowRight aria-hidden="true" /></button></div>
      <div className="landing-steps"><article><span>01</span><div><h3>Solicita tu acceso</h3><p>Cuéntanos quién eres y qué empresa quieres configurar.</p></div></article><article><span>02</span><div><h3>Configuramos tu espacio</h3><p>Define usuarios, materiales, moneda y datos de la empresa.</p></div></article><article><span>03</span><div><h3>Opera con información real</h3><p>Registra movimientos y consulta indicadores en un solo sistema.</p></div></article></div>
    </section>

    <section className="landing-cta-section"><div><p className="landing-eyebrow"><span /> Gavrion EcoSystems</p><h2>Haz que cada movimiento cuente.</h2><p>Conoce una forma más ordenada de administrar tu empresa de reciclaje.</p></div><div className="landing-cta-actions"><ul>{benefits.map(benefit => <li key={benefit}><CheckCircle2 aria-hidden="true" />{benefit}</li>)}</ul><button className="landing-primary-cta" type="button" onClick={onRequestAccess}>Solicitar acceso <ArrowRight aria-hidden="true" /></button></div></section>

    <section className="landing-contact" id="contacto" aria-labelledby="landing-contact-title">
      <div className="landing-contact-copy"><p className="landing-eyebrow"><span /> Contacto directo</p><h2 id="landing-contact-title">¿Quieres conocer mejor el sistema?</h2><p>Conversemos sobre tu empresa y las herramientas que necesitas para controlar tu operación.</p></div>
      <div className="landing-contact-options">
        <a href="mailto:gavrionn@gmail.com"><span><Mail aria-hidden="true" /></span><div><small>Escríbenos por correo</small><strong>gavrionn@gmail.com</strong></div><ArrowRight aria-hidden="true" /></a>
        <a href="https://wa.me/50498433252" target="_blank" rel="noreferrer"><span><MessageCircle aria-hidden="true" /></span><div><small>Conversemos por WhatsApp</small><strong>+504 9843-3252</strong></div><ArrowRight aria-hidden="true" /></a>
        <a href="tel:+50498433252"><span><Phone aria-hidden="true" /></span><div><small>Llámanos directamente</small><strong>+504 9843-3252</strong></div><ArrowRight aria-hidden="true" /></a>
      </div>
    </section>

    <footer className="landing-footer"><span>© {new Date().getFullYear()} Gavrion EcoSystems</span><span>Gestión empresarial para una operación más eficiente.</span><div><a href="mailto:gavrionn@gmail.com">gavrionn@gmail.com</a><a href="tel:+50498433252">+504 9843-3252</a><button type="button" onClick={onLogin}>Ingresar al sistema</button></div></footer>
  </main>;
}
