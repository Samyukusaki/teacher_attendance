import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminProtectedGateProps {
  targetTabName?: string;
}

export const AdminProtectedGate: React.FC<AdminProtectedGateProps> = ({ targetTabName }) => {
  const {
    adminPin,
    setIsAdminAuthenticated,
    setCurrentRole,
    setActiveTab,
    activeTab,
    showToast,
  } = useApp();

  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);

  const getPageTitle = () => {
    if (targetTabName) return targetTabName;
    switch (activeTab) {
      case 'weekly':
        return 'វត្តមានប្រចាំសប្តាហ៍';
      case 'monthly_semester':
        return 'ស្ថិតិវត្តមានប្រចាំខែ & ឆមាស';
      case 'reports':
        return 'របាយការណ៍ផ្លូវការ (Excel & Print)';
      default:
        return 'ទំព័រគ្រប់គ្រងទិន្នន័យសាលា';
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === adminPin) {
      setIsAdminAuthenticated(true);
      setCurrentRole('admin');
      setError(false);
      showToast('success', 'ផ្ទៀងផ្ទាត់ជោគជ័យ', `បានអនុញ្ញាតឱ្យចូលមើល «${getPageTitle()}»`);
    } else {
      setError(true);
      showToast('error', 'កូដសម្ងាត់មិនត្រឹមត្រូវ', 'សូមបញ្ចូលលេខកូដសម្ងាត់ PIN របស់អ្នកគ្រប់គ្រង (Admin) ឱ្យបានត្រឹមត្រូវ');
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 sm:my-12 px-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top geometric accent */}
        <div className="bg-[#0F172A] p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center mx-auto mb-4 shadow-lg text-amber-400 relative">
            <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1 rounded-full border-2 border-[#0F172A]">
              <KeyRound className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            Admin Permission Required
          </div>

          <h2 className="text-lg sm:text-xl font-bold font-moul leading-snug">
            តម្រូវឱ្យមានសិទ្ធិពីអ្នកគ្រប់គ្រង
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
            ទំព័រ <span className="font-bold text-amber-300">«{getPageTitle()}»</span> សម្រាប់តែអ្នកគ្រប់គ្រងសាលា (Admin) ប៉ុណ្ណោះ។ លោកគ្រូ-អ្នកគ្រូមិនត្រូវបានអនុញ្ញាតឱ្យចូលមើលដោយគ្មានការផ្ទៀងផ្ទាត់ឡើយ។
          </p>
        </div>

        {/* PIN Verification Form */}
        <div className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                បញ្ចូលលេខកូដសម្ងាត់ PIN របស់អ្នកគ្រប់គ្រង (Admin PIN)
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={8}
                  autoFocus
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setError(false);
                  }}
                  placeholder="••••"
                  className={`w-full px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono rounded-2xl border ${
                    error
                      ? 'border-rose-400 bg-rose-50/40 ring-3 ring-rose-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-slate-50'
                  } outline-hidden transition-all`}
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-2 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>លេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ! សូមសាកល្បងម្តងទៀត ឬសាកសួរ Admin សាលា។</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('teacher_submit')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ត្រឡប់ទៅចុះវត្តមាន</span>
              </button>

              <button
                type="submit"
                className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ផ្ទៀងផ្ទាត់ & បើកមើលទិន្នន័យ</span>
              </button>
            </div>
          </form>

          {/* Quick Notice */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] text-slate-400 leading-normal">
              សុវត្ថិភាពទិន្នន័យត្រូវបានការពារដោយប្រព័ន្ធសុវត្ថិភាពសាលារៀន (EduSync Security Rules)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
