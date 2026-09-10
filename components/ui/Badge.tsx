'use client';

import { cn } from '@/lib/utils';
import { LendingStatus } from '@/lib/types';

type BadgeVariant = 'pending' | 'partial' | 'paid' | 'overdue' | 'income' | 'expense' | 'lending';

const variants: Record<BadgeVariant, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  partial: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  paid: 'bg-green-500/15 text-green-400 border-green-500/20',
  overdue: 'bg-red-500/15 text-red-400 border-red-500/20',
  income: 'bg-green-500/15 text-green-400 border-green-500/20',
  expense: 'bg-red-500/15 text-red-400 border-red-500/20',
  lending: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

export function Badge({ variant, label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

export function LendingStatusBadge({ status }: { status: LendingStatus }) {
  const map: Record<LendingStatus, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'pending', label: 'Pending' },
    partial: { variant: 'partial', label: 'Partial' },
    paid: { variant: 'paid', label: 'Paid' },
    overdue: { variant: 'overdue', label: 'Overdue' },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant} label={label} />;
}
