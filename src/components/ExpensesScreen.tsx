'use client';

import React, { useState, useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { ExpenseItem } from '../types';

export const ExpensesScreen: React.FC = () => {
  const {
    expenses,
    addExpense,
    editExpense,
    deleteExpense,
    totalMonthlySpend,
    currentMonth,
    prevMonth,
    nextMonth,
    categoryBreakdown,
    customCategories,
    addCustomCategory,
    sourcesList,
    currency,
    isSaving,
  } = useLedger();

  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'custom'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [selectedCat, setSelectedCat] = useState('Food');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [noteInput, setNoteInput] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);
  const [showCatPrompt, setShowCatPrompt] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const filteredExpenses = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    return expenses.filter(item => {
      if (categoryFilter !== 'all') {
        const itemCatLower = item.category.toLowerCase();
        const filterCatLower = categoryFilter.toLowerCase();
        if (filterCatLower === 'fun' && (itemCatLower.includes('fun') || itemCatLower.includes('entertainment'))) {
        } else if (filterCatLower === 'subs' && (itemCatLower.includes('sub') || itemCatLower.includes('bill'))) {
        } else if (!itemCatLower.includes(filterCatLower)) {
          return false;
        }
      }

      if (sourceFilter !== 'all') {
        const itemMethodLower = item.paymentMethod.toLowerCase();
        const sourceLower = sourceFilter.toLowerCase();
        if (sourceLower === 'bank' && !itemMethodLower.includes('bank')) return false;
        if (sourceLower !== 'bank' && !itemMethodLower.includes(sourceLower)) return false;
      }

      if (periodFilter === 'week') {
        return item.date >= weekAgoStr;
      }

      if (periodFilter === 'month') {
        return item.date.startsWith(currentMonthStr);
      }

      return true;
    });
  }, [expenses, categoryFilter, sourceFilter, periodFilter]);

  const groupedExpenses = useMemo(() => {
    const groups: { label: string; date: string; items: ExpenseItem[]; total: number }[] = [];
    const dateMap = new Map<string, ExpenseItem[]>();

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    filteredExpenses.forEach(exp => {
      const d = exp.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, []);
      }
      dateMap.get(d)!.push(exp);
    });

    dateMap.forEach((items, dateStr) => {
      let label = dateStr;
      if (dateStr === todayStr) {
        label = 'Today';
      } else if (dateStr === yesterdayStr) {
        label = 'Yesterday';
      } else {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          label = `${monthNames[parseInt(parts[1]) - 1]} ${parts[2]}`;
        }
      }

      const total = items.reduce((acc, curr) => acc + curr.amount, 0);
      groups.push({ label, date: dateStr, items, total });
    });

    return groups.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredExpenses]);

  const handleSaveExpense = async () => {
    if (isSaving) return;
    const cleanAmount = amountInput.replace(/[^0-9.]/g, '');
    const amt = Math.abs(parseFloat(cleanAmount) || 0);
    if (!amt) {
      alert('Please enter a valid expense amount.');
      return;
    }

    if (editingExpenseId) {
      await editExpense(editingExpenseId, {
        title: noteInput.trim() || `${selectedCat} Outflow`,
        amount: amt,
        category: selectedCat,
        source: selectedSource || undefined,
        paymentMethod: selectedMethod,
        date: dateInput,
        note: noteInput.trim(),
      });
      setEditingExpenseId(null);
    } else {
      await addExpense({
        title: noteInput.trim() || `${selectedCat} Outflow`,
        note: noteInput.trim() || (null as any),
        amount: amt,
        category: selectedCat,
        source: selectedSource || undefined,
        paymentMethod: selectedMethod,
        date: dateInput || new Date().toISOString().split('T')[0],
      });
    }

    setIsAddOpen(false);
    setAmountInput('');
    setNoteInput('');
    setSelectedSource('');
  };

  const startEdit = (exp: ExpenseItem) => {
    setEditingExpenseId(exp.id);
    setAmountInput(exp.amount.toString());
    setSelectedCat(exp.category);
    setSelectedSource(exp.source || '');
    setSelectedMethod(exp.paymentMethod);
    setDateInput(exp.date);
    setNoteInput(exp.note || exp.title || '');
    setIsAddOpen(true);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCustomCategory(newCatName.trim());
    setSelectedCat(newCatName.trim());
    setNewCatName('');
    setShowCatPrompt(false);
  };

  const getCatIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('food')) return 'restaurant';
    if (c.includes('transport') || c.includes('travel')) return 'directions_subway';
    if (c.includes('shopping')) return 'shopping_bag';
    if (c.includes('bill')) return 'receipt_long';
    if (c.includes('entertainment') || c.includes('fun')) return 'sports_esports';
    if (c.includes('health')) return 'medical_services';
    if (c.includes('sub')) return 'subscriptions';
    return 'local_cafe';
  };

  const getCatColorStyles = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('food')) return { bg: 'bg-primary/10', text: 'text-primary' };
    if (c.includes('transport')) return { bg: 'bg-secondary/10', text: 'text-secondary' };
    if (c.includes('shopping')) return { bg: 'bg-tertiary-container/15', text: 'text-tertiary-container' };
    if (c.includes('bill')) return { bg: 'bg-error-container/20', text: 'text-error' };
    return { bg: 'bg-surface-container', text: 'text-on-surface' };
  };

  const allAvailableCats = Array.from(new Set(['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Subs', ...customCategories]));

  return (
    <div className="flex flex-col w-full gap-4">
      <section className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-xs border border-surface-container/60">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
              Total Spending
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-headline-sm text-headline-sm text-on-surface-variant font-bold">
                {currency}
              </span>
              <h1 className="font-metric-xl-mobile text-metric-xl-mobile md:text-4xl text-on-surface tracking-tight font-bold">
                {totalMonthlySpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded-full border border-surface-container">
            <button
              onClick={prevMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              title="Previous Month"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="font-label-md text-label-md text-on-surface font-semibold px-1">
              {currentMonth}
            </span>
            <button
              onClick={nextMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              title="Next Month"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        {categoryBreakdown.length > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-container/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Spend Velocity by Category
              </span>
              <span className="font-label-sm text-label-sm text-primary font-bold">
                {categoryBreakdown.length} Categories
              </span>
            </div>

            <div className="w-full flex h-2 rounded-full overflow-hidden bg-surface-container gap-0.5 mb-3">
              {categoryBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className={`h-full ${item.colorClass} transition-all duration-300`}
                  style={{ width: `${Math.max(6, item.percent)}%` }}
                  title={`${item.name}: ${currency}${item.amount} (${item.percent}%)`}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryBreakdown.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-label-sm">
                  <span className={`w-2 h-2 rounded-full ${item.colorClass}`}></span>
                  <span className="text-on-surface-variant font-medium">{item.name}</span>
                  <span className="text-on-surface font-bold">{currency}{item.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {(['all', 'week', 'month'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-3 py-1 rounded-full text-label-sm font-label-sm capitalize transition-all whitespace-nowrap ${
                  periodFilter === p
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
                type="button"
              >
                {p === 'all' ? 'All Transactions' : p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (isAddOpen) {
                setIsAddOpen(false);
                setEditingExpenseId(null);
              } else {
                setEditingExpenseId(null);
                setAmountInput('');
                setNoteInput('');
                setSelectedSource('');
                setDateInput(new Date().toISOString().split('T')[0]);
                setIsAddOpen(true);
              }
            }}
            className="flex items-center gap-1 bg-primary text-on-primary px-3.5 py-1.5 rounded-full shadow-xs active:scale-95 transition-all text-label-sm font-label-sm font-bold shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isAddOpen ? 'close' : 'add'}
            </span>
            <span>{isAddOpen ? 'Close' : 'Add Expense'}</span>
          </button>
        </div>
      </section>

      {isAddOpen && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-md border border-surface-container flex flex-col gap-3 transition-all animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-1 border-b border-surface-container/60">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {editingExpenseId ? 'Edit Expense Record' : 'Record New Expense'}
            </h2>
            <button
              onClick={() => setIsAddOpen(false)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                Amount ({currency})
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                <span className="font-label-md text-label-md text-outline mr-1.5 font-bold">{currency}</span>
                <input
                  className="bg-transparent font-headline-sm text-headline-sm text-on-surface font-bold w-full focus:outline-none placeholder:text-on-surface-variant/40"
                  placeholder="0.00"
                  type="text"
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCatPrompt(!showCatPrompt)}
                  className="text-primary text-label-sm font-semibold hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>New Category</span>
                </button>
              </div>

              {showCatPrompt && (
                <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-surface-container-low border border-surface-container">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Enter category name"
                    className="flex-1 bg-transparent text-body-md text-on-surface outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-1 bg-primary text-on-primary rounded-lg text-label-sm font-bold"
                  >
                    Save
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {allAvailableCats.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCat(cat)}
                    className={`px-3 py-1.5 rounded-full text-label-sm font-label-sm transition-all ${
                      selectedCat === cat
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {sourcesList.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                  Money Source (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSource('')}
                    className={`px-3 py-1 rounded-full text-label-sm font-label-sm transition-all ${
                      !selectedSource
                        ? 'bg-surface-container-highest text-on-surface font-bold'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    Default
                  </button>
                  {sourcesList.map(src => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSelectedSource(src)}
                      className={`px-3 py-1 rounded-full text-label-sm font-label-sm transition-all ${
                        selectedSource === src
                          ? 'bg-primary text-on-primary font-bold shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                Payment Channel
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['UPI', 'Card', 'Bank Transfer', 'Cash', 'Other'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMethod(m)}
                    className={`px-3 py-1.5 rounded-full text-label-sm font-label-sm transition-all ${
                      selectedMethod === m
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                Date
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">event</span>
                <input
                  className="bg-transparent font-body-md text-body-md text-on-surface w-full focus:outline-none"
                  type="date"
                  value={dateInput}
                  onChange={e => setDateInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                Note / Description
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">edit_note</span>
                <input
                  className="bg-transparent font-body-md text-body-md text-on-surface w-full focus:outline-none placeholder:text-on-surface-variant/40"
                  placeholder="What was this for? (e.g., Grocery purchase)"
                  type="text"
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveExpense}
            disabled={isSaving}
            className="w-full bg-primary-container text-on-primary font-label-lg text-label-lg py-3 rounded-full shadow-lg active:scale-95 hover:bg-primary transition-all flex items-center justify-center gap-2 font-bold disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">{isSaving ? 'hourglass_top' : 'check_circle'}</span>
            <span>
              {isSaving ? 'Saving...' : editingExpenseId ? 'Update Expense' : 'Save Expense'}
            </span>
          </button>
        </section>
      )}

      <section className="flex flex-col gap-4">
        {groupedExpenses.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2 border border-surface-container/60">
            <span className="material-symbols-outlined text-outline text-4xl">receipt_long</span>
            <p className="font-headline-sm text-on-surface font-bold">No Expenses Found</p>
            <p className="font-body-sm text-on-surface-variant">Try adjusting your filters or log a new expense above.</p>
          </div>
        ) : (
          groupedExpenses.map(group => (
            <div key={group.date} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-md text-label-md text-on-surface-variant tracking-wide uppercase font-semibold">
                  {group.label}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                  {currency}{group.total.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {group.items.map(exp => {
                  const styles = getCatColorStyles(exp.category);
                  const icon = getCatIcon(exp.category);

                  return (
                    <div
                      key={exp.id}
                      className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-xs border border-surface-container/40 flex items-center justify-between transition-all hover:bg-surface-container-low group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-full ${styles.bg} ${styles.text} flex items-center justify-center shrink-0`}>
                          <span className="material-symbols-outlined text-[20px]">{icon}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                              {exp.title}
                            </span>
                            <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container text-on-surface-variant rounded">
                              {exp.paymentMethod}
                            </span>
                            {exp.source && (
                              <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
                                {exp.source}
                              </span>
                            )}
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            {exp.note || exp.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className="font-label-lg text-label-lg text-error font-bold tracking-tight mr-1">
                          {currency}{exp.amount.toFixed(2)}
                        </span>

                        <button
                          aria-label="Edit Expense"
                          onClick={() => startEdit(exp)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          aria-label="Delete Expense"
                          onClick={() => setExpenseToDelete(exp)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {expenseToDelete && (
        <div className="fixed inset-x-4 bottom-24 z-50 max-w-sm mx-auto bg-inverse-surface text-inverse-on-surface p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-error-container text-[20px] shrink-0">warning</span>
            <span className="font-body-md text-body-md truncate">Remove "{expenseToDelete.title}"?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExpenseToDelete(null)}
              className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg text-inverse-on-surface/80 hover:bg-white/10"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteExpense(expenseToDelete.id);
                setExpenseToDelete(null);
              }}
              className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg bg-error text-on-error font-bold shadow-xs"
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
