import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';

interface Opcion {
  valor: string;
  etiqueta: string;
}

interface Opciones {
  /** Las seis sedes del formulario, no las de la nómina. */
  sedes: Opcion[];
  tipos: Opcion[];
}

type Estado = 'inicial' | 'enviando' | 'enviado' | 'error';

const CAMPO =
  'w-full rounded-lg border border-line px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-brand';

/** Pregunta de Sí/No, como en el formulario de la compañía. */
function Binaria({
  etiqueta,
  valor,
  onChange,
  ayuda,
}: {
  etiqueta: string;
  valor: boolean;
  onChange: (v: boolean) => void;
  ayuda?: string;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-medium text-body">{etiqueta}</legend>
      {ayuda && <p className="mt-1 text-xs text-muted">{ayuda}</p>}
      <div className="mt-2 flex gap-6">
        {[
          { texto: 'Sí', v: true },
          { texto: 'No', v: false },
        ].map((op) => (
          <label key={op.texto} className="flex items-center gap-2 text-sm text-body">
            <input
              type="radio"
              checked={valor === op.v}
              onChange={() => onChange(op.v)}
              className="accent-brand"
            />
            {op.texto}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Sugerencias() {
  const [opciones, setOpciones] = useState<Opciones | null>(null);
  const [sede, setSede] = useState('');
  const [anonimo, setAnonimo] = useState(true);
  const [nombre, setNombre] = useState('');
  const [quiereRespuesta, setQuiereRespuesta] = useState(false);
  const [correo, setCorreo] = useState('');
  const [tipo, setTipo] = useState('sugerencia');
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState<Estado>('inicial');
  const [radicado, setRadicado] = useState<number | null>(null);
  const [detalleError, setDetalleError] = useState('');

  useEffect(() => {
    let activo = true;
    void api.get('/api/sugerencias/opciones/').then(async (resp) => {
      if (!activo || !resp.ok) return;
      setOpciones((await resp.json()) as Opciones);
    });
    return () => {
      activo = false;
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEstado('enviando');
    const resp = await api.post('/api/sugerencias/', {
      sede,
      anonimo,
      nombre_declarado: anonimo ? '' : nombre,
      quiere_respuesta: quiereRespuesta,
      correo: quiereRespuesta ? correo : '',
      tipo,
      mensaje,
    });
    if (resp.ok) {
      const datos = (await resp.json()) as { radicado: number };
      setRadicado(datos.radicado);
      setEstado('enviado');
      setSede('');
      setAnonimo(true);
      setNombre('');
      setQuiereRespuesta(false);
      setCorreo('');
      setTipo('sugerencia');
      setMensaje('');
      return;
    }
    setDetalleError(
      resp.status === 429
        ? 'Has alcanzado el límite de solicitudes por hoy. Intenta mañana.'
        : 'No se pudo enviar. Revisa los campos e intenta de nuevo.',
    );
    setEstado('error');
  };

  return (
    <section aria-labelledby="sug-titulo">
      <h1 id="sug-titulo" className="font-display text-2xl font-bold text-ink">
        Buzón Digital de Ideas y Mejoramiento
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Cuéntanos tu queja, sugerencia, oportunidad de mejora o felicitación. Si eliges
        envío anónimo, tu identidad no se guarda en ninguna parte.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 max-w-xl rounded-2xl border border-line bg-white p-6"
      >
        {/* 1. Sede */}
        <label className="mb-1 block text-sm font-medium text-body" htmlFor="sede">
          Sede <span className="text-brand">*</span>
        </label>
        <select
          id="sede"
          required
          value={sede}
          onChange={(e) => setSede(e.target.value)}
          className={CAMPO}
        >
          <option value="">Selecciona tu sede…</option>
          {(opciones?.sedes ?? []).map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.etiqueta}
            </option>
          ))}
        </select>

        {/* 2. Anónimo */}
        <Binaria
          etiqueta="¿Desea permanecer anónimo? *"
          valor={anonimo}
          onChange={setAnonimo}
        />

        {/* 3. Nombre — solo si NO es anónimo */}
        {!anonimo && (
          <div className="mt-6">
            <label className="mb-1 block text-sm font-medium text-body" htmlFor="nombre">
              Nombre completo <span className="text-brand">*</span>
            </label>
            <input
              id="nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={CAMPO}
            />
          </div>
        )}

        {/* 4. ¿Respuesta? */}
        <Binaria
          etiqueta="¿Desea recibir respuesta a su solicitud?"
          valor={quiereRespuesta}
          onChange={setQuiereRespuesta}
        />

        {/* 5. Correo — solo si quiere respuesta */}
        {quiereRespuesta && (
          <div className="mt-6">
            <label className="mb-1 block text-sm font-medium text-body" htmlFor="correo">
              Correo electrónico <span className="text-brand">*</span>
            </label>
            <input
              id="correo"
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={CAMPO}
            />
            {anonimo && (
              // El aviso importa: un correo identifica a quien escribe, así que
              // el anonimato deja de ser absoluto. Que sea una decisión, no una
              // sorpresa.
              <p
                role="note"
                className="mt-2 rounded-lg bg-warn/10 px-3 py-2 text-xs text-body"
              >
                Marcaste envío anónimo. Si dejas tu correo, quien administre el
                buzón podrá saber quién eres. Déjalo en blanco y desmarca esta
                opción si prefieres que nadie pueda identificarte.
              </p>
            )}
          </div>
        )}

        {/* 6. Tipo */}
        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-body">
            Tipo de solicitud <span className="text-brand">*</span>
          </legend>
          <div className="mt-2 grid gap-2">
            {(opciones?.tipos ?? []).map((t) => (
              <label key={t.valor} className="flex items-center gap-2 text-sm text-body">
                <input
                  type="radio"
                  name="tipo"
                  checked={tipo === t.valor}
                  onChange={() => setTipo(t.valor)}
                  className="accent-brand"
                />
                {t.etiqueta}
              </label>
            ))}
          </div>
        </fieldset>

        {/* 7. Descripción */}
        <div className="mt-6">
          <label className="mb-1 block text-sm font-medium text-body" htmlFor="mensaje">
            Descripción <span className="text-brand">*</span>
          </label>
          <textarea
            id="mensaje"
            required
            rows={5}
            maxLength={2000}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            className={`${CAMPO} resize-y`}
            placeholder="Cuéntanos con el mayor detalle posible…"
          />
        </div>

        {estado === 'enviado' && (
          <p role="status" className="mt-5 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">
            ¡Gracias! Tu solicitud quedó registrada con el radicado #{radicado}.
          </p>
        )}
        {estado === 'error' && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand"
          >
            {detalleError}
          </p>
        )}

        <button
          type="submit"
          disabled={estado === 'enviando' || !mensaje.trim() || !sede}
          className="mt-6 rounded-lg bg-brand px-5 py-2.5 font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {estado === 'enviando' ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </form>
    </section>
  );
}
