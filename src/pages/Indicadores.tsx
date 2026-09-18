import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIndicadores, type Indicador } from '../hooks/useIndicadores';
import { api } from '../lib/api';
import {
  GraficoAnillo,
  GraficoBarras,
  GraficoCategorias,
  GraficoDona,
  GraficoLinea,
  GraficoMedidor,
} from '../components/cifras/Graficos';
import { FinancePanel } from '../components/cifras/FinancePanel';

/** Orden y nombre visible de las categorías de indicadores.
 *
 *  Comercial, Posventa y taller, Cliente y Seguridad y salud quedaron fuera: sus
 *  indicadores son plantillas que nadie llegó a llenar y se mostraban en cero.
 *  Los registros siguen en la base y en el admin de Django — para volver a
 *  publicar una sección basta con devolver su línea a esta lista. */
const CATEGORIAS: { valor: string; nombre: string }[] = [
  { valor: 'gente', nombre: 'Nuestra gente' },
];

type Categoria = { etiqueta: string; valor: number };

interface CifrasGente {
  total: number;
  por_area: Categoria[];
  por_sede: Categoria[];
  por_marca: Categoria[];
  por_contrato: Categoria[];
  por_edad: Categoria[];
  cumpleanos_por_mes: Categoria[];
  antiguedad: Categoria[];
  antiguedad_promedio: number;
  edad_promedio: number;
}

/** Las cifras del equipo se calculan solas; comparten marco con los indicadores. */
function TarjetaCifra({
  titulo,
  detalle,
  children,
}: {
  titulo: string;
  detalle: string;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <div>
        <h3 className="font-display text-base font-bold text-ink">{titulo}</h3>
        <p className="mt-0.5 text-xs text-muted">{detalle}</p>
      </div>
      {children}
    </article>
  );
}

/** La dona espera series temporales; aquí el período no significa nada. */
function comoSerie(datos: Categoria[]) {
  return datos.map((d) => ({ periodo: '2026-01', serie: d.etiqueta, valor: d.valor }));
}

function NumeroGrande({ indicador }: { indicador: Indicador }) {
  return (
    <p className="font-display text-4xl font-extrabold tabular-nums text-ink">
      {indicador.valor.toLocaleString('es-CO')}
      <span className="ml-1 text-base font-semibold text-muted">{indicador.unidad}</span>
    </p>
  );
}

function BarraProgreso({ indicador }: { indicador: Indicador }) {
  const meta = indicador.meta ?? 0;
  const progreso = meta ? Math.min(100, (indicador.valor / meta) * 100) : 0;
  return (
    <div>
      <p className="font-display text-3xl font-extrabold tabular-nums text-ink">
        {Math.round(progreso)}%
      </p>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full ${progreso >= 100 ? 'bg-ok' : 'bg-brand'}`}
          style={{ width: `${progreso}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {indicador.valor.toLocaleString('es-CO')} de {meta.toLocaleString('es-CO')}{' '}
        {indicador.unidad}
      </p>
    </div>
  );
}

/** Elige el gráfico según el tipo configurado en el admin. */
function Grafico({ indicador }: { indicador: Indicador }) {
  const meta = indicador.meta ?? 0;
  switch (indicador.tipo) {
    case 'barras':
      return <GraficoBarras registros={indicador.registros} />;
    case 'linea':
      return <GraficoLinea registros={indicador.registros} />;
    case 'dona':
      return <GraficoDona registros={indicador.registros} />;
    case 'medidor':
      return <GraficoMedidor valor={indicador.valor} meta={meta} unidad={indicador.unidad} />;
    case 'anillo':
      return <GraficoAnillo valor={indicador.valor} meta={meta} />;
    case 'progreso':
      return <BarraProgreso indicador={indicador} />;
    case 'contador':
      return (
        <div className="rounded-xl bg-ok/10 py-6 text-center">
          <p className="font-display text-5xl font-extrabold tabular-nums text-ok">
            {indicador.valor.toLocaleString('es-CO')}
          </p>
          <p className="mt-1 text-xs font-semibold text-body">{indicador.unidad}</p>
        </div>
      );
    default:
      return <NumeroGrande indicador={indicador} />;
  }
}

