/** Income-statement charts, in plain SVG: no chart libraries.
 *
 *  Rules everything in this file follows:
 *  - one axis per chart (never two overlaid scales: pesos and margin go in
 *    separate charts even when they describe the same month);
 *  - blue for money in, red for money out — the diverging pair is validated
 *    for colour blindness on a white surface;
 *  - the month accounting is still posting is hatched, not solid: visible,
 *    but clearly not comparable with the closed months. */

import type { FinanceMonth, WaterfallStep } from '../../hooks/useFinance';
import { axisMillions, formatPesos, formatPercent } from '../../lib/money';
import { COLOR } from './colors';

/** 45° hatch for the month not yet closed. One id per chart would avoid
 *  collisions, but the definition is identical everywhere: sharing is right. */
const HATCH_ID = 'trama-mes-en-curso';

export function HatchDefs() {
  return (
    <defs>
      <pattern id={HATCH_ID} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#ffffff" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="#9aa1ac" strokeWidth="3" />
      </pattern>
    </defs>
  );
}

/** Grey and hatched: the open month never competes in colour with a series. */
function barFill(color: string, isOpenMonth: boolean): string {
  return isOpenMonth ? `url(#${HATCH_ID})` : color;
}

/** Unit label, above the axis: written once instead of on every tick. */
function AxisUnitLabel() {
  return (
    <text x="0" y="8" fontSize="9.5" fill="currentColor" className="text-muted">
      millones de pesos
    </text>
  );
}

/** Footnote for charts that include the month still being posted. */
export function OpenMonthNote({ months }: { months: { en_curso: boolean; mes: string }[] }) {
  const openMonth = months.find((month) => month.en_curso);
  if (!openMonth) return null;
  return (
    <p className="mt-2 flex items-center gap-2 text-[0.7rem] text-muted">
      <span
        className="inline-block h-2.5 w-5 rounded-sm border border-line"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #9aa1ac 0 3px, #ffffff 3px 6px)',
        }}
      />
      {openMonth.mes} va rayado: la contabilidad todavía no ha causado sus costos, así que
      no compara con los meses cerrados ni entra en los totales.
    </p>
  );
}

export function ChartLegend({ series }: { series: { name: string; color: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
      {series.map((item) => (
        <li key={item.name} className="flex items-center gap-1.5 text-xs text-body">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
          {item.name}
        </li>
      ))}
    </ul>
  );
}

/** Steps of a "nice" grid (1, 2 or 5 per decade). */
function niceStep(maximum: number, divisions: number): number {
  const raw = maximum / divisions;
  const decade = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * decade).find((v) => v >= raw) ?? decade * 10;
}

// -------------------------------------------------------------- waterfall ---

const WATERFALL = { labels: 168, left: 176, width: 356, row: 30, value: 620 };

/** The result bridge: from revenue to profit, subtracting along the way.
 *  Horizontal because account names are long and vertical would tilt them. */
