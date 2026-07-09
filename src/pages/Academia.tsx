export function Academia() {
  return (
    <section aria-labelledby="academia-titulo">
      <h1 id="academia-titulo" className="sr-only">Academia Norte y Sur</h1>
      <div className="mt-6 max-w-xl rounded-2xl border border-line bg-white p-8">
        <p className="text-sm text-body">
          Accede a los cursos de la academia interna con tu cuenta de Moodle.
        </p>
        <a
          href="https://academia.norteysur.co"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 font-semibold text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Ir a la Academia →
        </a>
        <p className="mt-3 text-xs text-muted">
          (Si no tienes una cuenta, solicita acceso a tu jefe directo o al área de Sistemas.)
        </p>
      </div>
    </section>
  );
}
