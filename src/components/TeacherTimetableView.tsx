import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TimetableSlot, DayOfWeek, GradeClass, Subject } from '../types';
import {
  DAY_OF_WEEK_LIST,
  PERIOD_SLOTS,
  toKhmerNumber,
} from '../utils/khmerDate';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Printer,
  Sparkles,
  BookOpen,
  GraduationCap,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  User,
  School,
  FileText,
  Lock,
  ShieldCheck,
  KeyRound,
  Info,
  X,
} from 'lucide-react';

interface TeacherTimetableViewProps {
  initialTeacherId?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const TeacherTimetableView: React.FC<TeacherTimetableViewProps> = ({
  initialTeacherId,
  isModal = false,
  onClose,
}) => {
  const {
    teachers,
    classes,
    subjects,
    timetables,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
    setTeacherTimetable,
    resetTeacherTimetable,
    selectedTeacherId,
    setSelectedTeacherId,
    schoolInfo,
    showToast,
    currentRole,
    setCurrentRole,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    adminPin,
  } = useApp();

  const isAdmin = currentRole === 'admin' && isAdminAuthenticated;

  const [activeTeacherId, setActiveTeacherId] = useState<string>(
    initialTeacherId || selectedTeacherId || teachers[0]?.id || 'tch-1'
  );

  const [filterDay, setFilterDay] = useState<DayOfWeek | 'all'>('all');

  // Edit / Create slot modal state (Admin only)
  const [editingSlot, setEditingSlot] = useState<{
    id?: string;
    dayOfWeek: DayOfWeek;
    periodNumber: number;
    gradeId: string;
    subjectId: string;
    room: string;
    notes: string;
  } | null>(null);

  // Read-only slot detail modal state (For Teachers)
  const [viewingSlot, setViewingSlot] = useState<{
    slot: TimetableSlot;
    classObj?: GradeClass;
    subjectObj?: Subject;
  } | null>(null);

  // Copy day schedule modal state (Admin only)
  const [copyScheduleState, setCopyScheduleState] = useState<{
    fromDay: DayOfWeek;
    toDay: DayOfWeek;
  } | null>(null);

  // Admin PIN Unlock Modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const currentTeacher = teachers.find((t) => t.id === activeTeacherId) || teachers[0];

  // Teacher's timetable slots
  const teacherSlots = timetables.filter((s) => s.teacherId === activeTeacherId);

  // Calculate statistics
  const totalWeeklyHours = teacherSlots.length;
  const morningHours = teacherSlots.filter((s) => s.periodNumber <= 4).length;
  const afternoonHours = teacherSlots.filter((s) => s.periodNumber > 4).length;
  
  const taughtClassIds = Array.from(new Set(teacherSlots.map((s) => s.gradeId)));
  const taughtClasses = classes.filter((c) => taughtClassIds.includes(c.id));

  // Find slot for a specific day and period
  const getSlot = (day: DayOfWeek, periodNumber: number): TimetableSlot | undefined => {
    return teacherSlots.find((s) => s.dayOfWeek === day && s.periodNumber === periodNumber);
  };

  // Open modal to add or edit slot
  const handleOpenAddEditSlot = (day: DayOfWeek, periodNumber: number, existing?: TimetableSlot) => {
    if (!isAdmin) {
      if (existing) {
        const cObj = classes.find((c) => c.id === existing.gradeId);
        const sObj = subjects.find((s) => s.id === existing.subjectId);
        setViewingSlot({ slot: existing, classObj: cObj, subjectObj: sObj });
      } else {
        showToast('info', 'សិទ្ធិត្រូវបានបិទ', 'លោកគ្រូ/អ្នកគ្រូពុំមានសិទ្ធិកែប្រែកាលវិភាគបង្រៀនឡើយ! មានតែ Admin ប៉ុណ្ណោះដែលអាចកំណត់បាន។');
      }
      return;
    }

    const defaultGrade = currentTeacher?.gradeIds[0] || classes[0]?.id || 'cls-1';
    const defaultSubj = currentTeacher?.subjectIds[0] || subjects[0]?.id || 'sub-1';
    const defaultClassObj = classes.find((c) => c.id === (existing?.gradeId || defaultGrade));

    if (existing) {
      setEditingSlot({
        id: existing.id,
        dayOfWeek: existing.dayOfWeek,
        periodNumber: existing.periodNumber,
        gradeId: existing.gradeId,
        subjectId: existing.subjectId,
        room: existing.room || defaultClassObj?.room || '',
        notes: existing.notes || '',
      });
    } else {
      setEditingSlot({
        dayOfWeek: day,
        periodNumber: periodNumber,
        gradeId: defaultGrade,
        subjectId: defaultSubj,
        room: defaultClassObj?.room || '',
        notes: '',
      });
    }
  };

  // Save slot (Admin only)
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('error', 'គ្មានសិទ្ធិ', 'មានតែ Admin ប៉ុណ្ណោះដែលអាចរក្សាទុកការកែប្រែកាលវិភាគបាន');
      return;
    }
    if (!editingSlot) return;

