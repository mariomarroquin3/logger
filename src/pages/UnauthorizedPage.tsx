// ============================================================
// pages/UnauthorizedPage.tsx
// Pantalla de acceso denegado cuando el usuario no está en la whitelist
// Muestra el UID de Firebase Auth para que lo copie y se lo envíe al admin
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Copy, Check, LogOut, Mail, Fingerprint } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function UnauthorizedPage() {
  const { unauthorizedUser, logout, clearUnauthorizedUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Si no hay información de usuario no autorizado, redirigir a login
  useEffect(() => {
    if (!unauthorizedUser) {
      navigate('/login', { replace: true });
    }
  }, [unauthorizedUser, navigate]);

  const handleCopy = () => {
    if (unauthorizedUser?.uid) {
      navigator.clipboard.writeText(unauthorizedUser.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBackToLogin = async () => {
    await logout();
    clearUnauthorizedUser();
    navigate('/login', { replace: true });
  };

  if (!unauthorizedUser) return null;

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background gradients for premium glassmorphic effect */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#1a1d27]/75 backdrop-blur-xl border border-[#252836] rounded-2xl p-8 shadow-2xl relative z-10 space-y-6 animate-fade-in">
        
        {/* Warning Icon & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/5">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Acceso Denegado</h1>
            <p className="text-xs text-red-400 uppercase tracking-widest mt-1">Permisos Insuficientes</p>
          </div>
        </div>

        {/* Detailed Explanation */}
        <div className="text-center text-xs text-gray-400 leading-relaxed bg-[#0f1117]/60 border border-[#252836] rounded-xl p-4">
          Tu cuenta de correo electrónico no se encuentra registrada en la whitelist o está desactivada. 
          Ponte en contacto con el administrador para solicitar acceso.
        </div>

        {/* User Details & Whitelist Info */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tus datos de autenticación</p>

          <div className="space-y-2 rounded-xl bg-black/30 border border-[#252836] p-4 text-xs">
            {/* Email info */}
            {unauthorizedUser.email && (
              <div className="flex items-center gap-3 border-b border-[#252836] pb-2.5">
                <Mail className="h-4 w-4 text-gray-500" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-600 font-semibold uppercase">Correo electrónico</p>
                  <p className="text-white font-medium truncate">{unauthorizedUser.email}</p>
                </div>
              </div>
            )}

            {/* UID Info */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3 min-w-0">
                <Fingerprint className="h-4 w-4 text-gray-500" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-600 font-semibold uppercase">User UID (Firebase)</p>
                  <p className="text-cyan-400 font-mono select-all truncate">{unauthorizedUser.uid}</p>
                </div>
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded bg-[#1a1d27] border border-[#252836] p-1.5 text-gray-400 hover:text-white hover:border-gray-600 transition-all shrink-0"
                title="Copiar UID"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleBackToLogin}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-[#252836] text-white hover:bg-slate-800 font-semibold text-sm py-3 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-black/10"
        >
          <LogOut className="h-4 w-4" />
          Volver al Login
        </button>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-gray-600">v1.0.0 · ESP32 Security Verification</p>
        </div>

      </div>
    </div>
  );
}
