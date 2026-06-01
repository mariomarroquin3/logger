// ============================================================
// firebase/adminQueries.ts
// Refs y queries de Firebase para el módulo de administración.
// Los refs del dashboard original permanecen en queries.ts sin cambios.
// ============================================================
import { ref, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from './config';

/** Todos los usuarios RFID (usuarios_autorizados) — para admin */
export const usuariosRfidAdminRef = ref(db, 'usuarios_autorizados');

/** Log de auditoría — nodo nuevo, no usado por ESP32 */
export const auditLogsRef = ref(db, 'audit_logs');

/** Últimos 200 registros de auditoría */
export const auditLogsQuery = query(
  ref(db, 'audit_logs'),
  orderByChild('timestamp'),
  limitToLast(200),
);
