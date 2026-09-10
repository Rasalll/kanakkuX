// ─── Core Domain Types ──────────────────────────────────────────────────────

export type PaymentMethod = 'UPI' | 'Cash' | 'Bank Transfer' | 'Card' | 'Other';
export type LentVia = 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
export type LendingStatus = 'pending' | 'partial' | 'paid' | 'overdue';

// ─── Profiles ───────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Money Sources ───────────────────────────────────────────────────────────

export interface Source {
  id: string;
  user_id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  user_id: string | null; // null = global default category
  name: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category_id: string | null;
  source_id: string | null;
  payment_method: PaymentMethod;
  date: string; // YYYY-MM-DD
  note: string | null;
  receipt_url: string | null;
  receipt_public_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category | null;
  source?: Source | null;
}

// ─── Income ──────────────────────────────────────────────────────────────────

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  source_id: string | null;
  payment_method: PaymentMethod;
  date: string; // YYYY-MM-DD
  note: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  source?: Source | null;
}

// ─── Lending ─────────────────────────────────────────────────────────────────

export interface Lending {
  id: string;
  user_id: string;
  person_name: string;
  phone_number: string | null;
  original_amount: number;
  lent_via: LentVia;
  lent_date: string; // YYYY-MM-DD
  duration_days: number | null;
  due_date: string; // YYYY-MM-DD
  note: string | null;
  status: LendingStatus;
  created_at: string;
  updated_at: string;
  // Computed
  repayments?: Repayment[];
  amount_received?: number;
  remaining?: number;
}

// ─── Repayments ──────────────────────────────────────────────────────────────

export interface Repayment {
  id: string;
  user_id: string;
  lending_id: string;
  amount: number;
  received_via: LentVia;
  date: string; // YYYY-MM-DD
  note: string | null;
  created_at: string;
}

// ─── Dashboard Summary ───────────────────────────────────────────────────────

export interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  balance: number;
  total_owed: number;
  total_pending_lending: number;
}

// ─── Unified Transaction (for transactions list) ──────────────────────────────

export type TransactionType = 'expense' | 'income' | 'lending' | 'repayment';

export interface UnifiedTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  subtitle: string;
  category_name?: string;
  category_color?: string;
  source_name?: string;
  payment_method?: string;
  status?: LendingStatus;
}
