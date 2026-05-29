// ============================================================
// components/ui/Badge.tsx
// Badge reutilizable con variantes de color
// ============================================================
import type { ReactNode } from 'react';

type BadgeVariant =
  | 'green'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'cyan'
  | 'purple'
  | 'gray';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  green:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  blue:   'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  red:    'bg-red-500/15 text-red-400 border border-red-500/20',
  yellow: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  cyan:   'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  gray:   'bg-gray-500/15 text-gray-400 border border-gray-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
  green:  'bg-emerald-400',
  blue:   'bg-blue-400',
  red:    'bg-red-400',
  yellow: 'bg-amber-400',
  cyan:   'bg-cyan-400',
  purple: 'bg-purple-400',
  gray:   'bg-gray-400',
};

export function Badge({ children, variant = 'gray', dot = false }: BadgeProps) {
  return (
    <span className={`badge ${variantClasses[variant]}`}>
      {dot && (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
