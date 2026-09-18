import { useEffect, useState } from 'react';
import { listarPublicados, rutaMedia, type Contenido } from '../../lib/contenido';

const COLORES_DEMO = [
  { titulo: 'Integración 2026', color: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' },
  { titulo: 'Día de la familia', color: 'linear-gradient(135deg,#15803d,#22c55e)' },
  { titulo: 'Capacitación Toyota', color: 'linear-gradient(135deg,#b45309,#f59e0b)' },
  { titulo: 'Postventa Sede Sur', color: 'linear-gradient(135deg,#6d28d9,#8b5cf6)' },
  { titulo: 'Aniversario 30 años', color: 'linear-gradient(135deg,#b91c1c,#e4002b)' },
  { titulo: 'Premiación asesores', color: 'linear-gradient(135deg,#0369a1,#0ea5e9)' },
];

interface Momento {
  titulo: string;
  color?: string;
  imagen?: string;
}

function Fila({ momentos, inversa }: { momentos: Momento[]; inversa?: boolean }) {
  const items = inversa ? [...momentos].reverse() : momentos;
  return (
    <div className="flex w-max gap-4" style={{ animation: `marquesina${inversa ? '-inversa' : ''} 40s linear infinite` }}>
      {[...items, ...items].map(({ titulo, color, imagen }, i) => (
        <figure
          key={`${titulo}-${i}`}
          className="relative flex h-36 w-56 shrink-0 items-end overflow-hidden rounded-2xl p-3"
          style={imagen ? undefined : { background: color }}
        >
          {imagen && (
            <img src={imagen} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span aria-hidden="true" className="absolute right-3 top-3 text-white/80">📷</span>
          <figcaption className="relative font-display text-sm font-bold text-white drop-shadow [text-shadow:0_1px_8px_rgba(0,0,0,.6)]">
            {titulo}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** "Así vivimos Norte y Sur": usa las fotos de la sección "Galería del inicio"
 *  del CMS (las gestiona el admin desde el Panel). Sin fotos → placeholders. */
export function GaleriaVida() {
  const [momentos, setMomentos] = useState<Momento[]>(COLORES_DEMO);

  useEffect(() => {
    void listarPublicados('galeria').then((items: Contenido[]) => {
      const conFoto = items.filter((item) => item.imagen_portada);
      if (conFoto.length > 0) {
        setMomentos(
          conFoto.map((item) => ({ titulo: item.titulo, imagen: rutaMedia(item.imagen_portada!) })),
        );
      }
    });
  }, []);

  return (
    <section aria-label="Así vivimos Norte y Sur" className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold text-ink">Así vivimos Norte y Sur</h2>
        <p className="text-xs text-muted">Galería del equipo · en movimiento</p>
      </div>
      <div className="galeria-mascara mt-3 space-y-4 overflow-hidden rounded-3xl bg-ink p-4">
        <Fila momentos={momentos} />
        <Fila momentos={momentos} inversa />
      </div>
    </section>
  );
}
