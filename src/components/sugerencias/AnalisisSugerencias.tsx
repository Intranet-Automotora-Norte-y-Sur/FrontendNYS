import { useState } from 'react';

import { api } from '../../lib/api';
import { Icono } from '../ui/Icono';

interface Tema {
  tema: string;
  cantidad: number;
  resumen: string;
}

interface Urgente {
  texto: string;
  motivo: string;
}

interface Analisis {
  temas: Tema[];
  urgentes: Urgente[];
  conclusion: string;
  analizadas: number;
}

/** Agrupa el buzón por tema y señala lo urgente, para saber por dónde empezar.
 *
 * Es una lectura de apoyo, no una clasificación oficial: no se guarda y quien
 * administra decide qué hacer con ella. */
export function AnalisisSugerencias({ haySugerencias }: { haySugerencias: boolean }) {
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState(false);

  const analizar = async () => {
    setAnalizando(true);
    setError(null);
    const resp = await api.post('/api/asistente/sugerencias/');
    setAnalizando(false);
    if (!resp.ok) {
      setError(
        resp.status === 429
          ? 'Alcanzaste el límite de análisis por hoy.'
          : 'No se pudo analizar el buzón. Intenta de nuevo.',
      );
      return;
    }
    setAnalisis((await resp.json()) as Analisis);
  };

  return (
    <section className="mt-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Icono nombre="chispas" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-bold text-ink">Lectura del buzón</h3>
          <p className="text-xs text-muted">
            Agrupa las sugerencias por tema y señala lo urgente. No se guarda nada.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void analizar()}
          disabled={analizando || !haySugerencias}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
        >
          {analizando ? 'Leyendo…' : 'Analizar'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-brand">
          {error}
        </p>
      )}

      {analisis && (
        <div className="mt-4 grid gap-3">
          {analisis.urgentes.length > 0 && (
            <div className="rounded-xl border border-brand bg-white p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-brand">
                Requiere atención
              </h4>
              <ul className="mt-2 grid gap-2">
                {analisis.urgentes.map((u) => (
                  <li key={u.texto} className="text-sm text-body">
                    <span className="font-medium text-ink">«{u.texto}»</span> — {u.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analisis.temas.map((t) => (
            <div key={t.tema} className="rounded-xl border border-line bg-white p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-display text-sm font-bold text-ink">{t.tema}</h4>
                <span className="text-xs text-muted">
                  {t.cantidad} sugerencia{t.cantidad === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mt-1 text-sm text-body">{t.resumen}</p>
            </div>
          ))}

          {analisis.conclusion && (
            <p className="text-sm font-medium text-ink">{analisis.conclusion}</p>
          )}

          <p className="text-xs text-faint">
            Sobre {analisis.analizadas} sugerencia{analisis.analizadas === 1 ? '' : 's'}.
            Revísalo antes de tomar decisiones.
          </p>
        </div>
      )}
    </section>
  );
}
