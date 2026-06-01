// ============================================================
// components/admin/AlertsWidget.tsx
// Panel de alertas operacionales con severidad visual.
// ============================================================
import { useState } from 'react';
import { AlertTriangle, Info, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import type { OperationalAlert } from '../../types';

const SEVERITY_CONFIG = {
  critical: {
    icon: Zap,
    label: 'Crítico',
    bg: 'bg-red-500/8 border-red-500/20',
    iconColor: 'text-red-400',
    badgeBg: 'bg-red-500/15 text-red-400 border-red-500/20',
    dot: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Advertencia',
    bg: 'bg-amber-500/8 border-amber-500/20',
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  info: {
    icon: Info,
    label: 'Información',
    bg: 'bg-blue-500/8 border-blue-500/20',
    iconColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-500',
  },
};

interface AlertsWidgetProps {
  alerts: OperationalAlert[];
  criticalCount: number;
  warningCount: number;
}

export function AlertsWidget({ alerts, criticalCount, warningCount }: AlertsWidgetProps) {
  const [expanded, setExpanded] = useState(true);

  const hasCritical = criticalCount > 0;

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
        <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="font-medium">Sistema operando sin inconsistencias detectadas</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${hasCritical ? 'border-red-500/25' : 'border-amber-500/20'}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
          hasCritical ? 'bg-red-500/8 hover:bg-red-500/12' : 'bg-amber-500/8 hover:bg-amber-500/12'
        }`}
      >
        <div className="flex items-center gap-3">
          {hasCritical ? (
            <Zap className="h-4 w-4 text-red-400 animate-pulse" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          )}
          <span className={`text-sm font-semibold ${hasCritical ? 'text-red-300' : 'text-amber-300'}`}>
            {alerts.length} alerta{alerts.length > 1 ? 's' : ''} detectada{alerts.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-1.5">
            {criticalCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                {criticalCount} crítica{criticalCount > 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                {warningCount} advertencia{warningCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Alert list */}
      {expanded && (
        <div className="bg-[#141720]/60 divide-y divide-white/5">
          {alerts.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            const Icon = cfg.icon;
            return (
              <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 ${cfg.bg} border-b border-white/3`}>
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.iconColor}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-white">{alert.titulo}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cfg.badgeBg}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{alert.descripcion}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
