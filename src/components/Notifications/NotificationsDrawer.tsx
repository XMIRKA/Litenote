import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { NotificationItem } from '../../types';
import {
  Bell,
  X,
  UserPlus,
  Heart,
  MessageSquare,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onSelectNotification?: (notif: NotificationItem) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectNotification,
}) => {
  const { accentColor, language } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  if (!isOpen) return null;

  const formatTime = (ts: number) => {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return language === 'ru' ? 'только что' : 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} ${language === 'ru' ? 'м назад' : 'm ago'}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${language === 'ru' ? 'ч назад' : 'h ago'}`;
    return new Date(ts).toLocaleDateString();
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        return <UserPlus className="w-4 h-4 text-indigo-400" />;
      case 'post_reaction':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md h-full bg-[#0C121E] border-l border-[#1E293B] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#090D16] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">
              {language === 'ru' ? 'Уведомления' : 'Notifications'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onMarkAllRead}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              {language === 'ru' ? 'Прочитать все' : 'Mark all read'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p>{language === 'ru' ? 'Новых уведомлений нет' : 'No new notifications'}</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (onSelectNotification) onSelectNotification(n);
                  onClose();
                }}
                className={`p-3 rounded-xl flex items-start gap-3 cursor-pointer transition-colors ${
                  !n.isRead && !(n as any).read
                    ? 'bg-indigo-600/10 border border-indigo-500/20'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 leading-snug">
                    <span className="font-semibold text-white mr-1">{n.fromUserName}</span>
                    {n.message}
                  </p>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {formatTime(n.createdAt)}
                  </span>
                </div>
                {!n.isRead && !(n as any).read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
