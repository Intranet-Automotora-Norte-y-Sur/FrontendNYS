/** «Resultados de la compañía»: the accounting income statement, visible only
 *  to the administrator profile.
 *
 *  The backend already filters by role — this does not rely on hiding the
 *  section — but the section is not rendered for anyone else either, and it is
 *  labelled confidential: whoever opens it in a meeting room should know. */

import { useState, type ReactNode } from 'react';
import {
  EMPTY_FILTERS,
  useFinance,
  useFinanceAnalysis,
  type FilterOptions,
  type FinanceFilters,
  type FinanceReport,
} from '../../hooks/useFinance';
import { formatPesos, formatPercent, formatDelta } from '../../lib/money';
import { FinanceFilterBar } from './FinanceFilterBar';
import {
  MonthlyProfitChart,
  RevenueExpenseChart,
  WaterfallChart,
} from './FinanceCharts';
import {
  BrandsChart,
  MarginMatrix,
  RankingChart,
  ShareChart,
} from './ComparativeCharts';

const LONG_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function longMonth(period: string | null): string {
  if (!period) return '';
  const [year, month] = period.split('-');
  return `${LONG_MONTHS[Number(month) - 1]} de ${year}`;
}

function PanelCard({
  title,
  detail,
  wide,
  children,
}: {
  title: string;
  detail: string;
  wide?: boolean;
  children: ReactNode;
}) {
  // min-w-0: without it the heat-map table stretches the card and overflows
  // the page on medium screens, instead of scrolling inside the card.
  return (
    <article
      className={`flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 ${
        wide ? 'lg:col-span-2' : ''
      }`}
    >
      <header>
        <h3 className="font-display text-base font-bold text-ink">{title}</h3>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </header>
      {children}
    </article>
  );
}

