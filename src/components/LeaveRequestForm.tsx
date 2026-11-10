import React, { useState, useEffect, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';
import { 
  LeaveType, 
  LEAVE_TYPE_LABELS, 
  DIVISION_NAMES, 
  AttachmentItem 
} from '../types/leave';
import { 
  FileEdit, Calendar, AlertCircle, CheckCircle2, Paperclip, 
  Clock, ShieldAlert, ArrowRight, UserCheck, HelpCircle, 
  Info, Users, X, UploadCloud, Printer 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaveRequestFormProps {
  onSuccess: (leaveId: string) => void;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onSuccess }) => {
  const { 
    currentUser, 
    officers,
    stationConfig, 
    submitLeaveRequest, 
    checkLeaveConflict, 
    getUserLeaveStats,
    holidays 
  } = useLeave();

  // If no user is logged in, use sample user
  const user = currentUser || officers[62] || officers[0]; // default ส.ต.ท. นัฐพงษ์ คุ้มเกรง (off-63)
  const isSuperintendent = user.role === 'superintendent' || user.orderNumber === 1;

  // Form Fields
  const [leaveType, setLeaveType] = useState<LeaveType>('vacation');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [periodType, setPeriodType] = useState<'full' | 'morning' | 'afternoon'>('full');
  const [isRetroactive, setIsRetroactive] = useState(false);
  const [retroactiveReason, setRetroactiveReason] = useState('');

  // Requirement 29: ผู้ลาปฏิบัติหน้าที่ ให้ทำช่องไว้กรอกเอง ตามภาพ att.TGdvWeI4dBEqtfWEtx0TjY1ya3T8Gl5qxlKsxDfGhFs_4c676f59.jpeg
  const [dutyName, setDutyName] = useState(() => DIVISION_NAMES[user.division] || 'งานอำนวยการ');

  // Requirement 20 & 24: กำลังปฏิบัติหน้าที่... นาย ลา... นาย เหลือกำลังปฏิบัติหน้าที่... นาย
  const [dutyTotalOfficers, setDutyTotalOfficers] = useState<number>(4);
  const [dutyLeavingOfficers, setDutyLeavingOfficers] = useState<number>(1);

  const [contactAddress, setContactAddress] = useState(user.address || stationConfig.address);
  const [contactPhone, setContactPhone] = useState(user.phone || '061-3137089');

  // Additional fields for specific types
  const [spouseName, setSpouseName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [templeName, setTempleName] = useState('');
  const [templeLocation, setTempleLocation] = useState('');
  const [bornDate, setBornDate] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [everOrdained, setEverOrdained] = useState(false);

  // Requirement 27: ผู้บังคับบัญชาที่เรียน (ผกก. หรือ ผบก.ภ.จว.นครพนม สามารถกรอกชื่อเองได้)
  const [recipientTitle, setRecipientTitle] = useState<'ผกก.สภ.ศรีสงคราม' | 'ผบก.ภ.จว.นครพนม'>(
    isSuperintendent ? 'ผบก.ภ.จว.นครพนม' : 'ผกก.สภ.ศรีสงคราม'
  );
  const [commanderCustomName, setCommanderCustomName] = useState(stationConfig.provincialCommanderRankName);

  // Attachments
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formWarnings, setFormWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Requirement 24 & 20: Calculated remaining duty officers
  const dutyRemainingOfficers = useMemo(() => {
    return Math.max(0, dutyTotalOfficers - dutyLeavingOfficers);
  }, [dutyTotalOfficers, dutyLeavingOfficers]);

  // Requirement 67: Count working days vs holidays
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;

    if (periodType === 'morning' || periodType === 'afternoon') {
      return 0.5;
    }

    // Ordination & maternity usually count all calendar days
    if (leaveType === 'ordination' || leaveType === 'maternity') {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Vacation and regular leaves count working days (Monday - Friday and not holiday)
    let count = 0;
    const cur = new Date(start);
    const holidayDates = new Set(holidays.map(h => h.date));

    while (cur <= end) {
      const day = cur.getDay();
      const dateStr = cur.toISOString().split('T')[0];
      // Skip Saturday (6) and Sunday (0) and public holidays
      if (day !== 0 && day !== 6 && !holidayDates.has(dateStr)) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    return Math.max(1, count);
  }, [startDate, endDate, periodType, leaveType, holidays]);

  // Leave statistics
  const userStats = useMemo(() => {
    return getUserLeaveStats(user.id, stationConfig.currentFiscalYear);
  }, [getUserLeaveStats, user.id, stationConfig.currentFiscalYear]);

  // Validate on changes
  useEffect(() => {
    const errs: string[] = [];
    const warns: string[] = [];

    if (!startDate || !endDate) {
      errs.push('กรุณาระบุวันเริ่มต้นและสิ้นสุดการลา');
    } else if (new Date(endDate) < new Date(startDate)) {
      errs.push('วันที่สิ้นสุดการลาต้องไม่เกิดขึ้นก่อนวันที่เริ่มต้นลา');
    }

    // Check duplicate leave dates (Requirement 38)
    const conflict = checkLeaveConflict(user.id, startDate, endDate);
    if (conflict) {
      warns.push(`แจ้งเตือนวันลาซ้ำซ้อน: คุณมีคำขอลาเลขที่ ${conflict.leaveNumber} (${conflict.startDate} ถึง ${conflict.endDate}) อยู่ในช่วงเวลานี้แล้ว`);
    }

    // Check remaining vacation quota (Requirement 37)
    if (leaveType === 'vacation') {
      if (calculatedDays > userStats.vacationRemaining) {
        errs.push(`จำนวนวันลาพักผ่อน (${calculatedDays} วัน) เกินสิทธิคงเหลือของคุณ (${userStats.vacationRemaining} วัน)`);
      }
    }

    // Minimum staffing threshold warning (Requirement 39)
    if (dutyTotalOfficers > 0) {
      const remainingPercent = (dutyRemainingOfficers / dutyTotalOfficers) * 100;
      if (remainingPercent < (stationConfig.minStaffThresholdPercent || 70)) {
        warns.push(`แจ้งเตือนกำลังพลขั้นต่ำ: เหลือกำลังปฏิบัติหน้าที่เพียง ${dutyRemainingOfficers}/${dutyTotalOfficers} นาย (${remainingPercent.toFixed(0)}%) ต่ำกว่าเกณฑ์ความพร้อมปฏิบัติหน้าที่`);
      }
    }

    // Retroactive check
    const today = new Date().toISOString().split('T')[0];
    if (startDate < today && !isRetroactive) {
      warns.push('วันที่เริ่มต้นลาเป็นอดีต กรุณาเลือก "ยื่นคำขอย้อนหลัง" พร้อมระบุเหตุผลความจำเป็น');
    }

    setFormErrors(errs);
    setFormWarnings(warns);
  }, [startDate, endDate, leaveType, calculatedDays, userStats, user.id, dutyTotalOfficers, dutyRemainingOfficers, isRetroactive, checkLeaveConflict, stationConfig.minStaffThresholdPercent]);

  // Handle file attachment simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newItems: AttachmentItem[] = files.map(f => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: f.name,
      size: f.size,
      type: f.type || 'application/pdf',
      url: URL.createObjectURL(f)
    }));
    setAttachments(prev => [...prev, ...newItems]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formErrors.length > 0) return;

    setIsSubmitting(true);

    try {
      const totalQuota = (user.accumulatedLeaveDays || 0) + (user.currentYearLeaveQuota || 10);
      const usedBefore = userStats.vacationUsed;

      const newLeave = submitLeaveRequest({
        fiscalYear: stationConfig.currentFiscalYear,
        userId: user.id,
        userCallSign: user.callSign,
        userRank: user.rank,
        userName: user.firstName,
        userSurname: user.lastName,
        positionTitle: user.positionTitle,
        division: user.division,
        subDivision: user.subDivision,
        dutyName: dutyName || DIVISION_NAMES[user.division],
        leaveType,
        reason: reason || 'ตามระเบียบข้าราชการตำรวจ',
        startDate,
        endDate,
        durationDays: calculatedDays,
        periodType,
        isRetroactive,
        retroactiveReason,
        contactAddress,
        contactPhone,
        accumulatedDays: user.accumulatedLeaveDays,
        currentQuotaDays: user.currentYearLeaveQuota,
        totalQuotaDays: totalQuota,
        usedDaysBefore: usedBefore,
        currentRequestDays: calculatedDays,
        totalUsedDaysAfter: usedBefore + (leaveType === 'vacation' ? calculatedDays : 0),
        dutyTotalOfficers,
        dutyLeavingOfficers,
        dutyRemainingOfficers,
        spouseName,
        childBirthDate,
        templeName,
        templeLocation,
        bornDate,
        joinedDate,
        everOrdained,
        recipientTitle,
        commanderCustomName,
        attachments
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      onSuccess(newLeave.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-linear-to-r from-rose-950 via-rose-900 to-rose-950 rounded-2xl p-6 text-white shadow-lg border border-rose-800/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <FileEdit className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">ยื่นใบลาออนไลน์ (Online Leave Request)</h1>
            <p className="text-xs text-rose-200 mt-1">
              สถานีตำรวจภูธรศรีสงคราม • ปีงบประมาณ {stationConfig.currentFiscalYear}
            </p>
          </div>
        </div>

        {/* Quota Badge */}
        <div className="hidden sm:block bg-black/25 px-4 py-2.5 rounded-xl border border-white/10 text-right">
          <span className="text-[11px] text-amber-300 block">สิทธิวันลาพักผ่อนคงเหลือ</span>
          <span className="text-xl font-bold text-white font-mono">
            {userStats.vacationRemaining} <span className="text-xs font-normal">/ {userStats.totalQuota} วัน</span>
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Errors & Warnings Alert */}
        {formErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs sm:text-sm text-red-800">
            <div className="flex items-center gap-2 font-bold text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              กรุณาแก้ไขข้อผิดพลาดก่อนส่งคำขอ:
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-6 text-red-700">
              {formErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {formWarnings.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs sm:text-sm text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              การแจ้งเตือนจากระบบ:
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-6 text-amber-800">
              {formWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* Card 1: Leave Type Selection (Requirement 26: Clean emojis) */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
          <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <span>1.</span> เลือกประเภทการลา (Leave Type)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(LEAVE_TYPE_LABELS).map(([typeKey, item]) => {
              const isSelected = leaveType === typeKey;
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setLeaveType(typeKey as LeaveType)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-rose-800 bg-rose-50/70 ring-2 ring-rose-800 shadow-xs'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <span className="font-bold text-xs sm:text-sm block text-stone-900 leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      สิทธิสูงสุด {item.maxDays} วัน
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 2: Date, Duration & Period */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
          <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <span>2.</span> กำหนดช่วงเวลาการลา (Date & Duration)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ตั้งแต่วันที่ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-rose-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ถึงวันที่ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-rose-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ช่วงเวลา (Requirement 73)
              </label>
              <select
                value={periodType}
                onChange={e => setPeriodType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-rose-800 bg-white"
              >
                <option value="full">เต็มวัน (ทั้งวัน)</option>
                <option value="morning">ครึ่งวันเช้า (08:30 - 12:00 น.)</option>
                <option value="afternoon">ครึ่งวันบ่าย (13:00 - 16:30 น.)</option>
              </select>
            </div>
          </div>

          {/* Days summary calculation box */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-stone-700">
              <Calendar className="w-4 h-4 text-rose-800" />
              <span>คำนวณวันทำการอัตโนมัติ (หักวันหยุดราชการและเสาร์-อาทิตย์):</span>
            </div>
            <div className="font-bold text-rose-950 font-mono text-base">
              {calculatedDays} วันทำการ
            </div>
          </div>

          {/* Retroactive Switch (Requirement 71) */}
          <div className="pt-2 border-t border-stone-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
              <input
                type="checkbox"
                checked={isRetroactive}
                onChange={e => setIsRetroactive(e.target.checked)}
                className="rounded text-rose-800 focus:ring-rose-800 w-4 h-4"
              />
              <span>ยื่นคำขอย้อนหลัง (กรณีมีเหตุจำเป็นเร่งด่วนตามระเบียบ)</span>
            </label>

            {isRetroactive && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="ระบุเหตุผลความจำเป็นในการยื่นย้อนหลัง..."
                  value={retroactiveReason}
                  onChange={e => setRetroactiveReason(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-amber-300 bg-amber-50/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Duty Department & Manpower (Requirement 20, 21, 29) */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
          <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <span>3.</span> กำลังพลและหน้าที่ปฏิบัติ (Manpower & Duty)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Requirement 29: ผู้ลาปฏิบัติหน้าที่ ให้ทำช่องไว้กรอกเอง */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ผู้ลาปฏิบัติหน้าที่ (กรอกชื่อหน่วยงาน/งาน) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น งานอำนวยการ, งานป้องกันปราบปราม, งานจราจร..."
                value={dutyName}
                onChange={e => setDutyName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-rose-800 bg-white"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                จะนำไปแสดงในแบบใบลาท่อน "ผู้ลาปฏิบัติหน้าที่ ................"
              </p>
            </div>

            {/* Requirement 27: ผู้บังคับบัญชาที่เรียน */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                เรียน ผู้บังคับบัญชา (ตามระเบียบ)
              </label>
              <select
                value={recipientTitle}
                onChange={e => setRecipientTitle(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-rose-800 bg-white"
              >
                <option value="ผกก.สภ.ศรีสงคราม">ผู้กำกับการสถานีตำรวจภูธรศรีสงคราม</option>
                <option value="ผบก.ภ.จว.นครพนม">ผู้บังคับการตำรวจภูธรจังหวัดนครพนม (ผบก.ภ.จว.นครพนม)</option>
              </select>
              {recipientTitle === 'ผบก.ภ.จว.นครพนม' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={commanderCustomName}
                    onChange={e => setCommanderCustomName(e.target.value)}
                    placeholder="ยศและชื่อ ผบก. เช่น พล.ต.ต. อารักษ์ มะสาธานัง"
                    className="w-full p-2 text-xs rounded-lg border border-stone-300 font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Requirement 20: กำลังปฏิบัติหน้าที่... นาย ลา... นาย เหลือกำลังปฏิบัติหน้าที่... นาย */}
          <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-rose-950 block">
              ระบุจำนวนกำลังพลในสายงาน/ผลัด (คำนวณคงเหลืออัตโนมัติ):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  มีกำลังปฏิบัติหน้าที่ (นาย)
                </label>
                <input
                  type="number"
                  min={1}
                  value={dutyTotalOfficers}
                  onChange={e => setDutyTotalOfficers(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-stone-300 font-bold text-center bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ลา (นาย)
                </label>
                <input
                  type="number"
                  min={0}
                  value={dutyLeavingOfficers}
                  onChange={e => setDutyLeavingOfficers(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-stone-300 font-bold text-center bg-white text-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  เหลือกำลังปฏิบัติหน้าที่ (นาย)
                </label>
                <input
                  type="number"
                  disabled
                  value={dutyRemainingOfficers}
                  className="w-full p-2 rounded-lg border border-emerald-300 font-bold text-center bg-emerald-50 text-emerald-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Contact & Reason */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
          <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <span>4.</span> เหตุผลและข้อมูลติดต่อระหว่างลา (Contact & Reason)
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                เหตุผลการลา <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น พักผ่อนประจำปีและเยี่ยมครอบครัว, ติดต่อราชการส่วนตัว, มีอาการไข้หวัด..."
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  สถานที่ติดต่อได้ระหว่างลา <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactAddress}
                  onChange={e => setContactAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อได้ระหว่างลา <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 text-sm font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Conditional: Paternity fields */}
          {leaveType === 'paternity' && (
            <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-purple-950 block">ข้อมูลการลาเพื่อดูแลบุตรและภรรยาหลังคลอด:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="ภรรยาชื่อ-สกุล"
                  value={spouseName}
                  onChange={e => setSpouseName(e.target.value)}
                  className="p-2 text-xs rounded-lg border border-purple-200 bg-white"
                />
                <input
                  type="text"
                  placeholder="คลอดเมื่อ (วันที่ หรือ ระบุเวลา)"
                  value={childBirthDate}
                  onChange={e => setChildBirthDate(e.target.value)}
                  className="p-2 text-xs rounded-lg border border-purple-200 bg-white"
                />
              </div>
            </div>
          )}

          {/* Conditional: Ordination fields */}
          {leaveType === 'ordination' && (
            <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-orange-950 block">ข้อมูลการลาอุปสมบท:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="อุปสมบท ณ วัด"
                  value={templeName}
                  onChange={e => setTempleName(e.target.value)}
                  className="p-2 text-xs rounded-lg border border-orange-200 bg-white"
                />
                <input
                  type="text"
                  placeholder="ตั้งอยู่ ณ (ตำบล อำเภอ จังหวัด)"
                  value={templeLocation}
                  onChange={e => setTempleLocation(e.target.value)}
                  className="p-2 text-xs rounded-lg border border-orange-200 bg-white"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={everOrdained}
                  onChange={e => setEverOrdained(e.target.checked)}
                />
                <span>ข้าพเจ้าเคยอุปสมบทมาก่อน (หากไม่เคย ให้เว้นว่าง)</span>
              </label>
            </div>
          )}

          {/* Requirement 44: File attachments */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <label className="block text-xs font-bold text-stone-700">
              แนบเอกสารประกอบ (ใบรับรองแพทย์, บันทึกข้อความ, เอกสารจำเป็น)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer text-xs font-bold transition">
                <UploadCloud className="w-4 h-4 text-stone-600" />
                <span>เลือกไฟล์แนบ</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-stone-400">รองรับ PDF, JPG, PNG ขนาดไม่เกิน 10MB</span>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-300 rounded-lg text-xs font-medium">
                    <Paperclip className="w-3.5 h-3.5 text-stone-500" />
                    <span>{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-stone-400 hover:text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-stone-500">
            ระบบจะออกเลขที่ใบลาอัตโนมัติ และส่งไปยังผู้บังคับบัญชาตามสายงานทันที
          </p>

          <button
            type="submit"
            disabled={isSubmitting || formErrors.length > 0}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-bold text-sm sm:text-base shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            <span>ยืนยันยื่นใบลาออนไลน์</span>
          </button>
        </div>
      </form>
    </div>
  );
};
