// ============================================================
// auth/ProtectedRoute.tsx
// Wrapper de ruta protegida para forzar autenticación y whitelist.
// Cuando se usa como elemento de un <Route> padre, envuelve a
// sus hijos; cuando se le pasan children (ej: <AppLayout />),
// los renderiza directamente.
// ============================================================
import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, unauthorizedUser } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0c14]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
          <p className="text-sm text-gray-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está logueado
  if (!user) {
    // Si fue rechazado por la whitelist, ir a unauthorized
    if (unauthorizedUser) {
      return <Navigate to="/unauthorized" replace />;
    }
    // De lo contrario, ir a login
    return <Navigate to="/login" replace />;
  }

  // Si requiere un rol específico y no lo tiene
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Renderizar children (si existen, e.g. <AppLayout />) o el <Outlet /> del router
  return children ? <>{children}</> : <Outlet />;
}
