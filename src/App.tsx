// ============================================================
// App.tsx
// Router principal + Providers (DashboardProvider, AuthProvider)
// + Toaster para notificaciones realtime
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth/AuthContext';
import { DashboardProvider } from './context/DashboardProvider';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { ChartsPage } from './pages/ChartsPage';
import { PresencePage } from './pages/PresencePage';

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider: stub actualmente, listo para Firebase Auth */}
      <AuthProvider>
        {/* DashboardProvider: 4 listeners Firebase + derived state */}
        <DashboardProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="eventos"   element={<EventsPage />} />
              <Route path="graficas"  element={<ChartsPage />} />
              <Route path="presencia" element={<PresencePage />} />
              {/* Fallback: redirige a dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>

          {/* Toast notifications para eventos en tiempo real */}
          <Toaster position="bottom-right" />
        </DashboardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
