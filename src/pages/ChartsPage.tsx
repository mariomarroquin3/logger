// ============================================================
// pages/ChartsPage.tsx
// Página de análisis con 3 gráficas Recharts en tiempo real
// ============================================================
import { useDashboard } from '../context/DashboardProvider';
import { Card } from '../components/ui/Card';
import { AccessByHourChart } from '../components/charts/AccessByHourChart';
import { EntradaSalidaChart } from '../components/charts/EntradaSalidaChart';
import { TopUsersChart } from '../components/charts/TopUsersChart';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

export function ChartsPage() {
  const {
    loading,
    error,
    accesosPorHora,
    entradaSalida,
    topUsuarios,
    eventos,
  } = useDashboard();

  if (loading.eventos) {
    return <Spinner message="Cargando datos de análisis..." />;
  }

  if (error.eventos) {
    return <ErrorState message={error.eventos} />;
  }

  if (eventos.length === 0) {
    return (
      <EmptyState
        message="No hay datos suficientes para mostrar gráficas"
        icon={<BarChart3 className="h-8 w-8" />}
      />
    );
  }

  const totalHoy = accesosPorHora.reduce((s, d) => s + d.accesos, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-purple-500/10 p-2">
          <BarChart3 className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Análisis de Accesos</h2>
          <p className="text-xs text-gray-500">
            Basado en los últimos {eventos.length} eventos
          </p>
        </div>
      </div>

      {/* Grid de gráficas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Accesos por hora */}
        <Card
          title="Accesos por hora — Hoy"
          subtitle={`${totalHoy} accesos registrados hoy`}
          className="lg:col-span-2"
        >
          <AccessByHourChart data={accesosPorHora} />
        </Card>

        {/* Entradas vs Salidas */}
        <Card
          title="Entradas vs Salidas"
          subtitle="De todos los eventos registrados"
        >
          {entradaSalida.entradas + entradaSalida.salidas === 0 ? (
            <EmptyState message="Sin eventos" />
          ) : (
            <EntradaSalidaChart data={entradaSalida} />
          )}
        </Card>

        {/* Top usuarios */}
        <Card
          title="Usuarios más frecuentes"
          subtitle="Por cantidad de eventos totales"
        >
          {topUsuarios.length === 0 ? (
            <EmptyState message="Sin datos de usuarios" />
          ) : (
            <TopUsersChart data={topUsuarios} />
          )}
        </Card>
      </div>

      {/* Stats resumen */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total entradas', value: entradaSalida.entradas, color: 'text-emerald-400' },
          { label: 'Total salidas',  value: entradaSalida.salidas,  color: 'text-blue-400' },
          { label: 'Hoy',           value: totalHoy,               color: 'text-accent-cyan' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
