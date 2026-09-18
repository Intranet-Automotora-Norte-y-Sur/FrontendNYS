import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { CAMPO } from './casos';

interface CuentaIntranet {
  id: number;
  nombre: string;
  cargo: string;
  area: string;
  email: string;
  activo: boolean;
}

/** Cuentas de la intranet, cacheadas en el módulo.
 *
 *  El selector aparece dentro de cada caso del informe: sin caché, abrir diez
 *  casos pediría la misma lista diez veces. */
let cuentasEnCurso: Promise<CuentaIntranet[]> | null = null;

function cargarCuentas(): Promise<CuentaIntranet[]> {
  cuentasEnCurso ??= api
    .get('/api/auth/admin/usuarios/')
    .then(async (resp) => {
      if (!resp.ok) {
        // Sin cachear el fallo: el siguiente intento vuelve a pedirlo.
        cuentasEnCurso = null;
        return [];
      }
      const cuentas = (await resp.json()) as CuentaIntranet[];
      // Los retirados siguen en la lista de cuentas pero no pueden atender
      // nada; ofrecerlos solo lleva a asignarle un caso a quien ya no está.
      return cuentas.filter((c) => c.activo);
    })
    .catch(() => {
      cuentasEnCurso = null;
      return [];
    });
  return cuentasEnCurso;
}

/** Quita tildes y pasa a minúsculas: se busca «monica» y aparece «Mónica». */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

interface Props {
  /** Cuenta asignada hoy, o null. */
  valor: number | null;
  /** Nombre guardado en el caso: se muestra mientras la lista carga. */
  nombreActual: string;
  onCambio: (id: number | null, nombre: string) => void;
}

/** Campo de responsable: se escribe el nombre y se elige de la lista.
 *
 *  Es un `input` con sugerencias y no un `select`, porque la nómina pasa de
 *  doscientas personas y buscarlas desplegando una lista no es viable. */
export function SelectorResponsable({ valor, nombreActual, onCambio }: Props) {
  const [cuentas, setCuentas] = useState<CuentaIntranet[] | null>(null);
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const idLista = useId();

  useEffect(() => {
    let vigente = true;
    void cargarCuentas().then((lista) => {
      if (vigente) setCuentas(lista);
    });
    return () => {
      vigente = false;
    };
  }, []);

  // El texto sigue a la cuenta asignada mientras nadie esté escribiendo.
  const asignada = cuentas?.find((c) => c.id === valor) ?? null;
  useEffect(() => {
    if (!abierto) setTexto(asignada?.nombre ?? nombreActual);
  }, [abierto, asignada, nombreActual]);

  // Cerrar al hacer clic fuera: si no, la lista tapa el resto del formulario.
  useEffect(() => {
    const alHacerClic = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', alHacerClic);
    return () => document.removeEventListener('mousedown', alHacerClic);
  }, []);

  const sugerencias = useMemo(() => {
    if (!cuentas) return [];
    const buscado = normalizar(texto.trim());
    const coinciden = buscado
      ? cuentas.filter(
          (c) =>
            normalizar(c.nombre).includes(buscado) ||
            normalizar(c.area).includes(buscado) ||
            normalizar(c.cargo).includes(buscado),
        )
      : cuentas;
    // Un desplegable de 200 filas no se lee; lo que hace falta es escribir más.
    return coinciden.slice(0, 8);
  }, [cuentas, texto]);

  const elegir = (cuenta: CuentaIntranet) => {
    onCambio(cuenta.id, cuenta.nombre);
    setTexto(cuenta.nombre);
    setAbierto(false);
  };

  const limpiar = () => {
    onCambio(null, '');
    setTexto('');
    setAbierto(false);
  };

  return (
    <div ref={contenedor} className="relative">
      <input
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setAbierto(false);
          if (e.key === 'Enter' && abierto && sugerencias.length > 0) {
            e.preventDefault();
            elegir(sugerencias[0]);
          }
        }}
        role="combobox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-autocomplete="list"
        placeholder={cuentas === null ? 'Cargando personas…' : 'Escribe el nombre'}
        className={CAMPO}
      />

      {valor !== null && !abierto && (
        <p className="mt-1 text-xs text-muted">
          {asignada ? `Se le avisa a ${asignada.email}. ` : 'Recibirá el aviso por correo. '}
          <button
            type="button"
            onClick={limpiar}
            className="font-semibold text-info hover:underline"
          >
            Quitar responsable
          </button>
        </p>
      )}

      {abierto && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-lg"
        >
          {cuentas === null && (
            <li className="px-3 py-2 text-sm text-muted">Cargando personas…</li>
          )}
          {cuentas !== null && sugerencias.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">
              Nadie con ese nombre tiene cuenta en la intranet.
            </li>
          )}
          {sugerencias.map((cuenta) => (
            <li key={cuenta.id}>
              <button
                type="button"
                role="option"
                aria-selected={cuenta.id === valor}
                onClick={() => elegir(cuenta)}
                className={`block w-full px-3 py-2 text-left transition-colors duration-150 hover:bg-brand/5 ${
                  cuenta.id === valor ? 'bg-brand/5' : ''
                }`}
              >
                <span className="block text-sm font-medium text-ink">{cuenta.nombre}</span>
                <span className="block truncate text-xs text-muted">
                  {[cuenta.cargo, cuenta.area].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
