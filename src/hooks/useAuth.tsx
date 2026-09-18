import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, tokenStore } from '../lib/api';

export type Rol = 'colaborador' | 'editor' | 'admin';

export interface Usuario {
  usuario: string;
  email: string;
  nombre: string;
  id_identificacion: string;
  cargo: string;
  area: string;
  rol: Rol;
  /** Sigue entrando con la cédula como contraseña; cambiarla es opcional. */
  usa_clave_inicial: boolean;
}

/** Reto del segundo factor: el código ya viaja al correo del colaborador. */
export interface RetoCodigo {
  /** Ticket firmado que representa el login a medias. */
  token: string;
  /** Correo enmascarado, para que sepa dónde buscar el código. */
  correo: string;
  /** Segundos que dura el código. */
  expiraEn: number;
  /** Segundos que hay que esperar antes de poder pedir otro. */
  reenvioEn: number;
}

export type ResultadoLogin =
  | { estado: 'ok' }
  | { estado: 'codigo'; reto: RetoCodigo }
  | { estado: 'error'; mensaje: string };

export type ResultadoCodigo = { estado: 'ok' } | { estado: 'error'; mensaje: string };

interface AuthContexto {
  usuario: Usuario | null;
  cargando: boolean;
  /** Paso 1: credenciales. Devuelve el reto del código, no la sesión. */
  login: (usuario: string, password: string) => Promise<ResultadoLogin>;
  /** Paso 2: el código del correo abre la sesión. */
  verificarCodigo: (token: string, codigo: string) => Promise<ResultadoCodigo>;
  /** Pide otro código para el mismo login en curso. */
  reenviarCodigo: (token: string) => Promise<ResultadoLogin>;
  logout: () => Promise<void>;
  refrescarPerfil: () => Promise<void>;
}

/** Respuesta del backend, con las llaves en español del contrato de la API. */
interface RespuestaAuth {
  access?: string;
  doble_factor?: boolean;
  token_2fa?: string;
  correo?: string;
  expira_en?: number;
  reenvio_en?: number;
  detail?: string;
}

const ERROR_GENERICO = 'No se pudo iniciar sesión. Intenta de nuevo.';

async function leer(resp: Response): Promise<RespuestaAuth> {
  try {
    return (await resp.json()) as RespuestaAuth;
  } catch {
    return {};
  }
}

const Ctx = createContext<AuthContexto | null>(null);

async function cargarPerfil(): Promise<Usuario | null> {
  const resp = await api.get('/api/auth/me/');
  if (!resp.ok) return null;
  return (await resp.json()) as Usuario;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al montar: si hay cookie de refresh válida, /me funciona tras el retry automático
  useEffect(() => {
    cargarPerfil()
      .then(setUsuario)
      .finally(() => setCargando(false));
  }, []);

  /** Guarda el access token y trae el perfil. Fin de cualquier login. */
  const abrirSesion = useCallback(async (access: string) => {
    tokenStore.set(access);
    setUsuario(await cargarPerfil());
  }, []);

  /** Traduce una respuesta de /login/ o /login/reenviar/ al resultado del hook. */
  const interpretar = useCallback(
    async (resp: Response): Promise<ResultadoLogin> => {
      const data = await leer(resp);
      if (!resp.ok) {
        if (resp.status === 401) return { estado: 'error', mensaje: 'Usuario o contraseña incorrectos.' };
        return { estado: 'error', mensaje: data.detail ?? ERROR_GENERICO };
      }
      // Con el doble factor apagado el backend abre la sesión de una vez.
      if (data.access) {
        await abrirSesion(data.access);
        return { estado: 'ok' };
      }
      return {
        estado: 'codigo',
        reto: {
          token: data.token_2fa ?? '',
          correo: data.correo ?? '',
          expiraEn: data.expira_en ?? 600,
          reenvioEn: data.reenvio_en ?? 60,
        },
      };
    },
    [abrirSesion],
  );

  const login = useCallback(
    async (usuario: string, password: string) =>
      interpretar(await api.post('/api/auth/login/', { username: usuario, password })),
    [interpretar],
  );

  const reenviarCodigo = useCallback(
    async (token: string) =>
      interpretar(await api.post('/api/auth/login/reenviar/', { token_2fa: token })),
    [interpretar],
  );

  const verificarCodigo = useCallback(
    async (token: string, codigo: string): Promise<ResultadoCodigo> => {
      const resp = await api.post('/api/auth/login/verificar/', {
        token_2fa: token,
        codigo,
      });
      const data = await leer(resp);
      if (!resp.ok || !data.access) {
        return { estado: 'error', mensaje: data.detail ?? ERROR_GENERICO };
      }
      await abrirSesion(data.access);
      return { estado: 'ok' };
    },
    [abrirSesion],
  );

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout/');
    tokenStore.clear();
    setUsuario(null);
  }, []);

  /** Relee /me tras cambiar la contraseña, para que el aviso desaparezca. */
  const refrescarPerfil = useCallback(async () => {
    setUsuario(await cargarPerfil());
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      login,
      verificarCodigo,
      reenviarCodigo,
      logout,
      refrescarPerfil,
    }),
    [usuario, cargando, login, verificarCodigo, reenviarCodigo, logout, refrescarPerfil],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthContexto {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth requiere AuthProvider');
  return ctx;
}
