export type UserRole = 
  | 'personnel'      // 👮 บุคลากร (ยื่นลา, ดูประวัติ, ดูวันลาคงเหลือ, แดชบอร์ด)
  | 'supervisor'     // 👮 หัวหน้างาน (ตรวจสอบการลาของผู้ใต้บังคับบัญชา)
  | 'checker'        // 📋 ผู้ตรวจสอบ (ตรวจสอบเอกสารและความถูกต้อง)
  | 'approver'       // ✍️ ผู้อนุมัติ (อนุมัติ / ไม่อนุมัติ / ส่งกลับแก้ไข)
  | 'admin'          // ⚙️ Admin (จัดการบุคลากร ระบบ และการตั้งค่า)
  | 'superintendent';// ⭐ ผู้กำกับ (ดูภาพรวม อนุมัติ และพิมพ์รายงาน)

export type DivisionType =
  | 'superintendent' // ผกก.
  | 'patrol'         // ป้องกันปราบปราม
  | 'investigation'  // สอบสวน
  | 'detective'      // สืบสวน
  | 'admin_div'      // อำนวยการ
  | 'traffic';       // จราจร

export interface SubDivision {
  id: string;
  name: string;
  division: DivisionType;
}

export const SUB_DIVISIONS: Record<DivisionType, string[]> = {
  superintendent: ['ผกก.สภ.ศรีสงคราม'],
  patrol: [
    'รอง ผกก.ป.',
    'สวป.',
    'ร้อยเวรป้องกันปราบปราม',
    'สายตรวจรถยนต์',
    'สายตรวจรถจักรยานยนต์',
    'ประจำวัน',
    'สิบเวร',
    'วิทยุ/สื่อสาร',
    'ธุรการป้องกันปราบปราม',
    'สิบเวร/ยาม/ประชาสัมพันธ์'
  ],
  investigation: [
    'รอง ผกก.(สอบสวน)',
    'สว.(สอบสวน)',
    'สว.สอบสวน(หน.คดี)',
    'พนักงานสอบสวน',
    'ผู้ช่วยพนักงานสอบสวน',
    'เสมียนคดี',
    'ธุรการประจำวัน'
  ],
  detective: [
    'รอง ผกก.สส.',
    'สว.สส.',
    'เจ้าหน้าที่สืบสวน'
  ],
  admin_div: [
    'สว.อก.',
    'ธุรการ/กำลังพล',
    'การเงิน/พัสดุ',
    'สารบรรณ/ส่งกำลังบำรุง'
  ],
  traffic: [
    'หัวหน้างานจราจร',
    'เจ้าหน้าที่จราจร',
    'กวดขันวินัยจราจร'
  ]
};

export const DIVISION_NAMES: Record<DivisionType, string> = {
  superintendent: 'ผกก.',
  patrol: 'งานป้องกันปราบปราม',
  investigation: 'งานสอบสวน',
  detective: 'งานสืบสวน',
  admin_div: 'งานอำนวยการ',
  traffic: 'งานจราจร'
};

export type LeaveType = 
  | 'vacation'     // ลาพักผ่อน (พ.)
  | 'personal'     // ลากิจส่วนตัว (ก.)
  | 'sick'         // ลาป่วย (ป.)
  | 'maternity'    // ลาคลอด
  | 'paternity'    // ลาเพื่อดูแลบุตรและภรรยาหลังคลอด (ลก.)
  | 'ordination'   // ลาอุปสมบท
  | 'official_duty'// ไปราชการ (ปก.)
  | 'overtime'     // เบิก OT (OT)
  | 'help_duty';   // ช่วยราชการ (ช่วย)

export const LEAVE_TYPE_LABELS: Record<LeaveType, { name: string; code: string; color: string; maxDays: number; emoji: string }> = {
  vacation: { name: 'ลาพักผ่อน', code: 'พ', color: '#eab308', maxDays: 10, emoji: '🏖️' },
  personal: { name: 'ลากิจส่วนตัว', code: 'ก', color: '#3b82f6', maxDays: 45, emoji: '📑' },
  sick: { name: 'ลาป่วย', code: 'ป', color: '#ef4444', maxDays: 60, emoji: '💊' },
  maternity: { name: 'ลาคลอด', code: 'ลค', color: '#ec4899', maxDays: 90, emoji: '🍼' },
  paternity: { name: 'ลาเพื่อดูแลบุตรและภรรยาหลังคลอด', code: 'ลก', color: '#8b5cf6', maxDays: 15, emoji: '👶' },
  ordination: { name: 'ลาอุปสมบท', code: 'อบ', color: '#f97316', maxDays: 120, emoji: '📿' },
  official_duty: { name: 'ไปราชการ', code: 'ปก', color: '#10b981', maxDays: 30, emoji: '🚙' },
  overtime: { name: 'เบิก OT', code: 'OT', color: '#06b6d4', maxDays: 30, emoji: '⏱️' },
  help_duty: { name: 'ช่วยราชการ', code: 'ช่วย', color: '#64748b', maxDays: 180, emoji: '🤝' }
};

export type LeaveStatus = 
  | 'pending_supervisor' // รอหัวหน้างานตรวจสอบ
  | 'pending_checker'    // รอผู้ตรวจสอบ
  | 'pending_approver'   // รอผู้อนุมัติ/ผู้กำกับ
  | 'approved'           // อนุมัติแล้ว
  | 'rejected'           // ไม่อนุมัติ
  | 'cancelled'          // ยกเลิกคำขอลา
  | 'withdrawn';         // ถอนคำขอลา

