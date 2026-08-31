import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Icono } from '../ui/Icono';
import { FichaCumpleanero } from './FichaCumpleanero';

export interface Cumpleanero {
  nombre: string;
  cargo: string;
  area: string;
  sede: string;
  foto: string | null;
  dia: number;
  mes: number;
  es_hoy: boolean;
}

/** Nombre corto de mes en español a partir de su número (1–12). */
function mesCorto(mes: number): string {
  return new Date(2000, mes - 1, 1)
    .toLocaleDateString('es-CO', { month: 'short' })
    .replace('.', '');
}

/** Paleta de avatares (rota por posición, como el prototipo). */
const COLORES_AVATAR = ['#E4002B', '#2563EB', '#16A34A', '#7C3AED', '#EA580C'];

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  const primera = partes[0]?.[0] ?? '';
  const segunda = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primera + segunda).toUpperCase();
}

/** Fecha del cumpleaños en formato corto («14 may»). */
function fechaCorta(c: Cumpleanero): string {
  return `${c.dia} ${mesCorto(c.mes)}`;
}

export function CumpleanosMes() {
  const [lista, setLista] = useState<Cumpleanero[] | null>(null);
  const [ampliado, setAmpliado] = useState<number | null>(null);

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

  return (
    <section aria-labelledby="cumpleanos-titulo" className="content-start">
      <h2
        id="cumpleanos-titulo"
        className="flex items-center gap-2 font-display text-lg font-bold text-ink"
      >
        <Icono nombre="pastel" className="h-5 w-5 text-brand" />
        Próximos cumpleaños
      </h2>

      {lista === null ? (
        <div className="mt-3 rounded-2xl border border-line bg-white p-6 text-center text-sm text-muted">
          Cargando…
        </div>
      ) : lista.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-line-2 bg-white p-6 text-center text-sm text-muted">
          No hay cumpleaños registrados.
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {lista.map((c, i) => (
            <li key={`${c.nombre}-${c.mes}-${c.dia}`}>
              <button
                type="button"
                onClick={() => setAmpliado(i)}
                aria-label={`Ver la información de ${c.nombre} más grande`}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors duration-150 hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
              >
                {c.foto ? (
                  <img
                    src={c.foto}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover object-top"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: COLORES_AVATAR[i % COLORES_AVATAR.length] }}
                  >
                    {iniciales(c.nombre)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display font-bold text-ink">
                    {c.nombre}
                  </span>
                  <span className="block truncate text-xs text-muted">{c.area}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-brand">
                  {c.es_hoy ? '¡Hoy! 🎉' : fechaCorta(c)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {ampliado !== null && lista?.[ampliado] && (
        <FichaCumpleanero
          persona={lista[ampliado]}
          color={COLORES_AVATAR[ampliado % COLORES_AVATAR.length]}
          iniciales={iniciales(lista[ampliado].nombre)}
          fecha={fechaCorta(lista[ampliado])}
          onCerrar={() => setAmpliado(null)}
        />
      )}
    </section>
  );
}
