import { useState } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

interface CambiarContrasenaProps {
  onCerrar: () => void;
}

interface RespuestaError {
  password_actual?: string[];
  password_nueva?: string[];
  detail?: string | string[];
}

function primerError(datos: RespuestaError): string {
  const candidato =
    datos.password_actual?.[0] ??
    datos.password_nueva?.[0] ??
    (Array.isArray(datos.detail) ? datos.detail[0] : datos.detail);
  return candidato ?? 'No se pudo cambiar la contraseña. Intenta de nuevo.';
}

/** Cambio voluntario de la propia contraseña. */
export function CambiarContrasena({ onCerrar }: CambiarContrasenaProps) {
  const { refrescarPerfil } = useAuth();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const enviar = async () => {
    if (nueva !== repetida) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    setGuardando(true);
    setError(null);
    const resp = await api.post('/api/auth/mi-contrasena/', {
      password_actual: actual,
      password_nueva: nueva,
    });
    setGuardando(false);
    if (!resp.ok) {
      setError(primerError((await resp.json()) as RespuestaError));
      return;
    }
    await refrescarPerfil();
    onCerrar();
  };

  const campos = [
    ['Contraseña actual', actual, setActual, 'current-password'],
    ['Nueva contraseña', nueva, setNueva, 'new-password'],
    ['Repite la nueva contraseña', repetida, setRepetida, 'new-password'],
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-cambiar-contrasena"
    >
      <form
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <h2 id="titulo-cambiar-contrasena" className="text-lg font-semibold text-ink">
          Cambiar mi contraseña
        </h2>
        <p className="mt-1 text-sm text-muted">
          Es opcional. Si prefieres seguir entrando con tu cédula, cierra esta ventana.
        </p>

        {campos.map(([etiqueta, valor, asignar, autocompletar]) => (
          <div key={etiqueta} className="mt-3">
            <label className="mb-1 block text-xs font-medium text-body" htmlFor={etiqueta}>
              {etiqueta}
            </label>
            <input
              id={etiqueta}
              type="password"
              required
              autoComplete={autocompletar}
              value={valor}
              onChange={(e) => asignar(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-brand"
            />
          </div>
        ))}

        {error && (
          <p role="alert" className="mt-3 text-sm text-brand">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors duration-150 hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