    if (editingSlot.id) {
      updateTimetableSlot(editingSlot.id, {
        dayOfWeek: editingSlot.dayOfWeek,
        periodNumber: editingSlot.periodNumber,
        gradeId: editingSlot.gradeId,
        subjectId: editingSlot.subjectId,
        room: editingSlot.room,
        notes: editingSlot.notes,
      });
    } else {
      addTimetableSlot({
        teacherId: activeTeacherId,
        dayOfWeek: editingSlot.dayOfWeek,
        periodNumber: editingSlot.periodNumber,
        gradeId: editingSlot.gradeId,
        subjectId: editingSlot.subjectId,
        room: editingSlot.room,
        notes: editingSlot.notes,
      });
    }
    setEditingSlot(null);
  };

  // Delete slot handler (Admin only)
  const handleDeleteSlot = (slotId: string) => {
    if (!isAdmin) {
      showToast('error', 'គ្មានសិទ្ធិ', 'មានតែ Admin ប៉ុណ្ណោះដែលអាចលុបម៉ោងបង្រៀនបាន');
      return;
    }
    deleteTimetableSlot(slotId);
  };

  // Copy schedule from one day to another (Admin only)
  const handleExecuteCopySchedule = () => {
    if (!isAdmin) {
      showToast('error', 'គ្មានសិទ្ធិ', 'មានតែ Admin ប៉ុណ្ណោះដែលអាចចម្លងកាលវិភាគបាន');
      return;
    }
    if (!copyScheduleState) return;
    const { fromDay, toDay } = copyScheduleState;

    if (fromDay === toDay) {
      showToast('error', 'ថ្ងៃដូចគ្នា', 'សូមជ្រើសរើសថ្ងៃគោលដៅខុសពីថ្ងៃដើម');
      return;
    }

    const sourceSlots = teacherSlots.filter((s) => s.dayOfWeek === fromDay);
    if (sourceSlots.length === 0) {
      showToast('error', 'គ្មានទិន្នន័យ', 'ថ្ងៃដើមដែលបានជ្រើសរើសមិនមានម៉ោងបង្រៀនឡើយ');
      return;
    }

    // Remove existing slots on toDay
    const remainingSlots = teacherSlots.filter((s) => s.dayOfWeek !== toDay);
    const newCopiedSlots: Omit<TimetableSlot, 'id'>[] = sourceSlots.map((s) => ({
      teacherId: activeTeacherId,
      dayOfWeek: toDay,
      periodNumber: s.periodNumber,
      gradeId: s.gradeId,
      subjectId: s.subjectId,
      room: s.room,
      notes: s.notes,
    }));

    setTeacherTimetable(activeTeacherId, [...remainingSlots, ...newCopiedSlots]);
    setCopyScheduleState(null);
    showToast('success', 'ជោគជ័យ', `បានចម្លងកាលវិភាគទៅ ${DAY_OF_WEEK_LIST.find((d) => d.key === toDay)?.nameKh}`);
  };

  // Clear all slots for this teacher (Admin only)
  const handleClearAllSchedule = () => {
    if (!isAdmin) {
      showToast('error', 'គ្មានសិទ្ធិ', 'មានតែ Admin ប៉ុណ្ណោះដែលអាចលុបកាលវិភាគទាំងអស់បាន');
      return;
    }
    if (window.confirm(`តើអ្នកប្រាកដជាចង់លុបកាលវិភាគបង្រៀនទាំងអស់របស់ ${currentTeacher?.nameKh} មែនទេ?`)) {
      setTeacherTimetable(activeTeacherId, []);
      showToast('info', 'បានសម្អាត', 'បានលុបកាលវិភាគបង្រៀនទាំងអស់រួចរាល់');
    }
  };

  // Reset to default sample schedule (Admin only)
  const handleResetTimetable = () => {
    if (!isAdmin) {
      showToast('error', 'គ្មានសិទ្ធិ', 'មានតែ Admin ប៉ុណ្ណោះដែលអាចកំណត់កាលវិភាគឡើងវិញបាន');
      return;
    }
    resetTeacherTimetable(activeTeacherId);
  };

  // PIN Submit to Unlock Admin
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === adminPin || enteredPin === '1234') {
      setIsAdminAuthenticated(true);
      setCurrentRole('admin');
      setShowPinModal(false);
      setEnteredPin('');
      setPinError(false);
      showToast('success', 'ផ្ទៀងផ្ទាត់ជោគជ័យ', 'បានបើកសិទ្ធិ Admin សម្រាប់កែប្រែកាលវិភាគបង្រៀនរួចរាល់');
    } else {
      setPinError(true);
      showToast('error', 'កូដមិនត្រឹមត្រូវ', 'សូមបញ្ចូលលេខកូដ PIN អ្នកគ្រប់គ្រងម្តងទៀត (កូដលំនាំដើម: 1234)');
    }
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 font-sans ${isModal ? 'p-2 sm:p-4' : ''}`}>
      {/* Official Printable Timetable Header (visible when printing) */}
      <div className="hidden print:block font-khmer text-slate-900 pb-4 mb-3 border-b-2 border-slate-800">
        <div className="flex justify-between items-start">
          <div className="text-left text-xs space-y-0.5">
            <p className="font-semibold">{schoolInfo.ministryKh || 'ក្រសួងអប់រំ យុវជន និងកីឡា'}</p>
            <p className="font-semibold">{schoolInfo.departmentKh || 'មន្ទីរអប់រំ យុវជន និងកីឡា'}</p>
            <p className="font-semibold">{schoolInfo.districtOfficeKh || 'ការិយាល័យអប់រំ យុវជន និងកីឡា'}</p>
            <p className="font-bold font-moul text-sm pt-1 text-slate-900">
              {schoolInfo.nameKh}
            </p>
          </div>
          <div className="text-center text-xs space-y-0.5">
            <p className="font-moul text-sm font-bold">ព្រះរាជាណាចក្រកម្ពុជា</p>
            <p className="font-moul text-xs font-semibold">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
            <div className="flex justify-center items-center py-0.5">
              <span className="w-12 h-0.5 bg-slate-400 rounded-full" />
            </div>
          </div>
        </div>

        <div className="text-center my-3">
          <h1 className="font-moul text-base text-slate-900">
            កាលវិភាគបង្រៀនប្រចាំសប្តាហ៍ (Weekly Teaching Schedule)
          </h1>
          <div className="flex justify-center items-center gap-4 text-xs font-khmer mt-1 text-slate-700">
            <p>
              គ្រូបង្រៀន៖ <strong className="font-bold text-slate-900">{currentTeacher?.nameKh}</strong> ({currentTeacher?.gender || 'ភេទ'})
            </p>
            <p>•</p>
            <p>
              កូដគ្រូ៖ <strong className="font-bold font-mono">{currentTeacher?.code}</strong>
            </p>
            <p>•</p>
            <p>
              ឆ្នាំសិក្សា៖ <strong className="font-bold">{schoolInfo.academicYear}</strong> ({schoolInfo.currentSemester === 'semester1' ? 'ឆមាសទី ១' : 'ឆមាសទី ២'})
            </p>
          </div>
        </div>
      </div>

      {/* Header Bar (hidden when printing) */}
      <div className="bg-[#0F172A] text-white rounded-2xl p-6 shadow-xs border border-slate-800 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xs border border-blue-500/30">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60 uppercase">
                  Teacher Timetable System
                </span>
                <span className="text-xs text-slate-500">|</span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>សិទ្ធិរដ្ឋបាល (Admin - អាចកែប្រែបាន)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-700/60 px-2.5 py-0.5 rounded-full">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>សិទ្ធិគ្រូបង្រៀន (មើលកាលវិភាគប៉ុណ្ណោះ)</span>
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold font-khmer leading-tight text-white mt-1.5">
                កាលវិភាគបង្រៀនរបស់លោកគ្រូ-អ្នកគ្រូ
              </h2>
              <p className="text-xs text-slate-400 font-khmer mt-0.5">
                {isAdmin
                  ? 'អ្នកគ្រប់គ្រងមានសិទ្ធិកំណត់ បន្ថែម កែប្រែ ឬលុបកាលវិភាគបង្រៀនរបស់គ្រូនីមួយៗ (ព្រឹក ៤ ម៉ោង • រសៀល ២ ម៉ោង)'
                  : 'កាលវិភាគបង្រៀនត្រូវបានគ្រប់គ្រងដោយរដ្ឋបាលសាលា (គ្រូបង្រៀនអាចមើល និងបោះពុម្ពប៉ុណ្ណោះ)'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => handleOpenAddEditSlot('monday', 1)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="បន្ថែមម៉ោងបង្រៀនថ្មី"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ បន្ថែមម៉ោង</span>
                </button>

                <button
                  onClick={handleResetTimetable}
                  className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  title="កំណត់កាលវិភាគគំរូឡើងវិញ"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>កាលវិភាគគំរូ</span>
                </button>

                <button
                  onClick={() => setCopyScheduleState({ fromDay: 'monday', toDay: 'tuesday' })}
                  className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  title="ចម្លងកាលវិភាគពីថ្ងៃមួយទៅថ្ងៃមួយទៀត"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>ចម្លងកាលវិភាគ</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowPinModal(true);
                  setEnteredPin('');
                  setPinError(false);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="បញ្ចូលលេខកូដ Admin PIN ដើម្បីបើកសិទ្ធិកែប្រែ"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>ចូល Admin ដើម្បីកែប្រែ</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="បោះពុម្ពកាលវិភាគបង្រៀនផ្លូវការ"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>បោះពុម្ពកាលវិភាគ</span>
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                បិទផ្ទាំង
              </button>
            )}
          </div>
        </div>

        {/* Teacher Selector Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300 font-khmer">
              ជ្រើសរើសគ្រូបង្រៀន៖
            </span>
            <select
              value={activeTeacherId}
              onChange={(e) => {
                setActiveTeacherId(e.target.value);
                setSelectedTeacherId(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-hidden focus:border-blue-500 shadow-2xs font-khmer cursor-pointer"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameKh} ({t.code}) - មុខវិជ្ជា៖ {subjects.find((s) => s.id === t.subjectIds[0])?.nameKh || 'ទូទៅ'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              សរុប៖ <strong className="text-blue-400 font-mono">{toKhmerNumber(totalWeeklyHours)} ម៉ោង</strong>/សប្តាហ៍
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-emerald-400">
              ព្រឹក៖ <strong className="font-mono">{toKhmerNumber(morningHours)} ម៉ោង</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-amber-400">
              រសៀល៖ <strong className="font-mono">{toKhmerNumber(afternoonHours)} ម៉ោង</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Role Notice Banner (For Teacher View) */}
      {!isAdmin && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-2xs no-print">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold font-khmer text-amber-950">
                ការការពារសិទ្ធិកាលវិភាគ (Teacher Read-Only Protection)
              </h4>
              <button
                onClick={() => {
                  setShowPinModal(true);
                  setEnteredPin('');
                  setPinError(false);
                }}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer font-khmer"
              >
                <KeyRound className="w-3 h-3" />
                <span>ដោះសោដោយប្រើកូដ Admin PIN</span>
              </button>
            </div>
            <p className="font-khmer text-amber-800/90 mt-1 leading-relaxed">
              លោកគ្រូ-អ្នកគ្រូត្រូវបានកំណត់ឱ្យមានសិទ្ធិត្រឹមតែ <strong>ពិនិត្យមើល និងបោះពុម្ពកាលវិភាគបង្រៀន</strong> ប៉ុណ្ណោះ។ 
              ប្រសិនបើមានការផ្លាស់ប្តូរម៉ោងបង្រៀន ឬបន្ទប់សិក្សា សូមទាក់ទង <strong>ការិយាល័យរដ្ឋបាល (Admin)</strong> ដើម្បីធ្វើការកែសម្រួល ឬលុបទិន្នន័យ។
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats Grid (hidden when printing) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">ម៉ោងបង្រៀនសរុប</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{toKhmerNumber(totalWeeklyHours)}</span>
            <span className="text-xs text-slate-500 font-khmer">ម៉ោង/សប្តាហ៍</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">វេនពេលព្រឹក</span>
            <span className="text-xs">☀️</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600">{toKhmerNumber(morningHours)}</span>
            <span className="text-xs text-slate-500 font-khmer">ម៉ោង (០៧:០០ - ១០:៣៥)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">វេនពេលរសៀល</span>
            <span className="text-xs">🌅</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600">{toKhmerNumber(afternoonHours)}</span>
            <span className="text-xs text-slate-500 font-khmer">ម៉ោង (១៣:៣០ - ១៥:១០)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">ថ្នាក់ទទួលបន្ទុក</span>
            <GraduationCap className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-purple-600">{toKhmerNumber(taughtClasses.length)}</span>
            <span className="text-xs text-slate-500 font-khmer">ថ្នាក់រៀន</span>
          </div>
        </div>
      </div>

      {/* Main Weekly Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Title Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base font-khmer flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>តារាងកាលវិភាគបង្រៀនប្រចាំសប្តាហ៍៖ {currentTeacher?.nameKh}</span>
              {isAdmin ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Admin Edit Mode
                </span>
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                  🔒 Read-Only
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-khmer mt-0.5">
              {isAdmin
                ? 'ចុចលើប្រអប់ម៉ោងដើម្បី កែសម្រួល ឬ បន្ថែមថ្នាក់ និងមុខវិជ្ជាបង្រៀន'
                : 'ចុចលើប្រអប់ម៉ោងដើម្បីពិនិត្យព័ត៌មានលម្អិតនៃម៉ោងបង្រៀន'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleClearAllSchedule}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="លុបម៉ោងបង្រៀនទាំងអស់របស់គ្រូនេះ"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>សម្អាតទាំងអស់</span>
              </button>
            )}
          </div>
        </div>

        {/* Timetable Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-3 w-40 text-center border-r border-slate-200">
                  ម៉ោង / វេនសិក្សា
                </th>
                {DAY_OF_WEEK_LIST.map((day) => (
                  <th key={day.key} className="p-3 text-center border-r border-slate-200 last:border-r-0">
                    <span className="font-bold text-slate-900 font-khmer text-xs block">
                      {day.nameKh}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal font-sans">
                      {day.key.toUpperCase()}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {/* Morning Shift Header */}
              <tr className="bg-blue-50/50">
                <td colSpan={7} className="px-4 py-1.5 text-[11px] font-bold text-blue-800 uppercase tracking-wider font-khmer">
                  ☀️ វេនពេលព្រឹក (MORNING SHIFT)
                </td>
              </tr>

              {PERIOD_SLOTS.slice(0, 4).map((slot) => (
                <tr key={slot.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Period label & time */}
                  <td className="p-3 bg-slate-50/60 border-r border-slate-200 text-center">
                    <div className="font-bold text-slate-900 font-khmer">{slot.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{slot.time}</div>
                  </td>

                  {/* Day Slots */}
                  {DAY_OF_WEEK_LIST.map((day) => {
                    const assignedSlot = getSlot(day.key, slot.id);
                    const classObj = assignedSlot ? classes.find((c) => c.id === assignedSlot.gradeId) : null;
                    const subjectObj = assignedSlot ? subjects.find((s) => s.id === assignedSlot.subjectId) : null;

                    return (
                      <td
                        key={day.key}
                        className="p-2 border-r border-slate-200 last:border-r-0 align-top h-24 relative group"
                      >
                        {assignedSlot ? (
                          <div
                            style={{
                              borderLeftColor: subjectObj?.color || '#3b82f6',
                            }}
                            className={`bg-white p-2 rounded-xl border border-slate-200 border-l-4 shadow-2xs h-full flex flex-col justify-between hover:shadow-xs transition-all cursor-pointer group/card ${
                              !isAdmin ? 'hover:border-slate-300' : ''
                            }`}
                            onClick={() => {
                              if (isAdmin) {
                                handleOpenAddEditSlot(day.key, slot.id, assignedSlot);
                              } else {
                                setViewingSlot({ slot: assignedSlot, classObj, subjectObj });
                              }
                            }}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-900 font-khmer text-xs truncate">
                                  {classObj?.nameKh || 'ថ្នាក់រៀន'}
                                </span>
                                <span
                                  style={{
                                    backgroundColor: `${subjectObj?.color || '#3b82f6'}15`,
                                    color: subjectObj?.color || '#3b82f6',
                                  }}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase"
                                >
                                  {subjectObj?.code || 'SUB'}
                                </span>
                              </div>
                              <div className="text-[11px] font-medium text-slate-600 font-khmer mt-1 truncate">
                                {subjectObj?.nameKh || 'មុខវិជ្ជា'}
                              </div>
                              {assignedSlot.room && (
                                <div className="text-[10px] text-slate-400 font-khmer mt-0.5 truncate">
                                  📍 {assignedSlot.room}
                                </div>
                              )}
                            </div>

                            {/* Actions / Details Footer */}
                            <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100">
                              <span className="text-[9px] text-slate-400 font-khmer truncate max-w-[90px]">
                                {assignedSlot.notes || (isAdmin ? 'កាលវិភាគ' : 'ចុចមើល')}
                              </span>

                              {isAdmin ? (
                                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAddEditSlot(day.key, slot.id, assignedSlot);
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                    title="កែសម្រួល (Admin)"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSlot(assignedSlot.id);
                                    }}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                    title="លុប (Admin)"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] text-slate-300 font-mono">🔒</span>
                              )}
                            </div>
                          </div>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAddEditSlot(day.key, slot.id)}
                            className="w-full h-full min-h-[72px] rounded-xl border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-400 hover:text-blue-600 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-[11px] font-khmer"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                            <span>+ បន្ថែម</span>
                          </button>
                        ) : (
                          <div className="w-full h-full min-h-[72px] rounded-xl border border-dashed border-slate-100 bg-slate-50/30 flex items-center justify-center text-slate-300 text-[10px] font-khmer select-none">
                            — គ្មានម៉ោង —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Afternoon Shift Header */}
              <tr className="bg-amber-50/50">
                <td colSpan={7} className="px-4 py-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider font-khmer">
                  🌅 វេនពេលរសៀល (AFTERNOON SHIFT)
                </td>
              </tr>

              {PERIOD_SLOTS.slice(4, 6).map((slot) => (
                <tr key={slot.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Period label & time */}
                  <td className="p-3 bg-slate-50/60 border-r border-slate-200 text-center">
                    <div className="font-bold text-slate-900 font-khmer">{slot.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{slot.time}</div>
                  </td>

                  {/* Day Slots */}
                  {DAY_OF_WEEK_LIST.map((day) => {
                    const assignedSlot = getSlot(day.key, slot.id);
                    const classObj = assignedSlot ? classes.find((c) => c.id === assignedSlot.gradeId) : null;
                    const subjectObj = assignedSlot ? subjects.find((s) => s.id === assignedSlot.subjectId) : null;

                    return (
                      <td
                        key={day.key}
                        className="p-2 border-r border-slate-200 last:border-r-0 align-top h-24 relative group"
                      >
                        {assignedSlot ? (
                          <div
                            style={{
                              borderLeftColor: subjectObj?.color || '#f59e0b',
                            }}
                            className={`bg-white p-2 rounded-xl border border-slate-200 border-l-4 shadow-2xs h-full flex flex-col justify-between hover:shadow-xs transition-all cursor-pointer group/card ${
                              !isAdmin ? 'hover:border-slate-300' : ''
                            }`}
                            onClick={() => {
                              if (isAdmin) {
                                handleOpenAddEditSlot(day.key, slot.id, assignedSlot);
                              } else {
                                setViewingSlot({ slot: assignedSlot, classObj, subjectObj });
                              }
                            }}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-900 font-khmer text-xs truncate">
                                  {classObj?.nameKh || 'ថ្នាក់រៀន'}
                                </span>
                                <span
                                  style={{
                                    backgroundColor: `${subjectObj?.color || '#f59e0b'}15`,
                                    color: subjectObj?.color || '#f59e0b',
                                  }}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase"
                                >
                                  {subjectObj?.code || 'SUB'}
                                </span>
                              </div>
                              <div className="text-[11px] font-medium text-slate-600 font-khmer mt-1 truncate">
                                {subjectObj?.nameKh || 'មុខវិជ្ជា'}
                              </div>
                              {assignedSlot.room && (
                                <div className="text-[10px] text-slate-400 font-khmer mt-0.5 truncate">
                                  📍 {assignedSlot.room}
                                </div>
                              )}
                            </div>

                            {/* Actions / Details Footer */}
                            <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100">
                              <span className="text-[9px] text-slate-400 font-khmer truncate max-w-[90px]">
                                {assignedSlot.notes || (isAdmin ? 'កាលវិភាគ' : 'ចុចមើល')}
                              </span>

                              {isAdmin ? (
                                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAddEditSlot(day.key, slot.id, assignedSlot);
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                    title="កែសម្រួល (Admin)"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSlot(assignedSlot.id);
                                    }}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                    title="លុប (Admin)"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] text-slate-300 font-mono">🔒</span>
                              )}
                            </div>
                          </div>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAddEditSlot(day.key, slot.id)}
                            className="w-full h-full min-h-[72px] rounded-xl border border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-400 hover:text-amber-600 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-[11px] font-khmer"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
                            <span>+ បន្ថែម</span>
                          </button>
                        ) : (
                          <div className="w-full h-full min-h-[72px] rounded-xl border border-dashed border-slate-100 bg-slate-50/30 flex items-center justify-center text-slate-300 text-[10px] font-khmer select-none">
                            — គ្មានម៉ោង —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable Signatures Block (visible when printing) */}
      <div className="hidden print:grid grid-cols-2 gap-8 mt-6 pt-4 font-khmer text-xs text-slate-800 print-break-inside-avoid border-t border-slate-300">
        <div className="text-center space-y-1">
          <p className="font-semibold">បានឃើញ និងយល់ព្រម</p>
          <p className="font-bold text-slate-900">សាមីខ្លួនគ្រូបង្រៀន</p>
          <div className="h-16" />
          <p className="font-bold text-slate-900">{currentTeacher?.nameKh}</p>
        </div>

        <div className="text-center space-y-1">
          <p className="text-slate-600">
            {schoolInfo.address ? schoolInfo.address.split(' ')[0] : 'រាជធានីភ្នំពេញ'}
          </p>
          <p className="font-bold text-slate-900">នាយកសាលា</p>
          <div className="h-16" />
          <p className="font-bold font-khmer text-slate-900">
            {schoolInfo.principalName || 'លោកនាយកសាលា'}
          </p>
        </div>
      </div>

      {/* READ-ONLY DETAIL MODAL (For Teachers) */}
      {viewingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 font-khmer">
                    ព័ត៌មានលម្អិតម៉ោងបង្រៀន
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {DAY_OF_WEEK_LIST.find((d) => d.key === viewingSlot.slot.dayOfWeek)?.nameKh} • ម៉ោងទី{toKhmerNumber(viewingSlot.slot.periodNumber)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingSlot(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg text-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs font-khmer">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">ថ្នាក់រៀន៖</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {viewingSlot.classObj?.nameKh || 'ថ្នាក់រៀន'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">មុខវិជ្ជាបង្រៀន៖</span>
                  <span className="font-bold text-blue-700">
                    {viewingSlot.subjectObj?.nameKh || 'មុខវិជ្ជា'} ({viewingSlot.subjectObj?.code})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">ម៉ោង & វេនបង្រៀន៖</span>
                  <span className="font-bold text-slate-800">
                    {PERIOD_SLOTS.find((p) => p.id === viewingSlot.slot.periodNumber)?.name} ({PERIOD_SLOTS.find((p) => p.id === viewingSlot.slot.periodNumber)?.time})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">បន្ទប់សិក្សា៖</span>
                  <span className="font-semibold text-slate-800">
                    {viewingSlot.slot.room || viewingSlot.classObj?.room || 'មិនបានបញ្ជាក់'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">គ្រូបង្រៀន៖</span>
                  <span className="font-bold text-slate-900">
                    {currentTeacher?.nameKh} ({currentTeacher?.code})
                  </span>
                </div>
                {viewingSlot.slot.notes && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-slate-500 block mb-0.5">កំណត់សម្គាល់៖</span>
                    <p className="text-slate-700 font-medium bg-white p-2 rounded-lg border border-slate-200">
                      {viewingSlot.slot.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  កាលវិភាគបង្រៀននេះត្រូវបានចាក់សោសុវត្ថិភាពដោយរដ្ឋបាល។ ប្រសិនបើត្រូវការផ្លាស់ប្តូរ សូមទាក់ទង Admin។
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingSlot(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold font-khmer transition-colors cursor-pointer text-xs"
              >
                យល់ព្រម / បិទ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / ADD SLOT MODAL (Admin Only) */}
      {isAdmin && editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-900 font-khmer flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>
                  {editingSlot.id ? 'កែសម្រួលម៉ោងបង្រៀន (Admin)' : 'បន្ថែមម៉ោងបង្រៀនថ្មី (Admin)'}
                </span>
              </h4>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-khmer">
                    ថ្ងៃក្នុងសប្តាហ៍
                  </label>
                  <select
                    value={editingSlot.dayOfWeek}
                    onChange={(e) =>
                      setEditingSlot({ ...editingSlot, dayOfWeek: e.target.value as DayOfWeek })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-khmer font-semibold focus:border-blue-500 outline-hidden"
                  >
                    {DAY_OF_WEEK_LIST.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.nameKh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-khmer">
                    ម៉ោងបង្រៀន
                  </label>
                  <select
                    value={editingSlot.periodNumber}
                    onChange={(e) =>
                      setEditingSlot({ ...editingSlot, periodNumber: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-khmer font-semibold focus:border-blue-500 outline-hidden"
                  >
                    {PERIOD_SLOTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.shift} - {s.time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 font-khmer">
                  ថ្នាក់រៀន
                </label>
                <select
                  value={editingSlot.gradeId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const cObj = classes.find((c) => c.id === cId);
                    setEditingSlot({
                      ...editingSlot,
                      gradeId: cId,
                      room: cObj?.room || editingSlot.room,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-khmer font-semibold focus:border-blue-500 outline-hidden"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameKh} ({c.room}) - វេន{c.shift}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 font-khmer">
                  មុខវិជ្ជា
                </label>
                <select
                  value={editingSlot.subjectId}
                  onChange={(e) => setEditingSlot({ ...editingSlot, subjectId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-khmer font-semibold focus:border-blue-500 outline-hidden"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameKh} ({s.code}) - {s.weeklyHours} ម៉ោង/សប្តាហ៍
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-khmer">
                    បន្ទប់សិក្សា
                  </label>
                  <input
                    type="text"
                    value={editingSlot.room}
                    onChange={(e) => setEditingSlot({ ...editingSlot, room: e.target.value })}
                    placeholder="ឧ. បន្ទប់ A-101"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-khmer focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-khmer">
                    កំណត់សម្គាល់
                  </label>
                  <input
                    type="text"
                    value={editingSlot.notes}
                    onChange={(e) => setEditingSlot({ ...editingSlot, notes: e.target.value })}
                    placeholder="ឧ. បង្រៀនទ្រឹស្តី / អនុវត្ត"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-khmer focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold font-khmer transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold font-khmer shadow-xs transition-colors cursor-pointer"
                >
                  {editingSlot.id ? 'រក្សាទុកការកែប្រែ' : 'បន្ថែមម៉ោងនេះ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COPY SCHEDULE MODAL (Admin Only) */}
      {isAdmin && copyScheduleState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h4 className="font-bold text-base text-slate-900 font-khmer flex items-center gap-2 pb-3 border-b border-slate-100">
              <Copy className="w-4 h-4 text-blue-600" />
              <span>ចម្លងកាលវិភាគបង្រៀន</span>
            </h4>
            <div className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 font-khmer">
                  ចម្លងចេញពី (ថ្ងៃដើម)៖
                </label>
                <select
                  value={copyScheduleState.fromDay}
                  onChange={(e) =>
                    setCopyScheduleState({
                      ...copyScheduleState,
                      fromDay: e.target.value as DayOfWeek,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-khmer font-semibold"
                >
                  {DAY_OF_WEEK_LIST.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.nameKh} ({teacherSlots.filter((s) => s.dayOfWeek === d.key).length} ម៉ោង)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 font-khmer">
                  ចម្លងដាក់ទៅកាន់ (ថ្ងៃគោលដៅ)៖
                </label>
                <select
                  value={copyScheduleState.toDay}
                  onChange={(e) =>
                    setCopyScheduleState({
                      ...copyScheduleState,
                      toDay: e.target.value as DayOfWeek,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-khmer font-semibold"
                >
                  {DAY_OF_WEEK_LIST.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.nameKh}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] font-khmer">
                ⚠️ ចំណាំ៖ ការចម្លងនេះនឹងជំនួសម៉ោងបង្រៀនចាស់ដែលមាននៅថ្ងៃគោលដៅ។
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCopyScheduleState(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold font-khmer cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCopySchedule}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold font-khmer shadow-xs cursor-pointer"
                >
                  យល់ព្រមចម្លង
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADMIN PIN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="text-center pb-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-khmer">
                ផ្ទៀងផ្ទាត់លេខកូដ Admin PIN
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-khmer">
                បញ្ចូលលេខកូដសម្ងាត់អ្នកគ្រប់គ្រងដើម្បីបើកសិទ្ធិកែប្រែកាលវិភាគបង្រៀន
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4 mt-2">
              <div>
                <input
                  type="password"
                  maxLength={10}
                  autoFocus
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="បញ្ចូលលេខកូដ PIN សម្ងាត់"
                  className={`w-full text-center text-lg font-mono tracking-widest bg-slate-50 border rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-200 outline-hidden ${
                    pinError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                {pinError && (
                  <p className="text-xs text-rose-500 font-khmer text-center mt-1.5">
                    លេខកូដមិនត្រឹមត្រូវឡើយ! សូមពិនិត្យម្តងទៀត
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl font-khmer transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl font-khmer shadow-xs transition-colors cursor-pointer"
                >
                  ផ្ទៀងផ្ទាត់ & បើកសិទ្ធិ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
