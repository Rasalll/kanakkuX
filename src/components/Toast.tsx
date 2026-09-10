import React from 'react';
import { useLedger } from '../context/LedgerContext';

export const Toast: React.FC = () => {
  const { toast } = useLedger();

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-300 pointer-events-none ${
        toast.visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-4 scale-95'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">check_circle</span>
      <span className="font-label-md text-label-md">{toast.message}</span>
    </div>
  );
};
