// ============================================================
// hooks/useCredenciales.ts
// Listener realtime del nodo credenciales_rfid.
// Retorna todas las credenciales, las disponibles y KPIs.
// ============================================================
import { useEffect, useState, useMemo } from 'react';
import { onValue } from 'firebase/database';
import { credencialesRfidRef } from '../firebase/adminQueries';
import { isFirebaseConfigured } from '../firebase/config';
import type { CredencialRFID } from '../types';

interface UseCredencialesResult {
  credenciales: CredencialRFID[];
  disponibles: CredencialRFID[];
  loading: boolean;
  error: string | null;
  // KPIs
  total: number;
  totalDisponibles: number;
  totalAsignadas: number;
}

const DEMO_CREDENCIALES: CredencialRFID[] = [
  { uid: 'AA1B2C3D', estado: 'disponible', fecha_registro: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), asignada_a: null },
  { uid: 'BB4E5F6A', estado: 'disponible', fecha_registro: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), asignada_a: null },
  { uid: '4A2C8F1B', estado: 'asignada',   fecha_registro: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), asignada_a: 'Juan Pérez' },
  { uid: '9B3D7E2A', estado: 'asignada',   fecha_registro: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), asignada_a: 'María Gómez' },
];

export function useCredenciales(): UseCredencialesResult {
  const [credenciales, setCredenciales] = useState<CredencialRFID[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setCredenciales(DEMO_CREDENCIALES);
      setLoading(false);
      return;
    }

    const unsub = onValue(
      credencialesRfidRef,
      (snap) => {
        if (!snap.exists()) {
          setCredenciales([]);
          setLoading(false);
          return;
        }
        const raw = snap.val() as Record<string, Omit<CredencialRFID, 'uid'>>;
        const list: CredencialRFID[] = Object.entries(raw).map(([uid, data]) => ({
          uid,
          estado: data.estado ?? 'disponible',
          fecha_registro: data.fecha_registro ?? new Date().toISOString(),
          asignada_a: data.asignada_a ?? null,
        }));
        // Ordenar: disponibles primero, luego por fecha descendente
        list.sort((a, b) => {
          if (a.estado !== b.estado) return a.estado === 'disponible' ? -1 : 1;
          return new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime();
        });
        setCredenciales(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const disponibles = useMemo(
    () => credenciales.filter((c) => c.estado === 'disponible'),
    [credenciales],
  );

  return {
    credenciales,
    disponibles,
    loading,
    error,
    total: credenciales.length,
    totalDisponibles: disponibles.length,
    totalAsignadas: credenciales.filter((c) => c.estado === 'asignada').length,
  };
}
