/** Result slices: by business line, by site, by brand, and the matrix of the
 *  two. Same colour rules as the rest of the finance panel. */

import type { FinanceSlice, MatrixCell } from '../../hooks/useFinance';
import { formatPesos, formatPercent } from '../../lib/money';
import { COLOR } from './colors';

/** Diverging ramp for the heat map: one hue per arm over the card's white,
 *  with the grey of zero in the middle. Opacity acts as the step. */
function marginTone(margin: number | null, cap: number): string {
  if (margin === null) return '#f3f4f6';
  const intensity = Math.min(1, Math.abs(margin) / cap);
  const [r, g, b] = margin >= 0 ? [42, 120, 214] : [227, 73, 72];
  return `rgba(${r}, ${g}, ${b}, ${(0.12 + intensity * 0.78).toFixed(2)})`;
}

/** White text only holds up on the already-saturated tone. */
function inkOver(margin: number | null, cap: number): string {
  if (margin === null) return 'text-faint';
  return Math.abs(margin) / cap > 0.55 ? 'text-white' : 'text-ink';
}

// --------------------------------------------------------------- ranking ---

const ROW = 26;

/** Names come from the chart of accounts: some shout in ALL CAPS and one is a
 *  full street address. Shortened so they fit without invading the bars. */
function shortName(name: string, maxLength: number): string {
  const readable = name === name.toUpperCase() ? toTitleCase(name) : name;
  return readable.length > maxLength
    ? `${readable.slice(0, maxLength - 1).trimEnd()}…`
    : readable;
}

/** Short acronyms (ANYS) stay as they are: «Anys» is not their name. */
function toTitleCase(name: string): string {
  if (name.trim().length <= 5 && !name.includes(' ')) return name;
  return name
    .toLowerCase()
    .replace(/(^|\s)([a-záéíóúñ])/g, (_, space: string, letter: string) =>
      `${space}${letter.toUpperCase()}`,
    );
}

/** Diverging bars: contributors to the right, consumers to the left, all
 *  against the same zero line. */
