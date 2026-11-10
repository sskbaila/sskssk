import React, { useState, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';
import { OfficerUser, DIVISION_NAMES } from '../types/leave';
import { Calendar, Printer, Filter, Search, ChevronLeft, ChevronRight, Download, Users } from 'lucide-react';

export const LeaveRosterBoard: React.FC = () => {
  const { officers, leaves, stationConfig } = useLeave();

  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 0-indexed: 9 = October (ตุลาคม)
  const [selectedYear, setSelectedYear] = useState<number>(2026); // พ.ศ. 2569
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [useThaiNumerals, setUseThaiNumerals] = useState(false);

  const monthsTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Convert numbers to Thai numerals if needed
  const toThaiNum = (num: number | string) => {
    if (!useThaiNumerals) return num;
    const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    return num.toString().split('').map(char => {
      const n = parseInt(char, 10);
      return isNaN(n) ? char : thaiDigits[n];
    }).join('');
  };

  // Filter officers
  const filteredOfficers = useMemo(() => {
    return officers.filter(o => {
      if (filterDivision !== 'all' && o.division !== filterDivision) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const fullName = `${o.rank} ${o.firstName} ${o.lastName}`.toLowerCase();
        if (!fullName.includes(term) && !o.callSign.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [officers, filterDivision, searchTerm]);

  // Map officer's approved or active leaves for each day of this month
  const rosterGrid = useMemo(() => {
    const grid: Record<string, Record<number, { code: string; colorClass: string; title: string }>> = {};

    officers.forEach(off => {
      grid[off.id] = {};
    });

    const activeLeaves = leaves.filter(l => 
      !['cancelled', 'rejected', 'withdrawn'].includes(l.status)
    );

    activeLeaves.forEach(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      // Check if leave intersects selected month/year
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDayDate = new Date(selectedYear, selectedMonth, day);
        if (currentDayDate >= start && currentDayDate <= end) {
          let code = 'พ';
          let colorClass = 'bg-amber-300 text-stone-900 font-bold';

          if (leave.leaveType === 'vacation') {
            code = 'พ';
            colorClass = 'bg-amber-300 text-stone-900 font-bold';
          } else if (leave.leaveType === 'personal') {
            code = 'ก';
            colorClass = 'bg-purple-300 text-purple-950 font-bold';
          } else if (leave.leaveType === 'sick') {
            code = 'ป';
            colorClass = 'bg-rose-300 text-rose-950 font-bold';
          } else if (leave.leaveType === 'paternity') {
            code = 'ลก';
            colorClass = 'bg-violet-300 text-violet-950 font-bold';
          } else if (leave.leaveType === 'official_duty') {
            code = 'ปก';
            colorClass = 'bg-emerald-300 text-emerald-950 font-bold';
          } else if (leave.leaveType === 'overtime') {
            code = 'OT';
            colorClass = 'bg-cyan-300 text-cyan-950 font-bold';
          } else if (leave.leaveType === 'help_duty') {
            code = 'ช่วย';
            colorClass = 'bg-stone-300 text-stone-900 font-bold';
          }

          if (grid[leave.userId]) {
            grid[leave.userId][day] = {
              code,
              colorClass,
              title: `${leave.userRank} ${leave.userName}: ${code} (${leave.startDate} ถึง ${leave.endDate})`
            };
          }
        }
      }
    });

    return grid;
  }, [officers, leaves, selectedYear, selectedMonth, daysInMonth]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Hidden in print) */}
      <div className="bg-linear-to-r from-rose-950 via-rose-900 to-rose-950 rounded-2xl p-6 text-white shadow-lg border border-rose-800/40 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <Calendar className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">แผงการลาข้าราชการตำรวจ (Leave Roster Board)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Real-Time เชื่อมต่อสด
              </span>
            </div>
            <p className="text-xs text-rose-200 mt-1">
              ตารางคุมการลารายวัน 31 วัน ประจำสถานีตำรวจภูธรศรีสงคราม
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Month selector */}
          <div className="flex items-center bg-black/25 rounded-xl p-1 border border-white/10 text-xs font-bold">
            <button
              onClick={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear(y => y - 1);
                } else {
                  setSelectedMonth(m => m - 1);
                }
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-rose-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-white">
              {monthsTh[selectedMonth]} {selectedYear + 543}
            </span>
            <button
              onClick={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear(y => y + 1);
                } else {
                  setSelectedMonth(m => m + 1);
                }
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-rose-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setUseThaiNumerals(!useThaiNumerals)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            {useThaiNumerals ? 'เลขอารบิก (1,2,3)' : 'เลขไทย (๑,๒,๓)'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 shadow transition transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์แผงการลา</span>
          </button>
        </div>
      </div>

      {/* Legend & Filter Controls (No print) */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        {/* Color Legend matching PDF 6 */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-stone-700">สัญลักษณ์:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-200 text-stone-900 font-bold border border-amber-300">
            พ = ลาพักผ่อน
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-bold border border-purple-300">
            ก = ลากิจ
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold border border-rose-300">
            ป = ลาป่วย
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-200 text-violet-900 font-bold border border-violet-300">
            ลก = ลาเลี้ยงลูก
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold border border-emerald-300">
            ปก = ไปราชการ
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-200 text-cyan-900 font-bold border border-cyan-300">
            OT = เบิก OT
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-bold border border-stone-300">
            ช่วย = ช่วยราชการ
          </span>
        </div>

        {/* Filter by division */}
        <div className="flex items-center gap-2">
          <select
            value={filterDivision}
            onChange={e => setFilterDivision(e.target.value)}
            className="p-1.5 rounded-lg border border-stone-300 text-xs font-semibold"
          >
            <option value="all">ทุกสายงาน ({officers.length})</option>
            {Object.entries(DIVISION_NAMES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="ค้นหาชื่อ/นามเรียกขาน..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="p-1.5 rounded-lg border border-stone-300 text-xs w-40"
          />
        </div>
      </div>

      {/* Main Board Table */}
      <div className="bg-white rounded-xl shadow-xs border border-stone-300 overflow-hidden print:border-none print:shadow-none">
        {/* Printable Official Header */}
        <div className="text-center p-4 border-b border-stone-300 print:block">
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            แผงการลาข้าราชการตำรวจ {stationConfig.stationName}
          </h2>
          <p className="text-sm font-semibold text-stone-600">
            ประจำเดือน {monthsTh[selectedMonth]} {toThaiNum(selectedYear + 543)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-stone-400 text-[11px] sm:text-xs">
            <thead>
              <tr className="bg-stone-100 text-stone-900 font-bold text-center">
                <th className="border border-stone-400 py-1.5 px-2 w-10">ลำดับ</th>
                <th className="border border-stone-400 py-1.5 px-2 w-14">ยศ</th>
                <th className="border border-stone-400 py-1.5 px-3 min-w-[100px] text-left">ชื่อ</th>
                <th className="border border-stone-400 py-1.5 px-3 min-w-[110px] text-left">สกุล</th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                  <th key={day} className="border border-stone-400 py-1 px-1 w-6 sm:w-7 font-mono">
                    {toThaiNum(day)}
                  </th>
                ))}
                <th className="border border-stone-400 py-1.5 px-2 min-w-[90px]">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOfficers.map((officer, index) => {
                const offLeaves = rosterGrid[officer.id] || {};
                return (
                  <tr key={officer.id} className="hover:bg-rose-50/20 text-center">
                    <td className="border border-stone-300 py-1 px-1 font-mono text-stone-600">
                      {toThaiNum(officer.orderNumber || index + 1)}
                    </td>
                    <td className="border border-stone-300 py-1 px-1 font-bold text-stone-800">
                      {officer.rank}
                    </td>
                    <td className="border border-stone-300 py-1 px-2 font-medium text-stone-900 text-left">
                      {officer.firstName}
                    </td>
                    <td className="border border-stone-300 py-1 px-2 font-medium text-stone-900 text-left">
                      {officer.lastName}
                    </td>
                    {/* 1 to 31 day cells */}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const entry = offLeaves[day];
                      return (
                        <td
                          key={day}
                          className={`border border-stone-300 p-0 text-center font-bold text-[10px] sm:text-xs transition ${
                            entry ? entry.colorClass : 'bg-white'
                          }`}
                          title={entry ? entry.title : `${officer.rank} ${officer.firstName}: ปฏิบัติหน้าที่`}
                        >
                          {entry ? entry.code : ''}
                        </td>
                      );
                    })}
                    <td className="border border-stone-300 py-1 px-2 text-[10px] text-stone-500 font-mono">
                      {officer.callSign}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
