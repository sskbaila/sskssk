import React, { useRef, useState, useEffect } from 'react';
import { LeaveRequest, StationConfig, LEAVE_TYPE_LABELS } from '../types/leave';
import { 
  Printer, ArrowLeft, Shield, Edit3, RotateCcw, LayoutTemplate, 
  Files, FileText, CheckCircle2, Search, Calendar, ChevronDown, 
  ExternalLink, BarChart3, Users
} from 'lucide-react';

interface OfficialLeaveDocumentProps {
  leave: LeaveRequest;
  config: StationConfig;
  allLeaves?: LeaveRequest[];
  onSelectLeave?: (leave: LeaveRequest) => void;
  onNavigateToReports?: () => void;
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
  leave: initialLeave,
  config,
  allLeaves = [],
  onSelectLeave,
  onNavigateToReports,
  onBack
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Active leave being displayed
  const [activeLeave, setActiveLeave] = useState<LeaveRequest>(initialLeave);

  // Sync when initialLeave changes
  useEffect(() => {
    setActiveLeave(initialLeave);
  }, [initialLeave]);

  // Print orientation state (Portrait 21x29.7 cm vs Landscape 29.7x21 cm)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Batch print mode: Show all printable leave sheets continuously
  const [batchPrintMode, setBatchPrintMode] = useState<boolean>(false);

  // Sheet picker modal / selector dropdown state
  const [sheetPickerOpen, setSheetPickerOpen] = useState<boolean>(false);
  const [leaveSearch, setLeaveSearch] = useState<string>('');

  // Requirement: "แก้ไขให้ใบลา ปี พ.ศ.ให้มันตรง"
  // ค่าปี พ.ศ. ประจำใบลา เช่น 2568 ให้ตรงกับปีงบประมาณและเลขที่ใบลา
  const [docYear, setDocYear] = useState<string>(() => {
    if (initialLeave.fiscalYear) return initialLeave.fiscalYear.toString();
    if (config.currentFiscalYear) return config.currentFiscalYear.toString();
    return '2568';
  });

  // Update docYear when activeLeave changes
  useEffect(() => {
    if (activeLeave.fiscalYear) {
      setDocYear(activeLeave.fiscalYear.toString());
    } else if (config.currentFiscalYear) {
      setDocYear(config.currentFiscalYear.toString());
    } else {
      setDocYear('2568');
    }
  }, [activeLeave.id, activeLeave.fiscalYear, config.currentFiscalYear]);

  // Checker customization (ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา)
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

  const handleSwitchLeave = (selected: LeaveRequest) => {
    setActiveLeave(selected);
    if (onSelectLeave) {
      onSelectLeave(selected);
    }
    setSheetPickerOpen(false);
  };

  // Safe Thai Date Formatter with accurate Buddhist Era Year
  const formatThaiDate = (dateStr?: string, customYear?: string) => {
    const targetYear = customYear || docYear || '2568';
    if (!dateStr) return { day: '.....', month: '..................', year: targetYear };

    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // Parse YYYY-MM-DD directly without UTC timezone skew
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      const rawYear = parseInt(parts[0], 10);
      const mIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
      const day = parseInt(parts[2], 10).toString();
      const month = months[mIdx];
      return { day, month, year: targetYear };
    }

