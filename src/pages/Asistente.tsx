import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { Icono } from '../components/ui/Icono';

interface Mensaje {
  de: 'usuario' | 'asistente';
  texto: string;
}

/** Preguntas de arranque: cubren lo que más se consulta y le enseñan al
 *  colaborador que puede escribir en lenguaje natural. */
const SUGERENCIAS = [
  '¿Cómo descargo mi certificado laboral?',
  '¿Qué beneficios tengo por ser colaborador?',
  '¿Cómo cambio mi contraseña?',
  '¿Qué licencias remuneradas existen y cómo las solicito?',
];

const TEXTO_429 = 'Alcanzaste el límite de preguntas por hoy. Vuelve mañana 🙂';
// Casi siempre es congestión del proveedor, no una caída: reintentar en unos
// segundos suele funcionar, y decir «no está disponible» hace que la gente se
// vaya cuando bastaba con volver a preguntar.
const TEXTO_ERROR =
  'El asistente está congestionado en este momento. Vuelve a enviar tu pregunta en unos segundos.';

/** Alto del área de contenido: la pantalla menos el encabezado de la app
 *  (h-16 = 4rem) y el relleno del <main> (p-7 arriba y abajo = 3.5rem). */
const ALTO = 'min-h-[calc(100vh-7.5rem)]';

export function Asistente() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [pregunta, setPregunta] = useState('');
  const [pensando, setPensando] = useState(false);
  // Arranca en línea y solo baja si el servidor responde que no está: es más
  // honesto que un indicador siempre verde.
  const [enLinea, setEnLinea] = useState(true);
  // El hilo lo administra el servidor; aquí solo se guarda su id para
  // devolverlo en la siguiente pregunta y que el asistente recuerde.
  const [conversacion, setConversacion] = useState<number | null>(null);
  const finLista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    finLista.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, pensando]);

  /** Corta el hilo: la próxima pregunta abre uno nuevo, sin memoria. */
  const nuevaConversacion = () => {
    setConversacion(null);
    setMensajes([]);
    campo.current?.focus();
  };

  const preguntar = async (texto: string) => {
    if (!texto || pensando) return;
    setMensajes((lista) => [...lista, { de: 'usuario', texto }]);
    setPregunta('');
    setPensando(true);
    const resp = await api.post('/api/asistente/preguntar/', {
      pregunta: texto,
      ...(conversacion !== null && { conversacion }),
    });
    setPensando(false);

    if (resp.ok) {
      const datos = (await resp.json()) as { respuesta: string; conversacion: number };
      setEnLinea(true);
      setConversacion(datos.conversacion);
      setMensajes((lista) => [...lista, { de: 'asistente', texto: datos.respuesta }]);
      return;
    }
    // 429 es el tope diario, no una caída: el asistente sigue en pie.
    setEnLinea(resp.status === 429);
    setMensajes((lista) => [
      ...lista,
      { de: 'asistente', texto: resp.status === 429 ? TEXTO_429 : TEXTO_ERROR },
    ]);
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    void preguntar(pregunta.trim());
  };

  const vacia = mensajes.length === 0;

  return (
    <section className={`flex ${ALTO} flex-col gap-5`}>
      <header className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-soft to-brand text-white">
          <Icono nombre="chispas" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-white">Asistente Norte y Sur</p>
          <p className="truncate text-xs text-faint">
            Certificados, beneficios, Academia, cifras y más
          </p>
        </div>
        {conversacion !== null && (
          <button
            type="button"
            onClick={nuevaConversacion}
            title="Empezar de cero: el asistente olvida lo hablado"
            className="shrink-0 rounded-lg border border-white/20 px-2.5 py-1 text-xs font-semibold text-faint transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            Nueva conversación
          </button>
        )}
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            enLinea ? 'bg-ok/15 text-ok' : 'bg-white/10 text-faint'
          }`}
        >
          <span
            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
              enLinea ? 'bg-ok' : 'bg-faint'
            }`}
          />
          {enLinea ? 'IA en línea' : 'IA no disponible'}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {vacia ? (
          <div className="grid h-full place-content-center justify-items-center gap-4 px-4 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-soft to-brand text-white">
              <Icono nombre="chispas" className="h-9 w-9" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">¿En qué te ayudo hoy?</h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
                Pregúntame en lenguaje natural. Conozco la intranet y los indicadores
                en vivo de la operación.
              </p>
            </div>
            <ul className="flex max-w-2xl flex-wrap justify-center gap-2.5">
              {SUGERENCIAS.map((texto) => (
                <li key={texto}>
                  <button
                    type="button"
                    onClick={() => void preguntar(texto)}
                    className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-body shadow-sm transition-colors duration-150 hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {texto}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-3 pb-2" aria-live="polite">
            {mensajes.map((mensaje, i) => (
              <p
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  mensaje.de === 'usuario'
                    ? 'ml-auto rounded-br-sm bg-brand text-white'
                    : 'rounded-bl-sm border border-line bg-white text-body'
                }`}
              >
                {mensaje.texto}
              </p>
            ))}
            {pensando && (
              <p className="rounded-2xl rounded-bl-sm border border-line bg-white px-4 py-2.5 text-sm text-muted">
                Pensando…
              </p>
            )}
            <div ref={finLista} />
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <form
          onSubmit={enviar}
          className="flex items-center gap-2 rounded-2xl border border-line bg-white p-2 pl-4 shadow-sm focus-within:border-brand"
        >
          <label htmlFor="pregunta" className="sr-only">Pregunta al asistente</label>
          <input
            id="pregunta"
            ref={campo}
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            maxLength={500}
            autoComplete="off"
            placeholder="Escribe tu pregunta…"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={pensando || !pregunta.trim()}
            aria-label="Enviar pregunta"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Icono nombre="enviar" className="h-[18px] w-[18px]" />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-faint">
          La IA puede equivocarse. Verifica datos sensibles con Gestión Humana.
        </p>
      </div>
    </section>
  );
}
