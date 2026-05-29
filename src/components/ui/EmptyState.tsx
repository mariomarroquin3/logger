// ============================================================
// components/ui/EmptyState.tsx
// ============================================================
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  message = 'No hay datos disponibles',
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-gray-500">
      <div className="rounded-full bg-surface-muted p-4 text-gray-600">
        {icon ?? <Inbox className="h-8 w-8" />}
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
