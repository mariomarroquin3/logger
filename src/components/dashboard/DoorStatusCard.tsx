// ============================================================
// components/dashboard/DoorStatusCard.tsx
// Card de estado de la puerta con animación
// ============================================================
import { DoorOpen, DoorClosed } from 'lucide-react';

interface DoorStatusCardProps {
  abierta: boolean | null;
  loading?: boolean;
}

export function DoorStatusCard({ abierta, loading = false }: DoorStatusCardProps) {
  return (
    <div
      className={`card flex flex-col items-center justify-center gap-3 py-6 text-center
        animate-fade-in transition-all duration-500
        ${abierta ? 'border-amber-500/30' : 'border-emerald-500/30'}`}
    >
      {loading ? (
        <div className="h-16 w-16 animate-pulse rounded-full bg-surface-muted" />
      ) : (
        <div
          className={`rounded-full p-4 transition-all duration-500
            ${abierta
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-emerald-500/15 text-emerald-400'
            }`}
        >
          {abierta ? (
            <DoorOpen className="h-8 w-8" />
          ) : (
            <DoorClosed className="h-8 w-8" />
          )}
        </div>
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Estado de Puerta
        </p>
        <p className={`mt-1 text-lg font-bold ${abierta ? 'text-amber-400' : 'text-emerald-400'}`}>
          {loading ? '—' : abierta ? 'Abierta' : 'Cerrada'}
        </p>
      </div>
    </div>
  );
}
