// ============================================================
// components/admin/UserFormModal.tsx
// Modal de creación/edición de usuarios RFID.
// El UID es la key de Firebase — editable solo en creación.
// ============================================================
import { useState, useEffect, type FormEvent } from 'react';
import { X, User, CreditCard, Building2, Briefcase, Mail, FileText, AlertCircle } from 'lucide-react';
import type { UsuarioRFID, RfidStatus } from '../../types';

const RFID_STATUS_OPTIONS: { value: RfidStatus; label: string }[] = [
  { value: 'pendiente',    label: 'Pendiente' },
  { value: 'sin_asignar', label: 'Sin asignar' },
  { value: 'impreso',      label: 'Impreso' },
  { value: 'programado',   label: 'Programado' },
  { value: 'activo',       label: 'Activo' },
  { value: 'deshabilitado', label: 'Deshabilitado' },
];

interface UserFormModalProps {
  isOpen: boolean;
  usuario: UsuarioRFID | null; // null = modo creación
  existingUids: string[];       // para validar UID único en creación
  onSave: (uid: string, data: Omit<UsuarioRFID, 'uid'>) => Promise<void>;
  onClose: () => void;
}

interface FormState {
  uid: string;
  nombre: string;
  cargo: string;
  departamento: string;
  email: string;
  notas: string;
  rfid_status: RfidStatus;
  activo: boolean;
}

const EMPTY: FormState = {
  uid: '',
  nombre: '',
  cargo: '',
  departamento: '',
  email: '',
  notas: '',
  rfid_status: 'pendiente',
  activo: true,
};

export function UserFormModal({ isOpen, usuario, existingUids, onSave, onClose }: UserFormModalProps) {
  const isEdit = !!usuario;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (usuario) {
      setForm({
        uid: usuario.uid,
        nombre: usuario.nombre,
        cargo: usuario.cargo ?? '',
        departamento: usuario.departamento ?? '',
        email: usuario.email ?? '',
        notas: usuario.notas ?? '',
        rfid_status: usuario.rfid_status ?? 'pendiente',
        activo: usuario.activo,
      });
    } else {
      setForm(EMPTY);
    }
    setFormError(null);
  }, [isOpen, usuario]);

  if (!isOpen) return null;

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validación
    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    if (!isEdit) {
      if (!form.uid.trim()) {
        setFormError('El UID RFID es obligatorio.');
        return;
      }
      const cleanUid = form.uid.trim().toUpperCase();
      if (existingUids.includes(cleanUid)) {
        setFormError(`El UID "${cleanUid}" ya existe en el sistema.`);
        return;
      }
    }

    setSaving(true);
    try {
      const cleanUid = isEdit ? usuario!.uid : form.uid.trim().toUpperCase();
      await onSave(cleanUid, {
        nombre: form.nombre.trim(),
        activo: form.activo,
        dentro: usuario?.dentro ?? false,
        cargo: form.cargo.trim() || undefined,
        departamento: form.departamento.trim() || undefined,
        email: form.email.trim() || undefined,
        notas: form.notas.trim() || undefined,
        rfid_status: form.rfid_status,
      });
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e?.message ?? 'Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-[#1a1d27] border border-white/8 rounded-2xl shadow-2xl shadow-black/50 flex flex-col max-h-[90vh]">
        {/* Top accent */}
        <div className="h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-400/60 to-cyan-500/0 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {isEdit ? 'Editar usuario RFID' : 'Nuevo usuario RFID'}
              </h2>
              <p className="text-[10px] text-gray-500">
                {isEdit ? `UID: ${usuario!.uid}` : 'La key en Firebase será el UID RFID'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            {/* Error */}
            {formError && (
              <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* UID RFID — solo en creación */}
            {!isEdit && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  UID RFID *
                </label>
                <input
                  type="text"
                  value={form.uid}
                  onChange={set('uid')}
                  placeholder="Ej: A1B2C3D4"
                  maxLength={32}
                  className="input font-mono"
                />
                <p className="text-[10px] text-gray-600">
                  Hex del chip RFID — será la key permanente en Firebase.
                </p>
              </div>
            )}

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Nombre completo *
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={set('nombre')}
                placeholder="Nombre del portador"
                className="input"
              />
            </div>

            {/* Cargo + Departamento en fila */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  Cargo
                </label>
                <input
                  type="text"
                  value={form.cargo}
                  onChange={set('cargo')}
                  placeholder="Ej: Ingeniero"
                  className="input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Departamento
                </label>
                <input
                  type="text"
                  value={form.departamento}
                  onChange={set('departamento')}
                  placeholder="Ej: IT"
                  className="input"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Correo electrónico
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="correo@empresa.com"
                className="input"
              />
            </div>

            {/* Estado RFID + Activo en fila */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Estado RFID
                </label>
                <select
                  value={form.rfid_status}
                  onChange={set('rfid_status')}
                  className="input"
                >
                  {RFID_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Cuenta activa
                </label>
                <select
                  value={form.activo ? 'true' : 'false'}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, activo: e.target.value === 'true' }))
                  }
                  className="input"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Notas
              </label>
              <textarea
                value={form.notas}
                onChange={set('notas')}
                placeholder="Observaciones opcionales..."
                rows={2}
                className="input resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/6 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary min-w-[100px] justify-center"
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
