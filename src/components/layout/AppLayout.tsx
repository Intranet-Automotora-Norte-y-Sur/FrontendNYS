import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useAuth } from '../../hooks/useAuth';
import { useCasosAsignados } from '../../hooks/useCasosAsignados';
import { CambiarContrasena } from '../cuenta/CambiarContrasena';
import { ToastEnlaces } from './ToastEnlaces';
import { Icono, type NombreIcono } from '../ui/Icono';

interface ItemNav {
  a: string;
  icono: NombreIcono;
  txt: string;
  /** Distintivo a la derecha del nombre, como la etiqueta «IA». */
  etiqueta?: string;
}

const GRUPOS: { titulo: string; items: ItemNav[] }[] = [
  {
    titulo: 'Principal',
    items: [
      { a: '/', icono: 'inicio', txt: 'Inicio' },
      { a: '/asistente', icono: 'chispas', txt: 'Asistente IA', etiqueta: 'IA' },
      { a: '/comunicados', icono: 'megafono', txt: '¿Qué está ocurriendo?' },
    ],
  },
  {
    titulo: 'Información',
    items: [
      { a: '/indicadores', icono: 'grafica', txt: 'Nuestras cifras' },
      { a: '/talento-humano', icono: 'personas', txt: 'Talento Humano' },
      { a: '/enlaces', icono: 'enlace', txt: 'Enlaces Toyota' },
      { a: '/academia', icono: 'birrete', txt: 'Academia' },
      { a: '/beneficios', icono: 'regalo', txt: 'Beneficios' },
    ],
  },
  {
    titulo: 'Personal',
    items: [
      { a: '/nuestra-gente', icono: 'personas', txt: 'Nuestra gente' },
      { a: '/certificados', icono: 'documento', txt: 'Mis certificados' },
      { a: '/sugerencias', icono: 'chat', txt: 'Sugerencias' },
    ],
  },
];

const TITULOS: Record<string, { titulo: string; sub: string }> = {
  '/': { titulo: 'Inicio', sub: 'Comunicados y accesos rápidos' },
  '/asistente': { titulo: 'Asistente IA', sub: 'Pregunta en lenguaje natural sobre la intranet' },
  '/comunicados': { titulo: '¿Qué está ocurriendo?', sub: 'Noticias y anuncios de la empresa' },
  '/beneficios': { titulo: 'Beneficios', sub: 'Convenios para ti y tu familia' },
  '/certificados': { titulo: 'Mis certificados', sub: 'Genera y descarga tus documentos' },
  '/indicadores': { titulo: 'Nuestras cifras', sub: 'Indicadores en tiempo real' },
  '/academia': { titulo: 'Academia Norte y Sur', sub: 'Tu formación, siempre disponible' },
  '/nuestra-gente': { titulo: 'Nuestra gente', sub: 'Conoce al equipo Norte y Sur' },
  '/sugerencias': { titulo: 'Sugerencias', sub: 'Tu opinión cuenta' },
  '/talento-humano': { titulo: 'Talento Humano', sub: 'Misión, visión y cultura' },
  '/enlaces': { titulo: 'Enlaces Toyota', sub: 'Herramientas y portales de marca' },
  '/panel': { titulo: 'Panel de edición', sub: 'Gestión de contenido' },
  '/administracion': { titulo: 'Administración', sub: 'Cuentas de colaboradores y editores' },
  '/ingresos': { titulo: 'Ingresos a la intranet', sub: 'Seguimiento de uso por colaborador' },
  '/buzon': { titulo: 'Buzón Digital de Ideas', sub: 'Informe y gestión de los casos' },
  '/mis-casos': { titulo: 'Mis casos', sub: 'Solicitudes del buzón asignadas a ti' },
};

function claseNav({ isActive }: { isActive: boolean }) {
  return `mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-brand text-white' : 'text-faint hover:bg-ink-2 hover:text-white'
    }`;
}

