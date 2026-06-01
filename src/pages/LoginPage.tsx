// ============================================================
// pages/LoginPage.tsx
// Pantalla de login premium: Google OAuth + Email/Password
// Dark theme IoT — sin GitHub
// ============================================================
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, KeyRound, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Wifi } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { user, loading, error, loginWithGoogle, loginWithEmail, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'oauth' | 'email'>('oauth');
  const [localError, setLocalError] = useState<string | null>(null);

  // Limpiar errores previos al montar la pantalla
  useEffect(() => {
    clearError();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si ya está logueado, redirigir al home
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLoginGoogle = async () => {
    setLocalError(null);
    await loginWithGoogle();
  };

  const handleLoginEmail = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!password) {
      setLocalError('Por favor ingresa tu contraseña.');
      return;
    }

    await loginWithEmail(email.trim(), password);
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">

      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-60 h-60 bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="max-w-md w-full relative z-10">
        {/* Glassmorphic card */}
        <div className="bg-[#141720]/80 backdrop-blur-2xl border border-white/8 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-400/70 to-cyan-500/0" />

          <div className="p-8 space-y-7">
            {/* Logo / Brand */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/10 border border-cyan-500/25 flex items-center justify-center shadow-xl shadow-cyan-500/10">
                  <KeyRound className="h-8 w-8 text-cyan-400" />
                </div>
                {/* Live pulse indicator */}
                <div className="absolute -top-1 -right-1 flex items-center gap-1">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  RFID Control Panel
                </h1>
                <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mt-1.5 flex items-center justify-center gap-1.5">
                  <Wifi className="h-3 w-3 text-emerald-500" />
                  Sistema de Acceso Seguro
                </p>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl bg-black/30 border border-white/6 p-1 gap-1">
              <button
                onClick={() => { setActiveTab('oauth'); setLocalError(null); clearError(); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeTab === 'oauth'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                OAuth
              </button>
              <button
                onClick={() => { setActiveTab('email'); setLocalError(null); clearError(); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeTab === 'email'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Correo / Contraseña
              </button>
            </div>

            {/* Error notification */}
            {displayError && (
              <div className="flex gap-3 bg-red-500/8 border border-red-500/20 text-red-300 rounded-xl p-4 text-xs">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-white text-sm">Error de acceso</p>
                  <p className="text-gray-300 leading-relaxed">{displayError}</p>
                </div>
              </div>
            )}

            {/* ── OAuth Tab ── */}
            {activeTab === 'oauth' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 text-center">
                  Inicia sesión con tu cuenta Google autorizada
                </p>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                    <p className="text-xs text-gray-500">Verificando credenciales...</p>
                  </div>
                ) : (
                  <button
                    id="btn-login-google"
                    onClick={handleLoginGoogle}
                    disabled={loading}
                    className="w-full flex items-center justify-between gap-3 rounded-xl bg-white text-slate-900 hover:bg-gray-50 active:bg-gray-100 font-semibold text-sm px-5 py-3.5 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-white/5 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      <span>Continuar con Google</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                )}
              </div>
            )}

            {/* ── Email/Password Tab ── */}
            {activeTab === 'email' && (
              <form onSubmit={handleLoginEmail} className="space-y-4" noValidate>
                {/* Email field */}
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      placeholder="correo@dominio.com"
                      className="w-full bg-black/30 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      placeholder="••••••••"
                      className="w-full bg-black/30 border border-white/8 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-2">
                    <Loader2 className="h-7 w-7 text-cyan-400 animate-spin" />
                    <p className="text-xs text-gray-500">Verificando credenciales...</p>
                  </div>
                ) : (
                  <button
                    id="btn-login-email"
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold text-sm py-3.5 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-cyan-600/20 disabled:opacity-50"
                  >
                    <span>Iniciar sesión</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </form>
            )}

            {/* Footer */}
            <div className="text-center pt-1 border-t border-white/5">
              <p className="text-[10px] text-gray-600">
                v1.0.0 · ESP32 RFID Secure Portal · Acceso solo para usuarios autorizados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
