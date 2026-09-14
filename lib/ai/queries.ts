import { formatCurrency, formatDate, computeLendingStatus } from '@/lib/utils';
import { ValidatedToolCall } from '@/lib/ai/tools';
import type { SupabaseClient } from '@supabase/supabase-js';

type Db = SupabaseClient;

function money(n: number): string {
  return formatCurrency(Number(n) || 0);
}

function mapStatus(status: string): string {
  if (status === 'partially_paid' || status === 'partial') return 'Partially paid';
  if (status === 'paid' || status === 'settled') return 'Paid';
  if (status === 'overdue') return 'Overdue';
  return 'Pending';
}

async function findCategoryIds(supabase: Db, userId: string, name: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
    .ilike('name', `%${name}%`);
  if (error) throw new Error('Could not look up categories.');
  return data ?? [];
}

async function findSourceIds(supabase: Db, userId: string, name: string) {
  const { data, error } = await supabase
    .from('sources')
    .select('id, name')
    .eq('user_id', userId)
    .ilike('name', `%${name}%`);
  if (error) throw new Error('Could not look up money sources.');
  return data ?? [];
}

async function expenseRows(
  supabase: Db,
  userId: string,
  from: string,
  to: string,
  extra?: { categoryIds?: string[]; sourceIds?: string[] }
) {
  let q = supabase
    .from('expenses')
    .select('id, amount, date, note, payment_method, category_id, source_id, category:categories(name), source:sources(name)')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('amount', { ascending: false })
    .limit(2000);

  if (extra?.categoryIds?.length) q = q.in('category_id', extra.categoryIds);
  if (extra?.sourceIds?.length) q = q.in('source_id', extra.sourceIds);

  const { data, error } = await q;
  if (error) throw new Error('Could not load expenses.');
  return data ?? [];
}

async function incomeRows(
  supabase: Db,
  userId: string,
  from: string,
  to: string,
  sourceIds?: string[]
) {
  let q = supabase
    .from('income')
    .select('id, amount, date, note, payment_method, source_id, source:sources(name)')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('amount', { ascending: false })
    .limit(2000);

  if (sourceIds?.length) q = q.in('source_id', sourceIds);

  const { data, error } = await q;
  if (error) throw new Error('Could not load income.');
  return data ?? [];
}

function sumAmounts(rows: Array<{ amount: number | string }>): number {
  return rows.reduce((s, r) => s + Number(r.amount), 0);
}

function categoryName(row: { category?: { name?: string } | { name?: string }[] | null }): string {
  const cat = row.category;
  if (Array.isArray(cat)) return cat[0]?.name || 'Uncategorized';
  return cat?.name || 'Uncategorized';
}

function sourceName(row: { source?: { name?: string } | { name?: string }[] | null }): string {
  const src = row.source;
  if (Array.isArray(src)) return src[0]?.name || 'Unspecified';
  return src?.name || 'Unspecified';
}

