// ============================================================
// components/layout/ConnectionIndicator.tsx
// Indicador visual de estado de conexión a Firebase
// ============================================================
import { useDashboard } from '../../context/DashboardProvider';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionIndicator() {
  const { conectado } = useDashboard();

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-500
        ${conectado
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-red-500/10 text-red-400'
        }`}
    >
      {/* Dot pulsante */}
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75
            ${conectado ? 'animate-ping bg-emerald-400' : 'bg-red-400'}`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full
            ${conectado ? 'bg-emerald-400' : 'bg-red-400'}`}
        />
      </span>

      {conectado ? (
        <>
          <Wifi className="h-3 w-3" />
          Sistema conectado
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Firebase desconectado
        </>
      )}
    </div>
  );
}
