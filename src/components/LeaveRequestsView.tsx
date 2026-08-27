import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LeaveRequest, LeaveType } from '../types';
import { formatKhmerDate, toKhmerNumber, getTodayString } from '../utils/khmerDate';
import {
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from 'lucide-react';

export const LeaveRequestsView: React.FC = () => {
  const {
    teachers,
    leaveRequests,
    submitLeaveRequest,
    updateLeaveStatus,
    currentRole,
    selectedTeacherId,
    showToast,
  } = useApp();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [targetTeacherId, setTargetTeacherId] = useState(selectedTeacherId);
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [leaveType, setLeaveType] = useState<LeaveType>('personal');
  const [reason, setReason] = useState('');
  const [adminReviewModal, setAdminReviewModal] = useState<{ id: string; req: LeaveRequest } | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('error', 'សូមបញ្ចូលមូលហេតុ', 'សូមបញ្ជាក់មូលហេតុនៃការសុំច្បាប់');
      return;
    }

    await submitLeaveRequest({
      teacherId: targetTeacherId,
      startDate,
      endDate,
      leaveType,
      reason,
    });

    setShowSubmitModal(false);
    setReason('');
  };

  const handleApprove = (id: string) => {
    updateLeaveStatus(id, 'approved', adminNote || 'បានអនុម័ត');
    setAdminReviewModal(null);
    setAdminNote('');
  };

  const handleReject = (id: string) => {
    updateLeaveStatus(id, 'rejected', adminNote || 'បដិសេធ');
    setAdminReviewModal(null);
    setAdminNote('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
              Leave Requests
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-khmer">
              ប្រព័ន្ធគ្រប់គ្រងពាក្យស្នើសុំច្បាប់ឈប់សម្រាក
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            លោកគ្រូ-អ្នកគ្រូអាចស្នើសុំច្បាប់ ហើយអ្នកគ្រប់គ្រងមានសិទ្ធិពិនិត្យ និងអនុម័ត
          </p>
        </div>

        <button
          id="btn-open-submit-leave"
          onClick={() => {
            setTargetTeacherId(selectedTeacherId);
            setShowSubmitModal(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ដាក់ពាក្យស្នើសុំច្បាប់ថ្មី</span>
        </button>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              បញ្ជីពាក្យស្នើសុំច្បាប់ទាំងអស់ ({toKhmerNumber(leaveRequests.length)})
            </h3>
          </div>
          {currentRole === 'admin' && (
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Admin Mode: អនុម័ត / បដិសេធ
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {leaveRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              មិនទាន់មានពាក្យស្នើសុំច្បាប់នៅឡើយទេ
            </div>
          ) : (
            leaveRequests.map((req) => {
              const teacher = teachers.find((t) => t.id === req.teacherId);
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';

              let typeBadge = 'bg-slate-100 text-slate-700 border-slate-200';
              let typeLabel = 'ការងារផ្ទាល់ខ្លួន';
              if (req.leaveType === 'sick') {
                typeBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                typeLabel = 'ឈឺ/ព្យាបាល';
              } else if (req.leaveType === 'mission') {
                typeBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                typeLabel = 'បេសកកម្ម';
              } else if (req.leaveType === 'maternity') {
                typeBadge = 'bg-pink-50 text-pink-700 border-pink-200';
                typeLabel = 'លំហែមាតុភាព';
              }

              return (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-800 font-mono">
                      {teacher?.code || 'TCH'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs font-khmer">
                          {teacher?.nameKh}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {teacher?.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeBadge}`}
                        >
                          {typeLabel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        <b>កាលបរិច្ឆេទ៖</b> {formatKhmerDate(req.startDate)} ដល់ {formatKhmerDate(req.endDate)}
                      </p>

                      <p className="text-xs text-slate-700 mt-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                        💬 <b>មូលហេតុ៖</b> {req.reason}
                      </p>

                      {req.adminNote && (
                        <p className="text-[11px] text-blue-700 mt-1 font-semibold">
                          ✍️ <b>សម្គាល់ Admin:</b> {req.adminNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & Admin Action */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <Clock className="w-3 h-3" /> រង់ចាំការអនុម័ត
                        </span>

                        {currentRole === 'admin' && (
                          <button
                            onClick={() => setAdminReviewModal({ id: req.id, req })}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
                          >
                            ពិនិត្យ & អនុម័ត
                          </button>
                        )}
                      </div>
                    ) : isApproved ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> បានអនុម័ត
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <XCircle className="w-3 h-3 text-rose-600" /> ត្រូវបានបដិសេធ
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Submit Leave Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 font-khmer pb-3 border-b border-slate-100">
              ពាក្យស្នើសុំច្បាប់ឈប់សម្រាក
            </h3>

            <form onSubmit={handleSubmitLeave} className="space-y-4 py-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  លោកគ្រូ-អ្នកគ្រូ
                </label>
                <select
                  value={targetTeacherId}
                  onChange={(e) => setTargetTeacherId(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:border-blue-500 outline-hidden"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameKh} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ប្រភេទច្បាប់
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:border-blue-500 outline-hidden"
                >
                  <option value="personal">ការងារផ្ទាល់ខ្លួន (Personal)</option>
                  <option value="sick">ឈឺ / សម្រាកព្យាបាលជំងឺ (Sick)</option>
                  <option value="mission">បេសកកម្មផ្លូវការ (Official Mission)</option>
                  <option value="maternity">លំហែមាតុភាព (Maternity)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ចាប់ពីថ្ងៃ
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 focus:border-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ដល់ថ្ងៃ
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  មូលហេតុលម្អិត
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="សូមបញ្ជាក់ពីមូលហេតុនៃការសុំច្បាប់ឈប់សម្រាក..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px] text-blue-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  ពាក្យស្នើសុំនេះនឹងត្រូវជូនដំណឹងតាម Telegram ទៅកាន់អ្នកគ្រប់គ្រងសាលាដោយស្វ័យប្រវត្តិ
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  បញ្ជូនពាក្យស្នើសុំ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Review Modal */}
      {adminReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 font-khmer pb-2 border-b border-slate-100">
              ពិនិត្យពាក្យស្នើសុំច្បាប់
            </h3>

            <div className="py-4 space-y-3 text-xs">
              <p>
                <b>គ្រូបង្រៀន៖</b>{' '}
                {teachers.find((t) => t.id === adminReviewModal.req.teacherId)?.nameKh}
              </p>
              <p>
                <b>កាលបរិច្ឆេទ៖</b> {formatKhmerDate(adminReviewModal.req.startDate)} ដល់ {formatKhmerDate(adminReviewModal.req.endDate)}
              </p>
              <p>
                <b>មូលហេតុ៖</b> {adminReviewModal.req.reason}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  កំណត់សម្គាល់របស់អ្នកគ្រប់គ្រង
                </label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="ឧ. បានអនុម័ត / ឯកភាព..."
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdminReviewModal(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បិទ
              </button>
              <button
                type="button"
                onClick={() => handleReject(adminReviewModal.id)}
                className="flex-1 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer"
              >
                បដិសេធ
              </button>
              <button
                type="button"
                onClick={() => handleApprove(adminReviewModal.id)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
              >
                អនុម័តច្បាប់
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
