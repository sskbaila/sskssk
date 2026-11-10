import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { StationConfig } from '../types/leave';
import { X, Save, Phone, Building2, UserCheck, Calendar, ShieldCheck, Lock, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { stationConfig, updateStationConfig, currentUser } = useLeave();

  const [formData, setFormData] = useState<StationConfig>({ ...stationConfig });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Requirement 3: Only Admin and Superintendent can edit settings!
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'superintendent';

  // Requirement 4: Budget years up to 2580! (2565 - 2580)
  const fiscalYearOptions = Array.from({ length: 16 }, (_, i) => 2565 + i);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setErrorMsg('คุณไม่มีสิทธิ์แก้ไขการตั้งค่าระบบ (เฉพาะ Admin หรือ ผู้กำกับ เท่านั้น)');
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMsg('กรุณากรอกหมายเลขโทรศัพท์สถานีตำรวจ');
      return;
    }

    updateStationConfig(formData);
    setSuccessMsg('บันทึกการตั้งค่าสถานีตำรวจเรียบร้อยแล้ว');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  const toggleCloseFiscalYear = (year: number) => {
    if (!canEdit) return;
    const currentClosed = formData.closedFiscalYears || [];
    const updated = currentClosed.includes(year)
      ? currentClosed.filter(y => y !== year)
      : [...currentClosed, year];
    setFormData(prev => ({ ...prev, closedFiscalYears: updated }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rose-900/10 bg-linear-to-r from-rose-950 via-rose-900 to-rose-950 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ตั้งค่าระบบและสถานีตำรวจ</h2>
              <p className="text-xs text-rose-200">
                สภ.ศรีสงคราม ตำรวจภูธรจังหวัดนครพนม
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              {errorMsg}
            </div>
          )}

          {!canEdit && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>โหมดดูข้อมูล: คุณไม่มีสิทธิ์แก้ไขการตั้งค่า (เฉพาะผู้กำกับ หรือ Admin เท่านั้นที่แก้ไขได้)</span>
            </div>
          )}

          {/* Section 1: Station Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Building2 className="w-4 h-4 text-rose-800" />
              ข้อมูลสถานีตำรวจและหน่วยงาน
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ชื่อสถานีตำรวจ (ภาษาไทย)</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.stationName}
                  onChange={e => setFormData({ ...formData, stationName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Station Name (English)</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.stationNameEn}
                  onChange={e => setFormData({ ...formData, stationNameEn: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-medium"
                />
              </div>

              {/* Requirement 18: Phone number field in SettingsModal */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5 text-rose-900">
                  <Phone className="w-3.5 h-3.5" />
                  เบอร์โทรศัพท์สถานีตำรวจ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  required
                  placeholder="เช่น 042-571211"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-semibold text-rose-950 bg-rose-50/30"
                />
                <p className="text-[11px] text-stone-500 mt-1">ใช้สำหรับแสดงบนหัวและท้ายเอกสารใบลา</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">สังกัด กองบังคับการ</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.policeDivision}
                  onChange={e => setFormData({ ...formData, policeDivision: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">ที่ตั้งสถานีตำรวจ</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Command & Approver Roster (Requirement 3 & 27) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <UserCheck className="w-4 h-4 text-rose-800" />
              ผู้บังคับบัญชาและผู้มีอำนาจอนุมัติ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ยศ และชื่อ-สกุล ผู้กำกับการ (ผกก.)
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.superintendentRankName}
                  onChange={e => setFormData({ ...formData, superintendentRankName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ตำแหน่ง ผู้กำกับการ</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.superintendentPosition}
                  onChange={e => setFormData({ ...formData, superintendentPosition: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-medium"
                />
              </div>

              {/* Requirement 27: ผู้บังคับการตำรวจภูธรจังหวัดนครพนม (ผบก.ภ.จว.นครพนม) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ยศ และชื่อ-สกุล ผบก.ภ.จว.นครพนม (สำหรับใบลา ผกก. หรือลาอุปสมบท)
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.provincialCommanderRankName}
                  onChange={e => setFormData({ ...formData, provincialCommanderRankName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ตำแหน่ง ผู้บังคับการ</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.provincialCommanderPosition}
                  onChange={e => setFormData({ ...formData, provincialCommanderPosition: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Fiscal Year Management (Requirement 4 & 72) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Calendar className="w-4 h-4 text-rose-800" />
              การจัดการปีงบประมาณ (รองรับถึง 2580)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ปีงบประมาณปัจจุบัน</label>
                <select
                  disabled={!canEdit}
                  value={formData.currentFiscalYear}
                  onChange={e => setFormData({ ...formData, currentFiscalYear: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-bold bg-white"
                >
                  {fiscalYearOptions.map(year => (
                    <option key={year} value={year}>
                      ปีงบประมาณ {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">เลขลำดับคำขอลาเริ่มต้นถัดไป</label>
                <input
                  type="number"
                  disabled={!canEdit}
                  value={formData.autoNumberSequence}
                  onChange={e => setFormData({ ...formData, autoNumberSequence: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-transparent disabled:bg-stone-100 font-mono font-bold"
                />
              </div>
            </div>

            {/* Requirement 72: ปิดปีงบประมาณ ล็อกข้อมูลปีเก่า */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                สถานะปิดปีงบประมาณ (ปีที่ถูกล็อกจะไม่สามารถเพิ่มหรือแก้ไขข้อมูลใบลาได้):
              </label>
              <div className="flex flex-wrap gap-2">
                {fiscalYearOptions.slice(0, 10).map(year => {
                  const isClosed = formData.closedFiscalYears?.includes(year);
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => toggleCloseFiscalYear(year)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isClosed
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {isClosed ? <Lock className="w-3 h-3 text-red-600" /> : null}
                      ปี {year} {isClosed ? '(ปิดแล้ว)' : '(เปิด)'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-stone-600 hover:bg-stone-100 transition"
            >
              ปิดหน้าต่าง
            </button>
            {canEdit && (
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-rose-900 hover:bg-rose-950 text-white shadow transition transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                บันทึกการตั้งค่า
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
