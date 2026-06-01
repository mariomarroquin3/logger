// ============================================================
// App.tsx
// Router principal + Providers (DashboardProvider, AuthProvider)
// + Toaster para notificaciones realtime
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardProvider } from './context/DashboardProvider';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { ChartsPage } from './pages/ChartsPage';
import { PresencePage } from './pages/PresencePage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { RfidUsersPage } from './pages/admin/RfidUsersPage';
import { PipelinePage } from './pages/admin/PipelinePage';

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider: gestiona Firebase Auth + whitelist RTDB */}
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Rutas protegidas: requieren usuario autenticado y en usuarios_dashboard */}
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
            <Route index element={<DashboardPage />} />
            <Route path="eventos"   element={<EventsPage />} />
            <Route path="graficas"  element={<ChartsPage />} />
            <Route path="presencia" element={<PresencePage />} />

            {/* Rutas de Administración (requieren rol admin) */}
            <Route path="admin" element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="usuarios-rfid" element={<RfidUsersPage />} />
              <Route path="pipeline-rfid" element={<PipelinePage />} />
            </Route>
          </Route>

          {/* Fallback: redirige a dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Toast notifications para eventos en tiempo real */}
        <Toaster position="bottom-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
