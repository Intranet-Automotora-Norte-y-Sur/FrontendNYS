import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIndicadores, type Indicador } from '../hooks/useIndicadores';
import { api } from '../lib/api';

function Tarjeta({ indicador, esAdmin, alGuardar }: {
  indicador: Indicador;
  esAdmin: boolean;
  alGuardar: (id: number, valor: number) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(indicador.valor));
  const progreso = indicador.meta ? Math.min(100, (indicador.valor / indicador.meta) * 100) : null;

  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <h2 className="text-sm font-medium text-muted">{indicador.nombre}</h2>
      {editando ? (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void alGuardar(indicador.id, Number(valor)).then(() => setEditando(false));
          }}
        >
          <input
            type="number"
            step="any"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-28 rounded-lg border border-line px-2 py-1 font-display text-xl font-bold outline-none focus:border-brand"
            autoFocus
          />
          <button type="submit" className="rounded-lg bg-brand px-3 text-sm font-semibold text-white">✓</button>
          <button type="button" onClick={() => setEditando(false)} className="rounded-lg border border-line px-2 text-sm">✕</button>
        </form>
      ) : (
        <p className="mt-1 font-display text-3xl font-extrabold text-ink">
          {indicador.valor.toLocaleString('es-CO')}
          <span className="ml-1 text-base font-semibold text-muted">{indicador.unidad}</span>
        </p>
      )}
      {progreso !== null && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div
              className={`h-full rounded-full transition-transform duration-300 ${progreso >= 100 ? 'bg-ok' : 'bg-brand'}`}
              style={{ width: `${progreso}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Meta: {indicador.meta?.toLocaleString('es-CO')} ({progreso.toFixed(0)}%)
          </p>
        </div>
      )}
      {esAdmin && !editando && (
        <button
          type="button"
          onClick={() => {
            setValor(String(indicador.valor));
            setEditando(true);
          }}
          className="mt-3 text-xs font-medium text-info hover:underline"
        >
          Actualizar valor
        </button>
      )}
    </article>
  );
}

export function Indicadores() {
  const { usuario } = useAuth();
  const { indicadores, enVivo, recargar } = useIndicadores();
  const esAdmin = usuario?.rol === 'admin';

  const guardar = async (id: number, valor: number) => {
    await api.patch(`/api/indicadores/${id}/`, { valor });
    await recargar();
  };

  return (
    <section aria-labelledby="ind-titulo">
      <div className="flex flex-wrap items-center gap-3">
        <h1 id="ind-titulo" className="sr-only">Indicadores</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            enVivo ? 'bg-ok/10 text-ok' : 'bg-surface text-muted'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${enVivo ? 'bg-ok' : 'bg-faint'}`} />
          {enVivo ? 'En vivo' : 'Reconectando…'}
        </span>
      </div>


      {indicadores.length === 0 ? (
        <p className="mt-6 max-w-2xl rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          Aún no hay indicadores configurados.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {indicadores.map((ind) => (
            <Tarjeta key={ind.id} indicador={ind} esAdmin={esAdmin} alGuardar={guardar} />
          ))}
        </div>
      )}
    </section>
  );
}
