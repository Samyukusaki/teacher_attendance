import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Teacher, GradeClass, Subject, AttendanceRecord, AttendanceStatus } from '../types';
import {
  ShieldCheck,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Send,
  Plus,
  Edit2,
  Trash2,
  Save,
  KeyRound,
  RotateCcw,
  Sparkles,
  Search,
  Lock,
  Calendar,
  AlertTriangle,
  Download,
  Upload,
  Database,
  MapPin,
  Compass,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { toKhmerNumber, STATUS_META } from '../utils/khmerDate';
import { TeacherTimetableView } from './TeacherTimetableView';

export const AdminDashboard: React.FC = () => {
  const {
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
    attendanceRecords,
    adminUpdateRecord,
    adminDeleteRecord,
    telegramConfig,
    updateTelegramConfig,
    sendTelegramTest,
    sendDailySummaryTelegram,
    adminPin,
    setAdminPin,
    setIsAdminAuthenticated,
    setCurrentRole,
    setActiveTab,
    showToast,
    resetToDefaultData,
    exportAllDataJSON,
    importAllDataJSON,
    timetables,
  } = useApp();

  const [adminTab, setAdminTab] = useState<
    'school' | 'teachers' | 'timetables' | 'classes' | 'subjects' | 'records' | 'telegram' | 'security' | 'backup'
  >('school');

  // 1. School Info State
  const [schoolForm, setSchoolForm] = useState(schoolInfo);

  // 2. Teacher Modal State
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherForm, setTeacherForm] = useState<Omit<Teacher, 'id'>>({
    nameKh: '',
    nameEn: '',
    code: '',
    gender: 'ប្រុស',
    phone: '',
    email: '',
    subjectIds: [],
    gradeIds: [],
    status: 'active',
    isHomeroom: false,
    homeroomGrade: '',
  });

  // 3. Class Modal State
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<GradeClass | null>(null);
  const [classToDelete, setClassToDelete] = useState<GradeClass | null>(null);
  const [classForm, setClassForm] = useState<Omit<GradeClass, 'id'>>({
    nameKh: '',
    room: '',
    shift: 'ព្រឹក',
    studentCount: 40,
    academicYear: schoolInfo.academicYear || '២០២៥ - ២០២៦',
  });

  // 4. Subject Modal State
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState<Omit<Subject, 'id'>>({
    nameKh: '',
    nameEn: '',
    code: '',
    color: '#3b82f6',
    weeklyHours: 4,
  });

  // 5. Record Edit Modal
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [recordSearch, setRecordSearch] = useState('');

  // 6. Telegram State
  const [telegramForm, setTelegramForm] = useState(telegramConfig);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSendingSummary, setIsSendingSummary] = useState(false);

  // 7. Security / PIN
  const [newPin, setNewPin] = useState(adminPin);

  // 8. GPS Location Setup State
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('error', 'មិនគាំទ្រ GPS', 'ឧបករណ៍របស់អ្នកមិនគាំទ្រមុខងារ GPS ឡើយ។');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGettingLocation(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setSchoolForm((prev) => ({
          ...prev,
          geoFence: {
            enabled: prev.geoFence?.enabled ?? true,
            requireLocation: prev.geoFence?.requireLocation ?? true,
            latitude: lat,
            longitude: lng,
            radiusMeters: prev.geoFence?.radiusMeters || 500,
            schoolName: prev.nameKh || 'វិទ្យាល័យ ប៊ុនរ៉ានី ហ៊ុនសែន ព្រៃពោន',
          },
        }));
        showToast(
          'success',
          'ចាប់យកទីតាំង GPS បានជោគជ័យ',
          `Latitude: ${lat}, Longitude: ${lng}`
        );
      },
      (err) => {
        setGettingLocation(false);
        showToast(
          'error',
          'មិនអាចចាប់ទីតាំងបាន',
          err.message || 'សូមអនុញ្ញាតសិទ្ធិចូលប្រើប្រាស់ទីតាំង (Location Permission)។'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handlers for School Info
  const handleSaveSchoolInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolInfo(schoolForm);
  };

  // Handlers for Teacher
  const handleOpenTeacherModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setTeacherForm({
        nameKh: teacher.nameKh,
        nameEn: teacher.nameEn,
        code: teacher.code,
        gender: teacher.gender,
        phone: teacher.phone,
        email: teacher.email,
        subjectIds: teacher.subjectIds || [],
        gradeIds: teacher.gradeIds || [],
        status: teacher.status,
        isHomeroom: teacher.isHomeroom || false,
        homeroomGrade: teacher.homeroomGrade || '',
      });
    } else {
      setEditingTeacher(null);
      const nextCode = `TCH-${String(teachers.length + 1).padStart(3, '0')}`;
      setTeacherForm({
        nameKh: '',
        nameEn: '',
        code: nextCode,
        gender: 'ប្រុស',
        phone: '',
        email: '',
        subjectIds: subjects[0] ? [subjects[0].id] : [],
        gradeIds: classes[0] ? [classes[0].id] : [],
        status: 'active',
        isHomeroom: false,
        homeroomGrade: '',
      });
    }
    setTeacherModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.nameKh.trim() || !teacherForm.code.trim()) {
      showToast('error', 'ខ្វះព័ត៌មាន', 'សូមបញ្ចូលឈ្មោះ និងកូដគ្រូ');
      return;
    }
    if (editingTeacher) {
      updateTeacher(editingTeacher.id, teacherForm);
    } else {
      addTeacher(teacherForm);
    }
    setTeacherModalOpen(false);
  };

  // Handlers for Classes
  const handleOpenClassModal = (cls?: GradeClass) => {
    if (cls) {
      setEditingClass(cls);
      setClassForm({
        nameKh: cls.nameKh,
        room: cls.room,
        shift: cls.shift,
        studentCount: cls.studentCount,
        academicYear: cls.academicYear,
      });
    } else {
      setEditingClass(null);
      setClassForm({
        nameKh: '',
        room: '',
        shift: 'ព្រឹក',
        studentCount: 40,
        academicYear: schoolInfo.academicYear || '២០២៥ - ២០២៦',
      });
    }
    setClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.nameKh.trim()) {
      showToast('error', 'ខ្វះព័ត៌មាន', 'សូមបញ្ចូលឈ្មោះថ្នាក់រៀន');
      return;
    }
    if (editingClass) {
      updateClass(editingClass.id, classForm);
    } else {
      addClass(classForm);
    }
    setClassModalOpen(false);
  };

  // Handlers for Subjects
  const handleOpenSubjectModal = (subj?: Subject) => {
    if (subj) {
      setEditingSubject(subj);
      setSubjectForm({
        nameKh: subj.nameKh,
        nameEn: subj.nameEn,
        code: subj.code,
        color: subj.color,
        weeklyHours: subj.weeklyHours,
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        nameKh: '',
        nameEn: '',
        code: '',
        color: '#3b82f6',
        weeklyHours: 4,
      });
    }
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.nameKh.trim()) {
      showToast('error', 'ខ្វះព័ត៌មាន', 'សូមបញ្ចូលឈ្មោះមុខវិជ្ជា');
      return;
    }
    if (editingSubject) {
      updateSubject(editingSubject.id, subjectForm);
    } else {
      addSubject(subjectForm);
    }
    setSubjectModalOpen(false);
  };

  // Handlers for Telegram
  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    updateTelegramConfig(telegramForm);
  };

  const handleTestTelegram = async () => {
    updateTelegramConfig(telegramForm);
    setIsTestingTelegram(true);
    await sendTelegramTest();
    setIsTestingTelegram(false);
  };

  const handleSendTodaySummary = async () => {
    setIsSendingSummary(true);
    await sendDailySummaryTelegram();
    setIsSendingSummary(false);
  };

  // Handlers for Admin Pin Change
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      showToast('error', 'កូដខ្លីពេក', 'លេខកូដ PIN ត្រូវមានយ៉ាងហោចណាស់ ៤ ខ្ទង់');
      return;
    }
    const updatedPin = newPin.trim();
    setAdminPin(updatedPin);
    setIsAdminAuthenticated(false);
    setCurrentRole('teacher');
    setActiveTab('teacher_submit');
    showToast(
      'success',
      'បានប្តូរ PIN ជោគជ័យ',
      'លេខកូដ PIN ថ្មីត្រូវបានកំណត់។ ប្រព័ន្ធបានចាកចេញដោយស្វ័យប្រវត្តិ សូមប្រើលេខកូដថ្មីដើម្បីចូលម្តងទៀត។'
    );
  };

  // Filter records for the records oversight table
  const filteredRecords = attendanceRecords
    .filter((r) => {
      const teacher = teachers.find((t) => t.id === r.teacherId);
      const cls = classes.find((c) => c.id === r.gradeId);
      const subj = subjects.find((s) => s.id === r.subjectId);
      const text = `${teacher?.nameKh} ${cls?.nameKh} ${subj?.nameKh} ${r.date} ${r.lessonTopic}`.toLowerCase();
      return text.includes(recordSearch.toLowerCase());
    })
    .slice(0, 50);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner - Geometric Balance Deep Slate */}
      <div className="bg-[#0F172A] text-white rounded-2xl p-6 shadow-xs border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xs border border-blue-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60 uppercase">
                  Management Center
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-emerald-400 font-semibold">Active Session</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-khmer leading-tight text-white mt-1">
                ផ្ទាំងគ្រប់គ្រងទូទៅរបស់សាលារៀន (Admin Dashboard)
              </h2>
              <p className="text-xs text-slate-400 font-khmer mt-0.5">
                គ្រប់គ្រងព័ត៌មានសាលា បន្ថែមថ្នាក់រៀន បន្ថែមមុខវិជ្ជា បន្ថែមគ្រូបង្រៀន និងការកំណត់ Telegram Bot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAllDataJSON}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="ទាញយកទិន្នន័យបម្រុងទុក (Export JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ទាញយកទិន្នន័យ (Backup)</span>
            </button>
            <button
              onClick={() => setAdminTab('backup')}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              title="បញ្ចូលទិន្នន័យ (Import JSON)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>បញ្ចូលទិន្នន័យ (Restore)</span>
            </button>
            <button
              onClick={resetToDefaultData}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="កំណត់ទិន្នន័យគំរូដើមឡើងវិញ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          {[
            { id: 'school', label: 'ព័ត៌មានសាលារៀន', icon: Building2 },
            { id: 'teachers', label: 'គ្រប់គ្រងគ្រូបង្រៀន', icon: Users, badge: teachers.length },
            { id: 'timetables', label: 'កាលវិភាគបង្រៀន', icon: Calendar, badge: timetables.length },
            { id: 'classes', label: 'គ្រប់គ្រងថ្នាក់រៀន', icon: GraduationCap, badge: classes.length },
            { id: 'subjects', label: 'គ្រប់គ្រងមុខវិជ្ជា', icon: BookOpen, badge: subjects.length },
            { id: 'records', label: 'កែសម្រួលវត្តមាន', icon: Lock, badge: attendanceRecords.length },
            { id: 'telegram', label: 'ការកំណត់ Telegram Bot', icon: Send },
            { id: 'security', label: 'សុវត្ថិភាព / PIN', icon: KeyRound },
            { id: 'backup', label: 'បម្រុងទុក & ផ្ទេរទិន្នន័យ', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {toKhmerNumber(tab.badge)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: SCHOOL INFO */}
      {adminTab === 'school' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                  School Profile
                </span>
                <h3 className="font-bold text-base text-slate-900 font-khmer">
                  កែប្រែព័ត៌មានសាលារៀន និងរចនាសម្ព័ន្ធ
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ព័ត៌មាននេះនឹងត្រូវបង្ហាញលើក្បាលលិខិត របាយការណ៍ផ្លូវការ និងការផ្ញើសារ Telegram
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSchoolInfo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះសាលារៀន (ភាសាខ្មែរ)
                </label>
                <input
                  type="text"
                  value={schoolForm.nameKh}
                  onChange={(e) => setSchoolForm({ ...schoolForm, nameKh: e.target.value })}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះសាលារៀន (English)
                </label>
                <input
                  type="text"
                  value={schoolForm.nameEn}
                  onChange={(e) => setSchoolForm({ ...schoolForm, nameEn: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ក្រសួងសាមី
                </label>
                <input
                  type="text"
                  value={schoolForm.ministryKh}
                  onChange={(e) => setSchoolForm({ ...schoolForm, ministryKh: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  មន្ទីរអប់រំ យុវជន និងកីឡា
                </label>
                <input
                  type="text"
                  value={schoolForm.departmentKh}
                  onChange={(e) => setSchoolForm({ ...schoolForm, departmentKh: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ការិយាល័យអប់រំ ក្រុង/ស្រុក/ខណ្ឌ
                </label>
                <input
                  type="text"
                  value={schoolForm.districtOfficeKh}
                  onChange={(e) => setSchoolForm({ ...schoolForm, districtOfficeKh: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះលោកនាយក / នាយិកាសាលា
                </label>
                <input
                  type="text"
                  value={schoolForm.principalName}
                  onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឆ្នាំសិក្សា
                </label>
                <input
                  type="text"
                  value={schoolForm.academicYear}
                  onChange={(e) => setSchoolForm({ ...schoolForm, academicYear: e.target.value })}
                  placeholder="២០២៥ - ២០២៦"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឆមាសបច្ចុប្បន្ន
                </label>
                <select
                  value={schoolForm.currentSemester}
                  onChange={(e) =>
                    setSchoolForm({ ...schoolForm, currentSemester: e.target.value as any })
                  }
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs cursor-pointer"
                >
                  <option value="semester1">ឆមាសទី ១</option>
                  <option value="semester2">ឆមាសទី ២</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  លេខទូរស័ព្ទ & ទំនាក់ទំនង
                </label>
                <input
                  type="text"
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  អាសយដ្ឋានសាលារៀន
                </label>
                <input
                  type="text"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
              </div>

              {/* GPS Geofencing Settings */}
              <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 font-khmer">
                        ការកំណត់ទីតាំង GPS សាលារៀន (School Geofencing)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      កំណត់កូអរដោនេ GPS និងកាំបរិវេណសាលា ដើម្បីតម្រូវឱ្យគ្រូបង្រៀនចុះវត្តមានបានលុះត្រាតែស្ថិតនៅក្នុងបរិវេណសាលា
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${gettingLocation ? 'animate-spin' : ''}`} />
                    <span>{gettingLocation ? 'កំពុងចាប់យកទីតាំង...' : '📍 ចាប់យកទីតាំង GPS បច្ចុប្បន្ន'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="md:col-span-3 flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        តម្រូវឱ្យស្ថិតនៅក្នុងបរិវេណសាលាពេលចុះវត្តមាន (Require GPS Geofence)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ប្រសិនបើបើក គ្រូបង្រៀនដែលស្ថិតនៅក្រៅបរិវេណសាលានឹងមិនអាចចុចបញ្ជូនវត្តមានបានឡើយ
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schoolForm.geoFence?.requireLocation ?? true}
                        onChange={(e) =>
                          setSchoolForm({
                            ...schoolForm,
                            geoFence: {
                              ...(schoolForm.geoFence || {
                                enabled: true,
                                requireLocation: true,
                                latitude: 11.5367,
                                longitude: 105.2154,
                                radiusMeters: 500,
                                schoolName: schoolForm.nameKh,
                              }),
                              requireLocation: e.target.checked,
                              enabled: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      កាំបរិវេណអនុញ្ញាត (គិតជាម៉ែត្រ)
                    </label>
                    <input
                      type="number"
                      value={schoolForm.geoFence?.radiusMeters || 500}
                      onChange={(e) =>
                        setSchoolForm({
                          ...schoolForm,
                          geoFence: {
                            ...(schoolForm.geoFence || {
                              enabled: true,
                              requireLocation: true,
                              latitude: 11.5367,
                              longitude: 105.2154,
                              radiusMeters: 500,
                              schoolName: schoolForm.nameKh,
                            }),
                            radiusMeters: Math.max(50, Number(e.target.value) || 500),
                          },
                        })
                      }
                      min="50"
                      max="5000"
                      step="50"
                      className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">ឧទាហរណ៍៖ ៥០០ ម៉ែត្រ (កាំរង្វង់ពីចំណុចកណ្តាល)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      រយៈទទឹង Latitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={schoolForm.geoFence?.latitude ?? 11.5367}
                      onChange={(e) =>
                        setSchoolForm({
                          ...schoolForm,
                          geoFence: {
                            ...(schoolForm.geoFence || {
                              enabled: true,
                              requireLocation: true,
                              latitude: 11.5367,
                              longitude: 105.2154,
                              radiusMeters: 500,
                              schoolName: schoolForm.nameKh,
                            }),
                            latitude: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      រយៈបណ្តោយ Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={schoolForm.geoFence?.longitude ?? 105.2154}
                      onChange={(e) =>
                        setSchoolForm({
                          ...schoolForm,
                          geoFence: {
                            ...(schoolForm.geoFence || {
                              enabled: true,
                              requireLocation: true,
                              latitude: 11.5367,
                              longitude: 105.2154,
                              radiusMeters: 500,
                              schoolName: schoolForm.nameKh,
                            }),
                            longitude: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                    />
                  </div>

                  {schoolForm.geoFence?.latitude && schoolForm.geoFence?.longitude && (
                    <div className="md:col-span-3 flex items-center justify-between text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-mono text-[11px]">
                        📍 ទីតាំងបច្ចុប្បន្ន៖ {schoolForm.geoFence.latitude}, {schoolForm.geoFence.longitude} (កាំ៖ {schoolForm.geoFence.radiusMeters || 500}m)
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${schoolForm.geoFence.latitude},${schoolForm.geoFence.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline"
                      >
                        <span>បើកក្នុង Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>រក្សាទុកព័ត៌មានសាលារៀន</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: TEACHERS MANAGEMENT */}
      {adminTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                  Faculty
                </span>
                <h3 className="font-bold text-base text-slate-900 font-khmer">
                  គ្រប់គ្រង និងបន្ថែមគ្រូបង្រៀន ({toKhmerNumber(teachers.length)} នាក់)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                បន្ថែម កែប្រែ ឬលុបព័ត៌មានលោកគ្រូ-អ្នកគ្រូ និងកាលវិភាគបង្រៀនក្នុងប្រព័ន្ធ
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="ស្វែងរកគ្រូបង្រៀន..."
                  className="pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-hidden w-48 sm:w-60 font-khmer"
                />
              </div>

              <button
                id="btn-add-new-teacher"
                onClick={() => handleOpenTeacherModal()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>បន្ថែមគ្រូថ្មី</span>
              </button>
            </div>
          </div>

          {/* Teachers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers
              .filter((t) => {
                if (!teacherSearch.trim()) return true;
                const q = teacherSearch.toLowerCase();
                const subjNames = subjects
                  .filter((s) => t.subjectIds?.includes(s.id))
                  .map((s) => s.nameKh)
                  .join(' ')
                  .toLowerCase();
                return (
                  t.nameKh.toLowerCase().includes(q) ||
                  (t.nameEn && t.nameEn.toLowerCase().includes(q)) ||
                  t.code.toLowerCase().includes(q) ||
                  t.phone.includes(q) ||
                  subjNames.includes(q)
                );
              })
              .map((teacher) => {
                const teacherSubjs = subjects
                  .filter((s) => teacher.subjectIds?.includes(s.id))
                  .map((s) => s.nameKh)
                  .join(', ');

                return (
                  <div
                    key={teacher.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-[#0F172A] text-blue-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-slate-800 font-mono">
                            {teacher.gender === 'ស្រី' ? 'អ' : 'ល'}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 font-khmer">
                              {teacher.nameKh}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {teacher.nameEn || teacher.code} • ភេទ: {teacher.gender}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            teacher.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {teacher.status === 'active' ? 'កំពុងបង្រៀន' : 'ផ្អាក'}
                        </span>
                      </div>

                      <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <p>
                          <b>កូដសម្គាល់៖</b> <span className="font-mono font-bold text-slate-800">{teacher.code}</span>
                        </p>
                        <p>
                          <b>ទូរស័ព្ទ៖</b> {teacher.phone || 'មិនទាន់កំណត់'}
                        </p>
                        <p>
                          <b>មុខវិជ្ជា៖</b> {teacherSubjs || 'មិនទាន់កំណត់'}
                        </p>
                        {teacher.isHomeroom && (
                          <p className="text-blue-700 font-bold">
                            🏫 គ្រូប្រចាំថ្នាក់៖ {teacher.homeroomGrade}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 mt-4">
                      <button
                        onClick={() => handleOpenTeacherModal(teacher)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-khmer"
                        title="កែប្រែព័ត៌មានគ្រូ"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>កែប្រែ</span>
                      </button>
                      <button
                        onClick={() => setTeacherToDelete(teacher)}
                        className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-khmer"
                        title="លុបគ្រូបង្រៀននេះចេញពីប្រព័ន្ធ"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>លុបគ្រូ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB: TIMETABLES */}
      {adminTab === 'timetables' && <TeacherTimetableView />}

      {/* TAB 3: CLASSES MANAGEMENT */}
      {adminTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                  Classes & Rooms
                </span>
                <h3 className="font-bold text-base text-slate-900 font-khmer">
                  គ្រប់គ្រង និងបន្ថែមថ្នាក់រៀន ({toKhmerNumber(classes.length)} ថ្នាក់)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                បន្ថែម កែប្រែ ឬលុបកម្រិតថ្នាក់ និងបន្ទប់សិក្សា
              </p>
            </div>

            <button
              id="btn-add-new-class"
              onClick={() => handleOpenClassModal()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>បន្ថែមថ្នាក់រៀនថ្មី</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-slate-900 font-khmer">
                      {cls.nameKh}
                    </h4>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      វេន{cls.shift}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p>
                      <b>ទីតាំងបន្ទប់៖</b> {cls.room}
                    </p>
                    <p>
                      <b>ចំនួនសិស្ស៖</b> {toKhmerNumber(cls.studentCount)} នាក់
                    </p>
                    <p>
                      <b>ឆ្នាំសិក្សា៖</b> {cls.academicYear}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => handleOpenClassModal(cls)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-khmer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>កែប្រែ</span>
                  </button>
                  <button
                    onClick={() => setClassToDelete(cls)}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-khmer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>លុប</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUBJECTS MANAGEMENT */}
      {adminTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                  Curriculum
                </span>
                <h3 className="font-bold text-base text-slate-900 font-khmer">
                  គ្រប់គ្រង និងបន្ថែមមុខវិជ្ជា ({toKhmerNumber(subjects.length)} មុខវិជ្ជា)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                កំណត់មុខវិជ្ជា កូដ និងបន្ទុកម៉ោងបង្រៀនប្រចាំសប្តាហ៍
              </p>
            </div>

            <button
              id="btn-add-new-subject"
              onClick={() => handleOpenSubjectModal()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>បន្ថែមមុខវិជ្ជាថ្មី</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjects.map((subj) => (
              <div
                key={subj.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subj.color }}
                    />
                    <h4 className="font-bold text-sm text-slate-900 font-khmer">
                      {subj.nameKh}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{subj.nameEn}</p>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                    <p>
                      <b>កូដមុខវិជ្ជា៖</b> <span className="font-mono font-bold text-slate-800">{subj.code}</span>
                    </p>
                    <p>
                      <b>ម៉ោងប្រចាំសប្តាហ៍៖</b> {toKhmerNumber(subj.weeklyHours)} ម៉ោង
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => handleOpenSubjectModal(subj)}
                    className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-khmer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>កែប្រែ</span>
                  </button>
                  <button
                    onClick={() => setSubjectToDelete(subj)}
                    className="px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-khmer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>លុប</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ATTENDANCE RECORDS OVERSIGHT & EDIT */}
      {adminTab === 'records' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                  Audit & Corrections
                </span>
                <h3 className="font-bold text-base text-slate-900 font-khmer">
                  ផ្ទាំងត្រួតពិនិត្យ និងកែសម្រួលកំណត់ត្រាវត្តមាន (Admin Oversight)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                មានតែ Admin ប៉ុណ្ណោះដែលអាចដោះសោ និងកែសម្រួលទិន្នន័យដែលគ្រូបានចុះវត្តមានខុស
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                placeholder="ស្វែងរកតាមឈ្មោះគ្រូ, ថ្នាក់, ថ្ងៃ..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden shadow-2xs"
              />
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-[#0F172A] text-white font-bold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">កាលបរិច្ឆេទ</th>
                  <th className="py-3 px-3">ឈ្មោះគ្រូបង្រៀន</th>
                  <th className="py-3 px-3">ម៉ោងបង្រៀន</th>
                  <th className="py-3 px-3">ថ្នាក់រៀន</th>
                  <th className="py-3 px-3">មុខវិជ្ជា</th>
                  <th className="py-3 px-3">ស្ថានភាព</th>
                  <th className="py-3 px-3">មេរៀន / មូលហេតុ</th>
                  <th className="py-3 px-3 text-right">សកម្មភាព Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => {
                  const teacher = teachers.find((t) => t.id === rec.teacherId);
                  const cls = classes.find((c) => c.id === rec.gradeId);
                  const subj = subjects.find((s) => s.id === rec.subjectId);
                  const meta = STATUS_META[rec.status] || { labelKh: rec.status, bg: 'bg-slate-100' };

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 font-mono text-[11px]">
                        {rec.date}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 font-khmer">
                        {teacher?.nameKh || 'មិនស្គាល់'}
                      </td>
                      <td className="py-3 px-3 text-slate-700">{rec.sessionPeriod}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{cls?.nameKh}</td>
                      <td className="py-3 px-3 text-slate-700">{subj?.nameKh}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.bg}`}
                        >
                          {meta.labelKh}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {rec.lessonTopic} {rec.reason ? `(${rec.reason})` : ''}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingRecord(rec)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="កែប្រែទិន្នន័យ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('តើអ្នកពិតជាចង់លុបកំណត់ត្រានេះមែនទេ?')) {
                                adminDeleteRecord(rec.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="លុប"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: TELEGRAM BOT AUTOMATION SETTINGS */}
      {adminTab === 'telegram' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#0F172A] text-blue-400 flex items-center justify-center border border-slate-800">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                    Instant Telegram Alerts
                  </span>
                  <h3 className="font-bold text-base text-slate-900 font-khmer">
                    ការកំណត់ Telegram Bot & មុខងារបញ្ជូនទិន្នន័យស្វ័យប្រវត្តិ
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  ជូនដំណឹងវត្តមានទៅកាន់អ្នកគ្រប់គ្រង និងនាយកសាលាភ្លាមៗតាម Telegram
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendTodaySummary}
                disabled={isSendingSummary}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingSummary ? 'កំពុងផ្ញើ...' : 'ផ្ញើរបាយការណ៍ថ្ងៃនេះឥឡូវនេះ'}</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveTelegram} className="space-y-5">
            {/* Enable Main Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 font-khmer">
                  បើកដំណើរការការជូនដំណឹងតាម Telegram (Enable Telegram Integration)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  បើកដើម្បីអនុញ្ញាតឱ្យប្រព័ន្ធបញ្ជូនសារស្វ័យប្រវត្តិតាម Telegram
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramForm.isEnabled}
                  onChange={(e) =>
                    setTelegramForm({ ...telegramForm, isEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telegram Bot Token (ទទួលបានពី @BotFather)
                </label>
                <input
                  type="password"
                  value={telegramForm.botToken}
                  onChange={(e) =>
                    setTelegramForm({ ...telegramForm, botToken: e.target.value })
                  }
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  បង្កើត Bot ថ្មីនៅលើ Telegram តាមរយៈ <code>@BotFather</code> រួចចម្លង HTTP API Token មកដាក់ទីនេះ
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Chat ID / Group ID (ទទួលបានពី @userinfobot)
                </label>
                <input
                  type="text"
                  value={telegramForm.chatId}
                  onChange={(e) =>
                    setTelegramForm({ ...telegramForm, chatId: e.target.value })
                  }
                  placeholder="ឧ. 123456789 ឬ -100123456789 (សម្រាប់ Group)"
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ID គណនី Telegram របស់អ្នកគ្រប់គ្រង ឬ ID នៃ Group Admin សាលារៀន
                </p>
              </div>
            </div>

            {/* Automation Checkboxes */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                លក្ខខណ្ឌបញ្ជូនសារស្វ័យប្រវត្តិ (Automation Triggers)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={telegramForm.autoSendOnTeacherSubmit}
                    onChange={(e) =>
                      setTelegramForm({
                        ...telegramForm,
                        autoSendOnTeacherSubmit: e.target.checked,
                      })
                    }
                    className="mt-0.5 text-blue-600 rounded-md border-slate-300"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">ពេលគ្រូចុះវត្តមាន</p>
                    <p className="text-[11px] text-slate-500">
                      ផ្ញើភ្លាមៗពេលគ្រូបានបំពេញ និងចាក់សោ
                    </p>
                  </div>
                </label>

                <label className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={telegramForm.autoSendDailySummary}
                    onChange={(e) =>
                      setTelegramForm({
                        ...telegramForm,
                        autoSendDailySummary: e.target.checked,
                      })
                    }
                    className="mt-0.5 text-blue-600 rounded-md border-slate-300"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">សង្ខេបប្រចាំថ្ងៃ</p>
                    <p className="text-[11px] text-slate-500">
                      របាយការណ៍បូកសរុបម៉ោងបង្រៀនប្រចាំថ្ងៃ
                    </p>
                  </div>
                </label>

                <label className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={telegramForm.autoSendAlertOnAbsence}
                    onChange={(e) =>
                      setTelegramForm({
                        ...telegramForm,
                        autoSendAlertOnAbsence: e.target.checked,
                      })
                    }
                    className="mt-0.5 text-blue-600 rounded-md border-slate-300"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">ដំណឹងស្នើសុំច្បាប់</p>
                    <p className="text-[11px] text-slate-500">
                      ផ្ញើដំណឹងភ្លាមពេលមានពាក្យសុំច្បាប់ថ្មី
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Test Connection & Save Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                id="btn-test-telegram-connection"
                onClick={handleTestTelegram}
                disabled={isTestingTelegram}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isTestingTelegram ? 'កំពុងធ្វើតេស្ត...' : 'ធ្វើតេស្តការតភ្ជាប់ (Test Connection)'}</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>រក្សាទុកការកំណត់ Telegram</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 7: SECURITY & PIN */}
      {adminTab === 'security' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs max-w-md">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
              Security
            </span>
            <h3 className="font-bold text-base text-slate-900 font-khmer">
              ផ្លាស់ប្តូរលេខកូដសម្ងាត់ Admin PIN
            </h3>
          </div>

          <form onSubmit={handleSavePin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                លេខកូដ PIN ថ្មី (យ៉ាងហោចណាស់ ៤ ខ្ទង់)
              </label>
              <input
                type="text"
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full text-center text-lg font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 outline-hidden tracking-widest"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                កូដបច្ចុប្បន្ន៖ <code>{adminPin}</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              រក្សាទុក PIN ថ្មី
            </button>
          </form>
        </div>
      )}

      {/* TAB 8: BACKUP & RESTORE */}
      {adminTab === 'backup' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                Data Management
              </span>
              <h3 className="font-bold text-base text-slate-900 font-khmer">
                បម្រុងទុក និង ផ្ទេរទិន្នន័យ (Backup & Restore Data)
              </h3>
            </div>

            <p className="text-xs text-slate-600 font-khmer leading-relaxed mb-6">
              លោកអ្នកអាចទាញយកទិន្នន័យទាំងអស់ (ព័ត៌មានសាលា បញ្ជីគ្រូ កាលវិភាគ ថ្នាក់រៀន មុខវិជ្ជា និងវត្តមាន) ទៅជាឯកសារ <b>.JSON</b> ដើម្បីរក្សាទុក ឬផ្ទេរទៅកាន់ <b>GitHub Pages</b> / ឧបករណ៍ផ្សេងទៀតបានយ៉ាងងាយស្រួល។
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Card */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 font-khmer mb-1">
                    ទាញយកទិន្នន័យបម្រុងទុក (Export)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    ទាញយកឯកសារ JSON នៃទិន្នន័យបច្ចុប្បន្នរបស់អ្នកមករក្សាទុកក្នុងកុំព្យូទ័រ
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-export-backup-json"
                  onClick={exportAllDataJSON}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ទាញយក File JSON ឥឡូវនេះ</span>
                </button>
              </div>

              {/* Import Card */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 font-khmer mb-1">
                    បញ្ចូលទិន្នន័យពីឯកសារ (Import / Restore)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    ជ្រើសរើសឯកសារ JSON ដែលបានទាញយកពីមុន ដើម្បីផ្ទុកទិន្នន័យចូលប្រព័ន្ធ
                  </p>
                </div>

                <label className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
                  <Upload className="w-4 h-4" />
                  <span>ជ្រើសរើស File JSON បញ្ចូល</span>
                  <input
                    type="file"
                    id="input-import-backup-json"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content) {
                          importAllDataJSON(content);
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Edit Modal */}
      {teacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 font-khmer pb-3 border-b border-slate-100">
              {editingTeacher ? 'កែប្រែព័ត៌មានគ្រូបង្រៀន' : 'បន្ថែមគ្រូបង្រៀនថ្មី'}
            </h3>

            <form onSubmit={handleSaveTeacher} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ឈ្មោះជាភាសាខ្មែរ *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.nameKh}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nameKh: e.target.value })}
                    placeholder="ឧ. លោកគ្រូ សុខ ចាន់"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ឈ្មោះជាអក្សរឡាតាំង
                  </label>
                  <input
                    type="text"
                    value={teacherForm.nameEn}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nameEn: e.target.value })}
                    placeholder="Sok Chan"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    កូដគ្រូ *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.code}
                    onChange={(e) => setTeacherForm({ ...teacherForm, code: e.target.value })}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ភេទ
                  </label>
                  <select
                    value={teacherForm.gender}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, gender: e.target.value as any })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                  >
                    <option value="ប្រុស">ប្រុស</option>
                    <option value="ស្រី">ស្រី</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ស្ថានភាព
                  </label>
                  <select
                    value={teacherForm.status}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, status: e.target.value as any })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                  >
                    <option value="active">កំពុងបង្រៀន</option>
                    <option value="inactive">ផ្អាកបង្រៀន</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  លេខទូរស័ព្ទ
                </label>
                <input
                  type="text"
                  value={teacherForm.phone}
                  onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  placeholder="012 345 678"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  មុខវិជ្ជាបង្រៀន
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {subjects.map((subj) => (
                    <label key={subj.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={teacherForm.subjectIds.includes(subj.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setTeacherForm((prev) => ({
                            ...prev,
                            subjectIds: checked
                              ? [...prev.subjectIds, subj.id]
                              : prev.subjectIds.filter((id) => id !== subj.id),
                          }));
                        }}
                        className="rounded-sm text-blue-600"
                      />
                      <span>{subj.nameKh}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ថ្នាក់ដែលត្រូវបង្រៀន
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {classes.map((cls) => (
                    <label key={cls.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={teacherForm.gradeIds.includes(cls.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setTeacherForm((prev) => ({
                            ...prev,
                            gradeIds: checked
                              ? [...prev.gradeIds, cls.id]
                              : prev.gradeIds.filter((id) => id !== cls.id),
                          }));
                        }}
                        className="rounded-sm text-blue-600"
                      />
                      <span>{cls.nameKh}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">ជាគ្រូប្រចាំថ្នាក់ (Homeroom)</p>
                  {teacherForm.isHomeroom && (
                    <input
                      type="text"
                      value={teacherForm.homeroomGrade}
                      onChange={(e) =>
                        setTeacherForm({ ...teacherForm, homeroomGrade: e.target.value })
                      }
                      placeholder="ថ្នាក់ទី ១២A"
                      className="mt-1 text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
                    />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={teacherForm.isHomeroom}
                  onChange={(e) =>
                    setTeacherForm({ ...teacherForm, isHomeroom: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded-md"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {editingTeacher && (
                  <button
                    type="button"
                    onClick={() => {
                      const tch = editingTeacher;
                      setTeacherModalOpen(false);
                      setTeacherToDelete(tch);
                    }}
                    className="px-3 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer flex items-center gap-1.5 font-khmer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>លុបគ្រូនេះ</span>
                  </button>
                )}
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setTeacherModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer font-khmer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer font-khmer"
                  >
                    រក្សាទុក
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Edit Modal */}
      {classModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 font-khmer pb-3 border-b border-slate-100">
              {editingClass ? 'កែប្រែថ្នាក់រៀន' : 'បន្ថែមថ្នាក់រៀនថ្មី'}
            </h3>

            <form onSubmit={handleSaveClass} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះថ្នាក់រៀន *
                </label>
                <input
                  type="text"
                  required
                  value={classForm.nameKh}
                  onChange={(e) => setClassForm({ ...classForm, nameKh: e.target.value })}
                  placeholder="ឧ. ថ្នាក់ទី ៧A"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ទីតាំងបន្ទប់
                </label>
                <input
                  type="text"
                  value={classForm.room}
                  onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                  placeholder="បន្ទប់ A-101"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    វេនសិក្សា
                  </label>
                  <select
                    value={classForm.shift}
                    onChange={(e) =>
                      setClassForm({ ...classForm, shift: e.target.value as any })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                  >
                    <option value="ព្រឹក">ព្រឹក</option>
                    <option value="រសៀល">រសៀល</option>
                    <option value="ពេញមួយថ្ងៃ">ពេញមួយថ្ងៃ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ចំនួនសិស្ស
                  </label>
                  <input
                    type="number"
                    value={classForm.studentCount}
                    onChange={(e) =>
                      setClassForm({ ...classForm, studentCount: Number(e.target.value) })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Edit Modal */}
      {subjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 font-khmer pb-3 border-b border-slate-100">
              {editingSubject ? 'កែប្រែមុខវិជ្ជា' : 'បន្ថែមមុខវិជ្ជាថ្មី'}
            </h3>

            <form onSubmit={handleSaveSubject} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះមុខវិជ្ជា (ខ្មែរ) *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.nameKh}
                  onChange={(e) => setSubjectForm({ ...subjectForm, nameKh: e.target.value })}
                  placeholder="ឧ. គណិតវិទ្យា"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះមុខវិជ្ជា (English)
                </label>
                <input
                  type="text"
                  value={subjectForm.nameEn}
                  onChange={(e) => setSubjectForm({ ...subjectForm, nameEn: e.target.value })}
                  placeholder="Mathematics"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    កូដមុខវិជ្ជា
                  </label>
                  <input
                    type="text"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    placeholder="MATH"
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ម៉ោងប្រចាំសប្តាហ៍
                  </label>
                  <input
                    type="number"
                    value={subjectForm.weeklyHours}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, weeklyHours: Number(e.target.value) })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ពណ៌សម្គាល់
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={subjectForm.color}
                    onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono text-slate-600">{subjectForm.color}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Edit Modal for Admin */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 font-khmer pb-3 border-b border-slate-100">
              កែប្រែទិន្នន័យវត្តមាន (Admin Adjust)
            </h3>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ស្ថានភាពវត្តមាន
                </label>
                <select
                  value={editingRecord.status}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      status: e.target.value as AttendanceStatus,
                    })
                  }
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                >
                  <option value="present">វត្តមាន (Present)</option>
                  <option value="late">មកយឺត (Late)</option>
                  <option value="permission">មានច្បាប់ (Permission)</option>
                  <option value="absent">ឥតច្បាប់ (Absent)</option>
                  <option value="mission">បេសកកម្ម (Mission)</option>
                  <option value="substitute">បង្រៀនជំនួស (Substitute)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ចំណងជើងមេរៀន / សកម្មភាព
                </label>
                <input
                  type="text"
                  value={editingRecord.lessonTopic}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, lessonTopic: e.target.value })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  មូលហេតុ / កំណត់សម្គាល់
                </label>
                <input
                  type="text"
                  value={editingRecord.reason || ''}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, reason: e.target.value })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  adminUpdateRecord(editingRecord.id, editingRecord);
                  setEditingRecord(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
              >
                រក្សាទុកការកែសម្រួល
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Teacher Deletion Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-khmer">
                  បញ្ជាក់ការលុបគ្រូបង្រៀន
                </h3>
                <p className="text-xs text-slate-500 font-khmer">
                  តើអ្នកពិតជាចង់លុបគ្រូបង្រៀនរូបនេះចេញពីប្រព័ន្ធមែនទេ?
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3 font-khmer">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">ឈ្មោះគ្រូបង្រៀន៖</span>
                  <span className="font-bold text-slate-900 text-sm">{teacherToDelete.nameKh}</span>
                </div>
                {teacherToDelete.nameEn && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ឈ្មោះឡាតាំង៖</span>
                    <span className="font-semibold text-slate-700">{teacherToDelete.nameEn}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">កូដសម្គាល់៖</span>
                  <span className="font-mono font-bold text-slate-800">{teacherToDelete.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">លេខទូរស័ព្ទ៖</span>
                  <span className="text-slate-700">{teacherToDelete.phone || 'មិនមាន'}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>ចំណាំ៖</strong> រាល់ព័ត៌មានកាលវិភាគបង្រៀនប្រចាំសប្តាហ៍របស់លោកគ្រូ/អ្នកគ្រូ <strong>{teacherToDelete.nameKh}</strong> នឹងត្រូវបានលុបចេញពីប្រព័ន្ធដោយស្វ័យប្រវត្តិ។
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 font-khmer">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  const tch = teacherToDelete;
                  deleteTeacher(tch.id);
                  setTeacherToDelete(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>យល់ព្រមលុបគ្រូ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Deletion Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 font-khmer">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  បញ្ជាក់ការលុបថ្នាក់រៀន
                </h3>
                <p className="text-xs text-slate-500">
                  តើអ្នកពិតជាចង់លុប <strong>{classToDelete.nameKh}</strong> មែនទេ?
                </p>
              </div>
            </div>

            <div className="py-4 text-xs text-slate-600">
              <p>
                ការលុបនេះនឹងដកថ្នាក់រៀន <strong>{classToDelete.nameKh}</strong> (បន្ទប់ {classToDelete.room}) ចេញពីប្រព័ន្ធ។
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteClass(classToDelete.id);
                  setClassToDelete(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>យល់ព្រមលុបថ្នាក់</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Deletion Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 font-khmer">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  បញ្ជាក់ការលុបមុខវិជ្ជា
                </h3>
                <p className="text-xs text-slate-500">
                  តើអ្នកពិតជាចង់លុបមុខវិជ្ជា <strong>{subjectToDelete.nameKh}</strong> មែនទេ?
                </p>
              </div>
            </div>

            <div className="py-4 text-xs text-slate-600">
              <p>
                ការលុបនេះនឹងដកមុខវិជ្ជា <strong>{subjectToDelete.nameKh}</strong> ({subjectToDelete.code}) ចេញពីកម្មវិធីសិក្សា។
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSubject(subjectToDelete.id);
                  setSubjectToDelete(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>យល់ព្រមលុបមុខវិជ្ជា</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
