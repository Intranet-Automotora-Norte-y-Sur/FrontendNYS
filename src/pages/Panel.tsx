import { useCallback, useEffect, useMemo, useState } from 'react';
import { EditorContenido } from '../components/editor/EditorContenido';
import { SugerenciasRedaccion } from '../components/editor/SugerenciasRedaccion';
import { api } from '../lib/api';
import { IMPORTANCIAS, type Contenido, type Seccion } from '../lib/contenido';

const SECCIONES: { valor: Seccion; nombre: string }[] = [
  { valor: 'comunicados', nombre: 'Comunicados' },
  { valor: 'beneficios', nombre: 'Beneficios' },
  { valor: 'info_rrhh', nombre: 'Información RR.HH.' },
  { valor: 'reconocimientos', nombre: 'Reconocimientos' },
  { valor: 'galeria', nombre: 'Galería del inicio (fotos)' },
  { valor: 'enlaces_toyota', nombre: 'Enlaces Toyota' },
];

/** Dónde ve el colaborador cada sección — para agrupar la lista de contenidos. */
const UBICACIONES: { valor: string; nombre: string; donde: string }[] = [
  { valor: 'comunicados', nombre: 'Comunicados', donde: 'Inicio y menú «Comunicados»' },
  { valor: 'beneficios', nombre: 'Beneficios', donde: 'Menú «Beneficios»' },
  { valor: 'info_rrhh', nombre: 'Talento humano', donde: 'Menú «Información RR.HH.»' },
  { valor: 'reconocimientos', nombre: 'Reconocimientos', donde: 'Menú «Reconocimientos»' },
  { valor: 'galeria', nombre: 'Galería del inicio', donde: 'Carrusel de fotos del inicio' },
  { valor: 'enlaces_toyota', nombre: 'Enlaces Toyota', donde: 'Menú «Enlaces Toyota»' },
  { valor: 'fondo_fenys', nombre: 'Fondo Fenys', donde: 'Sección en desuso' },
];

const CATEGORIAS = [
  { valor: 'general', nombre: 'General' },
  { valor: 'comercial', nombre: 'Comercial' },
  { valor: 'bienestar', nombre: 'Bienestar' },
  { valor: 'sst', nombre: 'Seguridad y Salud' },
  { valor: 'rrhh', nombre: 'Gestión Humana' },
];

/** Campos que tienen efecto en cada sección.
 *
 *  El formulario mostraba los doce campos siempre, así que la Galería pedía
 *  «nivel de importancia» y «video embebido», que su carrusel no lee. Mostrar
 *  solo lo que la sección realmente pinta evita configurar cosas que después
 *  no se ven por ninguna parte. */
type Campo =
  | 'cuerpo'
  | 'portada'
  | 'categoria'
  | 'importancia'
  | 'ancho'
  | 'estilo'
  | 'enlace'
  | 'documentos'
  | 'archivo'
  | 'video';

const COMPLETA: Campo[] = [
  'cuerpo', 'portada', 'categoria', 'importancia', 'ancho', 'estilo',
  'enlace', 'documentos', 'archivo', 'video',
];

const CAMPOS_POR_SECCION: Record<Seccion, Campo[]> = {
  comunicados: COMPLETA,
  beneficios: COMPLETA,
  info_rrhh: COMPLETA,
  reconocimientos: COMPLETA,
  // Sin archivo ni video: son accesos a portales, no material descargable.
  enlaces_toyota: [
    'cuerpo', 'portada', 'categoria', 'importancia', 'ancho', 'estilo',
    'enlace', 'documentos',
  ],
  // El carrusel del inicio solo consume título y foto.
  galeria: ['portada'],
};

const NUEVO = { seccion: 'comunicados' as Seccion, titulo: '', categoria: 'general', importancia: '', ancho: 'completo', estilo: 'estandar', cuerpo: '<p></p>', enlace: '', video_url: '', publicado: false };

