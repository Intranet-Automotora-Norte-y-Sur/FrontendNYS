import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Icono } from '../components/ui/Icono';
import { VisorFoto } from '../components/gente/VisorFoto';
import {
  FormularioColaborador,
  type DatosColaborador,
} from '../components/gente/FormularioColaborador';

interface Persona {
  id: number;
  nombre: string;
  cargo: string;
  area: string;
  sede: string;
  sede_label: string;
  marca: string;
  edad: number;
  /** Ya legible («Casado(a)»); vacío cuando la nómina no lo tiene. */
  estado_civil: string;
  iniciales: string;
  foto: string | null;
  activo: boolean;
}

/** Gradientes de portada; se eligen de forma estable por nombre. */
const PALETA: [string, string][] = [
  ['#E4002B', '#8f0019'],
  ['#2563EB', '#1e3a8a'],
  ['#1f2937', '#0b0f19'],
  ['#B45309', '#7c2d12'],
  ['#7C3AED', '#4c1d95'],
  ['#16A34A', '#065f46'],
  ['#0EA5E9', '#0369a1'],
  ['#BE123C', '#7f1d1d'],
  ['#1E40AF', '#0f172a'],
  ['#92400E', '#451a03'],
  ['#0D9488', '#134e4a'],
  ['#DB2777', '#831843'],
];

function gradiente(nombre: string): string {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [a, b] = PALETA[h % PALETA.length];
  return `linear-gradient(150deg, ${a}, ${b})`;
}

/** Primer nivel de filtro: el concesionario. Las sedes concretas van en el selector. */
const MARCAS = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'toyota', etiqueta: 'Toyota' },
  { valor: 'renault', etiqueta: 'Renault' },
] as const;

const TODAS_LAS_SEDES = '';

