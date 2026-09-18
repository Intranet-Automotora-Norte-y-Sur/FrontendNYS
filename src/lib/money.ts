/** Formatting for the accounting figures.
 *
 *  Accounting sends exact pesos (191.978.882.444). Nobody counts those digits
 *  on screen: everything is shown in millions, which is how these numbers are
 *  discussed in management meetings. Output strings stay Spanish (es-CO). */

const MILLION = 1_000_000;

/** Millions with thousands separator: «28.947». */
export function toMillions(pesos: number, decimals = 0): string {
  return (pesos / MILLION).toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Millions with sign and unit: «$28.947 M», «−$1.094 M». */
export function formatPesos(value: number): string {
  const sign = value < 0 ? '−' : '';
  return `${sign}$${toMillions(Math.abs(value))} M`;
}

/** For axis ticks: no symbol or unit — those compete with the bars. The unit
 *  is written once, on the axis label. */
export function axisMillions(value: number): string {
  return toMillions(value === 0 ? 0 : value);
}

/** «6,5 %», or a dash when the margin means nothing (a centre without revenue). */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—';
  return `${value.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} %`;
}

/** Change between periods, always signed: «+28,7 %». */
export function formatDelta(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value > 0 ? '+' : ''}${formatPercent(value)}`;
}
