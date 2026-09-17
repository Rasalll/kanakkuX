'use client';

import React, { useState, useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { LoanItem } from '../types';

export const OwedScreen: React.FC = () => {
  const {
    loans,
    addLoan,
    updateLoan,
    recordLoanRepayment,
    deleteLoan,
    totalAmountOwed,
    loanMetrics,
    currency,
    isSaving,
  } = useLedger();

  // Add form states
  const [isLendFormOpen, setIsLendFormOpen] = useState(false);
  const [recordType, setRecordType] = useState<'lent' | 'loan'>('lent');
  const [personName, setPersonName] = useState('');
  const [amountLent, setAmountLent] = useState('');
  const [dateLent, setDateLent] = useState(new Date().toISOString().split('T')[0]);
  const [channel, setChannel] = useState('UPI');
  const [note, setNote] = useState('');

  // Filtering
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'partial' | 'settled'>('all');

  // Edit modal states
  const [editingLoan, setEditingLoan] = useState<LoanItem | null>(null);
  const [editType, setEditType] = useState<'lent' | 'loan'>('lent');
  const [editPersonName, setEditPersonName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editChannel, setEditChannel] = useState('UPI');
  const [editNote, setEditNote] = useState('');

  // Repayment modal states
  const [activeLoanForRepay, setActiveLoanForRepay] = useState<LoanItem | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayMethod, setRepayMethod] = useState('UPI');

  // Audit history modal states
  const [historyLoan, setHistoryLoan] = useState<LoanItem | null>(null);

  const filteredLoans = useMemo(() => {
    if (filterTab === 'all') return loans;
    return loans.filter(l => l.status === filterTab);
  }, [loans, filterTab]);

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const cleanAmount = amountLent.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleanAmount);
    if (!personName.trim() || !val || isNaN(val) || val <= 0) {
      alert(`Please specify a valid ${recordType === 'loan' ? 'lender' : 'borrower'} name and amount.`);
      return;
    }

    const defaultMemo = recordType === 'loan' ? `Loan on ${dateLent}` : `Lent on ${dateLent}`;

    await addLoan({
      personName: personName.trim(),
      amountLent: val,
      dateLent: dateLent || new Date().toISOString().split('T')[0],
      channel,
      note: note.trim() || defaultMemo,
      type: recordType,
    });

    setPersonName('');
    setAmountLent('');
    setNote('');
    setIsLendFormOpen(false);
  };

  const handleOpenEdit = (loan: LoanItem) => {
    setEditingLoan(loan);
    setEditType(loan.type || 'lent');
    setEditPersonName(loan.personName);
    setEditAmount(loan.amountLent.toString());
    setEditDate(loan.dateLent);
    setEditChannel(loan.channel);
    setEditNote(loan.note || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!editingLoan) return;

    const clean = editAmount.replace(/[^0-9.]/g, '');
    const val = parseFloat(clean);
    if (!editPersonName.trim() || !val || isNaN(val) || val <= 0) {
      alert('Please provide a valid name and amount.');
      return;
    }

    await updateLoan(editingLoan.id, {
      personName: editPersonName.trim(),
      amountLent: val,
      dateLent: editDate || new Date().toISOString().split('T')[0],
      channel: editChannel,
      note: editNote.trim(),
      type: editType,
    });

    setEditingLoan(null);
  };

  const handleConfirmRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!activeLoanForRepay) return;

    const cleanAmount = repayAmount.replace(/[^0-9.]/g, '');
    const amt = parseFloat(cleanAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      alert('Please enter a valid repayment amount.');
      return;
    }

    const isLoan = activeLoanForRepay.type === 'loan';
    const noteText = isLoan
      ? `Loan return on ${repayDate || new Date().toISOString().split('T')[0]}`
      : `Lent return on ${repayDate || new Date().toISOString().split('T')[0]}`;

    await recordLoanRepayment(activeLoanForRepay.id, {
      amount: amt,
      date: repayDate || new Date().toISOString().split('T')[0],
      method: repayMethod,
      note: noteText,
    });

    setActiveLoanForRepay(null);
    setRepayAmount('');
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Top Metrics Banner */}
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
              <span>{isLendFormOpen ? 'Cancel' : 'New Lent / Loan'}</span>
            </button>
          </div>

          <div className="flex items-baseline gap-2 mt-0.5">
            <h1 className="font-metric-xl-mobile text-metric-xl-mobile md:text-4xl text-on-primary tracking-tight font-bold">
              {currency}{totalAmountOwed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
            <span className="font-label-sm text-label-sm text-on-primary-container/90">
              across {loanMetrics.totalCount} registered records
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10 bg-black/10 p-2.5 rounded-xl">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-tertiary-fixed-dim flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
                {loanMetrics.pendingCount} Pending
              </span>
              <span className="font-label-lg text-label-lg text-on-primary font-bold mt-0.5">
                {currency}{loanMetrics.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary-fixed-dim flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim"></span>
                {loanMetrics.partialCount} Partial
              </span>
              <span className="font-label-lg text-label-lg text-on-primary font-bold mt-0.5">
                {currency}{loanMetrics.partialAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-primary-container flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container"></span>
                {loanMetrics.settledCount} Settled
              </span>
              <span className="font-label-lg text-label-lg text-on-primary font-bold mt-0.5">
                {currency}{loanMetrics.settledAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Record New Lent / Loan Form */}
      {isLendFormOpen && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-md border border-surface-container flex flex-col gap-3 transition-all animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-1 border-b border-surface-container/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">
                  {recordType === 'loan' ? 'account_balance' : 'send_money'}
                </span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {recordType === 'loan' ? 'Record Loan Taken' : 'Record Money Lent'}
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

          {/* Type Toggle: Lent vs Loan */}
          <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl">
            <button
              type="button"
              onClick={() => setRecordType('lent')}
              className={`flex-1 py-2 rounded-lg font-label-md text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                recordType === 'lent'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              <span>I Lent (Money Given)</span>
            </button>
            <button
              type="button"
              onClick={() => setRecordType('loan')}
              className={`flex-1 py-2 rounded-lg font-label-md text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                recordType === 'loan'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              <span>Loan (Money Borrowed)</span>
            </button>
          </div>

          <form onSubmit={handleSaveLoan} className="flex flex-col gap-3">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                {recordType === 'loan' ? "Lender's Full Name" : "Borrower's Full Name"}
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                <span className="material-symbols-outlined text-outline text-[18px] mr-2">person</span>
                <input
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
                  placeholder={recordType === 'loan' ? "e.g. Bank, Friend, Colleague" : "e.g. Rahul Sharma"}
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
                  {recordType === 'loan' ? `Loan Amount (${currency})` : `Amount Lent (${currency})`}
                </label>
                <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                  <span className="font-label-md text-label-md text-outline mr-1.5 font-bold">{currency}</span>
                  <input
                    className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none font-bold"
                    placeholder="0.00"
                    required
                    type="text"
                    value={amountLent}
                    onChange={e => setAmountLent(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                  {recordType === 'loan' ? 'Loan Date' : 'Date Lent'}
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
                Channel
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
                Memo / Reason
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                <span className="material-symbols-outlined text-outline text-[18px] mr-2">description</span>
                <input
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none text-sm placeholder:text-outline"
                  placeholder={recordType === 'loan' ? "e.g. Home appliance loan" : "e.g. Travel tickets assistance"}
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>

            <button
              className="mt-1 w-full py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 hover:bg-primary-container transition-all disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed"
              type="submit"
              disabled={isSaving}
            >
              <span className="material-symbols-outlined text-[18px]">{isSaving ? 'hourglass_top' : 'check'}</span>
              <span>
                {isSaving
                  ? 'Saving...'
                  : recordType === 'loan'
                    ? 'Save Loan Record'
                    : 'Save Lent Record'}
              </span>
            </button>
          </form>
        </section>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-surface-container pb-2">
        <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl">
          {(['all', 'pending', 'partial', 'settled'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 rounded-lg font-label-sm text-label-sm capitalize transition-all ${
                filterTab === tab
                  ? 'bg-surface-container-lowest font-bold text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {filteredLoans.length} entries
        </span>
      </div>

      {/* Records List */}
      <section className="flex flex-col gap-3">
        {filteredLoans.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2 border border-surface-container/60">
            <span className="material-symbols-outlined text-outline text-4xl">handshake</span>
            <p className="font-headline-sm text-on-surface font-bold">No Records Found</p>
            <p className="font-body-sm text-on-surface-variant">
              {filterTab === 'all'
                ? 'No lent or loan records found. Record your first entry above!'
                : `No ${filterTab} records right now.`}
            </p>
          </div>
        ) : (
          filteredLoans.map(loan => {
            const isLoan = loan.type === 'loan';
            const dataTitle = isLoan ? `Loan on ${loan.dateLent}` : `Lent on ${loan.dateLent}`;

            return (
              <div
                key={loan.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container/40 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                      isLoan ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary'
                    }`}>
                      {loan.personName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      {/* Title according to requirement: "loan on date" if loan, "lent on date" if lent */}
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {dataTitle}
                      </h3>
                      <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                        <span className="font-label-md text-xs font-semibold text-on-surface">
                          {loan.personName}
                        </span>
                        <span className="text-outline text-xs">•</span>
                        <span className="font-label-sm text-outline text-xs">
                          via {loan.channel}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold uppercase tracking-wider ${
                            isLoan
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {isLoan ? 'Loan' : 'Lent'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold uppercase ${
                            loan.status === 'settled'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : loan.status === 'partial'
                              ? 'bg-secondary-fixed-dim/20 text-secondary'
                              : 'bg-tertiary-fixed-dim/20 text-tertiary-container'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="font-label-sm text-outline">Remaining</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">
                      {currency}{loan.remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="font-body-sm text-[11px] text-outline">
                      of {currency}{loan.amountLent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {loan.note && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-xl text-xs">
                    {loan.note}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-surface-container/40">
                  <button
                    onClick={() => setHistoryLoan(loan)}
                    className="flex items-center gap-1 font-label-sm text-label-sm text-outline hover:text-on-surface transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    <span>History ({loan.repayments.length})</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Option for lent / loan */}
                    <button
                      onClick={() => handleOpenEdit(loan)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary/10 transition-all"
                      title="Edit Record"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>

                    {/* Delete Option */}
                    <button
                      onClick={() => deleteLoan(loan.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/30 transition-all"
                      title="Delete Record"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>

                    {/* Record Payment Option */}
                    {loan.status !== 'settled' && (
                      <button
                        onClick={() => {
                          setActiveLoanForRepay(loan);
                          setRepayAmount(loan.remaining.toString());
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                        <span>{isLoan ? 'Return Payment' : 'Record Payment'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Edit Loan / Lent Modal */}
      {editingLoan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-surface-container max-h-[92vh] overflow-y-auto no-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    {editType === 'loan' ? 'Edit Loan Record' : 'Edit Lent Record'}
                  </h3>
                  <span className="font-label-sm text-on-surface-variant block text-xs">
                    Update amount, contact, or type
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingLoan(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Type selector in Edit Modal */}
            <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl">
              <button
                type="button"
                onClick={() => setEditType('lent')}
                className={`flex-1 py-1.5 rounded-lg font-label-sm text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  editType === 'lent'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                <span>Lent (I Gave)</span>
              </button>
              <button
                type="button"
                onClick={() => setEditType('loan')}
                className={`flex-1 py-1.5 rounded-lg font-label-sm text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  editType === 'loan'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                <span>Loan (I Borrowed)</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                  {editType === 'loan' ? "Lender's Name" : "Borrower's Name"}
                </label>
                <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                  <span className="material-symbols-outlined text-outline text-[18px] mr-2">person</span>
                  <input
                    className="w-full bg-transparent font-body-md text-on-surface outline-none"
                    required
                    type="text"
                    value={editPersonName}
                    onChange={e => setEditPersonName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                    Amount ({currency})
                  </label>
                  <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                    <span className="font-label-md text-outline mr-1 font-bold">{currency}</span>
                    <input
                      className="w-full bg-transparent font-body-md text-on-surface outline-none font-bold"
                      required
                      type="text"
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                    Date
                  </label>
                  <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                    <input
                      className="w-full bg-transparent font-body-md text-on-surface outline-none text-xs"
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                  Channel
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['UPI', 'Cash', 'Bank Transfer', 'Other'].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setEditChannel(ch)}
                      className={`px-3 py-1.5 rounded-full text-label-sm font-label-sm transition-all ${
                        editChannel === ch
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
                  Memo / Note
                </label>
                <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container/60">
                  <span className="material-symbols-outlined text-outline text-[18px] mr-2">description</span>
                  <input
                    className="w-full bg-transparent font-body-md text-on-surface outline-none text-sm placeholder:text-outline"
                    type="text"
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLoan(null)}
                  className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface font-label-md font-semibold hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-label-md font-bold hover:bg-primary-container shadow-md transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment / Return Modal */}
      {activeLoanForRepay && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-surface-container"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activeLoanForRepay.type === 'loan' ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/10 text-primary'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">receipt</span>
                </div>
                <div>
                  {/* Title shows loan return on date if it's loan, or lent return on date if lent */}
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    {activeLoanForRepay.type === 'loan'
                      ? `Loan return on ${repayDate}`
                      : `Lent return on ${repayDate}`}
                  </h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">
                    {activeLoanForRepay.type === 'loan'
                      ? `Repaying loan from ${activeLoanForRepay.personName}`
                      : `Receiving payment from ${activeLoanForRepay.personName}`}
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

            <div className="bg-surface-container-low p-3 rounded-xl text-body-sm font-body-sm flex flex-col gap-1 text-on-surface border border-surface-container/60">
              <div className="flex justify-between items-center text-label-sm font-label-sm">
                <span>Total: <strong>{currency}{activeLoanForRepay.amountLent.toFixed(2)}</strong></span>
                <span>Settled: <strong>{currency}{activeLoanForRepay.amountReceived.toFixed(2)}</strong></span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-surface-container text-primary font-label-md text-label-md">
                <span>New Remaining:</span>
                <span className="font-bold text-headline-sm text-primary">
                  {currency}{Math.max(0, activeLoanForRepay.remaining - (parseFloat(repayAmount.replace(/[^0-9.]/g, '')) || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmRepayment} className="flex flex-col gap-3">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                  Amount ({currency})
                </label>
                <div className="flex items-center bg-surface-container rounded-xl px-3 py-2.5 border border-surface-container-high">
                  <span className="font-label-md text-label-md text-outline mr-1.5 font-bold">{currency}</span>
                  <input
                    className="w-full bg-transparent font-headline-sm text-headline-sm text-on-surface font-bold outline-none"
                    placeholder="Enter amount"
                    required
                    type="text"
                    value={repayAmount}
                    onChange={e => setRepayAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold">
                  Payment Date
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
                  Payment Method
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
                className="mt-1 w-full py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 hover:bg-primary-container transition-all disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed"
                type="submit"
                disabled={isSaving}
              >
                <span className="material-symbols-outlined text-[18px]">{isSaving ? 'hourglass_top' : 'check'}</span>
                <span>
                  {isSaving
                    ? 'Saving...'
                    : activeLoanForRepay.type === 'loan'
                      ? 'Confirm Loan Return'
                      : 'Confirm Lent Payment'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Audit Log Modal */}
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
                  {historyLoan.type === 'loan' ? 'Loan Return Log' : 'Lent Repayment Log'}
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
              {historyLoan.type === 'loan'
                ? `Loan on ${historyLoan.dateLent} of ${currency}${historyLoan.amountLent.toFixed(2)} with ${historyLoan.personName}.`
                : `Lent on ${historyLoan.dateLent} of ${currency}${historyLoan.amountLent.toFixed(2)} to ${historyLoan.personName}.`}
            </p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
              {historyLoan.repayments.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-container-low text-center text-on-surface-variant text-body-sm">
                  No return payments recorded for {historyLoan.personName} yet.
                </div>
              ) : (
                historyLoan.repayments.map((rep, idx) => (
                  <div key={rep.id || idx} className="flex justify-between items-center p-2.5 rounded-xl bg-surface-container-low">
                    <div className="flex flex-col">
                      <span className="font-label-md text-on-surface font-bold">
                        {historyLoan.type === 'loan'
                          ? `Loan return on ${rep.date}`
                          : `Lent return on ${rep.date}`}
                      </span>
                      <span className="font-label-sm text-outline text-xs">
                        +{currency}{rep.amount.toFixed(2)} via {rep.method}
                      </span>
                    </div>
                    <span className="font-label-sm text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full text-xs">
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
