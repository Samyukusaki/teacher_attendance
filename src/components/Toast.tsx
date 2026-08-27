import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, setToast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans">
      <div
        className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 bg-[#0F172A] text-white ${
          isSuccess
            ? 'border-emerald-500/40'
            : isError
            ? 'border-rose-500/40'
            : 'border-blue-500/40'
        }`}
      >
        <div className="flex-shrink-0 mt-0.5">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : isError ? (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          ) : (
            <Info className="w-5 h-5 text-blue-400" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="text-xs font-bold font-khmer text-white">{toast.title}</h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
        </div>

        <button
          onClick={() => setToast(null)}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
