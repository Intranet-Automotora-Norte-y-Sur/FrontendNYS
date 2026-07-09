import DOMPurify from 'dompurify';
import { api } from './api';

export type Seccion =
  | 'comunicados'
  | 'beneficios'
  | 'fondo_fenys'
  | 'info_rrhh'
  | 'reconocimientos'
  | 'galeria';

export interface Contenido {
  id: number;
  seccion: Seccion;
  titulo: string;
  categoria?: string;
  ancho?: 'completo' | 'dostercios' | 'medio' | 'tercio';
  cuerpo: string;
  imagen_portada: string | null;
  publicado: boolean;
  orden: number;
  actualizado_en: string;
  editado_por?: string;
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
