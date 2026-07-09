import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ComunicadoCard } from '../components/comunicados/ComunicadoCard';
import { api } from '../lib/api';
import type { Contenido } from '../lib/contenido';

export function Buscar() {
  const [parametros] = useSearchParams();
  const consulta = parametros.get('q') ?? '';
  const [resultados, setResultados] = useState<Contenido[] | null>(null);

  useEffect(() => {
    if (!consulta) {
      setResultados([]);
      return;
    }
    setResultados(null);
    void api
      .get(`/api/contenido/?q=${encodeURIComponent(consulta)}`)
      .then(async (resp) => setResultados(resp.ok ? ((await resp.json()) as Contenido[]) : []));
  }, [consulta]);

  return (
    <section aria-labelledby="buscar-titulo">
      <h1 id="buscar-titulo" className="font-display text-2xl font-extrabold text-ink">
        Resultados para “{consulta}”
      </h1>
      {resultados === null && <p className="mt-4 text-sm text-muted">Buscando…</p>}
      {resultados?.length === 0 && (
        <p className="mt-6 max-w-xl rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          Sin resultados. Prueba con otras palabras, o pregúntale al Asistente IA 💬.
        </p>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {resultados?.map((item) => (
          <ComunicadoCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
