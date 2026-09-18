interface Props {
  nombre: keyof typeof RUTAS;
  className?: string;
}

/** Set de iconos stroke (estilo del prototipo). currentColor hereda el color del texto. */
const RUTAS = {
  inicio: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />,
  megafono: <path d="M3 10v4l11 4V6L3 10zm11-2.5c3 .5 5 2.2 5 4.5s-2 4-5 4.5M6 14.5V19a1.5 1.5 0 0 0 3 0" />,
  chispas: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />,
  grafica: <path d="M4 20V10m6 10V4m6 16v-7M2 20h20" />,
  personas: <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0M17 11a3.5 3.5 0 1 0-2.5-6M22 20a6 6 0 0 0-5-5.9" />,
  enlace: <path d="M14 4h6v6m0-6L10 14M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />,
  birrete: <path d="M12 4 2 9l10 5 10-5-10-5zm-6 7.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5" />,
  billetera: <path d="M3 7a2 2 0 0 1 2-2h13v3M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H3zm13 5h.5" />,
  regalo: <path d="M4 11h16v10H4V11zm-1-4h18v4H3V7zm9-0v14M12 7c-2 0-4-1-4-2.5S9.5 2 12 7zm0 0c2 0 4-1 4-2.5S14.5 2 12 7z" />,
  documento: <path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 0v5h5M8 13h8M8 17h5" />,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12zM8 12h.5m3.5 0h.5m3.5 0h.5" />,
  lapiz: <path d="M17 3l4 4L8 20l-5 1 1-5L17 3zM14 6l4 4" />,
  salir: <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" />,
  correo: <path d="M3 6h18v12H3V6zm0 1 9 6 9-6" />,
  candado: <path d="M6 11h12v9H6v-9zm3 0V8a3 3 0 0 1 6 0v3" />,
  flecha_izq: <path d="M15 6l-6 6 6 6" />,
  flecha_der: <path d="M9 6l6 6-6 6" />,
  pastel: <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3m5-3v3m5-3v3M7 4h.01M12 4h.01M17 4h.01" />,
  enviar: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />,
} as const;

export function Icono({ nombre, className = 'h-[18px] w-[18px]' }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {RUTAS[nombre]}
    </svg>
  );
}

export type NombreIcono = keyof typeof RUTAS;