export function NuestraGente() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';

  const [gente, setGente] = useState<Persona[] | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [marca, setMarca] = useState<string>('');
  const [sede, setSede] = useState<string>(TODAS_LAS_SEDES);
  const [ampliada, setAmpliada] = useState<Persona | null>(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [creando, setCreando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);

  const cargar = useCallback(async () => {
    const resp = await api.get('/api/auth/gente/');
    setGente(resp.ok ? ((await resp.json()) as Persona[]) : []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const sedesDe = (personas: Persona[]) =>
    [...new Set(personas.map((p) => p.sede_label).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    );

  /** Sedes de la marca elegida, para no ofrecer filtros vacíos. */
  const sedesDisponibles = useMemo(
    () => sedesDe((gente ?? []).filter((p) => !marca || p.marca === marca)),
    [gente, marca],
  );

  /** Todas las sedes conocidas: sugerencias del formulario de alta. */
  const todasLasSedes = useMemo(() => sedesDe(gente ?? []), [gente]);

  const visibles = useMemo(() => {
    if (!gente) return [];
    const q = busqueda.trim().toLowerCase();
    return gente.filter((p) => {
      const porMarca = !marca || p.marca === marca;
      const porSede = sede === TODAS_LAS_SEDES || p.sede_label === sede;
      const porTexto =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.cargo.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.sede_label.toLowerCase().includes(q);
      return porMarca && porSede && porTexto;
    });
  }, [gente, busqueda, marca, sede]);

  const subirFoto = async (persona: Persona, archivo: File) => {
    setSubiendoFoto(persona.id);
    const fd = new FormData();
    fd.append('foto', archivo);
    const resp = await api.postForm(`/api/auth/admin/empleados/${persona.id}/foto/`, fd);
    setSubiendoFoto(null);
    if (!resp.ok) {
      setMensaje({ texto: 'No se pudo subir la foto.', error: true });
      return;
    }
    const { foto } = (await resp.json()) as { foto: string };
    setGente((prev) =>
      prev ? prev.map((p) => (p.id === persona.id ? { ...p, foto } : p)) : prev,
    );
  };

  const crearColaborador = async (datos: DatosColaborador, foto: File | null) => {
    setCreando(true);
    const resp = await api.post('/api/auth/admin/empleados/', datos);
    if (!resp.ok) {
      const errores = (await resp.json().catch(() => null)) as Record<string, string[]> | null;
      const detalle = errores
        ? Object.entries(errores)
            .map(([campo, msgs]) => `${campo}: ${msgs.join(' ')}`)
            .join(' · ')
        : 'No se pudo crear el colaborador.';
      setMensaje({ texto: detalle, error: true });
      setCreando(false);
      return false;
    }
    const creado = (await resp.json()) as { id: number };
    let aviso = {
      texto: datos.crear_cuenta
        ? `${datos.nombre} se agregó al equipo. Su usuario y contraseña son la cédula ${datos.id_identificacion}; pídele que la cambie al ingresar.`
        : `${datos.nombre} se agregó al equipo (sin cuenta de acceso).`,
      error: false,
    };
    if (foto) {
      const fd = new FormData();
      fd.append('foto', foto);
      const respFoto = await api.postForm(`/api/auth/admin/empleados/${creado.id}/foto/`, fd);
      if (!respFoto.ok) {
        aviso = {
          texto: `${datos.nombre} se creó, pero la foto no se pudo subir. Inténtalo desde su tarjeta.`,
          error: true,
        };
      }
    }
    setCreando(false);
    setMensaje(aviso);
    if (!aviso.error) setMostrarAlta(false);
    await cargar();
    return true;
  };

  const cambiarActivo = async (persona: Persona, activo: boolean) => {
    const resp = await api.patch(`/api/auth/admin/empleados/${persona.id}/`, { activo });
    if (!resp.ok) {
      setMensaje({ texto: 'No se pudo actualizar el estado.', error: true });
      return;
    }
    setGente((prev) =>
      prev ? prev.map((p) => (p.id === persona.id ? { ...p, activo } : p)) : prev,
    );
  };

  const eliminar = async (persona: Persona) => {
    if (
      !window.confirm(
        `¿Borrar permanentemente a ${persona.nombre}? Esta acción no se puede deshacer.`,
      )
    )
      return;
    const resp = await api.delete(`/api/auth/admin/empleados/${persona.id}/`);
    if (resp.status === 204) {
      setGente((prev) => (prev ? prev.filter((p) => p.id !== persona.id) : prev));
      return;
    }
    const datos = (await resp.json().catch(() => null)) as { detail?: string } | null;
    setMensaje({ texto: datos?.detail ?? 'No se pudo borrar.', error: true });
  };

  return (
    <div>
      {/* Barra de búsqueda + filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            <Icono nombre="personas" className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, cargo o área…"
            className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors duration-150 focus:border-brand"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {MARCAS.map((m) => (
            <button
              key={m.valor}
              type="button"
              onClick={() => {
                setMarca(m.valor);
                setSede(TODAS_LAS_SEDES);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                marca === m.valor ? 'bg-brand text-white' : 'bg-white text-body hover:bg-ink-2/5'
              }`}
            >
              {m.etiqueta}
            </button>
          ))}
          <label className="sr-only" htmlFor="filtro-sede">
            Filtrar por sede
          </label>
          <select
            id="filtro-sede"
            value={sede}
            onChange={(e) => setSede(e.target.value)}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-body outline-none transition-colors duration-150 focus:border-brand"
          >
            <option value={TODAS_LAS_SEDES}>Todas las sedes</option>
            {sedesDisponibles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-sm text-muted">
          {visibles.length} colaborador{visibles.length === 1 ? '' : 'es'}
        </span>
        {esAdmin && (
          <button
            type="button"
            onClick={() => setMostrarAlta((v) => !v)}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
          >
            {mostrarAlta ? 'Cerrar' : 'Nuevo colaborador'}
          </button>
        )}
      </div>

      {esAdmin && mostrarAlta && (
        <div className="mb-6 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-bold text-ink">Agregar colaborador</h2>
          <p className="mt-1 text-sm text-muted">
            Queda visible en «Nuestra gente». La foto es opcional: sin ella se muestra un
            monograma con las iniciales.
          </p>
          <FormularioColaborador
            guardando={creando}
            sedes={todasLasSedes}
            onGuardar={crearColaborador}
            onCancelar={() => setMostrarAlta(false)}
          />
        </div>
      )}

      {mensaje && (
        <p
          role="status"
          className={`mb-6 max-w-2xl rounded-lg px-3 py-2 text-sm ${
            mensaje.error ? 'bg-brand/10 text-brand' : 'bg-ok/10 text-ok'
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      {gente === null ? (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
          Cargando equipo…
        </p>
      ) : visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          No se encontraron colaboradores con esos criterios.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visibles.map((p) => (
            <li
              key={p.id}
              className={`overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-shadow duration-150 hover:shadow-md ${
                p.activo ? '' : 'opacity-70'
              }`}
            >
              {/* Portada: foto del colaborador o monograma de respaldo */}
              <div
                className="relative grid h-40 place-items-center"
                style={{ background: gradiente(p.nombre) }}
              >
                {p.foto ? (
                  <button
                    type="button"
                    onClick={() => setAmpliada(p)}
                    aria-label={`Ver la foto de ${p.nombre} más grande`}
                    className="absolute inset-0 cursor-zoom-in overflow-hidden"
                  >
                    <img
                      src={p.foto}
                      alt={p.nombre}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </button>
                ) : (
                  <span className="font-display text-5xl font-extrabold uppercase tracking-wide text-white drop-shadow">
                    {p.iniciales}
                  </span>
                )}
                <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-ink">
                  {p.sede_label}
                </span>
                {!p.activo && (
                  <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-bold uppercase text-white">
                    Inactivo
                  </span>
                )}
              </div>
              {/* Datos */}
              <div className="p-5">
                <p className="font-display text-lg font-bold text-ink">{p.nombre}</p>
                <p className="mt-0.5 text-sm font-semibold text-brand">{p.cargo}</p>
                <div className="mt-3 space-y-1.5 text-sm text-muted">
                  <p className="flex items-center gap-2">
                    <Icono nombre="personas" className="h-4 w-4 shrink-0 text-faint" />
                    {p.area}
                  </p>
                  <p className="flex items-center gap-2">
                    <Icono nombre="pastel" className="h-4 w-4 shrink-0 text-faint" />
                    {p.edad} años
                  </p>
                  {/* La nómina no siempre lo trae: sin dato, no se pinta la línea. */}
                  {p.estado_civil && (
                    <p className="flex items-center gap-2">
                      <Icono nombre="nombre" className="h-4 w-4 shrink-0 text-faint" />
                      {p.estado_civil}
                    </p>
                  )}
                </div>

                {esAdmin && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                    <label className="cursor-pointer text-xs font-semibold text-info hover:underline">
                      {subiendoFoto === p.id
                        ? 'Subiendo…'
                        : p.foto
                          ? 'Cambiar foto'
                          : 'Subir foto'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={subiendoFoto === p.id}
                        onChange={(e) => {
                          const archivo = e.target.files?.[0];
                          if (archivo) void subirFoto(p, archivo);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void cambiarActivo(p, !p.activo)}
                      className="text-xs font-semibold text-info hover:underline"
                    >
                      {p.activo ? 'Dar de baja' : 'Reactivar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void eliminar(p)}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {ampliada?.foto && (
        <VisorFoto
          src={ampliada.foto}
          nombre={ampliada.nombre}
          detalle={`${ampliada.cargo} · ${ampliada.sede_label}`}
          onCerrar={() => setAmpliada(null)}
        />
      )}
    </div>
  );
}
