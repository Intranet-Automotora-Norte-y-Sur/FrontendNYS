import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

/** Income-statement figures. Only the admin profile receives them: the backend
 *  answers 403 to any other role.
 *
 *  Field names stay Spanish — they are the JSON contract with the API. */

export interface FinanceSlice {
  etiqueta: string;
  ingresos: number;
  egresos: number;
  utilidad: number;
  /** Null when the slice has no revenue to divide by (support centres). */
  margen: number | null;
}

export interface BusinessLine extends FinanceSlice {
  /** Administration and shared centres: they cost and barely invoice. */
  apoyo: boolean;
}

export interface WaterfallStep {
  etiqueta: string;
  valor: number;
  tipo: 'suma' | 'resta' | 'subtotal' | 'total';
}

export interface FinanceMonth {
  periodo: string;
  mes: string;
  ingresos: number;
  egresos: number;
  utilidad: number;
  margen: number | null;
  /** Accounting is still posting this month: it does not compare with closed ones. */
  en_curso: boolean;
}

export interface MatrixCell {
  sede: string;
  linea: string;
  ingresos: number;
  utilidad: number;
  margen: number | null;
}

/** What the dashboard is looking at. Empty string = «todo». */
export interface FinanceFilters {
  marca: string;
  sede: string;
  linea: string;
  desde: string;
  hasta: string;
}

export const EMPTY_FILTERS: FinanceFilters = {
  marca: '',
  sede: '',
  linea: '',
  desde: '',
  hasta: '',
};

/** The values that actually occur in the ledger, sent by the backend. */
export interface FilterOptions {
  marcas: string[];
  sedes: string[];
  lineas: string[];
  periodos: { valor: string; etiqueta: string }[];
}

export interface FinanceReport {
  disponible: true;
  actualizado_en: string;
  filtros: Record<keyof FinanceFilters, string | null>;
  opciones: FilterOptions;
  periodo: {
    desde: string | null;
    hasta: string | null;
    meses_cerrados: number;
    en_curso: string[];
  };
  resumen: FinanceSlice & {
    utilidad_mes: number;
    margen_mes: number | null;
    variacion_utilidad: number | null;
  };
  cascada: WaterfallStep[];
  por_mes: FinanceMonth[];
  por_linea: BusinessLine[];
  por_sede: FinanceSlice[];
  por_marca: FinanceSlice[];
  por_centro: FinanceSlice[];
  matriz: { sedes: string[]; lineas: string[]; celdas: MatrixCell[] };
}

interface FinanceUnavailable {
  disponible: false;
  motivo: string;
  /** Viajan aunque no haya datos: sin ellas el selector se quedaría vacío y no
   *  habría forma de deshacer el filtro que dejó la pantalla sin nada. */
  opciones?: FilterOptions;
}

type FinanceResponse = FinanceReport | FinanceUnavailable;

export type FinanceState =
  | { estado: 'cargando' }
  | { estado: 'listo'; datos: FinanceReport }
  | { estado: 'sin-datos'; motivo: string; opciones?: FilterOptions };

const NO_RESPONSE_MESSAGE =
  'No se pudieron consultar las cifras de la contabilidad. Intenta de nuevo en unos minutos.';

/** «?marca=Renault&sede=Toyota+Sur». Vacío cuando no hay ningún filtro. */
export function filtersToQuery(filters: FinanceFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useFinance(enabled: boolean, filters: FinanceFilters): FinanceState {
  const [state, setState] = useState<FinanceState>({ estado: 'cargando' });
  // Sin esto, el objeto de filtros se recrearía en cada render del padre y el
  // efecto volvería a pedir el reporte en bucle.
  const query = useMemo(() => filtersToQuery(filters), [filters]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    void api
      .get(`/api/indicadores/finanzas/${query}`)
      .then(async (response) => {
        const body = (await response.json()) as FinanceResponse;
        if (!alive) return;
        setState(
          body.disponible
            ? { estado: 'listo', datos: body }
            : { estado: 'sin-datos', motivo: body.motivo, opciones: body.opciones },
        );
      })
      .catch(() => {
        if (alive) setState({ estado: 'sin-datos', motivo: NO_RESPONSE_MESSAGE });
      });

    return () => {
      alive = false;
    };
  }, [enabled, query]);

  return state;
}

export type AnalysisState =
  | { estado: 'inactivo' }
  | { estado: 'generando' }
  | { estado: 'error'; mensaje: string };

const ANALYSIS_ERROR = 'No se pudo generar el análisis. Intenta de nuevo en unos minutos.';

/** Pide el PDF del análisis y lo descarga.
 *
 *  Va por `fetch` y no por un enlace: el endpoint exige el token, que vive en
 *  memoria. Tarda —el modelo escribe varios párrafos— así que el estado de
 *  «generando» es parte del contrato con quien lo pulsa. */
export function useFinanceAnalysis(filters: FinanceFilters) {
  const [state, setState] = useState<AnalysisState>({ estado: 'inactivo' });

  const generate = useCallback(async () => {
    setState({ estado: 'generando' });
    try {
      const response = await api.post(
        `/api/indicadores/finanzas/analisis/${filtersToQuery(filters)}`,
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        setState({ estado: 'error', mensaje: body?.detail ?? ANALYSIS_ERROR });
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = filenameFrom(response) ?? 'analisis-financiero.pdf';
      link.click();
      URL.revokeObjectURL(url);
      setState({ estado: 'inactivo' });
    } catch {
      setState({ estado: 'error', mensaje: ANALYSIS_ERROR });
    }
  }, [filters]);

  return { analysis: state, generate };
}

/** El nombre que puso el backend, que ya lleva la fecha y el filtro. */
function filenameFrom(response: Response): string | null {
  const header = response.headers.get('Content-Disposition');
  return header?.match(/filename="([^"]+)"/)?.[1] ?? null;
}
