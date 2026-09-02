import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { AnalisisSugerencias } from './AnalisisSugerencias';

export interface Caso {
  id: number;
  fecha: string;
  sede: string;
  /** «Acopi»; el campo `sede` guarda el código («acopi»). */
  sede_label: string;
  anonimo: boolean;
  autor: string;
  correo: string;
  quiere_respuesta: boolean;
  tipo: string;
  tipo_label: string;
  mensaje: string;
  estado: string;
  estado_label: string;
  area_responsable: string;
  area_label: string;
  responsable: string;
  decision: string;
  decision_label: string;
  observaciones: string;
  fecha_cierre: string | null;
  evidencia: string | null;
}

const ESTADOS = [
  { valor: 'recibida', etiqueta: 'Recibida' },
  { valor: 'en_revision', etiqueta: 'En revisión' },
  { valor: 'asignada', etiqueta: 'Asignada al área' },
  { valor: 'cerrada', etiqueta: 'Cerrada' },
];

const AREAS = [
  { valor: 'gestion_humana', etiqueta: 'Gestión Humana' },
  { valor: 'calidad_kaizen', etiqueta: 'Calidad y Kaizen' },
];

const DECISIONES = [
  { valor: 'aprobada', etiqueta: 'Aprobada' },
  { valor: 'rechazada', etiqueta: 'Rechazada' },
];

const TIPOS = [
  { valor: 'queja', etiqueta: 'Queja' },
  { valor: 'sugerencia', etiqueta: 'Sugerencia' },
  { valor: 'mejora', etiqueta: 'Oportunidad de mejora' },
  { valor: 'felicitacion', etiqueta: 'Felicitación' },
];

/** Color por estado. El estado es lo que más se escanea en una lista larga. */
const COLOR_ESTADO: Record<string, string> = {
  recibida: 'bg-warn/15 text-body',
  en_revision: 'bg-info/15 text-info',
  asignada: 'bg-ok/15 text-ok',
  cerrada: 'bg-ink/10 text-muted',
};

