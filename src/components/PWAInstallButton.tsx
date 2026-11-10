import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-900 shadow-sm transition-all transform active:scale-95"
          title="ติดตั้งเป็นแอปลงบนอุปกรณ์ (PWA)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>ติดตั้ง PWA</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-500/30 transition-all"
          title="ติดตั้งบน iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>ติดตั้ง iOS</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-600" />
                ติดตั้งบน iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-900 font-bold text-xs shrink-0">1</span>
                <p>กดปุ่ม <strong>แชร์ (Share)</strong> ที่แถบเมนูด้านล่างหรือบนของ Safari</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-900 font-bold text-xs shrink-0">2</span>
                <p>เลื่อนลงมาแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong></p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-900 font-bold text-xs shrink-0">3</span>
                <p>กด <strong>"เพิ่ม" (Add)</strong> เพื่อเปิดใช้งานแบบแอปเต็มหน้าจอแม้ขณะไม่มีเน็ต</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-rose-900 text-white font-bold text-sm hover:bg-rose-950 transition shadow"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  );
};
