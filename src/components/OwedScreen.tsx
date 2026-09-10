import React, { useState, useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { LoanItem } from '../types';

export const OwedScreen: React.FC = () => {
  const {
    loans,
    addLoan,
    recordLoanRepayment,
    deleteLoan,
    totalAmountOwed,
    loanMetrics,
    currency,
  } = useLedger();

  // Form State
  const [isLendFormOpen, setIsLendFormOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [amountLent, setAmountLent] = useState('');
  const [dateLent, setDateLent] = useState(new Date().toISOString().split('T')[0]);
  const [channel, setChannel] = useState('UPI');
  const [note, setNote] = useState('');

  // Filter tab state
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'partial' | 'settled'>('all');

  // Repayment Modal State
  const [activeLoanForRepay, setActiveLoanForRepay] = useState<LoanItem | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayMethod, setRepayMethod] = useState('UPI');

  // History Dialog State
  const [historyLoan, setHistoryLoan] = useState<LoanItem | null>(null);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    if (filterTab === 'all') return loans;
    return loans.filter(l => l.status === filterTab);
  }, [loans, filterTab]);

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountLent);
    if (!personName.trim() || !val || isNaN(val) || val <= 0) {
      alert('Please specify a valid borrower name and loan amount.');
      return;
    }

    addLoan({
      personName: personName.trim(),
      amountLent: val,
      dateLent: dateLent || new Date().toISOString().split('T')[0],
      channel,
      note: note.trim() || 'Personal loan',
    });

    setPersonName('');
    setAmountLent('');
    setNote('');
    setIsLendFormOpen(false);
  };

  const handleConfirmRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoanForRepay) return;

    const amt = parseFloat(repayAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      alert('Please enter a valid repayment amount.');
      return;
    }

    recordLoanRepayment(activeLoanForRepay.id, {
      amount: amt,
      date: repayDate || new Date().toISOString().split('T')[0],
      method: repayMethod,
      note: `Repayment received via ${repayMethod}`,
    });

    setActiveLoanForRepay(null);
    setRepayAmount('');
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Top Summary Accent Hero Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container to-primary text-on-primary p-4 sm:p-5 shadow-lg">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-on-primary-container/10 pointer-events-none blur-2xl"></div>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-primary-container uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              Total Amount Currently Owed
            </span>
            <button
              onClick={() => setIsLendFormOpen(!isLendFormOpen)}
              className="flex items-center gap-1 bg-surface-container-lowest text-primary px-3 py-1 rounded-full shadow-sm active:scale-95 transition-all text-label-sm font-label-sm font-bold hover:bg-surface-container-low"
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isLendFormOpen ? 'close' : 'add'}
              </span>
              <span>{isLendFormOpen ? 'Cancel' : 'Lend Money'}</span>
            </button>
          </div>

          <div className="flex items-baseline gap-2 mt-0.5">
            <h1 className="font-metric-xl-mobile text-metric-xl-mobile md:text-4xl text-on-primary tracking-tight font-bold">
              {currency}{totalAmountOwed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
            <span className="font-label-sm text-label-sm text-on-primary-container/90">
              across {loanMetrics.totalCount} registered loans
            </span>
          </div>

          {/* Status Badges Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10 bg-black/10 p-2.5 rounded-xl">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-tertiary-fixed-dim flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
                {loanMetrics.pendingCount} Pending
              </span>
              <span className="font-label-lg text-label-lg text-on-primary font-bold mt-0.5">
                {currency}{loanMetrics.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary-fixed-dim flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim"></span>
                {loanMetrics.partialCount} Partial
              </span>
              <span className="font-label-lg text-label-lg text-on-primary font-bold mt-0.5">
                {currency}{loanMetrics.partialAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-primary-container flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container"></span>
                {loanMetrics.settledCount} Settled
              </span>
              <span className="font-label-lg text-label-lg text-on-primary font-bold mt-0.5">
                {currency}{loanMetrics.settledAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable 'Add Money Lent' Form */}
      {isLendFormOpen && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-md border border-surface-container flex flex-col gap-3 transition-all animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-1 border-b border-surface-container/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">send_money</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Record New Loan
              </h2>
            </div>
            <button
              onClick={() => setIsLendFormOpen(false)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSaveLoan} className="flex flex-col gap-3">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                Borrower's Full Name
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                <span className="material-symbols-outlined text-outline text-[18px] mr-2">person</span>
                <input
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
                  placeholder="e.g. Rahul Sharma, Maya Patel"
                  required
                  type="text"
                  value={personName}
                  onChange={e => setPersonName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                  Amount Lent ({currency})
                </label>
                <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                  <span className="font-label-md text-label-md text-outline mr-1.5 font-bold">{currency}</span>
                  <input
                    className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none font-bold"
                    placeholder="0.00"
                    required
                    step="0.01"
                    type="number"
                    value={amountLent}
                    onChange={e => setAmountLent(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                  Date Lent
                </label>
                <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                  <input
                    className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none text-xs"
                    type="date"
                    value={dateLent}
                    onChange={e => setDateLent(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                Disbursed Via
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['UPI', 'Cash', 'Bank Transfer', 'Other'].map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`px-3 py-1.5 rounded-full text-label-sm font-label-sm transition-all ${
                      channel === ch
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                Reason / Notes
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                <input
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
                  placeholder="e.g. Dinner split, Concert pass"
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>

            <button
              className="mt-1 w-full py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 hover:bg-primary-container transition-all"
              type="submit"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Record Loan</span>
            </button>
          </form>
        </section>
      )}

      {/* Filter Category Tabs */}
      <section className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap font-bold transition-all ${
            filterTab === 'all'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          All ({loans.length})
        </button>

        <button
          onClick={() => setFilterTab('pending')}
          className={`px-4 py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap font-bold transition-all ${
            filterTab === 'pending'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Pending ({loanMetrics.pendingCount})
        </button>

        <button
          onClick={() => setFilterTab('partial')}
          className={`px-4 py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap font-bold transition-all ${
            filterTab === 'partial'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Partially Paid ({loanMetrics.partialCount})
        </button>

        <button
          onClick={() => setFilterTab('settled')}
          className={`px-4 py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap font-bold transition-all ${
            filterTab === 'settled'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Fully Paid ({loanMetrics.settledCount})
        </button>
      </section>

      {/* Debt & Borrower Cards List */}
      <section className="flex flex-col gap-3">
        {filteredLoans.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2 border border-surface-container/60">
            <span className="material-symbols-outlined text-outline text-4xl">handshake</span>
            <p className="font-headline-sm text-on-surface font-bold">No Records in this Filter</p>
            <p className="font-body-sm text-on-surface-variant">Switch filter tabs or lend money above.</p>
          </div>
        ) : (
          filteredLoans.map(loan => {
            const percentRepaid = Math.round((loan.amountReceived / loan.amountLent) * 100);

            return (
              <article
                key={loan.id}
                className={`bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-surface-container/50 flex flex-col gap-3 transition-all ${
                  loan.status === 'settled' ? 'opacity-85' : 'hover:shadow-md'
                }`}
              >
                {/* Header row with Avatar & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center text-primary font-headline-sm font-bold border border-surface-container">
                      {loan.avatarUrl ? (
                        <img
                          className="w-full h-full object-cover"
                          alt={loan.personName}
                          src={loan.avatarUrl}
                        />
                      ) : loan.status === 'settled' ? (
                        <span className="material-symbols-outlined text-[24px] text-primary">check_circle</span>
                      ) : (
                        <span>{loan.personName.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                        {loan.personName}
                      </h3>
                      <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                        <span>Lent {currency}{loan.amountLent.toFixed(2)}</span>
                        <span>•</span>
                        <span>{loan.dateLent} via {loan.channel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1 bg-surface-container-high px-2.5 py-1 rounded-full shrink-0">
                    {loan.status === 'partial' && (
                      <>
                        <span className="material-symbols-outlined text-[13px] text-secondary">pie_chart</span>
                        <span className="font-label-sm text-label-sm text-secondary font-bold">Partially Paid</span>
                      </>
                    )}
                    {loan.status === 'pending' && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        <span className="font-label-sm text-label-sm text-tertiary font-bold">Pending</span>
                      </>
                    )}
                    {loan.status === 'settled' && (
                      <>
                        <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                        <span className="font-label-sm text-label-sm text-primary font-bold">Fully Paid</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar and calculation block */}
                <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1.5 border border-surface-container/60">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    {loan.status === 'settled' ? (
                      <span className="text-primary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">done_all</span>
                        Settled in full ({currency}{loan.amountLent.toFixed(2)})
                      </span>
                    ) : (
                      <span className="text-on-surface-variant font-medium">
                        {loan.status === 'partial'
                          ? `Settled: ${currency}${loan.amountReceived.toFixed(2)} of ${currency}${loan.amountLent.toFixed(2)} (${percentRepaid}%)`
                          : '0% Repaid'}
                      </span>
                    )}
                    <span
                      className={`font-bold ${
                        loan.status === 'settled'
                          ? 'text-outline'
                          : loan.status === 'partial'
                          ? 'text-secondary'
                          : 'text-tertiary'
                      }`}
                    >
                      Remaining {currency}{loan.remaining.toFixed(2)}
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        loan.status === 'settled'
                          ? 'bg-primary'
                          : loan.status === 'partial'
                          ? 'bg-secondary'
                          : 'bg-tertiary'
                      }`}
                      style={{ width: `${percentRepaid}%` }}
                    />
                  </div>

                  {loan.note && (
                    <span className="text-body-sm font-body-sm text-outline italic truncate">
                      "{loan.note}"
                    </span>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between pt-1">
                  {loan.status !== 'settled' ? (
                    <button
                      onClick={() => {
                        setActiveLoanForRepay(loan);
                        setRepayAmount('');
                        setRepayDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="text-primary hover:text-primary-container font-label-md text-label-md font-bold flex items-center gap-1 bg-on-primary-container/20 hover:bg-on-primary-container/30 px-3.5 py-1.5 rounded-full active:scale-95 transition-all"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_task</span>
                      <span>+ Receive Money</span>
                    </button>
                  ) : (
                    <span className="font-label-sm text-label-sm text-outline font-medium">
                      Settled via {loan.channel}
                    </span>
                  )}

                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <button
                      onClick={() => setHistoryLoan(loan)}
                      className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                      title="View Repayment History"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">history</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remove loan record for ${loan.personName}?`)) {
                          deleteLoan(loan.id);
                        }
                      }}
                      className="p-2 hover:bg-surface-container rounded-full text-error transition-colors"
                      title="Delete Loan"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Interactive Receive Money Repayment Modal */}
      {activeLoanForRepay && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-5 shadow-2xl flex flex-col gap-3.5 border border-surface-container"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-surface-container/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Record Repayment
                  </h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">
                    For {activeLoanForRepay.personName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveLoanForRepay(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Live Calculation Banner */}
            <div className="bg-surface-container-low p-3 rounded-xl text-body-sm font-body-sm flex flex-col gap-1 text-on-surface border border-surface-container/60">
              <div className="flex justify-between items-center text-label-sm font-label-sm">
                <span>Initial Lent: <strong>{currency}{activeLoanForRepay.amountLent.toFixed(2)}</strong></span>
                <span>Paid: <strong>{currency}{activeLoanForRepay.amountReceived.toFixed(2)}</strong></span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-surface-container text-primary font-label-md text-label-md">
                <span>New Remaining:</span>
                <span className="font-bold text-headline-sm text-primary">
                  {currency}{Math.max(0, activeLoanForRepay.remaining - (parseFloat(repayAmount) || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmRepayment} className="flex flex-col gap-3">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                  Amount Received ({currency})
                </label>
                <div className="flex items-center bg-surface-container rounded-xl px-3 py-2.5 border border-surface-container-high">
                  <span className="font-label-md text-label-md text-outline mr-1.5 font-bold">{currency}</span>
                  <input
                    className="w-full bg-transparent font-headline-sm text-headline-sm text-on-surface font-bold outline-none"
                    placeholder="Enter amount"
                    required
                    step="0.01"
                    type="number"
                    max={activeLoanForRepay.remaining}
                    value={repayAmount}
                    onChange={e => setRepayAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                  Received Date
                </label>
                <div className="flex items-center bg-surface-container rounded-xl px-3 py-2 border border-surface-container-high">
                  <input
                    className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none text-xs"
                    type="date"
                    value={repayDate}
                    onChange={e => setRepayDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                  Received Via
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['UPI', 'Cash', 'Bank Transfer', 'Other'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setRepayMethod(method)}
                      className={`px-3 py-1.5 rounded-full text-label-sm font-label-sm transition-all ${
                        repayMethod === method
                          ? 'bg-primary text-on-primary font-bold shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="mt-1 w-full py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 hover:bg-primary-container transition-all"
                type="submit"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                <span>Confirm Payment</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Log Dialog */}
      {historyLoan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-3 border border-surface-container"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">history</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Repayment Audit Log
                </h3>
              </div>
              <button
                onClick={() => setHistoryLoan(null)}
                className="text-on-surface-variant hover:text-on-surface p-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-on-surface-variant">
              Loan of <strong>{currency}{historyLoan.amountLent.toFixed(2)}</strong> to <strong>{historyLoan.personName}</strong> on {historyLoan.dateLent}.
            </p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
              {historyLoan.repayments.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-container-low text-center text-on-surface-variant text-body-sm">
                  No repayments have been recorded for {historyLoan.personName} yet.
                </div>
              ) : (
                historyLoan.repayments.map((rep, idx) => (
                  <div key={rep.id || idx} className="flex justify-between items-center p-2.5 rounded-xl bg-surface-container-low">
                    <div className="flex flex-col">
                      <span className="font-label-md text-on-surface font-bold">
                        +{currency}{rep.amount.toFixed(2)} via {rep.method}
                      </span>
                      <span className="font-label-sm text-outline">{rep.date}</span>
                    </div>
                    <span className="font-label-sm text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistoryLoan(null)}
                className="px-4 py-2 rounded-full bg-surface-container text-on-surface font-label-md font-semibold"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
