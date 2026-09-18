import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface CasoAsignado {
  estado: string;
}

/** Cuántos casos del buzón tiene abiertos quien está en sesión.
 *
 *  El menú lo usa para decidir si «Mis casos» aparece: la mayoría de la gente
 *  nunca recibe uno, y un enlace permanentemente vacío es ruido. Se pide una
 *  vez por sesión de navegación, no en cada cambio de página. */
export function useCasosAsignados(): number {
  const [abiertos, setAbiertos] = useState(0);

  useEffect(() => {
    let vigente = true;
    void api.get('/api/sugerencias/mis-casos/').then(async (resp) => {
      if (!resp.ok || !vigente) return;
      const casos = (await resp.json()) as CasoAsignado[];
      if (vigente) setAbiertos(casos.filter((c) => c.estado !== 'cerrada').length);
    });
    return () => {
      vigente = false;
    };
  }, []);

  return abiertos;
}
