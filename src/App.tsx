import React, { useState } from 'react';
import { LeaveProvider, useLeave } from './context/LeaveContext';
import { LoginView } from './components/LoginView';
import { Dashboard } from './components/Dashboard';
import { LeaveRequestForm } from './components/LeaveRequestForm';
import { ApprovalInbox } from './components/ApprovalInbox';
import { LeaveRosterBoard } from './components/LeaveRosterBoard';
import { PersonnelManagement } from './components/PersonnelManagement';
import { LeaveHistory } from './components/LeaveHistory';
import { LeaveReports } from './components/LeaveReports';
import { SettingsModal } from './components/SettingsModal';
import { LeaveDetailModal } from './components/LeaveDetailModal';
import { OfficialLeaveDocument } from './components/OfficialLeaveDocument';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { AuditLogModal } from './components/AuditLogModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { LeaveRequest } from './types/leave';
import { 
  Home, FileEdit, Inbox, Calendar, Users, History, 
  BarChart3, Settings, LogOut, Bell, Search, Shield, 
  Menu, X, Database, Clock, ChevronRight, UserCircle 
} from 'lucide-react';

function MainApp() {
  const { 
    currentUser, 
    logout, 
    stationConfig, 
    notifications,
    leaves 
  } = useLeave();

  // Navigation state
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'submit_leave' | 'inbox' | 'roster_board' | 'personnel' | 'history' | 'reports' | 'print_a4'
  >('dashboard');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [printLeaveTarget, setPrintLeaveTarget] = useState<LeaveRequest | null>(null);

  // If no user is logged in, show LoginView first (Requirement 76)
  if (!currentUser) {
    return <LoginView onSuccess={() => setCurrentView('dashboard')} />;
  }

  const role = currentUser.role;
  const isRegularUser = role === 'personnel';
  const isAdmin = role === 'admin';
  const isSuperintendent = role === 'superintendent';
  const isApproverOrLeader = ['supervisor', 'checker', 'approver', 'admin', 'superintendent'].includes(role);

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingInboxCount = leaves.filter(l => ['pending_supervisor', 'pending_checker', 'pending_approver'].includes(l.status)).length;

  const handleSelectLeave = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
  };

  const handleSelectLeaveId = (leaveId: string) => {
    const target = leaves.find(l => l.id === leaveId);
    if (target) {
      setSelectedLeave(target);
    }
  };

  const handlePrintA4 = (leave: LeaveRequest) => {
    setPrintLeaveTarget(leave);
    setCurrentView('print_a4');
  };

  // Printable Document View
  if (currentView === 'print_a4' && printLeaveTarget) {
    return (
      <OfficialLeaveDocument
        leave={printLeaveTarget}
        config={stationConfig}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row antialiased text-stone-900 font-sans">
      {/* Mobile Top Header (Requirement 14: Responsive on phone/iPad/desktop) */}
      <header className="md:hidden bg-linear-to-r from-rose-950 via-rose-900 to-rose-950 text-white p-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/10 text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-sm truncate">สภ.ศรีสงคราม</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative p-2 rounded-lg bg-white/10 text-white"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-linear-to-b from-rose-950 via-rose-900 to-rose-950 text-white transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto shrink-0 flex flex-col justify-between shadow-2xl md:shadow-none ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Brand */}
        <div className="p-5 border-b border-rose-800/40">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Police Shield"
              className="w-12 h-12 object-contain drop-shadow"
            />
            <div>
              <h2 className="font-bold text-sm leading-tight text-white">
                สภ.ศรีสงคราม
              </h2>
              <p className="text-[11px] text-amber-300 font-medium">
                ระบบลาออนไลน์
              </p>
              <p className="text-[10px] text-rose-300 font-mono">
                ภ.จว.นครพนม ภาค 4
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Links (Requirement 81: Personnel role sees only Dashboard & Submit) */}
        <nav className="flex-1 overflow-y-auto p-3.5 space-y-1 text-xs font-bold">
          {/* 1. Dashboard (All roles) */}
          <button
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
              currentView === 'dashboard'
                ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                : 'text-stone-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* 2. ยื่นใบลาออนไลน์ (All roles) */}
          <button
            onClick={() => {
              setCurrentView('submit_leave');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
              currentView === 'submit_leave'
                ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                : 'text-stone-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>ยื่นใบลาออนไลน์</span>
          </button>

          {/* Requirement 81: สิทธิ์บุคลากร ให้เห็นเฉพาะ หน้า 1.Dashboard 2.ยื่นใบลาออนไลน์ เท่านั้น! */}
          {!isRegularUser && (
            <>
              {/* 3. กล่องข้อความอนุมัติการลา */}
              <button
                onClick={() => {
                  setCurrentView('inbox');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                  currentView === 'inbox'
                    ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                    : 'text-stone-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4" />
                  <span>อนุมัติการลา</span>
                </div>
                {pendingInboxCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    currentView === 'inbox' ? 'bg-rose-950 text-white' : 'bg-amber-400 text-stone-950'
                  }`}>
                    {pendingInboxCount}
                  </span>
                )}
              </button>

              {/* 4. แผงการลาข้าราชการตำรวจ (Real-time) */}
              <button
                onClick={() => {
                  setCurrentView('roster_board');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  currentView === 'roster_board'
                    ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                    : 'text-stone-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>แผงการลาข้าราชการตำรวจ</span>
              </button>

              {/* 5. ข้อมูลบุคลากร (Requirement 76: เฉพาะแอดมินเท่านั้น) */}
              {(isAdmin || isSuperintendent) && (
                <button
                  onClick={() => {
                    setCurrentView('personnel');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                    currentView === 'personnel'
                      ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                      : 'text-stone-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>ข้อมูลบุคลากร (72 นาย)</span>
                </button>
              )}

              {/* 6. ประวัติการลา */}
              <button
                onClick={() => {
                  setCurrentView('history');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  currentView === 'history'
                    ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                    : 'text-stone-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>ประวัติการลา</span>
              </button>

              {/* 7. สถิติและรายงาน */}
              <button
                onClick={() => {
                  setCurrentView('reports');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  currentView === 'reports'
                    ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                    : 'text-stone-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>สถิติและรายงาน</span>
              </button>
            </>
          )}

          {/* Regular user can view own leave history */}
          {isRegularUser && (
            <button
              onClick={() => {
                setCurrentView('history');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                currentView === 'history'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                  : 'text-stone-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>ประวัติการลาของฉัน</span>
            </button>
          )}

          <div className="pt-3 border-t border-rose-800/40 space-y-1">
            {/* System Settings (Admin / Superintendent) */}
            {(isAdmin || isSuperintendent) && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-rose-200 hover:bg-white/10 hover:text-white transition"
              >
                <Settings className="w-4 h-4" />
                <span>ตั้งค่าระบบ/สถานี</span>
              </button>
            )}

            {/* Audit Log (Requirement 34) */}
            {(isAdmin || isSuperintendent) && (
              <button
                onClick={() => setAuditLogOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-rose-200 hover:bg-white/10 hover:text-white transition"
              >
                <Shield className="w-4 h-4" />
                <span>ประวัติการใช้งาน (Audit)</span>
              </button>
            )}

            {/* Backup & Restore (Requirement 61 & 62) */}
            {(isAdmin || isSuperintendent) && (
              <button
                onClick={() => setBackupOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-rose-200 hover:bg-white/10 hover:text-white transition"
              >
                <Database className="w-4 h-4" />
                <span>สำรอง/กู้คืนข้อมูล</span>
              </button>
            )}
          </div>
        </nav>

        {/* Sidebar Footer: User Card & Logout (Requirement 11) */}
        <div className="p-3.5 border-t border-rose-800/40 bg-black/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-rose-800 flex items-center justify-center font-bold text-xs shrink-0 text-amber-300 border border-amber-400/40">
                {currentUser.rank.slice(0, 2)}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser.rank} {currentUser.firstName}
                </div>
                <div className="text-[10px] text-amber-300 font-mono truncate">
                  {currentUser.callSign} ({currentUser.role})
                </div>
              </div>
            </div>

            {/* Requirement 11: Logout button */}
            <button
              onClick={logout}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-rose-200 hover:text-white transition shrink-0"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sidebar Bottom Developer Credit */}
        <div className="px-3.5 py-2.5 border-t border-rose-800/30 text-[10px] text-rose-300/80 text-center leading-relaxed">
          พัฒนาระบบโดย นางสาวพิมลวรรณ  สุพะสอน<br />
          <span className="text-[9.5px] text-rose-300/70">นักวิชาการสาธารณสุข โรงพยาบาลโพนนาแก้ว</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar for Desktop */}
        <header className="hidden md:flex bg-white border-b border-stone-200 px-6 py-3 items-center justify-between shadow-xs sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-500 text-xs font-medium w-72 transition"
            >
              <Search className="w-4 h-4 text-stone-400" />
              <span>ค้นหาชื่อ, ยศ, นามเรียกขาน, ใบลา...</span>
              <kbd className="ml-auto text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-600 font-mono">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton />

            {/* Notifications Button (Requirement 17) */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
              title="การแจ้งเตือน"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-stone-900 font-bold text-[10px] flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Pill & Logout (Requirement 11) */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <div className="text-right">
                <div className="text-xs font-bold text-stone-900">
                  {currentUser.rank} {currentUser.firstName} {currentUser.lastName}
                </div>
                <div className="text-[10px] text-rose-900 font-semibold font-mono">
                  {currentUser.callSign} • {currentUser.positionTitle}
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-900 font-bold text-xs transition"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentView === 'dashboard' && (
            <Dashboard
              onSelectLeave={handleSelectLeave}
              onNavigateSubmit={() => setCurrentView('submit_leave')}
              onNavigateInbox={() => setCurrentView('inbox')}
              onPrintA4={handlePrintA4}
              onPrintManpowerReport={() => setCurrentView('reports')}
            />
          )}

          {currentView === 'submit_leave' && (
            <LeaveRequestForm
              onSuccess={(leaveId) => {
                handleSelectLeaveId(leaveId);
                setCurrentView('dashboard');
              }}
            />
          )}

          {currentView === 'inbox' && (
            <ApprovalInbox
              onSelectLeave={handleSelectLeave}
              onPrintA4={handlePrintA4}
            />
          )}

          {currentView === 'roster_board' && (
            <LeaveRosterBoard />
          )}

          {currentView === 'personnel' && (
            <PersonnelManagement />
          )}

          {currentView === 'history' && (
            <LeaveHistory
              onSelectLeave={handleSelectLeave}
              onPrintA4={handlePrintA4}
            />
          )}

          {currentView === 'reports' && (
            <LeaveReports />
          )}
        </main>

        {/* Elegant Bottom Footer Credit */}
        <footer className="w-full py-3 px-6 text-center text-xs text-stone-500 border-t border-stone-200/80 bg-white/70 backdrop-blur-xs no-print shrink-0">
          <p className="font-medium tracking-wide">
            พัฒนาระบบโดย <span className="font-bold text-stone-700">นางสาวพิมลวรรณ  สุพะสอน</span> นักวิชาการสาธารณสุข โรงพยาบาลโพนนาแก้ว
          </p>
        </footer>
      </div>

      {/* Modals & Drawers */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <LeaveDetailModal
        leave={selectedLeave}
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        onPrintA4={handlePrintA4}
      />

      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onSelectLeaveId={handleSelectLeaveId}
      />

      <UniversalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectLeave={handleSelectLeave}
      />

      <AuditLogModal
        isOpen={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
      />

      <BackupRestoreModal
        isOpen={backupOpen}
        onClose={() => setBackupOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LeaveProvider>
      <MainApp />
    </LeaveProvider>
  );
}
