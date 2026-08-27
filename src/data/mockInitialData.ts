import { SchoolInfo, Teacher, GradeClass, Subject, AttendanceRecord, LeaveRequest, TelegramConfig, TimetableSlot, DayOfWeek } from '../types';
import { getTodayString } from '../utils/khmerDate';

export const initialSchoolInfo: SchoolInfo = {
  nameKh: 'វិទ្យាល័យ ប៊ុនរ៉ានី ហ៊ុនសែន ព្រៃពោន',
  nameEn: 'Bun Rany Hun Sen Prey Pon High School',
  ministryKh: 'ក្រសួងអប់រំ យុវជន និងកីឡា',
  departmentKh: 'មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តព្រៃវែង',
  districtOfficeKh: 'ការិយាល័យអប់រំ យុវជន និងកីឡា ស្រុកពារាំង',
  principalName: 'លោក ឡាយ វិចិត្រ',
  phone: '012 889 900 / 097 554 321',
  email: 'bunranypreypon.hs@moeys.gov.kh',
  address: 'ភូមិព្រៃពោន ឃុំព្រៃពោន ស្រុកពារាំង ខេត្តព្រៃវែង',
  academicYear: '២០២៥ - ២០២៦',
  currentSemester: 'semester1',
  logoUrl: '',
  geoFence: {
    enabled: true,
    latitude: 11.5367,
    longitude: 105.2154,
    radiusMeters: 500, // 500 meters
    requireLocation: true,
  },
};

export const initialSubjects: Subject[] = [
  { id: 'sub-1', nameKh: 'ភាសាខ្មែរ', nameEn: 'Khmer Literature', code: 'KHM', color: '#3b82f6', weeklyHours: 6 },
  { id: 'sub-2', nameKh: 'គណិតវិទ្យា', nameEn: 'Mathematics', code: 'MATH', color: '#10b981', weeklyHours: 6 },
  { id: 'sub-3', nameKh: 'រូបវិទ្យា', nameEn: 'Physics', code: 'PHYS', color: '#8b5cf6', weeklyHours: 4 },
  { id: 'sub-4', nameKh: 'គីមីវិទ្យា', nameEn: 'Chemistry', code: 'CHEM', color: '#ec4899', weeklyHours: 4 },
  { id: 'sub-5', nameKh: 'ជីវវិទ្យា', nameEn: 'Biology', code: 'BIO', color: '#14b8a6', weeklyHours: 4 },
  { id: 'sub-6', nameKh: 'ប្រវត្តិវិទ្យា', nameEn: 'History', code: 'HIST', color: '#f59e0b', weeklyHours: 2 },
  { id: 'sub-7', nameKh: 'ភាសាអង់គ្លេស', nameEn: 'English Language', code: 'ENG', color: '#06b6d4', weeklyHours: 4 },
  { id: 'sub-8', nameKh: 'ព័ត៌មានវិទ្យា (ICT)', nameEn: 'Computer Science', code: 'ICT', color: '#6366f1', weeklyHours: 2 },
];

export const initialClasses: GradeClass[] = [
  { id: 'cls-1', nameKh: 'ថ្នាក់ទី ៧A', room: 'បន្ទប់ A-101', shift: 'ព្រឹក', studentCount: 42, academicYear: '២០២៥ - ២០២៦' },
  { id: 'cls-2', nameKh: 'ថ្នាក់ទី ៨B', room: 'បន្ទប់ A-102', shift: 'ព្រឹក', studentCount: 40, academicYear: '២០២៥ - ២០២៦' },
  { id: 'cls-3', nameKh: 'ថ្នាក់ទី ៩A', room: 'បន្ទប់ B-201', shift: 'ព្រឹក', studentCount: 38, academicYear: '២០២៥ - ២០២៦' },
  { id: 'cls-4', nameKh: 'ថ្នាក់ទី ១០A', room: 'បន្ទប់ B-202', shift: 'រសៀល', studentCount: 45, academicYear: '២០២៥ - ២០២៦' },
  { id: 'cls-5', nameKh: 'ថ្នាក់ទី ១១A', room: 'បន្ទប់ C-301', shift: 'រសៀល', studentCount: 39, academicYear: '២០២៥ - ២០២៦' },
  { id: 'cls-6', nameKh: 'ថ្នាក់ទី ១២A', room: 'បន្ទប់ C-302', shift: 'ព្រឹក', studentCount: 36, academicYear: '២០២៥ - ២០២៦' },
];

