// ============================================================
// context/SerialContext.tsx
// Singleton global de Web Serial API.
// Envuelve AuthProvider en App.tsx para que tanto la pantalla
// pública (/) como la estación admin (/dashboard/admin/estacion-rfid)
// compartan la misma conexión sin duplicarla.
//
// Protocolo texto plano (ESP32 → React):
//   ACCESS_GRANTED|Nombre
//   ACCESS_DENIED|Motivo
//   ACCESS_WARNING|Motivo
//   UID_REGISTER|XXXXXXXX
//
// Protocolo texto plano (React → ESP32):
//   REGISTRO\n   ← activa modo registro en el ESP32
//   CANCELAR\n   ← cancela modo registro
// ============================================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'react-hot-toast';
import type { SerialContextValue, SerialMessage, SerialStatus } from '../types';

// Declare Web Serial API global types for TypeScript
declare global {
  interface SerialPort {
    readable: ReadableStream<any> | null;
    writable: WritableStream<any> | null;
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
  }
  interface Navigator {
    serial: {
      requestPort(): Promise<SerialPort>;
      addEventListener(type: string, listener: (event: any) => void): void;
      removeEventListener(type: string, listener: (event: any) => void): void;
    };
  }
}

const SerialContext = createContext<SerialContextValue | null>(null);

// ─── Parseo del protocolo ────────────────────────────────────

function parseSerialLine(line: string): SerialMessage | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 1. Soporte para mensajes de protocolo estructurados tipo TIPO|PAYLOAD
  const sep = trimmed.indexOf('|');
  if (sep !== -1) {
    const rawType = trimmed.substring(0, sep).toUpperCase();
    const payload = trimmed.substring(sep + 1);

    const typeMap: Record<string, SerialMessage['type']> = {
      ACCESS_GRANTED: 'granted',
      ACCESS_DENIED:  'denied',
      ACCESS_WARNING: 'warning',
      UID_REGISTER:   'uid_register',
    };

    const type = typeMap[rawType];
    if (type) {
      return { type, payload, timestamp: new Date() };
    }
  }

  // 2. Soporte para parsear mensajes informativos libres del firmware ESP32
  // ej: "[CONCEDIDO] Acceso validado para: Juan Perez"
  if (trimmed.includes('[CONCEDIDO]')) {
    const payload = trimmed.split('[CONCEDIDO]')[1]?.replace('Acceso validado para:', '').trim() || 'Acceso concedido';
    return { type: 'granted', payload, timestamp: new Date() };
  }
  if (trimmed.includes('[DENEGADO]')) {
    const payload = trimmed.split('[DENEGADO]')[1]?.trim() || 'Acceso denegado';
    return { type: 'denied', payload, timestamp: new Date() };
  }
  if (trimmed.includes('[ERROR]') && (trimmed.includes('adentro') || trimmed.includes('registro'))) {
    const payload = trimmed.split('[ERROR]')[1]?.trim() || 'Inconsistencia de acceso';
    return { type: 'warning', payload, timestamp: new Date() };
  }

  return null;
}

// ─── Provider ────────────────────────────────────────────────

