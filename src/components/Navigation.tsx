import React from 'react';
import { useLedger } from '../context/LedgerContext';
import { TabType } from '../types';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, openQuickAdd } = useLedger();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl border-t border-surface-container/60 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] md:hidden">
      <div className="max-w-md mx-auto relative flex items-center justify-between h-16 px-1">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 transition-colors ${
            activeTab === 'dashboard'
              ? 'text-primary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span 
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: activeTab === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}
          >
            dashboard
          </span>
          <span className="font-label-sm text-label-sm mt-0.5">Dashboard</span>
        </button>

        {/* Expenses Tab */}
        <button
          onClick={() => setActiveTab('expenses')}
          aria-current={activeTab === 'expenses' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 transition-colors ${
            activeTab === 'expenses'
              ? 'text-primary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span 
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: activeTab === 'expenses' ? "'FILL' 1" : "'FILL' 0" }}
          >
            receipt_long
          </span>
          <span className="font-label-sm text-label-sm mt-0.5">Expenses</span>
        </button>

        {/* Floating Center '+' Add Button */}
        <div className="flex flex-col items-center justify-center px-1 -mt-5">
          <button
            onClick={() => openQuickAdd('expense')}
            className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-[0_10px_20px_-4px_rgba(15,118,110,0.4)] active:scale-95 hover:scale-105 transition-all"
            type="button"
            aria-label="Quick Add Entry"
          >
            <span className="material-symbols-outlined text-[28px]">add</span>
          </button>
          <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-medium">Add</span>
        </div>

        {/* Income Tab */}
        <button
          onClick={() => setActiveTab('income')}
          aria-current={activeTab === 'income' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 transition-colors ${
            activeTab === 'income'
              ? 'text-primary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span 
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: activeTab === 'income' ? "'FILL' 1" : "'FILL' 0" }}
          >
            trending_up
          </span>
          <span className="font-label-sm text-label-sm mt-0.5">Income</span>
        </button>

        {/* Owed Tab */}
        <button
          onClick={() => setActiveTab('owed')}
          aria-current={activeTab === 'owed' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 transition-colors ${
            activeTab === 'owed'
              ? 'text-primary font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span 
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: activeTab === 'owed' ? "'FILL' 1" : "'FILL' 0" }}
          >
            handshake
          </span>
          <span className="font-label-sm text-label-sm mt-0.5">Owed</span>
        </button>
      </div>
    </nav>
  );
};
