export type TabType = 'dashboard' | 'expenses' | 'income' | 'owed';

export interface ExpenseItem {
  id: string;
  title: string;
  note?: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Entertainment' | 'Health' | 'Subs' | string;
  categoryId?: string;
  source?: string;
  sourceId?: string | null;
  paymentMethod: 'UPI' | 'Card' | 'Cash' | 'Bank' | 'Bank Transfer' | 'Other' | string;
  date: string;
  createdAt: number;
}

export interface IncomeItem {
  id: string;
  title: string;
  note?: string;
  amount: number;
  source: 'Salary' | 'Freelance' | 'Investments' | 'Rental' | 'Refund' | 'Bonus' | 'Other' | string;
  sourceId?: string | null;
  destination: 'Bank Transfer' | 'UPI' | 'Card' | 'Cash' | 'Other' | string;
  date: string;
  createdAt: number;
}

export interface LoanRepayment {
  id: string;
  amount: number;
  date: string;
  method: string;
  note?: string;
}

export interface LoanItem {
  id: string;
  personName: string;
  avatarUrl?: string;
  type?: 'lent' | 'loan';
  amountLent: number;
  amountReceived: number;
  remaining: number;
  dateLent: string;
  channel: 'UPI' | 'Cash' | 'Bank' | 'Bank Transfer' | 'Other' | string;
  note: string;
  status: 'pending' | 'partial' | 'settled';
  repayments: LoanRepayment[];
  createdAt: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'expense' | 'income' | 'lent' | 'repayment';
  title: string;
  subtitle: string;
  amount: number;
  tag: string;
  method: string;
  dateText: string;
  rawDate: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}
