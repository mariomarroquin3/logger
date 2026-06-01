// ============================================================
// components/admin/KanbanColumn.tsx
// Columna del Pipeline Kanban con soporte Drag & Drop nativo
// ============================================================
import React, { useState } from 'react';
import type { RfidStatus, UsuarioRFID } from '../../types';
import { UserCard } from './UserCard';

interface KanbanColumnProps {
  status: RfidStatus;
  title: string;
  description?: string;
  users: UsuarioRFID[];
  colorClass: string; // Tailwind class for colors
  onDropUser: (uid: string, targetStatus: RfidStatus) => void;
  onEditUser: (user: UsuarioRFID) => void;
  onDeleteUser: (user: UsuarioRFID) => void;
}

export function KanbanColumn({
  status,
  title,
  description,
  users,
  colorClass,
  onDropUser,
  onEditUser,
  onDeleteUser,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const uid = e.dataTransfer.getData('text/plain');
    if (uid) {
      onDropUser(uid, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col h-full min-h-[500px] w-80 flex-shrink-0 rounded-2xl border bg-surface-card p-4 transition-all duration-200 ${
        isDragOver
          ? 'border-accent-cyan bg-surface-muted/50 ring-2 ring-accent-cyan/10'
          : 'border-surface-border'
      }`}
    >
      {/* Cabecera de Columna */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
          <h3 className="font-bold text-white text-sm tracking-wide uppercase">
            {title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-gray-400 bg-surface px-2 py-0.5 rounded-full border border-surface-border">
          {users.length}
        </span>
      </div>

      {description && (
        <p className="text-[11px] text-gray-500 mb-4 truncate" title={description}>
          {description}
        </p>
      )}

      {/* Contenedor de Tarjetas */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
        {users.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border border-dashed border-surface-border/50 rounded-xl p-6 min-h-[120px]">
            <span className="text-xs text-gray-600 text-center font-medium">
              Arrastra usuarios aquí
            </span>
          </div>
        ) : (
          users.map((user) => (
            <UserCard
              key={user.uid}
              user={user}
              onEdit={onEditUser}
              onDelete={onDeleteUser}
            />
          ))
        )}
      </div>
    </div>
  );
}
