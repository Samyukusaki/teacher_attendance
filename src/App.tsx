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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white antialiased">
        <div>
          <Navbar />
          <MainContent />
        </div>

        {/* Footer (Hidden when printing) */}
        <footer className="mt-12 py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 font-khmer no-print">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <p>
                © ២០២៦ <b>ប្រព័ន្ធគ្រប់គ្រងវត្តមានគ្រូបង្រៀន (Teacher Attendance Management System)</b>
              </p>
            </div>
            <p className="text-slate-400">
              គាំទ្រការជូនដំណឹងស្វ័យប្រវត្តិតាម Telegram Bot • សុវត្ថិភាពទិន្នន័យចាក់សោ
            </p>
          </div>
        </footer>

        <Toast />
      </div>
    </AppProvider>
  );
}
