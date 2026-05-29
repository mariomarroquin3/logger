// ============================================================
// pages/EventsPage.tsx
// Página de historial de eventos con tabla en tiempo real
// ============================================================
import { useDashboard } from '../context/DashboardProvider';
import { EventsTable } from '../components/events/EventsTable';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { ClipboardList } from 'lucide-react';

export function EventsPage() {
  const { eventos, loading, error } = useDashboard();

  if (loading.eventos) {
    return <Spinner message="Cargando historial de eventos..." />;
  }

  if (error.eventos) {
    return <ErrorState message={error.eventos} />;
  }

  const newestId = eventos[0]?.id;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/10 p-2">
          <ClipboardList className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">
            Historial de Accesos
          </h2>
          <p className="text-xs text-gray-500">
            Últimos {eventos.length} eventos · Actualización en tiempo real
          </p>
        </div>
      </div>

      {/* Table */}
      <EventsTable eventos={eventos} newestId={newestId} />
    </div>
  );
}
