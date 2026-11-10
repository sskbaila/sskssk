import React, { useState, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';
import { OfficerUser, UserRole, DivisionType, SUB_DIVISIONS, DIVISION_NAMES } from '../types/leave';
import { 
  Users, UserPlus, Trash2, Key, Edit2, Shield, Eye, EyeOff, 
  Search, Lock, Unlock, Check, AlertCircle, Phone, MapPin, 
  CheckCircle2, Info, Sparkles, X, UserCheck
} from 'lucide-react';

export const ROLE_INFO: Record<UserRole, {
  label: string;
  shortLabel: string;
  badgeClass: string;
  selectClass: string;
  description: string;
  permissions: string[];
}> = {
  personnel: {
    label: '👮 บุคลากร (Personnel)',
    shortLabel: '👮 บุคลากร',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    selectClass: 'bg-stone-50 text-stone-800 border-stone-300 hover:bg-stone-100',
    description: 'ข้าราชการตำรวจทั่วไป สิทธิ์ยื่นใบลาออนไลน์ ตรวจสอบประวัติการลาของตนเอง และดูสถิติวันลาคงเหลือ',
    permissions: ['ยื่นใบลาทุกประเภท (พักผ่อน/กิจ/ป่วย/คลอด/อุปสมบท)', 'ดูประวัติและสถานะการลาของตนเอง', 'ตรวจสอบวันลาสะสมและโควตาประจำปี', 'ดาวน์โหลดและพิมพ์ใบลา A4 ตนเอง']
  },
  supervisor: {
    label: '👮 หัวหน้างาน (Supervisor)',
    shortLabel: '👮 หัวหน้างาน',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    selectClass: 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100',
    description: 'สารวัตร / รอง ผกก. สิทธิ์ตรวจสอบและให้ความเห็นชอบคำขอลาของข้าราชการตำรวจในสายงานตนเอง',
    permissions: ['ตรวจสอบคำขอลาของกำลังพลในสายงาน', 'บันทึกความเห็นชอบ/เสนอผู้บังคับบัญชา', 'ดูแผงการลาประจำเดือนของสายงาน']
  },
  checker: {
    label: '📋 ผู้ตรวจสอบ (Checker)',
    shortLabel: '📋 ผู้ตรวจสอบ',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    selectClass: 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100',
    description: 'ธุรการกำลังพล / ผู้ตรวจสอบ สิทธิ์ตรวจสอบสถิติวันลา วันหยุดราชการ และความถูกต้องของเอกสารก่อนเสนอผู้มีอำนาจอนุมัติ',
    permissions: ['ตรวจสอบสถิติวันลาสะสมและวันลาครั้งนี้', 'ตรวจนับวันทำการและตัดวันหยุดราชการ', 'ส่งต่อคำขอลาเสนอผู้อนุมัติ']
  },
  approver: {
    label: '✍️ ผู้อนุมัติ (Approver)',
    shortLabel: '✍️ ผู้อนุมัติ',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    selectClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100',
    description: 'ผู้มีอำนาจลงนามอนุมัติคำขอลา (พิจารณาอนุมัติ ไม่อนุมัติ หรือส่งกลับแก้ไข)',
    permissions: ['อนุมัติคำขอลาออนไลน์แบบเรียลไทม์', 'ไม่อนุมัติคำขอลาพร้อมระบุเหตุผล', 'ส่งกลับคำขอลาเพื่อให้แก้ไขข้อมูล', 'พิมพ์เอกสารใบลาพร้อมความเห็น']
  },
  admin: {
    label: '⚙️ Admin (ผู้ดูแลระบบ)',
    shortLabel: '⚙️ Admin',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    selectClass: 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100',
    description: 'ผู้ดูแลระบบ สภ.ศรีสงคราม จัดการข้อมูลบุคลากรทั้งหมด กำหนดและแก้ไขบทบาท/สิทธิ์ ดูรหัสผ่าน และตั้งค่าระบบ',
    permissions: ['แก้ไขบทบาทและสิทธิ์บุคลากรทุกนาย', 'เพิ่ม / ลบ / แก้ไขข้อมูลกำลังพล', 'ดูชื่อผู้ใช้ (Username) และรหัสผ่าน', 'รีเซ็ตรหัสผ่านและปลดล็อกบัญชี', 'จัดการตั้งค่าระบบและหน่วยงาน']
  },
  superintendent: {
    label: '⭐ ผู้กำกับ (Superintendent)',
    shortLabel: '⭐ ผู้กำกับ',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-400',
    selectClass: 'bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-100',
    description: 'ผู้กำกับการ สภ.ศรีสงคราม ผู้บังคับบัญชาสูงสุด อนุมัติการลา ดูภาพรวมสถานี และพิมพ์รายงานสรุปเสนอ ผบก.',
    permissions: ['อนุมัติคำขอลาของข้าราชการตำรวจทุกนาย', 'ดูรายงานสรุปกำลังปฏิบัติหน้าที่และกำลังลา', 'พิมพ์ทะเบียนคุมการลาและรายงานเสนอ ผบก.', 'ตั้งค่าข้อมูลสถานีและผู้บังคับการ']
  }
};

export const PersonnelManagement: React.FC = () => {
  const { 
    officers, 
    addOfficer, 
    updateOfficer, 
    deleteOfficer, 
    adminResetPassword,
    unlockAccount,
    currentUser 
  } = useLeave();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editOfficer, setEditOfficer] = useState<OfficerUser | null>(null);
  const [editFormData, setEditFormData] = useState<OfficerUser | null>(null);

  const [resetPassOfficer, setResetPassOfficer] = useState<OfficerUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Requirement 76: "ข้อมูลบุคลากรให้เห็นเฉพาะแอดมินเท่านั้น"
  const isAdmin = currentUser?.role === 'admin';
  const isSuperintendent = currentUser?.role === 'superintendent';

  // Add Officer Form State (Requirement 21: Support all divisions and sub-divisions)
  const [newOfficerForm, setNewOfficerForm] = useState({
    callSign: '',
    username: '',
    password: '',
    rank: 'ส.ต.ท.',
    firstName: '',
    lastName: '',
    role: 'personnel' as UserRole,
    division: 'patrol' as DivisionType,
    subDivision: 'สายตรวจรถยนต์',
    positionTitle: 'ผบ.หมู่(ป.)สภ.ศรีสงคราม',
    phone: '',
    address: 'สภ.ศรีสงคราม อ.ศรีสงคราม จ.นครพนม',
    accumulatedLeaveDays: 10,
    currentYearLeaveQuota: 10
  });

  // Filter officers
  const filteredOfficers = useMemo(() => {
    return officers.filter(off => {
      if (selectedDivision !== 'all' && off.division !== selectedDivision) return false;
      if (selectedRole !== 'all' && off.role !== selectedRole) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = `${off.rank} ${off.firstName} ${off.lastName}`.toLowerCase().includes(term);
        const matchCall = off.callSign.toLowerCase().includes(term);
        const matchUser = off.username.toLowerCase().includes(term);
        const matchPos = off.positionTitle.toLowerCase().includes(term);
        const matchSub = off.subDivision.toLowerCase().includes(term);
        if (!matchName && !matchCall && !matchUser && !matchPos && !matchSub) return false;
      }
      return true;
    });
  }, [officers, selectedDivision, selectedRole, searchTerm]);

  // Requirement 6: auto-generate username and password from callsign
  const handleCallSignChange = (val: string) => {
    const rawNum = val.replace(/\D/g, '');
    const autoUser = rawNum ? `SSK${rawNum}` : val.trim().replace(/\s+/g, '');
    setNewOfficerForm(prev => ({
      ...prev,
      callSign: val,
      username: prev.username || autoUser,
      password: prev.password || autoUser
    }));
  };

  const handleCreateOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerForm.callSign || !newOfficerForm.firstName || !newOfficerForm.lastName) {
      setFeedback({ text: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (นามเรียกขาน, ชื่อ, นามสกุล)', type: 'error' });
      return;
    }

    addOfficer({
      ...newOfficerForm,
      username: newOfficerForm.username || newOfficerForm.callSign,
      password: newOfficerForm.password || newOfficerForm.callSign
    });

    setFeedback({ 
      text: `เพิ่มบุคลากร ${newOfficerForm.rank} ${newOfficerForm.firstName} เรียบร้อยแล้ว (บทบาท: ${ROLE_INFO[newOfficerForm.role].shortLabel})`, 
      type: 'success' 
    });
    setShowAddModal(false);
    // Reset form
    setNewOfficerForm({
      callSign: '',
      username: '',
      password: '',
      rank: 'ส.ต.ท.',
      firstName: '',
      lastName: '',
      role: 'personnel',
      division: 'patrol',
      subDivision: 'สายตรวจรถยนต์',
      positionTitle: 'ผบ.หมู่(ป.)สภ.ศรีสงคราม',
      phone: '',
      address: 'สภ.ศรีสงคราม อ.ศรีสงคราม จ.นครพนม',
      accumulatedLeaveDays: 10,
      currentYearLeaveQuota: 10
    });
  };

  // Quick Role Change from Table
  const handleQuickRoleChange = (officer: OfficerUser, newRole: UserRole) => {
    if (officer.role === newRole) return;
    updateOfficer(officer.id, { role: newRole });
    setFeedback({
      text: `อัปเดตบทบาท/สิทธิ์ของ "${officer.rank} ${officer.firstName} ${officer.lastName} (${officer.callSign})" เป็น "${ROLE_INFO[newRole].shortLabel}" เรียบร้อยแล้ว`,
      type: 'success'
    });
  };

  // Open Edit Modal
  const handleOpenEditModal = (officer: OfficerUser) => {
    setEditOfficer(officer);
    setEditFormData({ ...officer });
  };

  // Save changes from Edit Modal
  const handleSaveEditOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !editOfficer) return;

    if (!editFormData.callSign || !editFormData.firstName || !editFormData.lastName) {
      setFeedback({ text: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน', type: 'error' });
      return;
    }

    updateOfficer(editOfficer.id, editFormData);
    setFeedback({
      text: `บันทึกการแก้ไขบทบาท/สิทธิ์และข้อมูลของ "${editFormData.rank} ${editFormData.firstName} ${editFormData.lastName}" เรียบร้อยแล้ว`,
      type: 'success'
    });
    setEditOfficer(null);
    setEditFormData(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลบุคลากร "${name}" ออกจากระบบ?`)) {
      deleteOfficer(id);
      setFeedback({ text: `ลบข้อมูลบุคลากรเรียบร้อยแล้ว`, type: 'success' });
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassOfficer || !newPasswordInput.trim()) return;
    adminResetPassword(resetPassOfficer.id, newPasswordInput.trim());
    setFeedback({ text: `รีเซ็ตรหัสผ่านของ ${resetPassOfficer.callSign} เรียบร้อยแล้ว`, type: 'success' });
    setResetPassOfficer(null);
    setNewPasswordInput('');
  };

  if (!isAdmin && !isSuperintendent) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl shadow-xs border border-stone-200">
        <Shield className="w-12 h-12 text-rose-800 mx-auto mb-3 opacity-60" />
        <h2 className="text-lg font-bold text-stone-800">จำกัดสิทธิ์การเข้าถึงข้อมูลบุคลากร</h2>
        <p className="text-sm text-stone-500 mt-1">
          ตามระเบียบรักษาความปลอดภัย สภ.ศรีสงคราม หน้าข้อมูลและบัญชีบุคลากรเปิดให้เฉพาะ Admin หรือ ผู้บังคับบัญชา เข้าถึงได้เท่านั้น
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-rose-950 via-rose-900 to-rose-950 rounded-2xl p-6 text-white shadow-lg border border-rose-800/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <Users className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">ระบบบริหารจัดการบุคลากรและกำหนดสิทธิ์</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono font-bold text-xs">
                {officers.length} นาย
              </span>
            </div>
            <p className="text-xs text-rose-200 mt-1">
              แก้ไขบทบาท/สิทธิ์ (6 ระดับ) เพิ่ม-ลบข้าราชการตำรวจ กำหนดสายงาน และดูแลรหัสผ่าน สภ.ศรีสงคราม
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Requirement 7: แอดมินสามารถดูชื่อผู้ใช้ และรหัสผ่านได้ */}
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition ${
              showPasswords 
                ? 'bg-amber-400 text-stone-900 shadow' 
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
            title="สลับการแสดงรหัสผ่านผู้ใช้งาน"
          >
            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPasswords ? 'ซ่อนรหัสผ่าน' : 'แสดงชื่อผู้ใช้และรหัสผ่าน'}</span>
          </button>

          {/* Requirement 2: เพิ่มบุคลากร */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 shadow transition transform active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มบุคลากรใหม่</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center justify-between gap-2 shadow-xs transition ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Role Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {(Object.keys(ROLE_INFO) as UserRole[]).map((rKey) => {
          const count = officers.filter(o => o.role === rKey).length;
          const isSelected = selectedRole === rKey;
          return (
            <button
              key={rKey}
              onClick={() => setSelectedRole(selectedRole === rKey ? 'all' : rKey)}
              className={`p-2.5 rounded-xl border text-left transition ${
                isSelected 
                  ? 'bg-rose-900 text-white border-rose-950 shadow-md ring-2 ring-rose-800' 
                  : 'bg-white text-stone-800 border-stone-200 hover:border-rose-300 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold truncate">{ROLE_INFO[rKey].shortLabel}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-700'
                }`}>
                  {count}
                </span>
              </div>
              <p className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-rose-200' : 'text-stone-500'}`}>
                {ROLE_INFO[rKey].description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, ยศ, นามเรียกขาน, username, ตำแหน่ง หรือสายงาน..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
          >
            <option value="all">ทุกบทบาท/สิทธิ์ ({officers.length})</option>
            {(Object.keys(ROLE_INFO) as UserRole[]).map(rKey => (
              <option key={rKey} value={rKey}>
                {ROLE_INFO[rKey].shortLabel} ({officers.filter(o => o.role === rKey).length})
              </option>
            ))}
          </select>

          {/* Division Filter */}
          <select
            value={selectedDivision}
            onChange={e => setSelectedDivision(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
          >
            <option value="all">ทุกสายงาน ({officers.length})</option>
            {Object.entries(DIVISION_NAMES).map(([key, name]) => (
              <option key={key} value={key}>
                {name} ({officers.filter(o => o.division === key).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Officers Table */}
      <div className="bg-white rounded-xl shadow-xs border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-3 text-center">ลำดับ</th>
                <th className="py-3.5 px-3">นามเรียกขาน</th>
                <th className="py-3.5 px-4">ยศ ชื่อ-นามสกุล</th>
                <th className="py-3.5 px-4">สายงาน & สายงานย่อย</th>
                <th className="py-3.5 px-3">บทบาท/สิทธิ์ (คลิกแก้ไขได้ทันที)</th>
                {showPasswords && (
                  <>
                    <th className="py-3.5 px-3 font-mono bg-amber-50/50">Username</th>
                    <th className="py-3.5 px-3 font-mono bg-amber-50/50">Password</th>
                  </>
                )}
                <th className="py-3.5 px-3 text-center">วันลาสะสม+ปีนี้</th>
                <th className="py-3.5 px-3 text-center">สถานะบัญชี</th>
                <th className="py-3.5 px-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOfficers.length === 0 ? (
                <tr>
                  <td colSpan={showPasswords ? 9 : 7} className="py-12 text-center text-stone-400 font-medium">
                    ไม่พบข้อมูลบุคลากรตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredOfficers.map((officer, idx) => {
                  return (
                    <tr key={officer.id} className="hover:bg-rose-50/30 transition">
                      <td className="py-3 px-3 text-center font-mono text-stone-500">
                        {officer.orderNumber || idx + 1}
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-950 font-mono">
                        {officer.callSign}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">
                          {officer.rank} {officer.firstName} {officer.lastName}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {officer.positionTitle}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-stone-800">
                          {DIVISION_NAMES[officer.division]}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {officer.subDivision}
                        </div>
                      </td>

                      {/* Requirement: Edit Role / Permissions directly */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={officer.role}
                            onChange={(e) => handleQuickRoleChange(officer, e.target.value as UserRole)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-rose-800 ${
                              ROLE_INFO[officer.role]?.selectClass || 'bg-stone-50 text-stone-800 border-stone-300'
                            }`}
                            title="คลิกเพื่อเปลี่ยนบทบาท/สิทธิ์ได้ทันที"
                          >
                            <option value="personnel">👮 บุคลากร</option>
                            <option value="supervisor">👮 หัวหน้างาน</option>
                            <option value="checker">📋 ผู้ตรวจสอบ</option>
                            <option value="approver">✍️ ผู้อนุมัติ</option>
                            <option value="admin">⚙️ Admin</option>
                            <option value="superintendent">⭐ ผู้กำกับ</option>
                          </select>

                          <button
                            onClick={() => handleOpenEditModal(officer)}
                            className="p-1 rounded-md text-stone-400 hover:text-rose-900 hover:bg-rose-100 transition"
                            title="คลิกเพื่อแก้ไขบทบาทและข้อมูลอย่างละเอียด"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Requirement 7: แอดมินดูชื่อผู้ใช้และรหัสผ่านได้ */}
                      {showPasswords && (
                        <>
                          <td className="py-3 px-3 font-mono font-bold text-rose-900 bg-amber-50/30 text-xs">
                            {officer.username}
                          </td>
                          <td className="py-3 px-3 font-mono text-stone-800 bg-amber-50/30 text-xs">
                            {officer.password}
                          </td>
                        </>
                      )}

                      <td className="py-3 px-3 text-center text-xs font-semibold">
                        <span className="text-stone-700">{officer.accumulatedLeaveDays}</span>
                        <span className="text-stone-400"> + </span>
                        <span className="text-stone-700">{officer.currentYearLeaveQuota}</span>
                        <span className="text-xs text-rose-950 font-bold block">
                          = {officer.accumulatedLeaveDays + officer.currentYearLeaveQuota} วัน
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {officer.isLocked ? (
                          <button
                            onClick={() => unlockAccount(officer.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 hover:bg-red-200 transition"
                            title="กดเพื่อปลดล็อกบัญชี"
                          >
                            <Lock className="w-3 h-3 text-red-600" />
                            ถูกระงับ
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            ปกติ
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit officer and permissions button */}
                          <button
                            onClick={() => handleOpenEditModal(officer)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-900 transition"
                            title="แก้ไขบทบาท/สิทธิ์ และข้อมูลบุคลากร"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-rose-800" />
                          </button>

                          {/* Reset password button (Requirement 31) */}
                          <button
                            onClick={() => {
                              setResetPassOfficer(officer);
                              setNewPasswordInput(officer.username || officer.callSign.replace(/\s+/g, ''));
                            }}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                            title="รีเซ็ตรหัสผ่าน"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-600" />
                          </button>

                          {/* Delete officer button (Requirement 2) */}
                          <button
                            onClick={() => handleDelete(officer.id, `${officer.rank} ${officer.firstName} ${officer.lastName}`)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-600 transition"
                            title="ลบบุคลากร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit Officer & Roles / Permissions */}
      {editOfficer && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 p-5 bg-linear-to-r from-rose-950 to-rose-900 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <UserCheck className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    แก้ไขบทบาท/สิทธิ์ และข้อมูลบุคลากร
                  </h2>
                  <p className="text-xs text-rose-200">
                    {editOfficer.rank} {editOfficer.firstName} {editOfficer.lastName} ({editOfficer.callSign})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setEditOfficer(null); setEditFormData(null); }} 
                className="text-rose-200 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEditOfficer} className="p-6 space-y-6 text-xs sm:text-sm">
              {/* Section 1: Role & Permissions Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <label className="text-sm font-bold text-rose-950 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-800" />
                    กำหนดบทบาทและสิทธิ์การเข้าใช้งานระบบ (User Role & Permissions)
                  </label>
                  <span className="text-xs font-semibold text-stone-500">
                    เลือก 1 บทบาท
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(ROLE_INFO) as UserRole[]).map((rKey) => {
                    const info = ROLE_INFO[rKey];
                    const isSelected = editFormData.role === rKey;
                    return (
                      <div
                        key={rKey}
                        onClick={() => setEditFormData({ ...editFormData, role: rKey })}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-rose-900 bg-rose-50/50 shadow-sm ring-1 ring-rose-900'
                            : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="font-bold text-stone-900 text-xs sm:text-sm">
                              {info.shortLabel}
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-900 text-white text-[10px] font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> สิทธิ์ปัจจุบัน
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
                            {info.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-stone-200/70">
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                            ขอบเขตสิทธิ์:
                          </span>
                          <ul className="space-y-0.5 text-[10px] text-stone-700">
                            {info.permissions.slice(0, 2).map((perm, pIdx) => (
                              <li key={pIdx} className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-rose-800 shrink-0"></span>
                                <span className="truncate">{perm}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Officer Identity Info */}
              <div className="space-y-3 pt-2">
                <div className="border-b pb-2">
                  <label className="text-sm font-bold text-rose-950 flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-800" />
                    ข้อมูลข้าราชการตำรวจและนามเรียกขาน
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      นามเรียกขาน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.callSign}
                      onChange={e => setEditFormData({ ...editFormData, callSign: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      ชื่อผู้ใช้ (Username)
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.username}
                      onChange={e => setEditFormData({ ...editFormData, username: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">ยศ</label>
                    <select
                      value={editFormData.rank}
                      onChange={e => setEditFormData({ ...editFormData, rank: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold bg-white"
                    >
                      <option value="พ.ต.อ.">พ.ต.อ.</option>
                      <option value="พ.ต.ท.">พ.ต.ท.</option>
                      <option value="พ.ต.ต.">พ.ต.ต.</option>
                      <option value="ร.ต.อ.">ร.ต.อ.</option>
                      <option value="ร.ต.ท.">ร.ต.ท.</option>
                      <option value="ร.ต.ต.">ร.ต.ต.</option>
                      <option value="ด.ต.">ด.ต.</option>
                      <option value="จ.ส.ต.">จ.ส.ต.</option>
                      <option value="ส.ต.อ.">ส.ต.อ.</option>
                      <option value="ส.ต.ท.">ส.ต.ท.</option>
                      <option value="ส.ต.ต.">ส.ต.ต.</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      ชื่อ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.firstName}
                      onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.lastName}
                      onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Division & Position */}
              <div className="space-y-3 pt-2">
                <div className="border-b pb-2">
                  <label className="text-sm font-bold text-rose-950 flex items-center gap-2">
                    <Building2Icon />
                    สายงานและตำแหน่งราชการ
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">สายงานหลัก</label>
                    <select
                      value={editFormData.division}
                      onChange={e => {
                        const div = e.target.value as DivisionType;
                        setEditFormData({
                          ...editFormData,
                          division: div,
                          subDivision: SUB_DIVISIONS[div]?.[0] || ''
                        });
                      }}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 bg-white font-bold"
                    >
                      {Object.entries(DIVISION_NAMES).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">สายงานย่อย</label>
                    <select
                      value={editFormData.subDivision}
                      onChange={e => setEditFormData({ ...editFormData, subDivision: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 bg-white"
                    >
                      {SUB_DIVISIONS[editFormData.division]?.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">ตำแหน่งตามระบบราชการ</label>
                    <input
                      type="text"
                      value={editFormData.positionTitle}
                      onChange={e => setEditFormData({ ...editFormData, positionTitle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Leave Balances & Contact */}
              <div className="space-y-3 pt-2">
                <div className="border-b pb-2">
                  <label className="text-sm font-bold text-rose-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-800" />
                    โควตาวันลาสะสม และข้อมูลการติดต่อ
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">วันลาพักผ่อนสะสม (วัน)</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={editFormData.accumulatedLeaveDays}
                      onChange={e => setEditFormData({ ...editFormData, accumulatedLeaveDays: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">สิทธิลาพักผ่อนประจำปีนี้ (วัน)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={editFormData.currentYearLeaveQuota}
                      onChange={e => setEditFormData({ ...editFormData, currentYearLeaveQuota: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                    <input
                      type="text"
                      value={editFormData.phone || ''}
                      placeholder="เช่น 081-2345678"
                      onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">สถานะบัญชีผู้ใช้งาน</label>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="isLockedStatus"
                          checked={!editFormData.isLocked}
                          onChange={() => setEditFormData({ ...editFormData, isLocked: false, failedLoginAttempts: 0 })}
                          className="text-rose-900 focus:ring-rose-800"
                        />
                        <span className="text-emerald-700 font-bold">ปกติ (เปิดใช้งาน)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="isLockedStatus"
                          checked={!!editFormData.isLocked}
                          onChange={() => setEditFormData({ ...editFormData, isLocked: true })}
                          className="text-rose-900 focus:ring-rose-800"
                        />
                        <span className="text-red-700 font-bold">ระงับการใช้งานชั่วคราว</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">ที่อยู่ติดต่อ</label>
                  <input
                    type="text"
                    value={editFormData.address || ''}
                    onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => { setEditOfficer(null); setEditFormData(null); }}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-bold shadow-md transition transform active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  บันทึกการแก้ไขบทบาทและข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Officer (Requirement 2 & 21) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 p-5 bg-linear-to-r from-rose-950 to-rose-900 text-white rounded-t-2xl">
              <h2 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                เพิ่มข้อมูลข้าราชการตำรวจใหม่
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-rose-200 hover:text-white text-xl font-bold leading-none">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateOfficer} className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    นามเรียกขาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ศรีสงคราม 506"
                    value={newOfficerForm.callSign}
                    onChange={e => handleCallSignChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Username แรกเข้า (Requirement 6)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น SSK506"
                    value={newOfficerForm.username}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    รหัสผ่านเริ่มต้น (Requirement 6)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น SSK506"
                    value={newOfficerForm.password}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">ยศ</label>
                  <select
                    value={newOfficerForm.rank}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, rank: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold bg-white"
                  >
                    <option value="พ.ต.อ.">พ.ต.อ.</option>
                    <option value="พ.ต.ท.">พ.ต.ท.</option>
                    <option value="พ.ต.ต.">พ.ต.ต.</option>
                    <option value="ร.ต.อ.">ร.ต.อ.</option>
                    <option value="ร.ต.ท.">ร.ต.ท.</option>
                    <option value="ร.ต.ต.">ร.ต.ต.</option>
                    <option value="ด.ต.">ด.ต.</option>
                    <option value="จ.ส.ต.">จ.ส.ต.</option>
                    <option value="ส.ต.อ.">ส.ต.อ.</option>
                    <option value="ส.ต.ท.">ส.ต.ท.</option>
                    <option value="ส.ต.ต.">ส.ต.ต.</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    ชื่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficerForm.firstName}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficerForm.lastName}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold"
                  />
                </div>
              </div>

              {/* Requirement 21: สายงานและสายงานย่อยทั้งหมด */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">สายงานหลัก</label>
                  <select
                    value={newOfficerForm.division}
                    onChange={e => {
                      const div = e.target.value as DivisionType;
                      setNewOfficerForm({
                        ...newOfficerForm,
                        division: div,
                        subDivision: SUB_DIVISIONS[div]?.[0] || ''
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 bg-white font-bold"
                  >
                    {Object.entries(DIVISION_NAMES).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">สายงานย่อย</label>
                  <select
                    value={newOfficerForm.subDivision}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, subDivision: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 bg-white"
                  >
                    {SUB_DIVISIONS[newOfficerForm.division]?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Requirement 32: 6 ระดับสิทธิ์ */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">บทบาท/สิทธิ์การใช้งาน</label>
                  <select
                    value={newOfficerForm.role}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, role: e.target.value as UserRole })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 bg-white font-bold text-rose-950"
                  >
                    <option value="personnel">👮 บุคลากร (ยื่นลา, ดูประวัติ, ดูวันลาคงเหลือ)</option>
                    <option value="supervisor">👮 หัวหน้างาน (ตรวจสอบการลา)</option>
                    <option value="checker">📋 ผู้ตรวจสอบ (ตรวจสถิติและเอกสาร)</option>
                    <option value="approver">✍️ ผู้อนุมัติ (อนุมัติ / ไม่อนุมัติ)</option>
                    <option value="admin">⚙️ Admin (จัดการระบบ & บุคลากร)</option>
                    <option value="superintendent">⭐ ผู้กำกับ (ดูภาพรวม อนุมัติ และพิมพ์รายงาน)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">ตำแหน่งตามระบบราชการ</label>
                  <input
                    type="text"
                    value={newOfficerForm.positionTitle}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, positionTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    placeholder="เช่น 081-2345678"
                    value={newOfficerForm.phone}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">วันลาพักผ่อนสะสม (วัน)</label>
                  <input
                    type="number"
                    value={newOfficerForm.accumulatedLeaveDays}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, accumulatedLeaveDays: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">สิทธิลาพักผ่อนประจำปีนี้ (วัน)</label>
                  <input
                    type="number"
                    value={newOfficerForm.currentYearLeaveQuota}
                    onChange={e => setNewOfficerForm({ ...newOfficerForm, currentYearLeaveQuota: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-800 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-bold shadow"
                >
                  บันทึกข้อมูลบุคลากร
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admin Reset Password (Requirement 31) */}
      {resetPassOfficer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900">รีเซ็ตรหัสผ่าน (Admin Reset)</h3>
                <p className="text-xs text-stone-500">
                  {resetPassOfficer.rank} {resetPassOfficer.firstName} {resetPassOfficer.lastName} ({resetPassOfficer.callSign})
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  กำหนดรหัสผ่านใหม่
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-rose-800"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  คำแนะนำ: สามารถใช้รหัสนามเรียกขาน เช่น {resetPassOfficer.username} เป็นรหัสผ่านเริ่มต้นได้
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassOfficer(null)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-900 hover:bg-rose-950 text-white shadow"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function Building2Icon() {
  return (
    <svg className="w-4 h-4 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
