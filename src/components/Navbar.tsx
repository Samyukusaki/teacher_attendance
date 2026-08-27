import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Calendar,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Send,
  UserCheck,
  LogOut,
  KeyRound,
  FileText,
  Building2,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { formatKhmerDate, toKhmerNumber, getTodayString } from '../utils/khmerDate';

export const Navbar: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    activeTab,
    setActiveTab,
    schoolInfo,
    telegramConfig,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    adminPin,
    showToast,
    leaveRequests,
  } = useApp();

  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'pending').length;

  const handleAdminSwitch = () => {
    if (isAdminAuthenticated) {
      setCurrentRole('admin');
      setActiveTab('admin_dashboard');
    } else {
      setShowPinModal(true);
      setEnteredPin('');
      setPinError(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === adminPin) {
      setIsAdminAuthenticated(true);
      setCurrentRole('admin');
      setActiveTab('admin_dashboard');
      setShowPinModal(false);
      setEnteredPin('');
      showToast('success', 'ចូលប្រព័ន្ធជោគជ័យ', 'សូមស្វាគមន៍មកកាន់ផ្ទាំងគ្រប់គ្រងសាលារៀន (Admin Dashboard)');
    } else {
      setPinError(true);
      showToast('error', 'លេខកូដមិនត្រឹមត្រូវ', 'សូមបញ្ចូលលេខកូដ PIN របស់អ្នកគ្រប់គ្រងឱ្យបានត្រឹមត្រូវ');
    }
  };

  const handleSwitchToTeacher = () => {
    setCurrentRole('teacher');
    setActiveTab('teacher_submit');
  };

  const navItems = [
    {
      id: 'teacher_submit',
      label: 'ចុះវត្តមានបង្រៀន',
      icon: UserCheck,
      desc: 'បំពេញម៉ោងបង្រៀន',
    },
    {
      id: 'timetables',
      label: 'កាលវិភាគបង្រៀន',
      icon: Calendar,
      desc: 'កាលវិភាគគ្រូនីមួយៗ',
    },
    {
      id: 'weekly',
      label: 'វត្តមានប្រចាំសប្តាហ៍',
      icon: Calendar,
      desc: 'តារាងតាមថ្ងៃ',
    },
    {
      id: 'monthly_semester',
      label: 'ប្រចាំខែ & ឆមាស',
      icon: BarChart3,
      desc: 'ស្ថិតិបូកសរុប',
    },
    {
      id: 'reports',
      label: 'របាយការណ៍ផ្លូវការ',
      icon: FileSpreadsheet,
      desc: 'បោះពុម្ព & Excel',
    },
    {
      id: 'leave_requests',
      label: 'ពាក្យស្នើសុំច្បាប់',
      icon: FileText,
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : null,
      desc: 'សុំច្បាប់ឈប់សម្រាក',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs no-print">
      {/* Geometric Dark Topbar */}
      <div className="bg-[#0F172A] text-white px-4 sm:px-6 py-2.5 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="font-mono font-bold tracking-tight text-blue-400 uppercase text-[11px]">
                EDU-SYNC ATTENDANCE
              </span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-2 text-slate-300 text-[11px]">
              <span className="font-semibold text-slate-200">
                ឆ្នាំសិក្សា {schoolInfo.academicYear}
              </span>
              <span>•</span>
              <span>
                {schoolInfo.currentSemester === 'semester1' ? 'ឆមាសទី ១' : 'ឆមាសទី ២'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Telegram Live Status Pill */}
            <div className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-[11px] transition-colors">
              <div
                className={`w-2 h-2 rounded-full ${
                  telegramConfig.isEnabled && telegramConfig.botToken
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300 font-medium">
                Telegram Sync:{' '}
                {telegramConfig.isEnabled && telegramConfig.botToken ? (
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                    Active
                  </span>
                ) : (
                  <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                    Standby
                  </span>
                )}
              </span>
            </div>

            {/* Date Display */}
            <div className="hidden lg:block text-slate-400 text-[11px] font-khmer">
              {formatKhmerDate(getTodayString())}
            </div>

            {/* Current Role Tag */}
            <div className="flex items-center">
              {currentRole === 'admin' ? (
                <div className="flex items-center gap-1.5 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Mode</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Teacher Portal</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Geometric Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & School Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shadow-sm border border-slate-700 flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-moul leading-none">
                  {schoolInfo.nameKh || 'វិទ្យាល័យ ប៊ុនរ៉ានី ហ៊ុនសែន ព្រៃពោន'}
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  Official
                </span>
              </div>
              <p className="text-xs text-slate-500 font-khmer mt-1 flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">ប្រព័ន្ធគ្រប់គ្រងវត្តមានគ្រូបង្រៀន</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 text-[11px]">EduSync Attendance Engine</span>
              </p>
            </div>
          </div>

          {/* Right Mode Switchers */}
          <div className="flex items-center gap-2">
            {currentRole === 'admin' ? (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-admin-dashboard"
                  onClick={() => setActiveTab('admin_dashboard')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'admin_dashboard'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>ផ្ទាំងគ្រប់គ្រងសាលា (Admin)</span>
                </button>
                <button
                  id="btn-nav-switch-teacher"
                  onClick={handleSwitchToTeacher}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                  title="ប្តូរទៅទម្រង់លោកគ្រូ-អ្នកគ្រូ"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">ទម្រង់គ្រូ</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-nav-switch-admin"
                onClick={handleAdminSwitch}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-slate-800 shadow-xs flex items-center gap-2 transition-colors cursor-pointer border border-slate-800"
              >
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>ផ្ទាំងគ្រប់គ្រង Admin</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Geometric Navigation Tabs - Desktop */}
        <div className="hidden md:flex items-center gap-1.5 mt-3.5 pt-2.5 border-t border-slate-100 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id as any)}
                className={`group relative px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isActive ? 'bg-white' : 'bg-slate-400 group-hover:bg-blue-500'
                  }`}
                />
                <Icon
                  className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                    {toKhmerNumber(item.badge)}
                  </span>
                )}
              </button>
            );
          })}

          {currentRole === 'admin' && (
            <button
              id="nav-tab-admin-dashboard"
              onClick={() => setActiveTab('admin_dashboard')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ml-auto cursor-pointer ${
                activeTab === 'admin_dashboard'
                  ? 'bg-[#0F172A] text-white shadow-xs border border-slate-800'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>ការកំណត់ទូទៅ (Settings)</span>
            </button>
          )}
        </div>

        {/* Navigation Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5 pb-2 animate-in fade-in duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-white' : 'bg-slate-400'
                      }`}
                    />
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {toKhmerNumber(item.badge)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin PIN Login Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-[#0F172A] text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-800">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-khmer">
                ផ្ទៀងផ្ទាត់សិទ្ធិអ្នកគ្រប់គ្រង
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                សូមបញ្ចូលលេខកូដសម្ងាត់ PIN របស់អ្នកគ្រប់គ្រង (Admin) ដើម្បីចូលគ្រប់គ្រងទិន្នន័យ
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  លេខកូដ PIN សម្ងាត់អ្នកគ្រប់គ្រង
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={8}
                    autoFocus
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="••••"
                    className={`w-full px-4 py-2.5 text-center text-xl tracking-widest font-mono rounded-xl border ${
                      pinError
                        ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-slate-50'
                    } outline-hidden`}
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                {pinError && (
                  <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" /> លេខសម្ងាត់មិនត្រឹមត្រូវទេ! សូមពិនិត្យម្តងទៀត
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  ផ្ទៀងផ្ទាត់ចូល
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
