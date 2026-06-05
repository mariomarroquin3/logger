// ============================================================
// services/credencialesService.ts
// CRUD del nodo credenciales_rfid/{uid}
// Este nodo es SOLO para el inventario de chips físicos.
// El ESP32 NO lo lee — no hay riesgo de incompatibilidad.
// ============================================================
import { ref, set, update, get } from 'firebase/database';
import { db } from '../firebase/config';
import type { CredencialRFID } from '../types';

// ─── Crear / Registrar ───────────────────────────────────────

/**
 * Registra un chip RFID físico en el inventario.
 * Falla silenciosamente si el UID ya existe (la UI debe verificar antes).
 */
export async function registrarCredencial(uid: string): Promise<void> {
  const cleanUid = uid.trim().toUpperCase();
  const payload: Omit<CredencialRFID, 'uid'> = {
    estado: 'disponible',
    fecha_registro: new Date().toISOString(),
    asignada_a: null,
  };
  await set(ref(db, `credenciales_rfid/${cleanUid}`), payload);
}

// ─── Asignar / Liberar ───────────────────────────────────────

/**
 * Marca una credencial como asignada al crear un usuario RFID.
 * Llamar DESPUÉS de createUsuarioRFID.
 */
export async function asignarCredencial(
  uid: string,
  nombreUsuario: string,
): Promise<void> {
  await update(ref(db, `credenciales_rfid/${uid.toUpperCase()}`), {
    estado: 'asignada',
    asignada_a: nombreUsuario,
  });
}

/**
 * Libera una credencial al eliminar un usuario RFID.
 * Llamar ANTES de deleteUsuarioRFID.
 * No falla si la credencial no existe en el inventario.
 */
export async function liberarCredencial(uid: string): Promise<void> {
  const snap = await get(ref(db, `credenciales_rfid/${uid.toUpperCase()}`));
  if (!snap.exists()) return; // no está en inventario → no hacer nada
  await update(ref(db, `credenciales_rfid/${uid.toUpperCase()}`), {
    estado: 'disponible',
    asignada_a: null,
  });
}

/**
 * Consulta one-time de una credencial específica.
 * Retorna null si no existe en el inventario.
 */
export async function getCredencial(uid: string): Promise<CredencialRFID | null> {
  const snap = await get(ref(db, `credenciales_rfid/${uid.toUpperCase()}`));
  if (!snap.exists()) return null;
  return { uid: uid.toUpperCase(), ...snap.val() } as CredencialRFID;
}
