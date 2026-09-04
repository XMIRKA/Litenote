import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToasts, dismissToast, InAppToast } from '../../lib/notificationService';
import {
  Bell,
  MessageSquare,
  UserPlus,
  Heart,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const NotificationToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<InAppToast[]>([]);

  useEffect(() => {
    const unsub = subscribeToasts((list) => {
      setToasts(list);
    });
    return unsub;
  }, []);

  const getIcon = (type?: InAppToast['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'reaction':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col gap-2.5 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, x: 50, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto w-full p-3.5 rounded-2xl bg-[#090F1C]/95 border border-indigo-500/30 backdrop-blur-xl shadow-2xl shadow-black/80 flex items-start gap-3 group hover:border-indigo-400/60 transition-all cursor-pointer"
            onClick={() => {
              if (toast.onClick) toast.onClick();
              dismissToast(toast.id);
            }}
          >
            {/* Avatar or Icon */}
            {toast.avatarUrl ? (
              <img
                src={toast.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-700 shadow"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                {getIcon(toast.type)}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-sans font-bold text-xs text-white truncate">
                  {toast.title}
                </h4>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(toast.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 leading-relaxed font-sans">
                {toast.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
