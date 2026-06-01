// ============================================================
// types/index.ts
// Interfaces TypeScript para el sistema RFID
// ============================================================

/** Key del nodo de usuario en Firebase (ej: "A1B2C3D4") */
export type FirebaseUID = string;

/** Key autogenerada por Firebase push() (ej: "-Nx001") */
export type FirebaseKey = string;

// ─── Modelos de datos ────────────────────────────────────────

/**
 * Usuario RFID básico — estructura original usada por la ESP32.
 * NO modificar estos campos. Compatible backward 100%.
 */
export interface Usuario {
  uid: FirebaseUID;   // key del nodo en Firebase
  nombre: string;
  activo: boolean;
  dentro: boolean;
}

/**
 * Estado de ciclo de vida de la credencial RFID.
 * Valores progresivos de fabricación a uso activo.
 */
export type RfidStatus =
  | 'pendiente'      // usuario creado, aún sin procesar
  | 'sin_asignar'   // creado sin UID físico
  | 'impreso'        // credencial física impresa
  | 'programado'     // tarjeta escrita/programada
  | 'activo'         // operacional
  | 'deshabilitado'; // revocada

/**
 * Usuario RFID extendido — todos los campos nuevos son opcionales
 * para mantener compatibilidad backward con la ESP32.
 * Extiende Usuario (nombre, activo, dentro SIEMPRE presentes).
 */
export interface UsuarioRFID extends Usuario {
  // Campos opcionales extendidos (aditivos, no rompen ESP32)
  cargo?: string;
  departamento?: string;
  email?: string;
  fecha_creacion?: string;   // ISO 8601
  creado_por?: string;       // uid del admin que lo creó
  rfid_status?: RfidStatus;
  ultima_entrada?: string | null;  // ISO 8601
  ultima_salida?: string | null;   // ISO 8601
  notas?: string;
}

export interface EventoAcceso {
  id: FirebaseKey;    // key autogenerada por Firebase
  uid: FirebaseUID;
  nombre: string;
  tipo: 'entrada' | 'salida';
  resultado: 'permitido' | 'denegado' | 'inconsistente';
  timestamp: string;  // ISO 8601
}

export interface EstadoMaqueta {
  puerta_abierta: boolean;
  alarma_activa: boolean;
}

// ─── Auditoría ────────────────────────────────────────────────

export interface AuditLog {
  id?: FirebaseKey;
  actor_uid: string;
  actor_nombre: string;
  accion:
    | 'crear_usuario'
    | 'editar_usuario'
    | 'eliminar_usuario'
    | 'activar_usuario'
    | 'desactivar_usuario'
    | 'cambio_rfid_status'
    | 'reasignar_rfid';
  objetivo_uid: string;
  descripcion: string;
  timestamp: string;  // ISO 8601
}

// ─── Alertas Operacionales ────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  titulo: string;
  descripcion: string;
  usuario_uid?: string;
  usuario_nombre?: string;
}

// ─── Tipos de analytics (derived state) ──────────────────────

export interface HourlyData {
  hora: string;    // ej: "08:00"
  accesos: number;
}

export interface TopUser {
  uid: FirebaseUID;
  nombre: string;
  total: number;
}

export interface EntradaSalidaData {
  entradas: number;
  salidas: number;
}

// ─── Estado del context ───────────────────────────────────────

export interface LoadingState {
  usuarios: boolean;
  eventos: boolean;
  estado: boolean;
}

export interface ErrorState {
  usuarios: string | null;
  eventos: string | null;
  estado: string | null;
}

export interface DashboardContextValue {
  // Raw data
  usuarios: Usuario[];
  eventos: EventoAcceso[];
  estado: EstadoMaqueta | null;
  conectado: boolean;

  // UI state
  loading: LoadingState;
  error: ErrorState;

  // Derived state (calculado con useMemo en el provider)
  usuariosDentro: Usuario[];
  entradasHoy: number;
  salidasHoy: number;
  accesosPorHora: HourlyData[];
  topUsuarios: TopUser[];
  entradaSalida: EntradaSalidaData;

  // Demo mode
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
}

// ─── Auth ─────────────────────────────────────────────────────

export type Role = 'admin' | 'viewer';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: Role;
  activo: boolean;
  mfaVerified: boolean;
}

/** Datos del nodo usuarios_dashboard/{uid} en Firebase */
export interface DashboardUser {
  activo: boolean;
  email: string;
  nombre: string;
  rol: Role;
}
