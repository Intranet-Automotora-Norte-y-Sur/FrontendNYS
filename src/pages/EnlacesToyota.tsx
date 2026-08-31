import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarPublicados, rutaMedia, type Contenido } from '../lib/contenido';

/** Texto plano del cuerpo HTML (para la descripción corta de la tarjeta). */
function resumen(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Enlaces Toyota: tarjetas administrables desde el Panel (sección
 *  «Enlaces Toyota»). Una tarjeta con documentos adjuntos abre su galería
 *  (p. ej. fichas técnicas); una tarjeta con enlace abre pestaña nueva. */
export function EnlacesToyota() {
  const [items, setItems] = useState<Contenido[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void listarPublicados('enlaces_toyota')
      .then(setItems)
      .finally(() => setCargando(false));
  }, []);

  return (
    <section aria-labelledby="enlaces-titulo">
      <h1 id="enlaces-titulo" className="sr-only">Enlaces Toyota</h1>
      <p className="max-w-xl text-sm text-muted">
        Accesos directos a herramientas y catálogos de la marca. Cada tarjeta redirige a su recurso.
      </p>

      {cargando ? (
        <p className="mt-5 text-sm text-muted">Cargando enlaces…</p>
      ) : items.length === 0 ? (
        <p className="mt-5 text-sm text-muted">
          Aún no hay enlaces publicados. Se cargan desde el Panel de edición.
        </p>
      ) : (
        <div className="mt-5 grid max-w-4xl gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const numDocs = item.adjuntos?.length ?? 0;
            const esGaleria = numDocs > 0;
            const desc = resumen(item.cuerpo);
            const portada = item.imagen_portada ?? item.miniatura ?? null;
            const interior = (
              <>
                {portada && (
                  <img
                    src={rutaMedia(portada)}
                    alt=""
                    loading="lazy"
                    className="h-32 w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <p className="font-display text-lg font-bold text-ink group-hover:text-brand">
                    {item.titulo} <span aria-hidden="true">↗</span>
                  </p>
                  {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
                  {esGaleria && (
                    <p className="mt-2 inline-block rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                      {numDocs} documento{numDocs === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              </>
            );
            const clases =
              'group overflow-hidden rounded-2xl border border-line bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand';

            return esGaleria ? (
              <Link key={item.id} to={`/enlaces/${item.id}`} className={clases}>
                {interior}
              </Link>
            ) : (
              <a
                key={item.id}
                href={item.enlace || (item.archivo ? rutaMedia(item.archivo) : '#')}
                target="_blank"
                rel="noopener noreferrer"
                className={clases}
              >
                {interior}
              </a>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        ¿Falta un enlace? Pídelo por el buzón de sugerencias.
      </p>
    </section>
  );
}
