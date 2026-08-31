import { useEffect, useState, type FormEvent } from 'react';
import { AnalisisSugerencias } from '../components/sugerencias/AnalisisSugerencias';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

interface SugerenciaRecibida {
  id: number;
  mensaje: string;
  fecha: string;
  anonimo: boolean;
  autor: string;
}

function BandejaAdmin() {
  const [recibidas, setRecibidas] = useState<SugerenciaRecibida[] | null>(null);

  useEffect(() => {
    let activo = true;
    void api.get('/api/sugerencias/').then(async (resp) => {
      if (!activo) return;
      setRecibidas(resp.ok ? ((await resp.json()) as SugerenciaRecibida[]) : []);
    });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <section aria-labelledby="bandeja-titulo" className="mt-10">
      <h2 id="bandeja-titulo" className="font-display text-xl font-bold text-ink">
        Sugerencias recibidas
      </h2>
      <p className="mt-1 text-sm text-muted">
        Visible solo para administradores. Las anónimas no guardan autor.
      </p>

      <AnalisisSugerencias haySugerencias={(recibidas?.length ?? 0) > 0} />

      {recibidas === null ? (
        <div className="mt-4 rounded-2xl border border-line bg-white p-6 text-center text-sm text-muted">
          Cargando…
        </div>
      ) : recibidas.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          Aún no hay sugerencias.
        </div>
      ) : (
        <ul className="mt-4 grid gap-3">
          {recibidas.map((s) => (
            <li key={s.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display font-bold text-ink">
                  {s.anonimo ? 'Anónimo' : s.autor}
                </p>
                <time dateTime={s.fecha} className="text-xs text-muted">
                  {new Date(s.fecha).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-body">{s.mensaje}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Sugerencias() {
  const { usuario } = useAuth();
  const [mensaje, setMensaje] = useState('');
  const [anonimo, setAnonimo] = useState(false);
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'enviado' | 'error'>('inicial');
  const [detalleError, setDetalleError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEstado('enviando');
    const resp = await api.post('/api/sugerencias/', { mensaje, anonimo });
    if (resp.ok) {
      setEstado('enviado');
      setMensaje('');
      setAnonimo(false);
      return;
    }
    setDetalleError(
      resp.status === 429
        ? 'Has alcanzado el límite de sugerencias por hoy. Intenta mañana.'
        : 'No se pudo enviar. Intenta de nuevo.',
    );
    setEstado('error');
  };

  return (
    <section aria-labelledby="sug-titulo">
      <h1 id="sug-titulo" className="sr-only">Buzón de sugerencias</h1>
      <p className="max-w-xl text-sm text-muted">
        Si eliges envío anónimo, tu identidad no se guarda en ninguna parte.
      </p>

      <form onSubmit={onSubmit} className="mt-6 max-w-xl rounded-2xl border border-line bg-white p-6">
        <label className="mb-1 block text-sm font-medium text-body" htmlFor="mensaje">
          Tu sugerencia
        </label>
        <textarea
          id="mensaje"
          required
          rows={5}
          maxLength={2000}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="w-full resize-y rounded-lg border border-line px-3 py-2 outline-none transition-colors duration-150 focus:border-brand"
          placeholder="Cuéntanos tu idea, queja o propuesta…"
        />

        <label className="mt-3 flex items-center gap-2 text-sm text-body">
          <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
          Enviar de forma anónima
        </label>

        {estado === 'enviado' && (
          <p role="status" className="mt-4 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">
            ¡Gracias! Tu sugerencia fue enviada{anonimo ? ' de forma anónima' : ''}.
          </p>
        )}
        {estado === 'error' && (
          <p role="alert" className="mt-4 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
            {detalleError}
          </p>
        )}

        <button
          type="submit"
          disabled={estado === 'enviando' || !mensaje.trim()}
          className="mt-5 rounded-lg bg-brand px-5 py-2.5 font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {estado === 'enviando' ? 'Enviando…' : 'Enviar sugerencia'}
        </button>
      </form>

      {usuario?.rol === 'admin' && <BandejaAdmin />}
    </section>
  );
}
