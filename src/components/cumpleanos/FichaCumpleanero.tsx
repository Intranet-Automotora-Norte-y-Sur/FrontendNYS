import { useEffect } from 'react';
import type { Cumpleanero } from './CumpleanosMes';

interface FichaCumpleaneroProps {
  persona: Cumpleanero;
  /** Color del monograma cuando la persona no tiene foto. */
  color: string;
  iniciales: string;
  fecha: string;
  onCerrar: () => void;
}

/** Ficha ampliada de un cumpleañero: foto grande y sus datos del directorio. */
export function FichaCumpleanero({
  persona,
  color,
  iniciales,
  fecha,
  onCerrar,
}: FichaCumpleaneroProps) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  const datos = [
    { etiqueta: 'Cargo', valor: persona.cargo },
    { etiqueta: 'Área', valor: persona.area },
    { etiqueta: 'Sede', valor: persona.sede },
  ].filter((d) => Boolean(d.valor));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha de ${persona.nombre}`}
      onClick={onCerrar}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-6 backdrop-blur-sm"
    >
      <article
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-sm overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <div className="relative aspect-[4/5] w-full">
          {persona.foto ? (
            <img
              src={persona.foto}
              alt={persona.nombre}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid h-full w-full place-items-center font-display text-7xl font-extrabold text-white"
              style={{ backgroundColor: color }}
            >
              {iniciales}
            </span>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-brand shadow-sm">
            {persona.es_hoy ? '¡Hoy cumple! 🎉' : fecha}
          </span>
        </div>

        <div className="p-6">
          <h3 className="font-display text-2xl font-extrabold leading-tight text-ink">
            {persona.nombre}
          </h3>

          <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
            {datos.map((d) => (
              <div key={d.etiqueta} className="flex gap-4">
                <dt className="w-16 shrink-0 text-xs uppercase tracking-wide text-muted">
                  {d.etiqueta}
                </dt>
                <dd className="font-semibold text-ink">{d.valor}</dd>
              </div>
            ))}
          </dl>

          <button
            type="button"
            autoFocus
            onClick={onCerrar}
            className="mt-6 w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-ink-2"
          >
            Cerrar
          </button>
        </div>
      </article>
    </div>
  );
}
