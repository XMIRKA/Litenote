import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToasts, dismissToast, InAppToast } from '../../lib/notificationService';
import {
  Bell,
  MessageSquare,
  UserPlus,
  Heart,
  X,
  Phone,
  Video,
  Sparkles,
  ChevronRight
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
      case 'call':
        return <Phone className="w-4 h-4 text-emerald-400 animate-pulse" />;
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'reaction':
        return <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getTypeBadge = (type?: InAppToast['type']) => {
    switch (type) {
      case 'message':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/20';
      case 'call':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
      case 'friend_request':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/20';
      case 'reaction':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/20';
      case 'comment':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
      default:
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col gap-2.5 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -24, scale: 0.94, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, x: 60, filter: 'blur(4px)', transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="pointer-events-auto w-full p-3.5 rounded-2xl bg-[#0B1120]/95 border border-slate-700/60 hover:border-indigo-500/50 backdrop-blur-2xl shadow-2xl shadow-black/80 flex items-start gap-3 group transition-all cursor-pointer relative overflow-hidden ring-1 ring-white/5"
            onClick={() => {
              if (toast.onClick) toast.onClick();
              dismissToast(toast.id);
            }}
          >
            {/* Ambient subtle glow bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-sky-400 to-indigo-600 rounded-l-2xl opacity-80" />

            {/* Avatar with Type Badge overlay */}
            <div className="relative shrink-0">
              {toast.avatarUrl ? (
                <img
                  src={toast.avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700/80 shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/30 to-slate-800 border border-indigo-500/30 flex items-center justify-center shadow-md">
                  {getIcon(toast.type)}
                </div>
              )}
              {toast.avatarUrl && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center scale-90">
                  {getIcon(toast.type)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                <h4 className="font-semibold text-xs text-slate-100 truncate flex items-center gap-1.5">
                  <span className="truncate">{toast.title}</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(toast.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
                {toast.message}
              </p>

              {/* Optional Rich Thumbnail Image */}
              {toast.imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-slate-700/60 max-h-28 bg-black/40">
                  <img
                    src={toast.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/90 transition-colors shrink-0 cursor-pointer"
              title="Закрыть"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

