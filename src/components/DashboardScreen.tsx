import React from 'react';
import { useLedger } from '../context/LedgerContext';

export const DashboardScreen: React.FC = () => {
  const {
    isBalanceHidden,
    toggleBalanceHidden,
    totalMonthlyIncome,
    totalMonthlySpend,
    totalAmountOwed,
    netLiquidBalance,
    burnCap,
    burnConsumedPercent,
    burnCushionLeft,
    loanMetrics,
    openQuickAdd,
    openReportModal,
    setActiveTab,
    currency,
    expenses,
    incomes,
    loans,
  } = useLedger();

  const totalTransactionsCount = expenses.length + incomes.length + loans.length;

  const recentActivities = React.useMemo(() => {
    const list: Array<{
      id: string;
      type: 'expense' | 'income' | 'loan';
      title: string;
      subtitle: string;
      date: string;
      amount: number;
      badgeText: string;
      icon: string;
      iconBg: string;
      iconColor: string;
      amountColor: string;
      prefix: string;
      onClick: () => void;
    }> = [];

    expenses.forEach(e => {
      list.push({
        id: e.id,
        type: 'expense',
        title: e.note || e.category,
        subtitle: e.category,
        date: e.date,
        amount: e.amount,
        badgeText: e.paymentMethod,
        icon: e.category.toLowerCase().includes('food')
          ? 'restaurant'
          : e.category.toLowerCase().includes('commute') || e.category.toLowerCase().includes('travel')
          ? 'directions_subway'
          : 'shopping_cart',
        iconBg: 'bg-primary-fixed/40',
        iconColor: 'text-primary',
        amountColor: 'text-on-surface',
        prefix: '',
        onClick: () => setActiveTab('expenses'),
      });
    });

    incomes.forEach(inc => {
      list.push({
        id: inc.id,
        type: 'income',
        title: inc.source,
        subtitle: inc.note || 'Income',
        date: inc.date,
        amount: inc.amount,
        badgeText: inc.destination,
        icon: 'trending_up',
        iconBg: 'bg-primary-fixed',
        iconColor: 'text-primary',
        amountColor: 'text-primary',
        prefix: '',
        onClick: () => setActiveTab('income'),
      });
    });

    loans.forEach(l => {
      const isLoan = l.type === 'loan';
      list.push({
        id: l.id,
        type: 'loan',
        title: isLoan ? `Loan on ${l.dateLent}` : `Lent on ${l.dateLent}`,
        subtitle: `${l.personName} • ${l.status === 'settled' ? 'Settled' : `${currency}${l.remaining.toLocaleString('en-IN')} remaining`}`,
        date: l.dateLent,
        amount: l.amountLent,
        badgeText: isLoan ? 'Loan' : 'Lent',
        icon: isLoan ? 'account_balance' : 'volunteer_activism',
        iconBg: isLoan ? 'bg-amber-500/20' : 'bg-tertiary-fixed',
        iconColor: isLoan ? 'text-amber-600 dark:text-amber-400' : 'text-on-tertiary-fixed',
        amountColor: isLoan ? 'text-amber-600 dark:text-amber-400' : 'text-tertiary',
        prefix: '',
        onClick: () => setActiveTab('owed'),
      });

      (l.repayments || []).forEach(r => {
        list.push({
          id: `repay-${r.id}`,
          type: 'loan',
          title: isLoan ? `Loan return on ${r.date}` : `Lent return on ${r.date}`,
          subtitle: `${l.personName} via ${r.method}`,
          date: r.date,
          amount: r.amount,
          badgeText: isLoan ? 'Loan Return' : 'Lent Return',
          icon: 'payments',
          iconBg: 'bg-secondary-fixed',
          iconColor: 'text-on-secondary-fixed',
          amountColor: 'text-primary',
          prefix: '+',
          onClick: () => setActiveTab('owed'),
        });
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [expenses, incomes, loans, currency, setActiveTab]);

  return (
    <div className="flex flex-col w-full gap-5">
      {/* Net Balance Showcase Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-container to-primary p-5 sm:p-6 text-on-primary shadow-xl">
        <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-on-primary-container/15 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-primary-container tracking-wider flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
              NET LIQUID BALANCE
            </span>
            <button
              aria-label="Toggle Balance Visibility"
              className="min-w-[44px] min-h-[44px] -mr-2 rounded-full flex items-center justify-center text-on-primary-container/85 hover:text-on-primary active:scale-90 transition-transform"
              onClick={toggleBalanceHidden}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isBalanceHidden ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-display-lg-mobile text-display-lg-mobile md:text-4xl tracking-tight drop-shadow-sm font-headline-lg font-bold">
              {isBalanceHidden
                ? '••••••••'
                : `${currency}${netLiquidBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <span className="font-label-sm text-label-sm text-on-primary-container/80 font-medium">INR</span>
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="inline-flex items-center gap-1 bg-surface-container-lowest/15 px-2.5 py-1 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined text-[14px] text-on-primary-container">info</span>
              <span className="font-label-sm text-label-sm font-semibold text-on-primary-container">Real-time</span>
              <span className="font-body-sm text-body-sm text-on-primary/75 ml-0.5">balance</span>
            </div>
            <div className="flex items-center gap-1 text-on-primary-container/80">
              <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
              <span className="font-label-sm text-label-sm">Audited today</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metric Tri-Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Income Inflow Card */}
        <div 
          onClick={() => setActiveTab('income')}
          className="rounded-2xl bg-surface-container-lowest p-4 shadow-xs border border-surface-container/40 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">Inflow</span>
            <div className="w-8 h-8 rounded-full bg-primary-fixed/40 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </div>
          </div>
          <div>
            <p className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {currency}{totalMonthlyIncome.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              <span className="text-body-sm text-on-surface-variant font-normal">.00</span>
            </p>
            <p className="font-label-sm text-label-sm text-primary mt-0.5 font-medium">This month</p>
          </div>
        </div>

        {/* Expenses Outflow Card */}
        <div 
          onClick={() => setActiveTab('expenses')}
          className="rounded-2xl bg-surface-container-lowest p-4 shadow-xs border border-surface-container/40 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">Outflow</span>
            <div className="w-8 h-8 rounded-full bg-error-container text-error flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">trending_down</span>
            </div>
          </div>
          <div>
            <p className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {currency}{totalMonthlySpend.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              <span className="text-body-sm text-on-surface-variant font-normal">.00</span>
            </p>
            <p className="font-label-sm text-label-sm text-error mt-0.5 font-medium">
              {Math.round(burnConsumedPercent)}% cap reached
            </p>
          </div>
        </div>

        {/* Lent / Owed Card (Spans 2 on mobile, 1 on desktop) */}
        <div 
          onClick={() => setActiveTab('owed')}
          className="col-span-2 lg:col-span-1 rounded-2xl bg-surface-container p-4 shadow-xs border border-surface-container-high/60 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">handshake</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Lent to Others</span>
                <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                  {loanMetrics.pendingCount} Pending
                </span>
              </div>
              <p className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5">
                {currency}{totalAmountOwed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="min-w-[44px] min-h-[44px] rounded-full bg-surface-container-lowest text-secondary flex items-center justify-center shadow-xs group-hover:translate-x-1 transition-transform">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </div>
        </div>
      </section>

      {/* Quick Dispatch Bar */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
            Quick Dispatch
          </span>
          <span className="font-label-sm text-label-sm text-primary font-semibold">Fintech Shortcuts</span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <button
            className="min-h-[64px] rounded-2xl bg-surface-container-lowest p-2.5 flex flex-col items-center justify-center gap-1 shadow-xs border border-surface-container/50 active:scale-95 transition-all text-on-surface hover:bg-surface-container-high"
            onClick={() => openQuickAdd('expense')}
            type="button"
          >
            <div className="w-7 h-7 rounded-full bg-error-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </div>
            <span className="font-label-sm text-label-sm font-semibold">Expense</span>
          </button>

          <button
            className="min-h-[64px] rounded-2xl bg-surface-container-lowest p-2.5 flex flex-col items-center justify-center gap-1 shadow-xs border border-surface-container/50 active:scale-95 transition-all text-on-surface hover:bg-surface-container-high"
            onClick={() => openQuickAdd('income')}
            type="button"
          >
            <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </div>
            <span className="font-label-sm text-label-sm font-semibold">Income</span>
          </button>

          <button
            className="min-h-[64px] rounded-2xl bg-surface-container-lowest p-2.5 flex flex-col items-center justify-center gap-1 shadow-xs border border-surface-container/50 active:scale-95 transition-all text-on-surface hover:bg-surface-container-high"
            onClick={() => openQuickAdd('lent')}
            type="button"
          >
            <div className="w-7 h-7 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
            </div>
            <span className="font-label-sm text-label-sm font-semibold">Lend</span>
          </button>

          <button
            className="min-h-[64px] rounded-2xl bg-surface-container-lowest p-2.5 flex flex-col items-center justify-center gap-1 shadow-xs border border-surface-container/50 active:scale-95 transition-all text-on-surface hover:bg-surface-container-high"
            onClick={openReportModal}
            type="button"
          >
            <div className="w-7 h-7 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">ios_share</span>
            </div>
            <span className="font-label-sm text-label-sm font-semibold">Report</span>
          </button>
        </div>
      </section>

      {/* Spend Velocity & Monthly Cap Tracker */}
      <section className="rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-xs border border-surface-container/50 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping"></div>
            <span className="font-label-md text-label-md text-on-surface font-semibold">Monthly Burn Rate</span>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant font-bold">
            {currency}{totalMonthlySpend.toLocaleString('en-IN', { minimumFractionDigits: 0 })} / {currency}{burnCap.toLocaleString('en-IN')}
          </span>
        </div>
        
        {/* Progress Track */}
        <div className="w-full h-3 rounded-full bg-surface-container-highest overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary-container rounded-full transition-all duration-700 ease-out"
            style={{ width: `${burnConsumedPercent}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-on-surface-variant text-label-sm">
          <span>{burnConsumedPercent.toFixed(1)}% consumed</span>
          <span className="text-primary font-semibold">
            {currency}{burnCushionLeft.toLocaleString('en-IN', { minimumFractionDigits: 0 })} cushion left
          </span>
        </div>
      </section>

      {/* Recent Ledger Activity Feed */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Recent Activity</span>
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
          </div>
          <button
            onClick={() => setActiveTab('expenses')}
            className="font-label-md text-label-md text-primary font-semibold hover:underline min-h-[40px] inline-flex items-center"
            type="button"
          >
            See All ({totalTransactionsCount})
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-surface-container-lowest border border-surface-container/40 text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>
              <p className="font-label-lg text-on-surface font-semibold">No recent activity</p>
              <p className="font-body-sm text-on-surface-variant max-w-xs">
                Use Quick Dispatch above to record your first expense, income, or loan.
              </p>
            </div>
          ) : (
            recentActivities.map(item => (
              <article 
                key={item.id}
                onClick={item.onClick}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container/40 hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-full ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-1.5 py-0.5 rounded">
                        {item.badgeText}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {item.date}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className={`font-headline-sm text-headline-sm font-bold ${item.amountColor}`}>
                    {item.prefix}{currency}{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {item.subtitle}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

