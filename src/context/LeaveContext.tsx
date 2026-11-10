import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  OfficerUser, 
  LeaveRequest, 
  StationConfig, 
  AuditLog, 
  PublicHoliday,
  LeaveType,
  UserRole,
  DivisionType
} from '../types/leave';
import { INITIAL_OFFICERS, INITIAL_STATION_CONFIG, INITIAL_HOLIDAYS } from '../data/initialOfficers';
import { INITIAL_LEAVES } from '../data/initialLeaves';

interface InAppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  leaveId?: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

interface LeaveContextType {
  currentUser: OfficerUser | null;
  officers: OfficerUser[];
  leaves: LeaveRequest[];
  stationConfig: StationConfig;
  auditLogs: AuditLog[];
  holidays: PublicHoliday[];
  notifications: InAppNotification[];
  selectedFiscalYear: number;
  setSelectedFiscalYear: (year: number) => void;

  // Auth
  login: (username: string, password: string) => { success: boolean; message: string; requiresPasswordChange?: boolean };
  logout: () => void;
  updatePassword: (userId: string, newPass: string) => boolean;
  adminResetPassword: (userId: string, newPass: string) => boolean;
  unlockAccount: (userId: string) => void;

  // Personnel management
  addOfficer: (officer: Omit<OfficerUser, 'id' | 'orderNumber' | 'failedLoginAttempts' | 'isLocked'>) => boolean;
  updateOfficer: (id: string, updates: Partial<OfficerUser>) => boolean;
  deleteOfficer: (id: string) => boolean;

