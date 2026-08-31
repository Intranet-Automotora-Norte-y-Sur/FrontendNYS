import { useState, type FormEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useAuth } from '../../hooks/useAuth';
import { CambiarContrasena } from '../cuenta/CambiarContrasena';
import { Asistente } from '../asistente/Asistente';
import { ToastEnlaces } from './ToastEnlaces';
import { Icono, type NombreIcono } from '../ui/Icono';

interface ItemNav {
  a: string;
  icono: NombreIcono;
  txt: string;
}

const GRUPOS: { titulo: string; items: ItemNav[] }[] = [
  {
    titulo: 'Principal',
    items: [
      { a: '/', icono: 'inicio', txt: 'Inicio' },
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
  '/buscar': { titulo: 'Búsqueda', sub: 'Resultados en la intranet' },
};

function claseNav({ isActive }: { isActive: boolean }) {
  return `mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-brand text-white' : 'text-faint hover:bg-ink-2 hover:text-white'
    }`;
}

export function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [busqueda, setBusqueda] = useState('');
  const [cambiandoClave, setCambiandoClave] = useState(false);
  // El aviso invita a cambiar la clave inicial, nunca obliga: se puede apartar
  // y no vuelve a aparecer en lo que queda de sesión.
  const [avisoApartado, setAvisoApartado] = useState(false);
  const mostrarAvisoClave = Boolean(usuario?.usa_clave_inicial) && !avisoApartado;

  const encabezado = TITULOS[pathname] ?? { titulo: 'Intranet', sub: '' };
  const iniciales = (usuario?.nombre ?? '')
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    const consulta = busqueda.trim();
    if (consulta) navigate(`/buscar?q=${encodeURIComponent(consulta)}`);
  };

  const salir = async () => {
    await logout();
    navigate('/login');
  };

  const abrirAsistente = () => window.dispatchEvent(new CustomEvent('abrir-asistente'));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col bg-ink text-white">
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand font-display text-sm font-extrabold">
            NS
          </span>
          <div className="min-w-0">
            <img src={logo} alt="Norte y Sur" className="h-5 w-auto invert" />
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-faint">Intranet</p>
          </div>
        </div>

        <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-3 pb-4">
          {GRUPOS.map(({ titulo, items }, indice) => (
            <div key={titulo}>
              <p className="mb-1.5 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {titulo}
              </p>
              {items.map(({ a, icono, txt }) => (
                <NavLink key={a} to={a} end={a === '/'} className={claseNav}>
                  <Icono nombre={icono} />
                  {txt}
                </NavLink>
              ))}
              {indice === 0 && (
                <button type="button" onClick={abrirAsistente} className={`${claseNav({ isActive: false })} w-full`}>
                  <Icono nombre="chispas" />
                  Asistente IA
                  <span className="ml-auto rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold">IA</span>
                </button>
              )}
            </div>
          ))}
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
                <NavLink to="/administracion" className={claseNav}>
                  <Icono nombre="personas" />
                  Administración
                </NavLink>
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

          <form onSubmit={buscar} className="ml-auto w-32 max-w-xs flex-1 sm:w-auto">
            <label htmlFor="buscador" className="sr-only">Buscar en la intranet</label>
            <input
              id="buscador"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="🔍 Buscar en la intranet…"
              className="w-full rounded-full border border-line bg-surface px-4 py-1.5 text-sm outline-none transition-colors duration-150 focus:border-brand focus:bg-white"
            />
          </form>

          <div className="flex items-center gap-2.5">
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
        <Asistente />
        <ToastEnlaces />
      </div>
    </div>
  );
}
