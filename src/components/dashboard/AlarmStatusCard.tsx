// ============================================================
// components/dashboard/AlarmStatusCard.tsx
// Card de estado de alarma con animación pulsante si activa
// ============================================================
import { BellOff, BellRing } from 'lucide-react';

interface AlarmStatusCardProps {
  activa: boolean | null;
  loading?: boolean;
}

export function AlarmStatusCard({ activa, loading = false }: AlarmStatusCardProps) {
  return (
    <div
      className={`card flex flex-col items-center justify-center gap-3 py-6 text-center
        animate-fade-in transition-all duration-500
        ${activa ? 'border-red-500/40' : 'border-surface-border'}`}
    >
      {loading ? (
        <div className="h-16 w-16 animate-pulse rounded-full bg-surface-muted" />
      ) : (
        <div
          className={`rounded-full p-4 transition-all duration-300
            ${activa
              ? 'bg-red-500/15 text-red-400 animate-pulse-alarm'
              : 'bg-gray-500/10 text-gray-500'
            }`}
        >
          {activa ? (
            <BellRing className="h-8 w-8" />
          ) : (
            <BellOff className="h-8 w-8" />
          )}
        </div>
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Alarma
        </p>
        <p className={`mt-1 text-lg font-bold ${activa ? 'text-red-400' : 'text-gray-400'}`}>
          {loading ? '—' : activa ? 'ACTIVA' : 'Inactiva'}
        </p>
      </div>
      {activa && (
        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 border border-red-500/20">
          ⚠ Alerta de seguridad
        </span>
      )}
    </div>
  );
}
