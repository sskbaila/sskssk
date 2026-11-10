import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { Shield, Lock, User, Key, AlertCircle, CheckCircle2, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { OfficerUser } from '../types/leave';

interface LoginViewProps {
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, officers, updatePassword } = useLeave();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [firstTimeModalUser, setFirstTimeModalUser] = useState<OfficerUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    const res = login(username, password);
    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    // Check if first-time password change is needed
    if (res.requiresPasswordChange) {
      const off = officers.find(o => o.username.toLowerCase() === username.trim().toLowerCase() || o.callSign.toLowerCase() === username.trim().toLowerCase());
      if (off) {
        setFirstTimeModalUser(off);
        return;
      }
    }

    onSuccess();
  };

  const handleSkipOrSavePassword = (shouldChange: boolean) => {
    if (shouldChange && firstTimeModalUser && newPassword.trim()) {
      updatePassword(firstTimeModalUser.id, newPassword.trim());
    }
    setFirstTimeModalUser(null);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Maroon Header Banner with Logo (Requirement 8 & 9) */}
        <div className="bg-linear-to-b from-rose-950 via-rose-900 to-rose-950 p-8 text-center text-white relative">
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="ตรา สภ.ศรีสงคราม"
              className="w-24 h-24 object-contain drop-shadow-xl"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ระบบลาออนไลน์ สภ.ศรีสงคราม</h1>
          <p className="text-xs text-amber-300 font-semibold mt-1">
            สถานีตำรวจภูธรศรีสงคราม ตำรวจภูธรจังหวัดนครพนม
          </p>
          <div className="mt-2 inline-block px-3 py-1 rounded-full bg-white/10 text-[11px] text-rose-200">
            เข้าสู่ระบบด้วยนามเรียกขาน (เช่น SSK503)
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              ชื่อผู้ใช้ / นามเรียกขาน (Username / Call Sign)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                placeholder="เช่น SSK503 หรือ ศรีสงคราม 503"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 focus:border-transparent text-sm font-semibold text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
              <span>รหัสผ่าน (Password)</span>
              <span className="text-[10px] text-stone-400">เริ่มต้น: รหัสนามเรียกขาน</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="รหัสผ่านของคุณ"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 focus:border-transparent text-sm font-semibold text-stone-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-bold text-sm shadow-md transition transform active:scale-98 flex items-center justify-center gap-2"
          >
            <span>เข้าสู่ระบบ</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Requirement 30: บังคับเปลี่ยนรหัสผ่านครั้งแรก เข้าระบบครั้งแรกต้องเปลี่ยนรหัสผ่านหรือไม่เปลี่ยนก็ได้ */}
      {firstTimeModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-950">การเข้าสู่ระบบครั้งแรก</h3>
                <p className="text-xs text-stone-500">
                  {firstTimeModalUser.rank} {firstTimeModalUser.firstName} ({firstTimeModalUser.callSign})
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600">
              ตามระเบียบรักษาความปลอดภัย ท่านสามารถตั้งรหัสผ่านใหม่เพื่อความปลอดภัย หรือเลือกใช้รหัสเดิมต่อไปได้
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                กำหนดรหัสผ่านใหม่ (หากต้องการเปลี่ยน)
              </label>
              <input
                type="text"
                placeholder="ระบุรหัสผ่านใหม่..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-rose-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSkipOrSavePassword(false)}
                className="px-3 py-2 text-xs font-bold rounded-xl text-stone-600 hover:bg-stone-100"
              >
                ไม่เปลี่ยน (ใช้รหัสเดิม)
              </button>
              <button
                type="button"
                onClick={() => handleSkipOrSavePassword(true)}
                disabled={!newPassword.trim()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-900 text-white hover:bg-rose-950 shadow disabled:opacity-50"
              >
                บันทึกรหัสผ่านใหม่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
