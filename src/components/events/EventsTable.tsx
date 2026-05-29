// ============================================================
// components/events/EventsTable.tsx
// Tabla de eventos con búsqueda, filtros y highlight de nuevos
// ============================================================
import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { TipoBadge, ResultadoBadge } from './EventBadge';
import { EmptyState } from '../ui/EmptyState';
import type { EventoAcceso } from '../../types';

type FilterTipo = 'todos' | 'entrada' | 'salida';

interface EventsTableProps {
  eventos: EventoAcceso[];
  /** ID del evento más reciente para animar la fila */
  newestId?: string;
}

export function EventsTable({ eventos, newestId }: EventsTableProps) {
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<FilterTipo>('todos');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return eventos.filter((e) => {
      const matchSearch =
        !q ||
        e.nombre.toLowerCase().includes(q) ||
        e.uid.toLowerCase().includes(q);
      const matchFilter =
        filter === 'todos' || e.tipo === filter;
      return matchSearch && matchFilter;
    });
  }, [eventos, search, filter]);

  const FILTER_BUTTONS: { label: string; value: FilterTipo }[] = [
    { label: 'Todos',   value: 'todos'   },
    { label: 'Entrada', value: 'entrada' },
    { label: 'Salida',  value: 'salida'  },
  ];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-surface-muted p-1">
          <Filter className="ml-1 h-3.5 w-3.5 text-gray-500" />
          {FILTER_BUTTONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150
                ${filter === value
                  ? 'bg-surface-card text-white shadow'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <EmptyState message="No se encontraron eventos con ese criterio" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden md:table-cell">
                    UID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map((ev) => {
                  const isNew = ev.id === newestId;
                  return (
                    <tr
                      key={ev.id}
                      className={`transition-colors duration-200 hover:bg-surface-muted/40
                        ${isNew ? 'animate-highlight' : ''}`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400 font-mono">
                        {format(new Date(ev.timestamp), 'dd/MM HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{ev.nombre}</td>
                      <td className="hidden px-4 py-3 font-mono text-xs text-gray-500 md:table-cell">
                        {ev.uid}
                      </td>
                      <td className="px-4 py-3">
                        <TipoBadge tipo={ev.tipo} />
                      </td>
                      <td className="px-4 py-3">
                        <ResultadoBadge resultado={ev.resultado} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="border-t border-surface-border px-4 py-2.5 text-xs text-gray-600">
            Mostrando {filtered.length} de {eventos.length} eventos
          </div>
        )}
      </div>
    </div>
  );
}
