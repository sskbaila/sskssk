import React, { useState, useEffect, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveRequest, LEAVE_TYPE_LABELS, DIVISION_NAMES } from '../types/leave';
import { 
  Users, CheckCircle2, Clock, AlertCircle, FileCheck, 
  Calendar, Printer, TrendingUp, Shield, ArrowRight, 
  Download, Eye, UserX, UserCheck, Edit3, Save 
} from 'lucide-react';

interface DashboardProps {
  onSelectLeave: (leave: LeaveRequest) => void;
  onNavigateSubmit: () => void;
  onNavigateInbox: () => void;
  onPrintA4: (leave: LeaveRequest) => void;
  onPrintManpowerReport: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectLeave,
  onNavigateSubmit,
  onNavigateInbox,
  onPrintA4,
  onPrintManpowerReport
}) => {
  const { 
    officers, 
    leaves, 
    stationConfig, 
    updateDutyManpower, 
    currentUser 
  } = useLeave();

  // Requirement 10: Real-time Live Date and Clock!
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const thaiDateFormatted = useMemo(() => {
    return currentDateTime.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [currentDateTime]);

  const thaiTimeFormatted = useMemo(() => {
    return currentDateTime.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [currentDateTime]);

  // Requirement 24 & 20: Editable input fields for duty officers and leaves
  const [isEditingManpower, setIsEditingManpower] = useState(false);
  const [inputTotalManpower, setInputTotalManpower] = useState<number>(stationConfig.dutyOfficersTotal || officers.length);
  const [inputLeavingManpower, setInputLeavingManpower] = useState<number>(stationConfig.dutyOfficersLeaving || 4);

  useEffect(() => {
    setInputTotalManpower(stationConfig.dutyOfficersTotal || officers.length);
    setInputLeavingManpower(stationConfig.dutyOfficersLeaving || 4);
  }, [stationConfig.dutyOfficersTotal, stationConfig.dutyOfficersLeaving, officers.length]);

  // Auto-calculated remaining duty officers
  const inputRemainingManpower = useMemo(() => {
    return Math.max(0, inputTotalManpower - inputLeavingManpower);
  }, [inputTotalManpower, inputLeavingManpower]);

  const handleSaveManpower = () => {
    updateDutyManpower(inputTotalManpower, inputLeavingManpower);
    setIsEditingManpower(false);
  };

  // Stats calculation
  const totalOfficersCount = officers.length;
  const pendingLeaves = leaves.filter(l => ['pending_supervisor', 'pending_checker', 'pending_approver'].includes(l.status));
  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  
  // Active leaves today
  const todayStr = new Date().toISOString().split('T')[0];
  const currentlyOnLeave = useMemo(() => {
    return leaves.filter(l => {
      if (l.status !== 'approved' && !l.status.startsWith('pending')) return false;
      return l.startDate <= todayStr && l.endDate >= todayStr;
    });
  }, [leaves, todayStr]);

  const activeLeavesCount = currentlyOnLeave.length || inputLeavingManpower;
  const dutyActiveCount = totalOfficersCount - activeLeavesCount;

  // Monthly stats chart mock data calculation
  const monthlyStats = useMemo(() => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return months.map((m, idx) => {
      const monthLeaves = leaves.filter(l => {
        const d = new Date(l.startDate);
        return d.getMonth() === idx;
      });
      const inStation = monthLeaves.filter(l => ['vacation', 'sick'].includes(l.leaveType)).length || (idx % 3 + 2);
      const outStation = monthLeaves.filter(l => ['personal', 'official_duty'].includes(l.leaveType)).length || (idx % 2 + 1);
      return {
        month: m,
        inStation,
        outStation,
        total: inStation + outStation
      };
    });
  }, [leaves]);

  // Leave Type Breakdown
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      vacation: 0,
      personal: 0,
      sick: 0,
      paternity: 0,
      other: 0
    };
    leaves.forEach(l => {
      if (l.leaveType === 'vacation') counts.vacation++;
      else if (l.leaveType === 'personal') counts.personal++;
      else if (l.leaveType === 'sick') counts.sick++;
      else if (l.leaveType === 'paternity') counts.paternity++;
      else counts.other++;
    });
    const total = leaves.length || 1;
    return {
      vacation: counts.vacation,
      personal: counts.personal,
      sick: counts.sick,
      paternity: counts.paternity,
      other: counts.other,
      total: leaves.length,
      vacationPct: ((counts.vacation / total) * 100).toFixed(1),
      personalPct: ((counts.personal / total) * 100).toFixed(1),
      sickPct: ((counts.sick / total) * 100).toFixed(1),
      paternityPct: ((counts.paternity / total) * 100).toFixed(1),
      otherPct: ((counts.other / total) * 100).toFixed(1)
    };
  }, [leaves]);

  // Mini Calendar current month dates
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysCount, currentDay: now.getDate() };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner (Matching screenshot: messageImage_1794278569121_7e8e92b7.jpg) */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-rose-950 via-rose-900 to-rose-950 text-white shadow-xl border border-rose-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-contain bg-no-repeat bg-right pointer-events-none" 
             style={{ backgroundImage: `url('/logo.png')` }}>
        </div>
        
        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 z-10">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Police Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
                ระบบบริหารจัดการการลา สถานีตำรวจภูธรศรีสงคราม
              </h1>
              <p className="text-amber-300 font-semibold text-xs sm:text-sm mt-0.5">
                โปร่งใส • ทันสมัย • บริการด้วยใจ
              </p>
              <p className="text-[11px] text-rose-200 mt-1">
                ตำรวจภูธรจังหวัดนครพนม • กองบัญชาการตำรวจภูธรภาค 4
              </p>
            </div>
          </div>

          {/* Real-time Current Date & Time (Requirement 10) */}
          <div className="bg-black/30 backdrop-blur-xs px-5 py-3 rounded-2xl border border-white/10 text-right shrink-0">
            <div className="flex items-center justify-end gap-2 text-amber-400 text-xs font-bold">
              <Calendar className="w-4 h-4" />
              <span>{thaiDateFormatted}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-wide mt-0.5">
              {thaiTimeFormatted} <span className="text-xs font-normal text-rose-300">น.</span>
            </div>
            <div className="text-[10px] text-rose-300/80">ปีงบประมาณ {stationConfig.currentFiscalYear}</div>
          </div>
        </div>
      </div>

      {/* Requirement 20 & 24: Manpower input fields & Requirement 23: PDF report download */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-rose-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-900 rounded-xl">
            <Users className="w-5 h-5 text-rose-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-950">
              สถานะกำลังพลปฏิบัติหน้าที่ (Duty Manpower Status)
            </h3>
            <p className="text-xs text-stone-500">
              ระบุและตรวจสอบกำลังพลประจำวัน พร้อมพิมพ์รายงานเสนอผู้กำกับ
            </p>
          </div>
        </div>

        {/* The 3 Inputs: กำลังปฏิบัติหน้าที่, ลา, เหลือกำลังปฏิบัติหน้าที่ */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
            <span className="text-stone-600">มีกำลังปฏิบัติหน้าที่:</span>
            {isEditingManpower ? (
              <input
                type="number"
                min={1}
                value={inputTotalManpower}
                onChange={e => setInputTotalManpower(Number(e.target.value))}
                className="w-14 p-1 text-center font-bold border border-rose-300 rounded bg-white"
              />
            ) : (
              <span className="font-bold text-stone-900 font-mono text-sm">{inputTotalManpower}</span>
            )}
            <span className="text-stone-500">นาย</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
            <span className="text-rose-900">ลา:</span>
            {isEditingManpower ? (
              <input
                type="number"
                min={0}
                value={inputLeavingManpower}
                onChange={e => setInputLeavingManpower(Number(e.target.value))}
                className="w-14 p-1 text-center font-bold border border-rose-300 rounded bg-white text-rose-800"
              />
            ) : (
              <span className="font-bold text-rose-800 font-mono text-sm">{inputLeavingManpower}</span>
            )}
            <span className="text-rose-900">นาย</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
            <span className="text-emerald-900">เหลือกำลังปฏิบัติหน้าที่:</span>
            <span className="font-bold text-emerald-800 font-mono text-base">{inputRemainingManpower}</span>
            <span className="text-emerald-900">นาย</span>
          </div>

          {/* Edit / Save Toggle */}
          {isEditingManpower ? (
            <button
              onClick={handleSaveManpower}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow transition"
            >
              <Save className="w-3.5 h-3.5" />
              บันทึก
            </button>
          ) : (
            <button
              onClick={() => setIsEditingManpower(true)}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
              title="แก้ไขจำนวนกำลังพล"
            >
              <Edit3 className="w-3.5 h-3.5" />
              แก้ไข
            </button>
          )}

          {/* Requirement 23: สร้างและดาวน์โหลดรายงานสรุปกำลังพลปฏิบัติหน้าที่ในรูปแบบ PDF เสนอผู้กำกับ */}
          <button
            onClick={onPrintManpowerReport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-900 hover:bg-rose-950 text-white shadow transition transform active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>พิมพ์รายงานเสนอ ผกก.</span>
          </button>
        </div>
      </div>

      {/* 5 Stat Cards (Matching screenshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Officers */}
        <div className="bg-linear-to-br from-blue-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-200">จำนวนตำรวจทั้งหมด</span>
            <Users className="w-5 h-5 text-blue-300 opacity-80" />
          </div>
          <div className="text-3xl font-bold font-mono mt-3">{totalOfficersCount}</div>
          <p className="text-[11px] text-blue-200 mt-1">ข้าราชการตำรวจ สภ.ศรีสงคราม</p>
        </div>

        {/* Card 2: Active on duty today */}
        <div className="bg-linear-to-br from-emerald-700 to-emerald-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200">ผู้ปฏิบัติหน้าที่วันนี้</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-300 opacity-80" />
          </div>
          <div className="text-3xl font-bold font-mono mt-3">{inputRemainingManpower}</div>
          <p className="text-[11px] text-emerald-200 mt-1">พร้อมปฏิบัติภารกิจ 24 ชม.</p>
        </div>

        {/* Card 3: Leaving today */}
        <div className="bg-linear-to-br from-amber-600 to-amber-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-100">ผู้ลาวันนี้</span>
            <UserX className="w-5 h-5 text-amber-200 opacity-80" />
          </div>
          <div className="text-3xl font-bold font-mono mt-3">{inputLeavingManpower}</div>
          <p className="text-[11px] text-amber-100 mt-1">ลาถูกต้องตามระเบียบ</p>
        </div>

        {/* Card 4: Pending Approval */}
        <div 
          onClick={onNavigateInbox}
          className="bg-linear-to-br from-rose-700 to-rose-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-rose-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-200">ใบรออนุมัติ</span>
            <Clock className="w-5 h-5 text-rose-300 opacity-80" />
          </div>
          <div className="text-3xl font-bold font-mono mt-3">{pendingLeaves.length}</div>
          <p className="text-[11px] text-rose-200 mt-1 flex items-center gap-1">
            <span>คลิกดูในกล่องข้อความ</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* Card 5: Total Approved */}
        <div className="bg-linear-to-br from-sky-700 to-blue-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-200">ใบลาอนุมัติแล้ว</span>
            <FileCheck className="w-5 h-5 text-sky-300 opacity-80" />
          </div>
          <div className="text-3xl font-bold font-mono mt-3">{approvedLeaves.length}</div>
          <p className="text-[11px] text-sky-200 mt-1">ปีงบประมาณ {stationConfig.currentFiscalYear}</p>
        </div>
      </div>

      {/* Analytics Row: Monthly Bar Chart + Pie Chart + Calendar (Matching screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Monthly Bar Chart */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-xs border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-800" />
              <h3 className="text-sm font-bold text-stone-900">สถิติการลารายเดือน</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-stone-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
                ลาใน
              </span>
              <span className="flex items-center gap-1 text-stone-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
                ลานอก
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-44 flex items-end gap-2 pt-4 px-2 border-b border-stone-200">
            {monthlyStats.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute -top-8 hidden group-hover:block bg-stone-900 text-white text-[10px] px-2 py-1 rounded shadow z-20 whitespace-nowrap">
                  {item.month}: ใน {item.inStation} / นอก {item.outStation}
                </div>
                <div className="w-full flex flex-col gap-0.5 justify-end h-32">
                  <div 
                    className="w-full bg-amber-400 rounded-t-xs"
                    style={{ height: `${item.outStation * 15}%` }}
                  ></div>
                  <div 
                    className="w-full bg-blue-600 rounded-b-xs"
                    style={{ height: `${item.inStation * 15}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-stone-500 font-semibold">{item.month}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-stone-400 text-right mt-2">
            ข้อมูลปีงบประมาณ {stationConfig.currentFiscalYear}
          </div>
        </div>

        {/* Middle Column: Leave Type Breakdown Pie */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-xs border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-stone-900">ประเภทการลา</h3>
            <span className="text-xs text-stone-500 font-mono">ทั้งหมด {typeCounts.total} ครั้ง</span>
          </div>

          {/* Donut representation */}
          <div className="flex items-center justify-center my-3 relative">
            <div className="w-32 h-32 rounded-full border-8 border-stone-100 flex items-center justify-center relative shadow-inner">
              <div className="text-center">
                <span className="text-2xl font-bold font-mono text-rose-950 block">{typeCounts.total}</span>
                <span className="text-[10px] text-stone-400 uppercase">ครั้ง</span>
              </div>
            </div>
          </div>

          {/* Percentage Legend */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-stone-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                ลาป่วย
              </span>
              <span className="font-mono font-bold text-stone-800">{typeCounts.sickPct}% ({typeCounts.sick})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-stone-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                ลากิจส่วนตัว
              </span>
              <span className="font-mono font-bold text-stone-800">{typeCounts.personalPct}% ({typeCounts.personal})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-stone-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                ลาพักผ่อน
              </span>
              <span className="font-mono font-bold text-stone-800">{typeCounts.vacationPct}% ({typeCounts.vacation})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-stone-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                ลาคลอด/บุตร
              </span>
              <span className="font-mono font-bold text-stone-800">{typeCounts.paternityPct}% ({typeCounts.paternity})</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mini Calendar Widget */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-xs border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-rose-800" />
              <h3 className="text-sm font-bold text-stone-900">ปฏิทินการลา</h3>
            </div>
            <span className="text-xs font-bold text-rose-950">
              {currentDateTime.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Mini Calendar Grid */}
          <div className="text-[11px] text-center">
            <div className="grid grid-cols-7 gap-1 font-bold text-stone-400 mb-1">
              <span>อา.</span><span>จ.</span><span>อ.</span><span>พ.</span><span>พฤ.</span><span>ศ.</span><span>ส.</span>
            </div>
            <div className="grid grid-cols-7 gap-1 font-mono">
              {Array.from({ length: calendarDays.firstDay }).map((_, i) => (
                <span key={`empty-${i}`} className="p-1 text-transparent">-</span>
              ))}
              {Array.from({ length: calendarDays.daysCount }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = dayNum === calendarDays.currentDay;
                return (
                  <span
                    key={dayNum}
                    className={`p-1 rounded-lg ${
                      isToday 
                        ? 'bg-rose-900 text-white font-bold ring-2 ring-rose-400' 
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {dayNum}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 text-[10px] text-stone-500 flex items-center justify-around">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> ป่วย
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> กิจ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> พักผ่อน
            </span>
          </div>
        </div>
      </div>

      {/* Two Tables Row: ผู้กำลังลาในขณะนี้ & รายการใบลาล่าสุด (Matching screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: ผู้กำลังลาในขณะนี้ */}
        <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-800" />
              <h3 className="text-sm font-bold text-stone-900">
                ผู้กำลังลาในขณะนี้ ({currentlyOnLeave.length} นาย)
              </h3>
            </div>
            <button
              onClick={onNavigateInbox}
              className="text-xs font-bold text-rose-800 hover:underline flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/60 text-stone-600 font-bold border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">ลำดับ</th>
                  <th className="py-2.5 px-3">ชื่อ-สกุล</th>
                  <th className="py-2.5 px-3">ตำแหน่ง/สายงาน</th>
                  <th className="py-2.5 px-3">ประเภทการลา</th>
                  <th className="py-2.5 px-3">วันที่ลา - ถึงวันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {currentlyOnLeave.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      ไม่มีข้าราชการตำรวจลาในวันนี้
                    </td>
                  </tr>
                ) : (
                  currentlyOnLeave.slice(0, 5).map((l, idx) => {
                    const type = LEAVE_TYPE_LABELS[l.leaveType] || { name: l.leaveType, emoji: '📄' };
                    return (
                      <tr key={l.id} className="hover:bg-rose-50/20">
                        <td className="py-2.5 px-3 font-mono text-stone-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-stone-900">
                          {l.userRank} {l.userName} {l.userSurname}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600">
                          {l.dutyName || l.positionTitle}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-stone-800">
                            <span>{type.emoji}</span>
                            <span>{type.name}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">
                          {l.startDate} - {l.endDate}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: รายการใบลาล่าสุด */}
        <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-rose-800" />
              <h3 className="text-sm font-bold text-stone-900">รายการใบลาล่าสุด</h3>
            </div>
            <button
              onClick={onNavigateInbox}
              className="text-xs font-bold text-rose-800 hover:underline flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/60 text-stone-600 font-bold border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">เลขที่ใบลา</th>
                  <th className="py-2.5 px-3">ชื่อ-สกุล</th>
                  <th className="py-2.5 px-3">ประเภท</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                  <th className="py-2.5 px-3 text-right">เปิดดู</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {leaves.slice(0, 5).map(l => {
                  const type = LEAVE_TYPE_LABELS[l.leaveType] || { name: l.leaveType, emoji: '📄' };
                  return (
                    <tr key={l.id} className="hover:bg-rose-50/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-950">
                        {l.leaveNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-stone-900">{l.userRank} {l.userName} {l.userSurname}</div>
                        <div className="text-[10px] text-stone-500 font-mono">{l.userCallSign}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-stone-700">{type.emoji} {type.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          l.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          l.status === 'cancelled' ? 'bg-stone-100 text-stone-700' :
                          'bg-amber-100 text-amber-900'
                        }`}>
                          {l.status === 'approved' ? 'อนุมัติแล้ว' :
                           l.status === 'rejected' ? 'ไม่อนุมัติ' :
                           l.status === 'cancelled' ? 'ยกเลิก' :
                           'รออนุมัติ'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onSelectLeave(l)}
                          className="p-1 text-rose-900 hover:bg-rose-50 rounded"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
