// ============================================================
// auth/roles.ts
// Definición de roles RBAC — preparado para implementación futura
// de Firebase Authentication con role-based access control
// ============================================================

export type Role = 'admin' | 'viewer';

export const ROLE_LABELS: Record<Role, string> = {
  admin:  'Administrador',
  viewer: 'Visualizador',
};

/** Permisos por rol (preparados para futuro) */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin:  ['read', 'write', 'manage_users', 'manage_roles'],
  viewer: ['read'],
};

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