export const initialTeachers: Teacher[] = [
  {
    id: 'tch-1',
    nameKh: 'លោកគ្រូ សុខ ចាន់ដារ៉ា',
    nameEn: 'Sok Chandara',
    code: 'TCH-001',
    gender: 'ប្រុស',
    phone: '012 345 678',
    email: 'chandara.sok@gmail.com',
    subjectIds: ['sub-2'], // គណិត
    gradeIds: ['cls-1', 'cls-4', 'cls-6'],
    status: 'active',
    isHomeroom: true,
    homeroomGrade: 'ថ្នាក់ទី ១២A',
    joinedDate: '2020-10-01',
  },
  {
    id: 'tch-2',
    nameKh: 'អ្នកគ្រូ ម៉ៅ ចិន្តា',
    nameEn: 'Mao Chinda',
    code: 'TCH-002',
    gender: 'ស្រី',
    phone: '098 765 432',
    email: 'chinda.mao@gmail.com',
    subjectIds: ['sub-1'], // ភាសាខ្មែរ
    gradeIds: ['cls-1', 'cls-2', 'cls-3'],
    status: 'active',
    isHomeroom: true,
    homeroomGrade: 'ថ្នាក់ទី ៧A',
    joinedDate: '2019-11-15',
  },
  {
    id: 'tch-3',
    nameKh: 'លោកគ្រូ ហេង វីរៈ',
    nameEn: 'Heng Virak',
    code: 'TCH-003',
    gender: 'ប្រុស',
    phone: '088 123 456',
    email: 'virak.heng@gmail.com',
    subjectIds: ['sub-3'], // រូបវិទ្យា
    gradeIds: ['cls-3', 'cls-5', 'cls-6'],
    status: 'active',
    isHomeroom: false,
    joinedDate: '2021-01-10',
  },
  {
    id: 'tch-4',
    nameKh: 'អ្នកគ្រូ កែវ មុនីរ័ត្ន',
    nameEn: 'Keo Munyroth',
    code: 'TCH-004',
    gender: 'ស្រី',
    phone: '077 998 877',
    email: 'munyroth.keo@gmail.com',
    subjectIds: ['sub-4'], // គីមីវិទ្យា
    gradeIds: ['cls-4', 'cls-5', 'cls-6'],
    status: 'active',
    isHomeroom: true,
    homeroomGrade: 'ថ្នាក់ទី ១០A',
    joinedDate: '2018-09-01',
  },
  {
    id: 'tch-5',
    nameKh: 'លោកគ្រូ អ៊ុំ សម្បត្តិ',
    nameEn: 'Oum Sambath',
    code: 'TCH-005',
    gender: 'ប្រុស',
    phone: '015 654 321',
    email: 'sambath.oum@gmail.com',
    subjectIds: ['sub-5'], // ជីវវិទ្យា
    gradeIds: ['cls-2', 'cls-3', 'cls-5'],
    status: 'active',
    isHomeroom: false,
    joinedDate: '2022-03-01',
  },
  {
    id: 'tch-6',
    nameKh: 'អ្នកគ្រូ ស៊ិន ស្រីពៅ',
    nameEn: 'Sin Sreypov',
    code: 'TCH-006',
    gender: 'ស្រី',
    phone: '011 223 344',
    email: 'sreypov.sin@gmail.com',
    subjectIds: ['sub-7'], // អង់គ្លេស
    gradeIds: ['cls-1', 'cls-2', 'cls-4', 'cls-6'],
    status: 'active',
    isHomeroom: false,
    joinedDate: '2021-08-15',
  },
  {
    id: 'tch-7',
    nameKh: 'លោកគ្រូ រ័ត្ន សុភក្ត្រ',
    nameEn: 'Rath Sopheak',
    code: 'TCH-007',
    gender: 'ប្រុស',
    phone: '096 445 566',
    email: 'sopheak.rath@gmail.com',
    subjectIds: ['sub-8'], // ICT
    gradeIds: ['cls-3', 'cls-4', 'cls-5'],
    status: 'active',
    isHomeroom: false,
    joinedDate: '2023-01-05',
  },
  {
    id: 'tch-8',
    nameKh: 'អ្នកគ្រូ ឈុន សុខនី',
    nameEn: 'Chhun Sokhny',
    code: 'TCH-008',
    gender: 'ស្រី',
    phone: '017 778 899',
    email: 'sokhny.chhun@gmail.com',
    subjectIds: ['sub-6'], // ប្រវត្តិវិទ្យា
    gradeIds: ['cls-1', 'cls-2', 'cls-3'],
    status: 'active',
    isHomeroom: false,
    joinedDate: '2020-02-14',
  },
];

