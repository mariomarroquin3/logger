// ============================================================
// components/layout/TopBar.tsx
// Barra superior: título de página, menú hamburguesa,
// indicador de conexión, y perfil de usuario autenticado.
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConnectionIndicator } from './ConnectionIndicator';
import { useAuth } from '../../auth/AuthContext';

interface TopBarProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':          { title: 'Dashboard',            subtitle: 'Vista general del sistema RFID' },
  '/eventos':   { title: 'Historial de Eventos', subtitle: 'Registro de accesos en tiempo real' },
  '/graficas':  { title: 'Análisis',             subtitle: 'Gráficas y estadísticas de acceso' },
  '/presencia': { title: 'Presencia',            subtitle: 'Usuarios actualmente dentro' },
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  viewer: 'Observador',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  viewer: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const page = PAGE_TITLES[pathname] ?? PAGE_TITLES['/'];
  const now = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';
  const roleKey = user?.role ?? 'viewer';
  const roleLabel = ROLE_LABELS[roleKey] ?? roleKey;
  const roleColor = ROLE_COLORS[roleKey] ?? ROLE_COLORS['viewer'];
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-surface-border bg-surface/90 px-4 backdrop-blur-md lg:px-6">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-gray-400 hover:bg-surface-muted hover:text-white lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-base font-semibold text-white">{page.title}</h1>
          <p className="text-xs text-gray-500 capitalize">{now}</p>
        </div>
        <div className="sm:hidden">
          <h1 className="text-sm font-semibold text-white">{page.title}</h1>
        </div>
      </div>

      {/* Right: connection + bell + user profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <ConnectionIndicator />

        <button className="rounded-md p-1.5 text-gray-500 hover:bg-surface-muted hover:text-white">
          <Bell className="h-4 w-4" />
        </button>

        {/* User profile dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              id="btn-user-menu"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-surface-muted transition-colors"
            >
              {/* Avatar */}
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/20 border border-white/10 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                  {initials}
                </div>
              )}

              {/* Name + role (hidden on small screens) */}
              <div className="hidden md:flex flex-col items-start leading-none">
                <span className="text-xs font-medium text-white">{displayName}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border mt-0.5 ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>

              <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-[#1a1d27] border border-white/8 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                {/* User info section */}
                <div className="p-4 border-b border-white/6 space-y-2">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-cyan-300">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-gray-500" />
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleColor}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    id="btn-logout"
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>

                {/* Footer */}
                <div className="px-4 pb-3">
                  <p className="text-[10px] text-gray-700">UID: {user.uid.slice(0, 16)}…</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
