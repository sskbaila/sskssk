import React from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveRequest } from '../types/leave';
import { Bell, X, Check, Clock, AlertCircle, Info, CheckCheck } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLeaveId: (leaveId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectLeaveId
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useLeave();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-sm sm:max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-rose-900/10 bg-linear-to-r from-rose-950 to-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">การแจ้งเตือน (Notifications)</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsAsRead}
              className="text-xs text-rose-200 hover:text-white underline decoration-dotted"
            >
              อ่านทั้งหมด
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body (Requirement 17: Clickable notifications) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-stone-400 text-sm">
              ไม่มีการแจ้งเตือนใหม่ในขณะนี้
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationAsRead(n.id);
                  if (n.leaveId) {
                    onSelectLeaveId(n.leaveId);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border text-xs transition cursor-pointer ${
                  n.read 
                    ? 'bg-stone-50 border-stone-200 opacity-75' 
                    : 'bg-rose-50/70 border-rose-200 shadow-xs ring-1 ring-rose-200'
                } hover:bg-rose-100/50`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-rose-950">
                    <span className={`w-2 h-2 rounded-full ${n.read ? 'bg-stone-300' : 'bg-amber-500 animate-pulse'}`}></span>
                    <span>{n.title}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono shrink-0">{n.timestamp}</span>
                </div>
                <p className="text-stone-700 mt-1 pl-4 leading-relaxed">{n.message}</p>
                {n.leaveId && (
                  <span className="mt-2 ml-4 inline-block font-bold text-rose-900 underline text-[11px]">
                    คลิกเพื่อดูรายละเอียดคำขอลา →
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
