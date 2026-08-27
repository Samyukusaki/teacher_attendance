import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  KHMER_MONTHS,
  toKhmerNumber,
} from '../utils/khmerDate';
import {
  Award,
  Search,
  ArrowUpDown,
  AlertTriangle,
} from 'lucide-react';

export const MonthlySemesterView: React.FC = () => {
  const { teachers, subjects, attendanceRecords, schoolInfo } = useApp();

  const [viewMode, setViewMode] = useState<'monthly' | 'semester'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedSemester, setSelectedSemester] = useState<'semester1' | 'semester2'>('semester1');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rate' | 'sessions' | 'name'>('rate');

  // Filter records based on selected period
  const periodRecords = attendanceRecords.filter((r) => {
    if (viewMode === 'monthly') {
      return r.month === selectedMonth;
    } else {
      return r.semester === selectedSemester;
    }
  });

  // Calculate stats per teacher
  const teacherStats = teachers
    .filter((t) => t.status === 'active')
    .map((t) => {
      const records = periodRecords.filter((r) => r.teacherId === t.id);
      const totalSessions = records.length;
      const present = records.filter((r) => r.status === 'present').length;
      const late = records.filter((r) => r.status === 'late').length;
      const permission = records.filter((r) => r.status === 'permission').length;
      const absent = records.filter((r) => r.status === 'absent').length;
      const mission = records.filter((r) => r.status === 'mission').length;
      const substitute = records.filter((r) => r.status === 'substitute').length;

      const attendanceRate =
        totalSessions > 0
          ? Math.round(((present + late + mission) / totalSessions) * 100)
          : 0;

      const mainSubj = subjects.find((s) => s.id === t.subjectIds[0])?.nameKh || 'ទូទៅ';

      return {
        teacher: t,
        mainSubj,
        totalSessions,
        present,
        late,
        permission,
        absent,
        mission,
        substitute,
        attendanceRate,
      };
    });

  // Sort teachers
  const sortedTeachers = [...teacherStats].sort((a, b) => {
    if (sortBy === 'rate') return b.attendanceRate - a.attendanceRate;
    if (sortBy === 'sessions') return b.totalSessions - a.totalSessions;
    return a.teacher.nameKh.localeCompare(b.teacher.nameKh);
  });

  // Filter search
  const filteredTeachers = sortedTeachers.filter(
    (item) =>
      item.teacher.nameKh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.teacher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mainSubj.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Overall Totals
  const totalSessionsAll = periodRecords.length;
  const totalPresentAll = periodRecords.filter((r) => r.status === 'present').length;
  const totalLateAll = periodRecords.filter((r) => r.status === 'late').length;
  const totalPermAll = periodRecords.filter((r) => r.status === 'permission').length;
  const totalAbsentAll = periodRecords.filter((r) => r.status === 'absent').length;
  const totalMissionAll = periodRecords.filter((r) => r.status === 'mission').length;

  const overallRate =
    totalSessionsAll > 0
      ? Math.round(((totalPresentAll + totalLateAll + totalMissionAll) / totalSessionsAll) * 100)
      : 100;

  return (
    <div className="space-y-6 font-sans">
      {/* View Toggle & Selector Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                Analytics
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-khmer">
                ស្ថិតិវត្តមានគ្រូបង្រៀនប្រចាំខែ និងតាមឆមាស
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {viewMode === 'monthly'
                ? `ទិន្នន័យសម្រាប់ ខែ${KHMER_MONTHS[selectedMonth - 1]} ឆ្នាំ២០២៦`
                : `ទិន្នន័យសម្រាប់ ${selectedSemester === 'semester1' ? 'ឆមាសទី១' : 'ឆមាសទី២'} ឆ្នាំសិក្សា ${schoolInfo.academicYear}`}
            </p>
          </div>

          {/* Mode Switch Buttons & Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                id="btn-mode-monthly"
                onClick={() => setViewMode('monthly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'monthly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ប្រចាំខែ
              </button>
              <button
                id="btn-mode-semester"
                onClick={() => setViewMode('semester')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'semester'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                តាមឆមាស
              </button>
            </div>

            {viewMode === 'monthly' ? (
              <select
                id="select-month-picker"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                {KHMER_MONTHS.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    ខែ{m}
                  </option>
                ))}
              </select>
            ) : (
              <select
                id="select-semester-picker"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="semester1">ឆមាសទី ១ (តុលា - មីនា)</option>
                <option value="semester2">ឆមាសទី ២ (មេសា - កញ្ញា)</option>
              </select>
            )}
          </div>
        </div>

        {/* Aggregate KPI Cards - Geometric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ម៉ោងសរុប</p>
              <div className="w-2 h-2 rounded-full bg-slate-400" />
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">
              {toKhmerNumber(totalSessionsAll)} <span className="text-xs font-medium text-slate-500">ម៉ោង</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">អត្រាវត្តមានរួម</p>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xl font-black text-emerald-600 mt-1">
              {toKhmerNumber(overallRate)}%
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">វត្តមានពេញ</p>
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-xl font-black text-blue-600 mt-1">
              {toKhmerNumber(totalPresentAll)} <span className="text-xs font-medium text-slate-500">ម៉ោង</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">មកយឺត</p>
              <div className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <p className="text-xl font-black text-amber-600 mt-1">
              {toKhmerNumber(totalLateAll)} <span className="text-xs font-medium text-slate-500">ម៉ោង</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-sky-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">មានច្បាប់</p>
              <div className="w-2 h-2 rounded-full bg-sky-500" />
            </div>
            <p className="text-xl font-black text-sky-600 mt-1">
              {toKhmerNumber(totalPermAll)} <span className="text-xs font-medium text-slate-500">ម៉ោង</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">អវត្តមាន</p>
              <div className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <p className="text-xl font-black text-rose-600 mt-1">
              {toKhmerNumber(totalAbsentAll)} <span className="text-xs font-medium text-slate-500">ម៉ោង</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Sorting Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            id="input-search-monthly-teacher"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះ, មុខវិជ្ជា..."
            className="w-full pl-9 pr-4 py-2.5 bg-white text-xs font-semibold rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-500" />
          <select
            id="select-sort-attendance"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
          >
            <option value="rate">តម្រៀបតាម អត្រាវត្តមានខ្ពស់បំផុត</option>
            <option value="sessions">តម្រៀបតាម ម៉ោងបង្រៀនច្រើនបំផុត</option>
            <option value="name">តម្រៀបតាម ឈ្មោះគ្រូ</option>
          </select>
        </div>
      </div>

      {/* Teacher Detailed Ranking & Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0F172A] text-white font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-3 text-center w-12">ល.រ</th>
                <th className="py-4 px-4 min-w-[180px]">ឈ្មោះលោកគ្រូ-អ្នកគ្រូ</th>
                <th className="py-4 px-3 min-w-[120px]">មុខវិជ្ជាឯកទេស</th>
                <th className="py-4 px-3 text-center">ម៉ោងបង្រៀន</th>
                <th className="py-4 px-3 text-center text-emerald-400">វត្តមាន</th>
                <th className="py-4 px-3 text-center text-amber-400">មកយឺត</th>
                <th className="py-4 px-3 text-center text-sky-400">មានច្បាប់</th>
                <th className="py-4 px-3 text-center text-rose-400">ឥតច្បាប់</th>
                <th className="py-4 px-3 text-center text-purple-400">បេសកកម្ម</th>
                <th className="py-4 px-4 min-w-[160px]">អត្រាវត្តមាន (%)</th>
                <th className="py-4 px-3 text-center">ការវាយតម្លៃ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((item, idx) => {
                const isTopPunctual = idx < 3 && item.attendanceRate >= 95;

                return (
                  <tr
                    key={item.teacher.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-500 font-mono">
                      {isTopPunctual ? (
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 inline-flex items-center justify-center font-black text-xs border border-amber-300">
                          {toKhmerNumber(idx + 1)}
                        </span>
                      ) : (
                        toKhmerNumber(idx + 1)
                      )}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-slate-800">
                          {item.teacher.gender === 'ស្រី' ? 'អ' : 'ល'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 font-khmer">
                            {item.teacher.nameKh}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {item.teacher.code}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                      {item.mainSubj}
                    </td>

                    {/* Total Sessions */}
                    <td className="py-3.5 px-3 text-center font-black text-slate-900 font-mono">
                      {toKhmerNumber(item.totalSessions)}
                    </td>

                    {/* Present */}
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-600 font-mono">
                      {toKhmerNumber(item.present)}
                    </td>

                    {/* Late */}
                    <td className="py-3.5 px-3 text-center font-bold text-amber-600 font-mono">
                      {toKhmerNumber(item.late)}
                    </td>

                    {/* Permission */}
                    <td className="py-3.5 px-3 text-center font-bold text-sky-600 font-mono">
                      {toKhmerNumber(item.permission)}
                    </td>

                    {/* Absent */}
                    <td className="py-3.5 px-3 text-center font-bold text-rose-600 font-mono">
                      {toKhmerNumber(item.absent)}
                    </td>

                    {/* Mission */}
                    <td className="py-3.5 px-3 text-center font-bold text-purple-600 font-mono">
                      {toKhmerNumber(item.mission)}
                    </td>

                    {/* Attendance Rate Progress Bar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.attendanceRate >= 95
                                ? 'bg-emerald-500'
                                : item.attendanceRate >= 80
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${item.attendanceRate}%` }}
                          />
                        </div>
                        <span className="font-black text-slate-900 text-xs w-12 text-right font-mono">
                          {toKhmerNumber(item.attendanceRate)}%
                        </span>
                      </div>
                    </td>

                    {/* Assessment Tag */}
                    <td className="py-3.5 px-3 text-center">
                      {item.attendanceRate >= 95 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Award className="w-3 h-3 text-emerald-600" /> ល្អប្រសើរ
                        </span>
                      ) : item.attendanceRate >= 80 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          មធ្យម
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> តាមដាន
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
