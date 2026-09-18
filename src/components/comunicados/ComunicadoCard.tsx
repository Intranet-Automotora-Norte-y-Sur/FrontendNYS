import { Link } from 'react-router-dom';
import { htmlSeguro, type Contenido } from '../../lib/contenido';
import { InsigniaImportancia } from '../ui/InsigniaImportancia';

export const CATEGORIAS: Record<string, { nombre: string; color: string }> = {
  comercial: { nombre: 'Comercial', color: '#e4002b' },
  bienestar: { nombre: 'Bienestar', color: '#2563eb' },
  sst: { nombre: 'SST', color: '#16a34a' },
  rrhh: { nombre: 'RR.HH.', color: '#7c3aed' },
  general: { nombre: 'General', color: '#6b7280' },
};

export function ComunicadoCard({ item }: { item: Contenido }) {
  const categoria = CATEGORIAS[item.categoria ?? 'general'] ?? CATEGORIAS.general;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-1.5 shrink-0" style={{ background: categoria.color }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: categoria.color }}>
            {categoria.nombre}
          </span>
          <time className="shrink-0 text-xs text-muted">
            {new Date(item.actualizado_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
          </time>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">{item.titulo}</h3>
        {item.importancia && (
          <p className="mt-2">
            <InsigniaImportancia nivel={item.importancia} />
          </p>
        )}
        <div
          className="prosa mt-2 line-clamp-3 flex-1 text-sm"
          dangerouslySetInnerHTML={{ __html: htmlSeguro(item.cuerpo) }}
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted">{categoria.nombre === 'General' ? 'Norte y Sur' : categoria.nombre}</span>
          <Link to="/comunicados" className="text-sm font-semibold text-brand hover:underline">
            Leer más ›
          </Link>
        </div>
      </div>
    </article>
  );
}
