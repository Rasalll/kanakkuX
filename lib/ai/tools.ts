import { addDays, todayISO } from '@/lib/utils';

export const ALLOWED_TOOLS = [
  'get_expense_summary',
  'get_expenses_by_category',
  'get_largest_expense',
  'get_top_categories',
  'get_income_summary',
  'get_income_by_source',
  'get_spend_by_source',
  'get_lending_summary',
  'get_person_lending',
  'get_repayment_summary',
  'get_overdue_lending',
  'get_monthly_comparison',
  'clarify',
] as const;

export type ToolName = (typeof ALLOWED_TOOLS)[number];

export type PeriodToken =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'last_n_days'
  | 'named_month'
  | 'explicit';

export interface RawToolCall {
  tool?: string;
  period?: string;
  category?: string | null;
  source?: string | null;
  person?: string | null;
  limit?: number | null;
  from?: string | null;
  to?: string | null;
  last_n_days?: number | null;
  month?: number | null;
  year?: number | null;
  compare_period?: string | null;
  clarification?: string | null;
}

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

export interface ValidatedToolCall {
  tool: ToolName;
  range: DateRange;
  compareRange: DateRange | null;
  category: string | null;
  source: string | null;
  person: string | null;
  limit: number;
  clarification: string | null;
}

const PERIODS = new Set<PeriodToken>([
  'today',
  'yesterday',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'this_year',
  'last_year',
  'last_n_days',
  'named_month',
  'explicit',
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

function parseISODate(value: string | null | undefined): string | null {
  if (!value || !ISO_DATE.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  if (y < 2000 || y > 2100) return null;
  return value;
}

function monthBounds(year: number, monthIndex: number): DateRange {
  const fromDate = new Date(year, monthIndex, 1);
  const toDate = new Date(year, monthIndex + 1, 0);
  const from = toISO(fromDate);
  const to = toISO(toDate);
  const label = fromDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  return { from, to, label };
}

function toISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeekMonday(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0 Sun
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return toISO(date);
}

export function resolvePeriod(raw: RawToolCall, fallback: PeriodToken = 'this_month'): DateRange {
  const today = todayISO();
  let period = (raw.period || fallback) as PeriodToken;
  if (!PERIODS.has(period)) period = fallback;

  if (period === 'explicit') {
    const from = parseISODate(raw.from);
    const to = parseISODate(raw.to);
    if (from && to && from <= to) {
      return { from, to, label: from === to ? from : `${from} to ${to}` };
    }
    period = fallback;
  }

  if (period === 'last_n_days') {
    const n = Math.min(365, Math.max(1, Number(raw.last_n_days) || 30));
    return { from: addDays(today, -(n - 1)), to: today, label: `the last ${n} days` };
  }

  if (period === 'named_month') {
    let monthIndex: number | null = null;
    if (typeof raw.month === 'number' && raw.month >= 1 && raw.month <= 12) {
      monthIndex = raw.month - 1;
    }
    const now = new Date();
    let year = typeof raw.year === 'number' && raw.year >= 2000 && raw.year <= 2100 ? raw.year : now.getFullYear();
    if (monthIndex === null) {
      return resolvePeriod({ period: fallback });
    }
    if (year === now.getFullYear() && monthIndex > now.getMonth()) {
      year -= 1;
    }
    return monthBounds(year, monthIndex);
  }

  switch (period) {
    case 'today':
      return { from: today, to: today, label: 'today' };
    case 'yesterday': {
      const y = addDays(today, -1);
      return { from: y, to: y, label: 'yesterday' };
    }
    case 'this_week': {
      const from = startOfWeekMonday(today);
      return { from, to: today, label: 'this week' };
    }
    case 'last_week': {
      const thisMonday = startOfWeekMonday(today);
      const lastMonday = addDays(thisMonday, -7);
      return { from: lastMonday, to: addDays(thisMonday, -1), label: 'last week' };
    }
    case 'last_month': {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return monthBounds(d.getFullYear(), d.getMonth());
    }
    case 'this_year': {
      const y = new Date().getFullYear();
      return { from: `${y}-01-01`, to: today, label: String(y) };
    }
    case 'last_year': {
      const y = new Date().getFullYear() - 1;
      return { from: `${y}-01-01`, to: `${y}-12-31`, label: String(y) };
    }
    case 'this_month':
    default: {
      const now = new Date();
      const range = monthBounds(now.getFullYear(), now.getMonth());
      return { ...range, label: 'this month' };
    }
  }
}

function cleanText(value: unknown, max = 120): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export function validateToolCall(raw: unknown): ValidatedToolCall | { error: string } {
  if (!raw || typeof raw !== 'object') {
    return { error: 'I could not understand that question. Try asking about expenses, income, or money owed.' };
  }

  const input = raw as RawToolCall;
  const tool = input.tool as ToolName;
  if (!ALLOWED_TOOLS.includes(tool)) {
    return { error: 'I can only answer questions about your expenses, income, money sources, and lending.' };
  }

  if (tool === 'clarify') {
    return {
      tool,
      range: resolvePeriod({ period: 'this_month' }),
      compareRange: null,
      category: null,
      source: null,
      person: null,
      limit: 3,
      clarification: cleanText(input.clarification, 240) || 'Could you be more specific about the period or person?',
    };
  }

  const range = resolvePeriod(input);
  const compareRange =
    tool === 'get_monthly_comparison'
      ? resolvePeriod({ period: input.compare_period || 'last_month' })
      : null;

  const limit = Math.min(10, Math.max(1, Number(input.limit) || 3));

  return {
    tool,
    range,
    compareRange,
    category: cleanText(input.category),
    source: cleanText(input.source),
    person: cleanText(input.person),
    limit,
    clarification: null,
  };
}

export function parseMonthName(text: string): number | null {
  const lower = text.toLowerCase();
  const idx = MONTH_NAMES.findIndex(name => lower.includes(name));
  return idx >= 0 ? idx + 1 : null;
}
