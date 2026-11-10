import React, { useRef, useState } from 'react';
import { LeaveRequest, StationConfig } from '../types/leave';
import { Printer, ArrowLeft, Shield, Edit3, RotateCcw } from 'lucide-react';

interface OfficialLeaveDocumentProps {
  leave: LeaveRequest;
  config: StationConfig;
  onBack?: () => void;
}

export const OfficialLeaveDocument: React.FC<OfficialLeaveDocumentProps> = ({
  leave,
  config,
  onBack
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Requirement: "ตรงผู้ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา ให้สามารถพิมพ์ชื่อเองได้เท่านั้น"
  // ตั้งค่าเป็น พ.ต.ต.เลิศพิสิฐธร  สมบัติภูธร ตำแหน่ง สว.อก.สภ.ศรีสงคราม
  const defaultCheckerName = 'พ.ต.ต. เลิศพิสิฐธร  สมบัติภูธร';
  const defaultCheckerRank = 'พ.ต.ต.';
  const defaultCheckerPosition = 'สว.อก.สภ.ศรีสงคราม';

  const [checkerRank, setCheckerRank] = useState<string>(defaultCheckerRank);
  const [checkerName, setCheckerName] = useState<string>(defaultCheckerName);
  const [checkerPosition, setCheckerPosition] = useState<string>(defaultCheckerPosition);

  const handlePrint = () => {
    window.print();
  };

  const handleResetChecker = () => {
    setCheckerRank(defaultCheckerRank);
    setCheckerName(defaultCheckerName);
    setCheckerPosition(defaultCheckerPosition);
  };

  // Format Thai dates
  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return { day: '.....', month: '..................', year: '........' };
    const date = new Date(dateStr);
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return {
      day: date.getDate().toString(),
      month: months[date.getMonth()],
      year: (date.getFullYear() + 543).toString()
    };
  };

  const createdDate = formatThaiDate(leave.createdAt.split(' ')[0] || new Date().toISOString().split('T')[0]);
  const startDate = formatThaiDate(leave.startDate);
  const endDate = formatThaiDate(leave.endDate);

  const isSuperintendent = leave.userId === 'off-1' || leave.recipientTitle === 'ผบก.ภ.จว.นครพนม';
  const recipientName = isSuperintendent
    ? (leave.commanderCustomName || config.provincialCommanderRankName || 'พล.ต.ต. อารักษ์ มะสาธานัง')
    : (config.superintendentRankName || 'พ.ต.อ. ถวิล คำเกษ');

  const recipientPosition = isSuperintendent
    ? (config.provincialCommanderPosition || 'ผบก.ภ.จว.นครพนม')
    : (config.superintendentPosition || 'ผกก.สภ.ศรีสงคราม');

  // Form title strictly matching police PDF documents
  const getDocumentTitle = () => {
    if (leave.leaveType === 'vacation') return '(แบบใบลาพักผ่อน)';
    if (leave.leaveType === 'paternity') return '(แบบใบลาเพื่อดูแลบุตรและภรรยาหลังคลอด)';
    if (leave.leaveType === 'ordination') return '(แบบใบลาอุปสมบท)';
    return '(แบบใบลาป่วย ลาคลอด ลากิจส่วนตัว)';
  };

  const getSubjectText = () => {
    if (leave.leaveType === 'vacation') return 'ขอลาพักผ่อน';
    if (leave.leaveType === 'paternity') return 'ขอลาเพื่อดูแลบุตรและภรรยาหลังคลอด';
    if (leave.leaveType === 'ordination') return 'ขอลาอุปสมบท';
    if (leave.leaveType === 'sick') return 'ขอลาป่วย';
    if (leave.leaveType === 'maternity') return 'ขอลาคลอด';
    if (leave.leaveType === 'personal') return 'ขอลากิจส่วนตัว';
    return 'ขออนุญาตลา';
  };

  const totalUsedAfter = (leave.usedDaysBefore || 0) + (leave.currentRequestDays || leave.durationDays || 0);

  return (
    <div className="min-h-screen bg-stone-200/90 p-2 sm:p-5 print:p-0 print:bg-white flex flex-col items-center">
      {/* Top Action Bar & Checker Customizer (Hidden when printing) */}
      <div className="w-full max-w-[210mm] mb-4 space-y-3 no-print">
        {/* Navigation & Print Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl shadow-md border border-stone-200">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับ
              </button>
            )}
            <div>
              <h2 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-800" />
                {getDocumentTitle()} — เลขที่ {leave.leaveNumber}
              </h2>
              <p className="text-[11px] text-stone-500">
                เอกสารขนาด A4 ยึดตามแบบฟอร์ม PDF สภ.ศรีสงคราม ฟอนต์ TH Sarabun พอดี 1 หน้า ไม่ล้นขอบ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-rose-900 hover:bg-rose-950 text-white shadow-md transition transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              พิมพ์เอกสาร / บันทึก PDF (A4)
            </button>
          </div>
        </div>

        {/* Requirement: ตรงผู้ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา ให้สามารถพิมพ์ชื่อเองได้เท่านั้น */}
        <div className="bg-amber-50/95 border-2 border-amber-300 p-3 rounded-xl shadow-xs text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs sm:text-sm">
              <Edit3 className="w-4 h-4 text-amber-800" />
              ส่วน &quot;ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา&quot; (พิมพ์แก้ไขชื่อได้เอง):
            </span>
            <button
              type="button"
              onClick={handleResetChecker}
              className="text-[11px] text-amber-900 hover:text-rose-900 flex items-center gap-1 font-bold underline"
            >
              <RotateCcw className="w-3 h-3" />
              รีเซ็ตเป็นค่าเริ่มต้น
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                ยศนำหน้าเส้นลงชื่อ (เช่น พ.ต.ต.)
              </label>
              <input
                type="text"
                value={checkerRank}
                onChange={e => setCheckerRank(e.target.value)}
                placeholder="พ.ต.ต."
                className="w-full p-2 text-xs rounded-lg border border-amber-300 bg-white font-medium focus:ring-2 focus:ring-rose-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                ชื่อ-สกุล ในวงเล็บ (สามารถพิมพ์ชื่อเองได้ตามต้องการ)
              </label>
              <input
                type="text"
                value={checkerName}
                onChange={e => setCheckerName(e.target.value)}
                placeholder="พ.ต.ต. เลิศพิสิฐธร  สมบัติภูธร"
                className="w-full p-2 text-xs rounded-lg border border-amber-400 bg-white font-bold text-rose-950 focus:ring-2 focus:ring-rose-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                ตำแหน่ง (เช่น สว.อก.สภ.ศรีสงคราม)
              </label>
              <input
                type="text"
                value={checkerPosition}
                onChange={e => setCheckerPosition(e.target.value)}
                placeholder="สว.อก.สภ.ศรีสงคราม"
                className="w-full p-2 text-xs rounded-lg border border-amber-300 bg-white font-medium focus:ring-2 focus:ring-rose-800"
              />
            </div>
          </div>
          <p className="text-[11px] text-amber-900 font-medium">
            💡 ท่านสามารถคลิกพิมพ์ชื่อหรือตำแหน่งลงในวงเล็บบนตัวเอกสารใบลาโดยตรง หรือพิมพ์ผ่านช่องกรอกด้านบนนี้ได้ทันที
          </p>
        </div>
      </div>

      {/* A4 Sheet Container strictly matching Thai police PDF form */}
      <div
        ref={printRef}
        className="print-container w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-black px-[15mm] py-[13mm] shadow-2xl rounded-xs print:shadow-none print:m-0 print:px-[12mm] print:py-[10mm] print:w-full print:max-w-none print:min-h-0 print:h-auto box-border overflow-hidden"
        style={{
          fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'THSarabunNew', 'Sarabun', sans-serif",
          fontSize: '14pt',
          lineHeight: '1.32',
          color: '#000000',
        }}
      >
        {/* Document Title Header */}
        <div className="text-center font-bold text-[17pt] mb-1 tracking-wide leading-tight">
          {getDocumentTitle()}
        </div>

        {/* Written Place & Date (Right Aligned) */}
        <div className="text-right text-[14pt] mb-1.5 leading-snug">
          <div>
            เขียนที่&nbsp;
            <span className="font-semibold underline decoration-dotted underline-offset-4">
              {config.stationName}
            </span>
          </div>
          <div>
            วันที่ <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.day}&nbsp;</span>{' '}
            เดือน <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.month}&nbsp;</span>{' '}
            พ.ศ. <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.year}&nbsp;</span>
          </div>
        </div>

        {/* Subject & Recipient */}
        <div className="text-[14pt] mb-1.5 leading-snug">
          <div>
            <span className="font-bold">เรื่อง</span>&nbsp;&nbsp;&nbsp;&nbsp;{getSubjectText()}
          </div>
          <div>
            <span className="font-bold">เรียน</span>&nbsp;&nbsp;&nbsp;&nbsp;
            {isSuperintendent
              ? `ผู้บังคับการตำรวจภูธรจังหวัดนครพนม (${recipientName})`
              : 'ผกก.สภ.ศรีสงคราม'}
          </div>
        </div>

        {/* Applicant Details Body (Strictly matching PDF wording & layout) */}
        <div className="text-[14pt] text-justify space-y-1 leading-[1.38]">
          <p className="indent-[2cm]">
            ข้าพเจ้า&nbsp;
            <span className="font-bold underline decoration-dotted underline-offset-4">
              {leave.userRank} {leave.userName} {leave.userSurname}
            </span>&nbsp;&nbsp;
            ตำแหน่ง&nbsp;
            <span className="font-semibold underline decoration-dotted underline-offset-4">
              {leave.positionTitle || 'ข้าราชการตำรวจ'}
            </span>
          </p>

          <p>
            สังกัด&nbsp;
            <span className="underline decoration-dotted underline-offset-4">{config.stationName}</span>&nbsp;&nbsp;
            กองบังคับการ&nbsp;
            <span className="underline decoration-dotted underline-offset-4">{config.policeDivision}</span>&nbsp;&nbsp;
            กองบัญชาการ&nbsp;
            <span className="underline decoration-dotted underline-offset-4">{config.policeRegion}</span>
          </p>

          {/* Vacation Leave Clause */}
          {leave.leaveType === 'vacation' && (
            <p>
              มีวันลาพักผ่อนสะสม <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{leave.accumulatedDays}&nbsp;</span> วันทำการ{' '}
              มีสิทธิลาพักผ่อนประจำปีนี้อีก <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{leave.currentQuotaDays}&nbsp;</span> วันทำการ{' '}
              รวมเป็น <span className="font-bold underline decoration-dotted underline-offset-4">&nbsp;{leave.totalQuotaDays}&nbsp;</span> วันทำการ
            </p>
          )}

          {/* Paternity Leave Clause */}
          {leave.leaveType === 'paternity' && (
            <p>
              ภรรยาชื่อ <span className="underline decoration-dotted underline-offset-4">&nbsp;{leave.spouseName || '...................................................'}&nbsp;</span>{' '}
              คลอดบุตรเมื่อวันที่ <span className="underline decoration-dotted underline-offset-4">&nbsp;{leave.childBirthDate || '...........................................'}&nbsp;</span>{' '}
              มีความประสงค์ขอลาเพื่อดูแลบุตรและภรรยาหลังคลอด
            </p>
          )}

          {/* Ordination Leave Clause */}
          {leave.leaveType === 'ordination' && (
            <div className="space-y-0.5">
              <p>
                เกิดวันที่ <span className="underline decoration-dotted underline-offset-4">&nbsp;{leave.bornDate || '........................'}&nbsp;</span>{' '}
                เข้ารับราชการเมื่อวันที่ <span className="underline decoration-dotted underline-offset-4">&nbsp;{leave.joinedDate || '........................'}&nbsp;</span>{' '}
                ข้าพเจ้า {leave.everOrdained ? '☑ เคย' : '☐ เคย'} {leave.everOrdained ? '☐ ไม่เคย' : '☑ ไม่เคย'} อุปสมบท
              </p>
              <p>
                บัดนี้มีศรัทธาจะอุปสมบทในพระพุทธศาสนา ณ วัด <span className="underline decoration-dotted underline-offset-4">&nbsp;{leave.templeName || '................................................'}&nbsp;</span>{' '}
                ตั้งอยู่ ณ <span className="underline decoration-dotted underline-offset-4">&nbsp;{leave.templeLocation || '................................................'}&nbsp;</span>
              </p>
            </div>
          )}

          {/* Sick / Personal / Maternity Checkboxes */}
          {['sick', 'personal', 'maternity'].includes(leave.leaveType) && (
            <div className="flex items-center gap-6 my-0.5">
              <span>ขออนุญาต</span>
              <span className={leave.leaveType === 'sick' ? 'font-bold' : ''}>
                {leave.leaveType === 'sick' ? '☑' : '☐'} ลาป่วย
              </span>
              <span className={leave.leaveType === 'maternity' ? 'font-bold' : ''}>
                {leave.leaveType === 'maternity' ? '☑' : '☐'} ลาคลอด
              </span>
              <span className={leave.leaveType === 'personal' ? 'font-bold' : ''}>
                {leave.leaveType === 'personal' ? '☑' : '☐'} ลากิจส่วนตัว
              </span>
            </div>
          )}

          {/* Leave Duration Clause */}
          <p>
            {leave.leaveType === 'vacation' ? 'ขอลาพักผ่อนตั้งแต่วันที่' :
             leave.leaveType === 'ordination' ? 'จึงขอลาอุปสมบท มีกำหนด' :
             'ตั้งแต่วันที่'}&nbsp;
            <span className="font-semibold underline decoration-dotted underline-offset-4">
              {startDate.day} {startDate.month} {startDate.year}
            </span>&nbsp;&nbsp;
            ถึงวันที่&nbsp;
            <span className="font-semibold underline decoration-dotted underline-offset-4">
              {endDate.day} {endDate.month} {endDate.year}
            </span>&nbsp;&nbsp;
            มีกำหนด&nbsp;
            <span className="font-bold underline decoration-dotted underline-offset-4">
              {leave.durationDays}
            </span>&nbsp;
            วัน
          </p>

          {['sick', 'personal'].includes(leave.leaveType) && (
            <p className="text-[13pt]">
              ข้าพเจ้าได้ลา ☐ ป่วย ☐ คลอด ☐ กิจส่วนตัว ครั้งสุดท้าย ตั้งแต่วันที่ {leave.lastLeaveStartDate || '...........................'} ถึงวันที่ {leave.lastLeaveEndDate || '...........................'} มีกำหนด {leave.lastLeaveDays || '.....'} วัน
            </p>
          )}

          <p>
            ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่&nbsp;
            <span className="underline decoration-dotted underline-offset-4">
              {leave.contactAddress || config.address}
            </span>&nbsp;&nbsp;
            โทรศัพท์&nbsp;
            <span className="font-semibold underline decoration-dotted underline-offset-4">
              {leave.contactPhone || config.phone}
            </span>
          </p>
        </div>

        {/* Applicant Signature Section (Centered in right half) */}
        {/* Requirement 78: แสดงยศติดกับคำว่า (ลงชื่อ) เช่น (ลงชื่อ) ส.ต.ท.................................................... */}
        <div className="w-[52%] ml-auto text-center mt-2.5 text-[14pt] leading-tight space-y-0.5">
          <div>ขอแสดงความนับถือ</div>
          <div className="pt-1.5 font-mono text-[13.5pt] whitespace-nowrap overflow-hidden">
            (ลงชื่อ)&nbsp;{leave.userRank}....................................................
          </div>
          <div className="font-bold">
            (&nbsp;{leave.userName}&nbsp;&nbsp;{leave.userSurname}&nbsp;)
          </div>
          <div className="text-[13pt]">
            ตำแหน่ง&nbsp;{leave.positionTitle || 'ข้าราชการตำรวจ'}
          </div>
        </div>

        {/* Bottom Section: 2 Columns */}
        <div className="grid grid-cols-2 gap-3 mt-2 pt-1.5 border-t border-black text-[13pt] leading-[1.28]">
          {/* Left Column: Leave statistics table & Duty Manpower */}
          <div className="space-y-1.5 pr-1">
            <div>
              <div className="font-bold text-[13pt] mb-0.5">สถิติการลาในปีงบประมาณนี้</div>
              <table className="w-full border-collapse border border-black text-center text-[12pt] leading-tight">
                <thead>
                  <tr className="bg-stone-50 print:bg-transparent">
                    <th className="border border-black p-0.5 font-bold">ลามาแล้ว<br/>(วันทำการ)</th>
                    <th className="border border-black p-0.5 font-bold">ลาครั้งนี้<br/>(วันทำการ)</th>
                    <th className="border border-black p-0.5 font-bold">รวมเป็น<br/>(วันทำการ)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1">{leave.usedDaysBefore || '-'}</td>
                    <td className="border border-black p-1 font-bold">{leave.currentRequestDays || leave.durationDays}</td>
                    <td className="border border-black p-1 font-bold">{totalUsedAfter}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Duty Manpower block strictly matching uploaded reference image */}
            <div className="text-[12.5pt] space-y-0.5 leading-snug">
              <div>
                ผู้ลาปฏิบัติหน้าที่&nbsp;&nbsp;
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  {leave.dutyName || 'งานอำนวยการ'}
                </span>
              </div>
              <div>
                มีกำลังปฏิบัติหน้าที่&nbsp;
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  &nbsp;{leave.dutyTotalOfficers || config.dutyOfficersTotal}&nbsp;
                </span>&nbsp;นาย&nbsp;&nbsp;
                ลา&nbsp;
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  &nbsp;{leave.dutyLeavingOfficers || 1}&nbsp;
                </span>&nbsp;นาย
              </div>
              <div>
                เหลือกำลังปฏิบัติหน้าที่&nbsp;
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  &nbsp;{leave.dutyRemainingOfficers || Math.max(0, (leave.dutyTotalOfficers || config.dutyOfficersTotal) - (leave.dutyLeavingOfficers || 1))}&nbsp;
                </span>&nbsp;นาย
              </div>
            </div>

            {/* Recommender Signature */}
            <div className="text-center pt-1 text-[12.5pt] space-y-0.5 leading-tight">
              <div>เพื่อโปรดพิจารณา</div>
              <div className="font-mono text-[12pt] whitespace-nowrap overflow-hidden">
                (ลงชื่อ)&nbsp;{leave.userRank}....................................................
              </div>
              <div className="text-[11.5pt]">
                ตำแหน่ง&nbsp;{leave.positionTitle || 'ผบ.หมู่(ป.)สภ.ศรีสงคราม'}
              </div>
            </div>
          </div>

          {/* Right Column: ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา (อิงตามรูป Annotation_2026-11-10_160028_2c132adc.jpg) */}
          <div className="space-y-1 pl-2.5 border-l border-stone-400">
            {/* Requirement: ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา (อิงรูป Annotation_2026-11-10_160028_2c132adc.jpg) */}
            <div className="space-y-1 text-center">
              <div className="font-bold text-[13.5pt] leading-tight text-center whitespace-nowrap">
                ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา
              </div>

              <div className="text-[13pt] text-center pt-0.5 leading-none">
                (ลงชื่อ)
              </div>

              <div className="font-mono text-[12pt] text-center leading-none overflow-hidden whitespace-nowrap tracking-tighter">
                <span className="font-sans font-medium">{checkerRank || 'พ.ต.ต.'}</span>..................................................................................................
              </div>

              {/* Editable Name in Parentheses */}
              <div className="text-center font-bold text-[13.5pt] leading-tight flex items-center justify-center">
                <span>(&nbsp;</span>
                <input
                  type="text"
                  value={checkerName}
                  onChange={e => setCheckerName(e.target.value)}
                  placeholder="พ.ต.ต. เลิศพิสิฐธร  สมบัติภูธร"
                  className="text-center font-bold text-[13.5pt] bg-transparent border-b border-dashed border-stone-300 hover:border-stone-700 focus:border-rose-900 focus:bg-amber-50/60 outline-hidden px-1 py-0 transition print:border-none print:p-0"
                  style={{
                    fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'THSarabunNew', 'Sarabun', sans-serif",
                    width: `${Math.max((checkerName || '').length * 11, 160)}px`
                  }}
                  title="คลิกเพื่อพิมพ์ชื่อผู้ตรวจสอบได้เอง"
                />
                <span>&nbsp;)</span>
              </div>

              {/* Editable Position */}
              <div className="text-center text-[12.5pt] leading-tight flex items-center justify-center">
                <span>ตำแหน่ง&nbsp;</span>
                <input
                  type="text"
                  value={checkerPosition}
                  onChange={e => setCheckerPosition(e.target.value)}
                  placeholder="สว.อก.สภ.ศรีสงคราม"
                  className="text-center text-[12.5pt] bg-transparent border-b border-dashed border-stone-300 hover:border-stone-700 focus:border-rose-900 focus:bg-amber-50/60 outline-hidden px-1 py-0 transition print:border-none print:p-0"
                  style={{
                    fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'THSarabunNew', 'Sarabun', sans-serif",
                    width: `${Math.max((checkerPosition || '').length * 10, 150)}px`
                  }}
                  title="คลิกเพื่อพิมพ์ตำแหน่งได้เอง"
                />
              </div>
            </div>

            {/* Commander Order (คำสั่ง ผกก.) */}
            <div className="pt-1.5 border-t border-stone-300 space-y-0.5">
              <div className="font-bold text-[13pt]">คำสั่ง</div>
              <div className="flex items-center gap-5 text-[12.5pt]">
                <span className={leave.status === 'approved' ? 'font-bold' : ''}>
                  {leave.status === 'approved' ? '☑' : '☐'} อนุญาต
                </span>
                <span className={leave.status === 'rejected' ? 'font-bold' : ''}>
                  {leave.status === 'rejected' ? '☑' : '☐'} ไม่อนุญาต
                </span>
              </div>
              {leave.rejectReason && (
                <div className="text-[11pt] text-red-700 italic leading-none">
                  ({leave.rejectReason})
                </div>
              )}

              <div className="text-center pt-0.5 space-y-0.5 leading-tight">
                <div className="font-mono text-[12pt] whitespace-nowrap overflow-hidden">
                  (ลงชื่อ)&nbsp;{isSuperintendent ? 'พล.ต.ต.' : 'พ.ต.อ.'}....................................................
                </div>
                <div className="font-bold text-[13pt]">
                  (&nbsp;{recipientName}&nbsp;)
                </div>
                <div className="text-[12pt] text-stone-800">
                  ตำแหน่ง&nbsp;{recipientPosition}
                </div>
                <div className="text-[11.5pt] text-stone-700">
                  วันที่ <span className="underline decoration-dotted underline-offset-4">&nbsp;{createdDate.day}&nbsp;</span>{' '}
                  เดือน <span className="underline decoration-dotted underline-offset-4">&nbsp;{createdDate.month}&nbsp;</span>{' '}
                  พ.ศ. <span className="underline decoration-dotted underline-offset-4">&nbsp;{createdDate.year}&nbsp;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
