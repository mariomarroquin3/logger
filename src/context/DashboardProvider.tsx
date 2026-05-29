// ============================================================
// context/DashboardProvider.tsx
// Provider central: abre 4 listeners de Firebase y expone
// raw data + derived state a todas las páginas.
// Un solo listener por recurso = sin duplicados.
// Soporta "Modo Demo" con simulación en tiempo real local.
// ============================================================
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { onValue } from 'firebase/database';
import toast from 'react-hot-toast';

import { isFirebaseConfigured } from '../firebase/config';
import { FirebaseConfigMissing } from '../components/ui/FirebaseConfigMissing';

import {
  eventosQuery,
  usuariosRef,
  estadoRef,
  connectedRef,
} from '../firebase/queries';

import {
  parseUsuarios,
  parseEventos,
  parseEstado,
  getUsuariosDentro,
  getEntradasHoy,
  getSalidasHoy,
  getTopUsuarios,
  getAccesosPorHora,
  getEntradaSalida,
} from '../services/dataTransformer';

import type {
  DashboardContextValue,
  Usuario,
  EventoAcceso,
  EstadoMaqueta,
  LoadingState,
  ErrorState,
} from '../types';

// ─── Contexto ────────────────────────────────────────────────

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function DashboardProvider({ children }: { children: ReactNode }) {
  // Demo mode state (persisted in localStorage)
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem('rfid_demo_mode') === 'true';
  });

  // Raw data
  const [usuarios, setUsuarios]   = useState<Usuario[]>([]);
  const [eventos,  setEventos]    = useState<EventoAcceso[]>([]);
  const [estado,   setEstado]     = useState<EstadoMaqueta | null>(null);
  const [conectado, setConectado] = useState(false);

  // UI state
  const [loading, setLoading] = useState<LoadingState>({
    usuarios: true,
    eventos:  true,
    estado:   true,
  });
  const [error, setError] = useState<ErrorState>({
    usuarios: null,
    eventos:  null,
    estado:   null,
  });

  // Referencia al ID del último evento para detectar nuevos
  const lastEventIdRef = useRef<string | null>(null);

  // ─── Persistir modo demo ─────────────────────────────────
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('rfid_demo_mode', 'true');
    } else {
      localStorage.removeItem('rfid_demo_mode');
    }
  }, [isDemoMode]);

  // ─── Listener: .info/connected (Solo Firebase) ───────────
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onValue(connectedRef, (snap) => {
      setConectado(snap.val() === true);
    });
    return () => unsub();
  }, []);

  // ─── Listener: estado_maqueta (Solo Firebase) ────────────
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onValue(
      estadoRef,
      (snap) => {
        setEstado(parseEstado(snap));
        setLoading((prev) => ({ ...prev, estado: false }));
        setError((prev) => ({ ...prev, estado: null }));
      },
      (err) => {
        setError((prev) => ({ ...prev, estado: err.message }));
        setLoading((prev) => ({ ...prev, estado: false }));
      },
    );
    return () => unsub();
  }, []);

  // ─── Listener: usuarios_autorizados (Solo Firebase) ──────
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onValue(
      usuariosRef,
      (snap) => {
        setUsuarios(parseUsuarios(snap));
        setLoading((prev) => ({ ...prev, usuarios: false }));
        setError((prev) => ({ ...prev, usuarios: null }));
      },
      (err) => {
        setError((prev) => ({ ...prev, usuarios: err.message }));
        setLoading((prev) => ({ ...prev, usuarios: false }));
      },
    );
    return () => unsub();
  }, []);

  // ─── Listener: eventos_acceso (Solo Firebase) ────────────
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onValue(
      eventosQuery,
      (snap) => {
        const parsed = parseEventos(snap);
        setEventos(parsed);
        setLoading((prev) => ({ ...prev, eventos: false }));
        setError((prev) => ({ ...prev, eventos: null }));

        // Detectar nuevo evento y mostrar toast
        if (parsed.length > 0) {
          const newest = parsed[0]; // descendente, [0] es el más reciente
          if (
            lastEventIdRef.current !== null &&
            newest.id !== lastEventIdRef.current
          ) {
            const emoji = newest.tipo === 'entrada' ? '🟢' : '🔵';
            const label = newest.tipo === 'entrada' ? 'entró' : 'salió';
            toast(`${emoji} ${newest.nombre} ${label}`, {
              duration: 3500,
              style: {
                background: '#1a1d27',
                color: '#fff',
                border: '1px solid #252836',
                borderRadius: '10px',
                fontSize: '14px',
              },
            });
          }
          lastEventIdRef.current = newest.id;
        }
      },
      (err) => {
        setError((prev) => ({ ...prev, eventos: err.message }));
        setLoading((prev) => ({ ...prev, eventos: false }));
      },
    );
    return () => unsub();
  }, []);

  // ─── Simulador Modo Demo (Solo si no está configurado Firebase) ──
  useEffect(() => {
    if (isFirebaseConfigured || !isDemoMode) return;

    // Inicializar datos mock
    const mockUsers: Usuario[] = [
      { uid: '4A-2C-8F-1B', nombre: 'Juan Pérez', dentro: false, activo: true },
      { uid: '9B-3D-7E-2A', nombre: 'María Gómez', dentro: true, activo: true },
      { uid: '1F-5A-9C-4E', nombre: 'Carlos Ruiz', dentro: false, activo: true },
      { uid: '8C-6B-2D-9F', nombre: 'Ana López', dentro: true, activo: true },
      { uid: '3E-7D-1C-5B', nombre: 'Pedro Silva', dentro: false, activo: true },
    ];

    setUsuarios(mockUsers);

    // Generar eventos históricos iniciales
    const initialEvents: EventoAcceso[] = [];
    const baseTime = Date.now();
    for (let i = 15; i > 0; i--) {
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const timestamp = new Date(baseTime - i * 45 * 60 * 1000 - Math.random() * 20 * 60 * 1000).toISOString();
      const tipo = i % 2 === 0 ? 'entrada' : 'salida';
      initialEvents.push({
        id: `mock-${i}-${timestamp}`,
        uid: user.uid,
        nombre: user.nombre,
        tipo,
        resultado: 'permitido',
        timestamp,
      });
    }
    setEventos(initialEvents);

    setEstado({
      puerta_abierta: false,
      alarma_activa: false,
    });
    setConectado(true);
    setLoading({ usuarios: false, eventos: false, estado: false });
    setError({ usuarios: null, eventos: null, estado: null });

    // Simulador de eventos periódicos
    const interval = setInterval(() => {
      const roll = Math.random();

      if (roll < 0.15) {
        // 15% Alarma activada
        setEstado(prev => prev ? { ...prev, alarma_activa: true } : { puerta_abierta: false, alarma_activa: true });
        toast.error('🚨 Alarma activada: Intento de violación de sensor / Acceso denegado', {
          duration: 4000,
          style: {
            background: '#ef4444',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
          }
        });

        setTimeout(() => {
          setEstado(prev => prev ? { ...prev, alarma_activa: false } : { puerta_abierta: false, alarma_activa: false });
        }, 5000);

      } else if (roll < 0.30) {
        // 15% Acceso denegado (tarjeta desconocida)
        const fakeUid = Math.random().toString(16).substring(2, 10).toUpperCase().match(/.{2}/g)?.join('-') || 'XX-XX-XX-XX';
        
        toast.error(`❌ Acceso Denegado (UID: ${fakeUid})`, {
          duration: 3500,
          style: {
            background: '#1a1d27',
            color: '#ef4444',
            border: '1px solid #ef4444/20',
            borderRadius: '10px',
            fontSize: '14px',
          }
        });

        const newEvent: EventoAcceso = {
          id: `mock-fail-${Date.now()}`,
          uid: fakeUid,
          nombre: 'Tarjeta Desconocida',
          tipo: 'entrada',
          resultado: 'denegado',
          timestamp: new Date().toISOString(),
        };
        setEventos(prev => [newEvent, ...prev.slice(0, 199)]);

      } else {
        // 70% Acceso autorizado
        const randomIdx = Math.floor(Math.random() * mockUsers.length);
        const user = mockUsers[randomIdx];

        // Determinar tipo de acceso
        const tipo = Math.random() > 0.5 ? 'entrada' : 'salida';

        // Actualizar puerta
        setEstado(prev => prev ? { ...prev, puerta_abierta: true } : { puerta_abierta: true, alarma_activa: false });

        const emoji = tipo === 'entrada' ? '🟢' : '🔵';
        const actionText = tipo === 'entrada' ? 'acaba de entrar' : 'acaba de salir';

        toast(`${emoji} ${user.nombre} ${actionText}`, {
          duration: 3500,
          style: {
            background: '#1a1d27',
            color: '#fff',
            border: '1px solid #252836',
            borderRadius: '10px',
            fontSize: '14px',
          },
        });

        const newEvent: EventoAcceso = {
          id: `mock-event-${Date.now()}`,
          uid: user.uid,
          nombre: user.nombre,
          tipo,
          resultado: 'permitido',
          timestamp: new Date().toISOString(),
        };

        setEventos(prev => [newEvent, ...prev.slice(0, 199)]);

        // Actualizar si está dentro en la lista mock
        setUsuarios(prev => prev.map((u, idx) => {
          if (idx === randomIdx) {
            return { ...u, dentro: tipo === 'entrada' };
          }
          return u;
        }));

        setTimeout(() => {
          setEstado(prev => prev ? { ...prev, puerta_abierta: false } : { puerta_abierta: false, alarma_activa: false });
        }, 3000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isDemoMode]);

  // ─── Derived state con useMemo ───────────────────────────
  const usuariosDentro  = useMemo(() => getUsuariosDentro(usuarios),  [usuarios]);
  const entradasHoy     = useMemo(() => getEntradasHoy(eventos),      [eventos]);
  const salidasHoy      = useMemo(() => getSalidasHoy(eventos),       [eventos]);
  const accesosPorHora  = useMemo(() => getAccesosPorHora(eventos),   [eventos]);
  const topUsuarios     = useMemo(() => getTopUsuarios(eventos),      [eventos]);
  const entradaSalida   = useMemo(() => getEntradaSalida(eventos),    [eventos]);

  // Si Firebase no está configurado y el usuario no ha habilitado el modo demo,
  // mostramos la pantalla de configuración obligatoria
  if (!isFirebaseConfigured && !isDemoMode) {
    return <FirebaseConfigMissing onEnableDemo={() => setIsDemoMode(true)} />;
  }

  const value: DashboardContextValue = {
    usuarios,
    eventos,
    estado,
    conectado,
    loading,
    error,
    usuariosDentro,
    entradasHoy,
    salidasHoy,
    accesosPorHora,
    topUsuarios,
    entradaSalida,
    isDemoMode,
    setIsDemoMode,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// ─── Hook consumidor ─────────────────────────────────────────

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard debe usarse dentro de <DashboardProvider>');
  }
  return ctx;
}
