// ============================================================
// firebase/queries.ts
// Queries optimizadas con limitToLast() y orderByChild()
// para evitar descargar datasets enormes de Firebase
// ============================================================
import { ref, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from './config';

/** Últimos 200 eventos ordenados por timestamp (más reciente al final) */
export const eventosQuery = query(
  ref(db, 'eventos_acceso'),
  orderByChild('timestamp'),
  limitToLast(200),
);

/** Todos los usuarios autorizados */
export const usuariosRef = ref(db, 'usuarios_autorizados');

/** Estado de la maqueta (puerta, alarma) */
export const estadoRef = ref(db, 'estado_maqueta');

/** Indicador de conexión de Firebase */
export const connectedRef = ref(db, '.info/connected');
