// ============================================================
// auth/ProtectedRoute.tsx
// Stub de ruta protegida — actualmente hace pass-through
// Cuando se implemente Auth, bloqueará según rol
// ============================================================
import type { ReactNode } from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from './AuthContext';
// import type { Role } from './roles';

interface ProtectedRouteProps {
  children: ReactNode;
  // requiredRole?: Role;  // se usará cuando se active RBAC
}

/**
 * Por ahora pasa todo sin restricción.
 * Para activar protección: descomentar la lógica de useAuth()
 * y verificar el rol del usuario contra requiredRole.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // TODO: Activar cuando se implemente Firebase Auth
  // const { user, loading } = useAuth();
  // if (loading) return <Spinner />;
  // if (!user) return <Navigate to="/login" replace />;
  // if (requiredRole && user.role !== requiredRole)
  //   return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
