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

interface AuthContexto {
  usuario: Usuario | null;
  cargando: boolean;
  login: (usuario: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refrescarPerfil: () => Promise<void>;
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

  const login = useCallback(async (usuario: string, password: string) => {
    const resp = await api.post('/api/auth/login/', { username: usuario, password });
    if (!resp.ok) {
      return resp.status === 401
        ? 'Correo o contraseña incorrectos.'
        : 'No se pudo iniciar sesión. Intenta de nuevo.';
    }
    const data = (await resp.json()) as { access: string };
    tokenStore.set(data.access);
    setUsuario(await cargarPerfil());
    return null;
  }, []);

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
    () => ({ usuario, cargando, login, logout, refrescarPerfil }),
    [usuario, cargando, login, logout, refrescarPerfil],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthContexto {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth requiere AuthProvider');
  return ctx;
}
