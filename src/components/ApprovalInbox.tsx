import React, { useState, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveRequest, LEAVE_TYPE_LABELS, DIVISION_NAMES } from '../types/leave';
import { 
  Inbox, CheckCircle2, XCircle, Search, Filter, Calendar, 
  Printer, Eye, Ban, ShieldAlert, ArrowUpDown, ChevronDown 
} from 'lucide-react';

interface ApprovalInboxProps {
  onSelectLeave: (leave: LeaveRequest) => void;
  onPrintA4: (leave: LeaveRequest) => void;
}

export const ApprovalInbox: React.FC<ApprovalInboxProps> = ({ onSelectLeave, onPrintA4 }) => {
  const { leaves, currentUser, cancelLeaveRequest, approveLeaveRequest } = useLeave();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const isAdmin = currentUser?.role === 'admin';
  const isSuperintendent = currentUser?.role === 'superintendent';

  // Filter leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter(leave => {
      // Tab filter
      if (activeTab === 'pending') {
        if (!['pending_supervisor', 'pending_checker', 'pending_approver'].includes(leave.status)) return false;
      } else if (activeTab === 'approved') {
        if (leave.status !== 'approved') return false;
      } else if (activeTab === 'rejected') {
        if (!['rejected', 'cancelled', 'withdrawn'].includes(leave.status)) return false;
      }

      // Division filter
      if (filterDivision !== 'all' && leave.division !== filterDivision) return false;

      // Type filter
      if (filterType !== 'all' && leave.leaveType !== filterType) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = `${leave.userRank} ${leave.userName} ${leave.userSurname}`.toLowerCase().includes(term);
        const matchCall = leave.userCallSign.toLowerCase().includes(term);
        const matchNum = leave.leaveNumber.toLowerCase().includes(term);
        const matchDuty = (leave.dutyName || '').toLowerCase().includes(term);
        if (!matchName && !matchCall && !matchNum && !matchDuty) return false;
      }

      return true;
    });
  }, [leaves, activeTab, filterDivision, filterType, searchTerm]);

  const pendingCount = useMemo(() => {
    return leaves.filter(l => ['pending_supervisor', 'pending_checker', 'pending_approver'].includes(l.status)).length;
  }, [leaves]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-rose-950 via-rose-900 to-rose-950 rounded-2xl p-6 text-white shadow-lg border border-rose-800/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <Inbox className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">กล่องข้อความอนุมัติการลา (Approval Inbox)</h1>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-900 font-bold text-xs">
                  รออนุมัติ {pendingCount} รายการ
                </span>
              )}
            </div>
            <p className="text-xs text-rose-200 mt-1">
              ตรวจสอบคำขอลา พิจารณาความเห็นผู้บังคับบัญชา และลงนามคำสั่งอนุมัติ
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-black/25 p-1 rounded-xl text-xs font-bold border border-white/10">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'pending' ? 'bg-amber-500 text-stone-900 shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            รออนุมัติ ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'approved' ? 'bg-emerald-600 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            อนุมัติแล้ว
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'rejected' ? 'bg-red-600 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            ไม่อนุมัติ/ยกเลิก
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'all' ? 'bg-white/20 text-white shadow' : 'text-stone-300 hover:text-white'
            }`}
          >
            ทั้งหมด
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ใบลา, ชื่อข้าราชการตำรวจ, นามเรียกขาน หรือสายงาน..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Division filter */}
          <select
            value={filterDivision}
            onChange={e => setFilterDivision(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
          >
            <option value="all">ทุกสายงาน</option>
            {Object.entries(DIVISION_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>

          {/* Leave type filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
          >
            <option value="all">ทุกประเภทการลา</option>
            {Object.entries(LEAVE_TYPE_LABELS).map(([key, item]) => (
              <option key={key} value={key}>{item.emoji} {item.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leave List Table */}
      <div className="bg-white rounded-xl shadow-xs border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">เลขที่ใบลา</th>
                <th className="py-3.5 px-4">ข้าราชการตำรวจผู้ลา</th>
                <th className="py-3.5 px-4">สายงาน/หน้าที่</th>
                <th className="py-3.5 px-4">ประเภทการลา</th>
                <th className="py-3.5 px-4">ช่วงเวลาลา</th>
                <th className="py-3.5 px-4 text-center">จำนวนวัน</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 font-medium">
                    ไม่พบรายการคำขอลาตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(leave => {
                  const type = LEAVE_TYPE_LABELS[leave.leaveType] || { name: leave.leaveType, emoji: '📄' };
                  const isOwner = currentUser?.id === leave.userId;
                  const canCancel = (isOwner || isAdmin) && !['cancelled', 'withdrawn'].includes(leave.status);

                  return (
                    <tr key={leave.id} className="hover:bg-rose-50/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-rose-950">
                        {leave.leaveNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">
                          {leave.userRank} {leave.userName} {leave.userSurname}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {leave.userCallSign}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-stone-800">{DIVISION_NAMES[leave.division]}</div>
                        <div className="text-stone-500 text-[11px]">{leave.dutyName || leave.subDivision}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-stone-800">
                          <span>{type.emoji}</span>
                          <span>{type.name}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-700 text-xs">
                        <div>{leave.startDate}</div>
                        <div className="text-stone-400 text-[11px]">ถึง {leave.endDate}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-rose-950">
                        {leave.durationDays} วัน
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          leave.status === 'cancelled' ? 'bg-stone-100 text-stone-700' :
                          leave.status === 'withdrawn' ? 'bg-stone-100 text-stone-500' :
                          'bg-amber-100 text-amber-900'
                        }`}>
                          {leave.status === 'approved' ? 'อนุมัติแล้ว' :
                           leave.status === 'rejected' ? 'ไม่อนุมัติ' :
                           leave.status === 'cancelled' ? 'ยกเลิก' :
                           leave.status === 'withdrawn' ? 'ถอนคำขอ' :
                           'รออนุมัติ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Requirement 19: ปุ่ม 'ยกเลิกคำขอลา' ใน ApprovalInbox สำหรับเจ้าของคำขอหรือ Admin */}
                          {canCancel && (
                            <button
                              onClick={() => {
                                if (confirm(`คุณต้องการยกเลิกคำขอลาเลขที่ ${leave.leaveNumber} ใช่หรือไม่?`)) {
                                  cancelLeaveRequest(leave.id, 'ยกเลิกจากกล่องข้อความอนุมัติ');
                                }
                              }}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
                              title="ยกเลิกคำขอลา"
                            >
                              <Ban className="w-4 h-4 text-stone-500" />
                            </button>
                          )}

                          {/* Print button */}
                          <button
                            onClick={() => onPrintA4(leave)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition"
                            title="พิมพ์เอกสารใบลา A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Details / Review button */}
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
