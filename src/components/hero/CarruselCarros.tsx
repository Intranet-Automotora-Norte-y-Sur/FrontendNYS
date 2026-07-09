import { useCallback, useEffect, useState, type ReactNode } from 'react';
import arkana from '../../assets/carros/arkana.webp';
import bz4x from '../../assets/carros/bz4x.webp';
import corollaCross from '../../assets/carros/corolla-cross.webp';
import duster from '../../assets/carros/duster.webp';
import prado from '../../assets/carros/prado.webp';
import sandero from '../../assets/carros/sandero.webp';
import yarisCross from '../../assets/carros/yaris-cross.webp';
import logo from '../../assets/logo.png';
import { Icono } from '../ui/Icono';

interface Slide {
  img: string;
  nombre: string;
  tag: string;
  desc: string;
  bg: string;
  glow: string;
  ghost: string;
}

const SLIDES: Slide[] = [
  { img: prado, nombre: 'Land Cruiser Prado', tag: 'SUV · Aventura', desc: 'Capacidad todoterreno y tecnología híbrida para llegar más lejos con Norte y Sur.', bg: '#12233A', glow: '#2E6FB833', ghost: 'PRADO' },
  { img: corollaCross, nombre: 'Corolla Cross Híbrido', tag: 'Híbrido · Ciudad', desc: 'Eficiencia híbrida y espacio para el día a día. La favorita de las familias.', bg: '#0E2A22', glow: '#16A34A33', ghost: 'COROLLA' },
  { img: yarisCross, nombre: 'Yaris Cross', tag: 'SUV compacto', desc: 'Ágil, moderno y conectado. Perfecto para moverte por la ciudad con estilo.', bg: '#2A1016', glow: '#E4002B33', ghost: 'YARIS' },
  { img: bz4x, nombre: 'bZ4X Eléctrico', tag: '100% eléctrico', desc: 'La nueva era de la movilidad cero emisiones llega a la vitrina Norte y Sur.', bg: '#101B2E', glow: '#0EA5E933', ghost: 'bZ4X' },
  { img: arkana, nombre: 'Arkana', tag: 'SUV Coupé', desc: 'Diseño coupé y presencia deportiva. Rompe con lo convencional.', bg: '#20131F', glow: '#7C3AED33', ghost: 'ARKANA' },
  { img: duster, nombre: 'Duster', tag: 'SUV · 4x4', desc: 'Robusta y confiable para el trabajo y la aventura, respaldada por nuestro taller.', bg: '#231A0E', glow: '#D9770633', ghost: 'DUSTER' },
  { img: sandero, nombre: 'Sandero', tag: 'Hatchback', desc: 'Práctico, económico y con el respaldo posventa de Norte y Sur.', bg: '#0E1E2E', glow: '#2563EB33', ghost: 'SANDERO' },
];

const INTERVALO_MS = 6000;

/** Vitrina de vehículos a pantalla completa con cuadrícula de fondo.
 *  `children` = tarjeta flotante (login) superpuesta a la derecha. */
export function CarruselCarros({ children }: { children: ReactNode }) {
  const [indice, setIndice] = useState(0);

  const siguiente = useCallback(() => setIndice((i) => (i + 1) % SLIDES.length), []);
  const anterior = () => setIndice((i) => (i - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(siguiente, INTERVALO_MS);
    return () => clearInterval(timer);
  }, [siguiente]);

  const slide = SLIDES[indice];

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden text-white transition-colors duration-700"
      style={{ background: slide.bg }}
    >
      {/* Cuadrícula + resplandor de marca */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{ background: `radial-gradient(55% 55% at 35% 55%, ${slide.glow}, transparent 70%)` }}
      />

      <header className="relative z-10 flex items-center justify-between p-6 lg:px-10">
        <img src={logo} alt="Automotora Norte y Sur" className="h-9 w-auto invert" />
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-ok" />
            Intranet corporativa
          </span>
        </div>
      </header>

      <div className="relative z-10 grid flex-1 items-center gap-10 px-6 lg:grid-cols-[1.2fr_auto] lg:px-10">
        <section aria-label="Vitrina Norte y Sur" className="relative hidden lg:block">
          <p
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/3 select-none font-display text-[10rem] font-extrabold leading-none tracking-tight text-white/5"
          >
            {slide.ghost}
          </p>
          <span className="inline-block rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em]">
            {slide.tag}
          </span>
          <h1 className="mt-4 font-display text-6xl font-extrabold leading-[0.98] tracking-tight drop-shadow-lg xl:text-7xl">
            {slide.nombre}
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/70">{slide.desc}</p>
          <img
            key={slide.img}
            src={slide.img}
            alt=""
            className="relative mx-auto mt-4 max-h-72 w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,.5)]"
            style={{ animation: 'entrada-carro 700ms cubic-bezier(0.16,1,0.3,1)' }}
          />
        </section>

        <div className="flex w-full justify-center py-8 lg:justify-end lg:pr-4">{children}</div>
      </div>

      <div className="relative z-10 flex items-center gap-4 p-6 lg:px-10">
        <button
          type="button"
          onClick={anterior}
          aria-label="Vehículo anterior"
          className="grid h-11 w-11 place-items-center rounded-full bg-white/10 backdrop-blur transition-colors duration-150 hover:bg-white/20"
        >
          <Icono nombre="flecha_izq" />
        </button>
        <button
          type="button"
          onClick={siguiente}
          aria-label="Vehículo siguiente"
          className="grid h-11 w-11 place-items-center rounded-full bg-white/10 backdrop-blur transition-colors duration-150 hover:bg-white/20"
        >
          <Icono nombre="flecha_der" />
        </button>
        <div className="ml-2 flex items-center gap-2" role="tablist" aria-label="Vehículos">
          {SLIDES.map((s, i) => (
            <button
              key={s.nombre}
              type="button"
              role="tab"
              aria-selected={i === indice}
              aria-label={s.nombre}
              onClick={() => setIndice(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === indice ? 'w-7 bg-white' : 'w-3 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
        <p className="ml-auto font-display text-sm font-semibold tracking-[0.3em] text-white/50">
          {String(indice + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </p>
      </div>
    </div>
  );
}
