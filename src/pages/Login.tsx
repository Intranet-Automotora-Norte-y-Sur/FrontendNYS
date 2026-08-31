import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import arkana from '../assets/carros/arkana.webp';
import bz4x from '../assets/carros/bz4x.webp';
import corollaCross from '../assets/carros/corolla-cross.webp';
import duster from '../assets/carros/duster.webp';
import fortuner from '../assets/carros/fortuner.webp';
import hilux from '../assets/carros/hilux.webp';
import landCruiser from '../assets/carros/land-cruiser.webp';
import logan from '../assets/carros/logan.webp';
import oroch from '../assets/carros/oroch.webp';
import prado from '../assets/carros/prado.webp';
import rav4 from '../assets/carros/rav4.webp';
import sandero from '../assets/carros/sandero.webp';
import yarisCross from '../assets/carros/yaris-cross.webp';
import logo from '../assets/logo.png';
import { Icono } from '../components/ui/Icono';
import { useAuth } from '../hooks/useAuth';

interface Vehiculo {
  img: string;
  nombre: string;
  tag: string;
  ghost: string;
}

const VEHICULOS: Vehiculo[] = [
  { img: prado, nombre: 'Land Cruiser Prado', tag: 'SUV · Aventura', ghost: 'PRADO' },
  { img: corollaCross, nombre: 'Corolla Cross Híbrido', tag: 'Híbrido · Ciudad', ghost: 'COROLLA' },
  { img: yarisCross, nombre: 'Yaris Cross', tag: 'SUV compacto', ghost: 'YARIS' },
  { img: bz4x, nombre: 'bZ4X Eléctrico', tag: '100% eléctrico', ghost: 'bZ4X' },
  { img: landCruiser, nombre: 'Land Cruiser', tag: 'SUV · Leyenda 4x4', ghost: 'CRUISER' },
  { img: fortuner, nombre: 'Fortuner', tag: 'SUV · 7 puestos', ghost: 'FORTUNER' },
  { img: hilux, nombre: 'Hilux', tag: 'Pick-up · Trabajo', ghost: 'HILUX' },
  { img: rav4, nombre: 'RAV4', tag: 'SUV · Híbrida', ghost: 'RAV4' },
  { img: arkana, nombre: 'Arkana', tag: 'SUV Coupé', ghost: 'ARKANA' },
  { img: duster, nombre: 'Duster', tag: 'SUV · 4x4', ghost: 'DUSTER' },
  { img: sandero, nombre: 'Sandero', tag: 'Hatchback', ghost: 'SANDERO' },
  { img: oroch, nombre: 'Oroch', tag: 'Pick-up · Urbana', ghost: 'OROCH' },
  { img: logan, nombre: 'Logan', tag: 'Sedán · Familiar', ghost: 'LOGAN' },
];

const INTERVALO_MS = 6000;

const STATS = [
  { valor: '5', etiqueta: 'Sedes · Norte y Sur' },
  { valor: '+40', etiqueta: 'Años en el mercado' },
  { valor: '100%', etiqueta: 'Autohospedado y seguro' },
];