export default function Panel() {
  const [items, setItems] = useState<Contenido[]>([]);
  const [editando, setEditando] = useState<(typeof NUEVO & { id?: number }) | null>(null);
  const [portada, setPortada] = useState<File | null>(null);
  const [adjunto, setAdjunto] = useState<File | null>(null);
  const [videoArchivo, setVideoArchivo] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  // Documentos de la tarjeta (lista de adjuntos, cargados uno a uno)
  const [docTitulo, setDocTitulo] = useState('');
  const [docArchivo, setDocArchivo] = useState<File | null>(null);
  const [subiendoDoc, setSubiendoDoc] = useState(false);

  const cargar = useCallback(async () => {
    const resp = await api.get('/api/contenido/gestion/');
    if (resp.ok) setItems((await resp.json()) as Contenido[]);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = async () => {
    if (!editando || !editando.titulo.trim()) {
      setMensaje('El título es obligatorio.');
      return;
    }
    const { id, ...cuerpo } = editando;
    let resp: Response;
    if (portada || adjunto || videoArchivo) {
      // Con archivos: multipart (postForm/patchForm renuevan el token si expiró)
      const datos = new FormData();
      Object.entries(cuerpo).forEach(([clave, valor]) => datos.append(clave, String(valor)));
      if (portada) datos.append('imagen_portada', portada);
      if (adjunto) datos.append('archivo', adjunto);
      if (videoArchivo) datos.append('video', videoArchivo);
      resp = id
        ? await api.patchForm(`/api/contenido/gestion/${id}/`, datos)
        : await api.postForm('/api/contenido/gestion/', datos);
    } else {
      resp = id
        ? await api.patch(`/api/contenido/gestion/${id}/`, cuerpo)
        : await api.post('/api/contenido/gestion/', cuerpo);
    }
    if (!resp.ok) {
      if (resp.status === 401) {
        setMensaje('Tu sesión expiró. Vuelve a iniciar sesión.');
        return;
      }
      const errores = (await resp.json().catch(() => null)) as Record<string, unknown> | null;
      const primero = errores && Object.entries(errores)[0];
      setMensaje(
        primero
          ? `No se pudo guardar — ${primero[0]}: ${Array.isArray(primero[1]) ? primero[1][0] : String(primero[1])}`
          : 'No se pudo guardar. Revisa los campos.',
      );
      return;
    }
    setMensaje(id ? 'Cambios guardados.' : 'Contenido creado.');
    setEditando(null);
    setPortada(null);
    setAdjunto(null);
    setVideoArchivo(null);
    await cargar();
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar este contenido? Esta acción no se puede deshacer.')) return;
    await api.delete(`/api/contenido/gestion/${id}/`);
    await cargar();
  };

  const alternarPublicado = async (item: Contenido) => {
    await api.patch(`/api/contenido/gestion/${item.id}/`, { publicado: !item.publicado });
    await cargar();
  };

  const subirDocumento = async (contenidoId: number) => {
    if (!docTitulo.trim() || !docArchivo) {
      setMensaje('El documento necesita título y archivo.');
      return;
    }
    setSubiendoDoc(true);
    const datos = new FormData();
    datos.append('titulo', docTitulo.trim());
    datos.append('archivo', docArchivo);
    const resp = await api.postForm(`/api/contenido/gestion/${contenidoId}/adjuntos/`, datos);
    setSubiendoDoc(false);
    if (!resp.ok) {
      setMensaje('No se pudo subir el documento (¿formato o tamaño?).');
      return;
    }
    setDocTitulo('');
    setDocArchivo(null);
    await cargar();
  };

  const eliminarDocumento = async (adjuntoId: number) => {
    if (!window.confirm('¿Quitar este documento de la tarjeta?')) return;
    await api.delete(`/api/contenido/gestion/adjuntos/${adjuntoId}/`);
    await cargar();
  };

  // Adjuntos frescos de la tarjeta en edición (se refrescan con cargar())
  const adjuntosActuales = editando?.id
    ? items.find((i) => i.id === editando.id)?.adjuntos ?? []
    : [];

  // Contenidos agrupados por dónde se ven en el portal; se ocultan los grupos vacíos.
  const grupos = useMemo(
    () =>
      UBICACIONES.map((ubicacion) => ({
        ...ubicacion,
        contenidos: items.filter((item) => item.seccion === ubicacion.valor),
      })).filter((grupo) => grupo.contenidos.length > 0),
    [items],
  );

  return (
    <section aria-labelledby="panel-titulo">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="panel-titulo" className="sr-only">Panel de edición</h1>
          <p className="max-w-xl text-sm text-muted">Los cambios publicados se ven al instante en el portal.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditando({ ...NUEVO })}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          + Nuevo contenido
        </button>
      </div>

      {mensaje && (
        <p role="status" className="mt-4 max-w-xl rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">
          {mensaje}
        </p>
      )}

      {editando && (() => {
        const campos = CAMPOS_POR_SECCION[editando.seccion] ?? COMPLETA;
        const muestra = (campo: Campo) => campos.includes(campo);
        return (
        <div className="mt-6 max-w-3xl rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            {editando.id ? 'Editar contenido' : 'Nuevo contenido'}
          </h2>

          <label className="mt-4 mb-1 block text-sm font-medium text-body" htmlFor="titulo">Título</label>
          <input
            id="titulo"
            value={editando.titulo}
            onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
            className="w-full rounded-lg border border-line px-3 py-2 outline-none transition-colors duration-150 focus:border-brand"
          />

          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-body" htmlFor="seccion">Sección</label>
              <select
                id="seccion"
                value={editando.seccion}
                onChange={(e) => setEditando({ ...editando, seccion: e.target.value as Seccion })}
                className="rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
              >
                {SECCIONES.map(({ valor, nombre }) => (
                  <option key={valor} value={valor}>{nombre}</option>
                ))}
              </select>
            </div>
            {muestra('categoria') && (
            <div>
              <label className="mb-1 block text-sm font-medium text-body" htmlFor="categoria">Categoría (color de la tarjeta)</label>
              <select
                id="categoria"
                value={editando.categoria}
                onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}
                className="rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
              >
                {CATEGORIAS.map(({ valor, nombre }) => (
                  <option key={valor} value={valor}>{nombre}</option>
                ))}
              </select>
            </div>
            )}
            {muestra('importancia') && (
            <div>
              <label className="mb-1 block text-sm font-medium text-body" htmlFor="importancia">Nivel de importancia</label>
              <select
                id="importancia"
                value={editando.importancia}
                onChange={(e) => setEditando({ ...editando, importancia: e.target.value })}
                className="rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
              >
                {IMPORTANCIAS.map(({ valor, nombre }) => (
                  <option key={valor} value={valor}>{nombre}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                El colaborador lo ve como una insignia en la tarjeta. Útil en encuestas
                con fecha límite; si todas llevan nivel, deja de significar algo.
              </p>
            </div>
            )}
            {muestra('ancho') && (
            <div>
              <label className="mb-1 block text-sm font-medium text-body" htmlFor="ancho">Ancho en la página</label>
              <select
                id="ancho"
                value={editando.ancho}
                onChange={(e) => setEditando({ ...editando, ancho: e.target.value })}
                className="rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
              >
                <option value="completo">Página completa</option>
                <option value="dostercios">Dos tercios</option>
                <option value="medio">Media página</option>
                <option value="tercio">Un tercio</option>
              </select>
            </div>
            )}
            {muestra('estilo') && (
            <div>
              <label className="mb-1 block text-sm font-medium text-body" htmlFor="estilo">Estilo de la tarjeta</label>
              <select
                id="estilo"
                value={editando.estilo}
                onChange={(e) => setEditando({ ...editando, estilo: e.target.value })}
                className="rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
              >
                <option value="estandar">Estándar (imagen arriba, texto debajo)</option>
                <option value="mosaico">Mosaico (imagen de fondo, título encima)</option>
                <option value="lado">Imagen al lado (imagen izquierda, texto derecha)</option>
              </select>
            </div>
            )}
          </div>

          {muestra('portada') && (<>
          <label className="mt-4 mb-1 block text-sm font-medium text-body" htmlFor="portada">
            Imagen de portada <span className="font-normal text-muted">(la foto de la tarjeta o de la galería)</span>
          </label>
          <input
            id="portada"
            type="file"
            accept="image/*"
            onChange={(e) => setPortada(e.target.files?.[0] ?? null)}
            className="mb-1 block text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-body hover:file:bg-line"
          />
          </>)}

          {muestra('enlace') && (<>
          <label className="mt-4 mb-1 block text-sm font-medium text-body" htmlFor="enlace">
            Enlace externo <span className="font-normal text-muted">(la tarjeta muestra botón «Ingresa aquí»)</span>
          </label>
          <input
            id="enlace"
            type="url"
            placeholder="https://…"
            value={editando.enlace}
            onChange={(e) => setEditando({ ...editando, enlace: e.target.value })}
            className="w-full rounded-lg border border-line px-3 py-2 outline-none transition-colors duration-150 focus:border-brand"
          />
          </>)}

          {(muestra('archivo') || muestra('video')) && (
          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-body" htmlFor="adjunto">
                Archivo descargable <span className="font-normal text-muted">(PDF, PPTX… máx. 50 MB)</span>
              </label>
              <input
                id="adjunto"
                type="file"
                accept=".pdf,.pptx,.ppt,.docx,.xlsx"
                onChange={(e) => setAdjunto(e.target.files?.[0] ?? null)}
                className="block text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-body hover:file:bg-line"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-body" htmlFor="video-archivo">
                Video <span className="font-normal text-muted">(MP4/WebM máx. 200 MB)</span>
              </label>
              <input
                id="video-archivo"
                type="file"
                accept="video/mp4,video/webm"
                onChange={(e) => setVideoArchivo(e.target.files?.[0] ?? null)}
                className="block text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-body hover:file:bg-line"
              />
            </div>
          </div>
          )}

          {muestra('video') && (<>
          <label className="mt-4 mb-1 block text-sm font-medium text-body" htmlFor="video-url">
            Video embebido <span className="font-normal text-muted">(URL de YouTube o Vimeo — alternativa a subir archivo)</span>
          </label>
          <input
            id="video-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={editando.video_url}
            onChange={(e) => setEditando({ ...editando, video_url: e.target.value })}
            className="w-full rounded-lg border border-line px-3 py-2 outline-none transition-colors duration-150 focus:border-brand"
          />
          </>)}

          {muestra('documentos') && editando.id && (
            <div className="mt-5 rounded-xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold text-ink">Documentos de la tarjeta</p>
              <p className="mt-0.5 text-xs text-muted">
                Lista de documentos descargables que se muestran dentro de la tarjeta (ej. políticas de Talento Humano).
              </p>
              {adjuntosActuales.length > 0 && (
                <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-white">
                  {adjuntosActuales.map((adj) => (
                    <li key={adj.id} className="flex items-center gap-3 px-3 py-2">
                      <span className="text-xs font-bold text-brand">{adj.archivo.split('.').pop()?.toUpperCase()}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{adj.titulo}</span>
                      <button
                        type="button"
                        onClick={() => void eliminarDocumento(adj.id)}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div className="min-w-48 flex-1">
                  <label className="mb-1 block text-xs font-medium text-body" htmlFor="doc-titulo">
                    Título del documento
                  </label>
                  <input
                    id="doc-titulo"
                    value={docTitulo}
                    onChange={(e) => setDocTitulo(e.target.value)}
                    placeholder="Ej. Reglamento Interno de Trabajo"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-body" htmlFor="doc-archivo">
                    Archivo (PDF, PPTX, DOCX, XLSX)
                  </label>
                  <input
                    id="doc-archivo"
                    type="file"
                    accept=".pdf,.pptx,.ppt,.docx,.xlsx"
                    onChange={(e) => setDocArchivo(e.target.files?.[0] ?? null)}
                    className="block text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-body"
                  />
                </div>
                <button
                  type="button"
                  disabled={subiendoDoc}
                  onClick={() => void subirDocumento(editando.id!)}
                  className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {subiendoDoc ? 'Subiendo…' : 'Agregar documento'}
                </button>
              </div>
            </div>
          )}
          {muestra('documentos') && !editando.id && (
            <p className="mt-4 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
              Guarda la tarjeta primero; después podrás agregarle la lista de documentos descargables.
            </p>
          )}

          {muestra('cuerpo') && (
            <>
              <p className="mt-4 mb-1 text-sm font-medium text-body">Cuerpo</p>
              <EditorContenido
                html={editando.cuerpo}
                onChange={(cuerpo) => setEditando((estado) => (estado ? { ...estado, cuerpo } : estado))}
              />

              <SugerenciasRedaccion
                cuerpo={editando.cuerpo}
                onUsarTitular={(titulo) =>
                  setEditando((estado) => (estado ? { ...estado, titulo } : estado))
                }
              />
            </>
          )}

          <label className="mt-4 flex items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={editando.publicado}
              onChange={(e) => setEditando({ ...editando, publicado: e.target.checked })}
            />
            Publicado (visible para todos los colaboradores)
          </label>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => void guardar()}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-body hover:border-brand hover:text-brand"
            >
              Cancelar
            </button>
          </div>
        </div>
        );
      })()}

      {items.length === 0 && (
        <p className="mt-8 max-w-3xl rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
          Sin contenidos todavía. Crea el primero.
        </p>
      )}

      {grupos.map((grupo) => (
        <div key={grupo.valor} className="mt-8 max-w-3xl">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-ink">
              {grupo.nombre}{' '}
              <span className="text-sm font-normal text-muted">({grupo.contenidos.length})</span>
            </h2>
            <span className="text-xs text-muted">Se ve en: {grupo.donde}</span>
          </div>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {grupo.contenidos.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{item.titulo}</p>
                  <p className="text-xs text-muted">
                    {new Date(item.actualizado_en).toLocaleString('es-CO')} · {item.editado_por}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    item.publicado ? 'bg-ok/10 text-ok' : 'bg-surface text-muted'
                  }`}
                >
                  {item.publicado ? 'Publicado' : 'Borrador'}
                </span>
                <button type="button" onClick={() => void alternarPublicado(item)} className="text-sm font-medium text-info hover:underline">
                  {item.publicado ? 'Ocultar' : 'Publicar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditando({ id: item.id, seccion: item.seccion, titulo: item.titulo, categoria: item.categoria ?? 'general', importancia: item.importancia ?? '', ancho: item.ancho ?? 'completo', estilo: item.estilo ?? 'estandar', cuerpo: item.cuerpo, enlace: item.enlace ?? '', video_url: item.video_url ?? '', publicado: item.publicado })}
                  className="text-sm font-medium text-info hover:underline"
                >
                  Editar
                </button>
                <button type="button" onClick={() => void eliminar(item.id)} className="text-sm font-medium text-brand hover:underline">
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className="mt-8 max-w-3xl rounded-xl bg-surface px-4 py-3 text-xs text-muted">
        «Nuestras cifras» no se edita aquí: sus indicadores se cargan en el admin de Django
        (app <span className="font-mono">indicadores</span>), y «Nuestra gente» se gestiona
        desde su propia pantalla.
      </p>
    </section>
  );
}
