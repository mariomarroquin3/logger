// ============================================================
// pages/DashboardPage.tsx
// Panel principal con 6 KPI cards + estado maqueta
// ============================================================
import {
  Users,
  UserCheck,
  LogIn,
  LogOut,
  Activity,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardProvider';
import { MetricCard } from '../components/dashboard/MetricCard';
import { DoorStatusCard } from '../components/dashboard/DoorStatusCard';
import { AlarmStatusCard } from '../components/dashboard/AlarmStatusCard';
import { ErrorState } from '../components/ui/ErrorState';
import { formatTimestamp } from '../services/dataTransformer';

export function DashboardPage() {
  const {
    usuarios,
    eventos,
    estado,
    loading,
    error,
    usuariosDentro,
    entradasHoy,
    salidasHoy,
  } = useDashboard();

  const isLoading = loading.estado || loading.usuarios || loading.eventos;
  const hasError  = error.estado || error.usuarios || error.eventos;

  if (hasError) {
    return (
      <ErrorState
        message={hasError || 'Error de conexión con Firebase'}
      />
    );
  }

  // Últimos 5 eventos para la actividad reciente
  const recentEvents = eventos.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Estado de maqueta ──────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Estado del sistema
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <DoorStatusCard
            abierta={estado?.puerta_abierta ?? null}
            loading={loading.estado}
          />
          <AlarmStatusCard
            activa={estado?.alarma_activa ?? null}
            loading={loading.estado}
          />
        </div>
      </div>

      {/* ── KPI Metrics ────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Métricas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Usuarios dentro"
            value={usuariosDentro.length}
            subtitle="En el establecimiento ahora"
            icon={<UserCheck className="h-5 w-5 text-emerald-400" />}
            iconBg="bg-emerald-500/10"
            loading={isLoading}
          />
          <MetricCard
            title="Total registrados"
            value={usuarios.length}
            subtitle="Usuarios en el sistema"
            icon={<Users className="h-5 w-5 text-accent-cyan" />}
            iconBg="bg-cyan-500/10"
            loading={isLoading}
          />
          <MetricCard
            title="Entradas hoy"
            value={entradasHoy}
            subtitle="Accesos de entrada del día"
            icon={<LogIn className="h-5 w-5 text-blue-400" />}
            iconBg="bg-blue-500/10"
            loading={isLoading}
          />
          <MetricCard
            title="Salidas hoy"
            value={salidasHoy}
            subtitle="Accesos de salida del día"
            icon={<LogOut className="h-5 w-5 text-purple-400" />}
            iconBg="bg-purple-500/10"
            loading={isLoading}
          />
        </div>
      </div>

      {/* ── Actividad reciente ─────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Actividad reciente
        </h2>
        <div className="card">
          {recentEvents.length === 0 ? (
            <div className="flex items-center gap-3 py-4 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              Sin eventos registrados aún
            </div>
          ) : (
            <ul className="divide-y divide-surface-border">
              {recentEvents.map((ev, i) => (
                <li
                  key={ev.id}
                  className={`flex items-center justify-between gap-3 py-3
                    ${i === 0 ? 'animate-highlight' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`shrink-0 h-2 w-2 rounded-full
                        ${ev.tipo === 'entrada' ? 'bg-emerald-400' : 'bg-blue-400'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ev.nombre}</p>
                      <p className="text-xs text-gray-500">{ev.uid}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`text-xs font-semibold
                        ${ev.tipo === 'entrada' ? 'text-emerald-400' : 'text-blue-400'}`}
                    >
                      {ev.tipo}
                    </span>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      {formatTimestamp(ev.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Usuarios activos ───────────────────────────────── */}
      {usuariosDentro.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Dentro ahora
          </h2>
          <div className="flex flex-wrap gap-2">
            {usuariosDentro.map((u) => (
              <div
                key={u.uid}
                className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-medium text-emerald-300">{u.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
