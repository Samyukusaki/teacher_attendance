import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  SchoolInfo,
  Teacher,
  GradeClass,
  Subject,
  AttendanceRecord,
  LeaveRequest,
  TelegramConfig,
  TimetableSlot,
} from '../types';

// Collection Names
export const COLLECTIONS = {
  SETTINGS: 'system_settings',
  TEACHERS: 'teachers',
  CLASSES: 'classes',
  SUBJECTS: 'subjects',
  TIMETABLES: 'timetables',
  ATTENDANCE: 'attendance_records',
  LEAVE: 'leave_requests',
};

// Document IDs for singletons
export const DOC_IDS = {
  SCHOOL_INFO: 'school_info',
  TELEGRAM_CONFIG: 'telegram_config',
  ADMIN_PIN: 'admin_pin',
};

// Check if database is initialized, if not, seed with defaults
export async function seedInitialFirestoreData(
  initialData: {
    schoolInfo: SchoolInfo;
    teachers: Teacher[];
    classes: GradeClass[];
    subjects: Subject[];
    timetables: TimetableSlot[];
    attendanceRecords: AttendanceRecord[];
    leaveRequests: LeaveRequest[];
    telegramConfig: TelegramConfig;
    adminPin: string;
  }
) {
  try {
    const teachersSnapshot = await getDocs(collection(db, COLLECTIONS.TEACHERS));
    if (!teachersSnapshot.empty) {
      // Data already exists in Firestore!
      return false;
    }

    console.log('⚡ Initializing Firestore with default school data...');
    const batch = writeBatch(db);

    // 1. School Info
    const schoolRef = doc(db, COLLECTIONS.SETTINGS, DOC_IDS.SCHOOL_INFO);
    batch.set(schoolRef, initialData.schoolInfo);

    // 2. Telegram Config
    const telegramRef = doc(db, COLLECTIONS.SETTINGS, DOC_IDS.TELEGRAM_CONFIG);
    batch.set(telegramRef, initialData.telegramConfig);

    // 3. Admin Pin
    const pinRef = doc(db, COLLECTIONS.SETTINGS, DOC_IDS.ADMIN_PIN);
    batch.set(pinRef, { pin: initialData.adminPin });

    // 4. Teachers
    initialData.teachers.forEach((t) => {
      const ref = doc(db, COLLECTIONS.TEACHERS, t.id);
      batch.set(ref, t);
    });

    // 5. Classes
    initialData.classes.forEach((c) => {
      const ref = doc(db, COLLECTIONS.CLASSES, c.id);
      batch.set(ref, c);
    });

    // 6. Subjects
    initialData.subjects.forEach((s) => {
      const ref = doc(db, COLLECTIONS.SUBJECTS, s.id);
      batch.set(ref, s);
    });

    // 7. Timetables
    initialData.timetables.forEach((slot) => {
      const ref = doc(db, COLLECTIONS.TIMETABLES, slot.id);
      batch.set(ref, slot);
    });

    // 8. Attendance Records
    initialData.attendanceRecords.forEach((att) => {
      const ref = doc(db, COLLECTIONS.ATTENDANCE, att.id);
      batch.set(ref, att);
    });

    // 9. Leave requests
    initialData.leaveRequests.forEach((lv) => {
      const ref = doc(db, COLLECTIONS.LEAVE, lv.id);
      batch.set(ref, lv);
    });

    await batch.commit();
    console.log('✅ Firestore seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding Firestore data:', error);
    return false;
  }
}

// ----------------------------------------------------
// Realtime Subscriptions
// ----------------------------------------------------

export function subscribeSchoolInfo(callback: (info: SchoolInfo) => void) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, DOC_IDS.SCHOOL_INFO);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SchoolInfo);
    }
  }, (err) => {
    console.warn('Firestore subscribeSchoolInfo error:', err);
  });
}

export function subscribeTelegramConfig(callback: (cfg: TelegramConfig) => void) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, DOC_IDS.TELEGRAM_CONFIG);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as TelegramConfig);
    }
  }, (err) => {
    console.warn('Firestore subscribeTelegramConfig error:', err);
  });
}

