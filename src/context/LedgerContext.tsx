'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ExpenseItem, IncomeItem, LoanItem, TabType } from '../types';
import { createClient } from '@/lib/supabase/client';
import { PaymentMethod, LentVia } from '@/lib/types';

interface CategoryRow {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface SourceRow {
  id: string;
  name: string;
  is_archived?: boolean;
}

interface LedgerContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  expenses: ExpenseItem[];
  incomes: IncomeItem[];
  loans: LoanItem[];
  currentMonthIndex: number;
  months: string[];
  currentMonth: string;
  prevMonth: () => void;
  nextMonth: () => void;
  isBalanceHidden: boolean;
  toggleBalanceHidden: () => void;
  currency: string;
  setCurrency: (c: string) => void;
  
  totalMonthlySpend: number;
  totalMonthlyIncome: number;
  totalAmountOwed: number;
  netLiquidBalance: number;
  burnCap: number;
  burnConsumedPercent: number;
  burnCushionLeft: number;
  categoryBreakdown: Array<{ name: string; amount: number; percent: number; colorClass: string }>;
  incomeSourceBreakdown: Array<{ source: string; amount: number; percent: number; colorClass: string }>;
  loanMetrics: {
    pendingCount: number;
    pendingAmount: number;
    partialCount: number;
    partialAmount: number;
    settledCount: number;
    settledAmount: number;
    totalCount: number;
  };

