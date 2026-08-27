export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface TimetableSlot {
  id: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number; // 1 to 6 (PERIOD_SLOTS: 4 morning + 2 afternoon)
  gradeId: string;
  subjectId: string;
  room?: string;
  notes?: string;
}

export type AttendanceStatus = 
  | 'present'     // វត្តមាន
  | 'late'        // មកយឺត
  | 'permission'  // មានច្បាប់
  | 'absent'      // ឥតច្បាប់
  | 'mission'     // បេសកកម្ម
  | 'substitute'; // បង្រៀនជំនួស

export type LeaveType = 
  | 'personal'    // ការងារផ្ទាល់ខ្លួន
  | 'sick'        // សម្រាកព្យាបាលជំងឺ
  | 'mission'     // បេសកកម្មផ្លូវការ
  | 'maternity';  // លំហែមាតុភាព

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type Role = 'teacher' | 'admin';

export interface Teacher {
  id: string;
  nameKh: string;
  nameEn: string;
  code: string;
  gender: 'ប្រុស' | 'ស្រី';
  phone: string;
  email: string;
  subjectIds: string[];
  gradeIds: string[];
  avatar?: string;
  isHomeroom?: boolean;
  homeroomGrade?: string;
  status: 'active' | 'inactive';
  joinedDate?: string;
}

export interface Subject {
  id: string;
  nameKh: string;
  nameEn: string;
  code: string;
  color: string;
  weeklyHours: number;
}

export interface GradeClass {
  id: string;
  nameKh: string;
  room: string;
  shift: 'ព្រឹក' | 'រសៀល' | 'ពេញមួយថ្ងៃ';
  studentCount: number;
  academicYear: string;
}

export interface AttendanceRecord {
  id: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  sessionPeriod: string; // e.g. "ម៉ោងទី១ (០៧:០០ - ០៧:៥០)"
  sessionNumber: number; // 1 to 8
  gradeId: string;
  subjectId: string;
  status: AttendanceStatus;
  lessonTopic: string;
  reason?: string;
  substituteTeacherId?: string;
  submittedAt: string; // ISO string
  submittedBy: 'teacher' | 'admin';
  isLocked: boolean; // Locked for teachers once submitted
  checkInTime?: string;
  checkOutTime?: string;
  semester: 'semester1' | 'semester2';
  month: number; // 1 to 12
  year: number;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  adminNote?: string;
}

export interface SchoolInfo {
  nameKh: string;
  nameEn: string;
  ministryKh: string;
  departmentKh: string;
  districtOfficeKh: string;
  principalName: string;
  phone: string;
  email: string;
  address: string;
  academicYear: string;
  currentSemester: 'semester1' | 'semester2';
  logoUrl?: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
  autoSendOnTeacherSubmit: boolean;
  autoSendDailySummary: boolean;
  autoSendAlertOnAbsence: boolean;
  dailySummaryTime: string;
  lastSentAt?: string;
  statusMessage?: string;
}

export interface TeacherStats {
  teacherId: string;
  teacherName: string;
  totalSessions: number;
  present: number;
  late: number;
  permission: number;
  absent: number;
  mission: number;
  substitute: number;
  attendanceRate: number;
}
