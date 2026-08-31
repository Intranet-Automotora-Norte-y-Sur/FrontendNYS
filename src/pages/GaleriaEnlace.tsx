import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listarPublicados, rutaMedia, type Contenido } from '../lib/contenido';

/** Formatea bytes como «PDF · 120 KB» / «PDF · 1.2 MB». */
function etiquetaArchivo(bytes?: number | null): string {
  if (!bytes) return 'PDF';
  const kb = bytes / 1024;
  if (kb >= 1024) return `PDF · ${(kb / 1024).toFixed(1)} MB`;
  return `PDF · ${Math.round(kb)} KB`;
}

/** Galería de documentos de una tarjeta de Enlaces Toyota (p. ej. fichas
 *  técnicas): cada adjunto se muestra con la miniatura de su 1ª página. */
export function GaleriaEnlace() {
  const { id } = useParams();
  const [item, setItem] = useState<Contenido | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    void listarPublicados('enlaces_toyota')
      .then((lista) => {
        if (!activo) return;
        setItem(lista.find((c) => c.id === Number(id)) ?? null);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) {
    return <p className="text-sm text-muted">Cargando documentos…</p>;
  }

  if (!item) {
    return (
      <section>
        <p className="text-sm text-muted">No se encontró esta colección de documentos.</p>
        <Link to="/enlaces" className="mt-2 inline-block text-sm font-bold text-brand hover:underline">
          ‹ Volver a enlaces
        </Link>
      </section>
    );
  }

  const adjuntos = item.adjuntos ?? [];

  return (
    <section aria-labelledby="galeria-titulo">
      <Link to="/enlaces" className="text-sm font-medium text-muted hover:text-brand">
        ‹ Volver a enlaces
      </Link>
      <div className="mt-2 flex items-baseline gap-3">
        <h1 id="galeria-titulo" className="font-display text-2xl font-bold text-ink">
          {item.titulo}
        </h1>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
          {adjuntos.length} documento{adjuntos.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        La previsualización corresponde a la portada de cada documento. Se abren en una pestaña nueva.
      </p>

      {adjuntos.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Aún no hay documentos en esta colección.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {adjuntos.map((adj) => (
            <a
              key={adj.id}
              href={rutaMedia(adj.archivo)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-lg focus-visible:outline-2 focus-visible:outline-brand"
            >
              <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-ink">
                {adj.miniatura ? (
                  <img
                    src={rutaMedia(adj.miniatura)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-4xl text-white/30" aria-hidden="true">
                    📄
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-4 pb-3 pt-10">
                  <p className="font-display text-base font-bold text-white drop-shadow">{adj.titulo}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-[9px] font-bold text-brand">
                    PDF
                  </span>
                  {etiquetaArchivo(adj.tamano)}
                </span>
                <span aria-hidden="true" className="text-muted transition-colors group-hover:text-brand">
                  ↗
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
