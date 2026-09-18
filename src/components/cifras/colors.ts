/** Colour roles for the finance charts.
 *
 *  Blue and red are the in/out diverging pair: separated for colour blindness
 *  (ΔE 21.6 under protanopia) and with enough contrast against the white of
 *  the cards. The brand red (#e4002b) is deliberately not used here: on an
 *  income statement red means "money out", not "Norte y Sur". */
export const COLOR = {
  in: '#2a78d6',
  out: '#e34948',
  alternate: '#eb6834',
  subtotal: '#4b5563',
  total: '#15171b',
  grid: '#e6e8ec',
  axis: '#c3c2b7',
} as const;
