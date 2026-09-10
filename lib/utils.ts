import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LendingStatus } from './types';

// ─── Tailwind class merge helper ─────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Formatting ─────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Date Utilities ──────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD (local timezone, no UTC shift) */
export function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Add N days to a YYYY-MM-DD string, returns YYYY-MM-DD */
export function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Days difference between two YYYY-MM-DD strings (b - a) */
export function daysDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const dateA = new Date(ay, am - 1, ad);
  const dateB = new Date(by, bm - 1, bd);
  return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}

/** Human-readable date e.g. "Sep 10, 2026" */
export function formatDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Relative date: "Today", "Yesterday", "Sep 8" etc. */
export function relativeDate(dateISO: string): string {
  const today = todayISO();
  const diff = daysDiff(dateISO, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff === -1) return 'Tomorrow';
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

// ─── Lending Helpers ─────────────────────────────────────────────────────────

/** Compute lending status based on received amount and due date */
export function computeLendingStatus(
  originalAmount: number,
  amountReceived: number,
  dueDateISO: string
): LendingStatus {
  const remaining = originalAmount - amountReceived;
  if (remaining <= 0) return 'paid';
  if (amountReceived > 0) return 'partial';
  const today = todayISO();
  if (dueDateISO < today) return 'overdue';
  return 'pending';
}

/** Human-readable due label */
export function dueDateLabel(dueDateISO: string): {
  label: string;
  color: string;
} {
  const today = todayISO();
  const diff = daysDiff(today, dueDateISO); // positive = future, negative = past

  if (diff > 0) return { label: `Due in ${diff} day${diff === 1 ? '' : 's'}`, color: 'text-amber-400' };
  if (diff === 0) return { label: 'Due today', color: 'text-orange-400' };
  return { label: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}`, color: 'text-red-400' };
}

// ─── Status Badge Config ─────────────────────────────────────────────────────

export const LENDING_STATUS_CONFIG: Record<
  LendingStatus,
  { label: string; bg: string; text: string }
> = {
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  partial: { label: 'Partial', bg: 'bg-blue-500/15', text: 'text-blue-400' },
  paid: { label: 'Paid', bg: 'bg-green-500/15', text: 'text-green-400' },
  overdue: { label: 'Overdue', bg: 'bg-red-500/15', text: 'text-red-400' },
};
