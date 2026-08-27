import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { TeacherAttendanceView } from './components/TeacherAttendanceView';
import { WeeklyAttendanceView } from './components/WeeklyAttendanceView';
import { MonthlySemesterView } from './components/MonthlySemesterView';
import { ReportsView } from './components/ReportsView';
import { LeaveRequestsView } from './components/LeaveRequestsView';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherTimetableView } from './components/TeacherTimetableView';
import { Toast } from './components/Toast';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full">
      {activeTab === 'teacher_submit' && <TeacherAttendanceView />}
      {activeTab === 'timetables' && <TeacherTimetableView />}
      {activeTab === 'weekly' && <WeeklyAttendanceView />}
      {activeTab === 'monthly_semester' && <MonthlySemesterView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'leave_requests' && <LeaveRequestsView />}
      {activeTab === 'admin_dashboard' && <AdminDashboard />}
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white antialiased overflow-x-hidden">
        <div className="w-full">
          <Navbar />
          <MainContent />
        </div>

        {/* Footer (Hidden when printing) */}
        <footer className="mt-8 sm:mt-12 py-5 sm:py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 font-khmer no-print">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
              <p className="text-[11px] sm:text-xs">
                © ២០២៦ <b>ប្រព័ន្ធគ្រប់គ្រងវត្តមានគ្រូបង្រៀន (Teacher Attendance System)</b>
              </p>
            </div>
            <p className="text-slate-400 text-[10px] sm:text-xs">
              គាំទ្រ Cloud Firestore & Telegram Bot • ដំណើរការរលូនលើគ្រប់ឧបករណ៍
            </p>
          </div>
        </footer>

        <Toast />
      </div>
    </AppProvider>
  );
}
