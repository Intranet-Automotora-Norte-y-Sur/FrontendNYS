import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Icono } from '../ui/Icono';

interface Cumpleanero {
  nombre: string;
  area: string;
  dia: number;
}

/** Paleta de avatares (rota por posición, como el prototipo). */
const COLORES_AVATAR = ['#E4002B', '#2563EB', '#16A34A', '#7C3AED', '#EA580C'];

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  const primera = partes[0]?.[0] ?? '';
  const segunda = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primera + segunda).toUpperCase();
}

export function CumpleanosMes() {
  const [lista, setLista] = useState<Cumpleanero[] | null>(null);

  useEffect(() => {
    let activo = true;
    void api.get('/api/auth/cumpleanos/').then(async (resp) => {
      if (!activo) return;
      setLista(resp.ok ? ((await resp.json()) as Cumpleanero[]) : []);
    });
    return () => {
      activo = false;
    };
  }, []);

  const hoy = new Date();
  const mesCorto = hoy
    .toLocaleDateString('es-CO', { month: 'short' })
    .replace('.', '');

  return (
    <section aria-labelledby="cumpleanos-titulo" className="content-start">
      <h2
        id="cumpleanos-titulo"
        className="flex items-center gap-2 font-display text-lg font-bold text-ink"
      >
        <Icono nombre="pastel" className="h-5 w-5 text-brand" />
        Cumpleaños del mes
      </h2>

      {lista === null ? (
        <div className="mt-3 rounded-2xl border border-line bg-white p-6 text-center text-sm text-muted">
          Cargando…
        </div>
      ) : lista.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-line-2 bg-white p-6 text-center text-sm text-muted">
          Este mes no hay cumpleaños registrados.
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {lista.map((c, i) => {
            const esHoy = c.dia === hoy.getDate();
            return (
              <li key={`${c.nombre}-${c.dia}`} className="flex items-center gap-3 p-4">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: COLORES_AVATAR[i % COLORES_AVATAR.length] }}
                >
                  {iniciales(c.nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold text-ink">{c.nombre}</p>
                  <p className="truncate text-xs text-muted">{c.area}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-brand">
                  {esHoy ? '¡Hoy! 🎉' : `${c.dia} ${mesCorto}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
