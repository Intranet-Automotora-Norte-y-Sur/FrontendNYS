import { useEffect } from 'react';

interface VisorFotoProps {
  src: string;
  nombre: string;
  detalle?: string;
  onCerrar: () => void;
}

/** Muestra la foto de un colaborador ampliada sobre un velo oscuro. */
export function VisorFoto({ src, nombre, detalle, onCerrar }: VisorFotoProps) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${nombre}`}
      onClick={onCerrar}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-6 backdrop-blur-sm"
    >
      <figure
        onClick={(e) => e.stopPropagation()}
        className="max-h-full overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <img
          src={src}
          alt={nombre}
          className="max-h-[75vh] w-auto max-w-[85vw] object-contain"
        />
        <figcaption className="flex items-center justify-between gap-6 px-5 py-3">
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-bold text-ink">
              {nombre}
            </span>
            {detalle && <span className="block truncate text-sm text-muted">{detalle}</span>}
          </span>
          <button
            type="button"
            onClick={onCerrar}
            className="shrink-0 rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold text-body transition-colors duration-150 hover:bg-ink-2/10"
          >
            Cerrar
          </button>
        </figcaption>
      </figure>
    </div>
  );
}
