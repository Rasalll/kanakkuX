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
  } = useLedger();

  const [tab, setTab] = useState<'expense' | 'income' | 'lent'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('Food');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [errorShake, setErrorShake] = useState(false);

  useEffect(() => {
    if (quickAddModalOpen) {
      setTab(quickAddDefaultTab);
      setAmount('');
      setNote('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || isNaN(val) || val <= 0) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 800);
      return;
    }

    if (tab === 'expense') {
      addExpense({
        title: note.trim() || `${category} Expense`,
        note: note.trim() || 'Quick logged outflow',
        amount: val,
        category,
        paymentMethod,
        date: date || new Date().toISOString().split('T')[0],
      });
    } else if (tab === 'income') {
      addIncome({
        title: note.trim() || `${category} Inflow`,
        note: note.trim() || 'Recorded income flow',
        amount: val,
        source: category,
        destination: paymentMethod,
        date: date || new Date().toISOString().split('T')[0],
      });
    } else {
      addLoan({
        personName: note.trim() || 'Friend',
        amountLent: val,
        dateLent: date || new Date().toISOString().split('T')[0],
        channel: paymentMethod,
        note: `Loan disbursed via ${paymentMethod}`,
      });
    }

    closeQuickAdd();
  };

  const getTitle = () => {
    if (tab === 'expense') return 'Log New Expense';
    if (tab === 'income') return 'Add New Income Stream';
    return 'Register Lent Loan';
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag Handle Indicator on Mobile */}
        <div 
          className="w-12 h-1.5 rounded-full bg-surface-variant mx-auto sm:hidden cursor-pointer" 
          onClick={closeQuickAdd}
        />

        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            {getTitle()}
          </h3>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            onClick={closeQuickAdd}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Segment Tabs */}
        <div className="grid grid-cols-3 p-1 rounded-xl bg-surface-container-low text-on-surface-variant">
          <button
            type="button"
            onClick={() => setTab('expense')}
            className={`py-2 text-center rounded-lg font-label-md transition-all ${
              tab === 'expense'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setTab('income')}
            className={`py-2 text-center rounded-lg font-label-md transition-all ${
              tab === 'income'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setTab('lent')}
            className={`py-2 text-center rounded-lg font-label-md transition-all ${
              tab === 'lent'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Lent
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Amount Input */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {tab === 'lent' ? 'Loan Sum' : 'Transaction Sum'}
            </label>
            <div className={`relative flex items-center transition-transform ${errorShake ? 'animate-bounce text-error' : ''}`}>
              <span className="absolute left-4 font-headline-md text-headline-md text-primary font-bold">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                className="w-full h-14 pl-10 pr-4 rounded-xl bg-surface-container-low font-headline-md text-headline-md text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary/40 shadow-inner"
              />
            </div>
          </div>

          {/* Note or Name Input */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {tab === 'lent' ? "Borrower's Full Name" : 'Note / Counterparty'}
            </label>
            <input
              type="text"
              placeholder={tab === 'lent' ? 'e.g. David Miller, Priya V.' : 'e.g. Dinner, Client Retainer, David M.'}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary/40"
            />
          </div>

          {/* Dynamic Category / Source Selection */}
          {tab === 'expense' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Subs'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full font-label-sm transition-all ${
                      category === cat
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'income' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Income Source</label>
              <div className="flex flex-wrap gap-1.5">
                {['Salary', 'Freelance', 'Investments', 'Rental', 'Refund', 'Bonus'].map(src => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setCategory(src)}
                    className={`px-3 py-1.5 rounded-full font-label-sm transition-all ${
                      category === src
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method / Channel Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {tab === 'income' ? 'Deposit Destination' : 'Payment Method'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['UPI', 'Bank Transfer', 'Card', 'Cash', 'Other'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`px-3 py-1.5 rounded-full font-label-sm transition-all ${
                    paymentMethod === method
                      ? 'bg-secondary text-on-secondary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Date Input */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Date</label>
              <span className="font-label-sm text-primary">Defaults to Today</span>
            </div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest"
            />
          </div>

          {/* Commit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Commit Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
