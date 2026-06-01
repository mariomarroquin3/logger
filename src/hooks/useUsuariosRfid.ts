// ============================================================
// hooks/useUsuariosRfid.ts
// Listener realtime de usuarios_autorizados como UsuarioRFID[].
// Independiente del DashboardProvider para que las páginas admin
// tengan su propio ciclo de vida limpio.
// ============================================================
import { useEffect, useState } from 'react';
import { onValue } from 'firebase/database';
import { usuariosRfidAdminRef } from '../firebase/adminQueries';
import { isFirebaseConfigured } from '../firebase/config';
import type { UsuarioRFID } from '../types';

interface UseUsuariosRfidResult {
  usuarios: UsuarioRFID[];
  loading: boolean;
  error: string | null;
}

export function useUsuariosRfid(): UseUsuariosRfidResult {
  const [usuarios, setUsuarios] = useState<UsuarioRFID[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Demo data
      setUsuarios([
        {
          uid: '4A2C8F1B', nombre: 'Juan Pérez', activo: true, dentro: false,
          cargo: 'Ingeniero', departamento: 'IT', rfid_status: 'activo',
          fecha_creacion: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          email: 'juan@empresa.com',
        },
        {
          uid: '9B3D7E2A', nombre: 'María Gómez', activo: true, dentro: true,
          cargo: 'Diseñadora', departamento: 'Diseño', rfid_status: 'activo',
          fecha_creacion: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        },
        {
          uid: '1F5A9C4E', nombre: 'Carlos Ruiz', activo: true, dentro: false,
          cargo: 'Analista', departamento: 'Finanzas', rfid_status: 'programado',
          fecha_creacion: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        },
        {
          uid: '8C6B2D9F', nombre: 'Ana López', activo: false, dentro: false,
          cargo: 'Supervisora', departamento: 'RRHH', rfid_status: 'deshabilitado',
          fecha_creacion: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        },
        {
          uid: 'NEW00001', nombre: 'Pedro Silva', activo: true, dentro: false,
          rfid_status: 'pendiente',
          fecha_creacion: new Date().toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    const unsub = onValue(
      usuariosRfidAdminRef,
      (snap) => {
        if (!snap.exists()) {
          setUsuarios([]);
          setLoading(false);
          return;
        }
        const raw = snap.val() as Record<string, Omit<UsuarioRFID, 'uid'>>;
        const list: UsuarioRFID[] = Object.entries(raw).map(([uid, data]) => ({
          uid,
          nombre: data.nombre ?? 'Sin nombre',
          activo: data.activo ?? false,
          dentro: data.dentro ?? false,
          // Campos opcionales extendidos
          cargo: data.cargo,
          departamento: data.departamento,
          email: data.email,
          fecha_creacion: data.fecha_creacion,
          creado_por: data.creado_por,
          rfid_status: data.rfid_status,
          ultima_entrada: data.ultima_entrada,
          ultima_salida: data.ultima_salida,
          notas: data.notas,
        }));
        // Ordenar por fecha_creacion descendente, luego por nombre
        list.sort((a, b) => {
          if (a.fecha_creacion && b.fecha_creacion) {
            return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
          }
          return a.nombre.localeCompare(b.nombre);
        });
        setUsuarios(list);
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

  return { usuarios, loading, error };
}