export function WaterfallChart({ steps }: { steps: WaterfallStep[] }) {
  const cumulative: number[] = [];
  let running = 0;
  for (const step of steps) {
    if (step.tipo === 'subtotal' || step.tipo === 'total') {
      cumulative.push(running);
    } else {
      running += step.valor;
      cumulative.push(running);
    }
  }
  const maximum = Math.max(...cumulative.map(Math.abs), 1);
  const scale = (value: number) =>
    WATERFALL.left + (Math.max(0, value) / maximum) * WATERFALL.width;
  const height = steps.length * WATERFALL.row + 12;

  return (
    <svg
      viewBox={`0 0 660 ${height}`}
      className="w-full"
      role="img"
      aria-label="Cascada del estado de resultados"
    >
      {steps.map((step, i) => {
        const y = i * WATERFALL.row + 6;
        const isTotal = step.tipo === 'subtotal' || step.tipo === 'total';
        const previous = i === 0 ? 0 : cumulative[i - 1];
        const from = isTotal ? 0 : Math.min(previous, cumulative[i]);
        const to = isTotal ? cumulative[i] : Math.max(previous, cumulative[i]);
        const x = scale(from);
        const width = Math.max(2, scale(to) - x);
        const color =
          step.tipo === 'total'
            ? COLOR.total
            : step.tipo === 'subtotal'
              ? COLOR.subtotal
              : step.tipo === 'suma'
                ? COLOR.in
                : COLOR.out;

        return (
          <g key={step.etiqueta}>
            <title>{`${step.etiqueta}: ${formatPesos(step.valor)}`}</title>
            {i > 0 && !isTotal && (
              <line
                x1={scale(previous)}
                y1={y - 6}
                x2={scale(previous)}
                y2={y}
                stroke={COLOR.axis}
                strokeDasharray="2 2"
              />
            )}
            <text
              x={WATERFALL.labels}
              y={y + 13}
              textAnchor="end"
              fontSize="11"
              fontWeight={isTotal ? 700 : 400}
              fill="currentColor"
              className={isTotal ? 'text-ink' : 'text-body'}
            >
              {step.etiqueta}
            </text>
            <rect x={x} y={y + 3} width={width} height={14} rx="2" fill={color} />
            <text
              x={WATERFALL.value}
              y={y + 13}
              textAnchor="end"
              fontSize="11"
              fontWeight={isTotal ? 700 : 500}
              className={isTotal ? 'text-ink' : 'text-body'}
              fill="currentColor"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatPesos(step.valor)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// --------------------------------------------------------- monthly: pesos ---

const MONTH = { left: 52, right: 632, top: 12, base: 168, divisions: 4 };

/** Vertical scale of the monthly panel. ``minimum`` is zero unless some month
 *  closed at a loss: then the zero line moves up and red bars hang from it. */
function verticalScale(minimum: number, maximum: number) {
  const range = maximum - minimum || 1;
  const height = MONTH.base - MONTH.top;
  return (value: number) => MONTH.base - ((value - minimum) / range) * height;
}

function GridLines({
  minimum,
  maximum,
  step,
}: {
  minimum: number;
  maximum: number;
  step: number;
}) {
  const lines: number[] = [];
  for (let value = minimum; value <= maximum + 1e-6; value += step) lines.push(value);
  const y = verticalScale(minimum, maximum);

  return (
    <>
      {lines.map((value) => (
        <g key={value}>
          <line
            x1={MONTH.left}
            y1={y(value)}
            x2={MONTH.right}
            y2={y(value)}
            stroke={value === 0 ? COLOR.axis : COLOR.grid}
          />
          <text
            x={MONTH.left - 8}
            y={y(value) + 3}
            textAnchor="end"
            fontSize="9.5"
            fill="currentColor"
            className="text-muted"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {axisMillions(value)}
          </text>
        </g>
      ))}
    </>
  );
}

/** Revenue and expense, month by month, on the same scale: the gap between
 *  the two bars is the profit — and how narrow it is shows. */
export function RevenueExpenseChart({ months }: { months: FinanceMonth[] }) {
  const maximum = Math.max(...months.flatMap((m) => [m.ingresos, m.egresos]), 1);
  const step = niceStep(maximum, MONTH.divisions);
  const top = Math.ceil(maximum / step) * step;
  const monthWidth = (MONTH.right - MONTH.left) / months.length;
  const barWidth = Math.min(20, (monthWidth - 10) / 2);
  const barHeight = (value: number) => (value / top) * (MONTH.base - MONTH.top);

  return (
    <div>
      <svg viewBox="0 0 660 196" className="w-full" role="img" aria-label="Ingresos y egresos por mes">
        <HatchDefs />
        <AxisUnitLabel />
        <GridLines minimum={0} maximum={top} step={step} />
        {months.map((month, i) => {
          const centre = MONTH.left + monthWidth * (i + 0.5);
          const series = [
            { name: 'Ingresos', value: month.ingresos, color: COLOR.in },
            { name: 'Egresos', value: month.egresos, color: COLOR.out },
          ];
          return (
            <g key={month.periodo}>
              {series.map((item, j) => (
                <rect
                  key={item.name}
                  x={centre - barWidth - 1 + j * (barWidth + 2)}
                  y={MONTH.base - barHeight(item.value)}
                  width={barWidth}
                  height={Math.max(1, barHeight(item.value))}
                  rx="2"
                  fill={barFill(item.color, month.en_curso)}
                >
                  <title>{`${item.name} de ${month.mes}: ${formatPesos(item.value)}${
                    month.en_curso ? ' (mes sin cerrar)' : ''
                  }`}</title>
                </rect>
              ))}
              <text
                x={centre}
                y={MONTH.base + 14}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className={month.en_curso ? 'text-faint' : 'text-muted'}
              >
                {month.mes}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartLegend
        series={[
          { name: 'Ingresos', color: COLOR.in },
          { name: 'Costos y gastos', color: COLOR.out },
        ]}
      />
      <OpenMonthNote months={months} />
    </div>
  );
}

/** Monthly profit, with the margin as a direct label: two measures of a
 *  different nature — a second axis would lie about the scale.
 *  A single series: colour only signals the sign. */
export function MonthlyProfitChart({ months }: { months: FinanceMonth[] }) {
  const values = months.map((m) => m.utilidad);
  const step = niceStep(Math.max(...values.map(Math.abs), 1), 3);
  const top = Math.ceil(Math.max(...values, 0) / step) * step || step;
  const floor = -Math.ceil(Math.max(...values.map((v) => -v), 0) / step) * step;
  const y = verticalScale(floor, top);
  const zero = y(0);
  const monthWidth = (MONTH.right - MONTH.left) / months.length;
  const barWidth = Math.min(30, monthWidth - 12);

  return (
    <div>
      <svg viewBox="0 0 660 196" className="w-full" role="img" aria-label="Utilidad por mes">
        <HatchDefs />
        <AxisUnitLabel />
        <GridLines minimum={floor} maximum={top} step={step} />
        {months.map((month, i) => {
          const centre = MONTH.left + monthWidth * (i + 0.5);
          const isLoss = month.utilidad < 0;
          const length = Math.max(1, Math.abs(y(month.utilidad) - zero));
          return (
            <g key={month.periodo}>
              <rect
                x={centre - barWidth / 2}
                y={isLoss ? zero : zero - length}
                width={barWidth}
                height={length}
                rx="2"
                fill={barFill(isLoss ? COLOR.out : COLOR.in, month.en_curso)}
              >
                <title>{`${month.mes}: ${formatPesos(month.utilidad)}${
                  month.en_curso ? ' — mes sin cerrar, la contabilidad aún causa los costos' : ''
                }`}</title>
              </rect>
              <text
                x={centre}
                y={isLoss ? zero + length + 11 : zero - length - 5}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                fill="currentColor"
                className="text-body"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatPercent(month.margen, 1)}
              </text>
              <text
                x={centre}
                y={MONTH.base + 14}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className={month.en_curso ? 'text-faint' : 'text-muted'}
              >
                {month.mes}
              </text>
            </g>
          );
        })}
      </svg>
      <OpenMonthNote months={months} />
    </div>
  );
}