function Tarjeta({
  indicador,
  esAdmin,
  alGuardar,
}: {
  indicador: Indicador;
  esAdmin: boolean;
  alGuardar: (id: number, valor: number) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(indicador.valor));

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <div>
        <h3 className="font-display text-base font-bold text-ink">
          {indicador.nombre}
          {!indicador.publicado && (
            <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[0.65rem] font-bold uppercase text-muted">
              Sin publicar
            </span>
          )}
        </h3>
        {indicador.descripcion && (
          <p className="mt-0.5 text-xs text-muted">{indicador.descripcion}</p>
        )}
      </div>

      {editando ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void alGuardar(indicador.id, Number(valor)).then(() => setEditando(false));
          }}
        >
          <input
            type="number"
            step="any"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-28 rounded-lg border border-line px-2 py-1 font-display text-xl font-bold outline-none focus:border-brand"
            autoFocus
          />
          <button type="submit" className="rounded-lg bg-brand px-3 text-sm font-semibold text-white">
            ✓
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="rounded-lg border border-line px-2 text-sm"
          >
            ✕
          </button>
        </form>
      ) : (
        <Grafico indicador={indicador} />
      )}

      {esAdmin && !editando && (
        <button
          type="button"
          onClick={() => {
            setValor(String(indicador.valor));
            setEditando(true);
          }}
          className="mt-auto text-left text-xs font-medium text-info hover:underline"
        >
          Actualizar valor
        </button>
      )}
    </article>
  );
}

export function Indicadores() {
  const { usuario } = useAuth();
  const { indicadores, enVivo, recargar } = useIndicadores();
  const [gente, setGente] = useState<CifrasGente | null>(null);
  const esAdmin = usuario?.rol === 'admin';

  useEffect(() => {
    let activo = true;
    void api.get('/api/indicadores/gente/').then(async (resp) => {
      if (activo && resp.ok) setGente((await resp.json()) as CifrasGente);
    });
    return () => {
      activo = false;
    };
  }, []);

  const guardar = async (id: number, valor: number) => {
    await api.patch(`/api/indicadores/${id}/`, { valor });
    await recargar();
  };

  // Un bloque por categoría, en el orden de CATEGORIAS; se ocultan las vacías.
  const grupos = useMemo(
    () =>
      CATEGORIAS.map((categoria) => ({
        ...categoria,
        items: indicadores.filter((i) => i.categoria === categoria.valor),
      })).filter((grupo) => grupo.items.length > 0 || grupo.valor === 'gente'),
    [indicadores],
  );

  return (
    <section aria-labelledby="ind-titulo">
      <div className="flex flex-wrap items-center gap-3">
        <h1 id="ind-titulo" className="sr-only">Nuestras cifras</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            enVivo ? 'bg-ok/10 text-ok' : 'bg-surface text-muted'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${enVivo ? 'bg-ok' : 'bg-faint'}`} />
          {enVivo ? 'En vivo' : 'Reconectando…'}
        </span>
      </div>

      {indicadores.length === 0 && gente === null && (
        <p className="mt-6 max-w-2xl rounded-2xl border border-dashed border-line-2 bg-white p-8 text-center text-sm text-muted">
          Aún no hay indicadores configurados.
        </p>
      )}

      {/* Accounting figures are requested — and rendered — only for admins. */}
      <FinancePanel isAdmin={esAdmin} />

      {grupos.map((grupo) => (
        <div key={grupo.valor} className="mt-8">
          <h2 className="border-b border-line pb-2 font-display text-lg font-bold text-ink">
            {grupo.nombre}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {grupo.items.map((indicador) => (
              <Tarjeta
                key={indicador.id}
                indicador={indicador}
                esAdmin={esAdmin}
                alGuardar={guardar}
              />
            ))}

            {/* Cifras del equipo: salen solas de la ficha de colaboradores. */}
            {grupo.valor === 'gente' && gente && (
              <>
                <TarjetaCifra
                  titulo="Colaboradores por área"
                  detalle={`${gente.total} personas activas en la compañía`}
                >
                  <GraficoCategorias datos={gente.por_area} />
                </TarjetaCifra>

                <TarjetaCifra
                  titulo="Colaboradores por sede"
                  detalle="Dónde trabaja el equipo"
                >
                  <GraficoCategorias datos={gente.por_sede} />
                </TarjetaCifra>

                <TarjetaCifra titulo="Equipo por marca" detalle="Toyota y Renault">
                  <GraficoDona registros={comoSerie(gente.por_marca)} />
                </TarjetaCifra>

                <TarjetaCifra
                  titulo="Antigüedad del equipo"
                  detalle={`Promedio: ${gente.antiguedad_promedio} años en la compañía`}
                >
                  <GraficoCategorias datos={gente.antiguedad} />
                </TarjetaCifra>

                <TarjetaCifra
                  titulo="Edades del equipo"
                  detalle={`Promedio: ${gente.edad_promedio} años`}
                >
                  <GraficoCategorias datos={gente.por_edad} />
                </TarjetaCifra>

                <TarjetaCifra
                  titulo="Tipo de vinculación"
                  detalle="Cómo estamos contratados"
                >
                  <GraficoDona registros={comoSerie(gente.por_contrato)} />
                </TarjetaCifra>

                <TarjetaCifra
                  titulo="Cumpleaños por mes"
                  detalle="Cuándo celebramos a cada quien"
                >
                  <GraficoCategorias datos={gente.cumpleanos_por_mes} />
                </TarjetaCifra>
              </>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
