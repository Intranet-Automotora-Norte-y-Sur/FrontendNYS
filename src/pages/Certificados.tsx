import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Certificado {
  id: number;
  tipo: 'laboral' | 'nomina';
  tipo_display: string;
  periodo: string;
  codigo_verificacion: string;
  fecha_generacion: string;
}

interface Periodo {
  anio: number;
  mes: number;
  etiqueta: string;
}

/** Los errores de la API llegan como {campo: ["texto"]}. */
function primerError(data: Record<string, string[] | string>, respaldo: string): string {
  const primero = Object.values(data)[0];
  if (Array.isArray(primero)) return primero[0];
  return typeof primero === 'string' ? primero : respaldo;
}

const TIPOS = [
  {
    tipo: 'laboral' as const,
    titulo: 'Certificado laboral',
    desc: 'Cargo, antigüedad, tipo de contrato y salario (si está registrado).',
  },
];

export function Certificados() {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodo, setPeriodo] = useState('');
  const [generando, setGenerando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const resp = await api.get('/api/certificados/');
    if (resp.ok) setCertificados((await resp.json()) as Certificado[]);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    void (async () => {
      const resp = await api.get('/api/certificados/nomina/periodos/');
      if (!resp.ok) return;
      const datos = (await resp.json()) as Periodo[];
      setPeriodos(datos);
      // El mes más reciente es el que casi siempre se pide.
      if (datos.length > 0) setPeriodo(`${datos[0].anio}-${datos[0].mes}`);
    })();
  }, []);

  const generar = async (tipo: string) => {
    setGenerando(tipo);
    setError(null);
    const resp = await api.post('/api/certificados/generar/', { tipo });
    setGenerando(null);
    if (!resp.ok) {
      const data = (await resp.json().catch(() => ({}))) as Record<string, string[]>;
      setError(primerError(data, 'No se pudo generar el certificado.'));
      return;
    }
    await cargar();
  };

  const generarNomina = async () => {
    const [anio, mes] = periodo.split('-').map(Number);
    if (!anio || !mes) return;
    setGenerando('nomina');
    setError(null);
    const resp = await api.post('/api/certificados/nomina/', { anio, mes });
    setGenerando(null);
    if (!resp.ok) {
      const data = (await resp.json().catch(() => ({}))) as Record<string, string[]>;
      setError(primerError(data, 'No se pudo generar el comprobante de nómina.'));
      return;
    }
    const creado = (await resp.json().catch(() => null)) as Certificado | null;
    await cargar();
    // Quien pide su desprendible lo quiere ya: se descarga sin un clic extra.
    if (creado) await descargar(creado);
  };

  const descargar = async (cert: Certificado) => {
    const resp = await api.get(`/api/certificados/${cert.id}/descargar/`);
    if (!resp.ok) {
      setError('No se pudo descargar el certificado.');
      return;
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = cert.periodo
      ? `comprobante-nomina-${cert.periodo.replace(/ de /, '-')}.pdf`
      : `certificado-${cert.tipo}.pdf`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="cert-titulo">
      <h1 id="cert-titulo" className="sr-only">Certificados</h1>
      <p className="max-w-xl text-sm text-muted">
        Cada documento incluye un código de verificación de autenticidad.
      </p>

      {error && (
        <p role="alert" className="mt-4 max-w-xl rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
          {error}
        </p>
      )}

      <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
        {TIPOS.map(({ tipo, titulo, desc }) => (
          <article key={tipo} className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-bold text-ink">{titulo}</h2>
            <p className="mt-1 text-sm text-muted">{desc}</p>
            <button
              type="button"
              disabled={generando !== null}
              onClick={() => void generar(tipo)}
              className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {generando === tipo ? 'Generando…' : 'Generar PDF'}
            </button>
          </article>
        ))}

        <article className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-lg font-bold text-ink">Comprobante de nómina</h2>
          <p className="mt-1 text-sm text-muted">
            Desprendible de pago del mes que elijas, con devengados, deducciones y neto.
          </p>
          <label htmlFor="periodo-nomina" className="mt-4 block text-xs font-medium text-muted">
            Mes
          </label>
          <select
            id="periodo-nomina"
            value={periodo}
            onChange={(evento) => setPeriodo(evento.target.value)}
            disabled={periodos.length === 0}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink transition-colors duration-150 hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
          >
            {periodos.map((p) => (
              <option key={`${p.anio}-${p.mes}`} value={`${p.anio}-${p.mes}`}>
                {p.etiqueta}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={generando !== null || periodo === ''}
            onClick={() => void generarNomina()}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {generando === 'nomina' ? 'Consultando nómina…' : 'Descargar PDF'}
          </button>
        </article>
      </div>

      <h2 className="mt-10 font-display text-xl font-bold text-ink">Historial</h2>
      {certificados.length === 0 ? (
        <p className="mt-3 max-w-3xl rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          Aún no has generado certificados.
        </p>
      ) : (
        <ul className="mt-3 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-white">
          {certificados.map((cert) => (
            <li key={cert.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">
                  {cert.tipo_display}
                  {cert.periodo && <span className="text-muted"> · {cert.periodo}</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {new Date(cert.fecha_generacion).toLocaleString('es-CO')} · Verificación:{' '}
                  {cert.codigo_verificacion}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void descargar(cert)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-body transition-colors duration-150 hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                Descargar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