export function subscribeAdminPin(callback: (pin: string) => void) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, DOC_IDS.ADMIN_PIN);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (data?.pin) callback(data.pin);
    }
  }, (err) => {
    console.warn('Firestore subscribeAdminPin error:', err);
  });
}

export function subscribeTeachers(callback: (teachers: Teacher[]) => void) {
  const colRef = collection(db, COLLECTIONS.TEACHERS);
  return onSnapshot(colRef, (snap) => {
    const list: Teacher[] = [];
    snap.forEach((d) => list.push(d.data() as Teacher));
    if (list.length > 0) {
      callback(list);
    }
  }, (err) => {
    console.warn('Firestore subscribeTeachers error:', err);
  });
}

export function subscribeClasses(callback: (classes: GradeClass[]) => void) {
  const colRef = collection(db, COLLECTIONS.CLASSES);
  return onSnapshot(colRef, (snap) => {
    const list: GradeClass[] = [];
    snap.forEach((d) => list.push(d.data() as GradeClass));
    if (list.length > 0) {
      callback(list);
    }
  }, (err) => {
    console.warn('Firestore subscribeClasses error:', err);
  });
}

export function subscribeSubjects(callback: (subjects: Subject[]) => void) {
  const colRef = collection(db, COLLECTIONS.SUBJECTS);
  return onSnapshot(colRef, (snap) => {
    const list: Subject[] = [];
    snap.forEach((d) => list.push(d.data() as Subject));
    if (list.length > 0) {
      callback(list);
    }
  }, (err) => {
    console.warn('Firestore subscribeSubjects error:', err);
  });
}

export function subscribeTimetables(callback: (timetables: TimetableSlot[]) => void) {
  const colRef = collection(db, COLLECTIONS.TIMETABLES);
  return onSnapshot(colRef, (snap) => {
    const list: TimetableSlot[] = [];
    snap.forEach((d) => list.push(d.data() as TimetableSlot));
    if (list.length > 0) {
      callback(list);
    }
  }, (err) => {
    console.warn('Firestore subscribeTimetables error:', err);
  });
}

export function subscribeAttendance(callback: (records: AttendanceRecord[]) => void) {
  const colRef = collection(db, COLLECTIONS.ATTENDANCE);
  return onSnapshot(colRef, (snap) => {
    const list: AttendanceRecord[] = [];
    snap.forEach((d) => list.push(d.data() as AttendanceRecord));
    if (list.length > 0) {
      callback(list);
    }
  }, (err) => {
    console.warn('Firestore subscribeAttendance error:', err);
  });
}

export function subscribeLeaveRequests(callback: (requests: LeaveRequest[]) => void) {
  const colRef = collection(db, COLLECTIONS.LEAVE);
  return onSnapshot(colRef, (snap) => {
    const list: LeaveRequest[] = [];
    snap.forEach((d) => list.push(d.data() as LeaveRequest));
    if (list.length > 0) {
      callback(list);
    }
  }, (err) => {
    console.warn('Firestore subscribeLeaveRequests error:', err);
  });
}

// ----------------------------------------------------
// Firestore Write Operations
// ----------------------------------------------------

export async function setFirestoreSchoolInfo(info: SchoolInfo) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, DOC_IDS.SCHOOL_INFO);
  await setDoc(docRef, info, { merge: true });
}

export async function setFirestoreTelegramConfig(cfg: TelegramConfig) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, DOC_IDS.TELEGRAM_CONFIG);
  await setDoc(docRef, cfg, { merge: true });
}

export async function setFirestoreAdminPin(pin: string) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, DOC_IDS.ADMIN_PIN);
  await setDoc(docRef, { pin }, { merge: true });
}

export async function saveTeacherDoc(teacher: Teacher) {
  const docRef = doc(db, COLLECTIONS.TEACHERS, teacher.id);
  await setDoc(docRef, teacher, { merge: true });
}

export async function deleteTeacherDoc(id: string) {
  const docRef = doc(db, COLLECTIONS.TEACHERS, id);
  await deleteDoc(docRef);
}

export async function saveClassDoc(cls: GradeClass) {
  const docRef = doc(db, COLLECTIONS.CLASSES, cls.id);
  await setDoc(docRef, cls, { merge: true });
}

