import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { NotificationItem } from '../../types';
import { getCleanAvatarUrl } from '../../lib/avatar';
import {
  Bell,
  X,
  UserPlus,
  Heart,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Trash2,
  CheckCheck,
  Check
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onDeleteNotification?: (notifId: string) => void;
  onClearReadNotifications?: () => void;
  onClearAllNotifications?: () => void;
  onSelectNotification?: (notif: NotificationItem) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onDeleteNotification,
  onClearReadNotifications,
  onClearAllNotifications,
  onSelectNotification,
}) => {
  const { accentColor, language } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];
  const [justMarkedRead, setJustMarkedRead] = useState(false);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead && !(n as any).read).length;
  const readCount = notifications.length - unreadCount;

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
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'post_reaction':
      case 'reaction':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      case 'message':
      case 'new_message':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  const handleMarkAll = () => {
    onMarkAllRead();
    setJustMarkedRead(true);
    setTimeout(() => setJustMarkedRead(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md h-full bg-[#0C121E] border-l border-[#1E293B] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#090D16] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                {language === 'ru' ? 'Уведомления' : 'Notifications'}
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    +{unreadCount}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'ru'
                  ? `Всего: ${notifications.length}`
                  : `Total: ${notifications.length}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 bg-[#0B0F19] border-b border-[#1E293B] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {language === 'ru' ? 'Прочитать все' : 'Mark all read'}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" />
                  {language === 'ru' ? 'Все прочитано' : 'All caught up'}
                </span>
              )}
            </div>

            {/* Clear read / Clear all notifications */}
            <div className="flex items-center gap-2">
              {readCount > 0 && onClearReadNotifications && (
                <button
                  onClick={onClearReadNotifications}
                  title={language === 'ru' ? 'Удалить все прочитанные' : 'Delete read notifications'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 hover:border-rose-500/40 text-xs font-semibold border border-slate-700 transition-all cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400" />
                  {language === 'ru' ? 'Очистить прочитанные' : 'Clear read'}
                </button>
              )}

              {onClearAllNotifications && (
                <button
                  onClick={onClearAllNotifications}
                  title={language === 'ru' ? 'Удалить все уведомления' : 'Clear all notifications'}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <CheckCircle2 className="w-6 h-6 text-emerald-500/80" />
              </div>
              <p className="font-medium text-slate-400">
                {language === 'ru' ? 'Список уведомлений пуст' : 'No notifications'}
              </p>
              <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
                {language === 'ru'
                  ? 'Здесь будут отображаться новые сообщения, реакции и запросы в друзья'
                  : 'New messages, reactions and connection requests will appear here'}
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.isRead && !(n as any).read;
              const senderName = n.actorName || n.fromUserName || (language === 'ru' ? 'Пользователь' : 'User');
              const avatar = n.actorAvatar || n.fromUserAvatar;

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (onSelectNotification) onSelectNotification(n);
                    onClose();
                  }}
                  className={`p-3 rounded-xl flex items-start gap-3 cursor-pointer transition-all group relative ${
                    isUnread
                      ? 'bg-indigo-600/10 border border-indigo-500/30 shadow-xs'
                      : 'hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  {/* Icon / Avatar */}
                  <div className="relative shrink-0">
                    {avatar ? (
                      <img
                        src={getCleanAvatarUrl(senderName, avatar)}
                        alt={senderName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                        {getIcon(n.type)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#0C121E]">
                      <div className="p-0.5 rounded-full bg-slate-800 border border-slate-700">
                        {getIcon(n.type)}
                      </div>
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    {n.title && (
                      <p className="font-semibold text-xs text-white truncate mb-0.5">
                        {n.title}
                      </p>
                    )}
                    <p className="text-xs text-slate-300 leading-snug">
                      {!n.title && <span className="font-semibold text-white mr-1">{senderName}</span>}
                      {n.message}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>

                  {/* Actions (Delete single notification & Unread indicator) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    )}

                    {onDeleteNotification && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(n.id);
                        }}
                        title={language === 'ru' ? 'Удалить уведомление' : 'Delete notification'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

