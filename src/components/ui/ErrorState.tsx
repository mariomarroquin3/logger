// ============================================================
// components/ui/ErrorState.tsx
// ============================================================
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Error al cargar datos',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14 text-gray-400">
      <div className="rounded-full bg-red-500/10 p-4 text-accent-red">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">{message}</p>
        <p className="mt-1 text-xs text-gray-500">Verifica tu conexión a Firebase</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-ghost flex items-center gap-2 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      )}
    </div>
  );
}
