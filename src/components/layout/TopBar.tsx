// ============================================================
// components/layout/TopBar.tsx
// Barra superior con título de página, menú hamburguesa y
// indicador de conexión
// ============================================================
import { Menu, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ConnectionIndicator } from './ConnectionIndicator';

interface TopBarProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':          { title: 'Dashboard',          subtitle: 'Vista general del sistema RFID' },
  '/eventos':   { title: 'Historial de Eventos', subtitle: 'Registro de accesos en tiempo real' },
  '/graficas':  { title: 'Análisis',            subtitle: 'Gráficas y estadísticas de acceso' },
  '/presencia': { title: 'Presencia',           subtitle: 'Usuarios actualmente dentro' },
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const { pathname } = useLocation();
  const page = PAGE_TITLES[pathname] ?? PAGE_TITLES['/'];
  const now  = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

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

      {/* Right: connection + bell */}
      <div className="flex items-center gap-3">
        <ConnectionIndicator />
        <button className="rounded-md p-1.5 text-gray-500 hover:bg-surface-muted hover:text-white">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
