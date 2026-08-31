import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ComunicadoCard } from '../components/comunicados/ComunicadoCard';
import { api } from '../lib/api';
import type { Contenido } from '../lib/contenido';

interface PersonaResultado {
  id: number;
  nombre: string;
  cargo: string;
  area: string;
  sede_label: string;
  iniciales: string;
  foto: string | null;
}

/** Nombre visible de cada sección, para que el resultado diga de dónde sale. */
const SECCIONES: Record<string, string> = {
  comunicados: 'Comunicados',
  beneficios: 'Beneficios',
  info_rrhh: 'Talento humano',
  reconocimientos: 'Reconocimientos',
  enlaces_toyota: 'Enlaces Toyota',
  fondo_fenys: 'Fondo Fenys',
  galeria: 'Galería del inicio',
};

export function Buscar() {
  const [parametros] = useSearchParams();
  const consulta = parametros.get('q') ?? '';
  const [resultados, setResultados] = useState<Contenido[] | null>(null);
  const [personas, setPersonas] = useState<PersonaResultado[]>([]);

  useEffect(() => {
    const termino = consulta.trim().toLowerCase();
    if (!termino) {
      setResultados([]);
      setPersonas([]);
      return;
    }
    let activo = true;
    setResultados(null);

    void api.get(`/api/contenido/?q=${encodeURIComponent(consulta)}`).then(async (resp) => {
      if (!activo) return;
      setResultados(resp.ok ? ((await resp.json()) as Contenido[]) : []);
    });

    // El directorio es pequeño: se filtra en el cliente sobre el mismo endpoint
    // que alimenta «Nuestra gente», sin endpoint de búsqueda aparte.
    void api.get('/api/auth/gente/').then(async (resp) => {
      if (!activo || !resp.ok) return;
      const gente = (await resp.json()) as PersonaResultado[];
      setPersonas(
        gente.filter((p) =>
          [p.nombre, p.cargo, p.area].some((campo) => campo.toLowerCase().includes(termino)),
        ),
      );
    });

    return () => {
      activo = false;
    };
  }, [consulta]);

  const sinResultados = resultados?.length === 0 && personas.length === 0;

  return (
    <section aria-labelledby="buscar-titulo">
      <h1 id="buscar-titulo" className="font-display text-2xl font-extrabold text-ink">
        Resultados para “{consulta}”
      </h1>

      {resultados === null && <p className="mt-4 text-sm text-muted">Buscando…</p>}

      {sinResultados && (
        <p className="mt-6 max-w-xl rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          Sin resultados. Prueba con otras palabras, o pregúntale al Asistente IA 💬.
        </p>
      )}

      {personas.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Personas <span className="text-sm font-normal text-muted">({personas.length})</span>
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {personas.map((p) => (
              <li key={p.id}>
                <Link
                  to="/nuestra-gente"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 transition-shadow duration-150 hover:shadow-md"
                >
                  {p.foto ? (
                    <img
                      src={p.foto}
                      alt={p.nombre}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface font-display text-sm font-bold text-muted">
                      {p.iniciales}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{p.nombre}</span>
                    <span className="block truncate text-xs text-muted">
                      {p.cargo} · {p.area} · {p.sede_label}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {resultados && resultados.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-ink">
            Contenidos <span className="text-sm font-normal text-muted">({resultados.length})</span>
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {resultados.map((item) => (
              <div key={item.id}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">
                  {SECCIONES[item.seccion] ?? item.seccion}
                </p>
                <ComunicadoCard item={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