export async function deleteClassDoc(id: string) {
  const docRef = doc(db, COLLECTIONS.CLASSES, id);
  await deleteDoc(docRef);
}

export async function saveSubjectDoc(subj: Subject) {
  const docRef = doc(db, COLLECTIONS.SUBJECTS, subj.id);
  await setDoc(docRef, subj, { merge: true });
}

export async function deleteSubjectDoc(id: string) {
  const docRef = doc(db, COLLECTIONS.SUBJECTS, id);
  await deleteDoc(docRef);
}

export async function saveTimetableSlotDoc(slot: TimetableSlot) {
  const docRef = doc(db, COLLECTIONS.TIMETABLES, slot.id);
  await setDoc(docRef, slot, { merge: true });
}

export async function deleteTimetableSlotDoc(id: string) {
  const docRef = doc(db, COLLECTIONS.TIMETABLES, id);
  await deleteDoc(docRef);
}

export async function saveTeacherTimetableBatch(teacherId: string, newSlots: TimetableSlot[], existingSlots: TimetableSlot[]) {
  const batch = writeBatch(db);
  // Delete previous slots for this teacher
  const toDelete = existingSlots.filter((s) => s.teacherId === teacherId);
  toDelete.forEach((s) => {
    const ref = doc(db, COLLECTIONS.TIMETABLES, s.id);
    batch.delete(ref);
  });

  // Insert new slots
  newSlots.forEach((s) => {
    const ref = doc(db, COLLECTIONS.TIMETABLES, s.id);
    batch.set(ref, s);
  });

  await batch.commit();
}

export async function saveAttendanceRecordsBatch(records: AttendanceRecord[]) {
  const batch = writeBatch(db);
  records.forEach((r) => {
    const ref = doc(db, COLLECTIONS.ATTENDANCE, r.id);
    batch.set(ref, r, { merge: true });
  });
  await batch.commit();
}

export async function saveAttendanceRecordDoc(record: AttendanceRecord) {
  const docRef = doc(db, COLLECTIONS.ATTENDANCE, record.id);
  await setDoc(docRef, record, { merge: true });
}

export async function deleteAttendanceRecordDoc(id: string) {
  const docRef = doc(db, COLLECTIONS.ATTENDANCE, id);
  await deleteDoc(docRef);
}

export async function saveLeaveRequestDoc(req: LeaveRequest) {
  const docRef = doc(db, COLLECTIONS.LEAVE, req.id);
  await setDoc(docRef, req, { merge: true });
}

export async function resetAllFirestoreData(initialData: {
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  classes: GradeClass[];
  subjects: Subject[];
  timetables: TimetableSlot[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  telegramConfig: TelegramConfig;
  adminPin: string;
}) {
  // Clear and rewrite with fresh data
  const batch = writeBatch(db);

  // Settings
  batch.set(doc(db, COLLECTIONS.SETTINGS, DOC_IDS.SCHOOL_INFO), initialData.schoolInfo);
  batch.set(doc(db, COLLECTIONS.SETTINGS, DOC_IDS.TELEGRAM_CONFIG), initialData.telegramConfig);
  batch.set(doc(db, COLLECTIONS.SETTINGS, DOC_IDS.ADMIN_PIN), { pin: initialData.adminPin });

  // Teachers
  initialData.teachers.forEach((t) => batch.set(doc(db, COLLECTIONS.TEACHERS, t.id), t));
  initialData.classes.forEach((c) => batch.set(doc(db, COLLECTIONS.CLASSES, c.id), c));
  initialData.subjects.forEach((s) => batch.set(doc(db, COLLECTIONS.SUBJECTS, s.id), s));
  initialData.timetables.forEach((slot) => batch.set(doc(db, COLLECTIONS.TIMETABLES, slot.id), slot));
  initialData.attendanceRecords.forEach((att) => batch.set(doc(db, COLLECTIONS.ATTENDANCE, att.id), att));
  initialData.leaveRequests.forEach((lv) => batch.set(doc(db, COLLECTIONS.LEAVE, lv.id), lv));

  await batch.commit();
}
