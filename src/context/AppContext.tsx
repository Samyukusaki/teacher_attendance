import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SchoolInfo,
  Teacher,
  GradeClass,
  Subject,
  AttendanceRecord,
  LeaveRequest,
  TelegramConfig,
  TimetableSlot,
  DayOfWeek,
  Role,
} from '../types';
import {
  initialSchoolInfo,
  initialTeachers,
  initialClasses,
  initialSubjects,
  initialTelegramConfig,
  initialLeaveRequests,
  initialTimetables,
  generateInitialAttendance,
  generateInitialTimetables,
} from '../data/mockInitialData';
import {
  sendTelegramMessage,
  formatTeacherAttendanceSubmitMessage,
  formatDailySummaryMessage,
  formatLeaveRequestMessage,
} from '../services/telegramService';
import { getTodayString } from '../utils/khmerDate';
import {
  seedInitialFirestoreData,
  subscribeSchoolInfo,
  subscribeTelegramConfig,
  subscribeAdminPin,
  subscribeTeachers,
  subscribeClasses,
  subscribeSubjects,
  subscribeTimetables,
  subscribeAttendance,
  subscribeLeaveRequests,
  setFirestoreSchoolInfo,
  setFirestoreTelegramConfig,
  setFirestoreAdminPin,
  saveTeacherDoc,
  deleteTeacherDoc,
  saveClassDoc,
  deleteClassDoc,
  saveSubjectDoc,
  deleteSubjectDoc,
  saveTimetableSlotDoc,
  deleteTimetableSlotDoc,
  saveTeacherTimetableBatch,
  saveAttendanceRecordsBatch,
  saveAttendanceRecordDoc,
  deleteAttendanceRecordDoc,
  saveLeaveRequestDoc,
  resetAllFirestoreData,
} from '../services/firestoreSync';

interface AppContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  selectedTeacherId: string;
  setSelectedTeacherId: (id: string) => void;
  activeTab: 'teacher_submit' | 'weekly' | 'monthly_semester' | 'reports' | 'admin_dashboard' | 'leave_requests' | 'timetables';
  setActiveTab: (tab: 'teacher_submit' | 'weekly' | 'monthly_semester' | 'reports' | 'admin_dashboard' | 'leave_requests' | 'timetables') => void;
  
  // Cloud Sync Status
  isCloudSynced: boolean;

  // School Info
  schoolInfo: SchoolInfo;
  updateSchoolInfo: (info: Partial<SchoolInfo>) => void;
  
  // Teachers
  teachers: Teacher[];
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  
  // Classes
  classes: GradeClass[];
  addClass: (cls: Omit<GradeClass, 'id'>) => void;
  updateClass: (id: string, cls: Partial<GradeClass>) => void;
  deleteClass: (id: string) => void;
  
  // Subjects
  subjects: Subject[];
  addSubject: (subj: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subj: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  // Timetables (កាលវិភាគបង្រៀន)
  timetables: TimetableSlot[];
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  updateTimetableSlot: (id: string, updates: Partial<TimetableSlot>) => void;
  deleteTimetableSlot: (id: string) => void;
  setTeacherTimetable: (teacherId: string, slots: Omit<TimetableSlot, 'id'>[]) => void;
  getTeacherScheduleForDay: (teacherId: string, day: DayOfWeek) => TimetableSlot[];
  resetTeacherTimetable: (teacherId: string) => void;
  
  // Attendance
  attendanceRecords: AttendanceRecord[];
  submitTeacherAttendance: (
    newRecords: Omit<AttendanceRecord, 'id' | 'submittedAt' | 'submittedBy' | 'isLocked'>[]
  ) => Promise<{ success: boolean; message: string }>;
  adminUpdateRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  adminDeleteRecord: (id: string) => void;
  adminAddRecord: (record: Omit<AttendanceRecord, 'id' | 'submittedAt'>) => void;
  
  // Leave Requests
  leaveRequests: LeaveRequest[];
  submitLeaveRequest: (
    req: Omit<LeaveRequest, 'id' | 'requestedAt' | 'status'>
  ) => Promise<{ success: boolean; message: string }>;
  updateLeaveStatus: (id: string, status: 'approved' | 'rejected', adminNote?: string) => Promise<void>;
  
  // Telegram
  telegramConfig: TelegramConfig;
  updateTelegramConfig: (cfg: Partial<TelegramConfig>) => void;
  sendTelegramTest: () => Promise<{ success: boolean; message: string }>;
  sendDailySummaryTelegram: (dateStr?: string) => Promise<{ success: boolean; message: string }>;
  
  // Admin Authentication State
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (auth: boolean) => void;
  adminPin: string;
  setAdminPin: (pin: string) => void;
  
  // Alert Toast
  toast: { type: 'success' | 'error' | 'info'; title: string; message: string } | null;
  setToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message: string } | null) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;

  // Reset to initial
  resetToDefaultData: () => void;
  exportAllDataJSON: () => void;
  importAllDataJSON: (jsonString: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  SCHOOL: 'teacher_att_school_v2',
  TEACHERS: 'teacher_att_teachers_v1',
  CLASSES: 'teacher_att_classes_v1',
  SUBJECTS: 'teacher_att_subjects_v1',
  ATTENDANCE: 'teacher_att_records_v1',
  LEAVE: 'teacher_att_leave_v1',
  TELEGRAM: 'teacher_att_telegram_v1',
  ADMIN_PIN: 'teacher_att_admin_pin_v1',
  TIMETABLES: 'teacher_att_timetables_v1',
};

