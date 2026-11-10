import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { Shield, X, Search, Clock, FileText, User, Filter } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const { auditLogs } = useLeave();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      if (!log.actorName.toLowerCase().includes(t) &&
          !log.actorCallSign.toLowerCase().includes(t) &&
          !log.details.toLowerCase().includes(t) &&
          !log.entity.toLowerCase().includes(t)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-rose-900/10 bg-linear-to-r from-rose-950 to-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-base font-bold">บันทึกประวัติการใช้งานระบบ (Audit Log)</h2>
              <p className="text-xs text-rose-200">
                ประวัติการเพิ่ม แก้ไข ลบ อนุมัติ ยกเลิก และการเข้าสู่ระบบทั้งหมด
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ดำเนินการ, นามเรียกขาน หรือรายละเอียด..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-white"
            />
          </div>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="p-2 rounded-xl border border-stone-200 font-bold bg-white"
          >
            <option value="all">ทุกการกระทำ (Actions)</option>
            <option value="CREATE">CREATE (สร้าง)</option>
            <option value="UPDATE">UPDATE (แก้ไข)</option>
            <option value="DELETE">DELETE (ลบ)</option>
            <option value="APPROVE">APPROVE (อนุมัติ)</option>
            <option value="REJECT">REJECT (ไม่อนุมัติ)</option>
            <option value="CANCEL">CANCEL (ยกเลิก)</option>
            <option value="LOGIN">LOGIN (เข้าสู่ระบบ)</option>
            <option value="LOGOUT">LOGOUT (ออกจากระบบ)</option>
            <option value="CONFIG_UPDATE">CONFIG_UPDATE (ตั้งค่า)</option>
          </select>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">วัน-เวลา</th>
                <th className="py-2.5 px-3">ผู้ดำเนินการ</th>
                <th className="py-2.5 px-3">การกระทำ</th>
                <th className="py-2.5 px-3">ข้อมูลเป้าหมาย</th>
                <th className="py-2.5 px-3">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-stone-50">
                  <td className="py-2.5 px-3 font-mono text-stone-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-stone-900">{log.actorName}</div>
                    <div className="text-[10px] text-stone-500 font-mono">{log.actorCallSign} ({log.actorRole})</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-800' :
                      log.action === 'REJECT' ? 'bg-red-100 text-red-800' :
                      log.action === 'CANCEL' ? 'bg-stone-200 text-stone-800' :
                      log.action === 'CREATE' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                      'bg-stone-100 text-stone-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-stone-700">
                    {log.entity}
                  </td>
                  <td className="py-2.5 px-3 text-stone-800 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