export const initialTelegramConfig: TelegramConfig = {
  botToken: '',
  chatId: '',
  isEnabled: false,
  autoSendOnTeacherSubmit: true,
  autoSendDailySummary: true,
  autoSendAlertOnAbsence: true,
  dailySummaryTime: '17:00',
};

export const initialLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-1',
    teacherId: 'tch-3',
    startDate: '2026-08-25',
    endDate: '2026-08-26',
    leaveType: 'sick',
    reason: 'ឈឺគ្រុនក្តៅ ត្រូវទៅពិគ្រោះជាមួយវេជ្ជបណ្ឌិត',
    status: 'approved',
    requestedAt: '2026-08-22T08:00:00.000Z',
    approvedBy: 'នាយកសាលា',
    approvedAt: '2026-08-22T09:30:00.000Z',
    adminNote: 'បានអនុម័ត ជូនពរឆាប់ជាសះស្បើយ',
  },
  {
    id: 'leave-2',
    teacherId: 'tch-6',
    startDate: '2026-08-28',
    endDate: '2026-08-29',
    leaveType: 'personal',
    reason: 'មានធុរៈគ្រួសារបន្ទាន់នៅស្រុកកំណើត',
    status: 'pending',
    requestedAt: '2026-08-23T06:00:00.000Z',
  }
];

