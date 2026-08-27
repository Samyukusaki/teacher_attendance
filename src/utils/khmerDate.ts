import { DayOfWeek } from '../types';

// Khmer Calendar & Text Helpers

export const DAY_OF_WEEK_LIST: { key: DayOfWeek; nameKh: string; shortKh: string; dayIndex: number }[] = [
  { key: 'monday', nameKh: 'ថ្ងៃច័ន្ទ', shortKh: 'ច័ន្ទ', dayIndex: 1 },
  { key: 'tuesday', nameKh: 'ថ្ងៃអង្គារ', shortKh: 'អង្គារ', dayIndex: 2 },
  { key: 'wednesday', nameKh: 'ថ្ងៃពុធ', shortKh: 'ពុធ', dayIndex: 3 },
  { key: 'thursday', nameKh: 'ថ្ងៃព្រហស្បតិ៍', shortKh: 'ព្រហស្បតិ៍', dayIndex: 4 },
  { key: 'friday', nameKh: 'ថ្ងៃសុក្រ', shortKh: 'សុក្រ', dayIndex: 5 },
  { key: 'saturday', nameKh: 'ថ្ងៃសៅរ៍', shortKh: 'សៅរ៍', dayIndex: 6 },
];

export function getDayOfWeekKeyFromDate(dateStr: string): DayOfWeek {
  if (!dateStr) return 'monday';
  const d = new Date(dateStr);
  const day = d.getDay(); // 0 is Sun, 1 is Mon, ... 6 is Sat
  switch (day) {
    case 1: return 'monday';
    case 2: return 'tuesday';
    case 3: return 'wednesday';
    case 4: return 'thursday';
    case 5: return 'friday';
    case 6: return 'saturday';
    default: return 'monday';
  }
}

export const KHMER_DAYS = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
export const KHMER_DAYS_SHORT = ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'];

export const KHMER_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

export const KHMER_NUMBERS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

export function toKhmerNumber(num: number | string): string {
  return String(num).replace(/[0-9]/g, (digit) => KHMER_NUMBERS[parseInt(digit, 10)]);
}

export function formatKhmerDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const dayName = KHMER_DAYS[date.getDay()];
  const day = toKhmerNumber(date.getDate());
  const month = KHMER_MONTHS[date.getMonth()];
  const year = toKhmerNumber(date.getFullYear());
  
  return `ថ្ងៃ${dayName} ទី${day} ខែ${month} ឆ្នាំ${year}`;
}

export function formatShortKhmerDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const day = toKhmerNumber(date.getDate());
  const month = KHMER_MONTHS[date.getMonth()];
  return `ទី${day} ${month}`;
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekDays(targetDate: Date = new Date()): { date: string; dayName: string; dayNumber: number; isToday: boolean }[] {
  const current = new Date(targetDate);
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
  
  // Start week from Monday (1)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(current);
  monday.setDate(current.getDate() + mondayOffset);
  
  const days = [];
  const todayStr = getTodayString();
  
  for (let i = 0; i < 6; i++) { // Monday to Saturday
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    
    days.push({
      date: dateStr,
      dayName: KHMER_DAYS[d.getDay()],
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

export function getWeekRangeKhmer(targetDate: Date = new Date()): {
  startDateStr: string;
  endDateStr: string;
  formattedRangeKh: string;
  days: { date: string; dayName: string; dayNumber: number; isToday: boolean }[];
} {
  const days = getWeekDays(targetDate);
  const startDay = days[0];
  const endDay = days[days.length - 1];
  const startDate = new Date(startDay.date);
  const endDate = new Date(endDay.date);

  const startDayKh = toKhmerNumber(startDate.getDate());
  const endDayKh = toKhmerNumber(endDate.getDate());
  const startMonthKh = KHMER_MONTHS[startDate.getMonth()];
  const endMonthKh = KHMER_MONTHS[endDate.getMonth()];
  const yearKh = toKhmerNumber(endDate.getFullYear());

  let formattedRangeKh = '';
  if (startDate.getMonth() === endDate.getMonth()) {
    formattedRangeKh = `ចាប់ពីថ្ងៃទី ${startDayKh} ដល់ ${endDayKh} ខែ${endMonthKh} ឆ្នាំ${yearKh}`;
  } else {
    formattedRangeKh = `ចាប់ពីថ្ងៃទី ${startDayKh} ខែ${startMonthKh} ដល់ ${endDayKh} ខែ${endMonthKh} ឆ្នាំ${yearKh}`;
  }

  return {
    startDateStr: startDay.date,
    endDateStr: endDay.date,
    formattedRangeKh,
    days,
  };
}

export const PERIOD_SLOTS = [
  { id: 1, name: 'ម៉ោងទី១', time: '០៧:០០ - ០៧:៥០', shift: 'ព្រឹក' },
  { id: 2, name: 'ម៉ោងទី២', time: '០៧:៥០ - ០៨:៤០', shift: 'ព្រឹក' },
  { id: 3, name: 'ម៉ោងទី៣', time: '០៨:៥៥ - ០៩:៤៥', shift: 'ព្រឹក' },
  { id: 4, name: 'ម៉ោងទី៤', time: '០៩:៤៥ - ១០:៣៥', shift: 'ព្រឹក' },
  { id: 5, name: 'ម៉ោងទី៥', time: '១៣:៣០ - ១៤:២០', shift: 'រសៀល' },
  { id: 6, name: 'ម៉ោងទី៦', time: '១៤:២០ - ១៥:១០', shift: 'រសៀល' },
];

export const STATUS_META = {
  present: {
    labelKh: 'វត្តមាន',
    labelEn: 'Present',
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badge: 'bg-emerald-600 text-white',
    icon: 'CheckCircle2',
    color: '#059669',
  },
  late: {
    labelKh: 'មកយឺត',
    labelEn: 'Late',
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    badge: 'bg-amber-500 text-white',
    icon: 'Clock',
    color: '#d97706',
  },
  permission: {
    labelKh: 'មានច្បាប់',
    labelEn: 'Permission',
    bg: 'bg-blue-100 text-blue-800 border-blue-200',
    badge: 'bg-blue-600 text-white',
    icon: 'FileText',
    color: '#2563eb',
  },
  absent: {
    labelKh: 'ឥតច្បាប់',
    labelEn: 'Absent',
    bg: 'bg-rose-100 text-rose-800 border-rose-200',
    badge: 'bg-rose-600 text-white',
    icon: 'XCircle',
    color: '#e11d48',
  },
  mission: {
    labelKh: 'បេសកកម្ម',
    labelEn: 'Mission',
    bg: 'bg-purple-100 text-purple-800 border-purple-200',
    badge: 'bg-purple-600 text-white',
    icon: 'Briefcase',
    color: '#9333ea',
  },
  substitute: {
    labelKh: 'បង្រៀនជំនួស',
    labelEn: 'Substitute',
    bg: 'bg-orange-100 text-orange-800 border-orange-200',
    badge: 'bg-orange-600 text-white',
    icon: 'UserCheck',
    color: '#ea580c',
  },
};
