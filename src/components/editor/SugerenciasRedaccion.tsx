import { useState } from 'react';

import { api } from '../../lib/api';
import { Icono } from '../ui/Icono';

interface Propuesta {
  titular: string;
  resumen: string;
  tarjeta: string;
}

interface SugerenciasRedaccionProps {
  /** Borrador actual, en HTML: es lo que se manda a resumir. */
  cuerpo: string;
  /** Reemplaza el título del formulario por el propuesto. */
  onUsarTitular: (titular: string) => void;
}

const MINIMO_CARACTERES = 40;

function soloTexto(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Propone titular, resumen y texto de tarjeta para el borrador abierto.
 *
 * Es una ayuda, no un publicador: el editor revisa y decide. Nada se guarda
 * hasta que él guarda el contenido. */
export function SugerenciasRedaccion({ cuerpo, onUsarTitular }: SugerenciasRedaccionProps) {
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pensando, setPensando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  const texto = soloTexto(cuerpo);
  const suficiente = texto.length >= MINIMO_CARACTERES;

  const pedir = async () => {
    setPensando(true);
    setError(null);
    const resp = await api.post('/api/asistente/redactar/', { texto });
    setPensando(false);
    if (!resp.ok) {
      setError(
        resp.status === 429
          ? 'Alcanzaste el límite de propuestas por hoy.'
          : 'No se pudo generar la propuesta. Intenta de nuevo.',
      );
      return;
    }
    setPropuesta((await resp.json()) as Propuesta);
  };

  const copiar = async (clave: string, valor: string) => {
    await navigator.clipboard.writeText(valor);
    setCopiado(clave);
    window.setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <section className="mt-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Icono nombre="chispas" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-bold text-ink">Ayuda para redactar</h3>
          {/* El motivo por el que el botón está apagado va en pantalla, no en
              un `title`: quien no pasa el mouse por encima cree que está roto. */}
          <p className="text-xs text-muted">
            {suficiente
              ? 'Propone titular, resumen y texto de tarjeta. Tú revisas y decides.'
              : `Escribe el cuerpo primero: faltan ${MINIMO_CARACTERES - texto.length} caracteres para poder proponer.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void pedir()}
          disabled={pensando || !suficiente}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
        >
          {pensando ? 'Pensando…' : 'Proponer'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-brand">
          {error}
        </p>
      )}

      {propuesta && (
        <dl className="mt-4 grid gap-3">
          <div className="rounded-xl border border-line bg-white p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-faint">Titular</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                {propuesta.titular}
              </span>
              <button
                type="button"
                onClick={() => onUsarTitular(propuesta.titular)}
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-body transition-colors duration-150 hover:border-brand hover:text-brand"
              >
                Usar
              </button>
            </dd>
          </div>

          {(
            [
              ['resumen', 'Resumen', propuesta.resumen],
              ['tarjeta', 'Texto de tarjeta', propuesta.tarjeta],
            ] as const
          ).map(([clave, etiqueta, valor]) => (
            <div key={clave} className="rounded-xl border border-line bg-white p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                {etiqueta}
              </dt>
              <dd className="mt-1 flex flex-wrap items-start gap-2">
                <span className="min-w-0 flex-1 text-sm text-body">{valor}</span>
                <button
                  type="button"
                  onClick={() => void copiar(clave, valor)}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-body transition-colors duration-150 hover:border-brand hover:text-brand"
                >
                  {copiado === clave ? 'Copiado' : 'Copiar'}
                </button>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
