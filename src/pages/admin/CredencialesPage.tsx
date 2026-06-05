// ============================================================
// pages/admin/CredencialesPage.tsx
// Inventario de chips RFID físicos (nodo credenciales_rfid).
// Solo administradores. No requiere conexión serial.
// ============================================================
import { useState, useMemo } from 'react';
import { CreditCard, Search, Plus, CheckCircle2, Clock, User, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCredenciales } from '../../hooks/useCredenciales';
import { registrarCredencial } from '../../services/credencialesService';

export function CredencialesPage() {
  const { credenciales, loading, error, total, totalDisponibles, totalAsignadas } = useCredenciales();

  const [search, setSearch]               = useState('');
  const [filterEstado, setFilterEstado]   = useState('all');
  const [showManual, setShowManual]       = useState(false);
  const [manualUid, setManualUid]         = useState('');
  const [saving, setSaving]               = useState(false);
  const [manualError, setManualError]     = useState<string | null>(null);

  const filteredCreds = useMemo(() => {
    const term = search.toUpperCase();
    return credenciales.filter((c) => {
      const matchSearch =
        c.uid.includes(term) ||
        (c.asignada_a?.toUpperCase() || '').includes(term);
      const matchEstado = filterEstado === 'all' || c.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [credenciales, search, filterEstado]);

  const handleRegistrarManual = async () => {
    setManualError(null);
    const cleanUid = manualUid.trim().toUpperCase();

    if (!cleanUid) { setManualError('Ingresa un UID válido.'); return; }
    if (!/^[0-9A-F]{6,16}$/.test(cleanUid)) {
      setManualError('El UID debe ser hexadecimal (6–16 caracteres).');
      return;
    }
    if (credenciales.some((c) => c.uid === cleanUid)) {
      setManualError('Esta credencial ya está registrada en el inventario.');
      return;
    }

    setSaving(true);
    try {
      await registrarCredencial(cleanUid);
      toast.success(`Credencial ${cleanUid} registrada`);
      setManualUid('');
      setShowManual(false);
    } catch {
      toast.error('Error al registrar la credencial');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Credenciales RFID</h1>
            <p className="text-sm text-gray-500">Inventario de chips físicos registrados en el sistema.</p>
          </div>
        </div>
        <button onClick={() => { setShowManual(true); setManualError(null); setManualUid(''); }} className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>Registrar UID Manual</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Registradas', value: total,            color: 'text-white',         bg: 'bg-white/5',           border: 'border-white/10' },
          { label: 'Disponibles',       value: totalDisponibles, color: 'text-emerald-400',   bg: 'bg-emerald-500/5',     border: 'border-emerald-500/15' },
          { label: 'Asignadas',         value: totalAsignadas,   color: 'text-accent-cyan',   bg: 'bg-accent-cyan/5',     border: 'border-accent-cyan/15' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`rounded-xl border ${border} ${bg} p-5`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`mt-2 text-3xl font-black ${color}`}>{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-surface-border bg-surface-card p-4 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por UID o usuario asignado..."
            className="input pl-9"
          />
        </div>
        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="input">
          <option value="all">Estado: Todos</option>
          <option value="disponible">Disponibles</option>
          <option value="asignada">Asignadas</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border-b border-red-500/20 px-6 py-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <span className="text-sm text-gray-500">Cargando credenciales...</span>
          </div>
        ) : filteredCreds.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <CreditCard className="h-8 w-8 text-gray-700" />
            <span className="text-sm text-gray-500">No se encontraron credenciales</span>
            <p className="text-xs text-gray-600">Usa la Estación RFID para registrar chips con el lector.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-[#131622] text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-surface-border">
                <tr>
                  <th className="px-6 py-4">UID</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Asignada a</th>
                  <th className="px-6 py-4">Fecha de Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {filteredCreds.map((c) => (
                  <tr key={c.uid} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-surface/80 border border-surface-border/80 px-2 py-0.5 rounded text-gray-300">
                        {c.uid}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${c.estado === 'disponible' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-accent-cyan/10 text-accent-cyan'}`}>
                        {c.estado === 'disponible'
                          ? <><CheckCircle2 className="h-3 w-3" /> Disponible</>
                          : <><User className="h-3 w-3" /> Asignada</>
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {c.asignada_a ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(c.fecha_registro).toLocaleString('es')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal registro manual */}
      {showManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowManual(false)} />
          <div className="relative w-full max-w-sm bg-[#1a1d27] border border-white/8 rounded-2xl shadow-2xl">
            <div className="h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-400/60 to-cyan-500/0" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-cyan-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Registrar UID Manual</h2>
              </div>
              <button onClick={() => setShowManual(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {manualError && (
                <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{manualError}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">UID del Chip</label>
                <input
                  type="text"
                  value={manualUid}
                  onChange={(e) => setManualUid(e.target.value.toUpperCase())}
                  placeholder="Ej: A1B2C3D4"
                  maxLength={16}
                  className="input font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleRegistrarManual()}
                />
                <p className="text-[10px] text-gray-600">
                  Para registrar automáticamente con el lector, usa la Estación RFID.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/6">
              <button onClick={() => setShowManual(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                Cancelar
              </button>
              <button onClick={handleRegistrarManual} disabled={saving} className="btn-primary min-w-[120px] justify-center">
                {saving ? 'Guardando…' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
