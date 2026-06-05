// ============================================================
// App.tsx
// Router principal + Providers (SerialProvider, AuthProvider, DashboardProvider)
// + Toaster para notificaciones realtime
//
// Estructura de rutas:
//   /                               → ReceptionPage (pública, sin layout)
//   /login                          → LoginPage (pública)
//   /unauthorized                   → UnauthorizedPage (pública)
//   /dashboard                      → DashboardPage (protegida)
//   /dashboard/eventos              → EventsPage
//   /dashboard/graficas             → ChartsPage
//   /dashboard/presencia            → PresencePage
//   /dashboard/admin/usuarios-rfid  → RfidUsersPage (admin)
//   /dashboard/admin/pipeline-rfid  → PipelinePage (admin)
//   /dashboard/admin/credenciales-rfid → CredencialesPage (admin)
//   /dashboard/admin/estacion-rfid  → EstacionRfidPage (admin)
//   *                               → / (fallback a recepción)
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardProvider } from './context/DashboardProvider';
import { SerialProvider } from './context/SerialContext';
import { AppLayout } from './layouts/AppLayout';

// Páginas públicas
import { ReceptionPage } from './pages/ReceptionPage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Páginas del dashboard (protegidas)
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { ChartsPage } from './pages/ChartsPage';
import { PresencePage } from './pages/PresencePage';

// Páginas de administración (rol admin)
import { RfidUsersPage } from './pages/admin/RfidUsersPage';
import { PipelinePage } from './pages/admin/PipelinePage';
import { CredencialesPage } from './pages/admin/CredencialesPage';
import { EstacionRfidPage } from './pages/admin/EstacionRfidPage';

export default function App() {
  return (
    <BrowserRouter>
      {/*
        SerialProvider: singleton de Web Serial API.
        Fuera de AuthProvider para que la pantalla pública (/)
        también pueda escuchar eventos del lector sin estar logueado.
      */}
      <SerialProvider>
        {/* AuthProvider: gestiona Firebase Auth + whitelist RTDB */}
        <AuthProvider>
          <Routes>
            {/* ── Rutas públicas ── */}
            <Route path="/"            element={<ReceptionPage />} />
            <Route path="/login"       element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* ── Rutas protegidas (autenticación requerida) ── */}
            <Route
              element={
                <ProtectedRoute>
                  {/* DashboardProvider: 4 listeners Firebase + derived state */}
                  <DashboardProvider>
                    <AppLayout />
                  </DashboardProvider>
                </ProtectedRoute>
              }
            >
              {/* Dashboard principal */}
              <Route path="dashboard" index element={<DashboardPage />} />
              <Route path="dashboard/eventos"   element={<EventsPage />} />
              <Route path="dashboard/graficas"  element={<ChartsPage />} />
              <Route path="dashboard/presencia" element={<PresencePage />} />

              {/* Administración (requieren rol admin) */}
              <Route path="dashboard/admin" element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="usuarios-rfid"    element={<RfidUsersPage />} />
                <Route path="pipeline-rfid"    element={<PipelinePage />} />
                <Route path="credenciales-rfid" element={<CredencialesPage />} />
                <Route path="estacion-rfid"    element={<EstacionRfidPage />} />
              </Route>
            </Route>

            {/* Fallback: redirige a recepción pública */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toast notifications para eventos en tiempo real */}
          <Toaster position="bottom-right" />
        </AuthProvider>
      </SerialProvider>
    </BrowserRouter>
  );
}
