import React, { useState, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveRequest, OfficerUser, DIVISION_NAMES, LEAVE_TYPE_LABELS } from '../types/leave';
import { Search, X, User, FileText, ArrowRight, Shield } from 'lucide-react';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLeave: (leave: LeaveRequest) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLeave
}) => {
  const { officers, leaves } = useLeave();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return { officers: [], leaves: [] };
    const q = query.toLowerCase().trim();

    const matchedOfficers = officers.filter(o => 
      `${o.rank} ${o.firstName} ${o.lastName}`.toLowerCase().includes(q) ||
      o.callSign.toLowerCase().includes(q) ||
      o.username.toLowerCase().includes(q) ||
      o.positionTitle.toLowerCase().includes(q) ||
      (DIVISION_NAMES[o.division] || '').toLowerCase().includes(q)
    ).slice(0, 8);

    const matchedLeaves = leaves.filter(l => 
      l.leaveNumber.toLowerCase().includes(q) ||
      `${l.userRank} ${l.userName} ${l.userSurname}`.toLowerCase().includes(q) ||
      l.userCallSign.toLowerCase().includes(q) ||
      (l.reason || '').toLowerCase().includes(q) ||
      (l.dutyName || '').toLowerCase().includes(q)
    ).slice(0, 8);

    return { officers: matchedOfficers, leaves: matchedLeaves };
  }, [officers, leaves, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 flex items-center gap-3 bg-stone-50">
          <Search className="w-5 h-5 text-rose-800 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="ค้นหาชื่อ, ยศ, นามเรียกขาน (เช่น SSK503), เลขที่ใบลา, หรือสายงาน..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold focus:outline-hidden"
          />
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4 text-xs">
          {!query.trim() ? (
            <div className="text-center py-8 text-stone-400">
              พิมพ์คำค้นหาเพื่อเริ่มค้นหาทั่วทั้งระบบ สภ.ศรีสงคราม
            </div>
          ) : results.officers.length === 0 && results.leaves.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              ไม่พบผลลัพธ์สำหรับ "{query}"
            </div>
          ) : (
            <>
              {/* Matched Officers */}
              {results.officers.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-stone-500 uppercase tracking-wider block text-[11px]">
                    👮 ข้าราชการตำรวจ ({results.officers.length})
                  </span>
                  <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-stone-50/50">
                    {results.officers.map(o => (
                      <div key={o.id} className="p-3 flex items-center justify-between hover:bg-white transition">
                        <div>
                          <div className="font-bold text-stone-900 text-sm">
                            {o.rank} {o.firstName} {o.lastName}
                          </div>
                          <div className="text-stone-500 text-[11px]">
                            นามเรียกขาน: <span className="font-mono font-bold text-rose-900">{o.callSign}</span> • {DIVISION_NAMES[o.division]} ({o.subDivision})
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-bold text-[10px]">
                          {o.positionTitle}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Leaves */}
              {results.leaves.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-stone-500 uppercase tracking-wider block text-[11px]">
                    📄 ใบลา ({results.leaves.length})
                  </span>
                  <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-stone-50/50">
                    {results.leaves.map(l => (
                      <div
                        key={l.id}
                        onClick={() => {
                          onSelectLeave(l);
                          onClose();
                        }}
                        className="p-3 flex items-center justify-between hover:bg-white transition cursor-pointer"
                      >
                        <div>
                          <div className="font-bold font-mono text-rose-950 text-sm">
                            {l.leaveNumber} • {LEAVE_TYPE_LABELS[l.leaveType]?.name}
                          </div>
                          <div className="text-stone-500 text-[11px]">
                            {l.userRank} {l.userName} {l.userSurname} ({l.userCallSign}) • {l.startDate} ถึง {l.endDate} ({l.durationDays} วัน)
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {l.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
