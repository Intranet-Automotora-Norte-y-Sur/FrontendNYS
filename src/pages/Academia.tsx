import { Icono } from '../components/ui/Icono';

/** Moodle vive fuera de la intranet; el enlace abre en otra pestaña. */
const URL_MOODLE = 'https://academia.norteysur.co';

export function Academia() {
  return (
    <section aria-labelledby="academia-titulo">
      <h1 id="academia-titulo" className="sr-only">
        Academia Norte y Sur
      </h1>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2544c8] to-[#3c6ae5] p-8 text-white sm:p-10">
        <div className="flex items-center gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
              Academia Norte y Sur
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-[2rem]">
              Tu formación, siempre disponible
            </h2>
            <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/80">
              Accede a los cursos de la plataforma Moodle corporativa con tu sesión
              de la intranet.
            </p>

            <a
              href={URL_MOODLE}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-[#2544c8] transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Icono nombre="enlace" className="h-4 w-4" />
              Ir a la Academia (Moodle)
            </a>

            <p className="mt-4 text-xs text-white/60">
              Inicio de sesión único (SSO) — fase 2 documentada
            </p>
          </div>

          {/* Adorno: se va en pantallas angostas para no robarle sitio al botón. */}
          <div
            aria-hidden="true"
            className="hidden shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 p-12 lg:grid"
          >
            <Icono nombre="birrete" className="h-14 w-14 text-white/70" />
          </div>
        </div>
      </div>
    </section>
  );
}
