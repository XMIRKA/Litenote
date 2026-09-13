import React, { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';
import { THEME_CONFIGS } from '../lib/theme';
import { ActiveTab } from '../types';
import { CreatorBadge, VerifiedCheck } from './Common/CreatorBadge';
import { isCreatorAccount } from '../lib/creator';
import { getCleanAvatarUrl } from '../lib/avatar';
import {
  Home,
  MessageSquare,
  Users,
  Sparkles,
  Bookmark,
  User,
  Settings,
  Plus,
  Crown,
  Zap,
} from 'lucide-react';

interface SidebarNavProps {
  unreadMessagesCount: number;
  pendingFriendRequestsCount: number;
  selectedConvId?: string | null;
  onOpenDevTools?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  unreadMessagesCount,
  pendingFriendRequestsCount,
  selectedConvId,
  onOpenDevTools,
}) => {
  const {
    user,
    activeTab,
    setActiveTab,
    accentColor,
    language,
    setSelectedUserId,
    setOpenCreatePost,
    updateProfileData
  } = useAuth();

  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];
  const isCreator = isCreatorAccount(user);

  const navItems: { id: ActiveTab; labelEn: string; labelRu: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; badge?: number }[] = [
    { id: 'feed', labelEn: 'Coder Feed', labelRu: 'Лента кодеров', icon: Home },
    { id: 'messenger', labelEn: 'Messenger', labelRu: 'Мессенджер', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'people', labelEn: 'Developers', labelRu: 'Разработчики', icon: Users, badge: pendingFriendRequestsCount },
    { id: 'terminal_ai', labelEn: 'Litenote AI', labelRu: 'Litenote AI', icon: Sparkles },
    { id: 'bookmarks', labelEn: 'Saved Snippets', labelRu: 'Сниппеты & Закладки', icon: Bookmark },
    { id: 'profile', labelEn: 'My Profile', labelRu: 'Мой профиль', icon: User },
    { id: 'settings', labelEn: 'Settings', labelRu: 'Настройки', icon: Settings },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    if (tabId === 'profile') {
      setSelectedUserId(null); // view own profile
    }
    setActiveTab(tabId);
  };

  return (
    <>
      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-[#080D18] border-r border-[#142337] flex-col justify-between p-3.5 shrink-0 select-none">
        <div className="space-y-4">
          {/* New Post & Quick DevTools Capsule Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setOpenCreatePost(true)}
              style={{
                backgroundColor: theme.hex,
                boxShadow: `0 0 20px rgba(${theme.rgb}, 0.4)`,
              }}
              className="w-full py-2.5 px-4 rounded-full font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 hover:brightness-110 text-[#041912] active:scale-[0.97] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'ru' ? '+ Создать пост' : '+ New Post'}</span>
            </button>

            {onOpenDevTools && (
              <button
                onClick={onOpenDevTools}
                style={{
                  borderColor: `${theme.hex}50`,
                }}
                className="w-full py-2 px-4 rounded-full font-mono text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-[#06121E] hover:bg-[#0B1C2E] text-slate-200 border hover:border-slate-400 active:scale-[0.97] cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 animate-pulse" style={{ color: theme.hex }} />
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span>DevHub & AI</span>
              </button>
            )}
          </div>

          {/* Navigation Pill List */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const label = language === 'ru' ? item.labelRu : item.labelEn;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  style={
                    isActive
                      ? {
                          borderColor: theme.hex,
                          backgroundColor: `${theme.hex}18`,
                          boxShadow: `0 0 16px rgba(${theme.rgb}, 0.28)`,
                        }
                      : undefined
                  }
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs transition-all duration-200 group relative cursor-pointer ${
                    isActive
                      ? 'text-white font-semibold border'
                      : 'text-[#8FA3BF] hover:text-white hover:bg-[#0C192C] border border-transparent hover:border-[#1C2C45]'
                  }`}
                  title={label}
                >
                  <div className="relative shrink-0">
                    <Icon
                      style={isActive ? { color: theme.hex } : undefined}
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'stroke-[2.2]' : 'text-[#8FA3BF] group-hover:text-white'
                      }`}
                    />
                  </div>

                  <span className="flex-1 text-left truncate font-medium">
                    {label}
                  </span>

                  {/* Badge Count on Desktop (Pill Shape) */}
                  {item.badge && item.badge > 0 ? (
                    <span
                      style={{ backgroundColor: theme.hex }}
                      className="flex px-2 py-0.5 text-[10px] font-bold rounded-full text-slate-950 font-mono shadow-sm"
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer (Pill Card) */}
        {user && (
          <div className="pt-3 border-t border-[#142337]">
            <div
              onClick={() => handleTabClick('profile')}
              className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all cursor-pointer ${
                isCreator
                  ? 'bg-gradient-to-r from-[#141A29] to-[#1E1929] border-amber-500/30 hover:border-amber-500/60 shadow-sm'
                  : 'bg-[#0C1424] border-[#182A40] hover:border-emerald-500/40'
              }`}
              title={language === 'ru' ? 'Мой профиль' : 'My Profile'}
            >
              <div className="relative shrink-0">
                <img
                  src={getCleanAvatarUrl(user.handle || user.displayName, user.avatarUrl)}
                  alt={user.displayName}
                  className={`w-9 h-9 rounded-full object-cover bg-slate-800 ${
                    isCreator ? 'border-2 border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'border border-emerald-500/50'
                  }`}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0E1526] bg-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-white truncate">
                    {user.displayName}
                  </span>
                  <VerifiedCheck user={user} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-mono truncate">
                    @{user.handle}
                  </span>
                  {isCreator && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      CREATOR
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar (Pill Capsule Cyber Style) - Hidden when active chat is open */}
      {!(activeTab === 'messenger' && selectedConvId) && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 pb-[env(safe-area-inset-bottom)] bg-[#070D18]/95 backdrop-blur-xl border-t border-[#142338] z-40 flex items-center justify-between px-1.5 sm:px-3 gap-0.5 select-none shadow-[0_-8px_30px_rgba(0,0,0,0.7)]">
          {[
            { id: 'feed', label: language === 'ru' ? 'Лента' : 'Feed', icon: Home },
            { id: 'messenger', label: language === 'ru' ? 'Чаты' : 'Chats', icon: MessageSquare, badge: unreadMessagesCount },
            { id: 'people', label: language === 'ru' ? 'Кодеры' : 'Devs', icon: Users, badge: pendingFriendRequestsCount },
            { id: 'terminal_ai', label: 'AI', icon: Sparkles },
            { id: 'profile', label: language === 'ru' ? 'Профиль' : 'Profile', icon: User },
            { id: 'settings', label: language === 'ru' ? 'Настройки' : 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id as ActiveTab)}
                style={
                  isActive
                    ? {
                        borderColor: theme.hex,
                        backgroundColor: `${theme.hex}18`,
                        boxShadow: `0 0 14px rgba(${theme.rgb}, 0.28)`,
                      }
                    : undefined
                }
                className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-200 relative cursor-pointer min-h-[48px] ${
                  isActive
                    ? 'text-white border'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    style={isActive ? { color: theme.hex } : undefined}
                    className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'text-slate-400'}`}
                  />
                  {item.badge && item.badge > 0 ? (
                    <span
                      style={{ backgroundColor: theme.hex }}
                      className="absolute -top-1.5 -right-2.5 min-w-[15px] h-3.5 px-1 rounded-full text-slate-950 font-bold text-[8px] flex items-center justify-center ring-2 ring-[#070D18]"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[8.5px] sm:text-[9px] mt-1 font-mono tracking-tight truncate max-w-full ${isActive ? 'font-bold text-white' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
};