export function SerialProvider({ children }: { children: ReactNode }) {
  const [status, setStatus]           = useState<SerialStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<SerialMessage | null>(null);

  // Refs para el puerto y el lector — necesitamos refs para evitar
  // re-renders en el loop de lectura asíncrona
  const portRef    = useRef<SerialPort | null>(null);
  const readerRef  = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const writerRef  = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const keepReadingRef = useRef<boolean>(true);

  // ─── Bucle de lectura ──────────────────────────────────────
  const startReadLoop = useCallback(async (port: SerialPort) => {
    if (!port.readable) {
      console.warn('[SerialContext] El puerto no tiene stream de lectura disponible.');
      return;
    }

    console.log('[SerialContext] Iniciando bucle de lectura serial...');
    const decoder   = new TextDecoderStream();
    const pipeDone  = port.readable.pipeTo(decoder.writable);
    const reader    = decoder.readable.getReader();
    readerRef.current = reader;
    keepReadingRef.current = true;

    let buffer = '';
    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('[SerialContext] Stream de lectura finalizado (done = true).');
          break;
        }

        if (value) {
          console.log(`[SerialContext] Datos crudos recibidos: ${JSON.stringify(value)}`);
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // último fragmento incompleto

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              console.log(`[SerialContext] Línea completa recibida: "${trimmedLine}"`);
              const msg = parseSerialLine(trimmedLine);
              if (msg) {
                console.log('[SerialContext] Mensaje del protocolo parseado con éxito:', msg);
                console.log(`[SerialContext] Evento recibido: tipo=${msg.type} payload="${msg.payload}"`);
                setLastMessage(msg);
              } else {
                console.log(`[SerialContext] Línea omitida o no coincide con protocolo: "${trimmedLine}"`);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[SerialContext] Error en bucle de lectura serial:', err);
    } finally {
      console.log('[SerialContext] Liberando lock del reader y cerrando streams de lectura.');
      reader.releaseLock();
      await pipeDone.catch((e: any) => console.warn('[SerialContext] Error al esperar pipeTo finalizado:', e));
    }
  }, []);

  // ─── disconnect() ─────────────────────────────────────────
  const disconnect = useCallback(async () => {
    console.log('[SerialContext] Iniciando proceso de desconexión...');
    keepReadingRef.current = false;
    
    try {
      if (readerRef.current) {
        console.log('[SerialContext] Cancelando reader...');
        await readerRef.current.cancel().catch(() => {});
      }
      if (writerRef.current) {
        console.log('[SerialContext] Cerrando writer...');
        await writerRef.current.close().catch(() => {});
      }
      if (portRef.current) {
        console.log('[SerialContext] Cerrando puerto serial...');
        await portRef.current.close().catch(() => {});
      }
    } catch (err) {
      console.error('[SerialContext] Error al desconectar el puerto serial:', err);
    } finally {
      readerRef.current = null;
      writerRef.current = null;
      portRef.current   = null;
      setStatus('disconnected');
      console.log('[SerialContext] Estado establecido a desconectado.');
    }
  }, []);

  // ─── connect() ────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!('serial' in navigator)) {
      console.error('[SerialContext] Web Serial API no está soportada en este navegador.');
      return;
    }
    if (status === 'connected' || status === 'connecting') {
      console.log(`[SerialContext] Solicitud de conexión omitida. Estado actual: ${status}`);
      return;
    }

    console.log('[SerialContext] Solicitando puerto serie al usuario...');
    setStatus('connecting');
    try {
      const port = await navigator.serial.requestPort();
      console.log('[SerialContext] Puerto seleccionado por el usuario. Abriendo puerto a 115200 baudios...');
      await port.open({ baudRate: 115200 });
      console.log('[SerialContext] Puerto abierto exitosamente.');

      portRef.current = port;

      // Writer para enviar comandos
      if (port.writable) {
        console.log('[SerialContext] Stream de escritura disponible. Configurando TextEncoderStream...');
        const encoder = new TextEncoderStream();
        encoder.readable.pipeTo(port.writable);
        writerRef.current = encoder.writable.getWriter();
      } else {
        console.warn('[SerialContext] El puerto no tiene stream de escritura disponible.');
      }

      setStatus('connected');
      console.log('[SerialContext] Conexión establecida. Iniciando loop de lectura...');
      startReadLoop(port);
    } catch (err) {
      console.error('[SerialContext] Error al conectar al dispositivo serial:', err);
      const e = err as DOMException;
      if (e?.name !== 'NotFoundError') {
        setStatus('error');
      } else {
        setStatus('disconnected');
      }
    }
  }, [status, startReadLoop]);

  // Escuchar eventos nativos de desconexión física de hardware
  useEffect(() => {
    if (!('serial' in navigator)) return;

    const handleDisconnect = (event: Event) => {
      const port = (event as any).port as SerialPort;
      console.log('[SerialContext] Evento nativo de desconexión detectado en puerto:', port);
      if (portRef.current === port) {
        toast.error('Lector ESP32 desconectado físicamente');
        disconnect();
      }
    };

    const handleConnect = (event: Event) => {
      console.log('[SerialContext] Nuevo dispositivo serie conectado al sistema:', (event as any).port);
      toast.success('Dispositivo serial conectado. Pulsa "Conectar ESP32" para activarlo.');
    };

    navigator.serial.addEventListener('disconnect', handleDisconnect);
    navigator.serial.addEventListener('connect', handleConnect);

    return () => {
      navigator.serial.removeEventListener('disconnect', handleDisconnect);
      navigator.serial.removeEventListener('connect', handleConnect);
    };
  }, [disconnect]);

  // ─── send() ───────────────────────────────────────────────
  const send = useCallback((cmd: string) => {
    if (!writerRef.current || status !== 'connected') {
      console.warn(`[SerialContext] Intento de envío omitido. Comando: "${cmd}". Writer: ${!!writerRef.current}, Status: ${status}`);
      return;
    }
    const payload = cmd.endsWith('\n') ? cmd : cmd + '\n';
    console.log(`[SerialContext] Enviando comando serial al ESP32: ${JSON.stringify(payload)}`);
    writerRef.current.write(payload).catch((err) => {
      console.error('[SerialContext] Error al escribir comando serial:', err);
    });
  }, [status]);

  const isSupported = 'serial' in navigator;

  return (
    <SerialContext.Provider value={{ status, lastMessage, connect, disconnect, send, isSupported }}>
      {children}
    </SerialContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useSerial(): SerialContextValue {
  const ctx = useContext(SerialContext);
  if (!ctx) {
    throw new Error('useSerial debe usarse dentro de un SerialProvider');
  }
  return ctx;
}
