import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { ComunicadoCard } from '../components/comunicados/ComunicadoCard';
import { CumpleanosMes } from '../components/cumpleanos/CumpleanosMes';
import { GaleriaVida } from '../components/galeria/GaleriaVida';
import { useAuth } from '../hooks/useAuth';
import { listarPublicados, type Contenido } from '../lib/contenido';

export function Inicio() {
  const { usuario } = useAuth();
  const [comunicados, setComunicados] = useState<Contenido[]>([]);

  useEffect(() => {
    void listarPublicados('comunicados').then((lista) => setComunicados(lista.slice(0, 4)));
  }, []);

  const nombre = usuario?.nombre.split(' ')[0] ?? '';

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <section
          aria-labelledby="bienvenida"
          className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-ink p-10 text-white"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl"
          />
          {/* Sello de marca sobre el resplandor rojo. Decorativo: el título ya
              dice «Norte y Sur», así que repetirlo sería ruido para un lector
              de pantalla. Se oculta en pantallas angostas para no chocar con
              el texto. */}
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-10 top-9 hidden h-20 w-auto opacity-25 invert sm:block"
          />
          <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-brand-soft">
            Hola, {nombre} 👋
          </p>
          <h2 id="bienvenida" className="relative mt-2 font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
            Bienvenido a la
            <br />
            Intranet Norte y Sur
          </h2>
          <p className="relative mt-3 max-w-md text-sm text-faint">
            Aquí encuentras tus certificados, los indicadores de la operación y los
            comunicados más recientes de la compañía.
          </p>

          {usuario && (
            <dl className="relative mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-faint">Cargo</dt>
                <dd className="font-semibold">{usuario.cargo}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-faint">Área</dt>
                <dd className="font-semibold">{usuario.area}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-faint">Usuario</dt>
                <dd className="font-semibold">{usuario.usuario}</dd>
              </div>
            </dl>
          )}
        </section>

        <CumpleanosMes />
      </div>

      <GaleriaVida />

      <section aria-labelledby="comunicados-recientes" className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 id="comunicados-recientes" className="font-display text-xl font-bold text-ink">
            Comunicados recientes
          </h2>
          <Link to="/comunicados" className="text-sm font-semibold text-brand hover:underline">
            Ver todos ›
          </Link>
        </div>
        {comunicados.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
            Aún no hay comunicados publicados.
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {comunicados.map((c) => (
              <ComunicadoCard key={c.id} item={c} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
