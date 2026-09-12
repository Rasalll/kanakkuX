import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ExpenseItem, IncomeItem, LoanItem, TabType } from '../types';
import { INITIAL_EXPENSES, INITIAL_INCOMES, INITIAL_LOANS } from '../data/initialData';

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
  
  // Computed values
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

  // Actions
  addExpense: (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => void;
  editExpense: (id: string, data: Partial<ExpenseItem>) => void;
  deleteExpense: (id: string) => void;
  addIncome: (income: Omit<IncomeItem, 'id' | 'createdAt'>) => void;
  editIncome: (id: string, data: Partial<IncomeItem>) => void;
  deleteIncome: (id: string) => void;
  addLoan: (loan: { personName: string; amountLent: number; dateLent: string; channel: string; note: string; avatarUrl?: string }) => void;
  recordLoanRepayment: (loanId: string, payment: { amount: number; date: string; method: string; note?: string }) => void;
  deleteLoan: (id: string) => void;

  // Custom Categories
  customCategories: string[];
  addCustomCategory: (cat: string) => void;

  // Modals & Sheets
  quickAddModalOpen: boolean;
  quickAddDefaultTab: 'expense' | 'income' | 'lent';
  openQuickAdd: (tab?: 'expense' | 'income' | 'lent') => void;
  closeQuickAdd: () => void;
  reportModalOpen: boolean;
  openReportModal: () => void;
  closeReportModal: () => void;

  // Toast
  toast: { message: string; visible: boolean };
  showToast: (msg: string) => void;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

// Generate a rolling 24-month list ending at the current month
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

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Storage initialization - migrate away from legacy lf_* dummy cache
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    if (typeof window !== 'undefined') {
      // Clear legacy dummy cache if present
      ['lf_expenses', 'lf_incomes', 'lf_loans', 'lf_custom_cats'].forEach(k => localStorage.removeItem(k));
      const saved = localStorage.getItem('kanakku_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    }
    return INITIAL_EXPENSES;
  });

  const [incomes, setIncomes] = useState<IncomeItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kanakku_incomes');
      return saved ? JSON.parse(saved) : INITIAL_INCOMES;
    }
    return INITIAL_INCOMES;
  });

  const [loans, setLoans] = useState<LoanItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kanakku_loans');
      return saved ? JSON.parse(saved) : INITIAL_LOANS;
    }
    return INITIAL_LOANS;
  });

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kanakku_custom_cats');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(MONTHS_LIST.length - 1); // Current month
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('₹');

  // Modals
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [quickAddDefaultTab, setQuickAddDefaultTab] = useState<'expense' | 'income' | 'lent'>('expense');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('kanakku_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('kanakku_incomes', JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem('kanakku_loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('kanakku_custom_cats', JSON.stringify(customCategories));
  }, [customCategories]);

  const showToast = (msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2800);
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

  // Calculations
  const totalMonthlySpend = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const totalMonthlyIncome = useMemo(() => {
    return incomes.reduce((acc, curr) => acc + curr.amount, 0);
  }, [incomes]);

  const totalAmountOwed = useMemo(() => {
    return loans.reduce((acc, curr) => acc + curr.remaining, 0);
  }, [loans]);

  // Net Liquid Balance = (Total Incomes - Total Spend)
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

    if (sorted.length === 0) {
      return [
        { name: 'Food', amount: 0, percent: 0, colorClass: 'bg-primary' },
        { name: 'Bills', amount: 0, percent: 0, colorClass: 'bg-secondary' },
        { name: 'Shop', amount: 0, percent: 0, colorClass: 'bg-tertiary-container' },
        { name: 'Other', amount: 0, percent: 0, colorClass: 'bg-primary-fixed-dim' },
      ];
    }

    return sorted.map(([name, amount], idx) => ({
      name: name === 'Shopping' ? 'Shop' : name,
      amount,
      percent: Math.round((amount / total) * 100),
      colorClass: colors[idx % colors.length],
    }));
  }, [expenses, totalMonthlySpend]);

  const incomeSourceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    incomes.forEach(inc => {
      map[inc.source] = (map[inc.source] || 0) + inc.amount;
    });

    const colors = [
      'bg-primary',
      'bg-secondary',
      'bg-tertiary-container',
      'bg-primary-fixed-dim',
    ];

    const total = totalMonthlyIncome || 1;
    return Object.entries(map).map(([source, amount], idx) => ({
      source: source === 'Freelance' ? 'Freelance UI' : source,
      amount,
      percent: Math.round((amount / total) * 100),
      colorClass: colors[idx % colors.length],
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
      } else if (l.status === 'settled') {
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

  // Actions
  const addExpense = (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => {
    const newExp: ExpenseItem = {
      ...expense,
      id: `exp-${Date.now()}`,
      createdAt: Date.now(),
    };
    setExpenses(prev => [newExp, ...prev]);
    showToast(`Logged $${expense.amount.toFixed(2)} to ${expense.title}`);
  };

  const editExpense = (id: string, data: Partial<ExpenseItem>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    showToast('Expense updated successfully');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Expense removed');
  };

  const addIncome = (income: Omit<IncomeItem, 'id' | 'createdAt'>) => {
    const newInc: IncomeItem = {
      ...income,
      id: `inc-${Date.now()}`,
      createdAt: Date.now(),
    };
    setIncomes(prev => [newInc, ...prev]);
    showToast(`Added +$${income.amount.toFixed(2)} income flow`);
  };

  const editIncome = (id: string, data: Partial<IncomeItem>) => {
    setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    showToast('Income entry updated');
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
    showToast('Income record removed');
  };

  const addLoan = (loanData: { personName: string; amountLent: number; dateLent: string; channel: string; note: string; avatarUrl?: string }) => {
    const newLoan: LoanItem = {
      id: `loan-${Date.now()}`,
      personName: loanData.personName,
      amountLent: loanData.amountLent,
      amountReceived: 0,
      remaining: loanData.amountLent,
      dateLent: loanData.dateLent || new Date().toISOString().split('T')[0],
      channel: loanData.channel || 'UPI',
      note: loanData.note || 'Personal Loan',
      status: 'pending',
      avatarUrl: loanData.avatarUrl || '',
      repayments: [],
      createdAt: Date.now(),
    };
    setLoans(prev => [newLoan, ...prev]);
    showToast(`Recorded loan of $${loanData.amountLent.toFixed(2)} to ${loanData.personName}`);
  };

  const recordLoanRepayment = (loanId: string, payment: { amount: number; date: string; method: string; note?: string }) => {
    setLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;
      const newReceived = l.amountReceived + payment.amount;
      const newRemaining = Math.max(0, l.amountLent - newReceived);
      const newStatus = newRemaining <= 0 ? 'settled' : 'partial';

      return {
        ...l,
        amountReceived: newReceived,
        remaining: newRemaining,
        status: newStatus,
        repayments: [
          ...l.repayments,
          {
            id: `rep-${Date.now()}`,
            amount: payment.amount,
            date: payment.date || new Date().toISOString().split('T')[0],
            method: payment.method || 'UPI',
            note: payment.note,
          },
        ],
      };
    }));
    showToast(`Recorded repayment of $${payment.amount.toFixed(2)}!`);
  };

  const deleteLoan = (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
    showToast('Loan record removed');
  };

  const addCustomCategory = (cat: string) => {
    if (!cat.trim()) return;
    setCustomCategories(prev => [...prev, cat.trim()]);
    showToast(`Added custom category "${cat.trim()}"`);
  };

  const openQuickAdd = (tab: 'expense' | 'income' | 'lent' = 'expense') => {
    setQuickAddDefaultTab(tab);
    setQuickAddModalOpen(true);
  };

  const closeQuickAdd = () => setQuickAddModalOpen(false);
  const openReportModal = () => setReportModalOpen(true);
  const closeReportModal = () => setReportModalOpen(false);

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
        currentMonth: MONTHS_LIST[currentMonthIndex],
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
        quickAddModalOpen,
        quickAddDefaultTab,
        openQuickAdd,
        closeQuickAdd,
        reportModalOpen,
        openReportModal,
        closeReportModal,
        toast,
        showToast,
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