const DEMOS: { rol: string; usuario: string; password: string }[] = [
  { rol: 'Colaborador', usuario: 'mlopez', password: 'NorteSur*2026' },
  { rol: 'Editor', usuario: 'cperez', password: 'NorteSur*2026' },
  { rol: 'Admin', usuario: 'carlos', password: '' },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [indice, setIndice] = useState(0);

  const siguiente = useCallback(
    () => setIndice((i) => (i + 1) % VEHICULOS.length),
    [],
  );
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(siguiente, INTERVALO_MS);
    return () => clearInterval(timer);
  }, [siguiente]);

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

  const usarDemo = (u: string, p: string) => {
    setUsuario(u);
    setPassword(p);
    setError(null);
  };

  const v = VEHICULOS[indice];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] text-white">
      <style>{`
        @keyframes ns-linea { 0%{transform:translateX(-100%);opacity:0} 12%{opacity:.55} 88%{opacity:.55} 100%{transform:translateX(100%);opacity:0} }
        @keyframes ns-linea-roja { 0%,100%{opacity:.55} 50%{opacity:1} }
      `}</style>

      {/* Cuadrícula de fondo tipo blueprint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 100% 0%, rgba(228,0,43,0.18), transparent 55%), radial-gradient(90% 80% at 0% 100%, rgba(37,99,235,0.14), transparent 60%)',
        }}
      />

      {/* Líneas blancas horizontales en movimiento */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[18, 38, 62, 80].map((top, i) => (
          <span
            key={top}
            className="absolute left-0 h-px w-1/2"
            style={{
              top: `${top}%`,
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              animation: `ns-linea ${9 + i * 2}s linear ${i * 1.6}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Logo arriba a la izquierda */}
      <img
        src={logo}
        alt="Automotora Norte y Sur"
        className="absolute left-6 top-5 z-20 h-8 w-auto invert"
      />

      {/* Sello de portal seguro */}
      <div className="absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
        Portal seguro · Automotora Norte y Sur
      </div>

      <div className="relative z-10 grid min-h-screen w-full items-center gap-10 px-6 pb-16 pt-24 lg:grid-cols-[1fr_680px] lg:gap-16 lg:px-10 xl:px-14">
        {/* Columna izquierda — hero + carrusel de vehículos */}
        <section className="hidden min-h-[82vh] flex-col justify-between lg:flex">
          {/* Grupo superior */}
          <div>
            <span className="mb-6 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              Intranet Corporativa 2026
            </span>
            <h1 className="font-display text-6xl font-extrabold leading-[0.95] tracking-tight xl:text-7xl">
              Tu día a día,
              <br />
              <span className="text-brand">sobre ruedas.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/60">
              Certificados, indicadores en vivo y la Academia — todo en un mismo
              lugar, con la potencia de nuestra red Norte y Sur.
            </p>
          </div>

          {/* Vitrina de vehículos (centro) */}
          <div className="relative flex flex-1 items-center py-6">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 select-none font-display text-[5.5rem] font-extrabold leading-none tracking-tight text-white/[0.06] xl:text-[7rem]"
            >
              {v.ghost}
            </span>
            <div
              aria-hidden="true"
              className="absolute left-0 top-[62%] h-px w-full bg-gradient-to-r from-brand/70 via-brand/20 to-transparent"
            />
            <img
              key={v.img}
              src={v.img}
              alt={`Toyota ${v.nombre}`}
              className="relative z-10 mx-auto max-h-[26rem] w-full max-w-2xl object-contain drop-shadow-[0_30px_45px_rgba(0,0,0,.55)] xl:max-h-[30rem]"
              style={{ animation: 'entrada-carro 700ms cubic-bezier(0.16,1,0.3,1)' }}
            />
          </div>

          {/* Grupo inferior: detalle del vehículo, controles y cifras */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur">
                <span className="font-display text-lg font-bold">{v.nombre}</span>
                <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
                  {v.tag}
                </span>
              </div>
              <div className="flex items-center gap-2" role="tablist" aria-label="Vehículos">
                {VEHICULOS.map((s, i) => (
                  <button
                    key={s.nombre}
                    type="button"
                    role="tab"
                    aria-selected={i === indice}
                    aria-label={s.nombre}
                    onClick={() => setIndice(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === indice ? 'w-7 bg-white' : 'w-2.5 bg-white/25 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            <dl className="mt-6 flex items-end gap-10 border-t border-white/10 pt-6">
              {STATS.map((s) => (
                <div key={s.etiqueta}>
                  <dt className="sr-only">{s.etiqueta}</dt>
                  <dd>
                    <span className="block font-display text-4xl font-extrabold text-white">
                      {s.valor}
                    </span>
                    <span className="text-xs text-white/50">{s.etiqueta}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Columna derecha — tarjeta de acceso */}
        <section className="mx-auto w-full max-w-2xl lg:ml-auto lg:mr-0">
          <form
            onSubmit={onSubmit}
            className="relative rounded-3xl border border-white/10 bg-[#0d131f]/90 p-11 shadow-2xl shadow-black/40 backdrop-blur"
          >
            {/* Marco rojo alrededor de la tarjeta */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-brand/60 shadow-[0_0_24px_2px_rgba(228,0,43,0.4)]"
              style={{ animation: 'ns-linea-roja 3s ease-in-out infinite' }}
            />

            <div className="mb-7 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5">
                <img src={logo} alt="Norte y Sur" className="h-7 w-auto invert" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Acceso colaboradores
                </h2>
                <p className="text-sm text-white/50">
                  Ingresa con las credenciales que te entregó Sistemas
                </p>
              </div>
            </div>

            <label
              className="mb-1.5 block text-sm font-semibold text-white/80"
              htmlFor="usuario"
            >
              Usuario
            </label>
            <div className="relative mb-4">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
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
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-3 text-white placeholder-white/30 outline-none transition-colors duration-150 focus:border-brand focus:bg-white/10"
              />
            </div>

            <label
              className="mb-1.5 block text-sm font-semibold text-white/80"
              htmlFor="password"
            >
              Contraseña
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
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
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-3 text-white placeholder-white/30 outline-none transition-colors duration-150 focus:border-brand focus:bg-white/10"
              />
            </div>

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() =>
                  setError(
                    'Comunícate con el área de Sistemas para restablecer tu contraseña.',
                  )
                }
                className="text-sm font-medium text-brand hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-5 w-full rounded-xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-brand/30 transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {enviando ? 'Ingresando…' : 'Ingresar al portal'}
            </button>

            <div className="my-5 flex items-center gap-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/30">
              <span className="h-px flex-1 bg-white/10" />
              Acceso rápido · Demo
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {DEMOS.map((d) => (
                <button
                  key={d.rol}
                  type="button"
                  onClick={() => usarDemo(d.usuario, d.password)}
                  className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/80 transition-colors duration-150 hover:border-brand hover:text-white"
                >
                  {d.rol}
                </button>
              ))}
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-white/40">
              <Icono nombre="candado" className="h-3.5 w-3.5" />
              Validación segura contra la lista maestra · Ley 1581 de 2012
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
