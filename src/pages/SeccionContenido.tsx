import { useEffect, useState } from 'react';
import { CATEGORIAS } from '../components/comunicados/ComunicadoCard';
import {
  htmlSeguro,
  listarPublicados,
  type Contenido,
  type Seccion,
} from '../lib/contenido';

interface Props {
  seccion: Seccion;
  titulo: string;
  descripcion: string;
}

export function SeccionContenido({ seccion, titulo, descripcion }: Props) {
  const [items, setItems] = useState<Contenido[] | null>(null);

  useEffect(() => {
    setItems(null);
    void listarPublicados(seccion).then(setItems);
  }, [seccion]);

  return (
    <section aria-labelledby="seccion-titulo">
      <h1 id="seccion-titulo" className="sr-only">{titulo}</h1>
      <p className="max-w-xl text-sm text-muted">{descripcion}</p>

      {items === null && <p className="mt-6 text-sm text-muted">Cargando…</p>}

      {items?.length === 0 && (
        <p className="mt-6 max-w-2xl rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          Aún no hay publicaciones en esta sección.
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-6">
        {items?.map((item) => {
          const categoria = CATEGORIAS[item.categoria ?? 'general'] ?? CATEGORIAS.general;
          return (
            <article
              key={item.id}
              className={`flex flex-col overflow-hidden rounded-2xl border border-line bg-white ${
                { tercio: 'lg:col-span-2', medio: 'lg:col-span-3', dostercios: 'lg:col-span-4', completo: 'lg:col-span-6' }[
                  item.ancho ?? 'completo'
                ]
              }`}
            >
              <div className="h-1.5 shrink-0" style={{ background: categoria.color }} />
              {item.imagen_portada && (
                <img
                  src={item.imagen_portada}
                  alt=""
                  loading="lazy"
                  className="max-h-64 w-full object-cover"
                />
              )}
              <div className="flex-1 p-6">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-ink">{item.titulo}</h2>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wide" style={{ color: categoria.color }}>
                    {categoria.nombre}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  Actualizado el {new Date(item.actualizado_en).toLocaleDateString('es-CO')}
                </p>
                <div
                  className="prosa mt-3"
                  dangerouslySetInnerHTML={{ __html: htmlSeguro(item.cuerpo) }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
