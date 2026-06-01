// ============================================================
// services/alertsService.ts
// Detección de inconsistencias operacionales — función pura.
// Sin efectos secundarios, sin llamadas a Firebase.
// Los componentes llaman esto dentro de useMemo.
// ============================================================
import type { UsuarioRFID, EventoAcceso, OperationalAlert } from '../types';

/**
 * Analiza el estado de usuarios y eventos para detectar
 * inconsistencias operacionales y generarlas como alertas.
 */
export function detectAlerts(
  usuarios: UsuarioRFID[],
  eventos: EventoAcceso[],
): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const TWELVE_HOURS = 12 * ONE_HOUR;

  for (const u of usuarios) {
    // Alerta: usuario activo sin UID asignado (rfid_status sin_asignar o pendiente)
    if (
      u.activo &&
      u.rfid_status &&
      (u.rfid_status === 'sin_asignar' || u.rfid_status === 'pendiente')
    ) {
      alerts.push({
        id: `no-uid-${u.uid}`,
        severity: 'warning',
        titulo: 'Usuario activo sin credencial RFID',
        descripcion: `${u.nombre} está marcado como activo pero su credencial RFID no ha sido asignada (estado: ${u.rfid_status}).`,
        usuario_uid: u.uid,
        usuario_nombre: u.nombre,
      });
    }

    // Alerta: tarjeta programada pero usuario inactivo
    if (!u.activo && u.rfid_status === 'programado') {
      alerts.push({
        id: `prog-inactive-${u.uid}`,
        severity: 'warning',
        titulo: 'Credencial programada en usuario inactivo',
        descripcion: `${u.nombre} tiene una tarjeta programada pero su cuenta está desactivada.`,
        usuario_uid: u.uid,
        usuario_nombre: u.nombre,
      });
    }

    // Alerta: usuario dentro por más de 12 horas
    if (u.dentro && u.ultima_entrada) {
      const entradaMs = new Date(u.ultima_entrada).getTime();
      if (!isNaN(entradaMs) && now - entradaMs > TWELVE_HOURS) {
        const horas = Math.floor((now - entradaMs) / ONE_HOUR);
        alerts.push({
          id: `long-inside-${u.uid}`,
          severity: 'warning',
          titulo: 'Usuario dentro por tiempo inusual',
          descripcion: `${u.nombre} lleva ${horas}h registrado como "dentro". Posible inconsistencia de sensor.`,
          usuario_uid: u.uid,
          usuario_nombre: u.nombre,
        });
      }
    }

    // Alerta: usuario sin rfid_status definido (creado antes del nuevo sistema)
    if (u.activo && !u.rfid_status) {
      alerts.push({
        id: `no-status-${u.uid}`,
        severity: 'info',
        titulo: 'Usuario sin estado RFID',
        descripcion: `${u.nombre} no tiene estado RFID asignado. Considera actualizarlo en la administración.`,
        usuario_uid: u.uid,
        usuario_nombre: u.nombre,
      });
    }
  }

  // Alerta: eventos denegados repetidos en la última hora
  const oneHourAgo = now - ONE_HOUR;
  const recentDenied = eventos.filter(
    (e) =>
      e.resultado === 'denegado' &&
      new Date(e.timestamp).getTime() > oneHourAgo,
  );

  if (recentDenied.length >= 3) {
    alerts.push({
      id: 'repeated-denials',
      severity: 'critical',
      titulo: 'Múltiples accesos denegados',
      descripcion: `Se detectaron ${recentDenied.length} accesos denegados en la última hora. Posible intento de acceso no autorizado.`,
    });
  }

  return alerts;
}

/**
 * Cuenta usuarios con estado rfid_status que requiere atención.
 */
export function countPendingRfid(usuarios: UsuarioRFID[]): number {
  return usuarios.filter(
    (u) =>
      !u.rfid_status ||
      u.rfid_status === 'pendiente' ||
      u.rfid_status === 'sin_asignar',
  ).length;
}
