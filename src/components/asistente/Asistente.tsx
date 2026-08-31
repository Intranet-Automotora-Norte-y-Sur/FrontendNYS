import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';

interface Mensaje {
  de: 'usuario' | 'asistente';
  texto: string;
}

const SALUDO: Mensaje = {
  de: 'asistente',
  texto: '¡Hola! Soy el asistente de la intranet. Pregúntame cómo generar tu certificado, sobre beneficios, la Academia y más.',
};

export function Asistente() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
  const [pregunta, setPregunta] = useState('');
  const [pensando, setPensando] = useState(false);
  // El hilo lo administra el servidor; aquí solo se guarda su id para
  // devolverlo en la siguiente pregunta y que el asistente recuerde.
  const [conversacion, setConversacion] = useState<number | null>(null);
  const finLista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finLista.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, pensando]);

  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener('abrir-asistente', abrir);
    return () => window.removeEventListener('abrir-asistente', abrir);
  }, []);

  /** Corta el hilo: la próxima pregunta abre uno nuevo, sin memoria. */
  const nuevaConversacion = () => {
    setConversacion(null);
    setMensajes([SALUDO]);
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const texto = pregunta.trim();
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
      setConversacion(datos.conversacion);
      setMensajes((lista) => [...lista, { de: 'asistente', texto: datos.respuesta }]);
      return;
    }
    const texto429 = 'Alcanzaste el límite de preguntas por hoy. Vuelve mañana 🙂';
    const textoError = 'El asistente no está disponible ahora. Intenta más tarde.';
    setMensajes((lista) => [
      ...lista,
      { de: 'asistente', texto: resp.status === 429 ? texto429 : textoError },
    ]);
  };

  return (
    <>
      <button
        type="button"
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente virtual'}
        onClick={() => setAbierto((v) => !v)}
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-2xl text-white shadow-lg transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {abierto ? '✕' : '💬'}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Asistente virtual"
          className="fixed bottom-24 right-5 z-40 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl sm:w-96"
        >
          <header className="flex items-center gap-3 border-b border-line bg-ink px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-white">Asistente Norte y Sur</p>
              <p className="truncate text-xs text-faint">
                Responde sobre la intranet y la empresa
              </p>
            </div>
            {conversacion !== null && (
              <button
                type="button"
                onClick={nuevaConversacion}
                title="Empezar de cero: el asistente olvida lo hablado"
                className="shrink-0 rounded-lg border border-white/20 px-2.5 py-1 text-xs font-semibold text-faint transition-colors duration-150 hover:bg-white/10 hover:text-white"
              >
                Nueva
              </button>
            )}
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {mensajes.map((mensaje, i) => (
              <p
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  mensaje.de === 'usuario'
                    ? 'ml-auto rounded-br-sm bg-brand text-white'
                    : 'rounded-bl-sm bg-surface text-body'
                }`}
              >
                {mensaje.texto}
              </p>
            ))}
            {pensando && <p className="rounded-2xl rounded-bl-sm bg-surface px-3 py-2 text-sm text-muted">Pensando…</p>}
            <div ref={finLista} />
          </div>

          <form onSubmit={enviar} className="flex gap-2 border-t border-line p-3">
            <input
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              maxLength={500}
              placeholder="Escribe tu pregunta…"
              aria-label="Pregunta al asistente"
              className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={pensando || !pregunta.trim()}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
