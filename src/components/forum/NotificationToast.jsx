import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { CUSTOM_EVENT_NAME } from '../../services/notificationService';

export default function NotificationToast() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const n = { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...e.detail };
      setList((prev) => [...prev, n]);
      setTimeout(() => setList((prev) => prev.filter((x) => x.id !== n.id)), 3500);
    };
    window.addEventListener(CUSTOM_EVENT_NAME, handler);
    return () => window.removeEventListener(CUSTOM_EVENT_NAME, handler);
  }, []);

  const handleClick = (item) => {
    setList((prev) => prev.filter((x) => x.id !== item.id));
    window.location.href = item.url;
  };

  if (list.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[min(92vw,360px)] pointer-events-none">
      {list.map((item) => (
        <div
          key={item.id}
          onClick={() => handleClick(item)}
          className="pointer-events-auto cursor-pointer rounded-xl bg-gradient-to-br from-aif-primary via-aif-primary-600 to-aif-primary-700 text-white shadow-lg p-4 pr-10 relative animate-toastIn"
        >
          <div className="flex items-start gap-3">
            <div className="bg-white/15 rounded-full p-2">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{item.title}</div>
              <div className="text-xs text-white/85 mt-0.5 line-clamp-2">{item.body}</div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setList((prev) => prev.filter((x) => x.id !== item.id));
            }}
            className="absolute top-2 right-2 p-1 rounded hover:bg-white/15 transition-colors"
            aria-label="关闭通知"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
