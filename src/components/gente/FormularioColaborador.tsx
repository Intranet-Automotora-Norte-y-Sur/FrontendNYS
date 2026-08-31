import { useState } from 'react';

export interface DatosColaborador {
  id_identificacion: string;
  nombre: string;
  cargo: string;
  area: string;
  sede: string;
  fecha_nacimiento: string;
  fecha_ingreso: string;
  tipo_contrato: string;
  salario: string;
  email: string;
  rol: string;
  crear_cuenta: boolean;
}

const VACIO: DatosColaborador = {
  id_identificacion: '',
  nombre: '',
  cargo: '',
  area: '',
  sede: '',
  fecha_nacimiento: '',
  fecha_ingreso: '',
  tipo_contrato: '',
  salario: '',
  email: '',
  rol: 'colaborador',
  crear_cuenta: true,
};

/** Campos de texto: [clave, etiqueta, tipo de input, obligatorio]. */
const CAMPOS = [
  ['id_identificacion', 'Cédula', 'text', true],
  ['nombre', 'Nombre completo', 'text', true],
  ['cargo', 'Cargo', 'text', true],
  // Si se deja vacía, el servidor la deduce del nombre de la sede.
  ['area', 'Área', 'text', false],
  ['tipo_contrato', 'Tipo de contrato', 'text', true],
  ['fecha_nacimiento', 'Fecha de nacimiento', 'date', true],
  ['fecha_ingreso', 'Fecha de ingreso', 'date', true],
  ['salario', 'Salario mensual (COP)', 'number', false],
] as const;


interface FormularioColaboradorProps {
  guardando: boolean;
  /** Sedes ya existentes en la nómina, para sugerirlas sin cerrar la lista. */
  sedes?: readonly string[];
  /** Crea el colaborador y, si hay foto, la sube. Devuelve true si se guardó. */
  onGuardar: (datos: DatosColaborador, foto: File | null) => Promise<boolean>;
  onCancelar: () => void;
}

/** Alta de un colaborador, con foto opcional desde el mismo formulario. */
export function FormularioColaborador({
  guardando,
  sedes = [],
  onGuardar,
  onCancelar,
}: FormularioColaboradorProps) {
  const [datos, setDatos] = useState<DatosColaborador>(VACIO);
  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  const elegirFoto = (archivo: File | null) => {
    setFoto(archivo);
    setVistaPrevia((previa) => {
      if (previa) URL.revokeObjectURL(previa);
      return archivo ? URL.createObjectURL(archivo) : null;
    });
  };

  const enviar = async () => {
    const guardado = await onGuardar(datos, foto);
    if (!guardado) return;
    setDatos(VACIO);
    elegirFoto(null);
  };

  return (
    <form
      className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
    >
      {CAMPOS.map(([campo, etiqueta, tipo, obligatorio]) => (
        <div key={campo}>
          <label className="mb-1 block text-xs font-medium text-body" htmlFor={`nuevo-${campo}`}>
            {etiqueta}
            {!obligatorio && <span className="text-faint"> (opcional)</span>}
          </label>
          <input
            id={`nuevo-${campo}`}
            type={tipo}
            required={obligatorio}
            value={datos[campo]}
            onChange={(e) => setDatos((d) => ({ ...d, [campo]: e.target.value }))}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-brand"
          />
        </div>
      ))}

      <div>
        <label className="mb-1 block text-xs font-medium text-body" htmlFor="nuevo-sede">
          Sede
        </label>
        <input
          id="nuevo-sede"
          type="text"
          list="sedes-existentes"
          required
          placeholder="Toyota Sur Taller"
          value={datos.sede}
          onChange={(e) => setDatos((d) => ({ ...d, sede: e.target.value }))}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-brand"
        />
        <datalist id="sedes-existentes">
          {sedes.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-body" htmlFor="nuevo-email">
          Correo personal
          {!datos.crear_cuenta && <span className="text-faint"> (opcional)</span>}
        </label>
        <input
          id="nuevo-email"
          type="email"
          required={datos.crear_cuenta}
          placeholder="nombre@gmail.com"
          value={datos.email}
          onChange={(e) => setDatos((d) => ({ ...d, email: e.target.value }))}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-brand"
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-body">Foto (opcional)</span>
        <div className="flex items-center gap-3">
          {vistaPrevia ? (
            <img
              src={vistaPrevia}
              alt="Vista previa de la foto"
              className="h-11 w-11 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface text-xs font-bold text-faint">
              N/S
            </span>
          )}
          <label className="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-semibold text-body transition-colors duration-150 hover:border-brand hover:text-brand">
            {foto ? 'Cambiar' : 'Elegir foto'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => elegirFoto(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <label className="flex items-start gap-2 rounded-xl bg-surface p-3 text-sm text-body">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={datos.crear_cuenta}
            onChange={(e) => setDatos((d) => ({ ...d, crear_cuenta: e.target.checked }))}
          />
          <span>
            Crear su cuenta de acceso a la intranet, como colaborador.
            <span className="mt-0.5 block text-xs text-muted">
              Para hacerlo editor o administrador, cámbiale el rol después en
              «Administración». Usuario y contraseña iniciales: la cédula
              {datos.id_identificacion && (
                <>
                  {' '}
                  (<span className="font-mono">{datos.id_identificacion}</span>)
                </>
              )}
              . Pídele que la cambie en su primer ingreso.
            </span>
          </span>
        </label>
      </div>

      <div className="flex items-end gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar colaborador'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors duration-150 hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
