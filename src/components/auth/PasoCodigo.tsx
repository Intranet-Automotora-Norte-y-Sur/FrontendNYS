import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth, type RetoCodigo } from '../../hooks/useAuth';
import { Icono } from '../ui/Icono';

/** Longitud del código que envía el backend (TWO_FACTOR_CODE_LENGTH). */
const LARGO_CODIGO = 6;

interface PasoCodigoProps {
  reto: RetoCodigo;
  /** La sesión ya quedó abierta: el contenedor navega al portal. */
  onVerificado: () => void;
  /** Volver a usuario y contraseña (se equivocó de cuenta, p. ej.). */
  onCancelar: () => void;
}

function mmss(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Cuenta atrás en segundos; se detiene sola al llegar a cero. */
function useCuentaAtras(inicial: number): [number, (valor: number) => void] {
  const [restante, setRestante] = useState(inicial);
  useEffect(() => {
    if (restante <= 0) return;
    const id = setTimeout(() => setRestante((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [restante]);
  return [restante, setRestante];
}

/** Segundo paso del ingreso: el código de un solo uso que llegó al correo. */
export function PasoCodigo({ reto, onVerificado, onCancelar }: PasoCodigoProps) {
  const { verificarCodigo, reenviarCodigo } = useAuth();
  const [actual, setActual] = useState(reto);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [vigencia, setVigencia] = useCuentaAtras(reto.expiraEn);
  const [espera, setEspera] = useCuentaAtras(reto.reenvioEn);
  const campo = useRef<HTMLInputElement>(null);

  // El foco entra directo al código: el usuario viene de darle a "Ingresar".
  useEffect(() => campo.current?.focus(), []);

  const verificar = useCallback(
    async (valor: string) => {
      setEnviando(true);
      setError(null);
      setAviso(null);
      const resultado = await verificarCodigo(actual.token, valor);
      setEnviando(false);
      if (resultado.estado === 'error') {
        setError(resultado.mensaje);
        setCodigo('');
        campo.current?.focus();
        return;
      }
      onVerificado();
    },
    [actual.token, onVerificado, verificarCodigo],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (codigo.length === LARGO_CODIGO) void verificar(codigo);
  };

  const onCambio = (valor: string) => {
    const limpio = valor.replace(/\D/g, '').slice(0, LARGO_CODIGO);
    setCodigo(limpio);
    setError(null);
    // Con el código completo no tiene sentido pedir un clic más.
    if (limpio.length === LARGO_CODIGO) void verificar(limpio);
  };

  const reenviar = async () => {
    setEnviando(true);
    setError(null);
    const resultado = await reenviarCodigo(actual.token);
    setEnviando(false);
    if (resultado.estado === 'error') {
      setError(resultado.mensaje);
      return;
    }
    if (resultado.estado === 'ok') {
      onVerificado();
      return;
    }
    setActual(resultado.reto);
    setCodigo('');
    setVigencia(resultado.reto.expiraEn);
    setEspera(resultado.reto.reenvioEn);
    setAviso('Te enviamos un código nuevo.');
    campo.current?.focus();
  };

  const vencido = vigencia <= 0;

  return (
    <form
      onSubmit={onSubmit}
      className="relative rounded-3xl border border-white/10 bg-[#0d131f]/90 p-11 shadow-2xl shadow-black/40 backdrop-blur"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-brand/60 shadow-[0_0_24px_2px_rgba(228,0,43,0.4)]"
        style={{ animation: 'ns-linea-roja 3s ease-in-out infinite' }}
      />

      <div className="mb-7 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand">
          <Icono nombre="correo" className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Revisa tu correo
          </h2>
          <p className="text-sm text-white/50">
            Enviamos un código de {LARGO_CODIGO} dígitos a{' '}
            <span className="font-semibold text-white/80">{actual.correo}</span>
          </p>
        </div>
      </div>

      <label className="mb-1.5 block text-sm font-semibold text-white/80" htmlFor="codigo">
        Código de verificación
      </label>
      <input
        ref={campo}
        id="codigo"
        // "text" + inputMode numérico: en móvil abre el teclado de números sin
        // las flechitas de incremento que trae type="number".
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        // Deja que iOS y Android ofrezcan el código del SMS/correo al teclear.
        pattern="\d*"
        maxLength={LARGO_CODIGO}
        required
        disabled={enviando || vencido}
        placeholder="000000"
        value={codigo}
        onChange={(e) => onCambio(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 py-4 text-center font-mono text-3xl font-bold tracking-[0.5em] text-white placeholder-white/20 outline-none transition-colors duration-150 focus:border-brand focus:bg-white/10 disabled:opacity-50"
      />

      <p className="mt-2 text-sm text-white/40">
        {vencido ? (
          <span className="text-brand">El código venció. Pide uno nuevo.</span>
        ) : (
          <>Vence en {mmss(vigencia)}</>
        )}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand"
        >
          {error}
        </p>
      )}
      {aviso && !error && (
        <p
          role="status"
          className="mt-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/70"
        >
          {aviso}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || codigo.length !== LARGO_CODIGO}
        className="mt-5 w-full rounded-xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-brand/30 transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {enviando ? 'Verificando…' : 'Verificar e ingresar'}
      </button>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onCancelar}
          className="font-medium text-white/50 transition-colors duration-150 hover:text-white"
        >
          ← Usar otra cuenta
        </button>
        <button
          type="button"
          onClick={() => void reenviar()}
          disabled={enviando || espera > 0}
          className="font-medium text-brand hover:underline disabled:text-white/30 disabled:no-underline"
        >
          {espera > 0 ? `Reenviar en ${espera}s` : 'Reenviar código'}
        </button>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-white/40">
        <Icono nombre="candado" className="h-3.5 w-3.5 shrink-0" />
        Si no pediste este código, cambia tu contraseña y avísale a Sistemas.
      </p>
    </form>
  );
}
