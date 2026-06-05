// ============================================================
// pages/admin/EstacionRfidPage.tsx
// Estación de registro de credenciales RFID vía Web Serial.
// El lector físico es OPCIONAL: sin conexión se muestra el
// inventario en modo solo-lectura.
// Flujo de registro:
//   1. Admin pulsa "Registrar Credencial"
//   2. React envía "REGISTRO\n" al ESP32
//   3. ESP32 activa modo registro, lee chip, emite "UID_REGISTER|XXXX"
//   4. React verifica Firebase → crea credencial o avisa duplicado
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { Radio, Plug, PlugZap, CreditCard, CheckCircle2, AlertTriangle, Clock, User, Loader2, Search, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSerial } from '../../context/SerialContext';
import { useCredenciales } from '../../hooks/useCredenciales';
import { registrarCredencial, getCredencial } from '../../services/credencialesService';

type RegistroState = 'idle' | 'waiting' | 'success' | 'duplicate' | 'error';

export function EstacionRfidPage() {
  const { status, connect, disconnect, send, lastMessage, isSupported } = useSerial();
  const { credenciales, loading, error, total, totalDisponibles, totalAsignadas } = useCredenciales();

  const [registroState, setRegistroState] = useState<RegistroState>('idle');
  const [lastRegistered, setLastRegistered] = useState<string | null>(null);
  const [registroMsg, setRegistroMsg]       = useState<string>('');
  const [search, setSearch]                 = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Escuchar mensajes del ESP32
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'uid_register') return;

    const uid = lastMessage.payload.trim().toUpperCase();

    // Resetear timer anterior
    if (timerRef.current) clearTimeout(timerRef.current);

    // Verificar si ya existe en el inventario
    (async () => {
      try {
        const existente = await getCredencial(uid);
        if (existente) {
          setRegistroState('duplicate');
          setRegistroMsg(`El UID ${uid} ya está en el inventario (${existente.estado}).`);
          setLastRegistered(uid);
        } else {
          await registrarCredencial(uid);
          setRegistroState('success');
          setLastRegistered(uid);
          setRegistroMsg(`Credencial ${uid} registrada exitosamente.`);
          toast.success(`✓ Credencial ${uid} registrada`);
        }
      } catch {
        setRegistroState('error');
        setRegistroMsg('Error al verificar o guardar en Firebase.');
      }

      // Reset al estado idle después de 5 segundos
      timerRef.current = setTimeout(() => {
        setRegistroState('idle');
        setRegistroMsg('');
      }, 5000);
    })();
  }, [lastMessage]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleRegistrar = () => {
    if (status !== 'connected') {
      toast.error('Conecta el ESP32 primero');
      return;
    }
    setRegistroState('waiting');
    setRegistroMsg('Acerca la tarjeta al lector RFID...');
    setLastRegistered(null);
    // Enviar comando al ESP32 — él entra al modo registro inmediatamente
    send('REGISTRO');
  };

  const handleCancelar = () => {
    send('CANCELAR');
    setRegistroState('idle');
    setRegistroMsg('');
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Filtrar credenciales
  const filteredCreds = credenciales.filter((c) => {
    const term = search.toUpperCase();
    return c.uid.includes(term) || (c.asignada_a?.toUpperCase() || '').includes(term);
  });

  // Badge de conexión
  const connConfig = {
    disconnected: { color: 'bg-gray-600', label: 'Desconectado', pulse: false },
    connecting:   { color: 'bg-amber-500', label: 'Conectando...', pulse: true  },
    connected:    { color: 'bg-emerald-500', label: 'Conectado', pulse: true    },
    error:        { color: 'bg-rose-500', label: 'Error', pulse: false          },
  } as const;
  const conn = connConfig[status];

  // Panel de registro — colores según estado
  const registroConfig = {
    idle:      { border: 'border-surface-border', bg: 'bg-surface-card',     icon: null,                                               text: '' },
    waiting:   { border: 'border-amber-500/30',   bg: 'bg-amber-500/5',      icon: <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />, text: 'text-amber-300' },
    success:   { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5',    icon: <CheckCircle2 className="h-10 w-10 text-emerald-400" />,        text: 'text-emerald-300' },
    duplicate: { border: 'border-amber-500/30',   bg: 'bg-amber-500/5',      icon: <AlertTriangle className="h-10 w-10 text-amber-400" />,         text: 'text-amber-300' },
    error:     { border: 'border-rose-500/30',    bg: 'bg-rose-500/5',       icon: <AlertCircle className="h-10 w-10 text-rose-400" />,            text: 'text-rose-300' },
  } as const;
  const rCfg = registroConfig[registroState];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Radio className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Estación RFID</h1>
          <p className="text-sm text-gray-500">Registra nuevas tarjetas físicas con el lector ESP32.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── Panel izquierdo: Conexión + Registro ─── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Conexión */}
          <div className="rounded-xl border border-surface-border bg-surface-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Lector ESP32</p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {conn.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${conn.color} opacity-75`} />}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${conn.color}`} />
                </span>
                <span className="text-xs font-medium text-gray-300">{conn.label}</span>
              </div>
            </div>

            {!isSupported && (
              <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2.5 text-xs text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Web Serial no está disponible en este navegador. Usa Chrome o Edge.</span>
              </div>
            )}

            {status === 'disconnected' || status === 'error' ? (
              <button
                onClick={connect}
                disabled={!isSupported}
                className="w-full btn-primary justify-center"
              >
                <Plug className="h-4 w-4" />
                Conectar ESP32
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="w-full btn justify-center border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
              >
                <PlugZap className="h-4 w-4" />
                Desconectar
              </button>
            )}

            {status !== 'connected' && (
              <p className="text-[10px] text-gray-600 text-center">
                Sin conexión: el inventario sigue disponible en modo lectura.
              </p>
            )}
          </div>

          {/* Panel de registro */}
          <div className={`rounded-xl border ${rCfg.border} ${rCfg.bg} p-5 space-y-4 transition-all duration-300`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Registrar Credencial
            </p>

            {/* Resultado visual */}
            {registroState !== 'idle' && (
              <div className="flex flex-col items-center gap-3 py-2">
                {rCfg.icon}
                {registroMsg && (
                  <p className={`text-sm font-medium text-center ${rCfg.text}`}>{registroMsg}</p>
                )}
                {lastRegistered && (
                  <span className="font-mono text-xs bg-black/30 border border-white/10 px-3 py-1 rounded text-gray-300">
                    {lastRegistered}
                  </span>
                )}
              </div>
            )}

            {registroState === 'waiting' ? (
              <button onClick={handleCancelar} className="w-full btn justify-center border border-surface-border text-gray-400 hover:text-white hover:bg-surface-muted">
                Cancelar
              </button>
            ) : (
              <button
                onClick={handleRegistrar}
                disabled={status !== 'connected'}
                className="w-full btn-primary justify-center disabled:opacity-40"
              >
                <CreditCard className="h-4 w-4" />
                Registrar Credencial
              </button>
            )}

            {status !== 'connected' && registroState === 'idle' && (
              <p className="text-[10px] text-gray-600 text-center">
                Conecta el lector para registrar tarjetas automáticamente.
              </p>
            )}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total', value: total,            color: 'text-white' },
              { label: 'Libres', value: totalDisponibles, color: 'text-emerald-400' },
              { label: 'En uso', value: totalAsignadas,   color: 'text-accent-cyan' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border border-surface-border bg-surface-card p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`mt-1 text-xl font-black ${color}`}>{loading ? '—' : value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Panel derecho: Tabla de credenciales ─── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por UID o usuario asignado..."
              className="input pl-9"
            />
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border-b border-red-500/20 px-6 py-4 text-sm text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <span className="text-sm text-gray-500">Cargando inventario...</span>
              </div>
            ) : filteredCreds.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2">
                <CreditCard className="h-8 w-8 text-gray-700" />
                <span className="text-sm text-gray-500 font-medium">Sin credenciales registradas</span>
                <p className="text-xs text-gray-600">
                  Conecta el ESP32 y pulsa "Registrar Credencial" para añadir chips.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#131622] text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-surface-border">
                    <tr>
                      <th className="px-5 py-4">UID</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4">Asignada a</th>
                      <th className="px-5 py-4">Registrada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50">
                    {filteredCreds.map((c) => (
                      <tr
                        key={c.uid}
                        className={`hover:bg-surface-muted/30 transition-colors ${c.uid === lastRegistered && registroState === 'success' ? 'animate-highlight' : ''}`}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs bg-surface/80 border border-surface-border/80 px-2 py-0.5 rounded text-gray-300">
                            {c.uid}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`badge ${c.estado === 'disponible' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-accent-cyan/10 text-accent-cyan'}`}>
                            {c.estado === 'disponible'
                              ? <><CheckCircle2 className="h-3 w-3" /> Disponible</>
                              : <><User className="h-3 w-3" /> Asignada</>
                            }
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400">
                          {c.asignada_a ?? <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(c.fecha_registro).toLocaleString('es')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
