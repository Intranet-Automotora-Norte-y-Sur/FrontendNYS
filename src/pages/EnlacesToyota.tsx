import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIAS } from '../components/comunicados/ComunicadoCard';
import { InsigniaImportancia } from '../components/ui/InsigniaImportancia';
import { htmlSeguro, listarPublicados, rutaMedia, type Contenido } from '../lib/contenido';

/** Anchos del Panel traducidos a columnas de la rejilla de seis. */
const COLUMNAS: Record<string, string> = {
  tercio: 'lg:col-span-2',
  medio: 'lg:col-span-3',
  dostercios: 'lg:col-span-4',
  completo: 'lg:col-span-6',
};

/** Enlaces Toyota: tarjetas administrables desde el Panel (sección
 *  «Enlaces Toyota»). Una tarjeta con documentos adjuntos abre su galería
 *  (p. ej. fichas técnicas); una tarjeta con enlace abre pestaña nueva.
 *
 *  Respeta lo que se configura en el Panel —categoría, importancia, ancho,
 *  estilo y cuerpo—, igual que las demás secciones. Antes esta página los
 *  ignoraba: se guardaban pero no se veían. */
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
        <div className="mt-5 grid gap-5 lg:grid-cols-6">
          {items.map((item) => {
            const numDocs = item.adjuntos?.length ?? 0;
            const esGaleria = numDocs > 0;
            const categoria = CATEGORIAS[item.categoria ?? 'general'] ?? CATEGORIAS.general;
            const portada = item.imagen_portada ?? item.miniatura ?? null;
            const esMosaico = item.estilo === 'mosaico' && !!portada;
            const esLado = item.estilo === 'lado' && !!portada;
            const clases = `group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand ${
              COLUMNAS[item.ancho ?? 'medio'] ?? COLUMNAS.medio
            }`;

            const cuerpo = item.cuerpo?.trim() ? (
              // Se guarda como HTML: aplanarlo a texto perdía listas, enlaces
              // y negritas. Pasa por htmlSeguro aunque el backend ya sanee con
              // nh3 — la misma doble barrera que usan las demás secciones.
              <div
                className="prosa mt-2 text-sm"
                dangerouslySetInnerHTML={{ __html: htmlSeguro(item.cuerpo) }}
              />
            ) : null;

            const interior = esMosaico ? (
              <div className="relative min-h-52">
                <img
                  src={rutaMedia(portada ?? '')}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
                <div className="relative flex min-h-52 flex-col justify-end gap-3 p-5">
                  {item.importancia && (
                    <p className="w-fit">
                      <InsigniaImportancia nivel={item.importancia} sobreImagen />
                    </p>
                  )}
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white drop-shadow">
                    {item.titulo} <span aria-hidden="true">↗</span>
                  </h2>
                  {esGaleria && (
                    <p className="w-fit rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {numDocs} documento{numDocs === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="h-1.5 shrink-0" style={{ background: categoria.color }} />
                <div className={esLado ? 'flex flex-1 gap-4' : 'flex flex-1 flex-col'}>
                  {portada && (
                    <img
                      src={rutaMedia(portada)}
                      alt=""
                      loading="lazy"
                      className={
                        esLado
                          ? 'w-40 shrink-0 self-stretch object-cover'
                          : 'h-32 w-full object-cover'
                      }
                    />
                  )}
                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="shrink-0 text-xs font-bold uppercase tracking-wide"
                        style={{ color: categoria.color }}
                      >
                        {categoria.nombre}
                      </span>
                      {item.importancia && (
                        <InsigniaImportancia nivel={item.importancia} />
                      )}
                    </div>
                    <p className="mt-1 font-display text-lg font-bold text-ink group-hover:text-brand">
                      {item.titulo} <span aria-hidden="true">↗</span>
                    </p>
                    {cuerpo}
                    {esGaleria && (
                      <p className="mt-2 inline-block rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                        {numDocs} documento{numDocs === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                </div>
              </>
            );

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
