// ============================================================
// services/dataTransformer.ts
// Raw Firebase snapshots → typed models → derived analytics
// Los componentes NO hacen .filter() directamente;
// consumen funciones puras de aquí.
// ============================================================
import type { DataSnapshot } from 'firebase/database';
import { isToday, getHours, format } from 'date-fns';
import type {
  Usuario,
  EventoAcceso,
  EstadoMaqueta,
  HourlyData,
  TopUser,
  EntradaSalidaData,
} from '../types';

// ─── Raw snapshot → typed models ─────────────────────────────

/** Convierte el snapshot de usuarios_autorizados en un array tipado */
export function parseUsuarios(snapshot: DataSnapshot): Usuario[] {
  if (!snapshot.exists()) return [];
  const raw = snapshot.val() as Record<string, Omit<Usuario, 'uid'>>;
  return Object.entries(raw).map(([uid, data]) => ({
    uid,
    nombre: data.nombre ?? 'Sin nombre',
    activo: data.activo ?? false,
    dentro: data.dentro ?? false,
  }));
}

/** Convierte el snapshot de eventos_acceso en un array tipado,
 *  ordenado descendente (más reciente primero) */
export function parseEventos(snapshot: DataSnapshot): EventoAcceso[] {
  if (!snapshot.exists()) return [];
  const raw = snapshot.val() as Record<string, Omit<EventoAcceso, 'id'>>;
  const eventos = Object.entries(raw).map(([id, data]) => ({
    id,
    uid:       data.uid ?? '',
    nombre:    data.nombre ?? 'Desconocido',
    tipo:      data.tipo ?? 'entrada',
    resultado: data.resultado ?? 'inconsistente',
    timestamp: data.timestamp ?? new Date().toISOString(),
  })) as EventoAcceso[];

  // Descendente: más reciente primero
  return eventos.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/** Convierte el snapshot de estado_maqueta */
export function parseEstado(snapshot: DataSnapshot): EstadoMaqueta | null {
  if (!snapshot.exists()) return null;
  return snapshot.val() as EstadoMaqueta;
}

// ─── typed models → derived analytics ────────────────────────

/** Usuarios con dentro === true */
export function getUsuariosDentro(usuarios: Usuario[]): Usuario[] {
  return usuarios.filter((u) => u.dentro);
}

/** Eventos de entrada ocurridos hoy */
export function getEntradasHoy(eventos: EventoAcceso[]): number {
  return eventos.filter(
    (e) => e.tipo === 'entrada' && isToday(new Date(e.timestamp)),
  ).length;
}

/** Eventos de salida ocurridos hoy */
export function getSalidasHoy(eventos: EventoAcceso[]): number {
  return eventos.filter(
    (e) => e.tipo === 'salida' && isToday(new Date(e.timestamp)),
  ).length;
}

/** Top N usuarios por cantidad de eventos */
export function getTopUsuarios(
  eventos: EventoAcceso[],
  limit = 8,
): TopUser[] {
  const map = new Map<string, TopUser>();

  for (const e of eventos) {
    const existing = map.get(e.uid);
    if (existing) {
      existing.total += 1;
    } else {
      map.set(e.uid, { uid: e.uid, nombre: e.nombre, total: 1 });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/** Accesos agrupados por hora del día (24h) */
export function getAccesosPorHora(eventos: EventoAcceso[]): HourlyData[] {
  // Inicializar 24 horas
  const hours = Array.from({ length: 24 }, (_, h) => ({
    hora: `${String(h).padStart(2, '0')}:00`,
    accesos: 0,
  }));

  // Solo eventos de hoy
  for (const e of eventos) {
    if (isToday(new Date(e.timestamp))) {
      const h = getHours(new Date(e.timestamp));
      hours[h].accesos += 1;
    }
  }

  return hours;
}

/** Totales de entradas vs salidas (todos los eventos) */
export function getEntradaSalida(eventos: EventoAcceso[]): EntradaSalidaData {
  return {
    entradas: eventos.filter((e) => e.tipo === 'entrada').length,
    salidas:  eventos.filter((e) => e.tipo === 'salida').length,
  };
}

/** Formatea un timestamp ISO para la tabla */
export function formatTimestamp(iso: string): string {
  try {
    return format(new Date(iso), 'HH:mm:ss');
  } catch {
    return iso;
  }
}
