import { useEffect, useState } from 'react';

/** Notificación inferior al abrir enlaces externos (como en el prototipo).
 *  Escucha por delegación todos los clics en <a target="_blank">. */
export function ToastEnlaces() {
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const alHacerClic = (evento: MouseEvent) => {
      const enlace = (evento.target as HTMLElement).closest('a[target="_blank"]');
      if (!enlace) return;
      try {
        const url = new URL((enlace as HTMLAnchorElement).href);
        setMensaje(`Abriendo ${url.hostname} en una pestaña nueva…`);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setMensaje(null), 3500);
      } catch {
        /* enlace relativo — sin toast */
      }
    };
    document.addEventListener('click', alHacerClic);
    return () => {
      document.removeEventListener('click', alHacerClic);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!mensaje) return null;
  return (
    <p
      role="status"
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg"
    >
      🔗 {mensaje}
    </p>
  );
}