function MetricCard({
  label,
  value,
  support,
  highlighted,
}: {
  label: string;
  value: string;
  support: string;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        highlighted ? 'border-ink bg-ink text-white' : 'border-line bg-white'
      }`}
    >
      <p
        className={`text-[0.7rem] font-semibold uppercase tracking-wide ${
          highlighted ? 'text-white/70' : 'text-muted'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1.5 font-display font-extrabold tabular-nums ${
          highlighted ? 'text-3xl' : 'text-2xl text-ink'
        }`}
      >
        {value}
      </p>
      <p className={`mt-1 text-xs ${highlighted ? 'text-white/70' : 'text-muted'}`}>{support}</p>
    </article>
  );
}

/** «marca Renault · sede Toyota Sur». Vacío cuando se ve la compañía entera. */
function describeFilters(filters: FinanceReport['filtros']): string {
  const labels: Record<string, string> = {
    marca: 'marca',
    sede: 'sede',
    linea: 'línea',
    desde: 'desde',
    hasta: 'hasta',
  };
  return Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => `${labels[key]} ${value}`)
    .join(' · ');
}

function PanelHeader({ report }: { report: FinanceReport }) {
  const { periodo } = report;
  const openNote = periodo.en_curso.length
    ? `${longMonth(periodo.en_curso[0])} va sin cerrar y no entra en los totales.`
    : 'Todos los meses cargados están cerrados.';
  const active = describeFilters(report.filtros);

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-2">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">
          Resultados {active ? 'filtrados' : 'de la compañía'}
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          Contabilidad de {longMonth(periodo.desde)} a {longMonth(periodo.hasta)} ·{' '}
          {periodo.meses_cerrados} meses cerrados. {openNote}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Que nadie lea un corte creyendo que es la compañía entera. */}
        {active && (
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-white">
            {active}
          </span>
        )}
        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-brand">
          Confidencial · solo administración
        </span>
      </div>
    </div>
  );
}

function Notice({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="border-b border-line pb-2 font-display text-lg font-bold text-ink">
        Resultados de la compañía
      </h2>
      {children}
      <p className="mt-4 rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
        {message}
      </p>
    </div>
  );
}

/** Pide a la IA el informe escrito del corte que hay en pantalla.
 *
 *  Tarda: el modelo redacta varios párrafos sobre el estado de resultados
 *  completo. Por eso el botón dice en qué va y se bloquea mientras tanto — un
 *  segundo clic no aceleraría nada y gastaría otra llamada de la cuota. */
function AnalysisButton({ filters }: { filters: FinanceFilters }) {
  const { analysis, generate } = useFinanceAnalysis(filters);
  const working = analysis.estado === 'generando';

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={() => void generate()}
        disabled={working}
        className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-60"
      >
        {working ? 'Analizando las cifras…' : 'Generar análisis con IA'}
      </button>
      <p className="mt-1 text-[0.68rem] text-muted">
        {working
          ? 'Puede tardar hasta un minuto.'
          : 'Documento PDF sobre lo que estás viendo'}
      </p>
      {analysis.estado === 'error' && (
        <p className="mt-1 max-w-xs text-[0.7rem] text-brand">{analysis.mensaje}</p>
      )}
    </div>
  );
}

export function FinancePanel({ isAdmin }: { isAdmin: boolean }) {
  const [filters, setFilters] = useState<FinanceFilters>(EMPTY_FILTERS);
  const finance = useFinance(isAdmin, filters);
  if (!isAdmin) return null;

  const filterBar = (options: FilterOptions) => (
    <FinanceFilterBar
      filters={filters}
      options={options}
      onChange={setFilters}
      onReset={() => setFilters(EMPTY_FILTERS)}
    >
      <AnalysisButton filters={filters} />
    </FinanceFilterBar>
  );

  if (finance.estado === 'cargando') {
    return <Notice message="Consultando la contabilidad…" />;
  }
  if (finance.estado === 'sin-datos') {
    // Las opciones siguen ahí aunque el filtro haya dejado la pantalla vacía:
    // sin la barra no habría forma de deshacerlo.
    return (
      <Notice message={finance.motivo}>
        {finance.opciones && filterBar(finance.opciones)}
      </Notice>
    );
  }

  const report = finance.datos;
  const { resumen, periodo } = report;
  const lastMonth = periodo.hasta ? longMonth(periodo.hasta).split(' de ')[0] : 'el mes';
  const operatingLines = report.por_linea.filter((line) => !line.apoyo);
  const supportLines = report.por_linea.filter((line) => line.apoyo);

  return (
    <section className="mt-10" aria-labelledby="finanzas-titulo">
      <h2 id="finanzas-titulo" className="sr-only">
        Resultados de la compañía
      </h2>
      <PanelHeader report={report} />
      {filterBar(report.opciones)}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ingresos"
          value={formatPesos(resumen.ingresos)}
          support={`${periodo.meses_cerrados} meses cerrados`}
        />
        <MetricCard
          label="Costos y gastos"
          value={formatPesos(resumen.egresos)}
          support={`${formatPercent(
            resumen.ingresos ? (resumen.egresos / resumen.ingresos) * 100 : null,
          )} de los ingresos`}
        />
        <MetricCard
          highlighted
          label="Utilidad del año"
          value={formatPesos(resumen.utilidad)}
          support={`${formatPesos(resumen.utilidad_mes)} en ${lastMonth} (${formatDelta(
            resumen.variacion_utilidad,
          )} frente al mes anterior)`}
        />
        <MetricCard
          label="Margen neto"
          value={formatPercent(resumen.margen)}
          support={`${formatPercent(resumen.margen_mes)} en ${lastMonth}`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PanelCard
          wide
          title="De los ingresos a la utilidad"
          detail="Qué se lleva cada renglón del acumulado del año"
        >
          <WaterfallChart steps={report.cascada} />
        </PanelCard>

        <PanelCard
          title="Ingresos y costos por mes"
          detail="En la misma escala: la utilidad es la franja que queda entre las dos barras"
        >
          <RevenueExpenseChart months={report.por_mes} />
        </PanelCard>

        <PanelCard
          title="Utilidad mes a mes"
          detail="Sobre cada barra, el margen que dejó ese mes"
        >
          <MonthlyProfitChart months={report.por_mes} />
        </PanelCard>

        <PanelCard
          title="Quién factura"
          detail="Participación de cada línea de negocio en los ingresos del año"
        >
          <ShareChart items={operatingLines} />
        </PanelCard>

        <PanelCard
          title="Quién deja utilidad"
          detail="Facturar mucho y dejar poco es otra conversación: a la derecha, el margen"
        >
          <RankingChart items={operatingLines} labelWidth={150} />
          {supportLines.length > 0 && (
            <div className="border-t border-line pt-3">
              <p className="mb-1 text-xs text-muted">
                Costo de estructura: áreas que sostienen a las demás y casi no facturan.
                No se les calcula margen porque no tienen ingresos con qué compararlo.
              </p>
              <RankingChart items={supportLines} labelWidth={150} withMargin={false} />
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Resultado por sede"
          detail="Cada punto de venta con lo que aportó al año y su margen"
        >
          <RankingChart items={report.por_sede} labelWidth={150} />
        </PanelCard>

        <PanelCard title="Toyota y Renault" detail="Cuánto pesa cada marca y cuánto deja">
          <BrandsChart brands={report.por_marca} />
        </PanelCard>

        <PanelCard
          wide
          title="Margen por sede y línea de negocio"
          detail="Dónde se gana y dónde se pierde, cruzado. El punto marca lo que esa sede no opera"
        >
          <MarginMatrix
            sites={report.matriz.sedes}
            lines={report.matriz.lineas}
            cells={report.matriz.celdas}
          />
        </PanelCard>

        <PanelCard
          wide
          title="Centros de costo: los extremos"
          detail="Los que más aportan y los que más consumen, del centro de costo de la contabilidad"
        >
          <RankingChart items={report.por_centro} labelWidth={230} />
        </PanelCard>
      </div>
    </section>
  );
}
