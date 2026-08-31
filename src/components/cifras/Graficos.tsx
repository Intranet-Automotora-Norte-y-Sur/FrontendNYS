/** Gráficos de «Nuestras cifras», en SVG plano: sin librerías ni dependencias. */

export interface PuntoSerie {
  periodo: string;
  serie: string;
  valor: number;
}

/** Colores de las series; el primero es el rojo de la marca. */
const COLORES = ['#E4002B', '#2563EB', '#0D9488', '#B45309'];

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function etiquetaMes(periodo: string): string {
  const mes = Number(periodo.slice(5, 7));
  return MESES[mes - 1] ?? '';
}

/** Agrupa los registros por serie, conservando el orden de los períodos. */
function porSerie(registros: PuntoSerie[]): { nombre: string; puntos: PuntoSerie[] }[] {
  const mapa = new Map<string, PuntoSerie[]>();
  for (const punto of registros) {
    const clave = punto.serie || 'Total';
    mapa.set(clave, [...(mapa.get(clave) ?? []), punto]);
  }
  return [...mapa.entries()].map(([nombre, puntos]) => ({ nombre, puntos }));
}

function Leyenda({ series }: { series: string[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {series.map((nombre, i) => (
        <li key={nombre} className="flex items-center gap-1.5 text-xs text-muted">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: COLORES[i % COLORES.length] }}
          />
          {nombre}
        </li>
      ))}
    </ul>
  );
}

function SinDatos() {
  return (
    <p className="rounded-xl bg-surface px-3 py-6 text-center text-xs text-muted">
      Sin datos por mes todavía. Cárgalos en el admin, en «Registros del indicador».
    </p>
  );
}

/** Barras agrupadas por período, una barra por serie. */
export function GraficoBarras({ registros }: { registros: PuntoSerie[] }) {
  if (registros.length === 0) return <SinDatos />;
  const series = porSerie(registros);
  const periodos = [...new Set(registros.map((r) => r.periodo))].sort();
  const maximo = Math.max(...registros.map((r) => r.valor), 1);
  const anchoGrupo = 260 / periodos.length;
  const anchoBarra = Math.min(16, (anchoGrupo - 6) / series.length);

  return (
    <div>
      <svg viewBox="0 0 280 130" className="w-full" role="img" aria-label="Barras por mes">
        {[30, 65, 100].map((y) => (
          <line key={y} x1="10" y1={y} x2="275" y2={y} stroke="currentColor" className="text-line" />
        ))}
        {periodos.map((periodo, iPeriodo) => (
          <g key={periodo}>
            {series.map((serie, iSerie) => {
              const punto = serie.puntos.find((p) => p.periodo === periodo);
              if (!punto) return null;
              const alto = (punto.valor / maximo) * 70;
              return (
                <rect
                  key={serie.nombre}
                  x={14 + iPeriodo * anchoGrupo + iSerie * anchoBarra}
                  y={100 - alto}
                  width={anchoBarra - 2}
                  height={alto}
                  rx="2"
                  fill={COLORES[iSerie % COLORES.length]}
                />
              );
            })}
            <text
              x={14 + iPeriodo * anchoGrupo + (series.length * anchoBarra) / 2 - 1}
              y="114"
              textAnchor="middle"
              fontSize="7.5"
              fill="currentColor"
              className="text-muted"
            >
              {etiquetaMes(periodo)}
            </text>
          </g>
        ))}
      </svg>
      <Leyenda series={series.map((s) => s.nombre)} />
    </div>
  );
}

