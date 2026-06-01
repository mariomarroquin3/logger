// ============================================================
// hooks/useAuditLogs.ts
// Listener realtime de audit_logs (últimos 200).
// ============================================================
import { useEffect, useState } from 'react';
import { onValue } from 'firebase/database';
import { auditLogsQuery } from '../firebase/adminQueries';
import { isFirebaseConfigured } from '../firebase/config';
import type { AuditLog } from '../types';

interface UseAuditLogsResult {
  logs: AuditLog[];
  loading: boolean;
}

export function useAuditLogs(): UseAuditLogsResult {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const unsub = onValue(
      auditLogsQuery,
      (snap) => {
        if (!snap.exists()) {
          setLogs([]);
          setLoading(false);
          return;
        }
        const raw = snap.val() as Record<string, Omit<AuditLog, 'id'>>;
        const list: AuditLog[] = Object.entries(raw)
          .map(([id, data]) => ({ id, ...data }))
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
        setLogs(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  return { logs, loading };
}
