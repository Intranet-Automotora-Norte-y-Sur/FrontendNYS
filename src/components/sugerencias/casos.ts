/** Lo que comparten el informe del buzón y «Mis casos»: el tipo del caso, las
 *  listas de selectores y el descargador de evidencia. */
import { api } from '../../lib/api';

export interface Caso {
  id: number;
  fecha: string;
  sede: string;
  /** «Acopi»; el campo `sede` guarda el código («acopi»). */
  sede_label: string;
  anonimo: boolean;
  autor: string;
  correo: string;
  quiere_respuesta: boolean;
  tipo: string;
  tipo_label: string;
  mensaje: string;
  estado: string;
  estado_label: string;
  area_responsable: string;
  area_label: string;
  /** Nombre del responsable; queda aunque le borren la cuenta. */
  responsable: string;
  /** Cuenta de la intranet a la que está asignado (null = sin asignar). */
  responsable_id: number | null;
  responsable_correo?: string | null;
  fecha_asignacion: string | null;
  decision: string;
  decision_label: string;
  observaciones: string;
  fecha_cierre: string | null;
  evidencia: string | null;
  /** Solo en la respuesta de guardar: el caso quedó asignado pero el correo falló. */
  aviso?: string;
}

export interface Opcion {
  valor: string;
  etiqueta: string;
}

export const ESTADOS: Opcion[] = [
  { valor: 'recibida', etiqueta: 'Recibida' },
  { valor: 'en_revision', etiqueta: 'En revisión' },
  { valor: 'asignada', etiqueta: 'Asignada al área' },
  { valor: 'cerrada', etiqueta: 'Cerrada' },
];

export const DECISIONES: Opcion[] = [
  { valor: 'aprobada', etiqueta: 'Aprobada' },
  { valor: 'rechazada', etiqueta: 'Rechazada' },
];

export const TIPOS: Opcion[] = [
  { valor: 'queja', etiqueta: 'Queja' },
  { valor: 'sugerencia', etiqueta: 'Sugerencia' },
  { valor: 'mejora', etiqueta: 'Oportunidad de mejora' },
  { valor: 'felicitacion', etiqueta: 'Felicitación' },
];

/** Color por estado. El estado es lo que más se escanea en una lista larga. */
export const COLOR_ESTADO: Record<string, string> = {
  recibida: 'bg-warn/15 text-body',
  en_revision: 'bg-info/15 text-info',
  asignada: 'bg-ok/15 text-ok',
  cerrada: 'bg-ink/10 text-muted',
};

export const CAMPO =
  'w-full rounded-lg border border-line px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-brand';

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** La evidencia ya no es un enlace a /media: ese abría sin sesión y quedaba en
 *  el historial. Ahora se pide con el token y se descarga desde memoria. */
export async function descargarEvidencia(caso: Caso): Promise<void> {
  if (!caso.evidencia) return;
  const respuesta = await api.get(caso.evidencia);
  if (!respuesta.ok) return;
  const url = URL.createObjectURL(await respuesta.blob());
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `evidencia-caso-${caso.id}`;
  enlace.click();
  URL.revokeObjectURL(url);
}

/** Las áreas las manda el servidor (`/opciones/`) para no duplicar la lista:
 *  una opción que el backend no conozca se rechazaría al guardar. */
export async function cargarAreas(): Promise<Opcion[]> {
  const resp = await api.get('/api/sugerencias/opciones/');
  if (!resp.ok) return [];
  const datos = (await resp.json()) as { areas?: Opcion[] };
  return datos.areas ?? [];
}
