// ============================================================
// components/events/EventBadge.tsx
// Badges coloreados para tipo y resultado de evento
// ============================================================
import { Badge } from '../ui/Badge';
import type { EventoAcceso } from '../../types';

export function TipoBadge({ tipo }: { tipo: EventoAcceso['tipo'] }) {
  return (
    <Badge variant={tipo === 'entrada' ? 'green' : 'blue'} dot>
      {tipo === 'entrada' ? 'Entrada' : 'Salida'}
    </Badge>
  );
}

export function ResultadoBadge({ resultado }: { resultado: EventoAcceso['resultado'] }) {
  const variant =
    resultado === 'permitido'    ? 'green' :
    resultado === 'denegado'     ? 'red'   : 'yellow';

  return (
    <Badge variant={variant} dot>
      {resultado.charAt(0).toUpperCase() + resultado.slice(1)}
    </Badge>
  );
}
