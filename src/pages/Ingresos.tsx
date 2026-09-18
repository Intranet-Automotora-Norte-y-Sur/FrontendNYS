import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icono } from '../components/ui/Icono';

interface Fila {
  usuario: string;
  nombre: string;
  cedula: string;
  cargo: string;
  area: string;
  sede: string;
  /** false cuando la persona ya no está en nómina: su historial se conserva. */
  vigente: boolean;
  ingresos: number;
  ultimo_ingreso: string;
}

interface Informe {
  desde: string;
  hasta: string;
  total_ingresos: number;
  personas: number;
  filas: Fila[];
}

const hoy = () => new Date().toISOString().slice(0, 10);

const haceDias = (dias: number) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha.toISOString().slice(0, 10);
};

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default function Ingresos() {
  const [desde, setDesde] = useState(haceDias(30));
  const [hasta, setHasta] = useState(hoy());
  const [informe, setInforme] = useState<Informe | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const resp = await api.get(`/api/auth/admin/ingresos/?desde=${desde}&hasta=${hasta}`);
    if (!resp.ok) {
      setError('No se pudo cargar el informe.');
      setCargando(false);
      return;
    }
    setInforme((await resp.json()) as Informe);
    setCargando(false);
  }, [desde, hasta]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const descargar = async () => {
    // Se baja por el wrapper y no con `window.location`: el access token vive
    // en memoria y viaja en la cabecera Authorization, que una navegación del
    // navegador no envía — saldría un 403.
    const resp = await api.get(
      `/api/auth/admin/ingresos/excel/?desde=${desde}&hasta=${hasta}`,
    );
    if (!resp.ok) {
      setError('No se pudo descargar el archivo.');
      return;
    }
    const url = URL.createObjectURL(await resp.blob());
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `ingresos-${desde}-a-${hasta}.xlsx`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="ingresos-titulo">
      <h1 id="ingresos-titulo" className="font-display text-2xl font-bold text-ink">
        Ingresos a la intranet
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Cuántas veces entró cada colaborador en el rango elegido. El registro empieza el
        día que se activó esta vista: no hay datos anteriores.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Desde</span>
          <input
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-lg border border-line px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Hasta</span>
          <input
            type="date"
            value={hasta}
            min={desde}
            max={hoy()}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-lg border border-line px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={() => void descargar()}
          disabled={!informe || informe.filas.length === 0}
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
        >
          <Icono nombre="documento" />
          Descargar Excel
        </button>
      </div>

      {informe && !cargando && (
        <div className="mt-6 flex gap-8">
          <div>
            <p className="font-display text-3xl font-bold text-ink">
              {informe.total_ingresos}
            </p>
            <p className="text-sm text-muted">ingresos</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-ink">{informe.personas}</p>
            <p className="text-sm text-muted">personas distintas</p>
          </div>
        </div>
      )}

      {error && (
        <p role="status" className="mt-6 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
          {error}
        </p>
      )}

      {cargando && <p className="mt-6 text-sm text-muted">Cargando…</p>}

      {informe && !cargando && informe.filas.length === 0 && (
        <p className="mt-6 text-sm text-muted">
          Nadie entró en este rango de fechas.
        </p>
      )}

      {informe && !cargando && informe.filas.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Colaborador</th>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium">Sede</th>
                <th className="px-4 py-3 text-right font-medium">Ingresos</th>
                <th className="px-4 py-3 font-medium">Último</th>
              </tr>
            </thead>
            <tbody>
              {informe.filas.map((fila) => (
                <tr key={fila.usuario} className="border-t border-line">
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink">{fila.nombre}</span>
                    {!fila.vigente && (
                      <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                        Retirado
                      </span>
                    )}
                    <span className="block text-xs text-muted">{fila.cedula}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{fila.cargo || '—'}</td>
                  <td className="px-4 py-3 text-muted">{fila.sede || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">
                    {fila.ingresos}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatoFecha.format(new Date(fila.ultimo_ingreso))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
