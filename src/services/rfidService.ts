// ============================================================
// services/rfidService.ts
// CRUD de usuarios RFID + escritura de audit logs.
// Todos los campos nuevos son opcionales para mantener
// compatibilidad backward con la ESP32.
// ============================================================
import { ref, set, update, remove, push } from 'firebase/database';
import { db } from '../firebase/config';
import { auditLogsRef } from '../firebase/adminQueries';
import type { UsuarioRFID, AuditLog, RfidStatus } from '../types';

// ─── Audit log ───────────────────────────────────────────────

/**
 * Escribe una entrada en audit_logs.
 * Silencia errores para no bloquear la acción principal.
 */
export async function writeAuditLog(log: Omit<AuditLog, 'id'>): Promise<void> {
  try {
    await push(auditLogsRef, {
      ...log,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[AuditLog] Error al escribir:', err);
  }
}

// ─── CRUD Usuarios RFID ──────────────────────────────────────

/**
 * Crea un nuevo usuario RFID.
 * La key del nodo ES el UID RFID (ej: "A1B2C3D4").
 * Solo escribe campos básicos + los extendidos que vengan.
 * Campos que la ESP32 necesita: nombre, activo, dentro.
 */
export async function createUsuarioRFID(
  data: Omit<UsuarioRFID, 'uid'> & { uid: string },
  actorUid: string,
  actorNombre: string,
): Promise<void> {
  const { uid, ...rest } = data;

  // Estructura mínima compatible con ESP32 + campos extendidos opcionales
  const payload: Record<string, unknown> = {
    nombre: rest.nombre,
    activo: rest.activo ?? true,
    dentro: rest.dentro ?? false,
    fecha_creacion: new Date().toISOString(),
    creado_por: actorUid,
    rfid_status: rest.rfid_status ?? 'pendiente',
  };

  // Campos opcionales: solo incluir si tienen valor
  if (rest.cargo)        payload.cargo        = rest.cargo;
  if (rest.departamento) payload.departamento = rest.departamento;
  if (rest.email)        payload.email        = rest.email;
  if (rest.notas)        payload.notas        = rest.notas;

  await set(ref(db, `usuarios_autorizados/${uid}`), payload);

  await writeAuditLog({
    actor_uid: actorUid,
    actor_nombre: actorNombre,
    accion: 'crear_usuario',
    objetivo_uid: uid,
    descripcion: `Usuario creado: ${rest.nombre}`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Actualiza campos de un usuario RFID existente.
 * Solo toca los campos del patch — NUNCA borra campos existentes.
 * La ESP32 continuará leyendo nombre, activo y dentro sin interrupciones.
 */
export async function updateUsuarioRFID(
  uid: string,
  patch: Partial<Omit<UsuarioRFID, 'uid'>>,
  actorUid: string,
  actorNombre: string,
  descripcion = 'Usuario actualizado',
): Promise<void> {
  // Limpiar undefined para que Firebase no los escriba como null
  const cleanPatch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) cleanPatch[k] = v;
  }

  await update(ref(db, `usuarios_autorizados/${uid}`), cleanPatch);

  await writeAuditLog({
    actor_uid: actorUid,
    actor_nombre: actorNombre,
    accion: 'editar_usuario',
    objetivo_uid: uid,
    descripcion,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Activa o desactiva un usuario RFID.
 * Solo modifica el campo `activo` — igual que lo haría la ESP32.
 */
export async function toggleActivoUsuario(
  uid: string,
  activo: boolean,
  actorUid: string,
  actorNombre: string,
  nombreUsuario: string,
): Promise<void> {
  await update(ref(db, `usuarios_autorizados/${uid}`), { activo });

  await writeAuditLog({
    actor_uid: actorUid,
    actor_nombre: actorNombre,
    accion: activo ? 'activar_usuario' : 'desactivar_usuario',
    objetivo_uid: uid,
    descripcion: `Usuario ${activo ? 'activado' : 'desactivado'}: ${nombreUsuario}`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Cambia el rfid_status de un usuario.
 * Opcionalmente también cambia `activo` (para estados terminal).
 */
export async function updateRfidStatus(
  uid: string,
  rfid_status: RfidStatus,
  actorUid: string,
  actorNombre: string,
  nombreUsuario: string,
): Promise<void> {
  const patch: Record<string, unknown> = { rfid_status };

  // Estados que modifican `activo` automáticamente
  if (rfid_status === 'deshabilitado') patch.activo = false;
  if (rfid_status === 'activo')        patch.activo = true;

  await update(ref(db, `usuarios_autorizados/${uid}`), patch);

  await writeAuditLog({
    actor_uid: actorUid,
    actor_nombre: actorNombre,
    accion: 'cambio_rfid_status',
    objetivo_uid: uid,
    descripcion: `Estado RFID de ${nombreUsuario} cambiado a "${rfid_status}"`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Elimina un usuario RFID de Firebase.
 * Acción irreversible — debe ir precedida de confirmación en UI.
 */
export async function deleteUsuarioRFID(
  uid: string,
  nombreUsuario: string,
  actorUid: string,
  actorNombre: string,
): Promise<void> {
  await remove(ref(db, `usuarios_autorizados/${uid}`));

  await writeAuditLog({
    actor_uid: actorUid,
    actor_nombre: actorNombre,
    accion: 'eliminar_usuario',
    objetivo_uid: uid,
    descripcion: `Usuario eliminado: ${nombreUsuario} (UID: ${uid})`,
    timestamp: new Date().toISOString(),
  });
}
