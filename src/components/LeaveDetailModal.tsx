import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveRequest, LEAVE_TYPE_LABELS } from '../types/leave';
import { 
  X, Printer, CheckCircle2, XCircle, AlertCircle, Clock, 
  Calendar, FileText, Ban, Trash2, Edit3, User, MapPin, 
  Phone, Users, ChevronRight, ShieldCheck, ArrowRight
} from 'lucide-react';

interface LeaveDetailModalProps {
  leave: LeaveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintA4: (leave: LeaveRequest) => void;
}

export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
  leave,
  isOpen,
  onClose,
  onPrintA4
}) => {
  const { 
    currentUser, 
    cancelLeaveRequest, 
    withdrawLeaveRequest, 
    approveLeaveRequest, 
    rejectLeaveRequest,
    returnForRevision
  } = useLeave();

  const [rejectPrompt, setRejectPrompt] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen || !leave) return null;

  const typeConfig = LEAVE_TYPE_LABELS[leave.leaveType] || {
    name: leave.leaveType,
    code: '?',
    color: '#666',
    emoji: '📄'
  };

  const isOwner = currentUser?.id === leave.userId;
  const isAdmin = currentUser?.role === 'admin';
  const isSuperintendent = currentUser?.role === 'superintendent';
  const isApprover = currentUser?.role === 'approver' || isSuperintendent;
  const isChecker = currentUser?.role === 'checker' || isAdmin;
  const isSupervisor = currentUser?.role === 'supervisor' || isApprover || isAdmin;

  // Requirement 19: เจ้าของคำขอลา หรือ ผู้ดูแลระบบ (Admin) สามารถกดยกเลิกคำขอลาได้!
  const canCancel = (isOwner || isAdmin) && !['cancelled', 'withdrawn'].includes(leave.status);

  // Can withdraw if pending and is owner
  const canWithdraw = isOwner && ['pending_supervisor', 'pending_checker'].includes(leave.status);

  // Can approve/reject
  const canApprove = (isSupervisor || isChecker || isApprover || isAdmin) && 
    ['pending_supervisor', 'pending_checker', 'pending_approver'].includes(leave.status);

  const handleCancel = () => {
    cancelLeaveRequest(leave.id, cancelReasonText || 'ผู้ใช้ยกเลิกคำขอลา');
    setNotice({ text: 'ยกเลิกคำขอลาเรียบร้อยแล้ว (สถานะเปลี่ยนเป็น cancelled)', type: 'success' });
    setTimeout(() => {
      setCancelPrompt(false);
      onClose();
    }, 1000);
  };

  const handleWithdraw = () => {
    if (confirm('คุณต้องการถอนคำขอลานี้ใช่หรือไม่?')) {
      withdrawLeaveRequest(leave.id);
      setNotice({ text: 'ถอนคำขอลาเรียบร้อยแล้ว', type: 'success' });
      setTimeout(() => onClose(), 800);
    }
  };

  const handleApprove = () => {
    approveLeaveRequest(leave.id, commentText || 'อนุญาต');
    setNotice({ text: 'บันทึกการอนุมัติคำขอลาเรียบร้อยแล้ว', type: 'success' });
    setTimeout(() => onClose(), 800);
  };

  const handleReject = () => {
    // Requirement 49: บังคับกรอกเหตุผลไม่อนุมัติ!
    if (!rejectReasonText.trim()) {
      setNotice({ text: 'กรุณาระบุเหตุผลการไม่อนุมัติ (ตามระเบียบจำเป็นต้องระบุ)', type: 'error' });
      return;
    }
    rejectLeaveRequest(leave.id, rejectReasonText);
    setNotice({ text: 'บันทึกคำสั่งไม่อนุมัติเรียบร้อยแล้ว', type: 'success' });
    setTimeout(() => {
      setRejectPrompt(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rose-900/10 bg-linear-to-r from-rose-950 via-rose-900 to-rose-950 p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-white/10 rounded-xl">{typeConfig.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">ใบลาเลขที่ {leave.leaveNumber}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  leave.status === 'approved' ? 'bg-emerald-500 text-white' :
                  leave.status === 'rejected' ? 'bg-red-500 text-white' :
                  leave.status === 'cancelled' ? 'bg-stone-500 text-white' :
                  'bg-amber-400 text-stone-900'
                }`}>
                  {leave.status === 'approved' ? 'อนุมัติแล้ว' :
                   leave.status === 'rejected' ? 'ไม่อนุมัติ' :
                   leave.status === 'cancelled' ? 'ยกเลิกคำขอแล้ว' :
                   leave.status === 'withdrawn' ? 'ถอนคำขอแล้ว' :
                   'รอการอนุมัติ'}
                </span>
              </div>
              <p className="text-xs text-rose-200">
                {leave.userRank} {leave.userName} {leave.userSurname} ({leave.userCallSign})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {notice && (
            <div className={`p-3.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
              notice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {notice.text}
            </div>
          )}

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-sm">
            <div>
              <span className="text-xs text-stone-500 block">ประเภทการลา</span>
              <span className="font-bold text-rose-950">{typeConfig.name}</span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block">จำนวนวันที่ลา</span>
              <span className="font-bold text-rose-950">{leave.durationDays} วัน</span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block">วันที่เริ่มลา</span>
              <span className="font-bold text-stone-800">{leave.startDate}</span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block">ถึงวันที่</span>
              <span className="font-bold text-stone-800">{leave.endDate}</span>
            </div>
          </div>

          {/* Applicant & Duty Info */}
          <div className="border border-stone-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <User className="w-4 h-4 text-rose-800" />
              ข้อมูลผู้ยื่นลาและหน้าที่ปฏิบัติ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-stone-500 block">ยศ ชื่อ-นามสกุล (นามเรียกขาน)</span>
                <span className="font-bold text-stone-900">{leave.userRank} {leave.userName} {leave.userSurname} ({leave.userCallSign})</span>
              </div>
              <div>
                <span className="text-xs text-stone-500 block">ตำแหน่ง</span>
                <span className="font-medium text-stone-800">{leave.positionTitle}</span>
              </div>
              <div>
                <span className="text-xs text-stone-500 block">ผู้ลาปฏิบัติหน้าที่ (หน่วยงาน)</span>
                <span className="font-bold text-rose-900">{leave.dutyName || 'งานอำนวยการ'}</span>
              </div>
              <div>
                <span className="text-xs text-stone-500 block">เบอร์โทรศัพท์ติดต่อระหว่างลา</span>
                <span className="font-medium text-stone-800">{leave.contactPhone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-stone-500 block">สถานที่ติดต่อระหว่างลา</span>
                <span className="font-medium text-stone-800">{leave.contactAddress}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-stone-500 block">เหตุผลการลา</span>
                <span className="font-medium text-stone-800 bg-stone-100 p-2 rounded-lg block">{leave.reason || '-'}</span>
              </div>
            </div>
          </div>

          {/* Duty Manpower Status (Requirement 20 & 24) */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-rose-800" />
              การจัดกำลังพลปฏิบัติหน้าที่ ณ วันที่ลา
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center text-sm font-semibold">
              <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                <span className="text-xs text-stone-500 block">กำลังปฏิบัติหน้าที่</span>
                <span className="text-lg font-bold text-stone-800">{leave.dutyTotalOfficers} นาย</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                <span className="text-xs text-stone-500 block">ลา</span>
                <span className="text-lg font-bold text-rose-700">{leave.dutyLeavingOfficers} นาย</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                <span className="text-xs text-stone-500 block">เหลือกำลังปฏิบัติหน้าที่</span>
                <span className="text-lg font-bold text-emerald-700">{leave.dutyRemainingOfficers} นาย</span>
              </div>
            </div>
          </div>

          {/* Timeline (Requirement 51: แสดงว่าใบลาอยู่ที่ใคร ผ่านขั้นตอนไหนแล้ว) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-800" />
              เส้นทางและสถานะการอนุมัติ (Approval Timeline)
            </h3>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-rose-200">
              {leave.timeline?.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <span className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${
                    step.status === 'completed' ? 'bg-emerald-600' :
                    step.status === 'rejected' ? 'bg-red-600' :
                    step.status === 'cancelled' ? 'bg-stone-500' :
                    'bg-amber-500 animate-pulse'
                  }`}>
                    {step.status === 'completed' ? '✓' :
                     step.status === 'rejected' ? '✕' :
                     step.status === 'cancelled' ? '—' : '●'}
                  </span>
                  <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-stone-900">
                      <span>{step.title}</span>
                      <span className="text-[11px] text-stone-500 font-normal">{step.timestamp}</span>
                    </div>
                    <p className="text-stone-700 mt-0.5">{step.action}</p>
                    {step.actor && <p className="text-stone-500 text-[11px] mt-0.5">โดย: {step.actorRankName || step.actor}</p>}
                    {step.note && <p className="text-rose-900 bg-rose-50 p-1.5 rounded mt-1 font-medium">{step.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reject Input Box (Requirement 49) */}
          {rejectPrompt && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-red-600" />
                ระบุเหตุผลการไม่อนุมัติ (จำเป็นต้องกรอกตามระเบียบราชการ)
              </div>
              <textarea
                rows={2}
                required
                value={rejectReasonText}
                onChange={e => setRejectReasonText(e.target.value)}
                placeholder="เช่น กำลังพลในผลัดไม่เพียงพอ, ภารกิจเร่งด่วนตามคำสั่งผู้บังคับบัญชา..."
                className="w-full p-2.5 text-sm rounded-lg border border-red-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-white"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectPrompt(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-stone-600 hover:bg-stone-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-red-700 text-white hover:bg-red-800 shadow"
                >
                  ยืนยันไม่อนุมัติ
                </button>
              </div>
            </div>
          )}

          {/* Cancel Modal Prompt (Requirement 19 & 25) */}
          {cancelPrompt && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <Ban className="w-5 h-5 text-amber-600" />
                ยืนยันการยกเลิกคำขอลา (สถานะจะถูกเปลี่ยนเป็น 'cancelled' ในระบบ)
              </div>
              <textarea
                rows={2}
                value={cancelReasonText}
                onChange={e => setCancelReasonText(e.target.value)}
                placeholder="ระบุเหตุผลการยกเลิก เช่น ปฏิบัติภารกิจด่วน, สลับเวรกับเพื่อนข้าราชการตำรวจ..."
                className="w-full p-2.5 text-sm rounded-lg border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-600 bg-white"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelPrompt(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-stone-600 hover:bg-stone-200"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-stone-800 text-white hover:bg-black shadow"
                >
                  ยืนยันยกเลิกคำขอ
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
            <div className="flex items-center gap-2">
              {/* Requirement 19: ปุ่ม 'ยกเลิกคำขอลา' สำหรับเจ้าของคำขอหรือ Admin */}
              {canCancel && !cancelPrompt && (
                <button
                  type="button"
                  onClick={() => setCancelPrompt(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                >
                  <Ban className="w-4 h-4 text-stone-500" />
                  ยกเลิกคำขอลา
                </button>
              )}

              {canWithdraw && (
                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  ถอนคำขอ
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Print Official A4 Form */}
              <button
                type="button"
                onClick={() => onPrintA4(leave)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 shadow transition"
              >
                <Printer className="w-4 h-4" />
                พิมพ์ใบลาแบบ A4
              </button>

              {/* Approver Actions */}
              {canApprove && !rejectPrompt && (
                <>
                  <button
                    type="button"
                    onClick={() => setRejectPrompt(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-red-100 text-red-800 hover:bg-red-200 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    ไม่อนุมัติ
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shadow transition transform active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    อนุมัติคำขอลา
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