  addExpense: (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => Promise<void>;
  editExpense: (id: string, data: Partial<ExpenseItem>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addIncome: (income: Omit<IncomeItem, 'id' | 'createdAt'>) => Promise<void>;
  editIncome: (id: string, data: Partial<IncomeItem>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addLoan: (loan: { personName: string; amountLent: number; dateLent: string; channel: string; note: string; avatarUrl?: string }) => Promise<void>;
  recordLoanRepayment: (loanId: string, payment: { amount: number; date: string; method: string; note?: string }) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;

  customCategories: string[];
  addCustomCategory: (cat: string) => Promise<void>;
  sourcesList: string[];
  addCustomSource: (src: string) => Promise<string | null>;

  quickAddModalOpen: boolean;
  quickAddDefaultTab: 'expense' | 'income' | 'lent';
  openQuickAdd: (tab?: 'expense' | 'income' | 'lent') => void;
  closeQuickAdd: () => void;
  reportModalOpen: boolean;
  openReportModal: () => void;
  closeReportModal: () => void;

  toast: { message: string; visible: boolean };
  showToast: (msg: string) => void;
  isLoading: boolean;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

function buildMonthsList(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  }
  return months;
}

const MONTHS_LIST = buildMonthsList();

function normalizePaymentMethod(method: string): PaymentMethod {
  const m = method.toLowerCase();
  if (m.includes('upi')) return 'UPI';
  if (m.includes('cash')) return 'Cash';
  if (m.includes('card')) return 'Card';
  if (m.includes('bank')) return 'Bank Transfer';
  return 'Other';
}

function normalizeLentVia(channel: string): LentVia {
  const c = channel.toLowerCase();
  if (c.includes('upi')) return 'UPI';
  if (c.includes('cash')) return 'Cash';
  if (c.includes('bank')) return 'Bank Transfer';
  return 'Other';
}

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<CategoryRow[]>([]);
  const [sourcesMap, setSourcesMap] = useState<SourceRow[]>([]);

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(MONTHS_LIST.length - 1);
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('₹');

  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [quickAddDefaultTab, setQuickAddDefaultTab] = useState<'expense' | 'income' | 'lent'>('expense');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = useCallback((msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2800);
  }, []);

  const loadData = useCallback(async (uid: string) => {
    setIsLoading(true);
    try {
      const [catRes, srcRes, expRes, incRes, lendRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', uid).order('name'),
        supabase.from('sources').select('*').eq('user_id', uid).eq('is_archived', false).order('name'),
        supabase.from('expenses').select('*, category:categories(*), source:sources(*)').eq('user_id', uid).order('date', { ascending: false }),
        supabase.from('income').select('*, source:sources(*)').eq('user_id', uid).order('date', { ascending: false }),
        supabase.from('lending').select('*, repayments(*)').eq('user_id', uid).order('lent_date', { ascending: false }),
      ]);

      let categories = (catRes.data as CategoryRow[]) ?? [];
      if (categories.length === 0) {
        const defaultCats = [
          { user_id: uid, name: 'Food', icon: 'utensils' },
          { user_id: uid, name: 'Transport', icon: 'car' },
          { user_id: uid, name: 'Shopping', icon: 'shopping-bag' },
          { user_id: uid, name: 'Bills', icon: 'receipt' },
          { user_id: uid, name: 'Entertainment', icon: 'film' },
          { user_id: uid, name: 'Health', icon: 'heart-pulse' },
          { user_id: uid, name: 'Education', icon: 'graduation-cap' },
          { user_id: uid, name: 'Travel', icon: 'plane' },
          { user_id: uid, name: 'Subscriptions', icon: 'repeat' },
          { user_id: uid, name: 'Other', icon: 'circle-ellipsis' },
        ];
        const { data: seeded } = await supabase.from('categories').insert(defaultCats).select();
        categories = (seeded as CategoryRow[]) ?? [];
      }
      setCategoriesMap(categories);

      const sources = (srcRes.data as SourceRow[]) ?? [];
      setSourcesMap(sources);

      if (expRes.data) {
        const formattedExpenses: ExpenseItem[] = expRes.data.map((row: any) => ({
          id: row.id,
          title: row.note || row.category?.name || 'Expense',
          note: row.note || '',
          amount: Number(row.amount),
          category: row.category?.name || 'Other',
          categoryId: row.category_id,
          source: row.source?.name,
          sourceId: row.source_id,
          paymentMethod: row.payment_method,
          date: row.date,
          createdAt: new Date(row.created_at).getTime(),
        }));
        setExpenses(formattedExpenses);
      }

      if (incRes.data) {
        const formattedIncomes: IncomeItem[] = incRes.data.map((row: any) => ({
          id: row.id,
          title: row.note || row.source?.name || 'Income',
          note: row.note || '',
          amount: Number(row.amount),
          source: row.source?.name || 'Salary',
          sourceId: row.source_id,
          destination: row.payment_method,
          date: row.date,
          createdAt: new Date(row.created_at).getTime(),
        }));
        setIncomes(formattedIncomes);
      }

      if (lendRes.data) {
        const formattedLoans: LoanItem[] = lendRes.data.map((row: any) => {
          const reps = (row.repayments ?? []).map((r: any) => ({
            id: r.id,
            amount: Number(r.amount),
            date: r.date,
            method: r.received_via,
            note: r.note,
          }));
          const totalReceived = reps.reduce((sum: number, r: any) => sum + r.amount, 0);
          const orig = Number(row.original_amount);
          const remaining = Math.max(0, orig - totalReceived);
          let st: 'pending' | 'partial' | 'settled' = 'pending';
          if (remaining <= 0) st = 'settled';
          else if (totalReceived > 0) st = 'partial';

          return {
            id: row.id,
            personName: row.person_name,
            amountLent: orig,
            amountReceived: totalReceived,
            remaining,
            dateLent: row.lent_date,
            channel: row.lent_via,
            note: row.note || '',
            status: st,
            repayments: reps,
            createdAt: new Date(row.created_at).getTime(),
          };
        });
        setLoans(formattedLoans);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        loadData(user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadData(session.user.id);
      } else {
        setUserId(null);
        setExpenses([]);
        setIncomes([]);
        setLoans([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, loadData]);

  const ensureCategory = async (name: string): Promise<string> => {
    const existing = categoriesMap.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: userId, name: name.trim() })
      .select()
      .single();

    if (error || !data) {
      const fallback = categoriesMap[0]?.id;
      if (fallback) return fallback;
      throw new Error(error?.message || 'Could not resolve category');
    }

    setCategoriesMap(prev => [...prev, data as CategoryRow]);
    return data.id;
  };

  const ensureSource = async (name?: string | null): Promise<string | null> => {
    if (!name || !name.trim()) return null;
    const existing = sourcesMap.find(s => s.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('sources')
      .insert({ user_id: userId, name: name.trim() })
      .select()
      .single();

    if (error || !data) return null;

    setSourcesMap(prev => [...prev, data as SourceRow]);
    return data.id;
  };

  const addExpense = async (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => {
    if (!userId) {
      showToast('Please sign in to save expenses');
      return;
    }
    try {
      const catId = await ensureCategory(expense.category);
      const srcId = await ensureSource(expense.source);
      const pm = normalizePaymentMethod(expense.paymentMethod);

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          amount: expense.amount,
          category_id: catId,
          source_id: srcId,
          payment_method: pm,
          date: expense.date || new Date().toISOString().split('T')[0],
          note: expense.note || expense.title || null,
        })
        .select('*, category:categories(*), source:sources(*)')
        .single();

      if (error) throw error;

      const newExp: ExpenseItem = {
        id: data.id,
        title: data.note || data.category?.name || 'Expense',
        note: data.note || '',
        amount: Number(data.amount),
        category: data.category?.name || expense.category,
        categoryId: catId,
        source: data.source?.name || expense.source,
        sourceId: srcId,
        paymentMethod: data.payment_method,
        date: data.date,
        createdAt: new Date(data.created_at).getTime(),
      };

      setExpenses(prev => [newExp, ...prev]);
      showToast(`Logged ${currency}${expense.amount.toFixed(2)} to ${newExp.title}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save expense');
    }
  };

  const editExpense = async (id: string, updates: Partial<ExpenseItem>) => {
    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.date !== undefined) payload.date = updates.date;
      if (updates.note !== undefined || updates.title !== undefined) payload.note = updates.note || updates.title;
      if (updates.paymentMethod !== undefined) payload.payment_method = normalizePaymentMethod(updates.paymentMethod);
      if (updates.category) payload.category_id = await ensureCategory(updates.category);
      if (updates.source !== undefined) payload.source_id = await ensureSource(updates.source);

      const { error } = await supabase.from('expenses').update(payload).eq('id', id);
      if (error) throw error;

      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      showToast('Expense updated');
    } catch (err: any) {
      showToast(err.message || 'Failed to update expense');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      setExpenses(prev => prev.filter(e => e.id !== id));
      showToast('Expense removed');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove expense');
    }
  };

  const addIncome = async (income: Omit<IncomeItem, 'id' | 'createdAt'>) => {
    if (!userId) {
      showToast('Please sign in to save income');
      return;
    }
    try {
      const srcId = await ensureSource(income.source);
      const pm = normalizePaymentMethod(income.destination);

      const { data, error } = await supabase
        .from('income')
        .insert({
          user_id: userId,
          amount: income.amount,
          source_id: srcId,
          payment_method: pm,
          date: income.date || new Date().toISOString().split('T')[0],
          note: income.note || income.title || null,
        })
        .select('*, source:sources(*)')
        .single();

      if (error) throw error;

      const newInc: IncomeItem = {
        id: data.id,
        title: data.note || data.source?.name || 'Income',
        note: data.note || '',
        amount: Number(data.amount),
        source: data.source?.name || income.source,
        sourceId: srcId,
        destination: data.payment_method,
        date: data.date,
        createdAt: new Date(data.created_at).getTime(),
      };

      setIncomes(prev => [newInc, ...prev]);
      showToast(`Added ${currency}${income.amount.toFixed(2)} income`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save income');
    }
  };

  const editIncome = async (id: string, updates: Partial<IncomeItem>) => {
    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.date !== undefined) payload.date = updates.date;
      if (updates.note !== undefined || updates.title !== undefined) payload.note = updates.note || updates.title;
      if (updates.destination !== undefined) payload.payment_method = normalizePaymentMethod(updates.destination);
      if (updates.source !== undefined) payload.source_id = await ensureSource(updates.source);

      const { error } = await supabase.from('income').update(payload).eq('id', id);
      if (error) throw error;

      setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      showToast('Income updated');
    } catch (err: any) {
      showToast(err.message || 'Failed to update income');
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      const { error } = await supabase.from('income').delete().eq('id', id);
      if (error) throw error;
      setIncomes(prev => prev.filter(i => i.id !== id));
      showToast('Income record removed');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove income');
    }
  };

  const addLoan = async (loanData: { personName: string; amountLent: number; dateLent: string; channel: string; note: string; avatarUrl?: string }) => {
    if (!userId) {
      showToast('Please sign in to record lending');
      return;
    }
    try {
      const lv = normalizeLentVia(loanData.channel);
      const { data, error } = await supabase
        .from('lending')
        .insert({
          user_id: userId,
          person_name: loanData.personName.trim(),
          original_amount: loanData.amountLent,
          lent_via: lv,
          lent_date: loanData.dateLent || new Date().toISOString().split('T')[0],
          note: loanData.note || null,
          status: 'pending',
        })
        .select('*, repayments(*)')
        .single();

      if (error) throw error;

      const newLoan: LoanItem = {
        id: data.id,
        personName: data.person_name,
        amountLent: Number(data.original_amount),
        amountReceived: 0,
        remaining: Number(data.original_amount),
        dateLent: data.lent_date,
        channel: data.lent_via,
        note: data.note || '',
        status: 'pending',
        avatarUrl: loanData.avatarUrl || '',
        repayments: [],
        createdAt: new Date(data.created_at).getTime(),
      };

      setLoans(prev => [newLoan, ...prev]);
      showToast(`Recorded loan of ${currency}${loanData.amountLent.toFixed(2)} to ${loanData.personName}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save loan');
    }
  };

  const recordLoanRepayment = async (loanId: string, payment: { amount: number; date: string; method: string; note?: string }) => {
    if (!userId) return;
    try {
      const rv = normalizeLentVia(payment.method);
      const { data, error } = await supabase
        .from('repayments')
        .insert({
          user_id: userId,
          lending_id: loanId,
          amount: payment.amount,
          received_via: rv,
          date: payment.date || new Date().toISOString().split('T')[0],
          note: payment.note || null,
        })
        .select()
        .single();

      if (error) throw error;

      setLoans(prev => prev.map(l => {
        if (l.id !== loanId) return l;
        const newReceived = l.amountReceived + Number(data.amount);
        const newRemaining = Math.max(0, l.amountLent - newReceived);
        const newStatus: 'pending' | 'partial' | 'settled' = newRemaining <= 0 ? 'settled' : 'partial';

        return {
          ...l,
          amountReceived: newReceived,
          remaining: newRemaining,
          status: newStatus,
          repayments: [
            ...l.repayments,
            {
              id: data.id,
              amount: Number(data.amount),
              date: data.date,
              method: data.received_via,
              note: data.note,
            },
          ],
        };
      }));

      showToast(`Recorded repayment of ${currency}${payment.amount.toFixed(2)}!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to record repayment');
    }
  };

  const deleteLoan = async (id: string) => {
    try {
      const { error } = await supabase.from('lending').delete().eq('id', id);
      if (error) throw error;
      setLoans(prev => prev.filter(l => l.id !== id));
      showToast('Loan record removed');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove loan');
    }
  };

  const addCustomCategory = async (cat: string) => {
    if (!cat.trim() || !userId) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ user_id: userId, name: cat.trim() })
        .select()
        .single();

      if (error) throw error;
      setCategoriesMap(prev => [...prev, data as CategoryRow]);
      showToast(`Added category "${cat.trim()}"`);
    } catch (err: any) {
      showToast(err.message || 'Failed to add category');
    }
  };

  const addCustomSource = async (src: string): Promise<string | null> => {
    return ensureSource(src);
  };

  const prevMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonthIndex < MONTHS_LIST.length - 1) {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const toggleBalanceHidden = () => {
    setIsBalanceHidden(prev => !prev);
  };

  const totalMonthlySpend = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const totalMonthlyIncome = useMemo(() => {
    return incomes.reduce((acc, curr) => acc + curr.amount, 0);
  }, [incomes]);

  const totalAmountOwed = useMemo(() => {
    return loans.reduce((acc, curr) => acc + curr.remaining, 0);
  }, [loans]);

  const netLiquidBalance = useMemo(() => {
    return Math.max(0, totalMonthlyIncome - totalMonthlySpend);
  }, [totalMonthlyIncome, totalMonthlySpend]);

  const burnCap = 30000;
  const burnConsumedPercent = burnCap > 0 ? Math.min(100, (totalMonthlySpend / burnCap) * 100) : 0;
  const burnCushionLeft = Math.max(0, burnCap - totalMonthlySpend);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });

    const colors = [
      'bg-primary',
      'bg-secondary',
      'bg-tertiary-container',
      'bg-primary-fixed-dim',
      'bg-secondary-container',
      'bg-tertiary-fixed-dim',
    ];

    const total = totalMonthlySpend || 1;
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);

    return sorted.map(([name, amount], index) => ({
      name,
      amount,
      percent: Math.round((amount / total) * 100),
      colorClass: colors[index % colors.length],
    }));
  }, [expenses, totalMonthlySpend]);

  const incomeSourceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    incomes.forEach(i => {
      map[i.source] = (map[i.source] || 0) + i.amount;
    });

    const colors = [
      'bg-primary',
      'bg-secondary',
      'bg-tertiary-container',
      'bg-primary-fixed-dim',
      'bg-secondary-container',
    ];

    const total = totalMonthlyIncome || 1;
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);

    return sorted.map(([source, amount], index) => ({
      source,
      amount,
      percent: Math.round((amount / total) * 100),
      colorClass: colors[index % colors.length],
    }));
  }, [incomes, totalMonthlyIncome]);

  const loanMetrics = useMemo(() => {
    let pendingCount = 0;
    let pendingAmount = 0;
    let partialCount = 0;
    let partialAmount = 0;
    let settledCount = 0;
    let settledAmount = 0;

    loans.forEach(l => {
      if (l.status === 'pending') {
        pendingCount++;
        pendingAmount += l.remaining;
      } else if (l.status === 'partial') {
        partialCount++;
        partialAmount += l.remaining;
      } else {
        settledCount++;
        settledAmount += l.amountLent;
      }
    });

    return {
      pendingCount,
      pendingAmount,
      partialCount,
      partialAmount,
      settledCount,
      settledAmount,
      totalCount: loans.length,
    };
  }, [loans]);

  const openQuickAdd = (tab: 'expense' | 'income' | 'lent' = 'expense') => {
    setQuickAddDefaultTab(tab);
    setQuickAddModalOpen(true);
  };

  const closeQuickAdd = () => setQuickAddModalOpen(false);
  const openReportModal = () => setReportModalOpen(true);
  const closeReportModal = () => setReportModalOpen(false);

  const customCategories = useMemo(() => {
    return categoriesMap.map(c => c.name);
  }, [categoriesMap]);

  const sourcesList = useMemo(() => {
    return sourcesMap.map(s => s.name);
  }, [sourcesMap]);

  return (
    <LedgerContext.Provider
      value={{
        activeTab,
        setActiveTab,
        expenses,
        incomes,
        loans,
        currentMonthIndex,
        months: MONTHS_LIST,
        currentMonth: MONTHS_LIST[currentMonthIndex] || 'September 2026',
        prevMonth,
        nextMonth,
        isBalanceHidden,
        toggleBalanceHidden,
        currency,
        setCurrency,
        totalMonthlySpend,
        totalMonthlyIncome,
        totalAmountOwed,
        netLiquidBalance,
        burnCap,
        burnConsumedPercent,
        burnCushionLeft,
        categoryBreakdown,
        incomeSourceBreakdown,
        loanMetrics,
        addExpense,
        editExpense,
        deleteExpense,
        addIncome,
        editIncome,
        deleteIncome,
        addLoan,
        recordLoanRepayment,
        deleteLoan,
        customCategories,
        addCustomCategory,
        sourcesList,
        addCustomSource,
        quickAddModalOpen,
        quickAddDefaultTab,
        openQuickAdd,
        closeQuickAdd,
        reportModalOpen,
        openReportModal,
        closeReportModal,
        toast,
        showToast,
        isLoading,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
};
