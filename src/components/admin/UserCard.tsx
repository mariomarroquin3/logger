// ============================================================
// components/admin/UserCard.tsx
// Tarjeta de usuario arrastrable para el Pipeline Kanban
// ============================================================
import React from 'react';
import type { UsuarioRFID } from '../../types';
import { Edit2, Trash2, MapPin, Building2, Briefcase } from 'lucide-react';

interface UserCardProps {
  user: UsuarioRFID;
  onEdit: (user: UsuarioRFID) => void;
  onDelete: (user: UsuarioRFID) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', user.uid);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative flex flex-col gap-2 rounded-xl border border-surface-border bg-surface-muted p-4 cursor-grab hover:border-accent-cyan/40 hover:shadow-lg hover:shadow-accent-cyan/5 transition-all duration-200 active:cursor-grabbing"
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm truncate group-hover:text-accent-cyan transition-colors">
            {user.nombre}
          </h4>
          <span className="font-mono text-[10px] text-gray-500 bg-surface/50 px-1.5 py-0.5 rounded border border-surface-border">
            {user.uid}
          </span>
        </div>

        {/* Indicador de Presencia y Estado Activo */}
        <div className="flex items-center gap-1.5">
          {/* Dentro/Fuera */}
          <span
            className={`inline-flex items-center justify-center h-2 w-2 rounded-full ring-4 ${
              user.dentro
                ? 'bg-emerald-500 ring-emerald-500/10'
                : 'bg-gray-600 ring-gray-600/10'
            }`}
            title={user.dentro ? 'Dentro de las instalaciones' : 'Fuera'}
          />
          {/* Activo / Inactivo */}
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              user.activo
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {user.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Detalles opcionales */}
      {(user.cargo || user.departamento) && (
        <div className="mt-1 flex flex-col gap-1 text-[11px] text-gray-400">
          {user.cargo && (
            <div className="flex items-center gap-1.5 truncate">
              <Briefcase className="h-3 w-3 text-gray-500 flex-shrink-0" />
              <span className="truncate">{user.cargo}</span>
            </div>
          )}
          {user.departamento && (
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="h-3 w-3 text-gray-500 flex-shrink-0" />
              <span className="truncate">{user.departamento}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer/Acciones */}
      <div className="mt-2 pt-2 border-t border-surface-border/50 flex items-center justify-between">
        <span className="text-[10px] text-gray-500">
          {user.dentro ? (
            <span className="flex items-center gap-1 text-emerald-400/80">
              <MapPin className="h-3 w-3" /> En maqueta
            </span>
          ) : (
            'Fuera'
          )}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => onEdit(user)}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-surface transition-colors"
            title="Editar usuario"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Eliminar usuario"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
