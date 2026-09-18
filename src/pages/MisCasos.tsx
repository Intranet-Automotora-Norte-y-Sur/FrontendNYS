import { useCallback, useEffect, useState } from 'react';
import {
  CAMPO,
  COLOR_ESTADO,
  DECISIONES,
  ESTADOS,
  descargarEvidencia,
  fechaCorta,
  type Caso,
} from '../components/sugerencias/casos';
import { api } from '../lib/api';

/** Seguimiento de un caso propio.
 *
 *  Menos campos que el informe del administrador a propósito: el área y el
 *  responsable no se tocan aquí, reencaminar un caso es decisión suya. */
function Seguimiento({
  caso,
  onGuardado,
}: {
  caso: Caso;
  onGuardado: (actualizado: Caso) => void;
}) {
  const [estado, setEstado] = useState(caso.estado);
  const [decision, setDecision] = useState(caso.decision);
  const [observaciones, setObservaciones] = useState(caso.observaciones);
  const [fechaCierre, setFechaCierre] = useState(caso.fecha_cierre ?? '');
  const [evidencia, setEvidencia] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    setError('');
    setGuardado(false);
    const fd = new FormData();
    fd.append('estado', estado);
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
    setGuardado(true);
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
          ¿Qué se hizo? (observaciones)
        </label>
        <textarea
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Deja constancia de la gestión: a quién se contactó, qué se resolvió."
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
        <label className="mb-1 block text-xs font-semibold text-muted">
          Adjuntar evidencia
        </label>
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
          {guardando ? 'Guardando…' : 'Guardar seguimiento'}
        </button>
        {error && (
          <span role="alert" className="text-xs text-brand">
            {error}
          </span>
        )}
        {guardado && !error && (
          <span role="status" className="text-xs text-ok">
            Seguimiento guardado.
          </span>
        )}
      </div>
    </div>
  );
}

export default function MisCasos() {
  const [casos, setCasos] = useState<Caso[] | null>(null);
  const [abierto, setAbierto] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    const resp = await api.get('/api/sugerencias/mis-casos/');
    setCasos(resp.ok ? ((await resp.json()) as Caso[]) : []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const reemplazar = (actualizado: Caso) =>
    setCasos((prev) =>
      prev ? prev.map((c) => (c.id === actualizado.id ? actualizado : c)) : prev,
    );

  const abiertos = (casos ?? []).filter((c) => c.estado !== 'cerrada');

  return (
    <section aria-labelledby="mis-casos-titulo">
      <h2 id="mis-casos-titulo" className="font-display text-lg font-bold text-ink">
        Casos del buzón asignados a ti
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        {abiertos.length > 0
          ? `Tienes ${abiertos.length} caso${abiertos.length === 1 ? '' : 's'} por resolver. Deja constancia de lo que hiciste en las observaciones y ciérralo cuando quede resuelto.`
          : 'Aquí aparecen las solicitudes del Buzón Digital de Ideas que te asignen.'}
      </p>

      {casos === null ? (
        <p className="mt-4 rounded-2xl border border-line bg-white p-6 text-center text-sm text-muted">
          Cargando…
        </p>
      ) : casos.length === 0 ? (
        <p className="mt-4 max-w-2xl rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          No tienes casos asignados. Cuando te asignen uno te llega un correo y lo verás
          aquí.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {casos.map((c) => (
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
                {c.area_label && (
                  <span className="text-xs text-muted">· {c.area_label}</span>
                )}
                {c.sede_label && (
                  <span className="text-xs text-muted">· {c.sede_label}</span>
                )}
                <time dateTime={c.fecha} className="ml-auto text-xs text-muted">
                  Recibido el {fechaCorta(c.fecha)}
                </time>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-body">{c.mensaje}</p>

              {c.quiere_respuesta && c.correo && (
                <p className="mt-2 rounded-lg bg-info/10 px-3 py-2 text-xs text-info">
                  Quien la escribió pidió respuesta a <strong>{c.correo}</strong>.
                </p>
              )}

              <button
                type="button"
                onClick={() => setAbierto(abierto === c.id ? null : c.id)}
                aria-expanded={abierto === c.id}
                className="mt-3 text-xs font-semibold text-info hover:underline"
              >
                {abierto === c.id ? 'Cerrar seguimiento' : 'Hacer seguimiento'}
              </button>

              {abierto === c.id && <Seguimiento caso={c} onGuardado={reemplazar} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
