import React from 'react';
import { useLedger } from '../context/LedgerContext';

export const ReportModal: React.FC = () => {
  const {
    reportModalOpen,
    closeReportModal,
    currentMonth,
    totalMonthlyIncome,
    totalMonthlySpend,
    totalAmountOwed,
    netLiquidBalance,
    expenses,
    incomes,
    currency,
    showToast,
  } = useLedger();

  if (!reportModalOpen) return null;

  const handleExport = (format: 'CSV' | 'PDF') => {
    showToast(`Exported ${currentMonth} Statement (${format})`);
    closeReportModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-surface-container"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-1 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">ios_share</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Export Statement
              </h3>
              <p className="font-label-sm text-on-surface-variant">{currentMonth} Cycle Audit</p>
            </div>
          </div>
          <button
            onClick={closeReportModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Statement Overview */}
        <div className="bg-surface-container-low rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex justify-between items-center text-label-md font-label-md">
            <span className="text-on-surface-variant">Gross Inflows:</span>
            <span className="font-bold text-primary">+{currency}{totalMonthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-label-md font-label-md">
            <span className="text-on-surface-variant">Gross Outflows:</span>
            <span className="font-bold text-error">-{currency}{totalMonthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-label-md font-label-md">
            <span className="text-on-surface-variant">Net Liquid Retained:</span>
            <span className="font-bold text-on-surface">{currency}{netLiquidBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-label-md font-label-md pt-1.5 border-t border-surface-container">
            <span className="text-on-surface-variant">Uncollected Loans:</span>
            <span className="font-bold text-tertiary">{currency}{totalAmountOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="text-body-sm text-on-surface-variant">
          Includes <strong>{expenses.length} expenses</strong> and <strong>{incomes.length} income entries</strong> with full transaction memos and timestamps.
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => handleExport('CSV')}
            className="py-2.5 rounded-xl border border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">table_view</span>
            <span>Download CSV</span>
          </button>
          <button
            onClick={() => handleExport('PDF')}
            className="py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-semibold flex items-center justify-center gap-1.5 shadow-md hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Generate PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
