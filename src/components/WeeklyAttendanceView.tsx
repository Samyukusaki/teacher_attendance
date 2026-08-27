import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceRecord, Teacher } from '../types';
import {
  getWeekDays,
  formatKhmerDate,
  formatShortKhmerDate,
  toKhmerNumber,
  STATUS_META,
} from '../utils/khmerDate';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  X,
  BookOpen,
} from 'lucide-react';

export const WeeklyAttendanceView: React.FC = () => {
  const { teachers, classes, subjects, attendanceRecords } = useApp();

  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [detailModalData, setDetailModalData] = useState<{
    teacher: Teacher;
    date: string;
    dayName: string;
    records: AttendanceRecord[];
  } | null>(null);

  const weekDays = getWeekDays(currentWeekDate);
  const startDay = weekDays[0];
  const endDay = weekDays[weekDays.length - 1];

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekDate);
    next.setDate(next.getDate() + 7);
    setCurrentWeekDate(next);
  };

  const handleCurrentWeek = () => {
    setCurrentWeekDate(new Date());
  };

  // Filter teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.nameKh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery);
    const matchesSubj =
      selectedSubjectId === 'all' || t.subjectIds.includes(selectedSubjectId);
    return matchesSearch && matchesSubj && t.status === 'active';
  });

  // Calculate overall weekly stats
  const weekDateStrings = weekDays.map((d) => d.date);
  const weekRecords = attendanceRecords.filter((r) =>
    weekDateStrings.includes(r.date)
  );

  const totalSessions = weekRecords.length;
  const presentCount = weekRecords.filter((r) => r.status === 'present').length;
  const lateCount = weekRecords.filter((r) => r.status === 'late').length;
  const permCount = weekRecords.filter((r) => r.status === 'permission').length;
  const absentCount = weekRecords.filter((r) => r.status === 'absent').length;

  const weeklyAttendanceRate =
    totalSessions > 0
      ? Math.round(((presentCount + lateCount) / totalSessions) * 100)
      : 100;

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Week Controller */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                Weekly Matrix
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-khmer">
                តារាងតាមដានវត្តមានគ្រូបង្រៀនប្រចាំសប្តាហ៍
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              សប្តាហ៍ចាប់ពី <span className="font-semibold text-slate-700">{formatKhmerDate(startDay.date)}</span> ដល់ <span className="font-semibold text-slate-700">{formatKhmerDate(endDay.date)}</span>
            </p>
          </div>

          {/* Week Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              id="btn-prev-week"
              onClick={handlePrevWeek}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
              title="សប្តាហ៍មុន"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-current-week"
              onClick={handleCurrentWeek}
              className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
            >
              សប្តាហ៍បច្ចុប្បន្ន
            </button>
            <button
              id="btn-next-week"
              onClick={handleNextWeek}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
              title="សប្តាហ៍បន្ទាប់"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekly Stats Bar - Geometric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ម៉ោងសរុប</p>
              <div className="w-2 h-2 rounded-full bg-slate-400" />
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">
              {toKhmerNumber(totalSessions)} <span className="text-xs font-medium text-slate-500">ម៉ោង</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">អត្រាវត្តមាន</p>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xl font-black text-emerald-600 mt-1">
              {toKhmerNumber(weeklyAttendanceRate)}%
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">វត្តមានពេញ</p>
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-xl font-black text-blue-600 mt-1">
              {toKhmerNumber(presentCount)} <span className="text-xs font-medium text-slate-500">ម៉ោង</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">មកយឺត</p>
              <div className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <p className="text-xl font-black text-amber-600 mt-1">
              {toKhmerNumber(lateCount)} <span className="text-xs font-medium text-slate-500">ម៉ោង</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-sky-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">មានច្បាប់</p>
              <div className="w-2 h-2 rounded-full bg-sky-500" />
            </div>
            <p className="text-xl font-black text-sky-600 mt-1">
              {toKhmerNumber(permCount)} <span className="text-xs font-medium text-slate-500">ម៉ោង</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">អវត្តមាន</p>
              <div className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <p className="text-xl font-black text-rose-600 mt-1">
              {toKhmerNumber(absentCount)} <span className="text-xs font-medium text-slate-500">ម៉ោង</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            id="input-search-teacher-weekly"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះគ្រូ, កូដ..."
            className="w-full pl-9 pr-4 py-2.5 bg-white text-xs font-semibold rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            id="select-filter-subject-weekly"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
          >
            <option value="all">គ្រប់មុខវិជ្ជាទាំងអស់</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameKh}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0F172A] text-white font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-4 min-w-[200px] sticky left-0 bg-[#0F172A] z-10">
                  ឈ្មោះលោកគ្រូ-អ្នកគ្រូ
                </th>
                {weekDays.map((d) => (
                  <th
                    key={d.date}
                    className={`py-4 px-3 text-center min-w-[120px] ${
                      d.isToday ? 'bg-blue-900/60 text-blue-300 border-b-2 border-blue-400' : ''
                    }`}
                  >
                    <div>{d.dayName}</div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {formatShortKhmerDate(d.date)}
                    </div>
                  </th>
                ))}
                <th className="py-4 px-3 text-center min-w-[100px]">សរុបសប្តាហ៍</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((teacher, tIdx) => {
                const teacherWeekRecords = weekRecords.filter(
                  (r) => r.teacherId === teacher.id
                );
                const teacherSessionsCount = teacherWeekRecords.length;
                const teacherPresent = teacherWeekRecords.filter(
                  (r) => r.status === 'present' || r.status === 'late'
                ).length;
                const teacherRate =
                  teacherSessionsCount > 0
                    ? Math.round((teacherPresent / teacherSessionsCount) * 100)
                    : 0;

                return (
                  <tr
                    key={teacher.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      tIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Teacher Name Column */}
                    <td className="py-3 px-4 font-medium text-slate-900 sticky left-0 bg-inherit z-10 border-r border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-slate-800">
                          {teacher.gender === 'ស្រី' ? 'អ' : 'ល'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs font-khmer">
                            {teacher.nameKh}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {teacher.code} • {teacher.phone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Day Columns */}
                    {weekDays.map((d) => {
                      const dayRecords = teacherWeekRecords.filter(
                        (r) => r.date === d.date
                      );
                      const hasRecords = dayRecords.length > 0;
                      const hasAbsent = dayRecords.some(
                        (r) => r.status === 'absent'
                      );
                      const hasLate = dayRecords.some(
                        (r) => r.status === 'late'
                      );
                      const hasPerm = dayRecords.some(
                        (r) => r.status === 'permission'
                      );
                      const allPresent =
                        hasRecords &&
                        dayRecords.every((r) => r.status === 'present');

                      return (
                        <td
                          key={d.date}
                          className={`py-3 px-2 text-center border-r border-slate-100 ${
                            d.isToday ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          {hasRecords ? (
                            <button
                              onClick={() =>
                                setDetailModalData({
                                  teacher,
                                  date: d.date,
                                  dayName: d.dayName,
                                  records: dayRecords,
                                })
                              }
                              className="w-full py-1.5 px-2 rounded-xl transition-all hover:ring-1 hover:ring-blue-300 cursor-pointer text-center group"
                            >
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                {allPresent && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {toKhmerNumber(dayRecords.length)} ម៉ោង
                                  </span>
                                )}
                                {hasLate && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> យឺត
                                  </span>
                                )}
                                {hasPerm && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> ច្បាប់
                                  </span>
                                )}
                                {hasAbsent && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> ឥតច្បាប់
                                  </span>
                                )}
                              </div>
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs font-mono">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Column */}
                    <td className="py-3 px-3 text-center font-semibold">
                      {teacherSessionsCount > 0 ? (
                        <div>
                          <span
                            className={`inline-block font-black text-xs ${
                              teacherRate >= 90
                                ? 'text-emerald-600'
                                : teacherRate >= 75
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {toKhmerNumber(teacherRate)}%
                          </span>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {toKhmerNumber(teacherSessionsCount)} ម៉ោង
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Day Modal */}
      {detailModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-blue-400 flex items-center justify-center font-bold font-mono">
                  {detailModalData.teacher.code}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-khmer">
                    {detailModalData.teacher.nameKh}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatKhmerDate(detailModalData.date)} ({detailModalData.dayName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalData(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ម៉ោងបង្រៀនលម្អិត ({toKhmerNumber(detailModalData.records.length)} ម៉ោង)
              </h4>
              <div className="space-y-2">
                {detailModalData.records.map((rec) => {
                  const cls = classes.find((c) => c.id === rec.gradeId)?.name || 'មិនស្គាល់';
                  const subj = subjects.find((s) => s.id === rec.subjectId)?.nameKh || 'មិនស្គាល់';
                  const meta = STATUS_META[rec.status];

                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 font-khmer">
                          {rec.sessionPeriod}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                        <span>ថ្នាក់៖ <b>{cls}</b></span>
                        <span>•</span>
                        <span>មុខវិជ្ជា៖ <b>{subj}</b></span>
                      </div>
                      {rec.lessonTopic && (
                        <p className="text-slate-700 text-[11px] mt-0.5">
                          📖 <b>មេរៀន៖</b> {rec.lessonTopic}
                        </p>
                      )}
                      {rec.reason && (
                        <p className="text-rose-600 text-[11px] font-semibold">
                          ⚠️ <b>មូលហេតុ៖</b> {rec.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDetailModalData(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                បិទ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
