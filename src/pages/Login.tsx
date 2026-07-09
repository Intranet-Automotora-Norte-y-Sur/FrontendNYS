import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { CarruselCarros } from '../components/hero/CarruselCarros';
import { Icono } from '../components/ui/Icono';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const mensaje = await login(usuario, password);
    setEnviando(false);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    navigate('/');
  };

  return (
    <CarruselCarros>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl rounded-3xl bg-white p-10 text-body shadow-2xl"
      >
        <img src={logo} alt="Automotora Norte y Sur" className="h-8 w-auto" />
        <h2 className="mt-5 font-display text-3xl font-extrabold text-ink">Bienvenido</h2>
        <p className="mb-6 mt-1 text-sm text-muted">
          Ingresa con el usuario y la contraseña que te entregó Sistemas.
        </p>

        <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="usuario">
          Usuario
        </label>
        <div className="relative mb-4">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Icono nombre="personas" className="h-4 w-4" />
          </span>
          <input
            id="usuario"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="tu.usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full rounded-xl border border-line py-2.5 pl-10 pr-3 outline-none transition-colors duration-150 focus:border-brand"
          />
        </div>

        <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="password">
          Contraseña
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Icono nombre="candado" className="h-4 w-4" />
          </span>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-line py-2.5 pl-10 pr-3 outline-none transition-colors duration-150 focus:border-brand"
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-4 w-full rounded-xl bg-brand py-3 font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <p className="mt-5 text-center text-xs text-muted">
          ¿No tienes cuenta o olvidaste tu contraseña? Comunícate con el área de
          Sistemas para que te generen una.
        </p>
      </form>
    </CarruselCarros>
  );
}