/** Línea de tendencia con área bajo la curva y el último punto destacado. */
export function GraficoLinea({ registros }: { registros: PuntoSerie[] }) {
  if (registros.length < 2) return <SinDatos />;
  const puntos = [...registros].sort((a, b) => a.periodo.localeCompare(b.periodo));
  const maximo = Math.max(...puntos.map((p) => p.valor), 1);
  const paso = 255 / (puntos.length - 1);
  const coordenadas = puntos.map((p, i) => ({
    x: 14 + i * paso,
    y: 100 - (p.valor / maximo) * 70,
    punto: p,
  }));
  const linea = coordenadas.map((c) => `${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' L ');
  const ultima = coordenadas[coordenadas.length - 1];

  return (
    <svg viewBox="0 0 280 130" className="w-full" role="img" aria-label="Línea de tendencia">
      {[30, 65, 100].map((y) => (
        <line key={y} x1="10" y1={y} x2="275" y2={y} stroke="currentColor" className="text-line" />
      ))}
      <path d={`M ${linea} L ${ultima.x} 100 L 14 100 Z`} fill={COLORES[0]} opacity="0.1" />
      <path
        d={`M ${linea}`}
        fill="none"
        stroke={COLORES[0]}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={ultima.x} cy={ultima.y} r="4" fill={COLORES[0]} />
      {coordenadas.map((c) => (
        <text
          key={c.punto.periodo}
          x={c.x}
          y="114"
          textAnchor="middle"
          fontSize="7.5"
          fill="currentColor"
          className="text-muted"
        >
          {etiquetaMes(c.punto.periodo)}
        </text>
      ))}
    </svg>
  );
}

/** Dona de participación: cada serie es una porción del período más reciente. */
export function GraficoDona({ registros }: { registros: PuntoSerie[] }) {
  if (registros.length === 0) return <SinDatos />;
  const ultimo = registros.reduce((a, b) => (a.periodo > b.periodo ? a : b)).periodo;
  const porciones = registros.filter((r) => r.periodo === ultimo);
  const total = porciones.reduce((suma, p) => suma + p.valor, 0) || 1;
  const perimetro = 2 * Math.PI * 42;
  let acumulado = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label="Dona de participación">
        <g transform="translate(60,60)">
          {porciones.map((porcion, i) => {
            const largo = (porcion.valor / total) * perimetro;
            const rotacion = (acumulado / total) * 360 - 90;
            acumulado += porcion.valor;
            return (
              <circle
                key={porcion.serie || i}
                r="42"
                fill="none"
                stroke={COLORES[i % COLORES.length]}
                strokeWidth="20"
                strokeDasharray={`${largo} ${perimetro}`}
                transform={`rotate(${rotacion})`}
              />
            );
          })}
          <text y="6" textAnchor="middle" fontSize="18" fontWeight="800" fill="currentColor" className="text-ink">
            {total.toLocaleString('es-CO')}
          </text>
        </g>
      </svg>
      <ul className="min-w-0 space-y-1">
        {porciones.map((porcion, i) => (
          <li key={porcion.serie || i} className="flex items-center gap-2 text-xs text-body">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: COLORES[i % COLORES.length] }}
            />
            <span className="truncate">{porcion.serie || 'Total'}</span>
            <span className="ml-auto font-semibold tabular-nums text-ink">
              {Math.round((porcion.valor / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Medidor de meta: el arco recorre un semicírculo hasta el porcentaje logrado. */
export function GraficoMedidor({
  valor,
  meta,
  unidad,
}: {
  valor: number;
  meta: number;
  unidad: string;
}) {
  const proporcion = Math.max(0, Math.min(1, valor / (meta || 1)));
  const angulo = Math.PI * (1 - proporcion);
  const x = 130 + 90 * Math.cos(angulo);
  const y = 108 - 90 * Math.sin(angulo);
  const arcoLargo = proporcion > 0.5 ? 1 : 0;

  return (
    <svg
      viewBox="0 0 260 126"
      className="w-full"
      role="img"
      aria-label={`Cumplimiento ${Math.round(proporcion * 100)} por ciento`}
    >
      <path
        d="M40 108 A 90 90 0 0 1 220 108"
        fill="none"
        stroke="currentColor"
        className="text-line"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d={`M40 108 A 90 90 0 ${arcoLargo} 1 ${x.toFixed(1)} ${y.toFixed(1)}`}
        fill="none"
        stroke={proporcion >= 1 ? '#16A34A' : COLORES[0]}
        strokeWidth="16"
        strokeLinecap="round"
      />
      <text x="130" y="96" textAnchor="middle" fontSize="32" fontWeight="800" fill="currentColor" className="text-ink">
        {Math.round(proporcion * 100)}%
      </text>
      <text x="130" y="119" textAnchor="middle" fontSize="9" fill="currentColor" className="text-muted">
        {valor.toLocaleString('es-CO')} de {meta.toLocaleString('es-CO')} {unidad}
      </text>
    </svg>
  );
}

/** Anillo de progreso hacia la meta. */
export function GraficoAnillo({ valor, meta }: { valor: number; meta: number }) {
  const proporcion = Math.max(0, Math.min(1, valor / (meta || 1)));
  const perimetro = 2 * Math.PI * 40;

  return (
    <svg
      viewBox="0 0 120 120"
      className="mx-auto h-32 w-32"
      role="img"
      aria-label={`Progreso ${Math.round(proporcion * 100)} por ciento`}
    >
      <g transform="translate(60,60)">
        <circle r="40" fill="none" stroke="currentColor" className="text-line" strokeWidth="14" />
        <circle
          r="40"
          fill="none"
          stroke={proporcion >= 1 ? '#16A34A' : COLORES[0]}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${proporcion * perimetro} ${perimetro}`}
          transform="rotate(-90)"
        />
        <text y="7" textAnchor="middle" fontSize="20" fontWeight="800" fill="currentColor" className="text-ink">
          {Math.round(proporcion * 100)}%
        </text>
      </g>
    </svg>
  );
}

/** Barras horizontales para categorías (áreas, sedes, rangos de antigüedad). */
export function GraficoCategorias({ datos }: { datos: { etiqueta: string; valor: number }[] }) {
  if (datos.length === 0) return <SinDatos />;
  const maximo = Math.max(...datos.map((d) => d.valor), 1);

  return (
    <ul className="space-y-2">
      {datos.map((fila) => (
        <li key={fila.etiqueta} className="flex items-center gap-3 text-sm">
          <span className="w-24 shrink-0 truncate text-muted">{fila.etiqueta}</span>
          <span className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
            <span
              className="block h-full rounded-full bg-brand"
              style={{ width: `${(fila.valor / maximo) * 100}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-semibold tabular-nums text-ink">
            {fila.valor}
          </span>
        </li>
      ))}
    </ul>
  );
}
