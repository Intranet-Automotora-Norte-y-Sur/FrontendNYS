import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORIAS } from '../components/comunicados/ComunicadoCard';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import {
  htmlSeguro,
  listarPublicados,
  rutaMedia,
  urlEmbed,
  type Adjunto,
  type Contenido,
  type Seccion,
} from '../lib/contenido';

/** Bloques de recursos de una tarjeta: video subido o embebido. */
function RecursosTarjeta({ item }: { item: Contenido }) {
  return (
    <>
      {item.video && (
        <video controls preload="metadata" className="w-full bg-black">
          <source src={item.video} />
          Tu navegador no puede reproducir este video.
        </video>
      )}
      {!item.video && item.video_url && (
        <div className="aspect-video w-full">
          <iframe
            src={urlEmbed(item.video_url)}
            title={item.titulo}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
    </>
  );
}

const esPdf = (url: string) => url.split('?')[0].toLowerCase().endsWith('.pdf');

/** Modal con los documentos de una tarjeta: lista + vista previa (PDF) y,
 *  para editores/admins, carga y retiro de documentos sin pasar por el Panel. */
function ModalDocumentos({
  item,
  onCerrar,
  onActualizar,
}: {
  item: Contenido;
  onCerrar: () => void;
  onActualizar: () => Promise<void>;
}) {
  const { usuario } = useAuth();
  const puedeEditar = usuario !== null && usuario.rol !== 'colaborador';
  const adjuntos = item.adjuntos ?? [];
  const [seleccionado, setSeleccionado] = useState<Adjunto | null>(adjuntos[0] ?? null);
  const [titulo, setTitulo] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  // Si la lista cambió (subida/retiro), mantener una selección válida
  useEffect(() => {
    if (seleccionado && !adjuntos.some((a) => a.id === seleccionado.id)) {
      setSeleccionado(adjuntos[0] ?? null);
    }
    if (!seleccionado && adjuntos.length > 0) setSeleccionado(adjuntos[0]);
  }, [adjuntos, seleccionado]);

  const subir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !archivo) {
      setError('El documento necesita título y archivo.');
      return;
    }
    setSubiendo(true);
    setError(null);
    const datos = new FormData();
    datos.append('titulo', titulo.trim());
    datos.append('archivo', archivo);
    const resp = await api.postForm(`/api/contenido/gestion/${item.id}/adjuntos/`, datos);
    setSubiendo(false);
    if (!resp.ok) {
      setError('No se pudo subir (revisa formato PDF/PPTX/DOCX/XLSX y máx. 50 MB).');
      return;
    }
    setTitulo('');
    setArchivo(null);
    await onActualizar();
  };

  const quitar = async (adjuntoId: number) => {
    if (!window.confirm('¿Quitar este documento de la lista?')) return;
    await api.delete(`/api/contenido/gestion/adjuntos/${adjuntoId}/`);
    await onActualizar();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4"
      onClick={onCerrar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-docs-titulo"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <h2 id="modal-docs-titulo" className="font-display text-xl font-bold text-ink">
              {item.titulo}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {adjuntos.length} documento{adjuntos.length === 1 ? '' : 's'} — haz clic en uno para previsualizarlo
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg border border-line px-2.5 py-1 text-sm text-body hover:border-brand hover:text-brand"
          >
            ✕
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[1fr_1.2fr]">
          {/* Lista */}
          <div className="min-h-0 overflow-y-auto border-b border-line p-4 md:border-b-0 md:border-r">
            <ul className="divide-y divide-line rounded-xl border border-line">
              {adjuntos.length === 0 && (
                <li className="p-6 text-center text-sm text-muted">Aún no hay documentos.</li>
              )}
              {adjuntos.map((adj) => (
                <li
                  key={adj.id}
                  className={`flex items-center gap-2 px-3 py-2.5 ${
                    seleccionado?.id === adj.id ? 'bg-brand/5' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSeleccionado(adj)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-[10px] font-bold text-brand">
                      {adj.archivo.split('.').pop()?.split('?')[0].toUpperCase()}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-sm font-medium ${
                        seleccionado?.id === adj.id ? 'text-brand' : 'text-ink'
                      }`}
                    >
                      {adj.titulo}
                    </span>
                  </button>
                  <a
                    href={rutaMedia(adj.archivo)}
                    download
                    aria-label={`Descargar ${adj.titulo}`}
                    className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-body hover:border-brand hover:text-brand"
                  >
                    ↓
                  </a>
                  {puedeEditar && (
                    <button
                      type="button"
                      onClick={() => void quitar(adj.id)}
                      aria-label={`Quitar ${adj.titulo}`}
                      className="rounded-lg px-1.5 py-1 text-xs text-muted hover:text-brand"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {puedeEditar && (
              <form onSubmit={(e) => void subir(e)} className="mt-4 rounded-xl bg-surface p-3">
                <p className="text-xs font-semibold text-ink">Subir documento a esta lista</p>
                {error && <p className="mt-1 text-xs text-brand">{error}</p>}
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título del documento"
                  aria-label="Título del documento"
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <input
                  type="file"
                  accept=".pdf,.pptx,.ppt,.docx,.xlsx"
                  aria-label="Archivo del documento"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-body"
                />
                <button
                  type="submit"
                  disabled={subiendo}
                  className="mt-2 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {subiendo ? 'Subiendo…' : 'Agregar a la lista'}
                </button>
              </form>
            )}
          </div>

          {/* Vista previa */}
          <div className="grid min-h-72 place-items-center bg-surface p-4">
            {seleccionado ? (
              esPdf(seleccionado.archivo) ? (
                <iframe
                  src={`${rutaMedia(seleccionado.archivo)}#toolbar=0&view=FitH`}
                  title={`Vista previa de ${seleccionado.titulo}`}
                  className="h-full min-h-72 w-full rounded-xl border border-line bg-white"
                />
              ) : (
                <div className="text-center">
                  <p className="text-4xl" aria-hidden>📄</p>
                  <p className="mt-2 max-w-56 text-sm text-muted">
                    Sin vista previa para este formato ({seleccionado.archivo.split('.').pop()?.toUpperCase()}).
                  </p>
                  <a
                    href={rutaMedia(seleccionado.archivo)}
                    download
                    className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Descargar
                  </a>
                </div>
              )
            ) : (
              <p className="text-sm text-muted">Selecciona un documento para previsualizarlo.</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Acciones al pie: descargar archivo o abrir enlace externo. */
function AccionesTarjeta({ item }: { item: Contenido }) {
  if (!item.archivo && !item.enlace) return null;
  return (
    <div className="flex flex-wrap gap-3 px-6 pb-6">
      {item.enlace && (
        <a
          href={item.enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-brand"
        >
          Ingresa aquí <span aria-hidden="true">↗</span>
        </a>
      )}
      {item.archivo && (
        <a
          href={item.archivo}
          download
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-brand"
        >
          Descargar {item.archivo.split('.').pop()?.toUpperCase()}
        </a>
      )}
    </div>
  );
}

interface Props {
  seccion: Seccion;
  titulo: string;
  descripcion: string;
}

export function SeccionContenido({ seccion, titulo, descripcion }: Props) {
  const { usuario } = useAuth();
  const puedeReordenar = usuario !== null && usuario.rol !== 'colaborador';
  const [items, setItems] = useState<Contenido[] | null>(null);
  const [tarjetaAbierta, setTarjetaAbierta] = useState<Contenido | null>(null);
  const [modoReordenar, setModoReordenar] = useState(false);
  const [arrastrando, setArrastrando] = useState<number | null>(null);

  useEffect(() => {
    setItems(null);
    setTarjetaAbierta(null);
    setModoReordenar(false);
    void listarPublicados(seccion).then(setItems);
  }, [seccion]);

  const soltarSobre = async (destinoId: number) => {
    if (arrastrando === null || arrastrando === destinoId || !items) return;
    const origen = items.findIndex((i) => i.id === arrastrando);
    const destino = items.findIndex((i) => i.id === destinoId);
    if (origen < 0 || destino < 0) return;
    const nuevo = [...items];
    const [movido] = nuevo.splice(origen, 1);
    nuevo.splice(destino, 0, movido);
    setItems(nuevo);
    setArrastrando(null);
    await api.post('/api/contenido/gestion/reordenar/', { orden: nuevo.map((i) => i.id) });
  };

  return (
    <section aria-labelledby="seccion-titulo">
      <h1 id="seccion-titulo" className="sr-only">{titulo}</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">{descripcion}</p>
        {puedeReordenar && (items?.length ?? 0) > 1 && (
          <button
            type="button"
            onClick={() => setModoReordenar((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors duration-150 ${
              modoReordenar
                ? 'border-brand bg-brand text-white'
                : 'border-line text-body hover:border-brand hover:text-brand'
            }`}
          >
            {modoReordenar ? '✓ Listo' : '↕ Reordenar tarjetas'}
          </button>
        )}
      </div>

      {modoReordenar && (
        <p className="mt-3 rounded-lg bg-brand/5 px-3 py-2 text-sm text-brand">
          Arrastra las tarjetas para cambiar el orden. Los cambios se guardan automáticamente.
        </p>
      )}

      {items === null && <p className="mt-6 text-sm text-muted">Cargando…</p>}

      {items?.length === 0 && (
        <p className="mt-6 max-w-2xl rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          Aún no hay publicaciones en esta sección.
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-6">
        {items?.map((item) => {
          const categoria = CATEGORIAS[item.categoria ?? 'general'] ?? CATEGORIAS.general;
          const tieneDocumentos = (item.adjuntos?.length ?? 0) > 0;
          // Portada: imagen subida a mano; si no hay, la 1ª página del PDF
          const portada = item.imagen_portada ?? item.miniatura ?? null;
          const esMosaico = item.estilo === 'mosaico' && !!portada;
          const esLado = item.estilo === 'lado' && !!portada;
          return (
            <article
              key={item.id}
              draggable={modoReordenar}
              onDragStart={modoReordenar ? () => setArrastrando(item.id) : undefined}
              onDragOver={modoReordenar ? (e) => e.preventDefault() : undefined}
              onDrop={modoReordenar ? () => void soltarSobre(item.id) : undefined}
              onClick={
                modoReordenar
                  ? undefined
                  : tieneDocumentos
                    ? () => setTarjetaAbierta(item)
                    : undefined
              }
              className={`flex flex-col overflow-hidden rounded-2xl border bg-white ${
                modoReordenar
                  ? 'cursor-grab border-dashed border-brand/50 active:cursor-grabbing'
                  : 'border-line'
              } ${arrastrando === item.id ? 'opacity-40' : ''} ${
                tieneDocumentos && !modoReordenar
                  ? 'cursor-pointer transition-shadow duration-150 hover:shadow-lg hover:border-brand/40'
                  : ''
              } ${
                { tercio: 'lg:col-span-2', medio: 'lg:col-span-3', dostercios: 'lg:col-span-4', completo: 'lg:col-span-6' }[
                  item.ancho ?? 'completo'
                ]
              }`}
            >
              {esMosaico ? (
                <div className="relative min-h-52">
                  <img
                    src={rutaMedia(portada ?? '')}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
                  <div className="relative flex min-h-52 flex-col justify-end gap-3 p-5">
                    <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white drop-shadow">
                      {item.titulo}
                    </h2>
                    {tieneDocumentos ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTarjetaAbierta(item);
                        }}
                        className="w-fit rounded-lg bg-black/45 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-colors duration-150 hover:bg-brand"
                      >
                        Ingresa aquí
                      </button>
                    ) : item.enlace ? (
                      <a
                        href={item.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-fit rounded-lg bg-black/45 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-colors duration-150 hover:bg-brand"
                      >
                        Ingresa aquí
                      </a>
                    ) : item.archivo ? (
                      <a
                        href={rutaMedia(item.archivo)}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="w-fit rounded-lg bg-black/45 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-colors duration-150 hover:bg-brand"
                      >
                        Ingresa aquí
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-1.5 shrink-0" style={{ background: categoria.color }} />
                  <div className={esLado ? 'flex flex-1 flex-col sm:flex-row' : 'flex flex-1 flex-col'}>
                    {portada ? (
                      // Miniatura de la 1ª página del PDF o imagen de portada.
                      // «lado»: imagen completa (sin recorte) junto al texto.
                      <img
                        src={rutaMedia(portada)}
                        alt=""
                        loading="lazy"
                        className={
                          esLado
                            ? 'w-full shrink-0 self-center object-contain p-4 sm:w-2/5 sm:max-h-72'
                            : 'h-56 w-full shrink-0 object-cover object-top'
                        }
                      />
                    ) : item.archivo && esPdf(item.archivo) ? (
                      // Sin miniatura (poppler ausente): visor embebido de respaldo
                      <iframe
                        src={`${rutaMedia(item.archivo)}#view=FitH`}
                        title={`Vista previa de ${item.titulo}`}
                        className="h-56 w-full shrink-0 border-0 bg-surface"
                      />
                    ) : null}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <RecursosTarjeta item={item} />
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
                      {tieneDocumentos && (
                        <div className="px-6 pb-6">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTarjetaAbierta(item);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-brand"
                          >
                            Ver documentos ({item.adjuntos?.length})
                          </button>
                        </div>
                      )}
                      <AccionesTarjeta item={item} />
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>

      {tarjetaAbierta && (
        <ModalDocumentos
          item={tarjetaAbierta}
          onCerrar={() => setTarjetaAbierta(null)}
          onActualizar={async () => {
            const frescos = await listarPublicados(seccion);
            setItems(frescos);
            setTarjetaAbierta(frescos.find((c) => c.id === tarjetaAbierta.id) ?? null);
          }}
        />
      )}
    </section>
  );
}