    const date = new Date(dateStr);
    return {
      day: date.getDate().toString(),
      month: months[date.getMonth()],
      year: targetYear
    };
  };

  // Recipient info
  const isSuperintendent = activeLeave.userId === 'off-1' || activeLeave.recipientTitle === 'ผบก.ภ.จว.นครพนม';
  const recipientName = isSuperintendent
    ? (activeLeave.commanderCustomName || config.provincialCommanderRankName || 'พล.ต.ต. อารักษ์ มะสาธานัง')
    : (config.superintendentRankName || 'พ.ต.อ. ถวิล คำเกษ');

  const recipientPosition = isSuperintendent
    ? (config.provincialCommanderPosition || 'ผบก.ภ.จว.นครพนม')
    : (config.superintendentPosition || 'ผกก.สภ.ศรีสงคราม');

  const commanderRank = isSuperintendent ? 'พล.ต.ต.' : 'พ.ต.อ.';

  // Form title strictly matching police PDF documents
  const getDocumentTitle = (type: string) => {
    if (type === 'vacation') return '(แบบใบลาพักผ่อน)';
    if (type === 'paternity') return '(แบบใบลาเพื่อดูแลบุตรและภรรยาหลังคลอด)';
    if (type === 'ordination') return '(แบบใบลาอุปสมบท)';
    return '(แบบใบลาป่วย ลาคลอด ลากิจส่วนตัว)';
  };

  const getSubjectText = (type: string) => {
    if (type === 'vacation') return 'ขอลาพักผ่อน';
    if (type === 'paternity') return 'ขอลาเพื่อดูแลบุตรและภรรยาหลังคลอด';
    if (type === 'ordination') return 'ขอลาอุปสมบท';
    if (type === 'sick') return 'ขอลาป่วย';
    if (type === 'maternity') return 'ขอลาคลอด';
    if (type === 'personal') return 'ขอลากิจส่วนตัว';
    return 'ขออนุญาตลา';
  };

  // Filter leaves for the sheet picker
  const filteredLeaves = allLeaves.filter(l => {
    if (!leaveSearch.trim()) return true;
    const term = leaveSearch.toLowerCase();
    const full = `${l.leaveNumber} ${l.userRank} ${l.userName} ${l.userSurname} ${l.userCallSign} ${l.leaveType}`.toLowerCase();
    return full.includes(term);
  });

  // Render Single Sheet
  const renderLeaveSheet = (currentLeave: LeaveRequest, isMultiPage: boolean = false) => {
    const createdDate = formatThaiDate(currentLeave.createdAt?.split(' ')[0] || currentLeave.startDate, docYear);
    const startDate = formatThaiDate(currentLeave.startDate, docYear);
    const endDate = formatThaiDate(currentLeave.endDate, docYear);
    const totalUsedAfter = (currentLeave.usedDaysBefore || 0) + (currentLeave.currentRequestDays || currentLeave.durationDays || 0);

    const sheetRecipientName = currentLeave.userId === 'off-1' || currentLeave.recipientTitle === 'ผบก.ภ.จว.นครพนม'
      ? (currentLeave.commanderCustomName || config.provincialCommanderRankName || 'พล.ต.ต. อารักษ์ มะสาธานัง')
      : (config.superintendentRankName || 'พ.ต.อ. ถวิล คำเกษ');

    const sheetRecipientPosition = currentLeave.userId === 'off-1' || currentLeave.recipientTitle === 'ผบก.ภ.จว.นครพนม'
      ? (config.provincialCommanderPosition || 'ผบก.ภ.จว.นครพนม')
      : (config.superintendentPosition || 'ผกก.สภ.ศรีสงคราม');

    const sheetCommanderRank = (currentLeave.userId === 'off-1' || currentLeave.recipientTitle === 'ผบก.ภ.จว.นครพนม')
      ? 'พล.ต.ต.' : 'พ.ต.อ.';

    if (orientation === 'landscape') {
      // LANDSCAPE A4 (29.7cm x 21cm)
      return (
        <div
          key={currentLeave.id}
          className={`print-container w-[297mm] min-h-[210mm] max-w-[297mm] bg-white text-black px-[18mm] py-[12mm] shadow-2xl rounded-xs print:shadow-none print:m-0 print:px-[12mm] print:py-[8mm] print:w-[297mm] print:h-[210mm] box-border overflow-hidden flex flex-col justify-between ${
            isMultiPage ? 'mb-8 print:mb-0 print-page-break' : ''
          }`}
          style={{
            fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'THSarabunNew', 'Sarabun', sans-serif",
            fontSize: '16pt',
            lineHeight: '1.4',
            color: '#000000',
          }}
        >
          {/* Document Header in Landscape */}
          <div className="text-center font-bold text-[20pt] leading-tight tracking-wide border-b border-black pb-1 mb-2">
            {getDocumentTitle(currentLeave.leaveType)}
          </div>

          {/* 2 Wide Columns Grid filling the 29.7cm x 21cm page */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* Left Column: Applicant Information & Request */}
            <div className="space-y-2 pr-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                {/* Place and Date with correct BE Year */}
                <div className="text-right text-[16pt] leading-tight">
                  <div>
                    เขียนที่ <span className="font-semibold underline decoration-dotted underline-offset-4">{config.stationName}</span>
                  </div>
                  <div>
                    วันที่ <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.day}&nbsp;</span>{' '}
                    เดือน <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{createdDate.month}&nbsp;</span>{' '}
                    พ.ศ. <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{docYear}&nbsp;</span>
                  </div>
                </div>

                {/* Subject & Recipient */}
                <div className="text-[16pt] leading-tight space-y-0.5">
                  <div>
                    <span className="font-bold">เรื่อง</span>&nbsp;&nbsp;&nbsp;&nbsp;{getSubjectText(currentLeave.leaveType)}
                  </div>
                  <div>
                    <span className="font-bold">เรียน</span>&nbsp;&nbsp;&nbsp;&nbsp;
                    {currentLeave.userId === 'off-1' || currentLeave.recipientTitle === 'ผบก.ภ.จว.นครพนม'
                      ? `ผู้บังคับการตำรวจภูธรจังหวัดนครพนม (${sheetRecipientName})`
                      : 'ผกก.สภ.ศรีสงคราม'}
                  </div>
                </div>

                {/* Applicant details */}
                <div className="text-[16pt] text-justify space-y-1 leading-[1.38]">
                  <p className="indent-[2cm]">
                    ข้าพเจ้า&nbsp;
                    <span className="font-bold underline decoration-dotted underline-offset-4">
                      {currentLeave.userRank}&nbsp;&nbsp;{stripPoliceRank(currentLeave.userName)}&nbsp;&nbsp;{currentLeave.userSurname}
                    </span>&nbsp;&nbsp;
                    ตำแหน่ง&nbsp;
                    <span className="font-semibold underline decoration-dotted underline-offset-4">
                      {currentLeave.positionTitle || 'ข้าราชการตำรวจ'}
                    </span>
                  </p>

                  <p>
                    สังกัด <span className="underline decoration-dotted underline-offset-4">{config.stationName}</span>&nbsp;&nbsp;
                    บก. <span className="underline decoration-dotted underline-offset-4">{config.policeDivision}</span>&nbsp;&nbsp;
                    ภ. <span className="underline decoration-dotted underline-offset-4">{config.policeRegion}</span>
                  </p>

                  {currentLeave.leaveType === 'vacation' && (
                    <p>
                      มีวันลาพักผ่อนสะสม <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.accumulatedDays}&nbsp;</span> วันทำการ{' '}
                      มีสิทธิปีนี้อีก <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.currentQuotaDays}&nbsp;</span> วันทำการ{' '}
                      รวมเป็น <span className="font-bold underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.totalQuotaDays}&nbsp;</span> วันทำการ
                    </p>
                  )}

                  {['sick', 'personal', 'maternity'].includes(currentLeave.leaveType) && (
                    <div className="flex items-center gap-6 py-0.5">
                      <span>ขออนุญาต</span>
                      <span className={currentLeave.leaveType === 'sick' ? 'font-bold' : ''}>
                        {currentLeave.leaveType === 'sick' ? '☑' : '☐'} ลาป่วย
                      </span>
                      <span className={currentLeave.leaveType === 'maternity' ? 'font-bold' : ''}>
                        {currentLeave.leaveType === 'maternity' ? '☑' : '☐'} ลาคลอด
                      </span>
                      <span className={currentLeave.leaveType === 'personal' ? 'font-bold' : ''}>
                        {currentLeave.leaveType === 'personal' ? '☑' : '☐'} ลากิจส่วนตัว
                      </span>
                    </div>
                  )}

                  <p>
                    {currentLeave.leaveType === 'vacation' ? 'ขอลาพักผ่อนตั้งแต่วันที่' : 'ตั้งแต่วันที่'}&nbsp;
                    <span className="font-semibold underline decoration-dotted underline-offset-4">
                      {startDate.day} {startDate.month} พ.ศ. {docYear}
                    </span>&nbsp;&nbsp;
                    ถึงวันที่&nbsp;
                    <span className="font-semibold underline decoration-dotted underline-offset-4">
                      {endDate.day} {endDate.month} พ.ศ. {docYear}
                    </span>&nbsp;&nbsp;
                    มีกำหนด&nbsp;
                    <span className="font-bold underline decoration-dotted underline-offset-4">
                      {currentLeave.durationDays}
                    </span>&nbsp;
                    วัน
                  </p>

                  <p>
                    ระหว่างลาติดต่อได้ที่&nbsp;
                    <span className="underline decoration-dotted underline-offset-4">
                      {currentLeave.contactAddress || config.address}
                    </span>&nbsp;&nbsp;
                    โทร.&nbsp;
                    <span className="font-semibold underline decoration-dotted underline-offset-4">
                      {currentLeave.contactPhone || config.phone}
                    </span>
                  </p>
                </div>
              </div>

              {/* Applicant Signature */}
              <div className="w-[85%] ml-auto text-center pt-2 text-[16pt] leading-tight space-y-0.5">
                <div>ขอแสดงความนับถือ</div>
                <div className="pt-1.5 font-mono text-[15pt] whitespace-nowrap overflow-hidden">
                  (ลงชื่อ){currentLeave.userRank}....................................................
                </div>
                <div className="font-bold">
                  (&nbsp;{stripPoliceRank(currentLeave.userName)}&nbsp;&nbsp;{currentLeave.userSurname}&nbsp;)
                </div>
                <div className="text-[15pt]">
                  ตำแหน่ง&nbsp;{currentLeave.positionTitle || 'ข้าราชการตำรวจ'}
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
                        <td className="border border-black p-1">{currentLeave.usedDaysBefore || '-'}</td>
                        <td className="border border-black p-1 font-bold">{currentLeave.currentRequestDays || currentLeave.durationDays}</td>
                        <td className="border border-black p-1 font-bold">{totalUsedAfter}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-[15.5pt] space-y-0.5 leading-snug">
                  <div>
                    ผู้ลาปฏิบัติหน้าที่&nbsp;&nbsp;
                    <span className="font-bold underline decoration-dotted underline-offset-4">{currentLeave.dutyName || 'งานอำนวยการ'}</span>
                  </div>
                  <div>
                    มีกำลัง&nbsp;<span className="font-bold underline decoration-dotted underline-offset-4">{currentLeave.dutyTotalOfficers || config.dutyOfficersTotal}</span>&nbsp;นาย&nbsp;&nbsp;
                    ลา&nbsp;<span className="font-bold underline decoration-dotted underline-offset-4">{currentLeave.dutyLeavingOfficers || 1}</span>&nbsp;นาย&nbsp;&nbsp;
                    เหลือ&nbsp;<span className="font-bold underline decoration-dotted underline-offset-4">{currentLeave.dutyRemainingOfficers || Math.max(0, (currentLeave.dutyTotalOfficers || config.dutyOfficersTotal) - (currentLeave.dutyLeavingOfficers || 1))}</span>&nbsp;นาย
                  </div>
                </div>

                {/* Recommender Signature */}
                <div className="text-center pt-1 text-[15pt] space-y-0.5 leading-tight">
                  <div>เพื่อโปรดพิจารณา</div>
                  <div className="font-mono text-[14.5pt] whitespace-nowrap overflow-hidden">
                    (ลงชื่อ){currentLeave.userRank}....................................................
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
                    <span>{currentLeave.status === 'approved' ? '☑' : '☐'} อนุญาต</span>
                    <span>{currentLeave.status === 'rejected' ? '☑' : '☐'} ไม่อนุญาต</span>
                  </div>
                  <div className="pt-1 font-mono text-[14.5pt] whitespace-nowrap overflow-hidden">
                    (ลงชื่อ){sheetCommanderRank}....................................................
                  </div>
                  <div className="font-bold text-[15pt]">
                    (&nbsp;{stripPoliceRank(sheetRecipientName)}&nbsp;)
                  </div>
                  <div className="text-[14pt]">
                    ตำแหน่ง {sheetRecipientPosition}
                  </div>
                  <div className="text-[13.5pt] text-stone-700">
                    พ.ศ. {docYear}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // PORTRAIT A4 (21cm x 29.7cm)
    return (
      <div
        key={currentLeave.id}
        className={`print-container w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-black px-[18mm] py-[15mm] shadow-2xl rounded-xs print:shadow-none print:m-0 print:px-[15mm] print:py-[10mm] print:w-[210mm] print:h-[297mm] box-border overflow-hidden flex flex-col justify-between ${
          isMultiPage ? 'mb-8 print:mb-0 print-page-break' : ''
        }`}
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
            {getDocumentTitle(currentLeave.leaveType)}
          </div>

          {/* 2. Written Place & Date (Right Aligned) with accurate BE Year */}
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
              พ.ศ. <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{docYear}&nbsp;</span>
            </div>
          </div>

          {/* 3. Subject & Recipient */}
          <div className="text-[16pt] leading-snug space-y-1">
            <div>
              <span className="font-bold">เรื่อง</span>&nbsp;&nbsp;&nbsp;&nbsp;{getSubjectText(currentLeave.leaveType)}
            </div>
            <div>
              <span className="font-bold">เรียน</span>&nbsp;&nbsp;&nbsp;&nbsp;
              {currentLeave.userId === 'off-1' || currentLeave.recipientTitle === 'ผบก.ภ.จว.นครพนม'
                ? `ผู้บังคับการตำรวจภูธรจังหวัดนครพนม (${sheetRecipientName})`
                : 'ผกก.สภ.ศรีสงคราม'}
            </div>
          </div>

          {/* 4. Applicant Details Body */}
          <div className="text-[16pt] text-justify space-y-2 leading-[1.48]">
            <p className="indent-[2.5cm]">
              ข้าพเจ้า&nbsp;
              <span className="font-bold underline decoration-dotted underline-offset-4">
                {currentLeave.userRank}&nbsp;&nbsp;{stripPoliceRank(currentLeave.userName)}&nbsp;&nbsp;{currentLeave.userSurname}
              </span>&nbsp;&nbsp;&nbsp;&nbsp;
              ตำแหน่ง&nbsp;
              <span className="font-semibold underline decoration-dotted underline-offset-4">
                {currentLeave.positionTitle || 'ข้าราชการตำรวจ'}
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
            {currentLeave.leaveType === 'vacation' && (
              <p>
                มีวันลาพักผ่อนสะสม <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.accumulatedDays}&nbsp;</span> วันทำการ{' '}
                มีสิทธิลาพักผ่อนประจำปีนี้อีก <span className="font-semibold underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.currentQuotaDays}&nbsp;</span> วันทำการ{' '}
                รวมเป็น <span className="font-bold underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.totalQuotaDays}&nbsp;</span> วันทำการ
              </p>
            )}

            {/* Paternity Leave Clause */}
            {currentLeave.leaveType === 'paternity' && (
              <p>
                ภรรยาชื่อ <span className="underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.spouseName || '...................................................'}&nbsp;</span>{' '}
                คลอดบุตรเมื่อวันที่ <span className="underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.childBirthDate || '...........................................'}&nbsp;</span>{' '}
                มีความประสงค์ขอลาเพื่อดูแลบุตรและภรรยาหลังคลอด
              </p>
            )}

            {/* Ordination Leave Clause */}
            {currentLeave.leaveType === 'ordination' && (
              <div className="space-y-1">
                <p>
                  เกิดวันที่ <span className="underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.bornDate || '........................'}&nbsp;</span>{' '}
                  เข้ารับราชการเมื่อวันที่ <span className="underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.joinedDate || '........................'}&nbsp;</span>{' '}
                  ข้าพเจ้า {currentLeave.everOrdained ? '☑ เคย' : '☐ เคย'} {currentLeave.everOrdained ? '☐ ไม่เคย' : '☑ ไม่เคย'} อุปสมบท
                </p>
                <p>
                  บัดนี้มีศรัทธาจะอุปสมบทในพระพุทธศาสนา ณ วัด <span className="underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.templeName || '................................................'}&nbsp;</span>{' '}
                  ตั้งอยู่ ณ <span className="underline decoration-dotted underline-offset-4">&nbsp;{currentLeave.templeLocation || '................................................'}&nbsp;</span>
                </p>
              </div>
            )}

            {/* Sick / Personal / Maternity Checkboxes */}
            {['sick', 'personal', 'maternity'].includes(currentLeave.leaveType) && (
              <div className="flex items-center gap-8 py-0.5">
                <span>ขออนุญาต</span>
                <span className={currentLeave.leaveType === 'sick' ? 'font-bold' : ''}>
                  {currentLeave.leaveType === 'sick' ? '☑' : '☐'} ลาป่วย
                </span>
                <span className={currentLeave.leaveType === 'maternity' ? 'font-bold' : ''}>
                  {currentLeave.leaveType === 'maternity' ? '☑' : '☐'} ลาคลอด
                </span>
                <span className={currentLeave.leaveType === 'personal' ? 'font-bold' : ''}>
                  {currentLeave.leaveType === 'personal' ? '☑' : '☐'} ลากิจส่วนตัว
                </span>
              </div>
            )}

            {/* Leave Duration Clause with correct BE Year */}
            <p>
              {currentLeave.leaveType === 'vacation' ? 'ขอลาพักผ่อนตั้งแต่วันที่' :
               currentLeave.leaveType === 'ordination' ? 'จึงขอลาอุปสมบท มีกำหนด' :
               'ตั้งแต่วันที่'}&nbsp;
              <span className="font-semibold underline decoration-dotted underline-offset-4">
                {startDate.day} {startDate.month} พ.ศ. {docYear}
              </span>&nbsp;&nbsp;&nbsp;&nbsp;
              ถึงวันที่&nbsp;
              <span className="font-semibold underline decoration-dotted underline-offset-4">
                {endDate.day} {endDate.month} พ.ศ. {docYear}
              </span>&nbsp;&nbsp;&nbsp;&nbsp;
              มีกำหนด&nbsp;
              <span className="font-bold underline decoration-dotted underline-offset-4">
                {currentLeave.durationDays}
              </span>&nbsp;
              วัน
            </p>

            {['sick', 'personal'].includes(currentLeave.leaveType) && (
              <p>
                ข้าพเจ้าได้ลา ☐ ป่วย ☐ คลอด ☐ กิจส่วนตัว ครั้งสุดท้าย ตั้งแต่วันที่ {currentLeave.lastLeaveStartDate || '...........................'} ถึงวันที่ {currentLeave.lastLeaveEndDate || '...........................'} มีกำหนด {currentLeave.lastLeaveDays || '.....'} วัน
              </p>
            )}

            <p>
              ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่&nbsp;
              <span className="underline decoration-dotted underline-offset-4">
                {currentLeave.contactAddress || config.address}
              </span>&nbsp;&nbsp;&nbsp;&nbsp;
              โทรศัพท์&nbsp;
              <span className="font-semibold underline decoration-dotted underline-offset-4">
                {currentLeave.contactPhone || config.phone}
              </span>
            </p>
          </div>

          {/* 5. Applicant Signature Section */}
          <div className="w-[58%] ml-auto text-center mt-3 text-[16pt] leading-tight space-y-1">
            <div>ขอแสดงความนับถือ</div>
            <div className="pt-2 font-mono text-[15pt] whitespace-nowrap overflow-hidden">
              (ลงชื่อ){currentLeave.userRank}....................................................
            </div>
            <div className="font-bold pt-0.5">
              (&nbsp;{stripPoliceRank(currentLeave.userName)}&nbsp;&nbsp;{currentLeave.userSurname}&nbsp;)
            </div>
            <div className="text-[15.5pt]">
              ตำแหน่ง&nbsp;{currentLeave.positionTitle || 'ข้าราชการตำรวจ'}
            </div>
          </div>
        </div>

        {/* Bottom Half: 2 Columns */}
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
                    <td className="border border-black p-1.5">{currentLeave.usedDaysBefore || '-'}</td>
                    <td className="border border-black p-1.5 font-bold">{currentLeave.currentRequestDays || currentLeave.durationDays}</td>
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
                  {currentLeave.dutyName || 'งานอำนวยการ'}
                </span>
              </div>
              <div>
                มีกำลังปฏิบัติหน้าที่&nbsp;
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  &nbsp;{currentLeave.dutyTotalOfficers || config.dutyOfficersTotal}&nbsp;
                </span>&nbsp;นาย&nbsp;&nbsp;
                ลา&nbsp;
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  &nbsp;{currentLeave.dutyLeavingOfficers || 1}&nbsp;
                </span>&nbsp;นาย
              </div>
              <div>
                เหลือกำลังปฏิบัติหน้าที่&nbsp;
                <span className="font-bold underline decoration-dotted underline-offset-4">
                  &nbsp;{currentLeave.dutyRemainingOfficers || Math.max(0, (currentLeave.dutyTotalOfficers || config.dutyOfficersTotal) - (currentLeave.dutyLeavingOfficers || 1))}&nbsp;
                </span>&nbsp;นาย
              </div>
            </div>

            {/* Recommender Signature */}
            <div className="text-center pt-2 text-[15.5pt] space-y-0.5 leading-tight">
              <div>เพื่อโปรดพิจารณา</div>
              <div className="pt-1.5 font-mono text-[14.5pt] whitespace-nowrap overflow-hidden">
                (ลงชื่อ){currentLeave.userRank}....................................................
              </div>
              <div className="text-[15pt]">
                ตำแหน่ง&nbsp;{currentLeave.positionTitle || 'ผบ.หมู่(ป.)สภ.ศรีสงคราม'}
              </div>
            </div>
          </div>

          {/* Right Column: ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา */}
          <div className="space-y-2 pl-3 border-l-2 border-black">
            {/* Checker Block */}
            <div className="space-y-1 text-center">
              <div className="font-bold text-[16pt] leading-tight text-center whitespace-nowrap">
                ตรวจสอบถูกต้อง เสนอผู้กำกับการพิจารณา
              </div>

              {/* (ลงชื่อ)พ.ต.ต.................................................... */}
              <div className="pt-2 font-mono text-[15pt] text-center whitespace-nowrap overflow-hidden leading-tight">
                (ลงชื่อ){checkerRank || 'พ.ต.ต.'}....................................................
              </div>

              {/* Editable Name in Parentheses: ชื่อจริง ไม่มียศ */}
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
                <span className={currentLeave.status === 'approved' ? 'font-bold' : ''}>
                  {currentLeave.status === 'approved' ? '☑' : '☐'} อนุญาต
                </span>
                <span className={currentLeave.status === 'rejected' ? 'font-bold' : ''}>
                  {currentLeave.status === 'rejected' ? '☑' : '☐'} ไม่อนุญาต
                </span>
              </div>
              {currentLeave.rejectReason && (
                <div className="text-[13pt] text-red-700 italic leading-none">
                  ({currentLeave.rejectReason})
                </div>
              )}

              {/* (ลงชื่อ)พ.ต.อ.................................................... */}
              <div className="text-center pt-1.5 space-y-0.5 leading-tight">
                <div className="font-mono text-[15pt] whitespace-nowrap overflow-hidden">
                  (ลงชื่อ){sheetCommanderRank}....................................................
                </div>
                {/* ชื่อจริงในเอกสารจะไม่มียศติดกับชื่อ */}
                <div className="font-bold text-[16pt]">
                  (&nbsp;{stripPoliceRank(sheetRecipientName)}&nbsp;)
                </div>
                <div className="text-[15.5pt] text-stone-900">
                  ตำแหน่ง&nbsp;{sheetRecipientPosition}
                </div>
                <div className="text-[15pt] text-stone-800">
                  วันที่ <span className="underline decoration-dotted underline-offset-4">&nbsp;{createdDate.day}&nbsp;</span>{' '}
                  เดือน <span className="underline decoration-dotted underline-offset-4">&nbsp;{createdDate.month}&nbsp;</span>{' '}
                  พ.ศ. <span className="underline decoration-dotted underline-offset-4">&nbsp;{docYear}&nbsp;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              .print-page-break {
                page-break-after: always !important;
                break-after: page !important;
              }
            }
          `
        }}
      />

      {/* Top Action Bar & Customizer (Hidden when printing) */}
      <div className={`w-full ${orientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]'} mb-4 space-y-3 no-print transition-all duration-200`}>
        {/* Navigation, Sheet Selector, Orientation Toggle & Print Button */}
        <div className="bg-white p-3.5 rounded-xl shadow-md border border-stone-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                  {batchPrintMode 
                    ? `📑 โหมดพิมพ์ทุกชีทใบลา (${allLeaves.length} ฉบับ)`
                    : `${getDocumentTitle(activeLeave.leaveType)} — เลขที่ ${activeLeave.leaveNumber}`
                  }
                </h2>
                <p className="text-[11px] text-stone-500">
                  กระดาษ A4 (21 x 29.7 ซม.) • ฟอนต์ TH Sarabun New ขนาด 16 • ปี พ.ศ. {docYear}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Orientation Selector */}
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
                  <span>แนวตั้ง</span>
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
                  <span>แนวนอน</span>
                </button>
              </div>

              {/* Batch Print Toggle */}
              {allLeaves.length > 1 && (
                <button
                  type="button"
                  onClick={() => setBatchPrintMode(!batchPrintMode)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition ${
                    batchPrintMode
                      ? 'bg-amber-500 text-stone-950 border-amber-600 shadow'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                  }`}
                  title="สลับระหว่างพิมพ์ใบนี้ใบเดียว หรือพิมพ์ทุกใบลาพร้อมกัน"
                >
                  <Files className="w-4 h-4" />
                  <span>{batchPrintMode ? 'พิมพ์เฉพาะชีทนี้' : `พิมพ์ทุกชีท (${allLeaves.length})`}</span>
                </button>
              )}

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-rose-900 hover:bg-rose-950 text-white shadow-md transition transform active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์เอกสาร / บันทึก PDF</span>
              </button>
            </div>
          </div>

          {/* Requirement: "ทำให้มันเรียกไฟล์ออกมาได้ทุกชีทที่ปริ้นได้" */}
          {/* Quick Sheet Selector Bar */}
          <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <span className="text-xs font-bold text-stone-700 shrink-0 flex items-center gap-1">
                <FileText className="w-4 h-4 text-rose-800" />
                เรียกชีทใบลา:
              </span>
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setSheetPickerOpen(!sheetPickerOpen)}
                  className="w-full text-left p-2 rounded-lg border border-rose-300 bg-rose-50/40 hover:bg-rose-50 text-xs font-semibold text-rose-950 flex items-center justify-between transition"
                >
                  <span className="truncate">
                    {activeLeave.leaveNumber} — {activeLeave.userRank} {activeLeave.userName} {activeLeave.userSurname} ({LEAVE_TYPE_LABELS[activeLeave.leaveType]?.name || activeLeave.leaveType})
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-rose-800 shrink-0 ml-1" />
                </button>

                {/* Dropdown Menu */}
                {sheetPickerOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-full sm:w-[480px] bg-white rounded-xl shadow-2xl border border-stone-300 z-50 p-2 space-y-2">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-stone-50 rounded-lg border border-stone-200">
                      <Search className="w-3.5 h-3.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="ค้นหาชื่อ, ยศ, นามเรียกขาน, เลขที่ใบลา..."
                        value={leaveSearch}
                        onChange={e => setLeaveSearch(e.target.value)}
                        className="w-full text-xs bg-transparent outline-hidden"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {filteredLeaves.map(l => {
                        const isCurrent = l.id === activeLeave.id;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handleSwitchLeave(l)}
                            className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between gap-2 ${
                              isCurrent
                                ? 'bg-rose-900 text-white font-bold'
                                : 'hover:bg-rose-50/70 text-stone-800'
                            }`}
                          >
                            <div className="truncate">
                              <span className={`font-mono mr-1.5 ${isCurrent ? 'text-amber-300' : 'text-rose-900 font-bold'}`}>
                                {l.leaveNumber}
                              </span>
                              <span>
                                {l.userRank} {l.userName} {l.userSurname} ({l.userCallSign})
                              </span>
                              <span className={`text-[11px] ml-1.5 ${isCurrent ? 'text-rose-200' : 'text-stone-500'}`}>
                                • {LEAVE_TYPE_LABELS[l.leaveType]?.name || l.leaveType} ({l.durationDays} วัน)
                              </span>
                            </div>
                            {isCurrent && <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />}
                          </button>
                        );
                      })}
                      {filteredLeaves.length === 0 && (
                        <p className="text-center text-xs text-stone-400 py-3">ไม่พบใบลาที่ตรงกับการค้นหา</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links to other printable official sheets */}
            {onNavigateToReports && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">ชีทรายงานราชการ:</span>
                <button
                  type="button"
                  onClick={onNavigateToReports}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                  title="เปิดชีททะเบียนคุมการลาและรายงานราชการ 5 ฉบับ"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-rose-800" />
                  <span>ชีททะเบียนคุม / รายงานเสนอ ผกก.</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Customizer: Year adjuster & Checker Editor */}
        <div className="bg-amber-50/95 border-2 border-amber-300 p-3 rounded-xl shadow-xs text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs sm:text-sm">
              <Edit3 className="w-4 h-4 text-amber-800" />
              ตั้งค่าปี พ.ศ. และผู้ตรวจสอบเสนอ ผกก. (แก้ไขได้เอง):
            </span>
            <button
              type="button"
              onClick={handleResetChecker}
              className="text-[11px] text-amber-900 hover:text-rose-900 flex items-center gap-1 font-bold underline"
            >
              <RotateCcw className="w-3 h-3" />
              รีเซ็ตค่าเริ่มต้น
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {/* Requirement: "แก้ไขให้ใบลา ปี พ.ศ.ให้มันตรง" */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                ปี พ.ศ. ในใบลา (ให้ตรงกับปีงบประมาณ)
              </label>
              <input
                type="text"
                value={docYear}
                onChange={e => setDocYear(e.target.value)}
                placeholder="2568"
                className="w-full p-2 text-xs rounded-lg border border-amber-400 bg-white font-bold text-rose-950 focus:ring-2 focus:ring-rose-800"
              />
            </div>

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
                ชื่อจริง-สกุล ในวงเล็บ (ไม่มียศ)
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
            💡 รูปแบบช่องลงชื่อเป็น <span className="font-bold font-mono">(ลงชื่อ){checkerRank || 'พ.ต.ต.'}....................................................</span> และชื่อจริงในวงเล็บจะไม่มียศติดกับชื่อ • ปี พ.ศ. {docYear} ถูกซิงค์ตรงกันทุกจุดในเอกสาร
          </p>
        </div>
      </div>

      {/* Render Leave Document (Single Sheet or All Sheets) */}
      <div ref={printRef} className="w-full flex flex-col items-center">
        {batchPrintMode && allLeaves.length > 0 ? (
          allLeaves.map(l => renderLeaveSheet(l, true))
        ) : (
          renderLeaveSheet(activeLeave, false)
        )}
      </div>

      {/* Screen Footer Credit (Hidden in Print) */}
      <footer className="mt-6 mb-4 text-center text-xs text-stone-500 no-print">
        พัฒนาระบบโดย นางสาวพิมลวรรณ สุพะสอน นักวิชาการสาธารณสุข โรงพยาบาลโพนนาแก้ว
      </footer>
    </div>
  );
};
