// ============================================================
// types/index.ts
// Interfaces TypeScript para el sistema RFID
// ============================================================

/** Key del nodo de usuario en Firebase (ej: "A1B2C3D4") */
export type FirebaseUID = string;

/** Key autogenerada por Firebase push() (ej: "-Nx001") */
export type FirebaseKey = string;

// ─── Modelos de datos ────────────────────────────────────────

export interface Usuario {
  uid: FirebaseUID;   // key del nodo en Firebase
  nombre: string;
  activo: boolean;
  dentro: boolean;
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

// ─── Auth (preparado para el futuro) ─────────────────────────

export type Role = 'admin' | 'viewer';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
}
