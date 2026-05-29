// ============================================================
// components/dashboard/MetricCard.tsx
// Tarjeta KPI reutilizable con ícono, valor y tendencia
// ============================================================
import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBg?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-accent-cyan/10',
  loading = false,
}: MetricCardProps) {
  return (
    <div className="card flex items-start gap-4 animate-fade-in hover:border-accent-cyan/30 transition-colors duration-300">
      {/* Icon */}
      <div className={`shrink-0 rounded-xl p-3 ${iconBg}`}>{icon}</div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        {loading ? (
          <div className="mt-2 h-7 w-16 animate-pulse rounded-md bg-surface-muted" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        )}
        {subtitle && (
          <p className="mt-0.5 text-xs text-gray-600 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
