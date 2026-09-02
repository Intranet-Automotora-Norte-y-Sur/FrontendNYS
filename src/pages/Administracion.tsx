import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Rol } from '../hooks/useAuth';

interface Cuenta {
  id: number;
  empleado_id: number;
  usuario: string;
  email: string;
  nombre: string;
  id_identificacion: string;
  cargo: string;
  area: string;
  rol: Rol;
  activo: boolean;
  ultimo_acceso: string | null;
}

const TITULOS: Record<Rol, string> = {
  colaborador: 'Colaboradores',
  editor: 'Editores',
  admin: 'Administradores',
};

/** Sin tildes y en minúscula: nadie escribe «Muñoz» con tilde al buscar de afán. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function formatearAcceso(iso: string | null): string {
  if (!iso) return 'Nunca ha ingresado';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function Administracion() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [reasignando, setReasignando] = useState<number | null>(null);
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    const resp = await api.get('/api/auth/admin/usuarios/');
    if (resp.ok) setCuentas((await resp.json()) as Cuenta[]);
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const cambiarRol = async (cuenta: Cuenta, rol: Rol) => {
    const resp = await api.post(`/api/auth/admin/usuarios/${cuenta.id}/rol/`, { rol });
    const datos = (await resp.json().catch(() => null)) as { detail?: string } | null;
    if (!resp.ok) {
      setMensaje({ texto: datos?.detail ?? 'No se pudo cambiar el rol.', error: true });
      return;
    }
    setCuentas((prev) => prev.map((c) => (c.id === cuenta.id ? { ...c, rol } : c)));
    setMensaje({ texto: datos?.detail ?? 'Rol actualizado.', error: false });
  };

  const eliminarColaborador = async (cuenta: Cuenta) => {
    if (
      !window.confirm(
        `¿Eliminar a ${cuenta.nombre}? Se borran su ficha de Nuestra gente y su cuenta de acceso. Esta acción no se puede deshacer.`,
      )
    )
      return;
    const resp = await api.delete(`/api/auth/admin/empleados/${cuenta.empleado_id}/`);
    if (resp.status === 204) {
      setCuentas((prev) => prev.filter((c) => c.id !== cuenta.id));
      setMensaje({ texto: `${cuenta.nombre} fue eliminado.`, error: false });
      return;
    }
    const datos = (await resp.json().catch(() => null)) as { detail?: string } | null;
    setMensaje({ texto: datos?.detail ?? 'No se pudo eliminar el colaborador.', error: true });
  };

  const abrirFormulario = (id: number) => {
    setReasignando(id);
    setClave('');
    setConfirmacion('');
    setMensaje(null);
  };

  const reasignar = async (cuenta: Cuenta) => {
    if (clave.length < 8) {
      setMensaje({ texto: 'La contraseña debe tener al menos 8 caracteres.', error: true });
      return;
    }
    if (clave !== confirmacion) {
      setMensaje({ texto: 'Las contraseñas no coinciden.', error: true });
      return;
    }
    const resp = await api.post(`/api/auth/admin/usuarios/${cuenta.id}/contrasena/`, {
      password: clave,
    });
    if (!resp.ok) {
      const datos = (await resp.json().catch(() => null)) as { detail?: string | string[] } | null;
      const detalle = Array.isArray(datos?.detail) ? datos.detail.join(' ') : datos?.detail;
      setMensaje({ texto: detalle ?? 'No se pudo actualizar la contraseña.', error: true });
      return;
    }
    setMensaje({
      texto: `Contraseña actualizada para ${cuenta.nombre}. Compártela por un canal seguro.`,
      error: false,
    });
    setReasignando(null);
  };

  const grupos: Rol[] = ['colaborador', 'editor', 'admin'];

  // Con 200+ cuentas la lista no se recorre a ojo: se busca por lo que uno
  // recuerda — nombre, cédula, cargo, área o usuario.
  const termino = normalizar(busqueda.trim());
  const coincide = (c: Cuenta) =>
    !termino ||
    normalizar(`${c.nombre} ${c.id_identificacion} ${c.cargo} ${c.area} ${c.usuario} ${c.email}`)
      .includes(termino);
  const visibles = cuentas.filter(coincide);

  return (
    <section aria-labelledby="admin-titulo">
      <h1 id="admin-titulo" className="sr-only">Administración de cuentas</h1>
      <p className="max-w-2xl text-sm text-muted">
        Cuentas activas de la intranet. Puedes reasignar la contraseña de colaboradores y
        editores, y designar quién es editor o administrador — todos entran como
        colaboradores. Las cuentas que ya son de administrador se gestionan desde el admin
        de Django. Para agregar un colaborador, cambiar su foto, darlo de baja o eliminarlo,
        entra a «Nuestra gente».
      </p>

      <div className="mt-5 max-w-md">
        <label htmlFor="buscar-colaborador" className="mb-1 block text-xs font-medium text-body">
          Buscar colaborador
        </label>
        <div className="flex items-center gap-2">
          <input
            id="buscar-colaborador"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, cédula, cargo, área o usuario…"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-brand"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="shrink-0 text-sm font-medium text-muted hover:text-ink"
            >
              Limpiar
            </button>
          )}
        </div>
        {termino && (
          <p className="mt-1.5 text-xs text-muted" role="status">
            {visibles.length === 0
              ? 'Ninguna cuenta coincide con la búsqueda.'
              : `${visibles.length} de ${cuentas.length} cuentas coinciden.`}
          </p>
        )}
      </div>

      {mensaje && (
        <p
          role="status"
          className={`mt-4 max-w-2xl rounded-lg px-3 py-2 text-sm ${
            mensaje.error ? 'bg-brand/10 text-brand' : 'bg-ok/10 text-ok'
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      {cargando && <p className="mt-6 text-sm text-muted">Cargando cuentas…</p>}

      {grupos.map((rol) => {
        const filas = visibles.filter((c) => c.rol === rol);
        if (!cargando && filas.length === 0) return null;
        return (
          <div key={rol} className="mt-8">
            <h2 className="font-display text-lg font-bold text-ink">
              {TITULOS[rol]} <span className="text-sm font-normal text-muted">({filas.length})</span>
            </h2>
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
              {filas.map((cuenta) => (
                <li key={cuenta.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{cuenta.nombre}</p>
                      <p className="text-xs text-muted">
                        {cuenta.cargo} · {cuenta.area} · CC {cuenta.id_identificacion}
                      </p>
                      <p className="text-xs text-muted">
                        Usuario <span className="font-mono">{cuenta.usuario}</span> · {cuenta.email} ·
                        Último acceso: {formatearAcceso(cuenta.ultimo_acceso)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        cuenta.activo ? 'bg-ok/10 text-ok' : 'bg-surface text-muted'
                      }`}
                    >
                      {cuenta.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {rol !== 'admin' && (
                      <>
                        <label className="flex items-center gap-1.5 text-sm text-muted">
                          Rol
                          <select
                            value={cuenta.rol}
                            onChange={(e) => void cambiarRol(cuenta, e.target.value as Rol)}
                            className="rounded-lg border border-line bg-white px-2 py-1 text-sm font-medium text-body outline-none transition-colors duration-150 focus:border-brand"
                          >
                            <option value="colaborador">Colaborador</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            reasignando === cuenta.id
                              ? setReasignando(null)
                              : abrirFormulario(cuenta.id)
                          }
                          className="text-sm font-medium text-info hover:underline"
                        >
                          {reasignando === cuenta.id ? 'Cancelar' : 'Reasignar contraseña'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void eliminarColaborador(cuenta)}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          Eliminar colaborador
                        </button>
                      </>
                    )}
                  </div>

                  {reasignando === cuenta.id && (
                    <form
                      className="mt-3 flex flex-wrap items-end gap-3 rounded-xl bg-surface p-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void reasignar(cuenta);
                      }}
                    >
                      <div>
                        <label className="mb-1 block text-xs font-medium text-body" htmlFor={`clave-${cuenta.id}`}>
                          Nueva contraseña
                        </label>
                        <input
                          id={`clave-${cuenta.id}`}
                          type="password"
                          autoComplete="new-password"
                          value={clave}
                          onChange={(e) => setClave(e.target.value)}
                          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-body" htmlFor={`confirma-${cuenta.id}`}>
                          Confirmar contraseña
                        </label>
                        <input
                          id={`confirma-${cuenta.id}`}
                          type="password"
                          autoComplete="new-password"
                          value={confirmacion}
                          onChange={(e) => setConfirmacion(e.target.value)}
                          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        Guardar contraseña
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
