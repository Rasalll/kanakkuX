import React, { useState, useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { IncomeItem } from '../types';

export const IncomeScreen: React.FC = () => {
  const {
    incomes,
    addIncome,
    editIncome,
    deleteIncome,
    totalMonthlyIncome,
    currentMonth,
    incomeSourceBreakdown,
    currency,
    setCurrency,
  } = useLedger();

  // Collapsible Form State
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [amountInput, setAmountInput] = useState('');
  const [selectedSource, setSelectedSource] = useState('Salary');
  const [selectedDest, setSelectedDest] = useState('Bank Transfer');
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [memoInput, setMemoInput] = useState('');
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedFilterSource, setSelectedFilterSource] = useState<string>('all');
  const [incomeToDelete, setIncomeToDelete] = useState<IncomeItem | null>(null);

  // Filtered & Searched Incomes
  const filteredIncomes = useMemo(() => {
    let result = incomes.filter(inc => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inc.title.toLowerCase().includes(q) ||
        (inc.note && inc.note.toLowerCase().includes(q)) ||
        inc.source.toLowerCase().includes(q) ||
        inc.destination.toLowerCase().includes(q);

      const matchesSource =
        selectedFilterSource === 'all' ||
        inc.source.toLowerCase() === selectedFilterSource.toLowerCase();

      return matchesSearch && matchesSource;
    });

    result.sort((a, b) => {
      if (sortOrder === 'desc') return b.date.localeCompare(a.date);
      return a.date.localeCompare(b.date);
    });

    return result;
  }, [incomes, searchQuery, selectedFilterSource, sortOrder]);

  // Group into 'This Week' and 'Earlier in Cycle'
  const groupedIncomes = useMemo(() => {
    const thisWeek: IncomeItem[] = [];
    const earlier: IncomeItem[] = [];

    filteredIncomes.forEach(inc => {
      if (inc.date >= '2024-10-20') {
        thisWeek.push(inc);
      } else {
        earlier.push(inc);
      }
    });

    return { thisWeek, earlier };
  }, [filteredIncomes]);

  const handleSaveIncome = () => {
    const cleanAmount = amountInput.replace(/[^0-9.]/g, '');
    const val = Math.abs(parseFloat(cleanAmount) || 0);
    if (!val) {
      alert('Please enter a valid inflow amount.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingIncomeId) {
        editIncome(editingIncomeId, {
          title: memoInput.trim() || `${selectedSource} Inflow`,
          amount: val,
          source: selectedSource,
          destination: selectedDest,
          date: dateInput,
          note: memoInput.trim(),
        });
        setEditingIncomeId(null);
      } else {
        addIncome({
          title: memoInput.trim() || `${selectedSource} Inflow`,
          amount: val,
          source: selectedSource,
          destination: selectedDest,
          date: dateInput || new Date().toISOString().split('T')[0],
          note: memoInput.trim() || `${selectedSource} payment`,
        });
      }

      setAmountInput('');
      setMemoInput('');
      setIsSaving(false);
    }, 400);
  };

  const startEdit = (inc: IncomeItem) => {
    setEditingIncomeId(inc.id);
    setAmountInput(inc.amount.toString());
    setSelectedSource(inc.source);
    setSelectedDest(inc.destination);
    setDateInput(inc.date);
    setMemoInput(inc.title || inc.note || '');
    setIsFormOpen(true);
  };

  const getSourceIcon = (src: string) => {
    const s = src.toLowerCase();
    if (s.includes('salary')) return 'corporate_fare';
    if (s.includes('freelance')) return 'design_services';
    if (s.includes('invest') || s.includes('etf')) return 'show_chart';
    if (s.includes('bond') || s.includes('div')) return 'savings';
    if (s.includes('rent')) return 'home_work';
    return 'account_balance_wallet';
  };

  const getSourceStyles = (src: string) => {
    const s = src.toLowerCase();
    if (s.includes('salary')) return { bg: 'bg-primary/10', text: 'text-primary' };
    if (s.includes('freelance')) return { bg: 'bg-secondary/10', text: 'text-secondary' };
    if (s.includes('invest')) return { bg: 'bg-tertiary-container/15', text: 'text-tertiary-container' };
    return { bg: 'bg-primary/10', text: 'text-primary' };
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Top Income Summary Hero Card */}
      <section className="relative overflow-hidden rounded-2xl bg-primary-container text-on-primary p-4 sm:p-5 shadow-lg shadow-primary-container/20">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/30 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute top-2 right-3 opacity-15">
          <span className="material-symbols-outlined text-[72px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            trending_up
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-primary-container tracking-wider uppercase font-semibold">
              Cycle Earnings
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-lowest/15 px-2.5 py-0.5 font-label-sm text-label-sm text-on-primary backdrop-blur-md font-medium">
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              {currentMonth}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-headline-sm text-headline-sm text-on-primary-container font-semibold">
              +{currency}
            </span>
            <h1 className="font-metric-xl-mobile text-metric-xl-mobile md:text-4xl font-bold tracking-tight text-on-primary">
              {totalMonthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>

          <div className="pt-1 flex items-center justify-between font-body-sm text-body-sm text-on-primary-container">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-on-primary">arrow_upward</span>
              <span className="font-bold text-on-primary">+14.2%</span>
              <span>vs 3-mo avg ({currency}6,305.00)</span>
            </div>
            <button
              className="flex items-center justify-center w-7 h-7 rounded-full bg-on-primary-container/20 text-on-primary active:scale-95 transition-transform"
              title="Income Trends"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">insights</span>
            </button>
          </div>
        </div>
      </section>

      {/* Income Source Breakdown */}
      <section className="rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-xs border border-surface-container/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">pie_chart</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Income Inflow Mix</h2>
          </div>
          <span className="font-label-md text-label-md text-primary font-bold">
            {incomeSourceBreakdown.length} Sources
          </span>
        </div>

        {/* Mini Progress Bars */}
        <div className="w-full flex h-2.5 rounded-full overflow-hidden bg-surface-container-high mb-3 gap-0.5">
          {incomeSourceBreakdown.map((item, idx) => (
            <div
              key={idx}
              className={`h-full ${item.colorClass} transition-all duration-500`}
              style={{ width: `${Math.max(8, item.percent)}%` }}
              title={`${item.source}: ${currency}${item.amount}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {incomeSourceBreakdown.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <span className={`w-2 h-2 rounded-full ${item.colorClass}`}></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate font-medium">
                  {item.source}
                </span>
              </div>
              <span className="font-label-lg text-label-lg font-bold text-on-surface">
                {currency}{item.amount.toLocaleString()}
              </span>
              <span className="font-body-sm text-body-sm text-outline text-[11px]">{item.percent}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* Add Income Interactive Collapsible Card */}
      <section className="rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-xs border border-surface-container/60 transition-all duration-300">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">
                {editingIncomeId ? 'edit_note' : 'add_circle'}
              </span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {editingIncomeId ? 'Edit Income Entry' : 'Record Fresh Income'}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Log paychecks, client milestones & dividends
              </p>
            </div>
          </div>
          <button
            aria-label="Toggle Form"
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface transition-transform duration-200"
            style={{ transform: isFormOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">expand_less</span>
          </button>
        </div>

        {/* Collapsible Form Contents */}
        {isFormOpen && (
          <form
            className="flex flex-col gap-4 mt-4 pt-2 border-t border-surface-container/60 animate-in fade-in"
            onSubmit={e => {
              e.preventDefault();
              handleSaveIncome();
            }}
          >
            {/* Currency & Amount Field */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                Inflow Amount
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-2 flex items-center bg-surface-container-high rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setCurrency('$')}
                    className={`px-2 py-1 rounded-md font-label-md text-label-md font-bold transition-all ${
                      currency === '$'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('₹')}
                    className={`px-2 py-1 rounded-md font-label-md text-label-md font-bold transition-all ${
                      currency === '₹'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    ₹
                  </button>
                </div>
                <input
                  className="w-full h-12 pl-20 pr-4 rounded-xl bg-surface-container-low font-headline-md text-headline-md text-on-surface placeholder:text-outline/40 focus:bg-surface-container-lowest focus:outline-none border border-transparent focus:border-primary/40 transition-colors font-bold"
                  placeholder="0.00"
                  inputMode="decimal"
                  type="text"
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                />
              </div>
            </div>

            {/* Source Selector */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                Income Source
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Salary', 'Freelance', 'Investments', 'Rental', 'Refund', 'Bonus', 'Other'].map(src => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSelectedSource(src)}
                    className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all ${
                      selectedSource === src
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Chips */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">
                Deposit Destination
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Bank Transfer', icon: 'account_balance' },
                  { name: 'UPI', icon: 'qr_code_scanner' },
                  { name: 'Card', icon: 'credit_card' },
                  { name: 'Cash', icon: 'payments' },
                  { name: 'Other', icon: 'more_horiz' },
                ].map(dest => (
                  <button
                    key={dest.name}
                    type="button"
                    onClick={() => setSelectedDest(dest.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-all ${
                      selectedDest === dest.name
                        ? 'bg-secondary text-on-secondary font-bold shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{dest.icon}</span>
                    <span>{dest.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Memo */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                  Transaction Date
                </label>
                <span className="font-label-sm text-label-sm text-primary flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  Selected: Today (Auto-assigned)
                </span>
              </div>
              <input
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface focus:bg-surface-container-lowest focus:outline-none border border-surface-container"
                type="date"
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
              />

              <label className="font-label-md text-label-md text-on-surface-variant pt-1 font-semibold">
                Memo / Client Reference
              </label>
              <div className="relative">
                <input
                  className="w-full h-11 pl-3 pr-9 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-outline/50 focus:bg-surface-container-lowest focus:outline-none border border-surface-container"
                  placeholder="e.g. Q3 Project Milestone 1"
                  type="text"
                  value={memoInput}
                  onChange={e => setMemoInput(e.target.value)}
                />
                <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline pointer-events-none">
                  edit_note
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary-container active:scale-[0.98] transition-all"
              type="submit"
              disabled={isSaving}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSaving ? 'sync' : 'check_circle'}
              </span>
              <span>{editingIncomeId ? 'Update Income Entry' : 'Save Income Flow'}</span>
            </button>
          </form>
        )}
      </section>

      {/* Filter & Search Section */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Income Inflow Logs</h3>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
            Showing {filteredIncomes.length} Entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-outline">
              search
            </span>
            <input
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-lowest font-body-sm text-body-sm text-on-surface placeholder:text-outline/60 focus:outline-none border border-surface-container/60 shadow-xs"
              placeholder="Search by client, memo or source..."
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => {
              const sources = ['all', 'Salary', 'Freelance', 'Investments'];
              const curIdx = sources.indexOf(selectedFilterSource);
              setSelectedFilterSource(sources[(curIdx + 1) % sources.length]);
            }}
            className={`min-w-[44px] min-h-[44px] rounded-xl bg-surface-container-lowest flex items-center justify-center transition-all border border-surface-container/60 shadow-xs ${
              selectedFilterSource !== 'all' ? 'text-primary font-bold ring-1 ring-primary/40' : 'text-on-surface-variant'
            }`}
            title={`Filter by source (Current: ${selectedFilterSource})`}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>

          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-surface border border-surface-container/60 shadow-xs active:scale-95 transition-all"
            title={`Sort order: ${sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}`}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">sort</span>
          </button>
        </div>
      </section>

      {/* Income Records List */}
      <section className="flex flex-col gap-3">
        {/* Group: This Week */}
        {groupedIncomes.thisWeek.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider px-1 pt-1 font-bold">
              This Week
            </div>

            {groupedIncomes.thisWeek.map(record => {
              const styles = getSourceStyles(record.source);
              const icon = getSourceIcon(record.source);

              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container/40 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full ${styles.bg} ${styles.text} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-[22px]">{icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-label-lg text-label-lg text-on-surface font-bold truncate">
                          {record.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-secondary-fixed-variant font-medium">
                          {record.destination}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {record.note || record.source}
                      </p>
                      <span className="font-label-sm text-label-sm text-outline pt-0.5">
                        {record.date} • Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span className="font-label-lg text-label-lg font-bold text-primary">
                      {currency}{record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        aria-label="Edit Record"
                        onClick={() => startEdit(record)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container active:scale-90 transition-all"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        aria-label="Delete Record"
                        onClick={() => setIncomeToDelete(record)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container active:scale-90 transition-all"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Group: Earlier in Cycle */}
        {groupedIncomes.earlier.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider px-1 pt-1 font-bold">
              Earlier in Cycle
            </div>

            {groupedIncomes.earlier.map(record => {
              const styles = getSourceStyles(record.source);
              const icon = getSourceIcon(record.source);

              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container/40 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full ${styles.bg} ${styles.text} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-[22px]">{icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-label-lg text-label-lg text-on-surface font-bold truncate">
                          {record.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-secondary-fixed-variant font-medium">
                          {record.destination}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {record.note || record.source}
                      </p>
                      <span className="font-label-sm text-label-sm text-outline pt-0.5">
                        {record.date} • Completed
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span className="font-label-lg text-label-lg font-bold text-primary">
                      {currency}{record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        aria-label="Edit Record"
                        onClick={() => startEdit(record)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container active:scale-90 transition-all"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        aria-label="Delete Record"
                        onClick={() => setIncomeToDelete(record)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container active:scale-90 transition-all"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredIncomes.length === 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2 border border-surface-container/60">
            <span className="material-symbols-outlined text-outline text-4xl">savings</span>
            <p className="font-headline-sm text-on-surface font-bold">No Income Entries</p>
            <p className="font-body-sm text-on-surface-variant">Adjust your search query or record fresh income above.</p>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {incomeToDelete && (
        <div className="fixed inset-x-4 bottom-24 z-50 max-w-sm mx-auto bg-inverse-surface text-inverse-on-surface p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-error-container text-[20px] shrink-0">warning</span>
            <span className="font-body-md text-body-md truncate">Remove "{incomeToDelete.title}"?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIncomeToDelete(null)}
              className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg text-inverse-on-surface/80 hover:bg-white/10"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteIncome(incomeToDelete.id);
                setIncomeToDelete(null);
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
