/** The filter row that sits above the finance charts.
 *
 *  One row, not a panel: the filters are a lens on the charts, not a form to
 *  fill in. Everything defaults to «todo», so the page opens on the whole
 *  company and narrowing is a deliberate act.
 *
 *  The options come from the backend rather than being hardcoded: a site that
 *  opens next year shows up on its own, and one that never posted anything
 *  never offers an empty filter. */

import type { FilterOptions, FinanceFilters } from '../../hooks/useFinance';

interface SelectorProps {
  label: string;
  value: string;
  options: { valor: string; etiqueta: string }[];
  anyLabel: string;
  onChange: (value: string) => void;
}

function Selector({ label, value, options, anyLabel, onChange }: SelectorProps) {
  const selected = value !== '';
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-w-0 rounded-lg border bg-white px-2.5 py-1.5 text-sm outline-none transition-colors duration-150 focus-visible:border-ink ${
          selected ? 'border-ink font-semibold text-ink' : 'border-line text-body'
        }`}
      >
        <option value="">{anyLabel}</option>
        {options.map((option) => (
          <option key={option.valor} value={option.valor}>
            {option.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}

function asOptions(values: string[]) {
  return values.map((value) => ({ valor: value, etiqueta: value }));
}

export function FinanceFilterBar({
  filters,
  options,
  onChange,
  onReset,
  children,
}: {
  filters: FinanceFilters;
  options: FilterOptions;
  onChange: (filters: FinanceFilters) => void;
  onReset: () => void;
  /** El botón de análisis: vive aquí porque analiza justo este corte. */
  children?: React.ReactNode;
}) {
  const set = (key: keyof FinanceFilters) => (value: string) =>
    onChange({ ...filters, [key]: value });
  const anyActive = Object.values(filters).some(Boolean);

  return (
    <div className="mt-4 rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Selector
          label="Marca"
          value={filters.marca}
          options={asOptions(options.marcas)}
          anyLabel="Todas"
          onChange={set('marca')}
        />
        <Selector
          label="Sede"
          value={filters.sede}
          options={asOptions(options.sedes)}
          anyLabel="Todas"
          onChange={set('sede')}
        />
        <Selector
          label="Línea de negocio"
          value={filters.linea}
          options={asOptions(options.lineas)}
          anyLabel="Todas"
          onChange={set('linea')}
        />
        <Selector
          label="Desde"
          value={filters.desde}
          options={options.periodos}
          anyLabel="El primer mes"
          onChange={set('desde')}
        />
        <Selector
          label="Hasta"
          value={filters.hasta}
          options={options.periodos}
          anyLabel="El último mes"
          onChange={set('hasta')}
        />

        {anyActive && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-body transition-colors duration-150 hover:border-ink hover:text-ink"
          >
            Quitar filtros
          </button>
        )}

        {/* El análisis se empuja a la derecha: es una acción, no un filtro. */}
        <div className="ml-auto">{children}</div>
      </div>
    </div>
  );
}
