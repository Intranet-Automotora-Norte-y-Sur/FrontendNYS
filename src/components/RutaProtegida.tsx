import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type Rol } from '../hooks/useAuth';

const JERARQUIA: Record<Rol, number> = { colaborador: 0, editor: 1, admin: 2 };

interface Props {
  children: ReactNode;
  rolMinimo?: Rol;
}

export function RutaProtegida({ children, rolMinimo = 'colaborador' }: Props) {
  const { usuario, cargando } = useAuth();
  if (cargando) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">Cargando…</div>
    );
  }
  if (!usuario) return <Navigate to="/login" replace />;
  if (JERARQUIA[usuario.rol] < JERARQUIA[rolMinimo]) return <Navigate to="/" replace />;
  return <>{children}</>;
}
