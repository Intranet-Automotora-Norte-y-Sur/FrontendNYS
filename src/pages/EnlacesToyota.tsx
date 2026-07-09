const ENLACES = [
  { url: 'https://www.toyota.com.co', nombre: 'Toyota Colombia', desc: 'Portal oficial de la marca' },
  { url: 'https://www.toyota.com.co/vehiculos', nombre: 'Catálogo de vehículos', desc: 'Gama actual, fichas técnicas y precios' },
  { url: 'https://www.toyota.com.co/posventa', nombre: 'Posventa Toyota', desc: 'Repuestos genuinos, mantenimiento y garantías' },
];

export function EnlacesToyota() {
  return (
    <section aria-labelledby="enlaces-titulo">
      <h1 id="enlaces-titulo" className="sr-only">Enlaces Toyota</h1>
      <p className="max-w-xl text-sm text-muted">
        Accesos directos a los portales de la marca. Se abren en una pestaña nueva.
      </p>
      <div className="mt-5 grid max-w-3xl gap-4 sm:grid-cols-2">
        {ENLACES.map(({ url, nombre, desc }) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-line bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand"
          >
            <p className="font-display text-lg font-bold text-ink group-hover:text-brand">
              {nombre} <span aria-hidden="true">↗</span>
            </p>
            <p className="mt-1 text-sm text-muted">{desc}</p>
          </a>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        ¿Falta un enlace? Pídelo por el buzón de sugerencias.
      </p>
    </section>
  );
}