export function RankingChart({
  items,
  labelWidth = 190,
  withMargin = true,
}: {
  items: FinanceSlice[];
  labelWidth?: number;
  /** Support areas have no margin worth showing. */
  withMargin?: boolean;
}) {
  const maximum = Math.max(...items.map((i) => Math.abs(i.utilidad)), 1);
  const hasLosses = items.some((i) => i.utilidad < 0);
  const start = labelWidth + 12;
  const width = (withMargin ? 560 : 620) - start;
  // Without losses the zero hugs the left and bars use the full width.
  const zero = hasLosses ? start + width / 2 : start;
  const scale = hasLosses ? width / 2 / maximum : width / maximum;
  const height = items.length * ROW + 10;

  return (
    <svg
      viewBox={`0 0 660 ${height}`}
      className="w-full"
      role="img"
      aria-label="Resultado por categoría"
    >
      <line x1={zero} y1="4" x2={zero} y2={height - 8} stroke={COLOR.axis} />
      {items.map((item, i) => {
        const y = i * ROW + 6;
        const length = Math.max(2, Math.abs(item.utilidad) * scale);
        const isLoss = item.utilidad < 0;
        // With a long bar the value has no room outside: written inside, white.
        const valueOutside = !isLoss || zero - length - 6 > labelWidth + 10;
        return (
          <g key={item.etiqueta}>
            <title>
              {`${item.etiqueta}: utilidad ${formatPesos(item.utilidad)} · ingresos ${formatPesos(
                item.ingresos,
              )} · margen ${formatPercent(item.margen)}`}
            </title>
            <text
              x={labelWidth}
              y={y + 12}
              textAnchor="end"
              fontSize="11"
              fill="currentColor"
              className="text-body"
            >
              {shortName(item.etiqueta, Math.round(labelWidth / 6))}
            </text>
            <rect
              x={isLoss ? zero - length : zero}
              y={y + 2}
              width={length}
              height={13}
              rx="2"
              fill={isLoss ? COLOR.out : COLOR.in}
            />
            <text
              x={isLoss ? zero - (valueOutside ? length + 6 : 6) : zero + length + 6}
              y={y + 12}
              textAnchor={isLoss ? 'end' : 'start'}
              fontSize="10.5"
              fontWeight="600"
              fill={valueOutside ? 'currentColor' : '#ffffff'}
              className={valueOutside ? 'text-ink' : ''}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatPesos(item.utilidad)}
            </text>
            {withMargin && (
              <text
                x="652"
                y={y + 12}
                textAnchor="end"
                fontSize="10.5"
                fill="currentColor"
                className="text-muted"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatPercent(item.margen)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ----------------------------------------------------------------- share ---

/** How much each category invoices, sorted. One measure and one series: one
 *  colour for all, with the share of the total as a direct label. */
export function ShareChart({ items }: { items: FinanceSlice[] }) {
  const visible = items.filter((item) => item.ingresos > 0);
  const total = visible.reduce((sum, item) => sum + item.ingresos, 0) || 1;
  const maximum = Math.max(...visible.map((i) => i.ingresos), 1);

  return (
    <ul className="space-y-2.5">
      {visible.map((item) => (
        <li key={item.etiqueta}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate text-body">{item.etiqueta}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {formatPesos(item.ingresos)}
              <span className="ml-2 font-semibold text-ink">
                {Math.round((item.ingresos / total) * 100)}%
              </span>
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.ingresos / maximum) * 100}%`,
                background: COLOR.in,
              }}
              title={`${item.etiqueta}: ${formatPesos(item.ingresos)}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- matrix ---

const MARGIN_CAP = 30;

/** Margin of every site on every business line. A real table, with colour as
 *  a second reading: the number is always written. */
export function MarginMatrix({
  sites,
  lines,
  cells,
}: {
  sites: string[];
  lines: string[];
  cells: MatrixCell[];
}) {
  const byKey = new Map(cells.map((c) => [`${c.sede}|${c.linea}`, c]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-separate border-spacing-0.5 text-xs">
        <caption className="sr-only">Margen por sede y línea de negocio</caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 py-1 text-left font-medium text-muted">
              Línea
            </th>
            {sites.map((site) => (
              <th
                key={site}
                scope="col"
                className="px-1.5 py-1 text-center align-bottom font-medium text-muted"
              >
                {site}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line}>
              <th scope="row" className="px-2 py-1 text-left font-medium text-body">
                {line}
              </th>
              {sites.map((site) => {
                const cell = byKey.get(`${site}|${line}`);
                const margin = cell?.margen ?? null;
                return (
                  <td
                    key={site}
                    className={`rounded-md px-1.5 py-2 text-center font-semibold tabular-nums ${inkOver(
                      margin,
                      MARGIN_CAP,
                    )}`}
                    style={{ background: marginTone(margin, MARGIN_CAP) }}
                    title={
                      cell
                        ? `${line} en ${site}: margen ${formatPercent(margin)} · utilidad ${formatPesos(
                            cell.utilidad,
                          )}`
                        : `${line} no opera en ${site}`
                    }
                  >
                    {cell ? formatPercent(margin, 0) : '·'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 flex items-center gap-2 text-[0.7rem] text-muted">
        <span className="h-2.5 w-8 rounded-sm" style={{ background: marginTone(-MARGIN_CAP, MARGIN_CAP) }} />
        pérdida
        <span className="h-2.5 w-8 rounded-sm" style={{ background: marginTone(MARGIN_CAP, MARGIN_CAP) }} />
        margen alto · el color acompaña al número, no lo reemplaza
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- brands ---

const RADIUS = 42;
const THICKNESS = 20;
const BRAND_COLORS = [COLOR.in, COLOR.alternate];

/** Each brand's share of revenue, with its margin beside it: the question is
 *  not only who invoices more, but who keeps more. */
export function BrandsChart({ brands }: { brands: FinanceSlice[] }) {
  const total = brands.reduce((sum, b) => sum + b.ingresos, 0) || 1;
  const perimeter = 2 * Math.PI * RADIUS;
  let cumulative = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label="Ingresos por marca">
        <g transform="translate(60,60)">
          {brands.map((brand, i) => {
            const length = (brand.ingresos / total) * perimeter;
            const rotation = (cumulative / total) * 360 - 90;
            cumulative += brand.ingresos;
            return (
              <circle
                key={brand.etiqueta}
                r={RADIUS}
                fill="none"
                stroke={BRAND_COLORS[i % BRAND_COLORS.length]}
                strokeWidth={THICKNESS}
                strokeDasharray={`${Math.max(0, length - 2)} ${perimeter}`}
                transform={`rotate(${rotation})`}
              >
                <title>{`${brand.etiqueta}: ${formatPesos(brand.ingresos)} en ingresos`}</title>
              </circle>
            );
          })}
        </g>
      </svg>
      <ul className="min-w-0 flex-1 space-y-2.5">
        {brands.map((brand, i) => (
          <li key={brand.etiqueta} className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: BRAND_COLORS[i % BRAND_COLORS.length] }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">
                {brand.etiqueta}
              </span>
              <span className="block text-xs text-muted">
                {formatPesos(brand.ingresos)} · {Math.round((brand.ingresos / total) * 100)}% de
                los ingresos
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-display text-lg font-bold tabular-nums text-ink">
                {formatPercent(brand.margen)}
              </span>
              <span className="block text-[0.7rem] text-muted">margen</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
