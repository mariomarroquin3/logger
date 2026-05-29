// ============================================================
// components/presence/UserPresenceCard.tsx
// Tarjeta de usuario actualmente dentro del establecimiento
// ============================================================
import { User, MapPin } from 'lucide-react';
import type { Usuario } from '../../types';

interface Props {
  usuario: Usuario;
}

export function UserPresenceCard({ usuario }: Props) {
  return (
    <div className="card flex flex-col items-center gap-3 text-center animate-fade-in
      hover:border-emerald-500/30 transition-colors duration-300">
      {/* Avatar */}
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/20">
          <User className="h-7 w-7 text-emerald-400" />
        </div>
        {/* Dot online */}
        <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-surface-card" />
        </span>
      </div>

      {/* Info */}
      <div>
        <p className="text-sm font-semibold text-white">{usuario.nombre}</p>
        <p className="mt-0.5 font-mono text-[11px] text-gray-500">{usuario.uid}</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
        <MapPin className="h-3 w-3 text-emerald-400" />
        <span className="text-[11px] font-medium text-emerald-400">
          Dentro del establecimiento
        </span>
      </div>
    </div>
  );
}
