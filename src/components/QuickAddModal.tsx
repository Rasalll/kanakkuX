'use client';

import React, { useState, useEffect } from 'react';
import { useLedger } from '../context/LedgerContext';

export const QuickAddModal: React.FC = () => {
  const {
    quickAddModalOpen,
    quickAddDefaultTab,
    closeQuickAdd,
    addExpense,
    addIncome,
    addLoan,
    currency,
    customCategories,
    sourcesList,
    addCustomSource,
  } = useLedger();

  const [tab, setTab] = useState<'expense' | 'income' | 'lent'>('expense');
  const [lentMode, setLentMode] = useState<'lent' | 'loan'>('lent');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('Food');
  const [source, setSource] = useState<string>('');
  const [newSourceInput, setNewSourceInput] = useState<string>('');
  const [showAddSource, setShowAddSource] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [errorShake, setErrorShake] = useState(false);

  useEffect(() => {
    if (quickAddModalOpen) {
      setTab(quickAddDefaultTab);
      setLentMode('lent');
      setAmount('');
      setNote('');
      setSource('');
      setNewSourceInput('');
      setShowAddSource(false);
      setDate(new Date().toISOString().split('T')[0]);
      if (quickAddDefaultTab === 'expense') {
        setCategory('Food');
        setPaymentMethod('UPI');
      } else if (quickAddDefaultTab === 'income') {
        setCategory('Salary');
        setPaymentMethod('Bank Transfer');
      } else {
        setCategory('Personal');
        setPaymentMethod('UPI');
      }
    }
  }, [quickAddModalOpen, quickAddDefaultTab]);

  if (!quickAddModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    const val = Math.abs(parseFloat(cleanAmount) || 0);
    if (!val) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 800);
      return;
    }

    if (tab === 'expense') {
      await addExpense({
        title: note.trim() || `${category} Expense`,
        note: note.trim() || (null as any),
        amount: val,
        category,
        source: source || undefined,
        paymentMethod,
        date: date || new Date().toISOString().split('T')[0],
      });
    } else if (tab === 'income') {
      await addIncome({
        title: note.trim() || `${source || category} Inflow`,
        note: note.trim() || (null as any),
        amount: val,
        source: source || category || 'Salary',
        destination: paymentMethod,
        date: date || new Date().toISOString().split('T')[0],
      });
    } else {
      const isLoan = lentMode === 'loan';
      await addLoan({
        personName: note.trim() || (isLoan ? 'Lender' : 'Friend'),
        amountLent: val,
        dateLent: date || new Date().toISOString().split('T')[0],
        channel: paymentMethod,
        note: isLoan ? `Loan on ${date || new Date().toISOString().split('T')[0]}` : `Lent on ${date || new Date().toISOString().split('T')[0]}`,
        type: lentMode,
      });
    }

    closeQuickAdd();
  };

  const handleCreateSource = async () => {
    if (!newSourceInput.trim()) return;
    await addCustomSource(newSourceInput.trim());
    setSource(newSourceInput.trim());
    setNewSourceInput('');
    setShowAddSource(false);
  };

  const getTitle = () => {
    if (tab === 'expense') return 'Log New Expense';
    if (tab === 'income') return 'Add New Income Stream';
    return lentMode === 'loan' ? 'Register Loan Taken' : 'Register Money Lent';
  };

  const allCategories = Array.from(new Set(['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Subs', ...customCategories]));
  const allSources = Array.from(new Set(['Salary', 'Freelance', 'Business', 'Investments', 'Rental', 'Gift', ...sourcesList]));

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">bolt</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {getTitle()}
            </h3>
          </div>
          <button
            onClick={closeQuickAdd}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-xl">
          {(['expense', 'income', 'lent'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`py-2 rounded-lg font-label-md text-label-md font-bold capitalize transition-all ${
                tab === t
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t === 'lent' ? 'Lent / Loan' : t}
            </button>
          ))}
        </div>

        {tab === 'lent' && (
          <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl">
            <button
              type="button"
              onClick={() => setLentMode('lent')}
              className={`flex-1 py-1.5 rounded-lg font-label-sm text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                lentMode === 'lent'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              <span>Lent (I Gave)</span>
            </button>
            <button
              type="button"
              onClick={() => setLentMode('loan')}
              className={`flex-1 py-1.5 rounded-lg font-label-sm text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                lentMode === 'loan'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              <span>Loan (Borrowed)</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
              Amount ({currency})
            </label>
            <div className={`flex items-center bg-surface-container rounded-xl px-3.5 py-2.5 border transition-all ${
              errorShake ? 'border-error animate-shake' : 'border-surface-container-high'
            }`}>
              <span className="font-label-lg text-label-lg text-primary mr-2 font-bold">{currency}</span>
              <input
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                className="w-full bg-transparent font-headline-sm text-headline-sm text-on-surface font-bold outline-none"
              />
            </div>
          </div>

          {tab === 'expense' && (
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar">
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-full text-label-sm font-label-sm transition-all ${
                      category === cat
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab !== 'lent' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                  Money Source
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddSource(!showAddSource)}
                  className="text-primary text-label-sm font-semibold hover:underline"
                >
                  + Custom Source
                </button>
              </div>

              {showAddSource && (
                <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-surface-container-low border border-surface-container">
                  <input
                    type="text"
                    value={newSourceInput}
                    onChange={e => setNewSourceInput(e.target.value)}
                    placeholder="e.g. HDFC Salary, Cash Stash"
                    className="flex-1 bg-transparent text-body-md text-on-surface outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleCreateSource}
                    className="px-3 py-1 bg-primary text-on-primary rounded-lg text-label-sm font-bold"
                  >
                    Save
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSource('')}
                  className={`px-3 py-1 rounded-full text-label-sm font-label-sm transition-all ${
                    !source
                      ? 'bg-surface-container-highest text-on-surface font-bold'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  None
                </button>
                {allSources.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSource(s)}
                    className={`px-3 py-1 rounded-full text-label-sm font-label-sm transition-all ${
                      source === s
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
              Payment Method
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(tab === 'lent' ? ['UPI', 'Cash', 'Bank Transfer', 'Other'] : ['UPI', 'Card', 'Bank Transfer', 'Cash', 'Other']).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`px-3 py-1.5 rounded-full text-label-sm font-label-sm transition-all ${
                    paymentMethod === m
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                Date
              </label>
              <div className="flex items-center bg-surface-container rounded-xl px-3 py-2 border border-surface-container-high">
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                {tab === 'lent' ? (lentMode === 'loan' ? "Lender's Name" : "Borrower's Name") : 'Memo'}
              </label>
              <div className="flex items-center bg-surface-container rounded-xl px-3 py-2 border border-surface-container-high">
                <input
                  type="text"
                  placeholder={tab === 'lent' ? (lentMode === 'loan' ? 'Lender Name' : 'Borrower Name') : 'Note'}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none text-xs"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Save to Cloud</span>
          </button>
        </form>
      </div>
    </div>
  );
};