export function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [cambiandoClave, setCambiandoClave] = useState(false);
  // El aviso invita a cambiar la clave inicial, nunca obliga: se puede apartar
  // y no vuelve a aparecer en lo que queda de sesión.
  const [avisoApartado, setAvisoApartado] = useState(false);
  const mostrarAvisoClave = Boolean(usuario?.usa_clave_inicial) && !avisoApartado;
  const casosAsignados = useCasosAsignados();

  const encabezado = TITULOS[pathname] ?? { titulo: 'Intranet', sub: '' };
  const iniciales = (usuario?.nombre ?? '')
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  const salir = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col bg-ink text-white">
        <div className="border-b border-white/5 px-4 pb-4 pt-5">
          {/* Placa gris carbón, no roja: el rojo de marca queda reservado para
              el ítem activo del menú y las llamadas a la acción. */}
          <div className="grid place-items-center rounded-2xl bg-ink-2 px-4 py-6">
            <img src={logo} alt="Norte y Sur" className="h-14 w-auto invert" />
          </div>
          <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-faint">
            Intranet corporativa
          </p>
        </div>

        <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-3 pb-4">
          {GRUPOS.map(({ titulo, items }) => (
            <div key={titulo}>
              <p className="mb-1.5 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {titulo}
              </p>
              {items.map(({ a, icono, txt, etiqueta }) => (
                <NavLink key={a} to={a} end={a === '/'} className={claseNav}>
                  {({ isActive }) => (
                    <>
                      <Icono nombre={icono} />
                      {txt}
                      {etiqueta && (
                        <span
                          className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-brand text-white'
                          }`}
                        >
                          {etiqueta}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
          {/* Solo para quien tenga alguno: un enlace vacío para doscientas
              personas que nunca reciben un caso es ruido en el menú. */}
          {casosAsignados > 0 && (
            <div>
              <p className="mb-1.5 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Asignado a mí
              </p>
              <NavLink to="/mis-casos" className={claseNav}>
                {({ isActive }) => (
                  <>
                    <Icono nombre="chat" />
                    Mis casos
                    <span
                      className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-brand text-white'
                      }`}
                    >
                      {casosAsignados}
                    </span>
                  </>
                )}
              </NavLink>
            </div>
          )}
          {usuario && usuario.rol !== 'colaborador' && (
            <div>
              <p className="mb-1.5 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Gestión
              </p>
              <NavLink to="/panel" className={claseNav}>
                <Icono nombre="lapiz" />
                Panel de edición
              </NavLink>
              {usuario.rol === 'admin' && (
                <>
                  <NavLink to="/administracion" className={claseNav}>
                    <Icono nombre="personas" />
                    Administración
                  </NavLink>
                  <NavLink to="/ingresos" className={claseNav}>
                    <Icono nombre="grafica" />
                    Ingresos a la intranet
                  </NavLink>
                  <NavLink to="/buzon" className={claseNav}>
                    <Icono nombre="documento" />
                    Informe del buzón
                  </NavLink>
                </>
              )}
            </div>
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-white px-6">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold text-ink">{encabezado.titulo}</h1>
            <p className="truncate text-xs text-muted">{encabezado.sub}</p>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">
              {iniciales || '·'}
            </span>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-ink">{usuario?.nombre}</p>
              <p className="text-xs capitalize text-muted">{usuario?.rol}</p>
            </div>
            <button
              type="button"
              onClick={() => setCambiandoClave(true)}
              aria-label="Cambiar mi contraseña"
              title="Cambiar mi contraseña"
              className="rounded-lg border border-line px-2.5 py-1.5 text-sm text-body transition-colors duration-150 hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Icono nombre="candado" />
            </button>
            <button
              type="button"
              onClick={salir}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="rounded-lg border border-line px-2.5 py-1.5 text-sm text-body transition-colors duration-150 hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Icono nombre="salir" />
            </button>
          </div>
        </header>

        {mostrarAvisoClave && (
          <div className="mx-7 mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <Icono nombre="candado" />
            <p className="min-w-0 flex-1 text-sm text-body">
              Entras con tu cédula como contraseña. Puedes cambiarla o seguir usándola.
            </p>
            <button
              type="button"
              onClick={() => setCambiandoClave(true)}
              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            >
              Cambiarla
            </button>
            <button
              type="button"
              onClick={() => setAvisoApartado(true)}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted transition-colors duration-150 hover:text-ink"
            >
              Seguir así
            </button>
          </div>
        )}

        <main className="min-w-0 flex-1 p-7">
          <Outlet />
        </main>
        {cambiandoClave && <CambiarContrasena onCerrar={() => setCambiandoClave(false)} />}
        <ToastEnlaces />
      </div>
    </div>
  );
}
