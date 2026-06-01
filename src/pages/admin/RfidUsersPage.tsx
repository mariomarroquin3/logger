// ============================================================
// pages/admin/RfidUsersPage.tsx
// Gestión de usuarios RFID — CRUD completo
// ============================================================
import { useState, useMemo } from 'react';
import { useUsuariosRfid } from '../../hooks/useUsuariosRfid';
import { useAuth } from '../../auth/AuthContext';
import {
  createUsuarioRFID,
  updateUsuarioRFID,
  deleteUsuarioRFID,
  toggleActivoUsuario,
} from '../../services/rfidService';
import { UserFormModal } from '../../components/admin/UserFormModal';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import {
  Search,
  UserPlus,
  Trash2,
  Edit,
  Power,
  Mail,
  Calendar,
  Building2,
  Briefcase,
  User,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { UsuarioRFID } from '../../types';

export function RfidUsersPage() {
  const { user: currentUser } = useAuth();
  const { usuarios, loading, error } = useUsuariosRfid();

  // Búsqueda y filtrado
  const [search, setSearch] = useState('');
  const [filterActivo, setFilterActivo] = useState<string>('all'); // all, activo, inactivo
  const [filterPresencia, setFilterPresencia] = useState<string>('all'); // all, dentro, fuera
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, rfid statuses

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioRFID | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UsuarioRFID | null>(null);

  const actorUid = currentUser?.uid || 'unknown-admin';
  const actorNombre = currentUser?.displayName || currentUser?.email || 'Admin';

  // Filtrado de la lista
  const filteredUsers = useMemo(() => {
    return usuarios.filter((u) => {
      // Búsqueda
      const term = search.toLowerCase();
      const matchSearch =
        u.nombre.toLowerCase().includes(term) ||
        u.uid.toLowerCase().includes(term) ||
        (u.cargo?.toLowerCase() || '').includes(term) ||
        (u.departamento?.toLowerCase() || '').includes(term) ||
        (u.email?.toLowerCase() || '').includes(term);

      // Activo
      const matchActivo =
        filterActivo === 'all' ||
        (filterActivo === 'activo' && u.activo) ||
        (filterActivo === 'inactivo' && !u.activo);

      // Presencia
      const matchPresencia =
        filterPresencia === 'all' ||
        (filterPresencia === 'dentro' && u.dentro) ||
        (filterPresencia === 'fuera' && !u.dentro);

      // Rfid status
      const matchStatus =
        filterStatus === 'all' ||
        u.rfid_status === filterStatus;

      return matchSearch && matchActivo && matchPresencia && matchStatus;
    });
  }, [usuarios, search, filterActivo, filterPresencia, filterStatus]);

  // Lista de UIDs para validación de unicidad
  const existingUids = useMemo(() => usuarios.map((u) => u.uid), [usuarios]);

  // Acciones
  const handleSaveUser = async (uid: string, data: Omit<UsuarioRFID, 'uid'>) => {
    try {
      if (selectedUser) {
        // Modo Edición
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
          `Usuario editado: ${data.nombre}`
        );
        toast.success('Usuario actualizado con éxito');
      } else {
        // Modo Creación
        await createUsuarioRFID(
          { uid, ...data },
          actorUid,
          actorNombre
        );
        toast.success('Usuario creado con éxito');
      }
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e?.message || 'Error al guardar el usuario');
      throw e;
    }
  };

  const handleToggleActivo = async (u: UsuarioRFID) => {
    const nextState = !u.activo;
    try {
      await toggleActivoUsuario(
        u.uid,
        nextState,
        actorUid,
        actorNombre,
        u.nombre
      );
      toast.success(
        `Usuario ${nextState ? 'activado' : 'desactivado'} con éxito`
      );
    } catch (err) {
      toast.error('Error al cambiar el estado de activación');
    }
  };

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

  const openCreateModal = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const openEditModal = (u: UsuarioRFID) => {
    setSelectedUser(u);
    setIsFormOpen(true);
  };

  const openDeleteModal = (u: UsuarioRFID) => {
    setUserToDelete(u);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Usuarios RFID
          </h1>
          <p className="text-sm text-gray-500">
            Administración completa de credenciales y personal autorizado.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Agregar Usuario</span>
        </button>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-surface-border bg-surface-card p-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, UID, cargo..."
            className="input pl-9"
          />
        </div>

        {/* Filtro Activo */}
        <div>
          <select
            value={filterActivo}
            onChange={(e) => setFilterActivo(e.target.value)}
            className="input"
          >
            <option value="all">Estado: Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        {/* Filtro Presencia */}
        <div>
          <select
            value={filterPresencia}
            onChange={(e) => setFilterPresencia(e.target.value)}
            className="input"
          >
            <option value="all">Ubicación: Todos</option>
            <option value="dentro">En maqueta (Dentro)</option>
            <option value="fuera">Fuera</option>
          </select>
        </div>

        {/* Filtro Status RFID */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
          >
            <option value="all">Estado RFID: Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="sin_asignar">Sin asignar</option>
            <option value="impreso">Impreso</option>
            <option value="programado">Programado</option>
            <option value="activo">Activo</option>
            <option value="deshabilitado">Deshabilitado</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border-b border-red-500/20 px-6 py-4 text-sm text-red-400">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <span className="text-sm text-gray-500">Cargando usuarios...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2">
              <User className="h-8 w-8 text-gray-700" />
              <span className="text-sm text-gray-500 font-medium">
                No se encontraron usuarios
              </span>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-400 border-collapse">
              <thead className="bg-[#131622] text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-surface-border">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">UID RFID</th>
                  <th className="px-6 py-4">Cargo / Depto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Ubicación</th>
                  <th className="px-6 py-4">Estado RFID</th>
                  <th className="px-6 py-4">Creado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.uid}
                    className="hover:bg-surface-muted/30 transition-colors"
                  >
                    {/* Usuario */}
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex flex-col">
                        <span className="text-white font-semibold">{u.nombre}</span>
                        {u.email && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail className="h-2.5 w-2.5" />
                            {u.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* UID */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-surface/80 border border-surface-border/80 px-2 py-0.5 rounded text-gray-300">
                        {u.uid}
                      </span>
                    </td>

                    {/* Cargo / Depto */}
                    <td className="px-6 py-4">
                      {u.cargo || u.departamento ? (
                        <div className="flex flex-col gap-0.5 text-xs text-gray-400">
                          {u.cargo && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3 text-gray-500" />
                              {u.cargo}
                            </span>
                          )}
                          {u.departamento && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-gray-500" />
                              {u.departamento}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${
                          u.activo
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Ubicación */}
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${
                          u.dentro
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {u.dentro ? 'Dentro' : 'Fuera'}
                      </span>
                    </td>

                    {/* Estado RFID */}
                    <td className="px-6 py-4">
                      <span
                        className={`badge capitalize ${
                          u.rfid_status === 'activo'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : u.rfid_status === 'deshabilitado'
                            ? 'bg-rose-500/10 text-rose-400'
                            : u.rfid_status === 'programado'
                            ? 'bg-cyan-500/10 text-cyan-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {u.rfid_status || 'pendiente'}
                      </span>
                    </td>

                    {/* Creado */}
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {u.fecha_creacion ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(u.fecha_creacion).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle Activo */}
                        <button
                          onClick={() => handleToggleActivo(u)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.activo
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                          title={u.activo ? 'Desactivar' : 'Activar'}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-muted hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => openDeleteModal(u)}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
