// ============================================================
// pages/PresencePage.tsx
// Panel de usuarios actualmente dentro del establecimiento
// ============================================================
import { useDashboard } from '../context/DashboardProvider';
import { UserPresenceCard } from '../components/presence/UserPresenceCard';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { Users, UserX } from 'lucide-react';

export function PresencePage() {
  const { usuariosDentro, usuarios, loading, error } = useDashboard();

  if (loading.usuarios) {
    return <Spinner message="Cargando presencia..." />;
  }

  if (error.usuarios) {
    return <ErrorState message={error.usuarios} />;
  }

  const totalRegistrados = usuarios.length;
  const totalDentro      = usuariosDentro.length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Usuarios dentro</h2>
            <p className="text-xs text-gray-500">
              {totalDentro} de {totalRegistrados} usuarios están presentes ahora
            </p>
          </div>
        </div>

        {/* Conteo */}
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2">
          <span className="text-2xl font-bold text-emerald-400">{totalDentro}</span>
          <span className="text-xs text-gray-500">dentro</span>
        </div>
      </div>

      {/* Grid de usuarios o empty state */}
      {usuariosDentro.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-surface-muted p-5">
            <UserX className="h-10 w-10 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-300">
              Actualmente no hay usuarios dentro
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Las tarjetas aparecerán aquí en tiempo real cuando alguien ingrese
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {usuariosDentro.map((usuario) => (
            <UserPresenceCard key={usuario.uid} usuario={usuario} />
          ))}
        </div>
      )}

      {/* Todos los usuarios registrados (referencia rápida) */}
      {usuarios.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Todos los usuarios registrados
          </h3>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden sm:table-cell">UID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden md:table-cell">Activo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {usuarios.map((u) => (
                  <tr key={u.uid} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{u.nombre}</td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-gray-500 sm:table-cell">{u.uid}</td>
                    <td className="px-4 py-3">
                      {u.dentro ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Dentro
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Fuera</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className={`text-xs ${u.activo ? 'text-emerald-400' : 'text-gray-600'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