function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.warn(`Error parsing localStorage key ${key}:`, e);
    return fallback;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<Role>('teacher');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('tch-1');
  const [activeTab, setActiveTab] = useState<
    'teacher_submit' | 'weekly' | 'monthly_semester' | 'reports' | 'admin_dashboard' | 'leave_requests' | 'timetables'
  >('teacher_submit');

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  const [adminPin, setAdminPinState] = useState<string>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEYS.ADMIN_PIN) || '1234';
    } catch {
      return '1234';
    }
  });

  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // School Info
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const loaded = safeGetJSON<SchoolInfo>(LOCAL_STORAGE_KEYS.SCHOOL, initialSchoolInfo);
    if (!loaded.geoFence || loaded.geoFence.latitude === 11.5367 || loaded.geoFence.latitude === 11.0482) {
      return { ...loaded, geoFence: initialSchoolInfo.geoFence };
    }
    return loaded;
  });

  // Teachers
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    return safeGetJSON<Teacher[]>(LOCAL_STORAGE_KEYS.TEACHERS, initialTeachers);
  });

  // Classes
  const [classes, setClasses] = useState<GradeClass[]>(() => {
    return safeGetJSON<GradeClass[]>(LOCAL_STORAGE_KEYS.CLASSES, initialClasses);
  });

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    return safeGetJSON<Subject[]>(LOCAL_STORAGE_KEYS.SUBJECTS, initialSubjects);
  });

  // Attendance Records
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    return safeGetJSON<AttendanceRecord[]>(LOCAL_STORAGE_KEYS.ATTENDANCE, generateInitialAttendance());
  });

  // Leave Requests
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    return safeGetJSON<LeaveRequest[]>(LOCAL_STORAGE_KEYS.LEAVE, initialLeaveRequests);
  });

  // Telegram Config
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    return safeGetJSON<TelegramConfig>(LOCAL_STORAGE_KEYS.TELEGRAM, initialTelegramConfig);
  });

  // Timetables (កាលវិភាគបង្រៀន)
  const [timetables, setTimetables] = useState<TimetableSlot[]>(() => {
    return safeGetJSON<TimetableSlot[]>(LOCAL_STORAGE_KEYS.TIMETABLES, initialTimetables);
  });

  // --------------------------------------------------------------------------
  // Realtime Cloud Firestore Synchronization Setup
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // 1. Initial Cloud Seeding (if brand new Firestore instance)
    seedInitialFirestoreData({
      schoolInfo,
      teachers,
      classes,
      subjects,
      timetables,
      attendanceRecords,
      leaveRequests,
      telegramConfig,
      adminPin,
    }).then(() => {
      if (isMounted) setIsCloudSynced(true);
    });

    // 2. Real-time Subscriptions
    const unsubSchool = subscribeSchoolInfo((info) => {
      setSchoolInfo(info);
      localStorage.setItem(LOCAL_STORAGE_KEYS.SCHOOL, JSON.stringify(info));
      setIsCloudSynced(true);
    });

    const unsubTelegram = subscribeTelegramConfig((cfg) => {
      setTelegramConfig(cfg);
      localStorage.setItem(LOCAL_STORAGE_KEYS.TELEGRAM, JSON.stringify(cfg));
      setIsCloudSynced(true);
    });

    const unsubPin = subscribeAdminPin((pin) => {
      setAdminPinState(pin);
      localStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_PIN, pin);
      setIsCloudSynced(true);
    });

    const unsubTeachers = subscribeTeachers((list) => {
      setTeachers(list);
      localStorage.setItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(list));
      setIsCloudSynced(true);
    });

    const unsubClasses = subscribeClasses((list) => {
      setClasses(list);
      localStorage.setItem(LOCAL_STORAGE_KEYS.CLASSES, JSON.stringify(list));
      setIsCloudSynced(true);
    });

    const unsubSubjects = subscribeSubjects((list) => {
      setSubjects(list);
      localStorage.setItem(LOCAL_STORAGE_KEYS.SUBJECTS, JSON.stringify(list));
      setIsCloudSynced(true);
    });

    const unsubTimetables = subscribeTimetables((list) => {
      setTimetables(list);
      localStorage.setItem(LOCAL_STORAGE_KEYS.TIMETABLES, JSON.stringify(list));
      setIsCloudSynced(true);
    });

    const unsubAttendance = subscribeAttendance((list) => {
      setAttendanceRecords(list);
      localStorage.setItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
      setIsCloudSynced(true);
    });

    const unsubLeave = subscribeLeaveRequests((list) => {
      setLeaveRequests(list);
      localStorage.setItem(LOCAL_STORAGE_KEYS.LEAVE, JSON.stringify(list));
      setIsCloudSynced(true);
    });

    return () => {
      isMounted = false;
      unsubSchool();
      unsubTelegram();
      unsubPin();
      unsubTeachers();
      unsubClasses();
      unsubSubjects();
      unsubTimetables();
      unsubAttendance();
      unsubLeave();
    };
  }, []);

  const setAdminPin = (pin: string) => {
    setAdminPinState(pin);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_PIN, pin);
    setFirestoreAdminPin(pin).catch((e) => console.warn('Error saving pin to Firestore:', e));
  };

  // Timetable Handlers
  const addTimetableSlot = (slot: Omit<TimetableSlot, 'id'>) => {
    const newId = `tt-${slot.teacherId}-${slot.dayOfWeek}-${slot.periodNumber}-${Date.now()}`;
    const newSlot: TimetableSlot = { ...slot, id: newId };
    setTimetables((prev) => {
      const filtered = prev.filter(
        (s) => !(s.teacherId === slot.teacherId && s.dayOfWeek === slot.dayOfWeek && s.periodNumber === slot.periodNumber)
      );
      return [...filtered, newSlot];
    });
    saveTimetableSlotDoc(newSlot).catch((e) => console.warn('Error saving timetable slot to Firestore:', e));
    showToast('success', 'ជោគជ័យ', 'បានបន្ថែមម៉ោងបង្រៀនក្នុងកាលវិភាគ');
  };

  const updateTimetableSlot = (id: string, updates: Partial<TimetableSlot>) => {
    let updatedSlot: TimetableSlot | null = null;
    setTimetables((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          updatedSlot = { ...s, ...updates };
          return updatedSlot;
        }
        return s;
      })
    );
    if (updatedSlot) {
      saveTimetableSlotDoc(updatedSlot).catch((e) => console.warn('Error updating timetable in Firestore:', e));
    }
    showToast('success', 'ជោគជ័យ', 'បានកែសម្រួលកាលវិភាគបង្រៀន');
  };

  const deleteTimetableSlot = (id: string) => {
    setTimetables((prev) => prev.filter((s) => s.id !== id));
    deleteTimetableSlotDoc(id).catch((e) => console.warn('Error deleting timetable in Firestore:', e));
    showToast('info', 'បានលុប', 'បានលុបម៉ោងបង្រៀនចេញពីកាលវិភាគ');
  };

  const setTeacherTimetable = (teacherId: string, slots: Omit<TimetableSlot, 'id'>[]) => {
    const existing = [...timetables];
    const otherTeachersSlots = existing.filter((s) => s.teacherId !== teacherId);
    const newSlots: TimetableSlot[] = slots.map((s, idx) => ({
      ...s,
      id: `tt-${teacherId}-${s.dayOfWeek}-${s.periodNumber}-${idx}-${Date.now()}`,
    }));

    setTimetables([...otherTeachersSlots, ...newSlots]);
    saveTeacherTimetableBatch(teacherId, newSlots, existing).catch((e) =>
      console.warn('Error batch saving timetables to Firestore:', e)
    );
    showToast('success', 'ជោគជ័យ', 'បានរក្សាទុកកាលវិភាគបង្រៀនប្រចាំសប្តាហ៍រួចរាល់');
  };

  const getTeacherScheduleForDay = (teacherId: string, day: DayOfWeek): TimetableSlot[] => {
    return timetables
      .filter((s) => s.teacherId === teacherId && s.dayOfWeek === day)
      .sort((a, b) => a.periodNumber - b.periodNumber);
  };

  const resetTeacherTimetable = (teacherId: string) => {
    const fresh = generateInitialTimetables().filter((s) => s.teacherId === teacherId);
    setTimetables((prev) => {
      const other = prev.filter((s) => s.teacherId !== teacherId);
      return [...other, ...fresh];
    });
    saveTeacherTimetableBatch(teacherId, fresh, timetables).catch((e) =>
      console.warn('Error resetting timetable in Firestore:', e)
    );
    showToast('info', 'កំណត់ឡើងវិញ', 'បានកំណត់កាលវិភាគគំរូឡើងវិញ');
  };

  // School Info updater
  const updateSchoolInfo = (info: Partial<SchoolInfo>) => {
    const updated = { ...schoolInfo, ...info };
    setSchoolInfo(updated);
    setFirestoreSchoolInfo(updated).catch((e) => console.warn('Error saving school info to Firestore:', e));
    showToast('success', 'ជោគជ័យ', 'បានកែប្រែព័ត៌មានសាលារៀនរួចរាល់');
  };

  // Teachers CRUD
  const addTeacher = (tch: Omit<Teacher, 'id'>) => {
    const newId = `tch-${Date.now()}`;
    const newTeacher: Teacher = { ...tch, id: newId };
    setTeachers((prev) => [...prev, newTeacher]);
    saveTeacherDoc(newTeacher).catch((e) => console.warn('Error saving teacher to Firestore:', e));
    showToast('success', 'ជោគជ័យ', `បានបន្ថែម ${newTeacher.nameKh} ដោយជោគជ័យ`);
  };

  const updateTeacher = (id: string, tch: Partial<Teacher>) => {
    let updatedTch: Teacher | null = null;
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          updatedTch = { ...t, ...tch };
          return updatedTch;
        }
        return t;
      })
    );
    if (updatedTch) {
      saveTeacherDoc(updatedTch).catch((e) => console.warn('Error updating teacher in Firestore:', e));
    }
    showToast('success', 'ជោគជ័យ', 'បានកែប្រែព័ត៌មានគ្រូបង្រៀនរួចរាល់');
  };

  const deleteTeacher = (id: string) => {
    const t = teachers.find((tc) => tc.id === id);
    setTeachers((prev) => {
      const filtered = prev.filter((tc) => tc.id !== id);
      if (selectedTeacherId === id && filtered.length > 0) {
        setSelectedTeacherId(filtered[0].id);
      }
      return filtered;
    });
    // Clean up timetable slots for this teacher
    setTimetables((prev) => prev.filter((s) => s.teacherId !== id));

    deleteTeacherDoc(id).catch((e) => console.warn('Error deleting teacher in Firestore:', e));
    showToast('info', 'បានលុប', `បានលុប ${t?.nameKh || 'គ្រូបង្រៀន'} និងកាលវិភាគបង្រៀនចេញពីប្រព័ន្ធ`);
  };

  // Classes CRUD
  const addClass = (cls: Omit<GradeClass, 'id'>) => {
    const newId = `cls-${Date.now()}`;
    const newClass: GradeClass = { ...cls, id: newId };
    setClasses((prev) => [...prev, newClass]);
    saveClassDoc(newClass).catch((e) => console.warn('Error saving class to Firestore:', e));
    showToast('success', 'ជោគជ័យ', `បានបន្ថែមថ្នាក់ ${newClass.nameKh} រួចរាល់`);
  };

  const updateClass = (id: string, cls: Partial<GradeClass>) => {
    let updatedCls: GradeClass | null = null;
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updatedCls = { ...c, ...cls };
          return updatedCls;
        }
        return c;
      })
    );
    if (updatedCls) {
      saveClassDoc(updatedCls).catch((e) => console.warn('Error updating class in Firestore:', e));
    }
    showToast('success', 'ជោគជ័យ', 'បានកែប្រែព័ត៌មានថ្នាក់រៀនរួចរាល់');
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    deleteClassDoc(id).catch((e) => console.warn('Error deleting class in Firestore:', e));
    showToast('info', 'បានលុប', 'បានលុបថ្នាក់រៀនចេញពីប្រព័ន្ធ');
  };

  // Subjects CRUD
  const addSubject = (subj: Omit<Subject, 'id'>) => {
    const newId = `sub-${Date.now()}`;
    const newSubject: Subject = { ...subj, id: newId };
    setSubjects((prev) => [...prev, newSubject]);
    saveSubjectDoc(newSubject).catch((e) => console.warn('Error saving subject to Firestore:', e));
    showToast('success', 'ជោគជ័យ', `បានបន្ថែមមុខវិជ្ជា ${newSubject.nameKh} រួចរាល់`);
  };

  const updateSubject = (id: string, subj: Partial<Subject>) => {
    let updatedSubj: Subject | null = null;
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          updatedSubj = { ...s, ...subj };
          return updatedSubj;
        }
        return s;
      })
    );
    if (updatedSubj) {
      saveSubjectDoc(updatedSubj).catch((e) => console.warn('Error updating subject in Firestore:', e));
    }
    showToast('success', 'ជោគជ័យ', 'បានកែប្រែព័ត៌មានមុខវិជ្ជារួចរាល់');
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    deleteSubjectDoc(id).catch((e) => console.warn('Error deleting subject in Firestore:', e));
    showToast('info', 'បានលុប', 'បានលុបមុខវិជ្ជាចេញពីប្រព័ន្ធ');
  };

  // 1. Submit Teacher Attendance (Teacher can submit, but LOCKED after submitting)
  const submitTeacherAttendance = async (
    newRecords: Omit<AttendanceRecord, 'id' | 'submittedAt' | 'submittedBy' | 'isLocked'>[]
  ) => {
    if (newRecords.length === 0) {
      return { success: false, message: 'សូមជ្រើសរើស និងបំពេញទិន្នន័យម៉ោងបង្រៀនយ៉ាងហោចណាស់ ១ ម៉ោង' };
    }

    const teacher = teachers.find((t) => t.id === newRecords[0].teacherId);
    if (!teacher) {
      return { success: false, message: 'រកមិនឃើញព័ត៌មានគ្រូបង្រៀន' };
    }

    const now = new Date().toISOString();
    const createdRecords: AttendanceRecord[] = newRecords.map((r, idx) => ({
      ...r,
      id: `att-${r.date}-${r.teacherId}-${r.sessionNumber}-${Date.now()}-${idx}`,
      submittedAt: now,
      submittedBy: 'teacher',
      isLocked: true, // IMPORTANT: Teachers cannot edit once submitted!
    }));

    // Filter out previous records for the same teacher, date, and sessionNumber to avoid duplicate clashes
    setAttendanceRecords((prev) => {
      const filtered = prev.filter(
        (p) =>
          !createdRecords.some(
            (c) => c.date === p.date && c.teacherId === p.teacherId && c.sessionNumber === p.sessionNumber
          )
      );
      return [...filtered, ...createdRecords];
    });

    // Cloud Save to Firestore
    saveAttendanceRecordsBatch(createdRecords).catch((e) =>
      console.warn('Error saving attendance batch to Firestore:', e)
    );

    showToast('success', 'បានចុះវត្តមានជោគជ័យ', `បានរក្សាទុកលើ Cloud និងចាក់សោទិន្នន័យចំនួន ${createdRecords.length} ម៉ោង`);

    // Auto-send Telegram notification if enabled
    if (telegramConfig.isEnabled && telegramConfig.autoSendOnTeacherSubmit && telegramConfig.botToken && telegramConfig.chatId) {
      const msg = formatTeacherAttendanceSubmitMessage(schoolInfo, teacher, createdRecords, classes, subjects);
      sendTelegramMessage(telegramConfig.botToken, telegramConfig.chatId, msg).then((res) => {
        if (res.success) {
          showToast('info', 'Telegram Notification', 'បានបញ្ជូនដំណឹងវត្តមានទៅ Telegram របស់អ្នកគ្រប់គ្រងរួចរាល់ 📲');
        }
      });
    }

    return { success: true, message: 'បានចុះវត្តមាន និងចាក់សោទិន្នន័យជោគជ័យ' };
  };

  // Admin Record Operations
  const adminUpdateRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    let updatedRecord: AttendanceRecord | null = null;
    setAttendanceRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          updatedRecord = { ...r, ...updates };
          return updatedRecord;
        }
        return r;
      })
    );
    if (updatedRecord) {
      saveAttendanceRecordDoc(updatedRecord).catch((e) =>
        console.warn('Error updating attendance record in Firestore:', e)
      );
    }
    showToast('success', 'ជោគជ័យ', 'អ្នកគ្រប់គ្រងបានកែសម្រួលទិន្នន័យវត្តមានរួចរាល់');
  };

  const adminDeleteRecord = (id: string) => {
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
    deleteAttendanceRecordDoc(id).catch((e) =>
      console.warn('Error deleting attendance record in Firestore:', e)
    );
    showToast('info', 'បានលុប', 'បានលុបកំណត់ត្រាវត្តមានចេញពីប្រព័ន្ធ');
  };

  const adminAddRecord = (record: Omit<AttendanceRecord, 'id' | 'submittedAt'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-admin-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      submittedBy: 'admin',
    };
    setAttendanceRecords((prev) => [...prev, newRecord]);
    saveAttendanceRecordDoc(newRecord).catch((e) =>
      console.warn('Error adding attendance record in Firestore:', e)
    );
    showToast('success', 'ជោគជ័យ', 'បានបញ្ចូលកំណត់ត្រាវត្តមានថ្មីដោយអ្នកគ្រប់គ្រង');
  };

  // Leave Requests
  const submitLeaveRequest = async (
    req: Omit<LeaveRequest, 'id' | 'requestedAt' | 'status'>
  ) => {
    const teacher = teachers.find((t) => t.id === req.teacherId);
    if (!teacher) {
      return { success: false, message: 'រកមិនឃើញគ្រូបង្រៀន' };
    }

    const newLeave: LeaveRequest = {
      ...req,
      id: `leave-${Date.now()}`,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    setLeaveRequests((prev) => [newLeave, ...prev]);
    saveLeaveRequestDoc(newLeave).catch((e) => console.warn('Error saving leave request in Firestore:', e));
    showToast('success', 'បានស្នើសុំច្បាប់', 'ពាក្យស្នើសុំច្បាប់ត្រូវបានបញ្ជូនទៅកាន់អ្នកគ្រប់គ្រងដើម្បីពិនិត្យ');

    // Auto-send Telegram Notification
    if (telegramConfig.isEnabled && telegramConfig.botToken && telegramConfig.chatId) {
      const msg = formatLeaveRequestMessage(schoolInfo, teacher, newLeave);
      sendTelegramMessage(telegramConfig.botToken, telegramConfig.chatId, msg).then((res) => {
        if (res.success) {
          showToast('info', 'Telegram Notification', 'បានផ្ញើដំណឹងស្នើសុំច្បាប់ទៅ Telegram របស់នាយកសាលា 📲');
        }
      });
    }

    return { success: true, message: 'បានស្នើសុំច្បាប់ដោយជោគជ័យ' };
  };

  const updateLeaveStatus = async (id: string, status: 'approved' | 'rejected', adminNote?: string) => {
    let updatedLeave: LeaveRequest | null = null;
    setLeaveRequests((prev) =>
      prev.map((lr) => {
        if (lr.id === id) {
          updatedLeave = {
            ...lr,
            status,
            adminNote,
            approvedBy: schoolInfo.principalName || 'អ្នកគ្រប់គ្រងសាលា',
            approvedAt: new Date().toISOString(),
          };
          return updatedLeave;
        }
        return lr;
      })
    );

    if (updatedLeave) {
      saveLeaveRequestDoc(updatedLeave).catch((e) => console.warn('Error updating leave status in Firestore:', e));
    }

    const label = status === 'approved' ? 'អនុម័ត' : 'បដិសេធ';
    showToast('info', `បាន${label}ច្បាប់`, `បាន${label}ពាក្យស្នើសុំច្បាប់រួចរាល់`);
  };

  // Telegram Config
  const updateTelegramConfig = (cfg: Partial<TelegramConfig>) => {
    const updated = { ...telegramConfig, ...cfg };
    setTelegramConfig(updated);
    setFirestoreTelegramConfig(updated).catch((e) => console.warn('Error saving telegram config in Firestore:', e));
    showToast('success', 'ជោគជ័យ', 'បានរក្សាទុកការកំណត់ Telegram Bot រួចរាល់');
  };

  const sendTelegramTest = async () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      return { success: false, message: 'សូមបំពេញ Telegram Bot Token និង Chat ID ជាមុនសិន' };
    }

    const testMsg = `<b>🏫 ${schoolInfo.nameKh}</b>\n` +
      `<b>🔔 ការធ្វើតេស្តការតភ្ជាប់ Telegram Bot</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ ប្រព័ន្ធគ្រប់គ្រងវត្តមានគ្រូបង្រៀន បានភ្ជាប់ទំនាក់ទំនងជាមួយ Telegram របស់អ្នកគ្រប់គ្រងដោយជោគជ័យ!\n` +
      `⏰ ម៉ោង៖ ${new Date().toLocaleTimeString('km-KH')}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>សាកល្បងដោយជោគជ័យ 100%</i>`;

    const res = await sendTelegramMessage(telegramConfig.botToken, telegramConfig.chatId, testMsg);
    if (res.success) {
      const updated = { ...telegramConfig, lastSentAt: new Date().toISOString() };
      setTelegramConfig(updated);
      setFirestoreTelegramConfig(updated).catch((e) => console.warn('Error updating lastSentAt in Firestore:', e));
      showToast('success', 'ភ្ជាប់ជោគជ័យ!', 'សារតេស្តត្រូវបានផ្ញើទៅកាន់ Telegram របស់អ្នកគ្រប់គ្រងហើយ 🎉');
    } else {
      showToast('error', 'បរាជ័យ', res.message);
    }
    return res;
  };

  const sendDailySummaryTelegram = async (dateStr?: string) => {
    const targetDate = dateStr || getTodayString();
    const recordsToday = attendanceRecords.filter((r) => r.date === targetDate);

    const msg = formatDailySummaryMessage(schoolInfo, targetDate, recordsToday, teachers);
    const res = await sendTelegramMessage(telegramConfig.botToken, telegramConfig.chatId, msg);

    if (res.success) {
      const updated = { ...telegramConfig, lastSentAt: new Date().toISOString() };
      setTelegramConfig(updated);
      setFirestoreTelegramConfig(updated).catch((e) => console.warn('Error updating lastSentAt in Firestore:', e));
      showToast('success', 'បានផ្ញើជោគជ័យ', 'របាយការណ៍សង្ខេបប្រចាំថ្ងៃត្រូវបានផ្ញើទៅកាន់ Telegram របស់អ្នកគ្រប់គ្រងរួចរាល់ 📊');
    } else {
      showToast('error', 'មិនអាចផ្ញើបាន', res.message);
    }
    return res;
  };

  const resetToDefaultData = () => {
    const freshAtt = generateInitialAttendance();
    const freshTt = generateInitialTimetables();

    setSchoolInfo(initialSchoolInfo);
    setTeachers(initialTeachers);
    setClasses(initialClasses);
    setSubjects(initialSubjects);
    setTimetables(freshTt);
    setAttendanceRecords(freshAtt);
    setLeaveRequests(initialLeaveRequests);
    setTelegramConfig(initialTelegramConfig);
    setAdminPinState('1234');

    resetAllFirestoreData({
      schoolInfo: initialSchoolInfo,
      teachers: initialTeachers,
      classes: initialClasses,
      subjects: initialSubjects,
      timetables: freshTt,
      attendanceRecords: freshAtt,
      leaveRequests: initialLeaveRequests,
      telegramConfig: initialTelegramConfig,
      adminPin: '1234',
    }).catch((e) => console.warn('Error resetting Firestore:', e));

    showToast('info', 'កំណត់ឡើងវិញ', 'បានកំណត់ទិន្នន័យគំរូដើមឡើងវិញលើ Cloud ដោយជោគជ័យ');
  };

  const exportAllDataJSON = () => {
    try {
      const fullBackup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        schoolInfo,
        teachers,
        classes,
        subjects,
        timetables,
        attendanceRecords,
        leaveRequests,
        telegramConfig,
        adminPin,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateNow = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `school_attendance_backup_${dateNow}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('success', 'ទាញយកជោគជ័យ', 'បានទាញយកទិន្នន័យបម្រុងទុក (JSON) រួចរាល់');
    } catch (e) {
      console.error(e);
      showToast('error', 'បរាជ័យ', 'មិនអាចទាញយកទិន្នន័យបានទេ');
    }
  };

  const importAllDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.schoolInfo) setSchoolInfo(data.schoolInfo);
      if (data.teachers && Array.isArray(data.teachers)) setTeachers(data.teachers);
      if (data.classes && Array.isArray(data.classes)) setClasses(data.classes);
      if (data.subjects && Array.isArray(data.subjects)) setSubjects(data.subjects);
      if (data.timetables && Array.isArray(data.timetables)) setTimetables(data.timetables);
      if (data.attendanceRecords && Array.isArray(data.attendanceRecords)) setAttendanceRecords(data.attendanceRecords);
      if (data.leaveRequests && Array.isArray(data.leaveRequests)) setLeaveRequests(data.leaveRequests);
      if (data.telegramConfig) setTelegramConfig(data.telegramConfig);
      if (data.adminPin) setAdminPin(data.adminPin);

      // Sync imported backup directly to Cloud Firestore
      resetAllFirestoreData({
        schoolInfo: data.schoolInfo || initialSchoolInfo,
        teachers: data.teachers || initialTeachers,
        classes: data.classes || initialClasses,
        subjects: data.subjects || initialSubjects,
        timetables: data.timetables || initialTimetables,
        attendanceRecords: data.attendanceRecords || generateInitialAttendance(),
        leaveRequests: data.leaveRequests || initialLeaveRequests,
        telegramConfig: data.telegramConfig || initialTelegramConfig,
        adminPin: data.adminPin || '1234',
      }).catch((e) => console.warn('Error syncing imported data to Firestore:', e));

      showToast('success', 'បញ្ចូលទិន្នន័យជោគជ័យ', 'ទិន្នន័យទាំងអស់ត្រូវបានផ្ទុកចូលប្រព័ន្ធ និងរក្សាទុកលើ Cloud រួចរាល់ 🎉');
      return true;
    } catch (e) {
      console.error(e);
      showToast('error', 'ឯកសារមិនត្រឹមត្រូវ', 'សូមពិនិត្យមើលឯកសារ JSON ឡើងវិញ');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        selectedTeacherId,
        setSelectedTeacherId,
        activeTab,
        setActiveTab,
        isCloudSynced,
        schoolInfo,
        updateSchoolInfo,
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        classes,
        addClass,
        updateClass,
        deleteClass,
        subjects,
        addSubject,
        updateSubject,
        deleteSubject,
        timetables,
        addTimetableSlot,
        updateTimetableSlot,
        deleteTimetableSlot,
        setTeacherTimetable,
        getTeacherScheduleForDay,
        resetTeacherTimetable,
        attendanceRecords,
        submitTeacherAttendance,
        adminUpdateRecord,
        adminDeleteRecord,
        adminAddRecord,
        leaveRequests,
        submitLeaveRequest,
        updateLeaveStatus,
        telegramConfig,
        updateTelegramConfig,
        sendTelegramTest,
        sendDailySummaryTelegram,
        isAdminAuthenticated,
        setIsAdminAuthenticated,
        adminPin,
        setAdminPin,
        toast,
        setToast,
        showToast,
        resetToDefaultData,
        exportAllDataJSON,
        importAllDataJSON,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
