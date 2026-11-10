import React, { useState, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveRequest, LEAVE_TYPE_LABELS, DIVISION_NAMES } from '../types/leave';
import { 
  History, Search, Filter, Calendar, Printer, Eye, 
  Download, WifiOff, CheckCircle2, XCircle, Clock, Ban 
} from 'lucide-react';

interface LeaveHistoryProps {
  onSelectLeave: (leave: LeaveRequest) => void;
  onPrintA4: (leave: LeaveRequest) => void;
}

export const LeaveHistory: React.FC<LeaveHistoryProps> = ({ onSelectLeave, onPrintA4 }) => {
  const { leaves, officers, currentUser, selectedFiscalYear, getUserLeaveStats } = useLeave();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<number>(selectedFiscalYear);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superintendent';

  // If user is regular personnel, restrict to own leaves unless admin (Requirement 33 & 81)
  const accessibleLeaves = useMemo(() => {
    if (isAdmin) return leaves;
    return leaves.filter(l => l.userId === currentUser?.id);
  }, [leaves, isAdmin, currentUser]);

  const filteredLeaves = useMemo(() => {
    return accessibleLeaves.filter(leave => {
      if (filterYear && leave.fiscalYear !== filterYear) return false;
      if (filterType !== 'all' && leave.leaveType !== filterType) return false;
      if (filterStatus !== 'all' && leave.status !== filterStatus) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = `${leave.userRank} ${leave.userName} ${leave.userSurname}`.toLowerCase().includes(term);
        const matchCall = leave.userCallSign.toLowerCase().includes(term);
        const matchNum = leave.leaveNumber.toLowerCase().includes(term);
        const matchReason = (leave.reason || '').toLowerCase().includes(term);
        if (!matchName && !matchCall && !matchNum && !matchReason) return false;
      }

      return true;
    });
  }, [accessibleLeaves, filterYear, filterType, filterStatus, searchTerm]);

  // Current user's leave stats
  const currentStats = useMemo(() => {
    if (!currentUser) return null;
    return getUserLeaveStats(currentUser.id, filterYear);
  }, [currentUser, filterYear, getUserLeaveStats]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-linear-to-r from-rose-950 via-rose-900 to-rose-950 rounded-2xl p-6 text-white shadow-lg border border-rose-800/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <History className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">ประวัติการลา (Leave History)</h1>
              {/* Requirement 22: Offline indicator via Service Worker */}
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold flex items-center gap-1">
                <span>⚡ แคชข้อมูลออฟไลน์ (PWA Active)</span>
              </span>
            </div>
            <p className="text-xs text-rose-200 mt-1">
              ค้นหาประวัติการลาย้อนหลัง ตรวจสอบสิทธิคงเหลือ และดูแบบพิมพ์ใบลา
            </p>
          </div>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2 bg-black/25 px-3 py-1.5 rounded-xl border border-white/10">
          <span className="text-xs text-rose-200 font-bold">ปีงบประมาณ:</span>
          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            className="bg-transparent text-white font-bold text-xs focus:outline-hidden"
          >
            {Array.from({ length: 10 }, (_, i) => 2565 + i).map(y => (
              <option key={y} value={y} className="text-black">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quota Overview if logged in */}
      {currentStats && (
        <div className="bg-white p-4 rounded-xl border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-stone-500 block">สิทธิลาพักผ่อนทั้งหมด</span>
            <span className="text-lg font-bold text-amber-900 font-mono">{currentStats.totalQuota} วัน</span>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200">
            <span className="text-stone-500 block">ลาพักผ่อนที่ใช้ไป</span>
            <span className="text-lg font-bold text-rose-800 font-mono">{currentStats.vacationUsed} วัน</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="text-stone-500 block">สิทธิพักผ่อนคงเหลือ</span>
            <span className="text-lg font-bold text-emerald-800 font-mono">{currentStats.vacationRemaining} วัน</span>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-stone-500 block">ลากิจส่วนตัวที่ใช้</span>
            <span className="text-lg font-bold text-blue-900 font-mono">{currentStats.personalUsed} วัน</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ใบลา, ชื่อผู้ลา, นามเรียกขาน หรือเหตุผลการลา..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50"
          >
            <option value="all">ทุกประเภทการลา</option>
            {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="pending_supervisor">รอหัวหน้างาน</option>
            <option value="pending_checker">รอผู้ตรวจสอบ</option>
            <option value="pending_approver">รอผู้อนุมัติ</option>
            <option value="rejected">ไม่อนุมัติ</option>
            <option value="cancelled">ยกเลิกแล้ว</option>
          </select>
        </div>
      </div>

      {/* Leave History List */}
      <div className="bg-white rounded-xl shadow-xs border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">เลขที่ใบลา</th>
                <th className="py-3 px-4">ข้าราชการตำรวจ</th>
                <th className="py-3 px-4">ประเภทการลา</th>
                <th className="py-3 px-4">ช่วงเวลาลา</th>
                <th className="py-3 px-4 text-center">จำนวนวัน</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">เปิดดู</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    ไม่พบรายการประวัติการลาตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(leave => {
                  const type = LEAVE_TYPE_LABELS[leave.leaveType] || { name: leave.leaveType, emoji: '📄' };
                  return (
                    <tr key={leave.id} className="hover:bg-rose-50/20">
                      <td className="py-3 px-4 font-mono font-bold text-rose-950">
                        {leave.leaveNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">
                          {leave.userRank} {leave.userName} {leave.userSurname}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {leave.userCallSign} ({DIVISION_NAMES[leave.division]})
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-stone-800">
                          {type.emoji} {type.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-stone-700">
                        <div>{leave.startDate}</div>
                        <div className="text-stone-400">ถึง {leave.endDate}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-rose-950">
                        {leave.durationDays} วัน
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          leave.status === 'cancelled' ? 'bg-stone-100 text-stone-700' :
                          'bg-amber-100 text-amber-900'
                        }`}>
                          {leave.status === 'approved' ? 'อนุมัติแล้ว' :
                           leave.status === 'rejected' ? 'ไม่อนุมัติ' :
                           leave.status === 'cancelled' ? 'ยกเลิก' :
                           'รออนุมัติ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPrintA4(leave)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                            title="พิมพ์เอกสาร A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectLeave(leave)}
                            className="px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-950 text-white font-bold text-xs shadow transition"
                          >
                            ดูรายละเอียด
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
