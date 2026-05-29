// ============================================================
// auth/ProtectedRoute.tsx
// Wrapper de ruta protegida para forzar autenticación y whitelist
// ============================================================
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Spinner } from '../components/ui/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, unauthorizedUser } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <Spinner />
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

  // Si requiere un rol específico
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
