// ============================================================
// hooks/useOperationalAlerts.ts
// Deriva alertas operacionales desde usuarios y eventos.
// Usa detectAlerts() (función pura) dentro de useMemo.
// ============================================================
import { useMemo } from 'react';
import { detectAlerts } from '../services/alertsService';
import type { UsuarioRFID, EventoAcceso, OperationalAlert, AlertSeverity } from '../types';

interface UseOperationalAlertsResult {
  alerts: OperationalAlert[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  totalCount: number;
}

export function useOperationalAlerts(
  usuarios: UsuarioRFID[],
  eventos: EventoAcceso[],
): UseOperationalAlertsResult {
  const alerts = useMemo(
    () => detectAlerts(usuarios, eventos),
    [usuarios, eventos],
  );

  const count = (sev: AlertSeverity) => alerts.filter((a) => a.severity === sev).length;

  return {
    alerts,
    criticalCount: count('critical'),
    warningCount:  count('warning'),
    infoCount:     count('info'),
    totalCount:    alerts.length,
  };
}
