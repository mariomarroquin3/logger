// ============================================================
// pages/ReceptionPage.tsx
// Pantalla pública de recepción corporativa.
// Ruta: / — NO requiere autenticación, NO usa AppLayout.
// Escucha el SerialContext para mostrar resultados de acceso.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Wifi, CheckCircle2, XCircle, AlertTriangle, Clock, LogIn, LogOut, Plug } from 'lucide-react';
import { useSerial } from '../context/SerialContext';
import type { SerialMessage } from '../types';

type ScreenState = 'idle' | 'granted' | 'denied' | 'warning';

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function ReceptionPage() {
  const navigate = useNavigate();
  const { status: serialStatus, lastMessage, connect, disconnect, send, isSupported } = useSerial();
  const now = useClock();

  const [screen, setScreen] = useState<ScreenState>('idle');
  const [displayMsg, setDisplayMsg] = useState<SerialMessage | null>(null);
  const [modoAcceso, setModoAcceso] = useState<'entrada' | 'salida'>('entrada');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reaccionar a mensajes del ESP32
  useEffect(() => {
    if (!lastMessage) return;
    // Ignorar mensajes de registro de credenciales en la pantalla de recepción
    if (lastMessage.type === 'uid_register') return;

    const stateMap: Record<SerialMessage['type'], ScreenState> = {
      granted:      'granted',
      denied:       'denied',
      warning:      'warning',
      uid_register: 'idle',
    };

    setScreen(stateMap[lastMessage.type]);
    setDisplayMsg(lastMessage);

    // Auto-reset después de 3 segundos
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setScreen('idle');
      setDisplayMsg(null);
    }, 3000);
  }, [lastMessage]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const enviarComandoConLog = (cmd: string) => {
    console.log(`[ReceptionPage] Comando enviado: ${cmd}`);
    send(cmd);
  };

  // Handler para cambiar de modo e indicárselo al ESP32
  const cambiarModoEspecial = (modo: 'entrada' | 'salida') => {
    setModoAcceso(modo);
    if (serialStatus === 'connected') {
      enviarComandoConLog('3');
    }
  };

  // Formato de fecha/hora
  const timeStr = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;

  // Colores y contenido según estado
  const config = {
    idle: {
      bg: 'from-[#050709] via-[#0a0c14] to-[#070a10]',
      overlay: '',
      icon: null,
      headline: null,
      sub: null,
    },
    granted: {
      bg: 'from-[#050709] via-[#0a0c14] to-[#070a10]',
      overlay: 'bg-emerald-500/10',
      icon: <CheckCircle2 className="h-24 w-24 text-emerald-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.7)]" />,
      headline: '✓ ACCESO AUTORIZADO',
      headlineColor: 'text-emerald-400',
      sub: displayMsg?.payload,
      subColor: 'text-emerald-300',
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_120px_rgba(16,185,129,0.25)]',
    },
    denied: {
      bg: 'from-[#050709] via-[#0a0c14] to-[#070a10]',
      overlay: 'bg-rose-500/10',
      icon: <XCircle className="h-24 w-24 text-rose-400 drop-shadow-[0_0_40px_rgba(239,68,68,0.7)]" />,
      headline: '✗ ACCESO DENEGADO',
      headlineColor: 'text-rose-400',
      sub: displayMsg?.payload,
      subColor: 'text-rose-300',
      border: 'border-rose-500/30',
      glow: 'shadow-[0_0_120px_rgba(239,68,68,0.25)]',
    },
    warning: {
      bg: 'from-[#050709] via-[#0a0c14] to-[#070a10]',
      overlay: 'bg-amber-500/10',
      icon: <AlertTriangle className="h-24 w-24 text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.7)]" />,
      headline: '⚠ ACCESO INCONSISTENTE',
      headlineColor: 'text-amber-400',
      sub: displayMsg?.payload,
      subColor: 'text-amber-300',
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_120px_rgba(245,158,11,0.25)]',
    },
  } as const;

  const cfg = config[screen];

  const serialBadge =
    serialStatus === 'connected'
      ? { color: 'bg-emerald-500', pulse: true,  label: 'Conectado' }
      : serialStatus === 'connecting'
      ? { color: 'bg-amber-500',   pulse: true,  label: 'Conectando...' }
      : serialStatus === 'error'
      ? { color: 'bg-rose-500',    pulse: false, label: 'Error' }
      : { color: 'bg-gray-600',    pulse: false, label: 'Desconectado' };

  return (
    <div
      className={`relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${cfg.bg} transition-all duration-700`}
    >
      {/* Patrón de fondo geométrico */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6,182,212,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Overlay de estado (colored wash) */}
      {cfg.overlay && (
        <div className={`pointer-events-none absolute inset-0 ${cfg.overlay} transition-all duration-500`} />
      )}

      {/* Header — Logo + Estado serial */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-cyan/15 border border-accent-cyan/30">
            <ShieldCheck className="h-5 w-5 text-accent-cyan" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">RFID Control</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Sistema de Control de Acceso</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Controles de Modo (Entrada / Salida) */}
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
            <button
              onClick={() => cambiarModoEspecial('entrada')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                modoAcceso === 'entrada'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Entrada
            </button>
            <button
              onClick={() => cambiarModoEspecial('salida')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                modoAcceso === 'salida'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <LogOut className="h-3.5 w-3.5" />
              Salida
            </button>
          </div>

          {/* Botón interactivo del Estado Serial */}
          <button
            onClick={serialStatus === 'connected' ? disconnect : connect}
            disabled={!isSupported}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 active:scale-95 disabled:opacity-50"
          >
            <span className="relative flex h-2 w-2">
              {serialBadge.pulse && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${serialBadge.color} opacity-75`} />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${serialBadge.color}`} />
            </span>
            <span className="text-xs text-gray-300 font-medium">{serialBadge.label}</span>
            {serialStatus === 'connected' ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Plug className="h-3.5 w-3.5 text-gray-400 hover:text-white" />
            )}
          </button>

          {/* Acceso admin */}
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-gray-500 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 px-3 py-1.5 rounded-full backdrop-blur-sm"
          >
            Admin
          </button>
        </div>
      </div>

      {/* Reloj y fecha */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-10">
        <div className="flex items-center gap-2 justify-center text-gray-600 text-xs font-medium">
          <Clock className="h-3 w-3" />
          <span>{dateStr}</span>
        </div>
        <p className="mt-1 text-2xl font-mono font-bold text-gray-400 tabular-nums tracking-wider">
          {timeStr}
        </p>
      </div>

      {/* ─── Contenido principal ─── */}
      {screen === 'idle' ? (
        /* Estado reposo */
        <div className="flex flex-col items-center gap-8">
          {/* Icono animado */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-accent-cyan/10 blur-3xl scale-150" />
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-2 border-accent-cyan/20 bg-surface-card/60 backdrop-blur-sm">
              <ShieldCheck className="h-20 w-20 text-accent-cyan/80 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]" />
              {/* Anillo pulsante */}
              <span className="absolute inset-0 rounded-full border-2 border-accent-cyan/30 animate-ping" />
            </div>
          </div>

          {/* Mensaje */}
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-[0.15em] text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              ACERQUE SU CREDENCIAL
            </h1>
            <p className="mt-3 text-base text-gray-600 font-medium tracking-widest uppercase">
              Modo Actual: {modoAcceso === 'entrada' ? 'Entrada' : 'Salida'} — Listo
            </p>
          </div>
        </div>
      ) : (
        /* Estado resultado */
        <div
          className={`flex flex-col items-center gap-8 rounded-3xl border ${(cfg as { border?: string }).border ?? 'border-white/10'} bg-black/40 px-20 py-14 backdrop-blur-md ${(cfg as { glow?: string }).glow ?? ''} transition-all duration-500`}
          style={{ animation: 'fadeInScale 0.4s ease-out' }}
        >
          {/* Icono */}
          <div className="animate-[bounceIn_0.5s_ease-out]">
            {(cfg as { icon?: React.ReactNode }).icon}
          </div>

          {/* Headline */}
          <div className="text-center">
            <h1 className={`text-4xl font-black tracking-wider ${(cfg as { headlineColor?: string }).headlineColor ?? 'text-white'}`}>
              {(cfg as { headline?: string | null }).headline}
            </h1>
            {(cfg as { sub?: string | null }).sub && (
              <p className={`mt-3 text-2xl font-semibold ${(cfg as { subColor?: string }).subColor ?? 'text-gray-300'}`}>
                {(cfg as { sub?: string | null }).sub}
              </p>
            )}
          </div>

          {/* Hora del evento */}
          <p className="text-sm text-gray-500 font-mono">
            {displayMsg?.timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <p className="text-[10px] text-gray-700 tracking-widest uppercase">
          Sistema de Control de Acceso · ESP32 + RFID RC522
        </p>
      </div>
    </div>
  );
}