  // Leave operations
  submitLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'leaveNumber' | 'createdAt' | 'updatedAt' | 'timeline' | 'status'>) => LeaveRequest;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => boolean;
  cancelLeaveRequest: (id: string, reason?: string) => boolean;
  withdrawLeaveRequest: (id: string) => boolean;
  approveLeaveRequest: (id: string, comment?: string) => boolean;
  rejectLeaveRequest: (id: string, reason: string) => boolean;
  returnForRevision: (id: string, note: string) => boolean;

  // Station Configuration & Manpower
  updateStationConfig: (updates: Partial<StationConfig>) => void;
  updateDutyManpower: (total: number, leaving: number) => void;

  // Holidays
  addHoliday: (holiday: PublicHoliday) => void;
  removeHoliday: (date: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Backup & Restore
  exportBackupJSON: () => string;
  importBackupJSON: (jsonString: string) => boolean;
  resetToFactoryDefaults: () => void;

  // Utility checks
  checkLeaveConflict: (userId: string, start: string, end: string, excludeId?: string) => LeaveRequest | null;
  getUserLeaveStats: (userId: string, year?: number) => {
    vacationUsed: number;
    personalUsed: number;
    sickUsed: number;
    maternityUsed: number;
    paternityUsed: number;
    ordinationUsed: number;
    totalQuota: number;
    vacationRemaining: number;
  };
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

const STORAGE_KEY_OFFICERS = 'ssk_police_officers_v1';
const STORAGE_KEY_LEAVES = 'ssk_police_leaves_v1';
const STORAGE_KEY_CONFIG = 'ssk_police_config_v1';
const STORAGE_KEY_LOGS = 'ssk_police_logs_v1';
const STORAGE_KEY_HOLIDAYS = 'ssk_police_holidays_v1';
const STORAGE_KEY_NOTIFS = 'ssk_police_notifs_v1';

export const LeaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Requirement 76: Every time the page/applet is loaded, start at login page first (currentUser = null)
  const [currentUser, setCurrentUser] = useState<OfficerUser | null>(null);

  const [officers, setOfficers] = useState<OfficerUser[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_OFFICERS);
      return stored ? JSON.parse(stored) : INITIAL_OFFICERS;
    } catch {
      return INITIAL_OFFICERS;
    }
  });

  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LEAVES);
      return stored ? JSON.parse(stored) : INITIAL_LEAVES;
    } catch {
      return INITIAL_LEAVES;
    }
  });

  const [stationConfig, setStationConfig] = useState<StationConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      return stored ? JSON.parse(stored) : INITIAL_STATION_CONFIG;
    } catch {
      return INITIAL_STATION_CONFIG;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOGS);
      return stored ? JSON.parse(stored) : [
        {
          id: 'log-init',
          timestamp: new Date().toLocaleString('th-TH'),
          actorId: 'system',
          actorName: 'ระบบงานกำลังพล',
          actorCallSign: 'ระบบ',
          actorRole: 'admin',
          action: 'CREATE',
          entity: 'StationConfig',
          details: 'เริ่มต้นระบบบริหารจัดการการลา สภ.ศรีสงคราม'
        }
      ];
    } catch {
      return [];
    }
  });

  const [holidays, setHolidays] = useState<PublicHoliday[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HOLIDAYS);
      return stored ? JSON.parse(stored) : INITIAL_HOLIDAYS;
    } catch {
      return INITIAL_HOLIDAYS;
    }
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return stored ? JSON.parse(stored) : [
        {
          id: 'notif-1',
          title: 'ยินดีต้อนรับสู่ระบบลาออนไลน์ สภ.ศรีสงคราม',
          message: 'สามารถตรวจสอบวันลาคงเหลือ ยื่นใบลา และดูแผงการลาประจำเดือนได้ทันที',
          timestamp: 'วันนี้',
          read: false,
          type: 'info'
        },
        {
          id: 'notif-2',
          title: 'มีคำขอลาใหม่รอการตรวจสอบ',
          message: 'สภ.0069/2568: ส.ต.ท. นัฐพงษ์ คุ้มเกรง ขอลาพักผ่อน',
          timestamp: '1 ต.ค. 2568',
          read: false,
          leaveId: 'leave-001',
          type: 'warning'
        }
      ];
    } catch {
      return [];
    }
  });

  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(2568);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OFFICERS, JSON.stringify(officers));
    } catch (e) {
      console.warn('Storage failed', e);
    }
  }, [officers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(leaves));
    } catch (e) {
      console.warn('Storage failed', e);
    }
  }, [leaves]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(stationConfig));
    } catch (e) {
      console.warn('Storage failed', e);
    }
  }, [stationConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Storage failed', e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HOLIDAYS, JSON.stringify(holidays));
    } catch (e) {
      console.warn('Storage failed', e);
    }
  }, [holidays]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Storage failed', e);
    }
  }, [notifications]);

  // Audit Log helper
  const addAuditLog = useCallback((
    action: AuditLog['action'],
    entity: string,
    details: string,
    entityId?: string
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
      actorId: currentUser ? currentUser.id : 'guest',
      actorName: currentUser ? `${currentUser.rank} ${currentUser.firstName} ${currentUser.lastName}` : 'ผู้ใช้ทั่วไป',
      actorCallSign: currentUser ? currentUser.callSign : '-',
      actorRole: currentUser ? currentUser.role : 'personnel',
      action,
      entity,
      entityId,
      details
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 499)]); // Keep last 500 logs
  }, [currentUser]);

  // Session timeout auto-logout (Requirement 36: 30 minutes idle timeout)
  useEffect(() => {
    if (!currentUser) return;
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        addAuditLog('LOGOUT', 'UserSession', 'หมดเวลาการใช้งานเนื่องจากไม่มีการเคลื่อนไหวเกิน 30 นาที (Session Timeout)');
        setCurrentUser(null);
      }, 30 * 60 * 1000);
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser, addAuditLog]);

  // Login handler (flexible matching: SSK503, ssk503, ศรีสงคราม 503)
  const login = useCallback((inputUser: string, inputPass: string) => {
    const cleanInput = inputUser.trim().toLowerCase();
    const targetUser = officers.find(o => 
      o.username.toLowerCase() === cleanInput ||
      o.callSign.toLowerCase().replace(/\s+/g, '') === cleanInput.replace(/\s+/g, '') ||
      o.callSign.toLowerCase() === cleanInput
    );

    if (!targetUser) {
      return { success: false, message: 'ไม่พบนามเรียกขานหรือชื่อผู้ใช้นี้ในระบบ สภ.ศรีสงคราม' };
    }

    if (targetUser.isLocked) {
      return { success: false, message: 'บัญชีนี้ถูกระงับชั่วคราวเนื่องจากใส่รหัสผ่านผิดเกิน 5 ครั้ง กรุณาติดต่อแอดมินหรือผู้ดูแลระบบเพื่อรีเซ็ต' };
    }

    if (targetUser.isInactive) {
      return { success: false, message: 'บัญชีบุคลากรนี้ถูกปิดการใช้งาน กรุณาติดต่อธุรการกำลังพล' };
    }

    if (targetUser.password !== inputPass) {
      const attempts = (targetUser.failedLoginAttempts || 0) + 1;
      const isLocked = attempts >= 5;
      
      setOfficers(prev => prev.map(o => o.id === targetUser.id ? {
        ...o,
        failedLoginAttempts: attempts,
        isLocked
      } : o));

      if (isLocked) {
        addAuditLog('UPDATE', 'OfficerUser', `ระงับบัญชี ${targetUser.callSign} ชั่วคราวเนื่องจากใส่รหัสผ่านผิด 5 ครั้ง`, targetUser.id);
        return { success: false, message: 'คุณกรอกรหัสผ่านผิดเกิน 5 ครั้ง บัญชีถูกระงับชั่วคราวเพื่อความปลอดภัย กรุณาติดต่อ Admin' };
      }

      return { 
        success: false, 
        message: `รหัสผ่านไม่ถูกต้อง (กรอกผิดครั้งที่ ${attempts}/5)` 
      };
    }

    // Success login
    setOfficers(prev => prev.map(o => o.id === targetUser.id ? {
      ...o,
      failedLoginAttempts: 0
    } : o));

    setCurrentUser(targetUser);

    addAuditLog('LOGIN', 'UserSession', `เข้าสู่ระบบสำเร็จ (${targetUser.role})`, targetUser.id);

    return {
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      requiresPasswordChange: targetUser.mustChangePassword
    };
  }, [officers, addAuditLog]);

  const logout = useCallback(() => {
    if (currentUser) {
      addAuditLog('LOGOUT', 'UserSession', 'ออกจากระบบเรียบร้อย', currentUser.id);
    }
    setCurrentUser(null);
  }, [currentUser, addAuditLog]);

  const updatePassword = useCallback((userId: string, newPass: string) => {
    setOfficers(prev => prev.map(o => o.id === userId ? {
      ...o,
      password: newPass,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      isLocked: false
    } : o));
    addAuditLog('UPDATE', 'OfficerUser', 'เปลี่ยนรหัสผ่านสำเร็จ', userId);
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, password: newPass, mustChangePassword: false } : null);
    }
    return true;
  }, [currentUser, addAuditLog]);

  const adminResetPassword = useCallback((userId: string, newPass: string) => {
    const officer = officers.find(o => o.id === userId);
    setOfficers(prev => prev.map(o => o.id === userId ? {
      ...o,
      password: newPass,
      failedLoginAttempts: 0,
      isLocked: false
    } : o));
    addAuditLog('PASSWORD_RESET', 'OfficerUser', `แอดมินรีเซ็ตรหัสผ่านของ ${officer?.rank} ${officer?.firstName} (${officer?.callSign})`, userId);
    return true;
  }, [officers, addAuditLog]);

  const unlockAccount = useCallback((userId: string) => {
    setOfficers(prev => prev.map(o => o.id === userId ? {
      ...o,
      failedLoginAttempts: 0,
      isLocked: false
    } : o));
    addAuditLog('UPDATE', 'OfficerUser', 'ปลดล็อกบัญชีผู้ใช้งาน', userId);
  }, [addAuditLog]);

  // Officer CRUD
  const addOfficer = useCallback((newOffData: Omit<OfficerUser, 'id' | 'orderNumber' | 'failedLoginAttempts' | 'isLocked'>) => {
    const nextOrder = officers.length + 1;
    const newOfficer: OfficerUser = {
      ...newOffData,
      id: `off-${Date.now()}`,
      orderNumber: nextOrder,
      failedLoginAttempts: 0,
      isLocked: false,
    };
    setOfficers(prev => [...prev, newOfficer]);
    addAuditLog('CREATE', 'OfficerUser', `เพิ่มบุคลากรใหม่: ${newOfficer.rank} ${newOfficer.firstName} ${newOfficer.lastName} (${newOfficer.callSign})`, newOfficer.id);
    return true;
  }, [officers.length, addAuditLog]);

  const updateOfficer = useCallback((id: string, updates: Partial<OfficerUser>) => {
    setOfficers(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    addAuditLog('UPDATE', 'OfficerUser', `แก้ไขข้อมูลบุคลากร ID: ${id}`, id);
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
    return true;
  }, [currentUser, addAuditLog]);

  const deleteOfficer = useCallback((id: string) => {
    const off = officers.find(o => o.id === id);
    setOfficers(prev => prev.filter(o => o.id !== id));
    addAuditLog('DELETE', 'OfficerUser', `ลบบุคลากร: ${off?.rank} ${off?.firstName} ${off?.lastName} (${off?.callSign})`, id);
    return true;
  }, [officers, addAuditLog]);

  // Leave checking utilities
  const checkLeaveConflict = useCallback((userId: string, start: string, end: string, excludeId?: string) => {
    const sDate = new Date(start).getTime();
    const eDate = new Date(end).getTime();

    const activeLeaves = leaves.filter(l => 
      l.userId === userId && 
      l.id !== excludeId &&
      !['cancelled', 'rejected', 'withdrawn'].includes(l.status)
    );

    for (const l of activeLeaves) {
      const existingStart = new Date(l.startDate).getTime();
      const existingEnd = new Date(l.endDate).getTime();
      if ((sDate >= existingStart && sDate <= existingEnd) ||
          (eDate >= existingStart && eDate <= existingEnd) ||
          (sDate <= existingStart && eDate >= existingEnd)) {
        return l;
      }
    }
    return null;
  }, [leaves]);

  const getUserLeaveStats = useCallback((userId: string, year = 2568) => {
    const user = officers.find(o => o.id === userId);
    const userLeavesInYear = leaves.filter(l => 
      l.userId === userId && 
      l.fiscalYear === year &&
      ['approved', 'pending_supervisor', 'pending_checker', 'pending_approver'].includes(l.status)
    );

    let vacationUsed = 0;
    let personalUsed = 0;
    let sickUsed = 0;
    let maternityUsed = 0;
    let paternityUsed = 0;
    let ordinationUsed = 0;

    userLeavesInYear.forEach(l => {
      if (l.leaveType === 'vacation') vacationUsed += l.durationDays;
      if (l.leaveType === 'personal') personalUsed += l.durationDays;
      if (l.leaveType === 'sick') sickUsed += l.durationDays;
      if (l.leaveType === 'maternity') maternityUsed += l.durationDays;
      if (l.leaveType === 'paternity') paternityUsed += l.durationDays;
      if (l.leaveType === 'ordination') ordinationUsed += l.durationDays;
    });

    const totalQuota = (user?.accumulatedLeaveDays || 0) + (user?.currentYearLeaveQuota || 10);
    const vacationRemaining = Math.max(0, totalQuota - vacationUsed);

    return {
      vacationUsed,
      personalUsed,
      sickUsed,
      maternityUsed,
      paternityUsed,
      ordinationUsed,
      totalQuota,
      vacationRemaining
    };
  }, [officers, leaves]);

  // Submit Leave Request
  const submitLeaveRequest = useCallback((data: Omit<LeaveRequest, 'id' | 'leaveNumber' | 'createdAt' | 'updatedAt' | 'timeline' | 'status'>) => {
    const nextSeq = stationConfig.autoNumberSequence + 1;
    const padded = String(nextSeq).padStart(4, '0');
    const leaveNumber = `สภ.${padded}/${data.fiscalYear}`;

    const newLeave: LeaveRequest = {
      ...data,
      id: `leave-${Date.now()}`,
      leaveNumber,
      status: 'pending_supervisor',
      createdAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
      updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
      timeline: [
        {
          step: 'submitted',
          title: 'ยื่นคำขอลาออนไลน์',
          actor: `${data.userRank} ${data.userName} ${data.userSurname}`,
          actorRankName: `${data.userRank} ${data.userName} ${data.userSurname} (${data.userCallSign})`,
          action: 'ส่งคำขอลาเพื่อรอผู้บังคับบัญชาตรวจสอบ',
          timestamp: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
          status: 'completed',
          note: `เหตุผล: ${data.reason}`
        },
        {
          step: 'supervisor',
          title: 'หัวหน้างานตรวจสอบ',
          actor: 'หัวหน้างานสายงาน',
          actorRankName: 'หัวหน้างานสายงาน',
          action: 'รอตรวจสอบและเสนอความเห็น',
          timestamp: '-',
          status: 'current'
        }
      ]
    };

    setLeaves(prev => [newLeave, ...prev]);
    setStationConfig(prev => ({ ...prev, autoNumberSequence: nextSeq }));

    // Send notifications to supervisors/admins
    const notif: InAppNotification = {
      id: `notif-${Date.now()}`,
      title: 'มีคำขอลาใหม่เข้าระบบ',
      message: `${leaveNumber}: ${data.userRank} ${data.userName} ขอ${data.leaveType === 'vacation' ? 'ลาพักผ่อน' : 'ลา'} ${data.durationDays} วัน`,
      timestamp: 'เมื่อสักครู่',
      read: false,
      leaveId: newLeave.id,
      type: 'warning'
    };
    setNotifications(prev => [notif, ...prev]);

    addAuditLog('CREATE', 'LeaveRequest', `ยื่นใบลาเลขที่ ${leaveNumber} ประเภท ${data.leaveType} (${data.durationDays} วัน)`, newLeave.id);

    return newLeave;
  }, [stationConfig.autoNumberSequence, addAuditLog]);

  // Update Leave Request
  const updateLeaveRequest = useCallback((id: string, updates: Partial<LeaveRequest>) => {
    setLeaves(prev => prev.map(l => {
      if (l.id !== id) return l;
      return {
        ...l,
        ...updates,
        updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
      };
    }));
    addAuditLog('UPDATE', 'LeaveRequest', `แก้ไขคำขอลา ID: ${id}`, id);
    return true;
  }, [addAuditLog]);

  // Cancel Leave Request (Requirement 19 & 25)
  const cancelLeaveRequest = useCallback((id: string, reason?: string) => {
    setLeaves(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updatedTimeline = [
        ...l.timeline,
        {
          step: 'cancelled',
          title: 'ยกเลิกคำขอลา',
          actor: currentUser ? `${currentUser.rank} ${currentUser.firstName}` : 'ผู้ใช้',
          actorRankName: currentUser ? `${currentUser.rank} ${currentUser.firstName} ${currentUser.lastName} (${currentUser.callSign})` : '-',
          action: reason ? `ยกเลิกคำขอลา: ${reason}` : 'ยกเลิกคำขอลา',
          timestamp: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
          status: 'cancelled' as const,
          note: reason
        }
      ];
      return {
        ...l,
        status: 'cancelled' as const,
        rejectReason: reason,
        timeline: updatedTimeline,
        updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
      };
    }));

    addAuditLog('CANCEL', 'LeaveRequest', `ยกเลิกคำขอลา ID: ${id} ${reason ? `(${reason})` : ''}`, id);
    return true;
  }, [currentUser, addAuditLog]);

  // Withdraw Leave Request (Requirement 43)
  const withdrawLeaveRequest = useCallback((id: string) => {
    setLeaves(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updatedTimeline = [
        ...l.timeline,
        {
          step: 'withdrawn',
          title: 'ถอนคำขอลา',
          actor: currentUser ? `${currentUser.rank} ${currentUser.firstName}` : 'ผู้ยื่นลา',
          actorRankName: currentUser ? `${currentUser.rank} ${currentUser.firstName} ${currentUser.lastName} (${currentUser.callSign})` : '-',
          action: 'ผู้ยื่นลาทำการถอนคำขอออกจากระบบ',
          timestamp: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
          status: 'cancelled' as const
        }
      ];
      return {
        ...l,
        status: 'withdrawn' as const,
        timeline: updatedTimeline,
        updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
      };
    }));

    addAuditLog('WITHDRAW', 'LeaveRequest', `ถอนคำขอลา ID: ${id}`, id);
    return true;
  }, [currentUser, addAuditLog]);

  // Approve Leave Request (Role-based step)
  const approveLeaveRequest = useCallback((id: string, comment = '') => {
    const actorName = currentUser ? `${currentUser.rank} ${currentUser.firstName} ${currentUser.lastName}` : 'ผู้มีอำนาจอนุมัติ';
    const actorRole = currentUser?.role || 'approver';

    setLeaves(prev => prev.map(l => {
      if (l.id !== id) return l;

      // Determine next status based on who approved
      let nextStatus: LeaveRequest['status'] = 'approved';
      let stepTitle = 'อนุมัติเรียบร้อย';

      if (l.status === 'pending_supervisor') {
        if (actorRole === 'supervisor' || actorRole === 'admin') {
          nextStatus = 'pending_checker';
          stepTitle = 'หัวหน้างานผ่านความเห็นชอบ';
        }
      } else if (l.status === 'pending_checker') {
        if (actorRole === 'checker' || actorRole === 'admin') {
          nextStatus = 'pending_approver';
          stepTitle = 'ผู้ตรวจสอบตรวจสถิติถูกต้อง';
        }
      } else {
        nextStatus = 'approved';
        stepTitle = 'ผู้บังคับบัญชาลงนามอนุมัติ';
      }

      // If superintendent or approver approves directly, complete approval
      if (actorRole === 'superintendent' || actorRole === 'approver') {
        nextStatus = 'approved';
        stepTitle = 'ผู้กำกับการอนุมัติ';
      }

      const updatedTimeline = [
        ...l.timeline,
        {
          step: nextStatus === 'approved' ? 'approved' : nextStatus,
          title: stepTitle,
          actor: actorName,
          actorRankName: `${actorName} (${currentUser?.callSign || ''})`,
          action: comment ? `อนุมัติ / เห็นควรอนุญาต: ${comment}` : 'อนุมัติคำขอลา',
          timestamp: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
          status: 'completed' as const,
          note: comment
        }
      ];

      return {
        ...l,
        status: nextStatus,
        approverComment: comment || l.approverComment,
        approverSignedBy: actorName,
        approverDate: new Date().toISOString().split('T')[0],
        timeline: updatedTimeline,
        updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
      };
    }));

    addAuditLog('APPROVE', 'LeaveRequest', `อนุมัติคำขอลา ID: ${id} โดย ${actorName}`, id);
    return true;
  }, [currentUser, addAuditLog]);

  // Reject Leave Request (Requirement 49: Mandatory reject reason)
  const rejectLeaveRequest = useCallback((id: string, reason: string) => {
    if (!reason.trim()) return false;
    const actorName = currentUser ? `${currentUser.rank} ${currentUser.firstName} ${currentUser.lastName}` : 'ผู้บังคับบัญชา';

    setLeaves(prev => prev.map(l => {
      if (l.id !== id) return l;

      const updatedTimeline = [
        ...l.timeline,
        {
          step: 'rejected',
          title: 'ไม่อนุมัติคำขอลา',
          actor: actorName,
          actorRankName: `${actorName} (${currentUser?.callSign || ''})`,
          action: `ไม่อนุมัติ: ${reason}`,
          timestamp: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
          status: 'rejected' as const,
          note: reason
        }
      ];

      return {
        ...l,
        status: 'rejected' as const,
        rejectReason: reason,
        timeline: updatedTimeline,
        updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
      };
    }));

    addAuditLog('REJECT', 'LeaveRequest', `ไม่อนุมัติคำขอลา ID: ${id} เหตุผล: ${reason}`, id);
    return true;
  }, [currentUser, addAuditLog]);

  // Return for revision
  const returnForRevision = useCallback((id: string, note: string) => {
    setLeaves(prev => prev.map(l => {
      if (l.id !== id) return l;
      return {
        ...l,
        status: 'pending_supervisor',
        rejectReason: `ส่งกลับแก้ไข: ${note}`,
        timeline: [
          ...l.timeline,
          {
            step: 'returned',
            title: 'ส่งกลับแก้ไขคำขอ',
            actor: currentUser ? `${currentUser.rank} ${currentUser.firstName}` : 'ผู้ตรวจสอบ',
            actorRankName: currentUser ? `${currentUser.rank} ${currentUser.firstName} (${currentUser.callSign})` : '-',
            action: `ส่งกลับให้ผู้ลาแก้ไขข้อมูล: ${note}`,
            timestamp: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
            status: 'current' as const,
            note
          }
        ]
      };
    }));
    addAuditLog('UPDATE', 'LeaveRequest', `ส่งกลับแก้ไขคำขอลา ID: ${id}`, id);
    return true;
  }, [currentUser, addAuditLog]);

  // Station config updates
  const updateStationConfig = useCallback((updates: Partial<StationConfig>) => {
    setStationConfig(prev => ({ ...prev, ...updates }));
    addAuditLog('CONFIG_UPDATE', 'StationConfig', 'อัปเดตการตั้งค่าสถานีตำรวจ/ปีงบประมาณ');
  }, [addAuditLog]);

  // Update duty manpower numbers (Requirement 20 & 24)
  const updateDutyManpower = useCallback((total: number, leaving: number) => {
    setStationConfig(prev => ({
      ...prev,
      dutyOfficersTotal: total,
      dutyOfficersLeaving: leaving
    }));
    addAuditLog('CONFIG_UPDATE', 'StationConfig', `อัปเดตกำลังพล: ปฏิบัติหน้าที่ ${total} นาย, ลา ${leaving} นาย, คงเหลือ ${Math.max(0, total - leaving)} นาย`);
  }, [addAuditLog]);

  // Holidays
  const addHoliday = useCallback((holiday: PublicHoliday) => {
    setHolidays(prev => [...prev.filter(h => h.date !== holiday.date), holiday].sort((a, b) => a.date.localeCompare(b.date)));
    addAuditLog('CREATE', 'PublicHoliday', `เพิ่มวันหยุด: ${holiday.name} (${holiday.date})`);
  }, [addAuditLog]);

  const removeHoliday = useCallback((date: string) => {
    setHolidays(prev => prev.filter(h => h.date !== date));
    addAuditLog('DELETE', 'PublicHoliday', `ลบวันหยุดวันที่: ${date}`);
  }, [addAuditLog]);

  // Notifications
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Backup & Restore (Requirement 61 & 62)
  const exportBackupJSON = useCallback(() => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      stationConfig,
      officers,
      leaves,
      holidays,
      auditLogs
    };
    addAuditLog('BACKUP_RESTORE', 'System', 'ส่งออกไฟล์สำรองข้อมูลฐานข้อมูล (Backup Export)');
    return JSON.stringify(backupData, null, 2);
  }, [stationConfig, officers, leaves, holidays, auditLogs, addAuditLog]);

  const importBackupJSON = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.officers && Array.isArray(data.officers)) setOfficers(data.officers);
      if (data.leaves && Array.isArray(data.leaves)) setLeaves(data.leaves);
      if (data.stationConfig) setStationConfig(data.stationConfig);
      if (data.holidays && Array.isArray(data.holidays)) setHolidays(data.holidays);
      if (data.auditLogs && Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      addAuditLog('BACKUP_RESTORE', 'System', 'กู้คืนฐานข้อมูลจากไฟล์สำรองสำเร็จ (Restore Backup)');
      return true;
    } catch (e) {
      console.error('Import backup failed', e);
      return false;
    }
  }, [addAuditLog]);

  const resetToFactoryDefaults = useCallback(() => {
    setOfficers(INITIAL_OFFICERS);
    setLeaves(INITIAL_LEAVES);
    setStationConfig(INITIAL_STATION_CONFIG);
    setHolidays(INITIAL_HOLIDAYS);
    setNotifications([]);
    addAuditLog('BACKUP_RESTORE', 'System', 'รีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้นจากโรงงาน');
  }, [addAuditLog]);

  const value = useMemo(() => ({
    currentUser,
    officers,
    leaves,
    stationConfig,
    auditLogs,
    holidays,
    notifications,
    selectedFiscalYear,
    setSelectedFiscalYear,
    login,
    logout,
    updatePassword,
    adminResetPassword,
    unlockAccount,
    addOfficer,
    updateOfficer,
    deleteOfficer,
    submitLeaveRequest,
    updateLeaveRequest,
    cancelLeaveRequest,
    withdrawLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    returnForRevision,
    updateStationConfig,
    updateDutyManpower,
    addHoliday,
    removeHoliday,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    exportBackupJSON,
    importBackupJSON,
    resetToFactoryDefaults,
    checkLeaveConflict,
    getUserLeaveStats
  }), [
    currentUser,
    officers,
    leaves,
    stationConfig,
    auditLogs,
    holidays,
    notifications,
    selectedFiscalYear,
    login,
    logout,
    updatePassword,
    adminResetPassword,
    unlockAccount,
    addOfficer,
    updateOfficer,
    deleteOfficer,
    submitLeaveRequest,
    updateLeaveRequest,
    cancelLeaveRequest,
    withdrawLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    returnForRevision,
    updateStationConfig,
    updateDutyManpower,
    addHoliday,
    removeHoliday,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    exportBackupJSON,
    importBackupJSON,
    resetToFactoryDefaults,
    checkLeaveConflict,
    getUserLeaveStats
  ]);

  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>;
};

export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
};
