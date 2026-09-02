import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Resultado {
  valido: boolean;
  tipo?: string;
  nombre?: string;
  fecha_generacion?: string;
}

type Estado = 'cargando' | 'valido' | 'invalido' | 'error';

/** WhatsApp de Gestión Humana. Solo dígitos con indicativo: lo exige wa.me. */
const WHATSAPP_GESTION_HUMANA = '573053560623';
/** El mismo número, como lo lee una persona. */
const TELEFONO_GESTION_HUMANA = '+57 305 3560623';

/** Enlace a WhatsApp con el código ya escrito: nadie transcribe un UUID a mano. */
function enlaceWhatsapp(codigo: string | undefined): string {
  const mensaje = codigo
    ? `Hola, escribo por el certificado con código de verificación ${codigo}.`
    : 'Hola, escribo por un certificado laboral.';
  return `https://wa.me/${WHATSAPP_GESTION_HUMANA}?text=${encodeURIComponent(mensaje)}`;
}

// Página PÚBLICA (sin sesión): la usan bancos/terceros para validar certificados.
export default function Verificar() {
  const { codigo } = useParams<{ codigo: string }>();
  const [estado, setEstado] = useState<Estado>('cargando');
  const [datos, setDatos] = useState<Resultado | null>(null);

  useEffect(() => {
    if (!codigo) {
      setEstado('invalido');
      return;
    }
    fetch(`/api/certificados/verificar/${codigo}/`)
      .then(async (resp) => {
        if (resp.ok) {
          setDatos((await resp.json()) as Resultado);
          setEstado('valido');
        } else if (resp.status === 404) {
          setEstado('invalido');
        } else {
          setEstado('error');
        }
      })
      .catch(() => setEstado('error'));
  }, [codigo]);

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4">
      <section
        aria-labelledby="verificar-titulo"
        className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-sm"
      >
        <p className="font-display text-lg font-bold text-ink">
          AUTOMOTORA NORTE <span className="text-brand">Y</span> SUR
        </p>
        <h1 id="verificar-titulo" className="mt-1 text-sm uppercase tracking-[0.2em] text-muted">
          Verificación de certificados
        </h1>

        {estado === 'cargando' && <p className="mt-8 text-sm text-muted">Verificando…</p>}

        {estado === 'valido' && datos && (
          <>
            <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-full bg-ok/10 text-3xl text-ok" aria-hidden>
              ✓
            </div>
            <p className="mt-4 text-lg font-semibold text-ok">Certificado auténtico</p>
            <dl className="mt-6 space-y-3 text-left text-sm">
              <div className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-muted">Tipo</dt>
                <dd className="font-medium text-ink">{datos.tipo}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-muted">Emitido a</dt>
                <dd className="font-medium text-ink">{datos.nombre}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-muted">Fecha de emisión</dt>
                <dd className="font-medium text-ink">{datos.fecha_generacion}</dd>
              </div>
            </dl>
            <p className="mt-6 text-xs text-muted">
              Este documento fue emitido por Automotora Norte y Sur Ltda. Compare estos datos
              con el certificado que le fue presentado; si no coinciden, el documento fue alterado.
            </p>
          </>
        )}

        {estado === 'invalido' && (
          <>
            <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-3xl text-brand" aria-hidden>
              ✕
            </div>
            <p className="mt-4 text-lg font-semibold text-brand">Certificado no válido</p>
            <p className="mt-3 text-sm text-muted">
              El código no corresponde a ningún certificado emitido por Automotora Norte y Sur.
              El documento presentado puede ser falso.
            </p>
          </>
        )}

        {estado === 'error' && (
          <p className="mt-8 text-sm text-muted">
            No se pudo consultar el sistema. Intente de nuevo en unos minutos.
          </p>
        )}

        {/* Fuera de los estados a propósito: hace falta tanto si el documento es
            auténtico (dudas) como si no lo es (denunciarlo) o si el sistema falla. */}
        {estado !== 'cargando' && (
          <div className="mt-8 border-t border-line pt-6">
            <p className="text-xs text-muted">¿Tiene dudas sobre este documento?</p>
            <a
              href={enlaceWhatsapp(codigo)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-ok px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-ok/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ok"
            >
              Escribir a Gestión Humana
            </a>
            <p className="mt-2 text-xs text-muted">{TELEFONO_GESTION_HUMANA}</p>
          </div>
        )}
      </section>
    </main>
  );
}