// Helper to generate rich realistic historical attendance records for the current date, past weeks and months
export function generateInitialAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12

  // Generate for past 20 working days
  for (let i = 0; i < 24; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0) continue; // Skip Sunday

    const dateStr = d.toISOString().split('T')[0];
    const recMonth = d.getMonth() + 1;
    const recYear = d.getFullYear();
    const semester = recMonth >= 10 || recMonth <= 3 ? 'semester1' : 'semester2';

    initialTeachers.forEach((teacher, tIdx) => {
      // Each teacher teaches 2-4 sessions per day
      const sessionCount = 2 + ((tIdx + i) % 3);
      for (let s = 1; s <= sessionCount; s++) {
        const periodIdx = (s + (tIdx % 3)) % 8 + 1;
        const gradeId = teacher.gradeIds[(s + i) % teacher.gradeIds.length] || 'cls-1';
        const subjectId = teacher.subjectIds[0] || 'sub-1';

        // Mostly present, occasional late, permission, absent
        let status: AttendanceRecord['status'] = 'present';
        let reason = '';
        const seed = (tIdx * 13 + i * 7 + s) % 100;

        if (seed === 97 || seed === 98) {
          status = 'late';
          reason = 'ស្ទះចរាចរណ៍លើដងផ្លូវ';
        } else if (seed === 95 || seed === 96) {
          status = 'permission';
          reason = 'មានធុរៈផ្ទាល់ខ្លួន (មានច្បាប់អនុញ្ញាត)';
        } else if (seed === 99) {
          status = 'absent';
          reason = 'អវត្តមានឥតច្បាប់';
        } else if (seed === 92) {
          status = 'mission';
          reason = 'ចូលរួមវគ្គបណ្តុះបណ្តាលគរុកោសល្យនៅក្រសួង';
        }

        const periodNames = [
          'ម៉ោងទី១ (០៧:០០ - ០៧:៥០)',
          'ម៉ោងទី២ (០៧:៥០ - ០៨:៤០)',
          'ម៉ោងទី៣ (០៨:៥៥ - ០៩:៤៥)',
          'ម៉ោងទី៤ (០៩:៤៥ - ១០:៣៥)',
          'ម៉ោងទី៥ (១៣:៣០ - ១៤:២០)',
          'ម៉ោងទី៦ (១៤:២០ - ១៥:១០)',
        ];

        const topics = [
          'មេរៀនទី១៖ សេចក្តីផ្តើម និងនិយមន័យគ្រឹះ',
          'លំហាត់អនុវត្តន៍ និងដោះស្រាយសមីការ',
          'ការពិភាក្សាជាក្រុម និងការធ្វើបទបង្ហាញ',
          'ការពិសោធន៍ក្នុងបន្ទប់ពិសោធន៍វិទ្យាសាស្ត្រ',
          'ការប្រឡងសាកល្បងពាក់កណ្តាលឆមាស',
          'ការកែលម្អកិច្ចការផ្ទះ និងពន្យល់ចំណុចលំបាក',
          'ការស្រាវជ្រាវ និងការងារគម្រោងសិស្ស',
        ];

        records.push({
          id: `att-${dateStr}-${teacher.id}-${s}`,
          teacherId: teacher.id,
          date: dateStr,
          sessionPeriod: periodNames[periodIdx - 1],
          sessionNumber: periodIdx,
          gradeId: gradeId,
          subjectId: subjectId,
          status: status,
          lessonTopic: topics[(tIdx + s + i) % topics.length],
          reason: reason || undefined,
          submittedAt: `${dateStr}T07:${30 + (s * 10)}:00.000Z`,
          submittedBy: 'teacher',
          isLocked: true, // Locked for teachers
          semester: semester,
          month: recMonth,
          year: recYear,
        });
      }
    });
  }

  return records;
}

// Generate realistic weekly teaching timetables for each teacher
export function generateInitialTimetables(): TimetableSlot[] {
  const slots: TimetableSlot[] = [];
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  initialTeachers.forEach((teacher, tIdx) => {
    const mainSubj = teacher.subjectIds[0] || 'sub-1';
    const assignedClasses = teacher.gradeIds.length > 0 ? teacher.gradeIds : ['cls-1', 'cls-2'];

    days.forEach((day, dIdx) => {
      // 2 to 4 periods per day per teacher
      const numPeriods = 2 + ((tIdx + dIdx) % 3);
      const basePeriod = (tIdx * 2 + dIdx) % 5 + 1; // 1 to 5

      for (let p = 0; p < numPeriods; p++) {
        let periodNum = ((basePeriod + p - 1) % 6) + 1;

        const classId = assignedClasses[(dIdx + p) % assignedClasses.length];
        const clsObj = initialClasses.find(c => c.id === classId);

        slots.push({
          id: `tt-${teacher.id}-${day}-${periodNum}`,
          teacherId: teacher.id,
          dayOfWeek: day,
          periodNumber: periodNum,
          gradeId: classId,
          subjectId: mainSubj,
          room: clsObj?.room || 'បន្ទប់សិក្សា',
          notes: 'កាលវិភាគធម្មតា',
        });
      }
    });
  });

  return slots;
}

export const initialTimetables: TimetableSlot[] = generateInitialTimetables();

