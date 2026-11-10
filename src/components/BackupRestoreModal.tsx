import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { Database, Download, Upload, RefreshCw, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { exportBackupJSON, importBackupJSON, resetToFactoryDefaults } = useLeave();

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_leave_ssk_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setMessage({ text: 'ดาวน์โหลดไฟล์สำรองข้อมูล (JSON) เรียบร้อยแล้ว', type: 'success' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupJSON(content);
      if (success) {
        setMessage({ text: 'กู้คืนฐานข้อมูลจากไฟล์สำรองสำเร็จแล้ว', type: 'success' });
      } else {
        setMessage({ text: 'รูปแบบไฟล์ไม่ถูกต้อง ไม่สามารถกู้คืนได้', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('คุณต้องการรีเซ็ตระบบกลับสู่ค่าเริ่มต้นจากโรงงาน (72 นาย) ใช่หรือไม่? ข้อมูลที่เพิ่มใหม่จะถูกคืนค่าเดิม')) {
      resetToFactoryDefaults();
      setMessage({ text: 'รีเซ็ตข้อมูลสู่ค่าเริ่มต้นสำเร็จแล้ว', type: 'success' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-rose-900/10 bg-linear-to-r from-rose-950 to-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-base font-bold">สำรองและกู้คืนข้อมูล (Backup & Restore)</h2>
              <p className="text-xs text-rose-200">
                ระบบจัดการฐานข้อมูล สภ.ศรีสงคราม
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {message && (
            <div className={`p-3.5 rounded-xl font-bold text-xs flex items-center gap-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Export Box */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-900">
              <Download className="w-4 h-4 text-rose-800" />
              <span>สำรองฐานข้อมูล (Backup Export)</span>
            </div>
            <p className="text-xs text-stone-500">
              ดาวน์โหลดไฟล์ .json บันทึกข้อมูลบุคลากร 72 นาย, ประวัติคำขอลาทั้งหมด, การตั้งค่าสถานี และบันทึก Audit Log
            </p>
            <button
              onClick={handleExport}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-bold text-xs shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดไฟล์สำรองข้อมูล JSON</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-900">
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>กู้คืนฐานข้อมูล (Restore Import)</span>
            </div>
            <p className="text-xs text-stone-500">
              อัปโหลดไฟล์สำรอง .json เพื่อกู้คืนข้อมูลกรณีข้อมูลสูญหายหรือย้ายระบบ
            </p>
            <label className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>เลือกไฟล์ .JSON เพื่อกู้คืน</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          {/* Factory Reset */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-900 text-xs">
              <RefreshCw className="w-4 h-4 text-red-700" />
              <span>รีเซ็ตข้อมูลสู่ค่าเริ่มต้น (Factory Reset)</span>
            </div>
            <p className="text-[11px] text-red-700">
              คืนค่าข้อมูลข้าราชการตำรวจ 72 นายและคำขอลาตัวอย่างตามระเบียบ สภ.ศรีสงคราม ดั้งเดิม
            </p>
            <button
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs"
            >
              รีเซ็ตค่าเริ่มต้น
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
