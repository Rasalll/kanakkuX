'use client';

import React, { useState } from 'react';
import { useLedger } from '../context/LedgerContext';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentMonth,
    prevMonth,
    nextMonth,
    currency,
    setCurrency,
    openReportModal,
    showToast,
  } = useLedger();

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/90 backdrop-blur-md border-b border-surface-container/60 transition-colors">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-on-primary text-[20px]">account_balance_wallet</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface leading-tight">
              kanakkuX
            </span>
            <span className="font-label-sm text-outline text-[11px] leading-tight">
              Cloud Expense Tracker
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-surface-container-low p-1 rounded-full border border-surface-container/60">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-1.5 rounded-full font-label-md transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-1.5 rounded-full font-label-md transition-all flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>Expenses</span>
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-1.5 rounded-full font-label-md transition-all flex items-center gap-1.5 ${
              activeTab === 'income'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            <span>Income</span>
          </button>
          <button
            onClick={() => setActiveTab('owed')}
            className={`px-4 py-1.5 rounded-full font-label-md transition-all flex items-center gap-1.5 ${
              activeTab === 'owed'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">handshake</span>
            <span>Owed</span>
          </button>
        </nav>

        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              title="Select Period"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </button>

            {showMonthDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl p-2 shadow-xl border border-surface-container z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-surface-container mb-1">
                  <span className="font-label-sm uppercase tracking-wider text-on-surface-variant">Billing Cycle</span>
                  <span className="font-label-sm text-primary font-semibold">{currentMonth}</span>
                </div>
                <div className="flex items-center justify-between p-1">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
                    title="Previous Month"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <span className="font-label-md text-on-surface font-semibold">{currentMonth}</span>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
                    title="Next Month"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const nextCurr = currency === '$' ? '₹' : '$';
              setCurrency(nextCurr);
              showToast(`Currency switched to ${nextCurr}`);
            }}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-surface-container text-on-surface font-headline-sm font-bold text-sm hover:bg-surface-container-high transition-colors"
            title="Toggle Currency ($ / ₹)"
            type="button"
          >
            {currency}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center min-w-[36px] shadow-sm active:scale-95 transition-transform hover:ring-2 hover:ring-primary/30"
              type="button"
              title="Account & Settings"
            >
              <span className="material-symbols-outlined text-on-primary text-[19px]">person</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-xl p-3 shadow-xl border border-surface-container z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-surface-container">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">
                    KX
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-on-surface font-bold truncate">User</span>
                    <span className="font-body-sm text-outline text-[11px] truncate">Synced to Supabase</span>
                  </div>
                </div>

                <div className="py-2 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      openReportModal();
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-on-surface hover:bg-surface-container font-label-md text-left transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">analytics</span>
                    <span>Download Monthly Report</span>
                  </button>
                  <button
                    onClick={() => {
                      const next = currency === '$' ? '₹' : '$';
                      setCurrency(next);
                      setShowProfileMenu(false);
                      showToast(`Primary currency set to ${next}`);
                    }}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg text-on-surface hover:bg-surface-container font-label-md text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">currency_exchange</span>
                      <span>Currency</span>
                    </div>
                    <span className="font-bold text-primary">{currency}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
