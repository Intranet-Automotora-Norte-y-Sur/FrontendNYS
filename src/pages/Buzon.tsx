import { InformeBuzon } from '../components/sugerencias/InformeBuzon';

// El informe del buzón vivía dentro de Administración y la volvía larguísima:
// son dos trabajos distintos (cuentas vs. casos), así que ahora es su propia pestaña.
export default function Buzon() {
  return <InformeBuzon />;
}