export async function runTool(
  supabase: Db,
  userId: string,
  call: ValidatedToolCall
): Promise<Record<string, unknown>> {
  if (call.tool === 'clarify') {
    return { type: 'clarify', message: call.clarification };
  }

  const { range } = call;

  switch (call.tool) {
    case 'get_expense_summary': {
      const rows = await expenseRows(supabase, userId, range.from, range.to);
      const total = sumAmounts(rows);
      const byCategory: Record<string, number> = {};
      for (const row of rows) {
        const name = categoryName(row);
        byCategory[name] = (byCategory[name] || 0) + Number(row.amount);
      }
      const breakdown = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount: money(amount) }));

      return {
        type: 'expense_summary',
        period: range.label,
        from: range.from,
        to: range.to,
        count: rows.length,
        total: money(total),
        total_raw: total,
        breakdown,
        empty: rows.length === 0,
      };
    }

    case 'get_expenses_by_category': {
      if (!call.category) {
        return { type: 'clarify', message: 'Which category should I look at?' };
      }
      const cats = await findCategoryIds(supabase, userId, call.category);
      if (cats.length === 0) {
        return {
          type: 'expenses_by_category',
          period: range.label,
          category: call.category,
          empty: true,
          found_category: false,
        };
      }
      const rows = await expenseRows(supabase, userId, range.from, range.to, {
        categoryIds: cats.map(c => c.id),
      });
      return {
        type: 'expenses_by_category',
        period: range.label,
        category: cats[0].name,
        count: rows.length,
        total: money(sumAmounts(rows)),
        empty: rows.length === 0,
        found_category: true,
      };
    }

    case 'get_largest_expense': {
      const rows = await expenseRows(supabase, userId, range.from, range.to);
      const top = rows[0];
      if (!top) {
        return { type: 'largest_expense', period: range.label, empty: true };
      }
      return {
        type: 'largest_expense',
        period: range.label,
        empty: false,
        amount: money(Number(top.amount)),
        category: categoryName(top),
        date: formatDate(top.date),
        note: top.note || null,
        payment_method: top.payment_method,
      };
    }

    case 'get_top_categories': {
      const rows = await expenseRows(supabase, userId, range.from, range.to);
      const byCategory: Record<string, number> = {};
      for (const row of rows) {
        const name = categoryName(row);
        byCategory[name] = (byCategory[name] || 0) + Number(row.amount);
      }
      const top = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, call.limit)
        .map(([name, amount]) => ({ name, amount: money(amount) }));
      return {
        type: 'top_categories',
        period: range.label,
        empty: top.length === 0,
        categories: top,
      };
    }

    case 'get_income_summary': {
      const rows = await incomeRows(supabase, userId, range.from, range.to);
      const bySource: Record<string, number> = {};
      for (const row of rows) {
        const name = sourceName(row);
        bySource[name] = (bySource[name] || 0) + Number(row.amount);
      }
      const breakdown = Object.entries(bySource)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount: money(amount) }));
      return {
        type: 'income_summary',
        period: range.label,
        count: rows.length,
        total: money(sumAmounts(rows)),
        breakdown,
        empty: rows.length === 0,
      };
    }

    case 'get_income_by_source': {
      if (!call.source) {
        return { type: 'clarify', message: 'Which money source should I look at?' };
      }
      const sources = await findSourceIds(supabase, userId, call.source);
      if (sources.length === 0) {
        return {
          type: 'income_by_source',
          period: range.label,
          source: call.source,
          found_source: false,
          empty: true,
        };
      }
      const rows = await incomeRows(
        supabase,
        userId,
        range.from,
        range.to,
        sources.map(s => s.id)
      );
      return {
        type: 'income_by_source',
        period: range.label,
        source: sources[0].name,
        found_source: true,
        count: rows.length,
        total: money(sumAmounts(rows)),
        empty: rows.length === 0,
      };
    }

    case 'get_spend_by_source': {
      if (!call.source) {
        return { type: 'clarify', message: 'Which money source should I look at?' };
      }
      const sources = await findSourceIds(supabase, userId, call.source);
      if (sources.length === 0) {
        return {
          type: 'spend_by_source',
          period: range.label,
          source: call.source,
          found_source: false,
          empty: true,
        };
      }
      const rows = await expenseRows(supabase, userId, range.from, range.to, {
        sourceIds: sources.map(s => s.id),
      });
      return {
        type: 'spend_by_source',
        period: range.label,
        source: sources[0].name,
        found_source: true,
        count: rows.length,
        total: money(sumAmounts(rows)),
        empty: rows.length === 0,
      };
    }

    case 'get_lending_summary': {
      const { data, error } = await supabase
        .from('lending')
        .select('id, person_name, original_amount, lent_date, due_date, status, repayments(amount)')
        .eq('user_id', userId)
        .limit(500);
      if (error) throw new Error('Could not load lending.');
      const rows = data ?? [];
      let totalOriginal = 0;
      let totalReceived = 0;
      let totalRemaining = 0;
      let overdueCount = 0;
      let pendingPeople = 0;
      const people: Array<{ person: string; remaining: string; status: string }> = [];

      for (const row of rows) {
        const original = Number(row.original_amount);
        const received = (row.repayments ?? []).reduce(
          (s: number, r: { amount: number }) => s + Number(r.amount),
          0
        );
        const remaining = Math.max(0, original - received);
        const status = computeLendingStatus(original, received, row.due_date || '9999-12-31');
        totalOriginal += original;
        totalReceived += received;
        if (remaining > 0) {
          totalRemaining += remaining;
          pendingPeople += 1;
          people.push({
            person: row.person_name,
            remaining: money(remaining),
            status: mapStatus(status),
          });
        }
        if (status === 'overdue') overdueCount += 1;
      }

      return {
        type: 'lending_summary',
        note: 'Money lent is a receivable, not an expense. Repayments are not new income.',
        people_owing: pendingPeople,
        total_original: money(totalOriginal),
        total_received: money(totalReceived),
        total_remaining: money(totalRemaining),
        overdue_count: overdueCount,
        people: people.slice(0, 8),
        empty: pendingPeople === 0,
      };
    }

    case 'get_person_lending': {
      if (!call.person) {
        return { type: 'clarify', message: 'Who should I look up?' };
      }
      const { data, error } = await supabase
        .from('lending')
        .select(
          'id, person_name, original_amount, lent_date, due_date, lent_via, status, note, repayments(amount, date, received_via, note)'
        )
        .eq('user_id', userId)
        .ilike('person_name', `%${call.person}%`)
        .limit(20);
      if (error) throw new Error('Could not load lending.');
      const rows = data ?? [];
      if (rows.length === 0) {
        return { type: 'person_lending', person: call.person, empty: true };
      }

      const records = rows.map(row => {
        const original = Number(row.original_amount);
        const received = (row.repayments ?? []).reduce(
          (s: number, r: { amount: number }) => s + Number(r.amount),
          0
        );
        const remaining = Math.max(0, original - received);
        const status = computeLendingStatus(original, received, row.due_date || '9999-12-31');
        return {
          person: row.person_name,
          original: money(original),
          received: money(received),
          remaining: money(remaining),
          due_date: row.due_date ? formatDate(row.due_date) : null,
          lent_date: formatDate(row.lent_date),
          lent_via: row.lent_via,
          status: mapStatus(status),
          repayment_count: (row.repayments ?? []).length,
        };
      });

      return { type: 'person_lending', empty: false, records };
    }

    case 'get_repayment_summary': {
      let lendingIds: string[] | null = null;
      let personLabel: string | null = null;
      if (call.person) {
        const { data, error } = await supabase
          .from('lending')
          .select('id, person_name')
          .eq('user_id', userId)
          .ilike('person_name', `%${call.person}%`);
        if (error) throw new Error('Could not load lending.');
        const matches = data ?? [];
        if (matches.length === 0) {
          return { type: 'repayment_summary', person: call.person, empty: true };
        }
        lendingIds = matches.map(m => m.id);
        personLabel = matches[0].person_name;
      }

      let q = supabase
        .from('repayments')
        .select('amount, date, received_via, lending_id')
        .eq('user_id', userId)
        .gte('date', range.from)
        .lte('date', range.to)
        .limit(2000);
      if (lendingIds) q = q.in('lending_id', lendingIds);

      const { data, error } = await q;
      if (error) throw new Error('Could not load repayments.');
      const rows = data ?? [];
      return {
        type: 'repayment_summary',
        period: range.label,
        person: personLabel,
        count: rows.length,
        total: money(sumAmounts(rows)),
        empty: rows.length === 0,
        note: 'Repayments are not counted as new income.',
      };
    }

    case 'get_overdue_lending': {
      const { data, error } = await supabase
        .from('lending')
        .select('person_name, original_amount, due_date, repayments(amount)')
        .eq('user_id', userId)
        .limit(500);
      if (error) throw new Error('Could not load lending.');
      const overdue = (data ?? [])
        .map(row => {
          const original = Number(row.original_amount);
          const received = (row.repayments ?? []).reduce(
            (s: number, r: { amount: number }) => s + Number(r.amount),
            0
          );
          const remaining = Math.max(0, original - received);
          const status = computeLendingStatus(original, received, row.due_date || '9999-12-31');
          return { row, original, received, remaining, status };
        })
        .filter(x => x.status === 'overdue')
        .map(x => ({
          person: x.row.person_name,
          remaining: money(x.remaining),
          due_date: x.row.due_date ? formatDate(x.row.due_date) : null,
        }));

      return {
        type: 'overdue_lending',
        count: overdue.length,
        people: overdue.slice(0, 10),
        empty: overdue.length === 0,
      };
    }

    case 'get_monthly_comparison': {
      const other = call.compareRange || range;
      const a = await expenseRows(supabase, userId, range.from, range.to);
      const b = await expenseRows(supabase, userId, other.from, other.to);
      const incA = await incomeRows(supabase, userId, range.from, range.to);
      const incB = await incomeRows(supabase, userId, other.from, other.to);
      return {
        type: 'monthly_comparison',
        period_a: range.label,
        period_b: other.label,
        expenses_a: money(sumAmounts(a)),
        expenses_b: money(sumAmounts(b)),
        income_a: money(sumAmounts(incA)),
        income_b: money(sumAmounts(incB)),
      };
    }

    default:
      return { type: 'unsupported' };
  }
}

