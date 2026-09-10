import React, { useState } from 'react';
import { LedgerProvider, useLedger } from './context/LedgerContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardScreen } from './components/DashboardScreen';
import { ExpensesScreen } from './components/ExpensesScreen';
import { IncomeScreen } from './components/IncomeScreen';
import { OwedScreen } from './components/OwedScreen';
import { QuickAddModal } from './components/QuickAddModal';
import { ReportModal } from './components/ReportModal';
import { Toast } from './components/Toast';

const MainLayout: React.FC = () => {
  const { activeTab } = useLedger();
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center">
      {/* Optional Desktop Layout Mode Toggle Pill */}
      <div className="hidden lg:flex fixed bottom-5 right-6 z-40 items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-surface-container shadow-lg text-label-sm">
        <span className="text-on-surface-variant font-medium">Layout:</span>
        <button
          onClick={() => setDeviceFrameMode(false)}
          className={`px-2.5 py-1 rounded-full transition-all font-bold ${
            !deviceFrameMode
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Fluid Responsive
        </button>
        <button
          onClick={() => setDeviceFrameMode(true)}
          className={`px-2.5 py-1 rounded-full transition-all font-bold ${
            deviceFrameMode
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Mobile Shell (390px)
        </button>
      </div>

      {/* Main Content Shell */}
      <div
        className={`w-full flex flex-col min-h-screen relative transition-all duration-300 ${
          deviceFrameMode
            ? 'max-w-md my-4 rounded-3xl shadow-2xl border-4 border-surface-container-highest overflow-hidden bg-surface'
            : 'max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-5xl'
        }`}
      >
        <Header />

        <main className="flex-1 w-full px-4 sm:px-6 md:px-8 py-5 pb-28 md:pb-12">
          {activeTab === 'dashboard' && <DashboardScreen />}
          {activeTab === 'expenses' && <ExpensesScreen />}
          {activeTab === 'income' && <IncomeScreen />}
          {activeTab === 'owed' && <OwedScreen />}
        </main>

        <Navigation />
      </div>

      {/* Shared Modals and Notifications */}
      <QuickAddModal />
      <ReportModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <LedgerProvider>
      <MainLayout />
    </LedgerProvider>
  );
}
