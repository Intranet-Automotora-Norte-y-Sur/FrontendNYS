import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { AnalisisSugerencias } from './AnalisisSugerencias';
import { SelectorResponsable } from './SelectorResponsable';
import {
  CAMPO,
  COLOR_ESTADO,
  DECISIONES,
  ESTADOS,
  TIPOS,
  cargarAreas,
  descargarEvidencia,
  fechaCorta,
  type Caso,
  type Opcion,
} from './casos';

export type { Caso } from './casos';

/** Panel de gestión de un caso. Solo toca los campos del administrador. */
function Gestion({
  caso,
  areas,
  onGuardado,
}: {
  caso: Caso;
  areas: Opcion[];
  onGuardado: (actualizado: Caso) => void;
}) {
  const [estado, setEstado] = useState(caso.estado);
  const [area, setArea] = useState(caso.area_responsable);
  const [responsableId, setResponsableId] = useState<number | null>(caso.responsable_id);
  const [responsable, setResponsable] = useState(caso.responsable);
  const [decision, setDecision] = useState(caso.decision);
  const [observaciones, setObservaciones] = useState(caso.observaciones);
  const [fechaCierre, setFechaCierre] = useState(caso.fecha_cierre ?? '');
  const [evidencia, setEvidencia] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const guardar = async () => {
    setGuardando(true);
    setError('');
    setAviso('');
    // FormData y no JSON: la evidencia es un archivo. Los campos de texto van
    // igual aunque estén vacíos, para poder borrar una decisión puesta por error.
    const fd = new FormData();
    fd.append('estado', estado);
    fd.append('area_responsable', area);
    // Cadena vacía y no "null": es como DRF lee un null en multipart.
    fd.append('responsable_id', responsableId === null ? '' : String(responsableId));
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
    const actualizado = (await resp.json()) as Caso;
    // El caso quedó asignado aunque el correo fallara: si no se dice, el
    // administrador da por hecho que a la persona ya le avisaron.
    if (actualizado.aviso) setAviso(actualizado.aviso);
    onGuardado(actualizado);
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
          {areas.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-semibold text-muted">
          Responsable del caso
        </label>
        <SelectorResponsable
          valor={responsableId}
          nombreActual={responsable}
          onCambio={(id, nombre) => {
            setResponsableId(id);
            setResponsable(nombre);
          }}
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
        <label className="mb-1 block text-xs font-semibold text-muted">Evidencia</label>
        <input
          type="file"
          onChange={(e) => setEvidencia(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-ink/5 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-body"
        />
        {caso.evidencia && (
          <button
            type="button"
            onClick={() => void descargarEvidencia(caso)}
            className="mt-1 inline-block text-xs font-semibold text-info hover:underline"
          >
            Descargar evidencia cargada
          </button>
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
        {aviso && (
          <span role="alert" className="text-xs text-warn">
            {aviso}
          </span>
        )}
      </div>
    </div>
  );
}

export function InformeBuzon() {
  const [casos, setCasos] = useState<Caso[] | null>(null);
  const [areas, setAreas] = useState<Opcion[]>([]);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const cargar = useCallback(async () => {
    const resp = await api.get('/api/sugerencias/');
    setCasos(resp.ok ? ((await resp.json()) as Caso[]) : []);
  }, []);

  useEffect(() => {
    void cargar();
    void cargarAreas().then(setAreas);
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
                {c.responsable && (
                  <div className="flex gap-1">
                    <dt>Responsable:</dt>
                    <dd className="font-medium text-body">{c.responsable}</dd>
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

              {abierto === c.id && (
                <Gestion caso={c} areas={areas} onGuardado={reemplazar} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
