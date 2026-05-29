// ============================================================
// components/ui/Spinner.tsx
// ============================================================
interface SpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ message = 'Cargando...', size = 'md' }: SpinnerProps) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-2 border-surface-muted border-t-accent-cyan`}
      />
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
