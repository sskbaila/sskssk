import React, { useRef, useState } from 'react';
import { LeaveRequest, StationConfig } from '../types/leave';
import { Printer, ArrowLeft, Shield, Edit3, RotateCcw, LayoutTemplate } from 'lucide-react';

interface OfficialLeaveDocumentProps {
  leave: LeaveRequest;
  config: StationConfig;
  onBack?: () => void;
}

// Helper to remove any police rank prefix from full names (ชื่อจริงในวงเล็บจะไม่มียศ)
export const stripPoliceRank = (name?: string): string => {
  if (!name) return '';
  return name
    .replace(/^(พล\.ต\.[อทต]|พ\.ต\.[อทต]|ร\.ต\.[อทต]|ด\.ต\.|จ\.ส\.ต\.|ส\.ต\.[อทต]|ว่าที่\s*(พล\.ต\.[อทต]|พ\.ต\.[อทต]|ร\.ต\.[อทต]|ด\.ต\.|จ\.ส\.ต\.|ส\.ต\.[อทต])|นาย|นางสาว|นาง)\.?\s*/i, '')
    .trim();
};

export const OfficialLeaveDocument: React.FC<OfficialLeaveDocumentProps> = ({
  leave,
  config,
  onBack
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Print orientation state (Portrait 21x29.7 cm vs Landscape 29.7x21 cm)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Requirement: "ตรงชื่อจริงในเอกสารจะไม่มียศ ติดกับชื่อ"
  // ตั้งค่าเริ่มต้นชื่อจริงเป็น เลิศพิสิฐธร  สมบัติภูธร (ไม่มียศติดกับชื่อ)
  const defaultCheckerName = 'เลิศพิสิฐธร  สมบัติภูธร';
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

  const createdDate = formatThaiDate(leave.createdAt?.split(' ')[0] || new Date().toISOString().split('T')[0]);
  const startDate = formatThaiDate(leave.startDate);
  const endDate = formatThaiDate(leave.endDate);

  const isSuperintendent = leave.userId === 'off-1' || leave.recipientTitle === 'ผบก.ภ.จว.นครพนม';
  const recipientName = isSuperintendent
    ? (leave.commanderCustomName || config.provincialCommanderRankName || 'พล.ต.ต. อารักษ์ มะสาธานัง')
    : (config.superintendentRankName || 'พ.ต.อ. ถวิล คำเกษ');

  const recipientPosition = isSuperintendent
    ? (config.provincialCommanderPosition || 'ผบก.ภ.จว.นครพนม')
    : (config.superintendentPosition || 'ผกก.สภ.ศรีสงคราม');

  const commanderRank = isSuperintendent ? 'พล.ต.ต.' : 'พ.ต.อ.';

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
      {/* Dynamic Print Style tag matching user selection */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 ${orientation};
                margin: 8mm 12mm 8mm 12mm;
              }
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
          `
        }}
      />

      {/* Top Action Bar & Customizer (Hidden when printing) */}
      <div className={`w-full ${orientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]'} mb-4 space-y-3 no-print transition-all duration-200`}>
        {/* Navigation, Orientation Toggle & Print Button */}
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
                กระดาษ A4 (21 x 29.7 ซม.) • ฟอนต์ TH Sarabun New ขนาด 16 • เต็มหน้ากระดาษพอดี
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Requirement 4: Orientation Selector (Portrait / Landscape) */}
            <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-300 text-xs font-bold">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition ${
                  orientation === 'portrait'
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
                title="ขนาดกระดาษ 21 ซม. x 29.7 ซม."
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>แนวตั้ง (21x29.7 ซม.)</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition ${
                  orientation === 'landscape'
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
                title="ขนาดกระดาษ 29.7 ซม. x 21 ซม."
              >
                <LayoutTemplate className="w-3.5 h-3.5 rotate-90" />
                <span>แนวนอน (29.7x21 ซม.)</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-rose-900 hover:bg-rose-950 text-white shadow-md transition transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              พิมพ์เอกสาร / บันทึก PDF
            </button>
          </div>
        </div>

        {/* Editable Checker Section */}
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
                ชื่อจริง-สกุล ในวงเล็บ (ไม่มียศ เช่น เลิศพิสิฐธร  สมบัติภูธร)
              </label>
              <input
                type="text"
                value={checkerName}
                onChange={e => setCheckerName(e.target.value)}
                placeholder="เลิศพิสิฐธร  สมบัติภูธร"
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
            💡 รูปแบบช่องลงชื่อเป็น <span className="font-bold font-mono">(ลงชื่อ){checkerRank || 'พ.ต.ต.'}....................................................</span> โดยแสดงยศติดกับคำว่า (ลงชื่อ) และต่อด้วยเส้นจุดไข่ปลาทันที
          </p>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: PORTRAIT MODE (แนวตั้ง A4: ขนาด 21 ซม. * 29.7 ซม. / 210mm x 297mm)
          ========================================================================= */}
      {orientation === 'portrait' ? (
        <div
          ref={printRef}
          className="print-container w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-black px-[18mm] py-[15mm] shadow-2xl rounded-xs print:shadow-none print:m-0 print:px-[15mm] print:py-[10mm] print:w-[210mm] print:h-[297mm] box-border overflow-hidden flex flex-col justify-between"
          style={{
            fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'THSarabunNew', 'Sarabun', sans-serif",
            fontSize: '16pt',
            lineHeight: '1.45',
            color: '#000000',
          }}
        >
          {/* Top Half Content */}
          <div className="space-y-3.5">
            {/* 1. Header (หัวข้อแบบใบลา ขนาด 20pt หนา) */}
            <div className="text-center font-bold text-[20pt] leading-tight tracking-wide">
              {getDocumentTitle()}
            </div>

            {/* 2. Written Place & Date (Right Aligned) */}
            <div className="text-right text-[16pt] leading-snug">
              <div>
                เขียนที่&nbsp;
                <span className="font-semibold underline decoration-dotted underline-offset-4">
                  {config.stationName}
                </span>
              </div>
              <div className="pt-0.5">
                วันที่ <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.day}&nbsp;</span>{' '}
                เดือน <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.month}&nbsp;</span>{' '}
                พ.ศ. <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.year}&nbsp;</span>
              </div>
            </div>

            {/* 3. Subject & Recipient */}
            <div className="text-[16pt] leading-snug space-y-1">
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

            {/* 4. Applicant Details Body (ข้อความเนื้อหาใบลา TH Sarabun New ขนาด 16 เต็มหน้ากระดาษ) */}
            <div className="text-[16pt] text-justify space-y-2 leading-[1.48]">
              <p className="indent-[2.5cm]">
                ข้าพเจ้า&nbsp;
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  {leave.userRank} {leave.userName} {leave.userSurname}
                </span>&nbsp;&nbsp;&nbsp;&nbsp;
                ตำแหน่ง&nbsp;
                <span className="font-semibold underline decoration-dotted underline-offset-4">
                  {leave.positionTitle || 'ข้าราชการตำรวจ'}
                </span>
              </p>

              <p>
                สังกัด&nbsp;
                <span className="underline decoration-dotted underline-offset-4">{config.stationName}</span>&nbsp;&nbsp;&nbsp;&nbsp;
                กองบังคับการ&nbsp;
                <span className="underline decoration-dotted underline-offset-4">{config.policeDivision}</span>&nbsp;&nbsp;&nbsp;&nbsp;
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
                <div className="space-y-1">
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
                <div className="flex items-center gap-8 py-0.5">
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
                </span>&nbsp;&nbsp;&nbsp;&nbsp;
                ถึงวันที่&nbsp;
                <span className="font-semibold underline decoration-dotted underline-offset-4">
                  {endDate.day} {endDate.month} {endDate.year}
                </span>&nbsp;&nbsp;&nbsp;&nbsp;
                มีกำหนด&nbsp;
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  {leave.durationDays}
                </span>&nbsp;
                วัน
              </p>

              {['sick', 'personal'].includes(leave.leaveType) && (
                <p>
                  ข้าพเจ้าได้ลา ☐ ป่วย ☐ คลอด ☐ กิจส่วนตัว ครั้งสุดท้าย ตั้งแต่วันที่ {leave.lastLeaveStartDate || '...........................'} ถึงวันที่ {leave.lastLeaveEndDate || '...........................'} มีกำหนด {leave.lastLeaveDays || '.....'} วัน
                </p>
              )}

              <p>
                ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่&nbsp;
                <span className="underline decoration-dotted underline-offset-4">
                  {leave.contactAddress || config.address}
                </span>&nbsp;&nbsp;&nbsp;&nbsp;
                โทรศัพท์&nbsp;
                <span className="font-semibold underline decoration-dotted underline-offset-4">
                  {leave.contactPhone || config.phone}
                </span>
              </p>
            </div>

              {/* 5. Applicant Signature Section (Centered in right half) */}
            {/* Requirement 1: ปรับให้แสดงยศติดกับคำว่า (ลงชื่อ) และตามด้วยเส้นจุดไข่ปลาทันที เช่น (ลงชื่อ)จ.ส.ต.................................................... */}
            <div className="w-[58%] ml-auto text-center mt-3 text-[16pt] leading-tight space-y-1">
              <div>ขอแสดงความนับถือ</div>
              <div className="pt-2 font-mono text-[15pt] whitespace-nowrap overflow-hidden">
                (ลงชื่อ){leave.userRank}....................................................
              </div>
              <div className="font-bold pt-0.5">
                (&nbsp;{stripPoliceRank(leave.userName)}&nbsp;&nbsp;{leave.userSurname}&nbsp;)
              </div>
              <div className="text-[15.5pt]">
                ตำแหน่ง&nbsp;{leave.positionTitle || 'ข้าราชการตำรวจ'}
              </div>
            </div>
          </div>

          {/* Bottom Half: 2 Columns (สถิติการลา & กำลังพล + ตรวจสอบถูกต้อง & คำสั่ง ผกก.) */}
          <div className="grid grid-cols-2 gap-4 pt-3 mt-3 border-t-2 border-black text-[16pt] leading-[1.38]">
            {/* Left Column: Leave statistics table & Duty Manpower */}
            <div className="space-y-2 pr-2">
              <div>
                <div className="font-bold text-[16pt] mb-1">สถิติการลาในปีงบประมาณนี้</div>
                <table className="w-full border-collapse border border-black text-center text-[15pt] leading-tight">
                  <thead>
                    <tr className="bg-stone-50 print:bg-transparent">
                      <th className="border border-black p-1 font-bold">ลามาแล้ว<br/>(วันทำการ)</th>
                      <th className="border border-black p-1 font-bold">ลาครั้งนี้<br/>(วันทำการ)</th>
                      <th className="border border-black p-1 font-bold">รวมเป็น<br/>(วันทำการ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1.5">{leave.usedDaysBefore || '-'}</td>
                      <td className="border border-black p-1.5 font-bold">{leave.currentRequestDays || leave.durationDays}</td>
                      <td className="border border-black p-1.5 font-bold">{totalUsedAfter}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Duty Manpower block */}
              <div className="text-[15.5pt] space-y-0.5 leading-snug pt-1">
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
              {/* Requirement 1: แสดงยศติดกับคำว่า (ลงชื่อ) เช่น (ลงชื่อ)จ.ส.ต.................................................... */}
              <div className="text-center pt-2 text-[15.5pt] space-y-0.5 leading-tight">
                <div>เพื่อโปรดพิจารณา</div>
                <div className="pt-1.5 font-mono text-[14.5pt] whitespace-nowrap overflow-hidden">
                  (ลงชื่อ){leave.userRank}....................................................
                </div>
                <div className="text-[15pt]">
                  ตำแหน่ง&nbsp;{leave.positionTitle || 'ผบ.หมู่(ป.)สภ.ศรีสงคราม'}
                </div>
              </div>
            </div>

            {/* Right Column: ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา (อิงรูป Annotation 2026-11-10 160028.jpg) */}
            <div className="space-y-2 pl-3 border-l-2 border-black">
              {/* Checker Block */}
              <div className="space-y-1 text-center">
                <div className="font-bold text-[16pt] leading-tight text-center whitespace-nowrap">
                  ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา
                </div>

                {/* Requirement 1: (ลงชื่อ)พ.ต.ต.................................................... */}
                <div className="pt-2 font-mono text-[15pt] text-center whitespace-nowrap overflow-hidden leading-tight">
                  (ลงชื่อ){checkerRank || 'พ.ต.ต.'}....................................................
                </div>

                {/* Editable Name in Parentheses: ชื่อจริงในวงเล็บ ไม่มียศติดกับชื่อ */}
                <div className="text-center font-bold text-[16pt] leading-tight flex items-center justify-center pt-0.5">
                  <span>(&nbsp;</span>
                  <input
                    type="text"
                    value={checkerName}
                    onChange={e => setCheckerName(e.target.value)}
                    placeholder="เลิศพิสิฐธร  สมบัติภูธร"
                    className="text-center font-bold text-[16pt] bg-transparent border-b border-dashed border-stone-300 hover:border-stone-700 focus:border-rose-900 focus:bg-amber-50/60 outline-hidden px-1 py-0 transition print:border-none print:p-0"
                    style={{
                      fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'THSarabunNew', 'Sarabun', sans-serif",
                      width: `${Math.max((checkerName || '').length * 12, 180)}px`
                    }}
                    title="คลิกเพื่อพิมพ์ชื่อจริงผู้ตรวจสอบได้เอง (ไม่มียศ)"
                  />
                  <span>&nbsp;)</span>
                </div>

                {/* Editable Position */}
                <div className="text-center text-[15.5pt] leading-tight flex items-center justify-center">
                  <span>ตำแหน่ง&nbsp;</span>
                  <input
                    type="text"
                    value={checkerPosition}
                    onChange={e => setCheckerPosition(e.target.value)}
                    placeholder="สว.อก.สภ.ศรีสงคราม"
                    className="text-center text-[15.5pt] bg-transparent border-b border-dashed border-stone-300 hover:border-stone-700 focus:border-rose-900 focus:bg-amber-50/60 outline-hidden px-1 py-0 transition print:border-none print:p-0"
                    style={{
                      fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'THSarabunNew', 'Sarabun', sans-serif",
                      width: `${Math.max((checkerPosition || '').length * 11, 160)}px`
                    }}
                    title="คลิกเพื่อพิมพ์ตำแหน่งได้เอง"
                  />
                </div>
              </div>

              {/* Commander Order (คำสั่ง ผกก.) */}
              <div className="pt-2 border-t-2 border-black space-y-1">
                <div className="font-bold text-[16pt]">คำสั่ง</div>
                <div className="flex items-center gap-6 text-[15.5pt]">
                  <span className={leave.status === 'approved' ? 'font-bold' : ''}>
                    {leave.status === 'approved' ? '☑' : '☐'} อนุญาต
                  </span>
                  <span className={leave.status === 'rejected' ? 'font-bold' : ''}>
                    {leave.status === 'rejected' ? '☑' : '☐'} ไม่อนุญาต
                  </span>
                </div>
                {leave.rejectReason && (
                  <div className="text-[13pt] text-red-700 italic leading-none">
                    ({leave.rejectReason})
                  </div>
                )}

                {/* Requirement 1: แสดงยศติดกับคำว่า (ลงชื่อ) เช่น (ลงชื่อ)พ.ต.อ.................................................... */}
                <div className="text-center pt-1.5 space-y-0.5 leading-tight">
                  <div className="font-mono text-[15pt] whitespace-nowrap overflow-hidden">
                    (ลงชื่อ){commanderRank}....................................................
                  </div>
                  {/* ชื่อจริงในเอกสารจะไม่มียศติดกับชื่อ */}
                  <div className="font-bold text-[16pt]">
                    (&nbsp;{stripPoliceRank(recipientName)}&nbsp;)
                  </div>
                  <div className="text-[15.5pt] text-stone-900">
                    ตำแหน่ง&nbsp;{recipientPosition}
                  </div>
                  <div className="text-[15pt] text-stone-800">
                    วันที่ <span className="underline decoration-dotted underline-offset-4">&nbsp;{createdDate.day}&nbsp;</span>{' '}
                    เดือน <span className="underline decoration-dotted underline-offset-4">&nbsp;{createdDate.month}&nbsp;</span>{' '}
                    พ.ศ. <span className="underline decoration-dotted underline-offset-4">&nbsp;{createdDate.year}&nbsp;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
           VIEW 2: LANDSCAPE MODE (แนวนอน A4: ขนาด 29.7 ซม. * 21 ซม. / 297mm x 210mm)
           ========================================================================= */
        <div
          ref={printRef}
          className="print-container w-[297mm] min-h-[210mm] max-w-[297mm] bg-white text-black px-[18mm] py-[12mm] shadow-2xl rounded-xs print:shadow-none print:m-0 print:px-[12mm] print:py-[8mm] print:w-[297mm] print:h-[210mm] box-border overflow-hidden flex flex-col justify-between"
          style={{
            fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'THSarabunNew', 'Sarabun', sans-serif",
            fontSize: '16pt',
            lineHeight: '1.4',
            color: '#000000',
          }}
        >
          {/* Document Header in Landscape */}
          <div className="text-center font-bold text-[20pt] leading-tight tracking-wide border-b border-black pb-1 mb-2">
            {getDocumentTitle()}
          </div>

          {/* 2 Wide Columns Grid filling the 29.7cm x 21cm page */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* Left Column: Applicant Information & Request */}
            <div className="space-y-2 pr-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                {/* Place and Date */}
                <div className="text-right text-[16pt] leading-tight">
                  <div>
                    เขียนที่ <span className="font-semibold underline decoration-dotted underline-offset-4">{config.stationName}</span>
                  </div>
                  <div>
                    วันที่ <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.day}&nbsp;</span>{' '}
                    เดือน <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.month}&nbsp;</span>{' '}
                    พ.ศ. <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.year}&nbsp;</span>
                  </div>
                </div>

                {/* Subject & Recipient */}
                <div className="text-[16pt] leading-tight space-y-0.5">
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

                {/* Applicant details */}
                <div className="text-[16pt] text-justify space-y-1 leading-[1.38]">
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
                    สังกัด <span className="underline decoration-dotted underline-offset-4">{config.stationName}</span>&nbsp;&nbsp;
                    บก. <span className="underline decoration-dotted underline-offset-4">{config.policeDivision}</span>&nbsp;&nbsp;
                    ภ. <span className="underline decoration-dotted underline-offset-4">{config.policeRegion}</span>
                  </p>

                  {leave.leaveType === 'vacation' && (
                    <p>
                      มีวันลาพักผ่อนสะสม <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{leave.accumulatedDays}&nbsp;</span> วันทำการ{' '}
                      มีสิทธิปีนี้อีก <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{leave.currentQuotaDays}&nbsp;</span> วันทำการ{' '}
                      รวมเป็น <span className="font-bold underline decoration-dotted underline-offset-4">&nbsp;{leave.totalQuotaDays}&nbsp;</span> วันทำการ
                    </p>
                  )}

                  {['sick', 'personal', 'maternity'].includes(leave.leaveType) && (
                    <div className="flex items-center gap-6 py-0.5">
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

                  <p>
                    {leave.leaveType === 'vacation' ? 'ขอลาพักผ่อนตั้งแต่วันที่' : 'ตั้งแต่วันที่'}&nbsp;
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

                  <p>
                    ระหว่างลาติดต่อได้ที่&nbsp;
                    <span className="underline decoration-dotted underline-offset-4">
                      {leave.contactAddress || config.address}
                    </span>&nbsp;&nbsp;
                    โทร.&nbsp;
                    <span className="font-semibold underline decoration-dotted underline-offset-4">
                      {leave.contactPhone || config.phone}
                    </span>
                  </p>
                </div>
              </div>

              {/* Applicant Signature */}
              <div className="w-[85%] ml-auto text-center pt-2 text-[16pt] leading-tight space-y-0.5">
                <div>ขอแสดงความนับถือ</div>
                <div className="pt-1.5 font-mono text-[15pt] whitespace-nowrap overflow-hidden">
                  (ลงชื่อ){leave.userRank}....................................................
                </div>
                <div className="font-bold">
                  (&nbsp;{stripPoliceRank(leave.userName)}&nbsp;&nbsp;{leave.userSurname}&nbsp;)
                </div>
                <div className="text-[15pt]">
                  ตำแหน่ง&nbsp;{leave.positionTitle || 'ข้าราชการตำรวจ'}
                </div>
              </div>
            </div>

            {/* Right Column: Statistics, Recommender, Checker & Commander Approval */}
            <div className="space-y-3 pl-4 border-l-2 border-black flex flex-col justify-between">
              {/* Upper Section: Stats Table & Manpower */}
              <div className="space-y-2">
                <div>
                  <div className="font-bold text-[16pt] mb-0.5">สถิติการลาในปีงบประมาณนี้</div>
                  <table className="w-full border-collapse border border-black text-center text-[15pt] leading-tight">
                    <thead>
                      <tr className="bg-stone-50 print:bg-transparent">
                        <th className="border border-black p-0.5 font-bold">ลามาแล้ว (วันทำการ)</th>
                        <th className="border border-black p-0.5 font-bold">ลาครั้งนี้ (วันทำการ)</th>
                        <th className="border border-black p-0.5 font-bold">รวมเป็น (วันทำการ)</th>
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

                <div className="text-[15.5pt] space-y-0.5 leading-snug">
                  <div>
                    ผู้ลาปฏิบัติหน้าที่&nbsp;&nbsp;
                    <span className="font-bold underline decoration-dotted underline-offset-4">{leave.dutyName || 'งานอำนวยการ'}</span>
                  </div>
                  <div>
                    มีกำลัง&nbsp;<span className="font-bold underline decoration-dotted underline-offset-4">{leave.dutyTotalOfficers || config.dutyOfficersTotal}</span>&nbsp;นาย&nbsp;&nbsp;
                    ลา&nbsp;<span className="font-bold underline decoration-dotted underline-offset-4">{leave.dutyLeavingOfficers || 1}</span>&nbsp;นาย&nbsp;&nbsp;
                    เหลือ&nbsp;<span className="font-bold underline decoration-dotted underline-offset-4">{leave.dutyRemainingOfficers || Math.max(0, (leave.dutyTotalOfficers || config.dutyOfficersTotal) - (leave.dutyLeavingOfficers || 1))}</span>&nbsp;นาย
                  </div>
                </div>

                {/* Recommender Signature */}
                <div className="text-center pt-1 text-[15pt] space-y-0.5 leading-tight">
                  <div>เพื่อโปรดพิจารณา</div>
                  <div className="font-mono text-[14.5pt] whitespace-nowrap overflow-hidden">
                    (ลงชื่อ){leave.userRank}....................................................
                  </div>
                </div>
              </div>

              {/* Lower Section: Checker & Commander Order */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t-2 border-black">
                {/* Checker Block */}
                <div className="text-center space-y-1">
                  <div className="font-bold text-[15pt] leading-tight">
                    ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา
                  </div>
                  <div className="pt-1 font-mono text-[14.5pt] whitespace-nowrap overflow-hidden">
                    (ลงชื่อ){checkerRank || 'พ.ต.ต.'}....................................................
                  </div>
                  <div className="font-bold text-[15pt]">
                    (&nbsp;{stripPoliceRank(checkerName)}&nbsp;)
                  </div>
                  <div className="text-[14pt]">
                    ตำแหน่ง {checkerPosition}
                  </div>
                </div>

                {/* Commander Block */}
                <div className="text-center space-y-0.5 border-l border-stone-400 pl-2">
                  <div className="font-bold text-[15pt]">คำสั่ง ผกก.</div>
                  <div className="flex items-center justify-center gap-4 text-[14.5pt]">
                    <span>{leave.status === 'approved' ? '☑' : '☐'} อนุญาต</span>
                    <span>{leave.status === 'rejected' ? '☑' : '☐'} ไม่อนุญาต</span>
                  </div>
                  <div className="pt-1 font-mono text-[14.5pt] whitespace-nowrap overflow-hidden">
                    (ลงชื่อ){commanderRank}....................................................
                  </div>
                  <div className="font-bold text-[15pt]">
                    (&nbsp;{stripPoliceRank(recipientName)}&nbsp;)
                  </div>
                  <div className="text-[14pt]">
                    ตำแหน่ง {recipientPosition}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Footer Credit (Hidden in Print) */}
      <footer className="mt-6 mb-4 text-center text-xs text-stone-500 no-print">
        พัฒนาระบบโดย นางสาวพิมลวรรณ สุพะสอน นักวิชาการสาธารณสุข โรงพยาบาลโพนนาแก้ว
      </footer>
    </div>
  );
};
