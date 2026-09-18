import { importancia, type Importancia } from '../../lib/contenido';

/** Insignia de nivel de importancia de una tarjeta.
 *
 *  El nivel va escrito y no solo en color: «alta» y «media» solo se distinguen
 *  por el tono, y quien no distingue rojo de ámbar se quedaría sin el dato. */
export function InsigniaImportancia({
  nivel,
  sobreImagen = false,
}: {
  nivel?: Importancia;
  /** Sobre una foto el color de marca se pierde: se usa fondo sólido. */
  sobreImagen?: boolean;
}) {
  const marca = importancia(nivel);
  if (!marca) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        sobreImagen ? 'text-white' : ''
      }`}
      style={
        sobreImagen
          ? { background: marca.color }
          : { background: `${marca.color}1a`, color: marca.color }
      }
    >
      <span aria-hidden="true">●</span>
      Importancia {marca.nombre.toLowerCase()}
    </span>
  );
}
