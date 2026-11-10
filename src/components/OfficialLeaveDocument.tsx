import React, { useRef } from 'react';
import { LeaveRequest, StationConfig } from '../types/leave';
import { Printer, Download, ArrowLeft, CheckCircle2, Shield } from 'lucide-react';

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

  const handlePrint = () => {
    window.print();
  };

  // Convert standard date string to Thai formatted date parts
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

  // Form title based on leave type
  const getDocumentTitle = () => {
    if (leave.leaveType === 'vacation') return 'แบบใบลาพักผ่อน';
    if (leave.leaveType === 'paternity') return 'แบบใบลาเพื่อดูแลบุตรและภรรยาหลังคลอด';
    if (leave.leaveType === 'ordination') return 'แบบใบลาอุปสมบท';
    return 'แบบใบลาป่วย ลาคลอด ลากิจส่วนตัว';
  };

  return (
    <div className="min-h-screen bg-stone-200/70 p-4 sm:p-8 print:p-0 print:bg-white flex flex-col items-center">
      {/* Action Bar (Hidden when printing) */}
      <div className="w-full max-w-[210mm] mb-6 flex flex-wrap items-center justify-between gap-3 no-print bg-white p-4 rounded-xl shadow-md border border-stone-200">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </button>
          )}
          <div>
            <h2 className="text-base font-bold text-rose-950 flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-800" />
              {getDocumentTitle()} (เลขที่ {leave.leaveNumber})
            </h2>
            <p className="text-xs text-stone-500">เอกสารแบบพิมพ์ราชการมาตรฐาน A4 ถูกต้องตามระเบียบ สภ.ศรีสงคราม</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-rose-900 hover:bg-rose-950 text-white shadow transition transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            พิมพ์เอกสาร / บันทึก PDF (A4)
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div
        ref={printRef}
        className="w-[210mm] min-h-[297mm] bg-white text-black p-[20mm] shadow-2xl rounded-sm print:shadow-none print:m-0 print:p-0 text-[15pt] leading-[1.35] relative box-border"
        style={{ fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'THSarabunNew', 'Sarabun', sans-serif" }}
      >
        {/* Document Title */}
        <div className="text-center font-bold text-[18pt] mb-2">
          {getDocumentTitle()}
        </div>

        {/* Written Place & Date */}
        <div className="text-right text-[15pt] space-y-1 mb-3">
          <div>
            เขียนที่{' '}
            <span className="font-semibold underline decoration-dotted underline-offset-4">
              {config.stationName}
            </span>
          </div>
          <div>
            วันที่ <span className="font-semibold underline decoration-dotted underline-offset-4">{createdDate.day}</span>{' '}
            เดือน <span className="font-semibold underline decoration-dotted underline-offset-4">{createdDate.month}</span>{' '}
            พ.ศ. <span className="font-semibold underline decoration-dotted underline-offset-4">{createdDate.year}</span>
          </div>
        </div>

        {/* Subject & Recipient */}
        <div className="text-[15pt] space-y-1 mb-3">
          <div>
            <span className="font-bold">เรื่อง</span>{' '}
            {leave.leaveType === 'vacation' ? 'ขออนุญาตลาพักผ่อน' :
             leave.leaveType === 'paternity' ? 'ขออนุญาตลาเพื่อดูแลบุตรและภรรยาหลังคลอด' :
             leave.leaveType === 'ordination' ? 'ขออนุญาตลาอุปสมบท' :
             'ขออนุญาตลา'}
          </div>
          <div>
            <span className="font-bold">เรียน</span>{' '}
            {isSuperintendent
              ? `ผู้บังคับการตำรวจภูธรจังหวัดนครพนม (${recipientName})`
              : 'ผู้กำกับการสถานีตำรวจภูธรศรีสงคราม'}
          </div>
        </div>

        {/* Applicant Details (Requirement 28: in leave form body, show rank and name cleanly) */}
        <div className="text-[15pt] text-justify indent-10 space-y-1 leading-[1.45]">
          <p>
            ข้าพเจ้า{' '}
            <span className="font-bold underline decoration-dotted underline-offset-4">
              {leave.userRank} {leave.userName} {leave.userSurname}
            </span>{' '}
            ตำแหน่ง{' '}
            <span className="font-semibold underline decoration-dotted underline-offset-4">
              {leave.positionTitle || 'ข้าราชการตำรวจ'}
            </span>
          </p>
          <p className="indent-0">
            สังกัด{' '}
            <span className="underline decoration-dotted underline-offset-4">{config.stationName}</span>{' '}
            กองบังคับการ{' '}
            <span className="underline decoration-dotted underline-offset-4">{config.policeDivision}</span>{' '}
            กองบัญชาการ{' '}
            <span className="underline decoration-dotted underline-offset-4">{config.policeRegion}</span>
          </p>

          {/* Type-specific body clauses matching the PDF originals */}
          {leave.leaveType === 'vacation' && (
            <p className="indent-0">
              มีวันลาพักผ่อนสะสม{' '}
              <span className="font-semibold underline decoration-dotted underline-offset-4">{leave.accumulatedDays}</span>{' '}
              วันทำการ มีสิทธิลาพักผ่อนประจำปีนี้อีก{' '}
              <span className="font-semibold underline decoration-dotted underline-offset-4">{leave.currentQuotaDays}</span>{' '}
              วันทำการ รวมเป็น{' '}
              <span className="font-bold underline decoration-dotted underline-offset-4">{leave.totalQuotaDays}</span>{' '}
              วันทำการ
            </p>
          )}

          {leave.leaveType === 'paternity' && (
            <p className="indent-0">
              ภรรยาชื่อ{' '}
              <span className="underline decoration-dotted underline-offset-4">{leave.spouseName || '...................................................'}</span>{' '}
              คลอดเมื่อ{' '}
              <span className="underline decoration-dotted underline-offset-4">{leave.childBirthDate || '...........................................'}</span>{' '}
              มีความประสงค์ขอลาเพื่อดูแลบุตรและภรรยาหลังคลอด
            </p>
          )}

          {leave.leaveType === 'ordination' && (
            <div className="indent-0 space-y-1">
              <p>
                เกิดวันที่ <span className="underline decoration-dotted underline-offset-4">{leave.bornDate || '........................'}</span>{' '}
                เข้ารับราชการเมื่อวันที่ <span className="underline decoration-dotted underline-offset-4">{leave.joinedDate || '........................'}</span>{' '}
                ข้าพเจ้า {leave.everOrdained ? '☑ เคย' : '☐ เคย'} {leave.everOrdained ? '☐ ไม่เคย' : '☑ ไม่เคย'} อุปสมบท
              </p>
              <p>
                บัดนี้มีศรัทธาจะอุปสมบทในพุทธศาสนา ณ วัด <span className="underline decoration-dotted underline-offset-4">{leave.templeName || '................................................'}</span>{' '}
                ตั้งอยู่ ณ <span className="underline decoration-dotted underline-offset-4">{leave.templeLocation || '................................................'}</span>
              </p>
            </div>
          )}

          {/* Sick / Personal / Maternity checkboxes */}
          {['sick', 'personal', 'maternity'].includes(leave.leaveType) && (
            <div className="indent-0 flex items-center gap-6 my-1">
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

          <p className="indent-0">
            {leave.leaveType === 'vacation' ? 'ขอลาพักผ่อนตั้งแต่วันที่' :
             leave.leaveType === 'ordination' ? 'จึงขอลาอุปสมบท มีกำหนด' :
             'ตั้งแต่วันที่'}{' '}
            <span className="font-semibold underline decoration-dotted underline-offset-4">{startDate.day} {startDate.month} {startDate.year}</span>{' '}
            ถึงวันที่{' '}
            <span className="font-semibold underline decoration-dotted underline-offset-4">{endDate.day} {endDate.month} {endDate.year}</span>{' '}
            มีกำหนด{' '}
            <span className="font-bold underline decoration-dotted underline-offset-4">{leave.durationDays}</span>{' '}
            วัน
          </p>

          {['sick', 'personal'].includes(leave.leaveType) && (
            <p className="indent-0 text-[14pt]">
              ข้าพเจ้าได้ลา ☐ ป่วย ☐ คลอด ☐ กิจส่วนตัว ครั้งสุดท้าย ตั้งแต่วันที่ {leave.lastLeaveStartDate || '...........................'} ถึงวันที่ {leave.lastLeaveEndDate || '...........................'} มีกำหนด {leave.lastLeaveDays || '.....'} วัน
            </p>
          )}

          <p className="indent-0">
            ในระหว่างลาติดต่อข้าพเจ้าได้ที่{' '}
            <span className="underline decoration-dotted underline-offset-4">{leave.contactAddress || config.address}</span>{' '}
            เบอร์โทรศัพท์{' '}
            <span className="font-semibold underline decoration-dotted underline-offset-4">{leave.contactPhone || leave.contactPhone}</span>
          </p>
        </div>

        {/* Applicant Signature Section */}
        {/* Requirement 78: แสดงยศติดกับคำว่า (ลงชื่อ) และตามด้วยเส้นจุดไข่ปลาทันที เช่น (ลงชื่อ) จ.ส.ต.................................................... */}
        <div className="w-1/2 ml-auto text-center mt-4 text-[15pt] space-y-1">
          <div>ขอแสดงความนับถือ</div>
          <div className="mt-4 font-mono text-[14pt]">
            (ลงชื่อ) {leave.userRank}....................................................
          </div>
          <div className="font-bold">
            ( {leave.userName} {leave.userSurname} )
          </div>
          <div>ตำแหน่ง {leave.positionTitle || 'ข้าราชการตำรวจ'}</div>
        </div>

        {/* 2 Columns: Left = Stats & Manpower, Right = Supervisor comment & Commander Order */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-black text-[14pt]">
          {/* Left Column: Leave statistics table & Manpower input */}
          <div className="space-y-3">
            <div>
              <div className="font-bold mb-1">สถิติการลาในปีงบประมาณนี้</div>
              <table className="w-full border-collapse border border-black text-center text-[13pt]">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="border border-black p-1 font-bold">ลามาแล้ว<br/>(วันทำการ)</th>
                    <th className="border border-black p-1 font-bold">ลาครั้งนี้<br/>(วันทำการ)</th>
                    <th className="border border-black p-1 font-bold">รวมเป็น<br/>(วันทำการ)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1.5">{leave.usedDaysBefore || '-'}</td>
                    <td className="border border-black p-1.5 font-bold">{leave.currentRequestDays || leave.durationDays}</td>
                    <td className="border border-black p-1.5 font-bold">{leave.totalUsedDaysAfter || (leave.usedDaysBefore + leave.durationDays)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Requirement 20 & 29: ผู้ลาปฏิบัติหน้าที่... มีกำลังปฏิบัติหน้าที่... นาย ลา... นาย เหลือกำลังปฏิบัติหน้าที่... นาย */}
            <div className="border border-dashed border-stone-400 p-2 rounded text-[13pt] space-y-1">
              <div>
                ผู้ลาปฏิบัติหน้าที่{' '}
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  {leave.dutyName || 'งานอำนวยการ'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>
                  มีกำลังปฏิบัติหน้าที่{' '}
                  <span className="font-bold underline decoration-dotted underline-offset-4">
                    {leave.dutyTotalOfficers || config.dutyOfficersTotal}
                  </span>{' '}
                  นาย
                </span>
                <span>
                  ลา{' '}
                  <span className="font-bold underline decoration-dotted underline-offset-4">
                    {leave.dutyLeavingOfficers || 1}
                  </span>{' '}
                  นาย
                </span>
              </div>
              <div>
                เหลือกำลังปฏิบัติหน้าที่{' '}
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  {leave.dutyRemainingOfficers || Math.max(0, (leave.dutyTotalOfficers || config.dutyOfficersTotal) - (leave.dutyLeavingOfficers || 1))}
                </span>{' '}
                นาย
              </div>
            </div>

            {/* Recommender Signature */}
            {/* Requirement 78: (ลงชื่อ) {rank}................................ */}
            <div className="text-center pt-2 text-[13pt] space-y-1">
              <div>เพื่อโปรดพิจารณา</div>
              <div className="font-mono">
                (ลงชื่อ) {leave.userRank}....................................................
              </div>
              <div className="text-xs">
                ตำแหน่ง {leave.positionTitle || 'ผบ.หมู่(ป.)สภ.ศรีสงคราม'}
              </div>
            </div>
          </div>

          {/* Right Column: Supervisor opinion & Commander Order */}
          <div className="space-y-4 pl-2 border-l border-stone-300">
            {/* Supervisor opinion */}
            <div className="space-y-1">
              <div className="font-bold">ความเห็นของผู้บังคับบัญชา</div>
              <div className="min-h-[28px] text-[13pt] italic">
                {leave.supervisorComment || 'เห็นควรอนุญาต กำลังพลเพียงพอต่อการปฏิบัติหน้าที่'}
              </div>
              <div className="text-center pt-2">
                <div className="font-mono text-[13pt]">
                  (ลงชื่อ) พ.ต.ต...................................................
                </div>
                <div className="font-semibold text-[13pt]">
                  ( {leave.supervisorSignedBy || config.superintendentRankName || 'เลิศพิสิฐธร สมบัติภูธร'} )
                </div>
                <div className="text-xs text-stone-700">
                  ตำแหน่ง {config.superintendentPosition || 'สว.อก.สภ.ศรีสงคราม'}
                </div>
                <div className="text-xs text-stone-600">
                  วันที่ {createdDate.day} {createdDate.month} {createdDate.year}
                </div>
              </div>
            </div>

            {/* Commander Order */}
            <div className="pt-2 border-t border-stone-300 space-y-1">
              <div className="font-bold">คำสั่ง</div>
              <div className="flex items-center gap-4 text-[13pt]">
                <span className={leave.status === 'approved' ? 'font-bold' : ''}>
                  {leave.status === 'approved' ? '☑' : '☐'} อนุญาต
                </span>
                <span className={leave.status === 'rejected' ? 'font-bold' : ''}>
                  {leave.status === 'rejected' ? '☑' : '☐'} ไม่อนุญาต
                </span>
                {leave.rejectReason && <span className="text-xs text-red-600">({leave.rejectReason})</span>}
              </div>

              <div className="text-center pt-3">
                <div className="font-mono text-[13pt]">
                  (ลงชื่อ) {isSuperintendent ? 'พล.ต.ต.' : 'พ.ต.อ.'}...................................................
                </div>
                <div className="font-bold text-[13pt]">
                  ( {recipientName} )
                </div>
                <div className="text-xs text-stone-800">
                  ตำแหน่ง {recipientPosition}
                </div>
                <div className="text-xs text-stone-600">
                  วันที่ {createdDate.day} {createdDate.month} {createdDate.year}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
