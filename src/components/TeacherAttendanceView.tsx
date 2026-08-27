import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus } from '../types';
import {
  PERIOD_SLOTS,
  STATUS_META,
  formatKhmerDate,
  toKhmerNumber,
  getTodayString,
  getDayOfWeekKeyFromDate,
  DAY_OF_WEEK_LIST,
} from '../utils/khmerDate';
import {
  UserCheck,
  Lock,
  CheckCircle2,
  Send,
  AlertCircle,
  ChevronDown,
  Calendar,
  BookOpen,
  School,
  Sparkles,
  Zap,
  RotateCcw,
  Clock,
  MapPin,
  Compass,
  AlertTriangle,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import { TeacherTimetableView } from './TeacherTimetableView';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { formatDistanceKhmer } from '../utils/geoUtils';

export const TeacherAttendanceView: React.FC = () => {
  const {
    schoolInfo,
    teachers,
    classes,
    subjects,
    selectedTeacherId,
    setSelectedTeacherId,
    attendanceRecords,
    submitTeacherAttendance,
    telegramConfig,
    showToast,
    getTeacherScheduleForDay,
    timetables,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [submitting, setSubmitting] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  // Geolocation Geofencing
  const geo = useGeoLocation(schoolInfo.geoFence);

  // Form states for each period (1 to 8)
  interface PeriodFormState {
    enabled: boolean;
    periodId: number;
    gradeId: string;
    subjectId: string;
    status: AttendanceStatus;
    lessonTopic: string;
    reason: string;
    substituteTeacherId?: string;
    isFromTimetable?: boolean;
    room?: string;
  }

  const currentTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  // Initialize period slots for the form
  const [periodForms, setPeriodForms] = useState<PeriodFormState[]>([]);

  // Check if attendance is already submitted/locked for this teacher on selectedDate
  const existingRecords = attendanceRecords.filter(
    (r) => r.teacherId === currentTeacher?.id && r.date === selectedDate
  );
  const isAlreadySubmitted = existingRecords.length > 0 && existingRecords.some((r) => r.isLocked);

  // Day of week details
  const dayKey = getDayOfWeekKeyFromDate(selectedDate);
  const dayInfo = DAY_OF_WEEK_LIST.find((d) => d.key === dayKey);
  const dayScheduledSlots = currentTeacher
    ? getTeacherScheduleForDay(currentTeacher.id, dayKey)
    : [];

  // Reset or populate period forms when teacher, date, or timetables change
  useEffect(() => {
    if (!currentTeacher) return;

    const defaultSubj = currentTeacher.subjectIds[0] || subjects[0]?.id || 'sub-1';
    const defaultGrade = currentTeacher.gradeIds[0] || classes[0]?.id || 'cls-1';

    const currentDaySchedule = getTeacherScheduleForDay(currentTeacher.id, dayKey);

    const forms: PeriodFormState[] = PERIOD_SLOTS.map((slot) => {
      // Find if this period is scheduled in teacher's timetable
      const scheduled = currentDaySchedule.find((s) => s.periodNumber === slot.id);

      if (scheduled) {
        return {
          enabled: true,
          periodId: slot.id,
          gradeId: scheduled.gradeId,
          subjectId: scheduled.subjectId,
          status: 'present',
          lessonTopic: scheduled.notes ? `បង្រៀន${scheduled.notes}` : '',
          reason: '',
          isFromTimetable: true,
          room: scheduled.room,
        };
      }

      // If no timetable exists at all for this day, default first 3 periods enabled
      const hasAnyScheduleThisDay = currentDaySchedule.length > 0;
      const isDefaultEnabled = !hasAnyScheduleThisDay && slot.id <= 3;

      return {
        enabled: isDefaultEnabled,
        periodId: slot.id,
        gradeId: defaultGrade,
        subjectId: defaultSubj,
        status: 'present',
        lessonTopic: '',
        reason: '',
        isFromTimetable: false,
      };
    });

    setPeriodForms(forms);
  }, [currentTeacher?.id, selectedDate, timetables]);

  const handleTogglePeriod = (periodId: number) => {
    if (isAlreadySubmitted) return;
    setPeriodForms((prev) =>
      prev.map((f) => (f.periodId === periodId ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleUpdatePeriod = (periodId: number, field: keyof PeriodFormState, value: any) => {
    if (isAlreadySubmitted) return;
    setPeriodForms((prev) =>
      prev.map((f) => (f.periodId === periodId ? { ...f, [field]: value } : f))
    );
  };

  const handleQuickMarkAllPresent = () => {
    if (isAlreadySubmitted) return;
    setPeriodForms((prev) =>
      prev.map((f) => ({
        ...f,
        status: 'present',
        reason: '',
      }))
    );
    showToast('info', 'កំណត់វត្តមាន', 'បានកំណត់គ្រប់ម៉ោងបង្រៀនជា "វត្តមាន" ទាំងអស់');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadySubmitted) {
      showToast('error', 'ទិន្នន័យបានចាក់សោ', 'ទិន្នន័យវត្តមានសម្រាប់ថ្ងៃនេះត្រូវបានបញ្ជូនរួចហើយ មិនអាចកែប្រែបានទេ!');
      return;
    }

    // Geofence strict verification
    if (schoolInfo.geoFence?.enabled && schoolInfo.geoFence?.requireLocation) {
      if (geo.isInside !== true) {
        showToast(
          'error',
          'នៅក្រៅបរិវេណសាលា',
          geo.error
            ? `មិនអាចផ្ទៀងផ្ទាត់ទីតាំង GPS បានទេ៖ ${geo.error}`
            : `លោកគ្រូ-អ្នកគ្រូ ស្ថិតនៅក្រៅបរិវេណសាលារៀន (ចម្ងាយ៖ ${
                geo.distanceMeters !== null ? formatDistanceKhmer(geo.distanceMeters) : 'មិនស្គាល់'
              }) មិនអាចចុះវត្តមានបានទេ!`
        );
        return;
      }
    }

    const enabledSlots = periodForms.filter((f) => f.enabled);
    if (enabledSlots.length === 0) {
      showToast('error', 'សូមជ្រើសរើសម៉ោង', 'សូមជ្រើសរើសម៉ោងបង្រៀនយ៉ាងហោចណាស់ ១ ម៉ោង');
      return;
    }

    setSubmitting(true);

    const d = new Date(selectedDate);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const semester = month >= 10 || month <= 3 ? 'semester1' : 'semester2';

    const locationData = schoolInfo.geoFence?.enabled
      ? {
          latitude: geo.coords?.latitude || schoolInfo.geoFence.latitude,
          longitude: geo.coords?.longitude || schoolInfo.geoFence.longitude,
          distanceMeters: geo.distanceMeters ?? 0,
          isInsidePremises: geo.isInside === true,
        }
      : undefined;

    const recordsToSubmit = enabledSlots.map((slot) => {
      const slotDef = PERIOD_SLOTS.find((s) => s.id === slot.periodId);
      return {
        teacherId: currentTeacher.id,
        date: selectedDate,
        sessionPeriod: `${slotDef?.name} (${slotDef?.time})`,
        sessionNumber: slot.periodId,
        gradeId: slot.gradeId,
        subjectId: slot.subjectId,
        status: slot.status,
        lessonTopic: slot.lessonTopic || 'ដំណើរការបង្រៀនតាមកាលវិភាគ',
        reason: slot.reason || undefined,
        substituteTeacherId: slot.substituteTeacherId || undefined,
        semester: semester as 'semester1' | 'semester2',
        month: month,
        year: year,
        locationCoordinates: locationData,
      };
    });

    await submitTeacherAttendance(recordsToSubmit);
    setSubmitting(false);
  };

  // Stats for the current teacher in this month
  const currentMonthRecords = attendanceRecords.filter(
    (r) => r.teacherId === currentTeacher?.id && r.month === (new Date(selectedDate).getMonth() + 1)
  );
  const totalSessionsTaught = currentMonthRecords.length;
  const presentCount = currentMonthRecords.filter((r) => r.status === 'present').length;
  const lateCount = currentMonthRecords.filter((r) => r.status === 'late').length;
  const leaveCount = currentMonthRecords.filter((r) => r.status === 'permission').length;
  const absentCount = currentMonthRecords.filter((r) => r.status === 'absent').length;
  const attRate = totalSessionsTaught > 0 ? Math.round(((presentCount + lateCount) / totalSessionsTaught) * 100) : 100;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Geometric Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ម៉ោងបង្រៀនសរុប (ខែនេះ)
            </span>
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {toKhmerNumber(totalSessionsTaught)}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">ម៉ោង</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              វត្តមានពេញលេញ
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              {toKhmerNumber(presentCount)}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {toKhmerNumber(attRate)}%
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              មកយឺត & សុំច្បាប់
            </span>
            <div className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">
              {toKhmerNumber(lateCount + leaveCount)}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              ច្បាប់ {toKhmerNumber(leaveCount)} | យឺត {toKhmerNumber(lateCount)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              អវត្តមាន (គ្មានច្បាប់)
            </span>
            <div className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">
              {toKhmerNumber(absentCount)}
            </span>
            <span className="text-[11px] font-semibold text-rose-600">
              {absentCount === 0 ? 'គ្មានអវត្តមាន' : `${toKhmerNumber(absentCount)} ម៉ោង`}
            </span>
          </div>
        </div>
      </div>

      {/* Teacher Profile & Quick Selector Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Teacher Selector */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-xl border border-slate-800 shadow-sm flex-shrink-0">
              <span className="text-blue-400 font-mono">
                {currentTeacher?.code || 'TCH'}
              </span>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                ជ្រើសរើសឈ្មោះលោកគ្រូ-អ្នកគ្រូ
              </label>
              <div className="relative mt-1">
                <select
                  id="select-teacher-attendance"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="appearance-none font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2 pr-9 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-hidden cursor-pointer min-w-[240px]"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameKh} ({t.code}) - {t.gender}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>📞 {currentTeacher?.phone}</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-700">
                  {currentTeacher?.isHomeroom ? `បន្ទុកថ្នាក់ ${currentTeacher.homeroomGrade}` : 'គ្រូបង្រៀនទូទៅ'}
                </span>
              </p>
            </div>
          </div>

          {/* Date Picker & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <label className="text-xs font-bold text-slate-700">កាលបរិច្ឆេទ៖</label>
              <input
                id="input-attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent outline-hidden cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowTimetableModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer font-khmer"
              title="មើល ឬកែសម្រួលកាលវិភាគបង្រៀនរបស់គ្រូនេះ"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>កាលវិភាគបង្រៀន</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full">
                {toKhmerNumber(dayScheduledSlots.length)}
              </span>
            </button>

            {!isAlreadySubmitted && (
              <button
                type="button"
                onClick={handleQuickMarkAllPresent}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>វត្តមានទាំងអស់</span>
              </button>
            )}
          </div>
        </div>

        {/* Timetable Notification & Sync Banner */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-khmer">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              កាលវិភាគសម្រាប់ <strong>{dayInfo?.nameKh || 'ថ្ងៃនេះ'}</strong>៖
            </span>
            {dayScheduledSlots.length > 0 ? (
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                មាន {toKhmerNumber(dayScheduledSlots.length)} ម៉ោងបង្រៀន (បានបញ្ចូលទិន្នន័យស្វ័យប្រវត្តិ)
              </span>
            ) : (
              <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                មិនមានម៉ោងបង្រៀនតាមកាលវិភាគឡើយ
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowTimetableModal(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>កែសម្រួលកាលវិភាគបង្រៀន ➔</span>
          </button>
        </div>
      </div>

      {/* Main Form or Locked Area */}
      {isAlreadySubmitted ? (
        /* LOCKED STATE */
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden">
          <div className="bg-emerald-600 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base">ទិន្នន័យវត្តមានត្រូវបានចាក់សោ (Locked)</h3>
                  <span className="bg-white/20 text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Submitted
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-0.5">
                  លោកគ្រូ-អ្នកគ្រូបានបំពេញវត្តមានសម្រាប់ {formatKhmerDate(selectedDate)} រួចរាល់ហើយ
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingRecords.map((r) => {
                const statusMeta = STATUS_META[r.status];
                const subj = subjects.find((s) => s.id === r.subjectId);
                const cls = classes.find((c) => c.id === r.gradeId);
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                        {r.sessionPeriod}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.color}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 mt-2">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        {subj?.nameKh} ({cls?.name})
                      </p>
                      <p className="text-slate-600 text-[11px]">
                        <span className="font-medium text-slate-500">ខ្លឹមសារមេរៀន៖</span> {r.lessonTopic}
                      </p>
                      {r.reason && (
                        <p className="text-rose-600 text-[11px] font-medium">
                          មូលហេតុ៖ {r.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* EDITABLE FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GPS GEOFENCE VERIFICATION CARD */}
          {schoolInfo.geoFence?.enabled && (
            <div
              className={`rounded-2xl p-5 border transition-all shadow-xs ${
                geo.isInside === true
                  ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                  : geo.isInside === false
                  ? 'bg-rose-50/80 border-rose-200 text-slate-900'
                  : 'bg-amber-50/70 border-amber-200 text-slate-900'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                      geo.isInside === true
                        ? 'bg-emerald-600 text-white'
                        : geo.isInside === false
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {geo.isInside === true ? (
                      <MapPin className="w-6 h-6" />
                    ) : geo.isInside === false ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <Compass className="w-6 h-6 animate-spin" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold font-khmer">
                        {geo.isInside === true
                          ? '📍 ស្ថិតនៅក្នុងបរិវេណសាលារៀន (Inside Premises)'
                          : geo.isInside === false
                          ? '🚫 ស្ថិតនៅក្រៅបរិវេណសាលារៀន (Outside Premises)'
                          : '🟡 កំពុងផ្ទៀងផ្ទាត់ទីតាំង GPS...'}
                      </h4>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          geo.isInside === true
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : geo.isInside === false
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {geo.isInside === true
                          ? 'អនុញ្ញាតចុះវត្តមាន'
                          : geo.isInside === false
                          ? 'ហាមឃាត់ការចុះវត្តមាន'
                          : 'កំពុងពិនិត្យ...'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 font-khmer leading-relaxed">
                      {geo.isInside === true ? (
                        <span>
                          ទីតាំងរបស់អ្នកស្ថិតក្នុងកម្រិតសុពលភាព (ចម្ងាយ៖{' '}
                          <strong className="text-emerald-700 font-bold">
                            {formatDistanceKhmer(geo.distanceMeters ?? 0)}
                          </strong>{' '}
                          ពីចំណុចកណ្តាលសាលា / កម្រិតអនុញ្ញាត៖{' '}
                          <strong>{formatDistanceKhmer(schoolInfo.geoFence.radiusMeters)}</strong>)។
                        </span>
                      ) : geo.isInside === false ? (
                        <span className="text-rose-700 font-medium">
                          លោកគ្រូ-អ្នកគ្រូស្ថិតនៅចម្ងាយ{' '}
                          <strong className="font-bold underline">
                            {formatDistanceKhmer(geo.distanceMeters ?? 0)}
                          </strong>{' '}
                          ពីសាលា (លើសពីកម្រិតកំណត់ {formatDistanceKhmer(schoolInfo.geoFence.radiusMeters)})។
                          ប្រព័ន្ធមិនអនុញ្ញាតឱ្យបញ្ជូនវត្តមានពីក្រៅបរិវេណសាលាឡើយ!
                        </span>
                      ) : (
                        <span>
                          {geo.error ||
                            'សូមអនុញ្ញាតសិទ្ធិទីតាំង (Location) ដើម្បីផ្ទៀងផ្ទាត់វត្តមានក្នុងបរិវេណសាលា។'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                  <button
                    type="button"
                    onClick={() => geo.checkLocation()}
                    disabled={geo.isLocating}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${geo.isLocating ? 'animate-spin' : ''}`} />
                    <span>{geo.isLocating ? 'កំពុងស្កេន...' : 'ស្កេន GPS ម្តងទៀត'}</span>
                  </button>

                  {/* Testing / Simulation pills */}
                  <div className="flex items-center gap-1 bg-white/80 border border-slate-200 rounded-xl p-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => geo.simulatePosition(true)}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        geo.isSimulated && geo.isInside === true
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="សាកល្បង៖ កំណត់ថាស្ថិតនៅក្នុងសាលា (Test inside)"
                    >
                      🧪 ក្នុងសាលា
                    </button>
                    <button
                      type="button"
                      onClick={() => geo.simulatePosition(false)}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        geo.isSimulated && geo.isInside === false
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="សាកល្បង៖ កំណត់ថាស្ថិតនៅក្រៅសាលា (Test outside)"
                    >
                      🧪 ក្រៅសាលា
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>ជ្រើសរើសម៉ោងបង្រៀន និងកត់ត្រាវត្តមានប្រចាំថ្ងៃ</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  សូមជ្រើសរើសម៉ោងដែលលោកគ្រូ-អ្នកគ្រូមានបង្រៀនរួចបំពេញព័ត៌មាន (ទិន្នន័យនឹងត្រូវចាក់សោស្វ័យប្រវត្តិកាលណាបានបញ្ជូន)
                </p>
              </div>
            </div>

            {/* Grid of Periods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {periodForms.map((period) => {
                const slotDef = PERIOD_SLOTS.find((s) => s.id === period.periodId);
                const isMorning = period.periodId <= 4;

                return (
                  <div
                    key={period.periodId}
                    className={`rounded-xl p-4 transition-all border ${
                      period.enabled
                        ? 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-100'
                        : 'bg-slate-50/80 border-slate-200 opacity-60'
                    }`}
                  >
                    {/* Period Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={period.enabled}
                          onChange={() => handleTogglePeriod(period.periodId)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              {slotDef?.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                                isMorning
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {slotDef?.time}
                            </span>
                            {period.isFromTimetable && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300 font-khmer">
                                តាមកាលវិភាគ {period.room ? `(${period.room})` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>

                      {period.enabled && (
                        <div className="flex items-center gap-1">
                          {(['present', 'late', 'permission', 'absent'] as AttendanceStatus[]).map(
                            (st) => {
                              const meta = STATUS_META[st];
                              const isSelected = period.status === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleUpdatePeriod(period.periodId, 'status', st)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? `${meta.color} ring-1 shadow-2xs font-black`
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                  }`}
                                >
                                  {meta.labelKh}
                                </button>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>

                    {/* Period Details (when checked) */}
                    {period.enabled && (
                      <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              ថ្នាក់រៀន
                            </label>
                            <select
                              value={period.gradeId}
                              onChange={(e) =>
                                handleUpdatePeriod(period.periodId, 'gradeId', e.target.value)
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-hidden focus:bg-white focus:border-blue-500"
                            >
                              {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.shift === 'morning' ? 'ព្រឹក' : 'រសៀល'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              មុខវិជ្ជា
                            </label>
                            <select
                              value={period.subjectId}
                              onChange={(e) =>
                                handleUpdatePeriod(period.periodId, 'subjectId', e.target.value)
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-hidden focus:bg-white focus:border-blue-500"
                            >
                              {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.nameKh} ({s.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            ខ្លឹមសារមេរៀន / សកម្មភាពបង្រៀន
                          </label>
                          <input
                            type="text"
                            value={period.lessonTopic}
                            onChange={(e) =>
                              handleUpdatePeriod(period.periodId, 'lessonTopic', e.target.value)
                            }
                            placeholder="ឧទាហរណ៍៖ មេរៀនទី ៣ អនុគមន៍ត្រីកោណមាត្រ (លំហាត់ទី ១-៤)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 placeholder:text-slate-400 outline-hidden focus:bg-white focus:border-blue-500"
                          />
                        </div>

                        {period.status !== 'present' && (
                          <div>
                            <label className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
                              មូលហេតុ ឬចំណាំផ្សេងៗ
                            </label>
                            <input
                              type="text"
                              value={period.reason}
                              onChange={(e) =>
                                handleUpdatePeriod(period.periodId, 'reason', e.target.value)
                              }
                              placeholder="បញ្ជាក់មូលហេតុ (ឧ៖ ឈឺមានច្បាប់, បេសកកម្ម, យឺតដោយសារ...)"
                              className="w-full bg-rose-50/50 border border-rose-200 rounded-lg p-2 text-slate-900 outline-hidden focus:bg-white focus:border-rose-500"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {schoolInfo.geoFence?.enabled && schoolInfo.geoFence?.requireLocation && geo.isInside === false ? (
                  <div className="flex items-center gap-2 text-rose-600 font-bold">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      បិទសិទ្ធិបញ្ជូនវត្តមាន៖ ដោយសារស្ថិតនៅក្រៅបរិវេណសាលា (លើសពី {formatDistanceKhmer(schoolInfo.geoFence.radiusMeters)})
                    </span>
                  </div>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>
                      នៅពេលចុច <strong className="text-slate-800 font-bold">"បញ្ជូន និងចាក់សោវត្តមាន"</strong> ទិន្នន័យនឹងត្រូវចាក់សោមិនអាចកែប្រែដោយលោកគ្រូ-អ្នកគ្រូឡើយ។
                    </span>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  (schoolInfo.geoFence?.enabled && schoolInfo.geoFence?.requireLocation && geo.isInside === false)
                }
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all ${
                  schoolInfo.geoFence?.enabled && schoolInfo.geoFence?.requireLocation && geo.isInside === false
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed opacity-80'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>កំពុងបញ្ជូនទិន្នន័យ...</span>
                  </>
                ) : schoolInfo.geoFence?.enabled && schoolInfo.geoFence?.requireLocation && geo.isInside === false ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>មិនអាចបញ្ជូនបានទេ (នៅក្រៅបរិវេណសាលា)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>បញ្ជូន និងចាក់សោវត្តមាន (Lock & Submit)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Telegram Live Synchronization Card */}
      <div className="bg-[#0F172A] rounded-2xl p-5 border border-slate-800 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  ប្រព័ន្ធបញ្ជូនទិន្នន័យស្វ័យប្រវត្តិតាម Telegram Bot
                </h4>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded font-bold">
                  AUTO-SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                រាល់ពេលចុះវត្តមាន និងចាក់សោរួច ទិន្នន័យនឹងត្រូវរៀបចំផ្ញើជូនអ្នកគ្រប់គ្រងសាលាដោយស្វ័យប្រវត្តិ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Target:{' '}
              {telegramConfig.chatId ? (
                <span className="text-blue-400 font-bold">{telegramConfig.chatId}</span>
              ) : (
                <span className="text-slate-500">Not Configured</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Timetable Modal */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200">
            <TeacherTimetableView
              isModal
              initialTeacherId={currentTeacher?.id}
              onClose={() => setShowTimetableModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
