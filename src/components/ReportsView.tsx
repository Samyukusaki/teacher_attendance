import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  KHMER_MONTHS,
  toKhmerNumber,
  formatKhmerDate,
  getTodayString,
  getWeekRangeKhmer,
  STATUS_META,
} from '../utils/khmerDate';
import {
  Printer,
  Download,
  Send,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  FileText,
  XCircle,
  BarChart3,
  Layers,
} from 'lucide-react';
import { sendTelegramMessage } from '../services/telegramService';

export const ReportsView: React.FC = () => {
  const { schoolInfo, teachers, subjects, attendanceRecords, telegramConfig, showToast } = useApp();

  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'annual'>('weekly');
  const [weeklyViewMode, setWeeklyViewMode] = useState<'summary' | 'daily_matrix'>('summary');

  // Weekly selector state
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(getTodayString());
  
  // Monthly & Annual state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  // Compute week range
  const weekRangeInfo = getWeekRangeKhmer(new Date(selectedWeekDate || getTodayString()));

  // Handlers for weekly navigation
  const handlePrevWeek = () => {
    const d = new Date(selectedWeekDate || getTodayString());
    d.setDate(d.getDate() - 7);
    setSelectedWeekDate(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedWeekDate || getTodayString());
    d.setDate(d.getDate() + 7);
    setSelectedWeekDate(d.toISOString().split('T')[0]);
  };

  const handleCurrentWeek = () => {
    setSelectedWeekDate(getTodayString());
  };

  // Filter records based on report type
  const reportRecords = attendanceRecords.filter((r) => {
    if (reportType === 'weekly') {
      return r.date >= weekRangeInfo.startDateStr && r.date <= weekRangeInfo.endDateStr;
    } else if (reportType === 'monthly') {
      return r.month === selectedMonth && r.year === selectedYear;
    } else {
      return r.year === selectedYear;
    }
  });

  // Calculate teacher summary for the report
  const teacherReportData = teachers
    .filter((t) => t.status === 'active')
    .map((t, idx) => {
      const records = reportRecords.filter((r) => r.teacherId === t.id);
      const totalSessions = records.length;
      const present = records.filter((r) => r.status === 'present').length;
      const late = records.filter((r) => r.status === 'late').length;
      const permission = records.filter((r) => r.status === 'permission').length;
      const absent = records.filter((r) => r.status === 'absent').length;
      const mission = records.filter((r) => r.status === 'mission').length;
      const substitute = records.filter((r) => r.status === 'substitute').length;

      const rate =
        totalSessions > 0
          ? Math.round(((present + late + mission) / totalSessions) * 100)
          : 0;

      const mainSubj = subjects.find((s) => s.id === t.subjectIds[0])?.nameKh || 'ទូទៅ';

      // Daily breakdown for weekly report
      const dailyBreakdown = weekRangeInfo.days.map((day) => {
        const dayRecords = records.filter((r) => r.date === day.date);
        const dPresent = dayRecords.filter((r) => r.status === 'present').length;
        const dLate = dayRecords.filter((r) => r.status === 'late').length;
        const dPermission = dayRecords.filter((r) => r.status === 'permission').length;
        const dAbsent = dayRecords.filter((r) => r.status === 'absent').length;
        const dMission = dayRecords.filter((r) => r.status === 'mission').length;
        const dTotal = dayRecords.length;

        return {
          date: day.date,
          dayName: day.dayName,
          total: dTotal,
          present: dPresent,
          late: dLate,
          permission: dPermission,
          absent: dAbsent,
          mission: dMission,
        };
      });

      return {
        index: idx + 1,
        teacher: t,
        mainSubj,
        totalSessions,
        present,
        late,
        permission,
        absent,
        mission,
        substitute,
        rate,
        dailyBreakdown,
      };
    });

  // Totals
  const sumTotalSessions = teacherReportData.reduce((acc, curr) => acc + curr.totalSessions, 0);
  const sumPresent = teacherReportData.reduce((acc, curr) => acc + curr.present, 0);
  const sumLate = teacherReportData.reduce((acc, curr) => acc + curr.late, 0);
  const sumPermission = teacherReportData.reduce((acc, curr) => acc + curr.permission, 0);
  const sumAbsent = teacherReportData.reduce((acc, curr) => acc + curr.absent, 0);
  const sumMission = teacherReportData.reduce((acc, curr) => acc + curr.mission, 0);
  const averageRate =
    teacherReportData.length > 0
      ? Math.round(
          teacherReportData.reduce((acc, curr) => acc + curr.rate, 0) / teacherReportData.length
        )
      : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    
    if (reportType === 'weekly' && weeklyViewMode === 'daily_matrix') {
      csvContent += `របាយការណ៍វត្តមានប្រចាំសប្តាហ៍ (${weekRangeInfo.formattedRangeKh})\n`;
      csvContent += 'ល.រ,ឈ្មោះគ្រូបង្រៀន,កូដ,ភេទ,មុខវិជ្ជា,';
      weekRangeInfo.days.forEach((d) => {
        csvContent += `${d.dayName} (${d.date}),`;
      });
      csvContent += 'ម៉ោងសរុប,វត្តមាន,មកយឺត,មានច្បាប់,ឥតច្បាប់,បេសកកម្ម,អត្រា(%)\n';

      teacherReportData.forEach((row) => {
        csvContent += `${row.index},"${row.teacher.nameKh}",${row.teacher.code},${row.teacher.gender},"${row.mainSubj}",`;
        row.dailyBreakdown.forEach((dayData) => {
          if (dayData.total === 0) {
            csvContent += '"-",';
          } else {
            csvContent += `"${dayData.present}P/${dayData.late}L/${dayData.permission}Perm/${dayData.absent}Abs",`;
          }
        });
        csvContent += `${row.totalSessions},${row.present},${row.late},${row.permission},${row.absent},${row.mission},${row.rate}%\n`;
      });
    } else {
      const typeLabel =
        reportType === 'weekly'
          ? `ប្រចាំសប្តាហ៍_${weekRangeInfo.startDateStr}_ដល់_${weekRangeInfo.endDateStr}`
          : reportType === 'monthly'
          ? `ប្រចាំខែ${selectedMonth}_${selectedYear}`
          : `ប្រចាំឆ្នាំ_${selectedYear}`;

      csvContent += `របាយការណ៍វត្តមានគ្រូបង្រៀន (${typeLabel})\n`;
      csvContent += 'ល.រ,ឈ្មោះគ្រូបង្រៀន,កូដ,ភេទ,មុខវិជ្ជា,ម៉ោងបង្រៀនសរុប,វត្តមានពេញ,មកយឺត,មានច្បាប់,អវត្តមានឥតច្បាប់,បេសកកម្ម,អត្រាវត្តមាន(%)\n';

      teacherReportData.forEach((row) => {
        csvContent += `${row.index},"${row.teacher.nameKh}",${row.teacher.code},${row.teacher.gender},"${row.mainSubj}",${row.totalSessions},${row.present},${row.late},${row.permission},${row.absent},${row.mission},${row.rate}%\n`;
      });
    }

    const fileName =
      reportType === 'weekly'
        ? `របាយការណ៍វត្តមាន_សប្តាហ៍_${weekRangeInfo.startDateStr}_ដល់_${weekRangeInfo.endDateStr}.csv`
        : reportType === 'monthly'
        ? `របាយការណ៍វត្តមាន_ខែ${selectedMonth}_${selectedYear}.csv`
        : `របាយការណ៍វត្តមាន_ប្រចាំឆ្នាំ_${selectedYear}.csv`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'ទាញយកជោគជ័យ', 'បានទាញយកឯកសារ CSV របាយការណ៍រួចរាល់');
  };

  const handleSendTelegramReport = async () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      showToast('error', 'ខ្វះការកំណត់', 'សូមចូលទៅផ្ទាំង Admin ដើម្បីកំណត់ Telegram Bot Token និង Chat ID ជាមុនសិន');
      return;
    }

    setIsSendingTelegram(true);
    const title =
      reportType === 'weekly'
        ? `របាយការណ៍វត្តមានប្រចាំសប្តាហ៍`
        : reportType === 'monthly'
        ? `របាយការណ៍វត្តមានប្រចាំខែ ${KHMER_MONTHS[selectedMonth - 1]}`
        : `របាយការណ៍បូកសរុបវត្តមានប្រចាំឆ្នាំ ${toKhmerNumber(selectedYear)}`;

    let msg = `<b>🏫 ${schoolInfo.nameKh}</b>\n`;
    msg += `<b>📑 ${title}</b>\n`;
    if (reportType === 'weekly') {
      msg += `🗓️ <b>កាលបរិច្ឆេទ៖</b> ${weekRangeInfo.formattedRangeKh}\n`;
    } else if (reportType === 'monthly') {
      msg += `🗓️ <b>ខែ/ឆ្នាំ៖</b> ខែ${KHMER_MONTHS[selectedMonth - 1]} ឆ្នាំ${toKhmerNumber(selectedYear)}\n`;
    } else {
      msg += `🗓️ <b>ឆ្នាំសិក្សា៖</b> ${schoolInfo.academicYear}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👨‍🏫 <b>ចំនួនគ្រូបង្រៀន៖</b> ${toKhmerNumber(teacherReportData.length)} នាក់\n`;
    msg += `⏱️ <b>ម៉ោងបង្រៀនសរុប៖</b> ${toKhmerNumber(sumTotalSessions)} ម៉ោង\n`;
    msg += `📈 <b>អត្រាវត្តមានជាមធ្យម៖</b> <b>${toKhmerNumber(averageRate)}%</b>\n\n`;
    msg += `<b>📊 សរុបស្ថិតិទូទៅ៖</b>\n`;
    msg += `  ✅ វត្តមាន៖ <b>${toKhmerNumber(sumPresent)}</b> ម៉ោង\n`;
    msg += `  ⏳ មកយឺត៖ <b>${toKhmerNumber(sumLate)}</b> ម៉ោង\n`;
    msg += `  📝 មានច្បាប់៖ <b>${toKhmerNumber(sumPermission)}</b> ម៉ោង\n`;
    msg += `  ❌ ឥតច្បាប់ (អវត្តមាន)៖ <b>${toKhmerNumber(sumAbsent)}</b> ម៉ោង\n`;
    msg += `  💼 បេសកកម្ម៖ <b>${toKhmerNumber(sumMission)}</b> ម៉ោង\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `<i>នាយកសាលា៖ ${schoolInfo.principalName || 'គណៈគ្រប់គ្រង'}</i>\n`;
    msg += `<i>ប្រព័ន្ធគ្រប់គ្រងវត្តមានគ្រូបង្រៀន ផ្លូវការ</i>`;

    const res = await sendTelegramMessage(telegramConfig.botToken, telegramConfig.chatId, msg);
    setIsSendingTelegram(false);

    if (res.success) {
      showToast('success', 'បានផ្ញើទៅ Telegram!', 'របាយការណ៍ផ្លូវការត្រូវបានបញ្ជូនទៅកាន់ Telegram របស់អ្នកគ្រប់គ្រងរួចរាល់ 📲');
    } else {
      showToast('error', 'បរាជ័យ', res.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Control Bar (Hidden when printing) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                Official Report
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-khmer">
                ប្រព័ន្ធបង្កើត និងបោះពុម្ពរបាយការណ៍ផ្លូវការ
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-khmer">
              ទម្រង់ស្តង់ដារក្រសួងអប់រំ យុវជន និងកីឡា សម្រាប់បោះពុម្ព តាមដានសប្តាហ៍ ខែ និងប្រចាំឆ្នាំ
            </p>
          </div>

          {/* Type Switcher & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary Report Type Switcher: Weekly, Monthly, Annual */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                id="btn-report-weekly-type"
                onClick={() => setReportType('weekly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  reportType === 'weekly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>របាយការណ៍ប្រចាំសប្តាហ៍</span>
              </button>
              <button
                id="btn-report-monthly-type"
                onClick={() => setReportType('monthly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reportType === 'monthly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                របាយការណ៍ប្រចាំខែ
              </button>
              <button
                id="btn-report-annual-type"
                onClick={() => setReportType('annual')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reportType === 'annual'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                របាយការណ៍ប្រចាំឆ្នាំ
              </button>
            </div>

            {/* Monthly Filters */}
            {reportType === 'monthly' && (
              <select
                id="select-report-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs font-khmer"
              >
                {KHMER_MONTHS.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    ខែ{m}
                  </option>
                ))}
              </select>
            )}

            {/* Monthly / Annual Year Selector */}
            {(reportType === 'monthly' || reportType === 'annual') && (
              <select
                id="select-report-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs font-khmer"
              >
                <option value={2026}>ឆ្នាំ ២០២៦</option>
                <option value={2025}>ឆ្នាំ ២០២៥</option>
                <option value={2024}>ឆ្នាំ ២០២៤</option>
              </select>
            )}
          </div>
        </div>

        {/* Weekly Navigation & View Mode Sub-Bar */}
        {reportType === 'weekly' && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
            {/* Week Navigation Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                <button
                  id="btn-report-prev-week"
                  onClick={handlePrevWeek}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="សប្តាហ៍មុន"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="btn-report-current-week"
                  onClick={handleCurrentWeek}
                  className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-blue-600 font-khmer transition-colors cursor-pointer"
                >
                  សប្តាហ៍នេះ
                </button>
                <button
                  id="btn-report-next-week"
                  onClick={handleNextWeek}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="សប្តាហ៍បន្ទាប់"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Date Input for Quick Jump to Week */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs text-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <input
                  id="input-report-week-date"
                  type="date"
                  value={selectedWeekDate}
                  onChange={(e) => setSelectedWeekDate(e.target.value)}
                  className="text-xs font-semibold text-slate-800 outline-hidden bg-transparent cursor-pointer font-sans"
                />
              </div>

              {/* Selected Week Range Badge */}
              <div className="text-xs font-bold text-blue-900 bg-blue-100/70 border border-blue-200 px-3 py-1.5 rounded-xl font-khmer flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>{weekRangeInfo.formattedRangeKh}</span>
              </div>
            </div>

            {/* Weekly Table View Toggle (Summary vs Daily Breakdown) */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                id="btn-viewmode-summary"
                onClick={() => setWeeklyViewMode('summary')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 font-khmer ${
                  weeklyViewMode === 'summary'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                <span>តារាងសង្ខេប</span>
              </button>
              <button
                id="btn-viewmode-matrix"
                onClick={() => setWeeklyViewMode('daily_matrix')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 font-khmer ${
                  weeklyViewMode === 'daily_matrix'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>លម្អិតតាមថ្ងៃ (ច័ន្ទ-សៅរ៍)</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 mt-4 pt-4 border-t border-slate-100">
          <button
            id="btn-send-telegram-report"
            onClick={handleSendTelegramReport}
            disabled={isSendingTelegram}
            className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 font-khmer"
          >
            <Send className="w-3.5 h-3.5 text-blue-400" />
            <span>{isSendingTelegram ? 'កំពុងផ្ញើ...' : 'ផ្ញើរបាយការណ៍ទៅ Telegram'}</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer font-khmer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ទាញយក Excel / CSV</span>
          </button>

          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer font-khmer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>បោះពុម្ពរបាយការណ៍ (Print / PDF)</span>
          </button>
        </div>
      </div>

      {/* Official Printable Report Document Area */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/90 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Ministry & Kingdom Official Header */}
        <div className="flex justify-between items-start mb-6">
          {/* Left School Hierarchy */}
          <div className="text-left font-khmer text-xs sm:text-sm text-slate-800 space-y-1">
            <p className="font-semibold">{schoolInfo.ministryKh || 'ក្រសួងអប់រំ យុវជន និងកីឡា'}</p>
            <p className="font-semibold">{schoolInfo.departmentKh || 'មន្ទីរអប់រំ យុវជន និងកីឡា'}</p>
            <p className="font-semibold">{schoolInfo.districtOfficeKh || 'ការិយាល័យអប់រំ យុវជន និងកីឡា'}</p>
            <p className="font-bold text-slate-900 font-moul text-sm sm:text-base pt-1">
              {schoolInfo.nameKh}
            </p>
          </div>

          {/* Right Kingdom Motto */}
          <div className="text-center font-khmer text-xs sm:text-sm text-slate-800 space-y-1">
            <p className="font-moul text-sm sm:text-base font-bold">ព្រះរាជាណាចក្រកម្ពុជា</p>
            <p className="font-moul text-xs sm:text-sm font-semibold">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
            <div className="flex justify-center items-center py-1">
              <span className="w-16 h-0.5 bg-slate-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center my-6">
          <h1 className="font-moul text-base sm:text-lg text-slate-900 leading-relaxed">
            {reportType === 'weekly'
              ? `តារាងតាមដាន និងបូកសរុបវត្តមានគ្រូបង្រៀន ប្រចាំសប្តាហ៍`
              : reportType === 'monthly'
              ? `តារាងតាមដាន និងបូកសរុបវត្តមានគ្រូបង្រៀន ប្រចាំខែ ${KHMER_MONTHS[selectedMonth - 1]} ឆ្នាំ ${toKhmerNumber(selectedYear)}`
              : `តារាងបូកសរុបវត្តមានគ្រូបង្រៀនប្រចាំឆ្នាំសិក្សា ${schoolInfo.academicYear}`}
          </h1>
          <p className="text-xs font-khmer text-slate-600 mt-1">
            {reportType === 'weekly'
              ? `(${weekRangeInfo.formattedRangeKh})`
              : `(គិតចាប់ពីថ្ងៃទី ០១ ដល់ដំណាច់${
                  reportType === 'monthly'
                    ? `ខែ ${KHMER_MONTHS[selectedMonth - 1]}`
                    : `ឆ្នាំ ${toKhmerNumber(selectedYear)}`
                })`}
          </p>
        </div>

        {/* Quick Report Metric Cards (Summary Pills for quick scan) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 no-print">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] font-bold text-slate-500 font-khmer">គ្រូបង្រៀនសរុប</div>
            <div className="text-xl font-black text-slate-900 mt-1 font-mono">
              {toKhmerNumber(teacherReportData.length)} <span className="text-xs font-normal font-khmer text-slate-500">នាក់</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
            <div className="text-[11px] font-bold text-emerald-700 font-khmer">វត្តមានសរុប</div>
            <div className="text-xl font-black text-emerald-800 mt-1 font-mono">
              {toKhmerNumber(sumPresent)} <span className="text-xs font-normal font-khmer text-emerald-600">ម៉ោង</span>
            </div>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3">
            <div className="text-[11px] font-bold text-rose-700 font-khmer">អវត្តមាន (ឥតច្បាប់/ច្បាប់)</div>
            <div className="text-xl font-black text-rose-800 mt-1 font-mono">
              {toKhmerNumber(sumAbsent + sumPermission)} <span className="text-xs font-normal font-khmer text-rose-600">ម៉ោង</span>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
            <div className="text-[11px] font-bold text-blue-700 font-khmer">អត្រាវត្តមានមធ្យម</div>
            <div className="text-xl font-black text-blue-800 mt-1 font-mono">
              {toKhmerNumber(averageRate)}%
            </div>
          </div>
        </div>

        {/* MODE 1: Standard Summary Table */}
        {(reportType !== 'weekly' || weeklyViewMode === 'summary') && (
          <div className="overflow-x-auto my-6">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 text-center font-khmer">
                  <th className="py-2.5 px-2 border border-slate-300 w-10">ល.រ</th>
                  <th className="py-2.5 px-3 border border-slate-300 min-w-[150px] text-left">
                    គោត្តនាម និងនាម
                  </th>
                  <th className="py-2.5 px-2 border border-slate-300 w-14">ភេទ</th>
                  <th className="py-2.5 px-2 border border-slate-300 w-24">កូដគ្រូ</th>
                  <th className="py-2.5 px-3 border border-slate-300 min-w-[110px] text-left">
                    មុខវិជ្ជាឯកទេស
                  </th>
                  <th className="py-2.5 px-2 border border-slate-300">ម៉ោងសរុប</th>
                  <th className="py-2.5 px-2 border border-slate-300 text-emerald-800">វត្តមាន</th>
                  <th className="py-2.5 px-2 border border-slate-300 text-amber-800">មកយឺត</th>
                  <th className="py-2.5 px-2 border border-slate-300 text-blue-800">មានច្បាប់</th>
                  <th className="py-2.5 px-2 border border-slate-300 text-rose-800">ឥតច្បាប់</th>
                  <th className="py-2.5 px-2 border border-slate-300 text-purple-800">បេសកកម្ម</th>
                  <th className="py-2.5 px-2 border border-slate-300">អត្រា (%)</th>
                  <th className="py-2.5 px-3 border border-slate-300 min-w-[90px]">សម្គាល់</th>
                </tr>
              </thead>
              <tbody>
                {teacherReportData.map((row) => (
                  <tr key={row.teacher.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-2 px-2 border border-slate-200 text-center font-semibold">
                      {toKhmerNumber(row.index)}
                    </td>
                    <td className="py-2 px-3 border border-slate-200 font-bold text-slate-900 font-khmer">
                      {row.teacher.nameKh}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-khmer">
                      {row.teacher.gender}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-mono text-[11px]">
                      {row.teacher.code}
                    </td>
                    <td className="py-2 px-3 border border-slate-200 font-medium font-khmer">
                      {row.mainSubj}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-bold">
                      {toKhmerNumber(row.totalSessions)}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-semibold text-emerald-700">
                      {toKhmerNumber(row.present)}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-semibold text-amber-700">
                      {toKhmerNumber(row.late)}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-semibold text-blue-700">
                      {toKhmerNumber(row.permission)}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-semibold text-rose-700">
                      {toKhmerNumber(row.absent)}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-semibold text-purple-700">
                      {toKhmerNumber(row.mission)}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-bold">
                      {toKhmerNumber(row.rate)}%
                    </td>
                    <td className="py-2 px-3 border border-slate-200 text-[11px] text-slate-500 font-khmer">
                      {row.rate >= 95 ? 'ល្អប្រសើរ' : row.rate >= 80 ? 'ធម្មតា' : row.totalSessions === 0 ? 'គ្មានម៉ោង' : 'ត្រូវតាមដាន'}
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 font-khmer">
                  <td colSpan={5} className="py-2.5 px-4 border border-slate-300 text-center text-slate-900">
                    សរុបរួមទូទាំងសាលា
                  </td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center text-slate-900">
                    {toKhmerNumber(sumTotalSessions)}
                  </td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center text-emerald-800">
                    {toKhmerNumber(sumPresent)}
                  </td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center text-amber-800">
                    {toKhmerNumber(sumLate)}
                  </td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center text-blue-800">
                    {toKhmerNumber(sumPermission)}
                  </td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center text-rose-800">
                    {toKhmerNumber(sumAbsent)}
                  </td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center text-purple-800">
                    {toKhmerNumber(sumMission)}
                  </td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center text-blue-900">
                    {toKhmerNumber(averageRate)}%
                  </td>
                  <td className="py-2.5 px-3 border border-slate-300 text-center">
                    -
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 2: Weekly Daily Matrix Breakdown Table (Monday to Saturday) */}
        {reportType === 'weekly' && weeklyViewMode === 'daily_matrix' && (
          <div className="overflow-x-auto my-6">
            <table className="w-full text-xs text-left border-collapse border border-slate-300 min-w-[950px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 text-center font-khmer">
                  <th className="py-2.5 px-2 border border-slate-300 w-9">ល.រ</th>
                  <th className="py-2.5 px-3 border border-slate-300 min-w-[140px] text-left">
                    ឈ្មោះគ្រូបង្រៀន
                  </th>
                  <th className="py-2.5 px-2 border border-slate-300 w-12">ភេទ</th>
                  <th className="py-2.5 px-2 border border-slate-300 w-20">កូដ</th>
                  {weekRangeInfo.days.map((d) => (
                    <th key={d.date} className="py-2.5 px-2 border border-slate-300 min-w-[85px] text-center">
                      <div className="font-bold text-slate-900">{d.dayName}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal">
                        {toKhmerNumber(d.dayNumber)}
                      </div>
                    </th>
                  ))}
                  <th className="py-2.5 px-2 border border-slate-300 w-16 text-center">សរុបម៉ោង</th>
                  <th className="py-2.5 px-2 border border-slate-300 w-16 text-center text-emerald-800">វត្តមាន</th>
                  <th className="py-2.5 px-2 border border-slate-300 w-16 text-center text-rose-800">អវត្តមាន</th>
                  <th className="py-2.5 px-2 border border-slate-300 w-16 text-center">អត្រា</th>
                </tr>
              </thead>
              <tbody>
                {teacherReportData.map((row) => (
                  <tr key={row.teacher.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-2 px-2 border border-slate-200 text-center font-semibold">
                      {toKhmerNumber(row.index)}
                    </td>
                    <td className="py-2 px-3 border border-slate-200 font-bold text-slate-900 font-khmer">
                      <div>{row.teacher.nameKh}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{row.mainSubj}</div>
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-khmer">
                      {row.teacher.gender}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-mono text-[11px]">
                      {row.teacher.code}
                    </td>

                    {/* Day-by-day cell badges */}
                    {row.dailyBreakdown.map((dayData) => {
                      if (dayData.total === 0) {
                        return (
                          <td key={dayData.date} className="py-2 px-1 border border-slate-200 text-center text-slate-300">
                            —
                          </td>
                        );
                      }

                      const hasAbs = dayData.absent > 0;
                      const hasPerm = dayData.permission > 0;
                      const hasLate = dayData.late > 0;
                      const hasMission = dayData.mission > 0;
                      const allPresent = dayData.present === dayData.total;

                      return (
                        <td key={dayData.date} className="py-1.5 px-1 border border-slate-200 text-center align-middle">
                          <div className="inline-flex flex-col items-center gap-0.5">
                            {allPresent ? (
                              <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-1.5 py-0.5 rounded font-mono">
                                {toKhmerNumber(dayData.present)}/{toKhmerNumber(dayData.total)}
                              </span>
                            ) : (
                              <div className="flex flex-wrap justify-center gap-0.5">
                                {dayData.present > 0 && (
                                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-1 rounded">
                                    {toKhmerNumber(dayData.present)}P
                                  </span>
                                )}
                                {dayData.late > 0 && (
                                  <span className="bg-amber-100 text-amber-800 font-bold text-[9px] px-1 rounded">
                                    {toKhmerNumber(dayData.late)}L
                                  </span>
                                )}
                                {dayData.permission > 0 && (
                                  <span className="bg-blue-100 text-blue-800 font-bold text-[9px] px-1 rounded">
                                    {toKhmerNumber(dayData.permission)}ច
                                  </span>
                                )}
                                {dayData.absent > 0 && (
                                  <span className="bg-rose-100 text-rose-800 font-bold text-[9px] px-1 rounded">
                                    {toKhmerNumber(dayData.absent)}អ
                                  </span>
                                )}
                                {dayData.mission > 0 && (
                                  <span className="bg-purple-100 text-purple-800 font-bold text-[9px] px-1 rounded">
                                    {toKhmerNumber(dayData.mission)}ប
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-2 px-2 border border-slate-200 text-center font-bold font-mono">
                      {toKhmerNumber(row.totalSessions)}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-semibold text-emerald-700 font-mono">
                      {toKhmerNumber(row.present)}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-semibold text-rose-700 font-mono">
                      {toKhmerNumber(row.absent + row.permission)}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 text-center font-bold font-mono">
                      {toKhmerNumber(row.rate)}%
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 font-khmer text-center">
                  <td colSpan={4} className="py-2.5 px-3 border border-slate-300 text-slate-900">
                    សរុបរួមទូទាំងសាលា
                  </td>
                  {weekRangeInfo.days.map((d) => {
                    const dayTotalSessions = teacherReportData.reduce(
                      (acc, t) => acc + (t.dailyBreakdown.find((db) => db.date === d.date)?.total || 0),
                      0
                    );
                    const dayTotalPresent = teacherReportData.reduce(
                      (acc, t) => acc + (t.dailyBreakdown.find((db) => db.date === d.date)?.present || 0),
                      0
                    );
                    return (
                      <td key={d.date} className="py-2 px-1 border border-slate-300 text-[10px] font-mono text-emerald-800">
                        {toKhmerNumber(dayTotalPresent)}/{toKhmerNumber(dayTotalSessions)}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-2 border border-slate-300 font-mono text-slate-900">
                    {toKhmerNumber(sumTotalSessions)}
                  </td>
                  <td className="py-2.5 px-2 border border-slate-300 font-mono text-emerald-800">
                    {toKhmerNumber(sumPresent)}
                  </td>
                  <td className="py-2.5 px-2 border border-slate-300 font-mono text-rose-800">
                    {toKhmerNumber(sumAbsent + sumPermission)}
                  </td>
                  <td className="py-2.5 px-2 border border-slate-300 font-mono text-blue-900">
                    {toKhmerNumber(averageRate)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Legend for Matrix Breakdown when in matrix mode */}
        {reportType === 'weekly' && weeklyViewMode === 'daily_matrix' && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-khmer text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-6">
            <span className="font-bold text-slate-800">កំណត់សម្គាល់៖</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> P: វត្តមានពេញ</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> L: មកយឺត</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> ច: មានច្បាប់</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> អ: ឥតច្បាប់</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> ប: បេសកកម្ម</span>
          </div>
        )}

        {/* Signatures & Approvals Section */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-6 font-khmer text-xs sm:text-sm text-slate-800 print-break-inside-avoid border-t border-slate-200">
          <div className="text-center space-y-1">
            <p className="font-semibold">បានឃើញ និងពិនិត្យត្រឹមត្រូវ</p>
            <p className="font-bold text-slate-900">ប្រធានផ្នែករដ្ឋបាល និងបុគ្គលិក</p>
            <div className="h-20" />
            <p className="font-semibold text-slate-600">(ហត្ថលេខា និងឈ្មោះ)</p>
          </div>

          <div className="text-center space-y-1">
            <p className="text-slate-600">
              {schoolInfo.address ? schoolInfo.address.split(' ')[0] : 'រាជធានីភ្នំពេញ'}, {formatKhmerDate(getTodayString())}
            </p>
            <p className="font-bold text-slate-900">នាយកសាលា</p>
            <div className="h-20 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 border border-dashed border-slate-300 px-3 py-1 rounded-md print:hidden">
                (កន្លែងបោះត្រា និងចុះហត្ថលេខា)
              </span>
            </div>
            <p className="font-bold font-khmer text-slate-900">
              {schoolInfo.principalName || 'លោកនាយកសាលា'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
