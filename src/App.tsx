import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { RutaProtegida } from './components/RutaProtegida';
import { AuthProvider } from './hooks/useAuth';
import { Academia } from './pages/Academia';
import { Buscar } from './pages/Buscar';
import { EnlacesToyota } from './pages/EnlacesToyota';
import { Certificados } from './pages/Certificados';
import { Indicadores } from './pages/Indicadores';
import { Inicio } from './pages/Inicio';
import { Login } from './pages/Login';
import { Sugerencias } from './pages/Sugerencias';
import { SeccionContenido } from './pages/SeccionContenido';

// El panel carga TipTap — solo lo descargan editores/admins que lo abren
const Panel = lazy(() => import('./pages/Panel'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RutaProtegida>
                <AppLayout />
              </RutaProtegida>
            }
          >
            <Route path="/" element={<Inicio />} />
            <Route
              path="/comunicados"
              element={<SeccionContenido seccion="comunicados" titulo="Comunicados" descripcion="Noticias y anuncios de la empresa." />}
            />
            <Route
              path="/beneficios"
              element={<SeccionContenido seccion="beneficios" titulo="Beneficios" descripcion="Convenios y beneficios para colaboradores." />}
            />
            <Route path="/certificados" element={<Certificados />} />
            <Route path="/indicadores" element={<Indicadores />} />
            <Route path="/academia" element={<Academia />} />
            <Route path="/enlaces" element={<EnlacesToyota />} />
            <Route path="/buscar" element={<Buscar />} />
            <Route
              path="/talento-humano"
              element={<SeccionContenido seccion="info_rrhh" titulo="Talento Humano" descripcion="Misión, visión y cultura Norte y Sur." />}
            />
            <Route
              path="/fondo-fenys"
              element={<SeccionContenido seccion="fondo_fenys" titulo="Fondo Fenys" descripcion="Fondo de empleados Norte y Sur." />}
            />
            <Route path="/sugerencias" element={<Sugerencias />} />
            <Route
              path="/panel"
              element={
                <RutaProtegida rolMinimo="editor">
                  <Suspense fallback={<p className="text-sm text-muted">Cargando panel…</p>}>
                    <Panel />
                  </Suspense>
                </RutaProtegida>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
