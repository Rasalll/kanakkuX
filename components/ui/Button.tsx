'use client';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'danger' | 'ghost' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 disabled:opacity-60',
  danger:
    'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30',
  ghost:
    'bg-transparent hover:bg-surface-3 text-tx-2 hover:text-tx',
  secondary:
    'bg-surface-2 hover:bg-surface-3 text-tx border border-border hover:border-border-light',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-sm px-5 py-3 rounded-xl gap-2 font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all',
        variantClasses[variant],
        sizeClasses[size],
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
