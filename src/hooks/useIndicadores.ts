import { useCallback, useEffect, useRef, useState } from 'react';
import { api, tokenStore } from '../lib/api';

export type TipoGrafico =
  | 'numero'
  | 'contador'
  | 'medidor'
  | 'progreso'
  | 'anillo'
  | 'barras'
  | 'linea'
  | 'dona';

export interface RegistroIndicador {
  id: number;
  periodo: string;
  serie: string;
  valor: number;
}

export interface Indicador {
  id: number;
  nombre: string;
  categoria: string;
  tipo: TipoGrafico;
  descripcion: string;
  valor: number;
  unidad: string;
  meta: number | null;
  orden: number;
  publicado: boolean;
  registros: RegistroIndicador[];
  actualizado_en: string;
}

const REINTENTO_BASE_MS = 1000;
const REINTENTO_MAX_MS = 15000;
const POLLING_MS = 30000;

/** Carga inicial por REST + actualizaciones en vivo por WebSocket.
 *  Reconecta con backoff; si el WS no está disponible, hace polling. */
export function useIndicadores() {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [enVivo, setEnVivo] = useState(false);
  const reintento = useRef(REINTENTO_BASE_MS);
  const activo = useRef(true);

  const cargar = useCallback(async () => {
    const resp = await api.get('/api/indicadores/');
    if (resp.ok) setIndicadores((await resp.json()) as Indicador[]);
  }, []);

  useEffect(() => {
    activo.current = true;
    void cargar();

    let ws: WebSocket | null = null;
    let timerReconexion: ReturnType<typeof setTimeout> | null = null;
    let timerPolling: ReturnType<typeof setInterval> | null = null;

    const conectar = () => {
      const token = tokenStore.get();
      if (!token || !activo.current) return;
      const protocolo = window.location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${protocolo}://${window.location.host}/ws/indicadores/?token=${token}`);

      ws.onopen = () => {
        setEnVivo(true);
        reintento.current = REINTENTO_BASE_MS;
        if (timerPolling) {
          clearInterval(timerPolling);
          timerPolling = null;
        }
      };

      ws.onmessage = (evento) => {
        const { indicador } = JSON.parse(evento.data as string) as { indicador: Indicador };
        setIndicadores((lista) => {
          const existe = lista.some((i) => i.id === indicador.id);
          return existe
            ? lista.map((i) => (i.id === indicador.id ? indicador : i))
            : [...lista, indicador].sort((a, b) => a.nombre.localeCompare(b.nombre));
        });
      };

      ws.onclose = () => {
        setEnVivo(false);
        if (!activo.current) return;
        if (!timerPolling) timerPolling = setInterval(() => void cargar(), POLLING_MS);
        timerReconexion = setTimeout(conectar, reintento.current);
        reintento.current = Math.min(reintento.current * 2, REINTENTO_MAX_MS);
      };
    };

    conectar();

    return () => {
      activo.current = false;
      if (timerReconexion) clearTimeout(timerReconexion);
      if (timerPolling) clearInterval(timerPolling);
      ws?.close();
    };
  }, [cargar]);

  return { indicadores, enVivo, recargar: cargar };
}
