// ============================================================
// pages/admin/PipelinePage.tsx
// Dashboard Kanban Pipeline para el ciclo de vida de credenciales RFID
// ============================================================
import { useState, useMemo } from 'react';
import { useUsuariosRfid } from '../../hooks/useUsuariosRfid';
import { useDashboard } from '../../context/DashboardProvider';
import { useOperationalAlerts } from '../../hooks/useOperationalAlerts';
import { useAuth } from '../../auth/AuthContext';
import {
  updateRfidStatus,
  updateUsuarioRFID,
  deleteUsuarioRFID,
} from '../../services/rfidService';
import { KanbanColumn } from '../../components/admin/KanbanColumn';
import { AlertsWidget } from '../../components/admin/AlertsWidget';
import { UserFormModal } from '../../components/admin/UserFormModal';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import type { RfidStatus, UsuarioRFID } from '../../types';
import { toast } from 'react-hot-toast';
import { KanbanSquare } from 'lucide-react';

const COLUMNS_CONFIG: {
  status: RfidStatus;
  title: string;
  description: string;
  colorClass: string;
}[] = [
  {
    status: 'pendiente',
    title: 'Pendiente',
    description: 'Recién registrado sin asignar',
    colorClass: 'bg-amber-400',
  },
  {
    status: 'sin_asignar',
    title: 'Sin Asignar',
    description: 'Falta asociar UID físico',
    colorClass: 'bg-orange-400',
  },
  {
    status: 'impreso',
    title: 'Impreso',
    description: 'Credencial impresa lista',
    colorClass: 'bg-yellow-400',
  },
  {
    status: 'programado',
    title: 'Programado',
    description: 'Tarjeta grabada',
    colorClass: 'bg-cyan-400',
  },
  {
    status: 'activo',
    title: 'Activo',
    description: 'Credencial operativa en puerta',
    colorClass: 'bg-emerald-400',
  },
  {
    status: 'deshabilitado',
    title: 'Deshabilitado',
    description: 'Acceso bloqueado (revocada)',
    colorClass: 'bg-rose-400',
  },
];

export function PipelinePage() {
  const { user: currentUser } = useAuth();
  const { usuarios, loading, error } = useUsuariosRfid();
  const { eventos } = useDashboard();
  const { alerts, criticalCount, warningCount } = useOperationalAlerts(usuarios, eventos);

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioRFID | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UsuarioRFID | null>(null);

  const actorUid = currentUser?.uid || 'unknown-admin';
  const actorNombre = currentUser?.displayName || currentUser?.email || 'Admin';

  // Agrupar usuarios por estado
  const columnsData = useMemo(() => {
    const map: Record<RfidStatus, UsuarioRFID[]> = {
      pendiente: [],
      sin_asignar: [],
      impreso: [],
      programado: [],
      activo: [],
      deshabilitado: [],
    };

    usuarios.forEach((u) => {
      const status = u.rfid_status || 'pendiente';
      if (map[status]) {
        map[status].push(u);
      } else {
        // Fallback para mapeo seguro
        map.pendiente.push(u);
      }
    });

    return map;
  }, [usuarios]);

  // Lista de UIDs para validación
  const existingUids = useMemo(() => usuarios.map((u) => u.uid), [usuarios]);

  // Mover tarjeta en el pipeline
  const handleDropUser = async (uid: string, targetStatus: RfidStatus) => {
    const userObj = usuarios.find((u) => u.uid === uid);
    if (!userObj) return;

    // Si ya está en ese estado, no hacer nada
    if ((userObj.rfid_status || 'pendiente') === targetStatus) return;

    try {
      await updateRfidStatus(
        uid,
        targetStatus,
        actorUid,
        actorNombre,
        userObj.nombre
      );
      toast.success(
        `Estado de ${userObj.nombre} actualizado a ${targetStatus}`
      );
    } catch (err) {
      toast.error('Error al mover el usuario en el pipeline');
    }
  };

  // Editar datos del usuario
  const handleSaveUser = async (uid: string, data: Omit<UsuarioRFID, 'uid'>) => {
    try {
      const patch: Partial<Omit<UsuarioRFID, 'uid'>> = {
        nombre: data.nombre,
        activo: data.activo,
        cargo: data.cargo,
        departamento: data.departamento,
        email: data.email,
        notas: data.notas,
        rfid_status: data.rfid_status,
      };
      await updateUsuarioRFID(
        uid,
        patch,
        actorUid,
        actorNombre,
        `Usuario editado desde pipeline: ${data.nombre}`
      );
      toast.success('Usuario actualizado con éxito');
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e?.message || 'Error al actualizar el usuario');
      throw e;
    }
  };

  // Eliminar usuario
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await deleteUsuarioRFID(
        userToDelete.uid,
        userToDelete.nombre,
        actorUid,
        actorNombre
      );
      toast.success('Usuario eliminado con éxito');
      setIsDeleteOpen(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error('Error al eliminar el usuario');
    }
  };

  const handleEditUser = (u: UsuarioRFID) => {
    setSelectedUser(u);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (u: UsuarioRFID) => {
    setUserToDelete(u);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Cabecera */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <KanbanSquare className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Pipeline RFID
            </h1>
            <p className="text-sm text-gray-500">
              Arrastra y suelta las credenciales para gestionar el ciclo de vida del personal.
            </p>
          </div>
        </div>
      </div>

      {/* Widget de Alertas */}
      <AlertsWidget
        alerts={alerts}
        criticalCount={criticalCount}
        warningCount={warningCount}
      />

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto pb-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <span className="text-sm text-gray-500">Cargando pipeline...</span>
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-rose-400">
            <span>Error al cargar datos: {error}</span>
          </div>
        ) : (
          <div className="flex gap-4 items-start h-full">
            {COLUMNS_CONFIG.map((c) => (
              <KanbanColumn
                key={c.status}
                status={c.status}
                title={c.title}
                description={c.description}
                users={columnsData[c.status]}
                colorClass={c.colorClass}
                onDropUser={handleDropUser}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      <UserFormModal
        isOpen={isFormOpen}
        usuario={selectedUser}
        existingUids={existingUids}
        onSave={handleSaveUser}
        onClose={() => setIsFormOpen(false)}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Eliminar usuario RFID"
        message={`¿Estás seguro de que deseas eliminar a ${userToDelete?.nombre}? Esta acción borrará el registro de usuarios autorizados permanentemente.`}
        confirmLabel="Eliminar permanentemente"
        danger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
