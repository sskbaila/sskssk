import React, { useState, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LEAVE_TYPE_LABELS, DIVISION_NAMES, LeaveType } from '../types/leave';
import { 
  BarChart3, Printer, Download, FileSpreadsheet, FileText, 
  Search, Filter, Calendar, Users, Shield, ArrowUpDown 
} from 'lucide-react';

export const LeaveReports: React.FC = () => {
  const { officers, leaves, stationConfig } = useLeave();

  const [activeReportTab, setActiveReportTab] = useState<
    'monthly_register' | 'manpower_daily' | 'individual_summary' | 'division_summary' | 'frequent_leave'
  >('monthly_register');

  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 9 = ตุลาคม
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const monthsTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Frequent leavers ranking (Requirement 59)
  const frequentLeavers = useMemo(() => {
    const stats: Record<string, { officer: typeof officers[0]; totalDays: number; totalCount: number }> = {};
    officers.forEach(off => {
      stats[off.id] = { officer: off, totalDays: 0, totalCount: 0 };
    });

    leaves.forEach(l => {
      if (l.status === 'approved' || l.status.startsWith('pending')) {
        if (stats[l.userId]) {
          stats[l.userId].totalDays += l.durationDays;
          stats[l.userId].totalCount += 1;
        }
      }
    });

    return Object.values(stats)
      .sort((a, b) => b.totalDays - a.totalDays)
      .filter(s => s.totalDays > 0);
  }, [officers, leaves]);

  // Division breakdown (Requirement 53)
  const divisionStats = useMemo(() => {
    return Object.keys(DIVISION_NAMES).map(divKey => {
      const divOfficers = officers.filter(o => o.division === divKey);
      const divLeaves = leaves.filter(l => l.division === divKey && l.status === 'approved');
      const totalDays = divLeaves.reduce((acc, cur) => acc + cur.durationDays, 0);

      return {
        key: divKey,
        name: DIVISION_NAMES[divKey as keyof typeof DIVISION_NAMES],
        totalOfficers: divOfficers.length,
        totalLeaves: divLeaves.length,
        totalDays
      };
    });
  }, [officers, leaves]);

  // Export to CSV / Excel (Requirement 56)
  const exportToCSV = () => {
    const headers = ['ลำดับ', 'เลขที่ใบลา', 'ยศ', 'ชื่อ', 'สกุล', 'นามเรียกขาน', 'สายงาน', 'ประเภทการลา', 'วันเริ่มต้น', 'วันสิ้นสุด', 'จำนวนวัน', 'สถานะ'];
    const rows = leaves.map((l, i) => [
      i + 1,
      l.leaveNumber,
      l.userRank,
      l.userName,
      l.userSurname,
      l.userCallSign,
      DIVISION_NAMES[l.division] || l.division,
      LEAVE_TYPE_LABELS[l.leaveType]?.name || l.leaveType,
      l.startDate,
      l.endDate,
      l.durationDays,
      l.status
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานการลา_สภ.ศรีสงคราม_${monthsTh[selectedMonth]}_${selectedYear + 543}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-linear-to-r from-rose-950 via-rose-900 to-rose-950 rounded-2xl p-6 text-white shadow-lg border border-rose-800/40 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <BarChart3 className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">สถิติและรายงานราชการ (Reports & Registry)</h1>
            <p className="text-xs text-rose-200 mt-1">
              ทะเบียนคุมการลา พิมพ์รายงานเสนอผู้กำกับ และส่งออกข้อมูล Excel / PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Requirement 56: Export Excel */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก Excel (CSV)</span>
          </button>

          {/* Requirement 57 & 58: Print standard official report */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 shadow transition transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงานเสนอ ผกก. (A4)</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2 no-print text-xs font-bold">
        <button
          onClick={() => setActiveReportTab('monthly_register')}
          className={`px-4 py-2 rounded-xl transition ${
            activeReportTab === 'monthly_register'
              ? 'bg-rose-900 text-white shadow'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          📋 ทะเบียนคุมการลารายเดือน (เสนอ ผกก.)
        </button>
        <button
          onClick={() => setActiveReportTab('manpower_daily')}
          className={`px-4 py-2 rounded-xl transition ${
            activeReportTab === 'manpower_daily'
              ? 'bg-rose-900 text-white shadow'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          👮 รายงานสรุปกำลังพลปฏิบัติหน้าที่
        </button>
        <button
          onClick={() => setActiveReportTab('individual_summary')}
          className={`px-4 py-2 rounded-xl transition ${
            activeReportTab === 'individual_summary'
              ? 'bg-rose-900 text-white shadow'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          👤 สรุปวันลารายบุคคล (72 นาย)
        </button>
        <button
          onClick={() => setActiveReportTab('division_summary')}
          className={`px-4 py-2 rounded-xl transition ${
            activeReportTab === 'division_summary'
              ? 'bg-rose-900 text-white shadow'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          🏢 รายงานแยกตามสายงาน
        </button>
        <button
          onClick={() => setActiveReportTab('frequent_leave')}
          className={`px-4 py-2 rounded-xl transition ${
            activeReportTab === 'frequent_leave'
              ? 'bg-rose-900 text-white shadow'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          📊 สถิติผู้ลาบ่อย
        </button>
      </div>

      {/* Report 1: ทะเบียนคุมการลารายเดือน (Requirement 13 & 58) */}
      {activeReportTab === 'monthly_register' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4 print:p-0 print:border-none print:shadow-none">
          <div className="text-center space-y-1 border-b pb-4">
            <h2 className="text-lg font-bold text-stone-900">
              ทะเบียนคุมการลาข้าราชการตำรวจ {stationConfig.stationName}
            </h2>
            <p className="text-sm text-stone-600 font-semibold">
              ประจำเดือน {monthsTh[selectedMonth]} พ.ศ. {selectedYear + 543} (ปีงบประมาณ {stationConfig.currentFiscalYear})
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-stone-400 text-xs text-left">
              <thead>
                <tr className="bg-stone-100 text-stone-900 font-bold text-center">
                  <th className="border border-stone-400 p-2 w-12">ลำดับ</th>
                  <th className="border border-stone-400 p-2">เลขที่ใบลา</th>
                  <th className="border border-stone-400 p-2">ยศ ชื่อ-สกุล</th>
                  <th className="border border-stone-400 p-2">ตำแหน่ง/สายงาน</th>
                  <th className="border border-stone-400 p-2">ประเภทการลา</th>
                  <th className="border border-stone-400 p-2 text-center">ช่วงวันที่ลา</th>
                  <th className="border border-stone-400 p-2 text-center w-16">จำนวนวัน</th>
                  <th className="border border-stone-400 p-2 text-center w-24">คำสั่ง/สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l, idx) => {
                  const type = LEAVE_TYPE_LABELS[l.leaveType] || { name: l.leaveType, emoji: '📄' };
                  return (
                    <tr key={l.id} className="hover:bg-rose-50/20">
                      <td className="border border-stone-300 p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-stone-300 p-2 font-mono font-bold">{l.leaveNumber}</td>
                      <td className="border border-stone-300 p-2 font-bold">{l.userRank} {l.userName} {l.userSurname}</td>
                      <td className="border border-stone-300 p-2 text-stone-700">{l.dutyName || l.positionTitle}</td>
                      <td className="border border-stone-300 p-2">{type.emoji} {type.name}</td>
                      <td className="border border-stone-300 p-2 text-center font-mono">{l.startDate} ถึง {l.endDate}</td>
                      <td className="border border-stone-300 p-2 text-center font-bold">{l.durationDays}</td>
                      <td className="border border-stone-300 p-2 text-center font-semibold">
                        {l.status === 'approved' ? 'อนุญาต' : l.status === 'rejected' ? 'ไม่อนุญาต' : 'รอคำสั่ง'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Commander Signature Block for Registry */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-stone-300 text-xs sm:text-sm">
            <div className="text-center space-y-1">
              <div>ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา</div>
              <div className="pt-4 font-mono">(ลงชื่อ) พ.ต.ต....................................................</div>
              <div className="font-bold">( {stationConfig.superintendentRankName || 'เลิศพิสิฐธร สมบัติภูธร'} )</div>
              <div className="text-stone-600">ตำแหน่ง สว.อก.สภ.ศรีสงคราม</div>
            </div>

            <div className="text-center space-y-1">
              <div>ทราบ / อนุมัติ</div>
              <div className="pt-4 font-mono">(ลงชื่อ) พ.ต.อ....................................................</div>
              <div className="font-bold">( {stationConfig.superintendentRankName} )</div>
              <div className="text-stone-600">ตำแหน่ง {stationConfig.superintendentPosition}</div>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: รายงานสรุปกำลังพลปฏิบัติหน้าที่ (Requirement 23) */}
      {activeReportTab === 'manpower_daily' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-6 print:p-0 print:border-none print:shadow-none">
          <div className="text-center space-y-1 border-b pb-4">
            <h2 className="text-lg font-bold text-stone-900">
              รายงานสรุปกำลังพลปฏิบัติหน้าที่ประจำวัน {stationConfig.stationName}
            </h2>
            <p className="text-sm text-stone-600">
              ณ วันที่ {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <span className="text-xs text-stone-500 block">กำลังปฏิบัติหน้าที่ทั้งหมด</span>
              <span className="text-2xl font-bold font-mono text-stone-900">{stationConfig.dutyOfficersTotal} นาย</span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block">ข้าราชการตำรวจลา</span>
              <span className="text-2xl font-bold font-mono text-rose-800">{stationConfig.dutyOfficersLeaving} นาย</span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block">เหลือกำลังปฏิบัติหน้าที่จริง</span>
              <span className="text-2xl font-bold font-mono text-emerald-800">
                {Math.max(0, stationConfig.dutyOfficersTotal - stationConfig.dutyOfficersLeaving)} นาย
              </span>
            </div>
          </div>

          {/* Division breakdown */}
          <table className="w-full border-collapse border border-stone-400 text-xs">
            <thead>
              <tr className="bg-stone-100 text-stone-900 font-bold text-center">
                <th className="border border-stone-400 p-2">สายงาน</th>
                <th className="border border-stone-400 p-2">กำลังพลทั้งหมด (นาย)</th>
                <th className="border border-stone-400 p-2">ปฏิบัติหน้าที่ (นาย)</th>
                <th className="border border-stone-400 p-2">ลา (นาย)</th>
                <th className="border border-stone-400 p-2">ความพร้อม (%)</th>
              </tr>
            </thead>
            <tbody>
              {divisionStats.map(d => {
                const leaving = leaves.filter(l => l.division === d.key && l.status === 'approved').length;
                const active = Math.max(0, d.totalOfficers - leaving);
                const pct = d.totalOfficers > 0 ? ((active / d.totalOfficers) * 100).toFixed(0) : 100;
                return (
                  <tr key={d.key} className="text-center hover:bg-stone-50">
                    <td className="border border-stone-300 p-2 text-left font-bold">{d.name}</td>
                    <td className="border border-stone-300 p-2 font-mono">{d.totalOfficers}</td>
                    <td className="border border-stone-300 p-2 font-mono font-bold text-emerald-800">{active}</td>
                    <td className="border border-stone-300 p-2 font-mono font-bold text-rose-800">{leaving}</td>
                    <td className="border border-stone-300 p-2 font-mono">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Presentation Block to Superintendent */}
          <div className="pt-6 border-t border-stone-300 text-xs sm:text-sm text-center">
            <div>เพื่อโปรดทราบและพิจารณา</div>
            <div className="pt-4 font-mono">(ลงชื่อ) พ.ต.อ....................................................</div>
            <div className="font-bold">( {stationConfig.superintendentRankName} )</div>
            <div className="text-stone-600">ตำแหน่ง {stationConfig.superintendentPosition}</div>
          </div>
        </div>
      )}

      {/* Report 3: สรุปวันลารายบุคคล (Requirement 52) */}
      {activeReportTab === 'individual_summary' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">
              สรุปวันลาข้าราชการตำรวจรายบุคคล (ทั้งสิ้น {officers.length} นาย)
            </h2>
            <input
              type="text"
              placeholder="ค้นหาชื่อ/นามเรียกขาน..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="p-1.5 text-xs rounded-lg border border-stone-300 w-48"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-stone-300 text-xs text-left">
              <thead>
                <tr className="bg-stone-50 text-stone-700 font-bold text-center">
                  <th className="border border-stone-300 p-2 w-12">ลำดับ</th>
                  <th className="border border-stone-300 p-2 w-28">นามเรียกขาน</th>
                  <th className="border border-stone-300 p-2">ยศ ชื่อ-สกุล</th>
                  <th className="border border-stone-300 p-2">สายงาน</th>
                  <th className="border border-stone-300 p-2 text-center">ลาพักผ่อน (วัน)</th>
                  <th className="border border-stone-300 p-2 text-center">ลากิจ (วัน)</th>
                  <th className="border border-stone-300 p-2 text-center">ลาป่วย (วัน)</th>
                  <th className="border border-stone-300 p-2 text-center">สิทธิคงเหลือ (วัน)</th>
                </tr>
              </thead>
              <tbody>
                {officers
                  .filter(o => !searchTerm || `${o.rank} ${o.firstName} ${o.lastName} ${o.callSign}`.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((off, idx) => {
                    const offLeaves = leaves.filter(l => l.userId === off.id && l.status === 'approved');
                    const vac = offLeaves.filter(l => l.leaveType === 'vacation').reduce((a, b) => a + b.durationDays, 0);
                    const per = offLeaves.filter(l => l.leaveType === 'personal').reduce((a, b) => a + b.durationDays, 0);
                    const sic = offLeaves.filter(l => l.leaveType === 'sick').reduce((a, b) => a + b.durationDays, 0);
                    const totalQuota = off.accumulatedLeaveDays + off.currentYearLeaveQuota;
                    const rem = Math.max(0, totalQuota - vac);

                    return (
                      <tr key={off.id} className="hover:bg-rose-50/20">
                        <td className="border border-stone-200 p-2 text-center font-mono">{idx + 1}</td>
                        <td className="border border-stone-200 p-2 font-bold font-mono text-rose-950">{off.callSign}</td>
                        <td className="border border-stone-200 p-2 font-semibold">{off.rank} {off.firstName} {off.lastName}</td>
                        <td className="border border-stone-200 p-2 text-stone-600">{DIVISION_NAMES[off.division]}</td>
                        <td className="border border-stone-200 p-2 text-center font-mono">{vac}</td>
                        <td className="border border-stone-200 p-2 text-center font-mono">{per}</td>
                        <td className="border border-stone-200 p-2 text-center font-mono">{sic}</td>
                        <td className="border border-stone-200 p-2 text-center font-mono font-bold text-emerald-800">{rem}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 4: รายงานแยกตามสายงาน (Requirement 53) */}
      {activeReportTab === 'division_summary' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
          <h2 className="text-base font-bold text-stone-900">
            สถิติการลาจำแนกตาม 6 สายงานหลัก สภ.ศรีสงคราม
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {divisionStats.map(d => (
              <div key={d.key} className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                <span className="text-xs font-bold text-rose-900 block">{d.name}</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">จำนวนข้าราชการตำรวจ:</span>
                  <span className="font-bold text-stone-900">{d.totalOfficers} นาย</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">จำนวนครั้งที่ลา:</span>
                  <span className="font-bold text-rose-800">{d.totalLeaves} ครั้ง</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">รวมวันลาทั้งหมด:</span>
                  <span className="font-bold text-stone-900">{d.totalDays} วัน</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report 5: สถิติผู้ลาบ่อย (Requirement 59) */}
      {activeReportTab === 'frequent_leave' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
          <h2 className="text-base font-bold text-stone-900">
            วิเคราะห์สถิติผู้ที่ลาบ่อย (Frequent Leave Analytics)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-stone-200 text-xs text-left">
              <thead>
                <tr className="bg-stone-50 text-stone-700 font-bold text-center">
                  <th className="p-2 border border-stone-200 w-12">อันดับ</th>
                  <th className="p-2 border border-stone-200">นามเรียกขาน</th>
                  <th className="p-2 border border-stone-200">ยศ ชื่อ-สกุล</th>
                  <th className="p-2 border border-stone-200">สายงาน</th>
                  <th className="p-2 border border-stone-200 text-center">จำนวนครั้งที่ยื่นลา</th>
                  <th className="p-2 border border-stone-200 text-center">รวมจำนวนวันที่ลา (วัน)</th>
                </tr>
              </thead>
              <tbody>
                {frequentLeavers.map((item, idx) => (
                  <tr key={item.officer.id} className="hover:bg-rose-50/20">
                    <td className="p-2 border border-stone-200 text-center font-bold text-stone-600">{idx + 1}</td>
                    <td className="p-2 border border-stone-200 font-mono font-bold text-rose-950">{item.officer.callSign}</td>
                    <td className="p-2 border border-stone-200 font-semibold">{item.officer.rank} {item.officer.firstName} {item.officer.lastName}</td>
                    <td className="p-2 border border-stone-200 text-stone-600">{DIVISION_NAMES[item.officer.division]}</td>
                    <td className="p-2 border border-stone-200 text-center font-bold text-rose-800">{item.totalCount} ครั้ง</td>
                    <td className="p-2 border border-stone-200 text-center font-bold font-mono text-stone-900">{item.totalDays} วัน</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
