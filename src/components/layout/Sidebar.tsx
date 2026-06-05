// ============================================================
// components/layout/Sidebar.tsx
// Sidebar de navegación con soporte responsive (móvil colapsable).
// Las rutas del dashboard viven bajo /dashboard/*.
// ============================================================
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Users,
  Wifi,
  X,
  ShieldCheck,
  KanbanSquare,
  CreditCard,
  Radio,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardProvider';
import { useAuth } from '../../auth/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/dashboard/eventos',  icon: ClipboardList,   label: 'Eventos'    },
  { to: '/dashboard/graficas', icon: BarChart3,        label: 'Gráficas'   },
  { to: '/dashboard/presencia',icon: Users,            label: 'Presencia'  },
];

const ADMIN_ITEMS = [
  { to: '/dashboard/admin/usuarios-rfid',   icon: ShieldCheck,  label: 'Usuarios RFID'    },
  { to: '/dashboard/admin/pipeline-rfid',   icon: KanbanSquare, label: 'Pipeline RFID'    },
  { to: '/dashboard/admin/credenciales-rfid', icon: CreditCard, label: 'Credenciales RFID' },
  { to: '/dashboard/admin/estacion-rfid',   icon: Radio,        label: 'Estación RFID'    },
];

function SideNavLink({ to, icon: Icon, label, onClose, end = false }: {
  to: string; icon: React.ElementType; label: string; onClose: () => void; end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
        ${
          isActive
            ? 'bg-accent-cyan/10 text-accent-cyan'
            : 'text-gray-400 hover:bg-surface-muted hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-4 w-4 ${isActive ? 'text-accent-cyan' : ''}`} />
          {label}
          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-cyan" />
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { isDemoMode, setIsDemoMode } = useDashboard();
  const { user } = useAuth();

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex w-64 flex-col
          border-r border-surface-border bg-surface-card
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-cyan/20">
              <ShieldCheck className="h-4 w-4 text-accent-cyan" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">RFID Control</p>
              <p className="text-[10px] text-gray-500">Access Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
            Monitoreo
          </p>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <SideNavLink
              key={to}
              to={to}
              icon={icon}
              label={label}
              onClose={onClose}
              end={to === '/dashboard'}
            />
          ))}

          {user?.role === 'admin' && (
            <div className="pt-4 mt-4 border-t border-surface-border/50 space-y-1">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                Administración
              </p>
              {ADMIN_ITEMS.map(({ to, icon, label }) => (
                <SideNavLink
                  key={to}
                  to={to}
                  icon={icon}
                  label={label}
                  onClose={onClose}
                />
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-surface-border px-5 py-4">
          {isDemoMode ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-semibold">Modo Demo Activo</span>
              </div>
              <button
                onClick={() => setIsDemoMode(false)}
                className="text-[10px] text-gray-500 hover:text-white underline transition-colors"
              >
                Conectar a Firebase
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Wifi className="h-3 w-3 text-emerald-500" />
                <span>Firebase Realtime DB</span>
              </div>
              <p className="mt-1 text-[10px] text-gray-700">v1.1.0 · ESP32 RFID System</p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
