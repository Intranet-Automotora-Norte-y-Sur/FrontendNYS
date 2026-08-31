import DOMPurify from 'dompurify';
import { api } from './api';

export type Seccion =
  | 'comunicados'
  | 'beneficios'
  | 'info_rrhh'
  | 'reconocimientos'
  | 'galeria'
  | 'enlaces_toyota';

export interface Adjunto {
  id: number;
  titulo: string;
  archivo: string;
  /** Miniatura autogenerada (1ª página del PDF). */
  miniatura?: string | null;
  orden: number;
  /** Tamaño del archivo en bytes. */
  tamano?: number | null;
}

export interface Contenido {
  id: number;
  seccion: Seccion;
  titulo: string;
  categoria?: string;
  ancho?: 'completo' | 'dostercios' | 'medio' | 'tercio';
  /** 'mosaico' usa la portada como fondo; 'lado' pone la imagen junto al texto. */
  estilo?: 'estandar' | 'mosaico' | 'lado';
  cuerpo: string;
  imagen_portada: string | null;
  /** Miniatura autogenerada de la 1ª página del PDF (si el archivo es PDF). */
  miniatura?: string | null;
  /** URL externa — la tarjeta muestra botón «Ingresa aquí». */
  enlace?: string;
  /** Archivo descargable (PDF, PPTX…). */
  archivo?: string | null;
  /** Video subido (MP4/WebM). */
  video?: string | null;
  /** Video embebido (YouTube, Vimeo, Stream). */
  video_url?: string;
  /** Documentos descargables dentro de la tarjeta (repositorios tipo TH). */
  adjuntos?: Adjunto[];
  publicado: boolean;
  orden: number;
  actualizado_en: string;
  editado_por?: string;
}

/** Ruta same-origin para archivos de media: el backend devuelve URLs absolutas
 *  con su propio host; usamos solo el path para pasar por el proxy de Vite/Nginx. */
export function rutaMedia(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

/** Convierte una URL de video a su forma embebible en iframe. */
export function urlEmbed(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    }
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (host === 'vimeo.com') {
      return `https://player.vimeo.com/video${u.pathname}`;
    }
    return url; // player.vimeo.com o Stream ya son embebibles
  } catch {
    return url;
  }
}

/** Segunda capa de defensa: el backend ya sanitiza, pero nunca inyectamos
 *  HTML sin pasar por DOMPurify en el mismo punto de uso. */
export function htmlSeguro(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

export async function listarPublicados(seccion: Seccion): Promise<Contenido[]> {
  const resp = await api.get(`/api/contenido/?seccion=${seccion}`);
  if (!resp.ok) return [];
  return (await resp.json()) as Contenido[];
}
