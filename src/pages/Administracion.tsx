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

interface ResultadoImport {
  creados: number;
  actualizados: number;
  errores: string[];
}

interface ResultadoFotos {
  asignadas: number;
  sin_coincidencia: string[];
  ignoradas: string[];
}

const TITULOS: Record<Rol, string> = {
  colaborador: 'Colaboradores',
  editor: 'Editores',
  admin: 'Administradores',
};

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

  const cargar = useCallback(async () => {
    const resp = await api.get('/api/auth/admin/usuarios/');
    if (resp.ok) setCuentas((await resp.json()) as Cuenta[]);
    setCargando(false);
  }, []);

  const [resultado, setResultado] = useState<ResultadoImport | null>(null);
  const [importando, setImportando] = useState(false);
  const [resultadoFotos, setResultadoFotos] = useState<ResultadoFotos | null>(null);
  const [subiendoZip, setSubiendoZip] = useState(false);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const importarCsv = async (archivo: File) => {
    setImportando(true);
    setResultado(null);
    const fd = new FormData();
    fd.append('archivo', archivo);
    const resp = await api.postForm('/api/auth/admin/empleados/importar/', fd);
    setImportando(false);
    if (!resp.ok) {
      const datos = (await resp.json().catch(() => null)) as { detail?: string } | null;
      setMensaje({ texto: datos?.detail ?? 'No se pudo importar el archivo.', error: true });
      return;
    }
    setResultado((await resp.json()) as ResultadoImport);
  };

  const importarFotosZip = async (archivo: File) => {
    setSubiendoZip(true);
    setResultadoFotos(null);
    const fd = new FormData();
    fd.append('archivo', archivo);
    const resp = await api.postForm('/api/auth/admin/empleados/fotos/', fd);
    setSubiendoZip(false);
    if (!resp.ok) {
      const datos = (await resp.json().catch(() => null)) as { detail?: string } | null;
      setMensaje({ texto: datos?.detail ?? 'No se pudieron cargar las fotos.', error: true });
      return;
    }
    setResultadoFotos((await resp.json()) as ResultadoFotos);
  };

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

  return (
    <section aria-labelledby="admin-titulo">
      <h1 id="admin-titulo" className="sr-only">Administración de cuentas</h1>
      <p className="max-w-2xl text-sm text-muted">
        Cuentas activas de la intranet. Puedes reasignar la contraseña de colaboradores y
        editores, y designar quién es editor o administrador — todos entran como
        colaboradores. Las cuentas que ya son de administrador se gestionan desde el admin
        de Django. Para agregar un colaborador, cambiar su foto, darlo de baja o eliminarlo,
        entra a «Nuestra gente»; aquí solo quedan las cargas masivas.
      </p>

      {/* Carga masiva de colaboradores por CSV */}
      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Cargar colaboradores (CSV)</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Sube la lista de colaboradores. Se actualizan por cédula (no se duplican).
          Columnas: <span className="font-mono text-xs">id_identificacion, nombre, cargo, area,
          fecha_nacimiento, fecha_ingreso, tipo_contrato</span> y, opcionales,{' '}
          <span className="font-mono text-xs">salario, sede</span>. Las fechas en formato AAAA-MM-DD.
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          {importando ? 'Importando…' : 'Seleccionar archivo CSV'}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={importando}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) void importarCsv(archivo);
              e.target.value = '';
            }}
          />
        </label>

        {resultado && (
          <div className="mt-4 rounded-xl bg-surface p-4 text-sm">
            <p className="font-medium text-ink">
              Creados: {resultado.creados} · Actualizados: {resultado.actualizados} · Errores:{' '}
              {resultado.errores.length}
            </p>
            {resultado.errores.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-brand">
                {resultado.errores.slice(0, 10).map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Carga masiva de fotos por ZIP */}
      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Cargar fotos en lote (ZIP)</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Sube un <span className="font-mono text-xs">.zip</span> con las fotos nombradas por
          cédula (<span className="font-mono text-xs">123456.jpg</span>). Cada imagen se asigna
          sola al colaborador con esa cédula. Formatos: JPG, PNG o WEBP (máx. 8 MB c/u).
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          {subiendoZip ? 'Cargando fotos…' : 'Seleccionar archivo ZIP'}
          <input
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            disabled={subiendoZip}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) void importarFotosZip(archivo);
              e.target.value = '';
            }}
          />
        </label>

        {resultadoFotos && (
          <div className="mt-4 rounded-xl bg-surface p-4 text-sm">
            <p className="font-medium text-ink">
              Asignadas: {resultadoFotos.asignadas} · Sin coincidencia:{' '}
              {resultadoFotos.sin_coincidencia.length} · Ignoradas:{' '}
              {resultadoFotos.ignoradas.length}
            </p>
            {resultadoFotos.sin_coincidencia.length > 0 && (
              <p className="mt-2 text-muted">
                Cédulas sin colaborador:{' '}
                <span className="font-mono text-xs">
                  {resultadoFotos.sin_coincidencia.slice(0, 15).join(', ')}
                </span>
              </p>
            )}
          </div>
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
        const filas = cuentas.filter((c) => c.rol === rol);
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