const CAMPO =
  'w-full rounded-lg border border-line px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-brand';

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Panel de gestión de un caso. Solo toca los campos del administrador. */
function Gestion({
  caso,
  onGuardado,
}: {
  caso: Caso;
  onGuardado: (actualizado: Caso) => void;
}) {
  const [estado, setEstado] = useState(caso.estado);
  const [area, setArea] = useState(caso.area_responsable);
  const [responsable, setResponsable] = useState(caso.responsable);
  const [decision, setDecision] = useState(caso.decision);
  const [observaciones, setObservaciones] = useState(caso.observaciones);
  const [fechaCierre, setFechaCierre] = useState(caso.fecha_cierre ?? '');
  const [evidencia, setEvidencia] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    setGuardando(true);
    setError('');
    // FormData y no JSON: la evidencia es un archivo. Los campos de texto van
    // igual aunque estén vacíos, para poder borrar una decisión puesta por error.
    const fd = new FormData();
    fd.append('estado', estado);
    fd.append('area_responsable', area);
    fd.append('responsable', responsable);
    fd.append('decision', decision);
    fd.append('observaciones', observaciones);
    if (fechaCierre) fd.append('fecha_cierre', fechaCierre);
    if (evidencia) fd.append('evidencia', evidencia);

    const resp = await api.patchForm(`/api/sugerencias/${caso.id}/`, fd);
    setGuardando(false);
    if (!resp.ok) {
      setError('No se pudo guardar. Revisa los campos.');
      return;
    }
    onGuardado((await resp.json()) as Caso);
  };

  return (
    <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Estado</label>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className={CAMPO}
        >
          {ESTADOS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">
          Área responsable
        </label>
        <select value={area} onChange={(e) => setArea(e.target.value)} className={CAMPO}>
          <option value="">Sin asignar</option>
          {AREAS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">
          Responsable del caso
        </label>
        <input
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
          className={CAMPO}
          placeholder="Nombre de quien atiende"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">
          Decisión del área
        </label>
        <select
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          className={CAMPO}
        >
          <option value="">Sin decidir</option>
          {DECISIONES.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-semibold text-muted">
          Observaciones del área
        </label>
        <textarea
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className={`${CAMPO} resize-y`}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">
          Fecha de cierre
        </label>
        <input
          type="date"
          value={fechaCierre}
          onChange={(e) => setFechaCierre(e.target.value)}
          className={CAMPO}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Evidencia</label>
        <input
          type="file"
          onChange={(e) => setEvidencia(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-ink/5 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-body"
        />
        {caso.evidencia && (
          <a
            href={caso.evidencia}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-semibold text-info hover:underline"
          >
            Ver evidencia cargada
          </a>
        )}
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={guardando}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar gestión'}
        </button>
        {error && (
          <span role="alert" className="text-xs text-brand">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

export function InformeBuzon() {
  const [casos, setCasos] = useState<Caso[] | null>(null);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const cargar = useCallback(async () => {
    const resp = await api.get('/api/sugerencias/');
    setCasos(resp.ok ? ((await resp.json()) as Caso[]) : []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Los filtros se aplican en memoria: son pocos casos y así no hay ida y
  // vuelta al servidor por cada cambio de selector.
  const visibles = useMemo(
    () =>
      (casos ?? []).filter(
        (c) =>
          (!filtroEstado || c.estado === filtroEstado) &&
          (!filtroTipo || c.tipo === filtroTipo),
      ),
    [casos, filtroEstado, filtroTipo],
  );

  const reemplazar = (actualizado: Caso) =>
    setCasos((prev) =>
      prev ? prev.map((c) => (c.id === actualizado.id ? actualizado : c)) : prev,
    );

  return (
    <section aria-labelledby="informe-titulo">
      <h2 id="informe-titulo" className="font-display text-lg font-bold text-ink">
        Buzón Digital de Ideas — informe
      </h2>
      <p className="mt-1 text-sm text-muted">
        Visible solo para administradores. Las solicitudes anónimas no guardan autor.
      </p>

      <AnalisisSugerencias haySugerencias={(casos?.length ?? 0) > 0} />

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          aria-label="Filtrar por estado"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className={`${CAMPO} max-w-[14rem]`}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por tipo"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className={`${CAMPO} max-w-[14rem]`}
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </div>

      {casos === null ? (
        <p className="mt-4 rounded-2xl border border-line bg-white p-6 text-center text-sm text-muted">
          Cargando…
        </p>
      ) : visibles.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          No hay solicitudes con esos filtros.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {visibles.map((c) => (
            <li key={c.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-bold text-body">
                  #{c.id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    COLOR_ESTADO[c.estado] ?? 'bg-ink/10 text-muted'
                  }`}
                >
                  {c.estado_label}
                </span>
                <span className="text-xs font-semibold text-brand">{c.tipo_label}</span>
                {c.sede_label && (
                  <span className="text-xs text-muted">· {c.sede_label}</span>
                )}
                <time dateTime={c.fecha} className="ml-auto text-xs text-muted">
                  {fechaCorta(c.fecha)}
                </time>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-body">{c.mensaje}</p>

              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                <div className="flex gap-1">
                  <dt>Autor:</dt>
                  <dd className="font-medium text-body">{c.autor}</dd>
                </div>
                {c.quiere_respuesta && (
                  <div className="flex gap-1">
                    <dt>Pide respuesta a:</dt>
                    <dd className="font-medium text-body">{c.correo || '—'}</dd>
                  </div>
                )}
                {c.area_label && (
                  <div className="flex gap-1">
                    <dt>Área:</dt>
                    <dd className="font-medium text-body">{c.area_label}</dd>
                  </div>
                )}
                {c.decision_label && (
                  <div className="flex gap-1">
                    <dt>Decisión:</dt>
                    <dd className="font-medium text-body">{c.decision_label}</dd>
                  </div>
                )}
              </dl>

              <button
                type="button"
                onClick={() => setAbierto(abierto === c.id ? null : c.id)}
                aria-expanded={abierto === c.id}
                className="mt-3 text-xs font-semibold text-info hover:underline"
              >
                {abierto === c.id ? 'Cerrar gestión' : 'Gestionar caso'}
              </button>

              {abierto === c.id && <Gestion caso={c} onGuardado={reemplazar} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