export function templateReply(result: Record<string, unknown>): string {
  if (result.type === 'clarify') return String(result.message || 'Could you be more specific?');

  if (result.empty) {
    if (result.type === 'expenses_by_category' && result.found_category === false) {
      return `I couldn't find a category named "${result.category}".`;
    }
    if (result.type === 'income_by_source' && result.found_source === false) {
      return `I couldn't find a money source named "${result.source}".`;
    }
    if (result.type === 'spend_by_source' && result.found_source === false) {
      return `I couldn't find a money source named "${result.source}".`;
    }
    if (result.type === 'person_lending') {
      return `I couldn't find lending records for ${result.person}.`;
    }
    if (result.type === 'expenses_by_category') {
      return `I couldn't find any ${result.category} expenses for ${result.period}.`;
    }
    if (result.type === 'income_summary') {
      return `I couldn't find any income for ${result.period}.`;
    }
    if (result.type === 'lending_summary') {
      const original = String(result.total_original || '');
      if (original && original !== '₹0') {
        return `You have lent ${original} in total. Nobody currently owes you money — remaining is ₹0.`;
      }
      return 'I could not find any money lent, and nobody currently owes you.';
    }
    if (result.type === 'overdue_lending') {
      return 'You have no overdue lending records.';
    }
    if (result.type === 'largest_expense') {
      return `I couldn't find any expenses for ${result.period}.`;
    }
    return `I couldn't find matching records for ${result.period || 'that request'}.`;
  }

  switch (result.type) {
    case 'expense_summary': {
      const parts = [`You spent ${result.total} ${result.period}.`];
      const breakdown = result.breakdown as Array<{ name: string; amount: string }> | undefined;
      if (breakdown?.length) {
        parts.push(breakdown.map(b => `${b.name} ${b.amount}`).join(', ') + '.');
      }
      return parts.join(' ');
    }
    case 'expenses_by_category':
      return `You spent ${result.total} on ${result.category} ${result.period}.`;
    case 'largest_expense':
      return `Your biggest expense ${result.period} was ${result.amount} on ${result.category}${result.note ? ` (${result.note})` : ''} on ${result.date}.`;
    case 'top_categories': {
      const cats = result.categories as Array<{ name: string; amount: string }>;
      return `Your top categories ${result.period}: ${cats.map(c => `${c.name} ${c.amount}`).join(', ')}.`;
    }
    case 'income_summary':
      return `You received ${result.total} in income ${result.period}.`;
    case 'income_by_source':
      return `You received ${result.total} from ${result.source} ${result.period}.`;
    case 'spend_by_source':
      return `You spent ${result.total} from your ${result.source} money source ${result.period}.`;
    case 'lending_summary': {
      const people = result.people as Array<{ person: string; remaining: string }>;
      const names = people.slice(0, 5).map(p => `${p.person} (${p.remaining})`).join(', ');
      return `${result.people_owing} ${Number(result.people_owing) === 1 ? 'person owes' : 'people owe'} you ${result.total_remaining} in total.${names ? ` ${names}.` : ''}`;
    }
    case 'person_lending': {
      const records = result.records as Array<{
        person: string;
        original: string;
        received: string;
        remaining: string;
        status: string;
        due_date: string | null;
      }>;
      return records
        .map(
          r =>
            `${r.person} still owes you ${r.remaining}. Original ${r.original}, received ${r.received}. Status: ${r.status}${r.due_date ? `, due ${r.due_date}` : ''}.`
        )
        .join(' ');
    }
    case 'repayment_summary':
      return `You received ${result.total} in repayments ${result.person ? `from ${result.person} ` : ''}${result.period}. Repayments are not counted as new income.`;
    case 'overdue_lending': {
      const people = result.people as Array<{ person: string; remaining: string }>;
      return `Overdue: ${people.map(p => `${p.person} ${p.remaining}`).join(', ')}.`;
    }
    case 'monthly_comparison':
      return `${result.period_a}: expenses ${result.expenses_a}, income ${result.income_a}. ${result.period_b}: expenses ${result.expenses_b}, income ${result.income_b}.`;
    default:
      return 'I could not find the requested information.';
  }
}
