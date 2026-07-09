import { useCallback, useEffect, useState } from 'react';
import { EditorContenido } from '../components/editor/EditorContenido';
import { api } from '../lib/api';
import type { Contenido, Seccion } from '../lib/contenido';

const SECCIONES: { valor: Seccion; nombre: string }[] = [
  { valor: 'comunicados', nombre: 'Comunicados' },
  { valor: 'beneficios', nombre: 'Beneficios' },
  { valor: 'fondo_fenys', nombre: 'Fondo Fenys' },
  { valor: 'info_rrhh', nombre: 'Información RR.HH.' },
  { valor: 'reconocimientos', nombre: 'Reconocimientos' },
  { valor: 'galeria', nombre: 'Galería del inicio (fotos)' },
];

const CATEGORIAS = [
  { valor: 'general', nombre: 'General' },
  { valor: 'comercial', nombre: 'Comercial' },
  { valor: 'bienestar', nombre: 'Bienestar' },
  { valor: 'sst', nombre: 'Seguridad y Salud' },
  { valor: 'rrhh', nombre: 'Gestión Humana' },
];

const NUEVO = { seccion: 'comunicados' as Seccion, titulo: '', categoria: 'general', ancho: 'completo', cuerpo: '<p></p>', publicado: false };

export default function Panel() {
  const [items, setItems] = useState<Contenido[]>([]);
  const [editando, setEditando] = useState<(typeof NUEVO & { id?: number }) | null>(null);
  const [portada, setPortada] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

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
    if (portada) {
      // Con imagen: multipart para incluir el archivo
      const datos = new FormData();
      Object.entries(cuerpo).forEach(([clave, valor]) => datos.append(clave, String(valor)));
      datos.append('imagen_portada', portada);
      const { tokenStore } = await import('../lib/api');
      resp = await fetch(id ? `/api/contenido/gestion/${id}/` : '/api/contenido/gestion/', {
        method: id ? 'PATCH' : 'POST',
        body: datos,
        credentials: 'include',
        headers: { Authorization: `Bearer ${tokenStore.get()}` },
      });
    } else {
      resp = id
        ? await api.patch(`/api/contenido/gestion/${id}/`, cuerpo)
        : await api.post('/api/contenido/gestion/', cuerpo);
    }
    if (!resp.ok) {
      setMensaje('No se pudo guardar. Revisa los campos.');
      return;
    }
    setMensaje(id ? 'Cambios guardados.' : 'Contenido creado.');
    setEditando(null);
    setPortada(null);
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

      {editando && (
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
          </div>

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

          <p className="mt-4 mb-1 text-sm font-medium text-body">Cuerpo</p>
          <EditorContenido
            html={editando.cuerpo}
            onChange={(cuerpo) => setEditando((estado) => (estado ? { ...estado, cuerpo } : estado))}
          />

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
      )}

      <ul className="mt-8 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-white">
        {items.length === 0 && (
          <li className="p-8 text-center text-sm text-muted">Sin contenidos todavía. Crea el primero.</li>
        )}
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{item.titulo}</p>
              <p className="text-xs text-muted">
                {SECCIONES.find((s) => s.valor === item.seccion)?.nombre} ·{' '}
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
              onClick={() => setEditando({ id: item.id, seccion: item.seccion, titulo: item.titulo, categoria: item.categoria ?? 'general', ancho: item.ancho ?? 'completo', cuerpo: item.cuerpo, publicado: item.publicado })}
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
    </section>
  );
}