export interface OfficerUser {
  id: string;
  orderNumber: number;
  callSign: string;        // เช่น "ศรีสงคราม 503"
  username: string;        // e.g. "SSK503"
  password: string;        // Admin can view
  rank: string;            // เช่น "ส.ต.ท."
  firstName: string;       // เช่น "นัฐพงษ์"
  lastName: string;        // เช่น "คุ้มเกรง"
  role: UserRole;
  division: DivisionType;
  subDivision: string;
  positionTitle: string;   // เช่น "ผบ.หมู่(ป.)สภ.ศรีสงคราม"
  phone: string;
  address: string;
  accumulatedLeaveDays: number; // วันลาพักผ่อนสะสม
  currentYearLeaveQuota: number; // สิทธิลาปีนี้ (เช่น 10)
  mustChangePassword?: boolean;
  failedLoginAttempts: number;
  isLocked: boolean;
  lockUntil?: string;
  isInactive?: boolean;
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface LeaveTimelineStep {
  step: string;
  title: string;
  actor: string;
  actorRankName: string;
  action: string;
  timestamp: string;
  status: 'completed' | 'current' | 'rejected' | 'cancelled';
  note?: string;
}

export interface LeaveRequest {
  id: string;
  leaveNumber: string; // เลขที่ใบลา เช่น "สภ.0068/2568"
  fiscalYear: number;  // 2568
  userId: string;
  userCallSign: string;
  userRank: string;
  userName: string;
  userSurname: string;
  positionTitle: string;
  division: DivisionType;
  subDivision: string;
  
  dutyName: string; // ผู้ลาปฏิบัติหน้าที่ (กรอกเองตามภาพ att.TGdvWeI4dBEqtfWEtx0TjY1ya3T8Gl5qxlKsxDfGhFs_4c676f59.jpeg)
  
  leaveType: LeaveType;
  reason: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationDays: number;
  periodType: 'full' | 'morning' | 'afternoon';
  isRetroactive?: boolean; // ยื่นย้อนหลัง
  retroactiveReason?: string;
  
  contactAddress: string;
  contactPhone: string;
  
  // สถิติการลา
  lastLeaveType?: LeaveType;
  lastLeaveStartDate?: string;
  lastLeaveEndDate?: string;
  lastLeaveDays?: number;
  
  accumulatedDays: number;
  currentQuotaDays: number;
  totalQuotaDays: number;
  usedDaysBefore: number;
  currentRequestDays: number;
  totalUsedDaysAfter: number;

  // กำลังปฏิบัติหน้าที่ในสายงาน ณ วันที่ยื่น
  dutyTotalOfficers: number;
  dutyLeavingOfficers: number;
  dutyRemainingOfficers: number;

  // รายละเอียดเพิ่มเติมเฉพาะประเภทใบลา
  spouseName?: string; // ภรรยาชื่อ
  childBirthDate?: string; // คลอดเมื่อ
  templeName?: string; // ณ วัด
  templeLocation?: string; // ตั้งอยู่ ณ
  ordinationDate?: string; // กำหนดอุปสมบท วันที่
  stayTempleName?: string; // จำพรรษา ณ วัด
  stayTempleLocation?: string;
  everOrdained?: boolean; // ข้าพเจ้า เคย / ไม่เคย อุปสมบท
  bornDate?: string; // เกิดวันที่
  joinedDate?: string; // เข้ารับราชการเมื่อ

  // เป้าหมายผู้บังคับบัญชาที่เรียน (ผกก. หรือ ผบก.ภ.จว.นครพนม)
  recipientTitle: 'ผกก.สภ.ศรีสงคราม' | 'ผบก.ภ.จว.นครพนม';
  commanderCustomName?: string; // กรณีเรียน ผบก. หรือแก้ไขชื่อ

  // เอกสารแนบ
  attachments: AttachmentItem[];

  // สถานะและการอนุมัติ
  status: LeaveStatus;
  rejectReason?: string;
  
  supervisorComment?: string;
  supervisorSignedBy?: string;
  supervisorDate?: string;
  
  checkerComment?: string;
  checkerSignedBy?: string;
  checkerDate?: string;
  
  approverComment?: string;
  approverSignedBy?: string;
  approverDate?: string;

  createdAt: string;
  updatedAt: string;
  
  timeline: LeaveTimelineStep[];
}

export interface StationConfig {
  stationName: string;          // สถานีตำรวจภูธรศรีสงคราม
  stationNameEn: string;        // SI SONGKHRAM POLICE STATION
  policeDivision: string;       // ตำรวจภูธรจังหวัดนครพนม
  policeRegion: string;         // ตำรวจภูธรภาค 4
  phone: string;                // 042-571211
  address: string;              // อ.ศรีสงคราม จ.นครพนม
  logoUrl: string;
  currentFiscalYear: number;    // 2568 (รองรับถึง 2580)
  superintendentRankName: string; // "พ.ต.อ. ถวิล คำเกษ"
  superintendentPosition: string; // "ผกก.สภ.ศรีสงคราม"
  provincialCommanderRankName: string; // "พล.ต.ต. อารักษ์ มะสาธานัง"
  provincialCommanderPosition: string; // "ผบก.ภ.จว.นครพนม"
  autoNumberSequence: number;
  minStaffThresholdPercent: number; // เช่น 70% เตือนหากลาเกิน
  closedFiscalYears: number[];
  dutyOfficersTotal: number;     // กำลังปฏิบัติหน้าที่
  dutyOfficersLeaving: number;   // ลา
  // dutyOfficersRemaining will be calculated automatically
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorCallSign: string;
  actorRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'CANCEL' | 'WITHDRAW' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_RESET' | 'CONFIG_UPDATE' | 'BACKUP_RESTORE';
  entity: string;
  entityId?: string;
  details: string;
}

export interface PublicHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  isSpecial?: boolean;
}
