// ============================================================
// components/ui/FirebaseConfigMissing.tsx
// Interfaz informativa cuando falta el archivo .env
// Permite al usuario continuar en "Modo Demo" con datos simulados
// ============================================================
import { useState } from 'react';
import { Database, AlertTriangle, ShieldCheck, Play, Copy, Check } from 'lucide-react';

interface Props {
  onEnableDemo: () => void;
}

export function FirebaseConfigMissing({ onEnableDemo }: Props) {
  const [copied, setCopied] = useState(false);

  const envContent = `# Variables de entorno — RFID Access Dashboard
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://tu_proyecto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:12345:web:abc123`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full bg-[#1a1d27]/80 backdrop-blur-md border border-[#252836] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[#252836] pb-5">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-accent-cyan">
            <ShieldCheck className="h-7 w-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">RFID Access Dashboard</h1>
            <p className="text-xs text-gray-400">Panel de Control de Acceso IoT</p>
          </div>
        </div>

        {/* Warning card */}
        <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-white">Configuración de Firebase no detectada</p>
            <p className="mt-1 text-gray-300 leading-relaxed">
              No se encontraron las variables de entorno en un archivo <code className="text-amber-200 bg-amber-950/40 px-1 py-0.5 rounded">.env</code>. 
              El dashboard necesita conectarse a Firebase Realtime Database para monitorear el lector RFID.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">¿Cómo configurarlo?</h2>
          
          <div className="space-y-3 text-xs sm:text-sm text-gray-300">
            <div className="flex gap-3 items-start">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-[10px] font-bold text-cyan-400 mt-0.5">1</span>
              <p>
                Crea un archivo llamado <strong className="text-white">.env</strong> en la raíz del proyecto (<code className="text-gray-400 bg-black/30 px-1 py-0.5 rounded">c:\logger\.env</code>).
              </p>
            </div>
            
            <div className="flex gap-3 items-start">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-[10px] font-bold text-cyan-400 mt-0.5">2</span>
              <p>
                Copia y pega la siguiente plantilla rellenando los datos de tu consola de Firebase:
              </p>
            </div>
          </div>

          {/* Code block with copy button */}
          <div className="relative group rounded-lg bg-black/40 border border-[#252836] overflow-hidden">
            <div className="absolute right-2 top-2 z-10">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded bg-[#1a1d27] border border-[#252836] px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-white hover:border-gray-600 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[10px] sm:text-xs text-cyan-200/80 font-mono overflow-x-auto whitespace-pre leading-relaxed">
              {envContent}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#252836]">
          {/* Demo button */}
          <button
            onClick={onEnableDemo}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold text-sm py-3 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-cyan-500/10"
          >
            <Play className="h-4 w-4 fill-current" />
            Iniciar en Modo Demo (Sin Firebase)
          </button>
          
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-2 sm:py-0 px-3">
            <Database className="h-4 w-4" />
            <span>Los cambios en .env requieren reiniciar Vite</span>
          </div>
        </div>

      </div>
    </div>
  );
}
