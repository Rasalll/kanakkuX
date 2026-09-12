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
    currency,
  } = useLedger();

  // Filters State
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'custom'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Add Expense Drawer State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [selectedCat, setSelectedCat] = useState('Food');
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [noteInput, setNoteInput] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Delete Confirmation State
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);

  // Custom Category Prompt
  const [showCatPrompt, setShowCatPrompt] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      // Category filter
      if (categoryFilter !== 'all') {
        const itemCatLower = item.category.toLowerCase();
        const filterCatLower = categoryFilter.toLowerCase();
        if (filterCatLower === 'fun' && (itemCatLower.includes('fun') || itemCatLower.includes('entertainment'))) {
          // match
        } else if (filterCatLower === 'subs' && (itemCatLower.includes('sub') || itemCatLower.includes('bill'))) {
          // match
        } else if (!itemCatLower.includes(filterCatLower)) {
          return false;
        }
      }

      // Payment source filter
      if (sourceFilter !== 'all') {
        const itemMethodLower = item.paymentMethod.toLowerCase();
        const sourceLower = sourceFilter.toLowerCase();
        if (sourceLower === 'bank' && !itemMethodLower.includes('bank')) return false;
        if (sourceLower !== 'bank' && !itemMethodLower.includes(sourceLower)) return false;
      }

      // Period filter simulation
      if (periodFilter === 'week') {
        // simulate this week
        return item.date >= '2024-10-20';
      }

      return true;
    });
  }, [expenses, categoryFilter, sourceFilter, periodFilter]);

  // Grouped by date (Today - Oct 24, Yesterday - Oct 23, Oct 19, etc.)
  const groupedExpenses = useMemo(() => {
    const groups: { label: string; date: string; items: ExpenseItem[]; total: number }[] = [];
    const dateMap = new Map<string, ExpenseItem[]>();

    filteredExpenses.forEach(exp => {
      const d = exp.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, []);
      }
      dateMap.get(d)!.push(exp);
    });

    dateMap.forEach((items, dateStr) => {
      let label = dateStr;
      if (dateStr === '2024-10-24' || dateStr === new Date().toISOString().split('T')[0]) {
        label = 'Today - Oct 24';
      } else if (dateStr === '2024-10-23') {
        label = 'Yesterday - Oct 23';
      } else if (dateStr === '2024-10-19') {
        label = 'Oct 19';
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

    // sort groups descending
    return groups.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredExpenses]);

  const handleSaveExpense = () => {
    const cleanAmount = amountInput.replace(/[^0-9.]/g, '');
    const amt = Math.abs(parseFloat(cleanAmount) || 0);
    if (!amt) {
      alert('Please enter a valid expense amount.');
      return;
    }

    if (editingExpenseId) {
      editExpense(editingExpenseId, {
        title: noteInput.trim() || `${selectedCat} Outflow`,
        amount: amt,
        category: selectedCat,
        paymentMethod: selectedMethod,
        date: dateInput,
        note: noteInput.trim(),
      });
      setEditingExpenseId(null);
    } else {
      addExpense({
        title: noteInput.trim() || `${selectedCat} Outflow`,
        note: noteInput.trim() || 'Logged expense',
        amount: amt,
        category: selectedCat,
        paymentMethod: selectedMethod,
        date: dateInput || new Date().toISOString().split('T')[0],
      });
    }

    setIsAddOpen(false);
    setAmountInput('');
    setNoteInput('');
  };

  const startEdit = (exp: ExpenseItem) => {
    setEditingExpenseId(exp.id);
    setAmountInput(exp.amount.toString());
    setSelectedCat(exp.category);
    setSelectedMethod(exp.paymentMethod);
    setDateInput(exp.date);
    setNoteInput(exp.note || exp.title);
    setIsAddOpen(true);
  };

  const getCatIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('food') || c.includes('coffee') || c.includes('grocery')) return 'shopping_cart';
    if (c.includes('transport') || c.includes('uber') || c.includes('taxi')) return 'local_taxi';
    if (c.includes('bill') || c.includes('power') || c.includes('utility')) return 'electric_bolt';
    if (c.includes('sub') || c.includes('figma')) return 'subscriptions';
    if (c.includes('health') || c.includes('fit') || c.includes('gym')) return 'fitness_center';
    if (c.includes('shop')) return 'shopping_bag';
    return 'receipt';
  };

  const getCatColorStyles = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('food') || c.includes('grocery')) return { bg: 'bg-primary/10', text: 'text-primary' };
    if (c.includes('coffee')) return { bg: 'bg-secondary-container/15', text: 'text-secondary' };
    if (c.includes('transport') || c.includes('taxi')) return { bg: 'bg-tertiary-fixed-dim/20', text: 'text-tertiary' };
    if (c.includes('bill') || c.includes('power')) return { bg: 'bg-error-container/40', text: 'text-error' };
    if (c.includes('sub') || c.includes('figma')) return { bg: 'bg-secondary/15', text: 'text-secondary' };
    if (c.includes('health')) return { bg: 'bg-tertiary/10', text: 'text-tertiary' };
    return { bg: 'bg-primary/10', text: 'text-primary' };
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Top Month Switcher Carousel Pill */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-full shadow-xs border border-surface-container/60">
          <button
            aria-label="Previous Month"
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-90 transition-all"
            onClick={prevMonth}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          
          <div className="flex items-center gap-1.5 cursor-pointer select-none">
            <span className="material-symbols-outlined text-primary text-[19px]">calendar_month</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{currentMonth}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">expand_more</span>
          </div>

          <button
            aria-label="Next Month"
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-90 transition-all"
            onClick={nextMonth}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* Total Outflow Bento Card */}
        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-surface-container/60 flex flex-col gap-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1 font-medium">
                Total Monthly Spend
                <span className="material-symbols-outlined text-[14px] text-primary">arrow_downward</span>
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-metric-xl-mobile text-metric-xl-mobile text-on-surface font-bold tracking-tight">
                  {currency}{totalMonthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="font-label-sm text-label-sm text-error font-bold bg-error-container/60 px-2 py-0.5 rounded-full ml-1">
                  +4.2% vs Sep
                </span>
              </div>
            </div>

            {/* Quick Add Shortcut Pill */}
            <button
              onClick={() => {
                setEditingExpenseId(null);
                setAmountInput('');
                setNoteInput('');
                setIsAddOpen(!isAddOpen);
              }}
              className="flex items-center gap-1 bg-primary text-on-primary font-label-md text-label-md px-3.5 py-2 rounded-full shadow-md active:scale-95 hover:bg-primary-container transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span className="font-semibold">{isAddOpen ? 'Close Form' : 'Quick Log'}</span>
            </button>
          </div>

          {/* Segmented Category Spend Bar */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden flex gap-0.5 p-0.5">
              {categoryBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className={`h-full ${item.colorClass} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(5, item.percent)}%` }}
                  title={`${item.name}: ${currency}${item.amount}`}
                />
              ))}
            </div>

            {/* Legend Strip */}
            <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm px-0.5 flex-wrap gap-1">
              {categoryBreakdown.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${item.colorClass}`}></span>
                  <span>{item.name} ({item.percent}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Filter Controls */}
      <section className="flex flex-col gap-2">
        {/* Date Timeline Scope Filter */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container/60">
          <button
            onClick={() => setPeriodFilter('all')}
            className={`flex-1 py-1.5 rounded-lg font-label-sm text-center transition-all ${
              periodFilter === 'all'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            All
          </button>
          <button
            onClick={() => setPeriodFilter('week')}
            className={`flex-1 py-1.5 rounded-lg font-label-sm text-center transition-all ${
              periodFilter === 'week'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            This Week
          </button>
          <button
            onClick={() => setPeriodFilter('month')}
            className={`flex-1 py-1.5 rounded-lg font-label-sm text-center transition-all ${
              periodFilter === 'month'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            This Month
          </button>
          <button
            onClick={() => setPeriodFilter(periodFilter === 'custom' ? 'all' : 'custom')}
            className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg font-label-sm transition-all ${
              periodFilter === 'custom'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">tune</span>
            <span>Custom</span>
          </button>
        </div>

        {/* Category Filter Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full font-label-sm transition-all flex items-center gap-1 shadow-xs ${
              categoryFilter === 'all'
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
            type="button"
          >
            <span>All Spend</span>
          </button>

          {[
            { id: 'food', label: 'Food', icon: 'restaurant' },
            { id: 'transport', label: 'Transport', icon: 'directions_subway' },
            { id: 'shopping', label: 'Shopping', icon: 'shopping_bag' },
            { id: 'bills', label: 'Bills', icon: 'receipt' },
            { id: 'entertainment', label: 'Fun', icon: 'movie' },
            { id: 'health', label: 'Health', icon: 'ecg_heart' },
            { id: 'subs', label: 'Subs', icon: 'autorenew' },
            ...customCategories.map(c => ({ id: c.toLowerCase(), label: c, icon: 'label' }))
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full font-label-sm transition-all flex items-center gap-1 ${
                categoryFilter === cat.id
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}

          {/* Add custom category trigger */}
          <button
            onClick={() => setShowCatPrompt(true)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full font-label-sm bg-surface-container-high text-primary flex items-center gap-1 active:scale-95 transition-transform font-bold"
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            <span>Custom</span>
          </button>
        </div>

        {/* Custom Category Input Popover */}
        {showCatPrompt && (
          <div className="flex items-center gap-2 bg-surface-container-lowest p-2.5 rounded-xl border border-primary/30 shadow-sm animate-in fade-in">
            <input
              type="text"
              placeholder="Enter category name..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-1 bg-surface-container-low rounded-lg font-body-sm text-on-surface focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => {
                if (newCatName.trim()) {
                  addCustomCategory(newCatName.trim());
                  setNewCatName('');
                  setShowCatPrompt(false);
                }
              }}
              className="px-3 py-1 bg-primary text-on-primary font-label-sm rounded-lg font-bold"
            >
              Save
            </button>
            <button
              onClick={() => setShowCatPrompt(false)}
              className="text-on-surface-variant hover:text-on-surface p-1"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Payment Source Horizontal Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pt-0.5 no-scrollbar">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider pl-1 pr-1.5 font-bold">
            SOURCE:
          </span>
          {['all', 'upi', 'cash', 'card', 'bank', 'other'].map(src => {
            const labelMap: Record<string, string> = {
              all: 'All',
              upi: 'UPI',
              cash: 'Cash',
              card: 'Card',
              bank: 'Bank Transfer',
              other: 'Other',
            };
            return (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`pay-filter-btn px-2.5 py-1 rounded-md font-label-sm transition-colors ${
                  sourceFilter === src
                    ? 'bg-surface-container-highest text-on-surface font-bold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
                type="button"
              >
                {labelMap[src]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Interactive Add/Edit Expense Slide-Down Accordion */}
      {isAddOpen && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-md border border-surface-container flex flex-col gap-4 transition-all duration-300 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-1 border-b border-surface-container/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">
                  {editingExpenseId ? 'edit_note' : 'add_task'}
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {editingExpenseId ? 'Edit Outflow' : 'New Outflow'}
              </span>
            </div>
            <button
              onClick={() => {
                setIsAddOpen(false);
                setEditingExpenseId(null);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Amount Hero Input Field */}
          <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Amount Spent
            </label>
            <div className="flex items-center justify-center w-full">
              <span className="font-metric-xl-mobile text-metric-xl-mobile text-primary font-bold mr-1">
                {currency}
              </span>
              <input
                className="w-48 bg-transparent text-center font-metric-xl-mobile text-metric-xl-mobile text-on-surface focus:outline-none placeholder:text-on-surface-variant/30 font-bold"
                inputMode="decimal"
                placeholder="0.00"
                type="text"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Visual Category Selector Grid */}
          <div className="flex flex-col gap-1.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
              Select Category
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'Food', icon: 'restaurant' },
                { name: 'Transport', label: 'Transit', icon: 'directions_subway' },
                { name: 'Shopping', icon: 'shopping_bag' },
                { name: 'Bills', icon: 'receipt_long' },
              ].map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCat(cat.name)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all active:scale-95 ${
                    selectedCat === cat.name
                      ? 'bg-surface-container-high text-primary ring-1 ring-primary/40 font-bold'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                  type="button"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center mb-1 ${
                      selectedCat === cat.name ? 'bg-primary/15 text-primary' : 'bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                  </div>
                  <span className="font-label-sm text-label-sm">{cat.label || cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Source Chips */}
          <div className="flex flex-col gap-1.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
              Payment Method
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'UPI', icon: 'qr_code_scanner' },
                { name: 'Cash', icon: 'payments' },
                { name: 'Card', icon: 'credit_card' },
                { name: 'Bank', icon: 'account_balance' },
                { name: 'Other', icon: 'more_horiz' },
              ].map(method => (
                <button
                  key={method.name}
                  onClick={() => setSelectedMethod(method.name)}
                  className={`px-3 py-1.5 rounded-full font-label-sm flex items-center gap-1 active:scale-95 transition-all ${
                    selectedMethod === method.name
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">{method.icon}</span>
                  <span>{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Note Inputs */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                  Date
                </label>
                <span className="font-label-sm text-label-sm text-primary font-medium">Defaults to Today</span>
              </div>
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
                  placeholder="What was this for? (e.g., Whole Foods groceries)"
                  type="text"
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* CTA Submit Button */}
          <button
            onClick={handleSaveExpense}
            className="w-full bg-primary-container text-on-primary font-label-lg text-label-lg py-3 rounded-full shadow-lg active:scale-95 hover:bg-primary transition-all flex items-center justify-center gap-2 font-bold"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{editingExpenseId ? 'Update Expense' : 'Save Expense'}</span>
          </button>
        </section>
      )}

      {/* Grouped Expenses Ledger */}
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
                  -{currency}{group.total.toFixed(2)}
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

      {/* Delete Confirmation Dialog */}
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
