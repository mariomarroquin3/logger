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
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SerialContextValue, SerialMessage, SerialStatus } from '../types';

const SerialContext = createContext<SerialContextValue | null>(null);

// ─── Parseo del protocolo ────────────────────────────────────

function parseSerialLine(line: string): SerialMessage | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const sep = trimmed.indexOf('|');
  if (sep === -1) return null;

  const rawType = trimmed.substring(0, sep).toUpperCase();
  const payload = trimmed.substring(sep + 1);

  const typeMap: Record<string, SerialMessage['type']> = {
    ACCESS_GRANTED: 'granted',
    ACCESS_DENIED:  'denied',
    ACCESS_WARNING: 'warning',
    UID_REGISTER:   'uid_register',
  };

  const type = typeMap[rawType];
  if (!type) return null;

  return { type, payload, timestamp: new Date() };
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

  // ─── Bucle de lectura ──────────────────────────────────────
  const startReadLoop = useCallback(async (port: SerialPort) => {
    if (!port.readable) return;

    const decoder   = new TextDecoderStream();
    const pipeDone  = port.readable.pipeTo(decoder.writable);
    const reader    = decoder.readable.getReader();
    readerRef.current = reader;

    let buffer = '';
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        // Procesar líneas completas
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // último fragmento incompleto

        for (const line of lines) {
          const msg = parseSerialLine(line);
          if (msg) {
            setLastMessage(msg);
          }
        }
      }
    } catch {
      // El lector se cierra al desconectar — es esperado
    } finally {
      reader.releaseLock();
      await pipeDone.catch(() => {});
    }
  }, []);

  // ─── connect() ────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!('serial' in navigator)) return;
    if (status === 'connected' || status === 'connecting') return;

    setStatus('connecting');
    try {
      // Solicita al usuario que elija el puerto COM
      const port = await (navigator as Navigator & { serial: { requestPort: () => Promise<SerialPort> } }).serial.requestPort();
      await port.open({ baudRate: 115200 });

      portRef.current = port;

      // Writer para enviar comandos
      if (port.writable) {
        const encoder = new TextEncoderStream();
        encoder.readable.pipeTo(port.writable);
        writerRef.current = encoder.writable.getWriter();
      }

      setStatus('connected');
      startReadLoop(port);
    } catch (err) {
      // El usuario canceló el diálogo → no es un error real
      const e = err as DOMException;
      if (e?.name !== 'NotFoundError') {
        setStatus('error');
      } else {
        setStatus('disconnected');
      }
    }
  }, [status, startReadLoop]);

  // ─── disconnect() ─────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try {
      readerRef.current?.cancel();
      await writerRef.current?.close();
      await portRef.current?.close();
    } catch {
      // Ignorar errores al cerrar
    } finally {
      readerRef.current = null;
      writerRef.current = null;
      portRef.current   = null;
      setStatus('disconnected');
    }
  }, []);

  // ─── send() ───────────────────────────────────────────────
  const send = useCallback((cmd: string) => {
    if (!writerRef.current || status !== 'connected') return;
    // Siempre terminar con \n para que ESP32 use readStringUntil('\n')
    writerRef.current.write(cmd.endsWith('\n') ? cmd : cmd + '\n');
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
