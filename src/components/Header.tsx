import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';
import { THEME_CONFIGS } from '../lib/theme';
import { UserProfile, ActiveTab } from '../types';
import { CreatorBadge, VerifiedCheck } from './Common/CreatorBadge';
import { LiteNoteLogo } from './Common/LiteNoteLogo';
import { PillNav } from './ui/PillNav';
import { isCreatorAccount } from '../lib/creator';
import { getCleanAvatarUrl } from '../lib/avatar';
import {
  Search,
  Bell,
  Plus,
  Globe,
  LogOut,
  LogIn,
  User,
  Settings,
  X,
  MessageSquare,
  Shield,
  Sparkles,
  ChevronDown,
  Crown,
  Code,
  Terminal,
  Zap,
  Home,
  Users,
  Bookmark
} from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  allUsers?: UserProfile[];
  onSearchQuery?: (q: string) => void;
  onOpenCodePlayground?: () => void;
  onOpenDevTools?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenNotifications,
  unreadNotificationsCount,
  allUsers = [],
  onSearchQuery,
  onOpenCodePlayground,
  onOpenDevTools,
}) => {
  const {
    user,
    logout,
    accentColor,
    language,
    setLanguage,
    activeTab,
    setActiveTab,
    setSelectedUserId,
    setOpenCreatePost,
  } = useAuth();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];
  const isCreator = isCreatorAccount(user);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearchQuery) onSearchQuery(e.target.value);
  };

  const handleSearchSelect = (uid: string) => {
    setSelectedUserId(uid);
    setActiveTab('profile');
    setSearchFocused(false);
    setShowMobileSearch(false);
    setSearchValue('');
  };

  const searchResults = searchValue.trim()
    ? allUsers.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(searchValue.toLowerCase()) ||
          u.handle?.toLowerCase().includes(searchValue.toLowerCase()) ||
          u.bio?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  const mainPillNavItems = [
    {
      label: language === 'ru' ? 'Лента' : 'Feed',
      href: '#feed',
      icon: <Home className="w-3.5 h-3.5 text-emerald-400" />,
      onClick: () => {
        setActiveTab('feed');
        setSelectedUserId(null);
      },
    },
    {
      label: language === 'ru' ? 'Чаты' : 'Chats',
      href: '#messenger',
      icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />,
      onClick: () => {
        setActiveTab('messenger');
      },
    },
    {
      label: language === 'ru' ? 'Кодеры' : 'Devs',
      href: '#people',
      icon: <Users className="w-3.5 h-3.5 text-indigo-400" />,
      onClick: () => {
        setActiveTab('people');
      },
    },
    {
      label: 'Litenote AI',
      href: '#terminal_ai',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
      onClick: () => {
        setActiveTab('terminal_ai');
      },
    },
    {
      label: language === 'ru' ? 'Закладки' : 'Saved',
      href: '#bookmarks',
      icon: <Bookmark className="w-3.5 h-3.5 text-amber-400" />,
      onClick: () => {
        setActiveTab('bookmarks');
      },
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080D18]/95 backdrop-blur-xl border-b border-[#142337] px-2.5 sm:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-3 select-none shrink-0 h-14 sm:h-16">
      {/* Official LiteNote Brand & Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            setActiveTab('feed');
            setSelectedUserId(null);
          }}
          className="flex items-center text-left group focus:outline-none cursor-pointer"
        >
          <LiteNoteLogo size="sm" showText={true} showSubtitle={false} animated={true} />
        </button>
      </div>

      {/* Global Clean Search Bar in Center (Desktop) */}
      <div className="relative flex-1 max-w-lg hidden md:block mx-4">
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
            placeholder={language === 'ru' ? 'Поиск кодеров, постов, сниппетов...' : 'Search coders, posts, snippets...'}
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#0C1424] text-slate-100 placeholder:text-slate-500 border border-[#182A40] rounded-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono shadow-inner"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Popup */}
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[#0E1526] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800 max-h-80 overflow-y-auto animate-in fade-in">
            {searchResults.map((su) => (
              <button
                key={su.uid}
                onMouseDown={() => handleSearchSelect(su.uid)}
                className="w-full p-3 text-left flex items-center gap-3 hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <img
                  src={su.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${su.handle}`}
                  alt={su.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-800"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-white truncate">{su.displayName}</span>
                    <VerifiedCheck user={su} />
                    <CreatorBadge user={su} size="sm" showLabel />
                    <span className="text-[11px] text-emerald-400 font-medium">@{su.handle}</span>
                  </div>
                  {su.bio && <p className="text-[11px] text-slate-400 truncate mt-0.5">{su.bio}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Action Icons & User Dropdown (Pill Styling) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Mobile Search Icon */}
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="p-2 rounded-full bg-[#0E1526] border border-[#1A243A] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all md:hidden cursor-pointer active:scale-95"
          title={language === 'ru' ? 'Поиск' : 'Search'}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* DevHub Trigger (Desktop / Tablet) */}
        {(onOpenDevTools || onOpenCodePlayground) && (
          <button
            onClick={onOpenDevTools || onOpenCodePlayground}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-[#0A1828] hover:bg-[#0E2238] text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer shadow-sm active:scale-95"
            title="LiteNote DevHub & AI Tools"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>DevHub</span>
          </button>
        )}

        {/* Create Post Button */}
        {user && (
          <button
            onClick={() => setOpenCreatePost(true)}
            className="flex items-center gap-1.5 p-2 sm:px-4 sm:py-2 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all cursor-pointer"
            title={language === 'ru' ? 'Создать пост' : 'New Post'}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden md:inline">{language === 'ru' ? 'Написать' : 'New Post'}</span>
          </button>
        )}

        {/* Language switch */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#0E1526] border border-[#1A243A] hover:border-emerald-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          title={language === 'ru' ? 'Сменить язык' : 'Change Language'}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-mono">{language.toUpperCase()}</span>
        </button>

        {/* Notifications Icon */}
        {user && (
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-full bg-[#0E1526] border border-[#1A243A] hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all relative cursor-pointer active:scale-95"
            title={language === 'ru' ? 'Уведомления' : 'Notifications'}
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        )}

        {/* Quick Settings Direct Icon for Mobile & Desktop */}
        {user && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-full border transition-all cursor-pointer active:scale-95 ${
              activeTab === 'settings'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-[#0E1526] border-[#1A243A] hover:border-emerald-500/40 text-slate-300 hover:text-white'
            }`}
            title={language === 'ru' ? 'Настройки' : 'Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* User Avatar & Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 p-1 rounded-full bg-[#0E1526] border border-[#1A243A] hover:border-emerald-500/40 hover:bg-[#121B30] transition-all cursor-pointer active:scale-95"
            >
              <div className="relative">
                <img
                  src={getCleanAvatarUrl(user.handle || user.displayName, user.avatarUrl)}
                  alt={user.displayName}
                  className={`w-7 h-7 rounded-full object-cover bg-slate-800 ${
                    isCreator ? 'border-2 border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'border border-emerald-500/50'
                  }`}
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0E1526] ${
                    user.status === 'online'
                      ? 'bg-emerald-400'
                      : user.status === 'busy'
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                />
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block mr-1" />
            </button>

            {/* Dropdown Menu with full-screen backdrop for mobile */}
            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/50 md:bg-transparent backdrop-blur-[2px] md:backdrop-blur-none"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-20px)] bg-[#0E1526] border border-[#1E293B] rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in">
                  <div className="px-3 py-2.5 border-b border-slate-800 mb-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                      <VerifiedCheck user={user} />
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">@{user.handle}</p>
                    {isCreator && (
                      <div className="mt-1.5">
                        <CreatorBadge user={user} size="sm" showLabel />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedUserId(user.uid);
                      setActiveTab('profile');
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'ru' ? 'Мой профиль' : 'My Profile'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-300 hover:text-white hover:bg-emerald-950/40 hover:text-emerald-300 border border-transparent hover:border-emerald-500/30 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">{language === 'ru' ? 'Настройки аккаунта' : 'Settings'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('bookmarks');
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    <span>{language === 'ru' ? 'Закладки и сниппеты' : 'Bookmarks & Snippets'}</span>
                  </button>

                  {onOpenDevTools && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenDevTools();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>{language === 'ru' ? 'DevHub & AI Tools' : 'DevHub & AI Tools'}</span>
                    </button>
                  )}

                  <div className="border-t border-slate-800 my-1" />

                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-medium text-rose-400 hover:bg-rose-950/30 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{language === 'ru' ? 'Выйти' : 'Sign Out'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{language === 'ru' ? 'Войти' : 'Sign In'}</span>
          </button>
        )}
      </div>

      {/* Mobile Search Modal Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 flex flex-col pt-16 md:hidden">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchValue}
                onChange={handleSearchChange}
                placeholder={language === 'ru' ? 'Поиск кодеров...' : 'Search coders...'}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-[#0C1424] text-white placeholder:text-slate-500 border border-emerald-500/40 rounded-xl focus:outline-none"
              />
              {searchValue && (
                <button
                  onClick={() => setSearchValue('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowMobileSearch(false)}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-mono"
            >
              {language === 'ru' ? 'Закрыть' : 'Close'}
            </button>
          </div>

          {/* Mobile Results */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {searchResults.map((su) => (
              <button
                key={su.uid}
                onClick={() => handleSearchSelect(su.uid)}
                className="w-full p-3 rounded-xl bg-[#0E1526] border border-slate-800 flex items-center gap-3 text-left hover:border-emerald-500 transition-colors"
              >
                <img
                  src={su.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${su.handle}`}
                  alt={su.displayName}
                  className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white truncate">{su.displayName}</span>
                    <VerifiedCheck user={su} />
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">@{su.handle}</span>
                  {su.bio && <p className="text-xs text-slate-400 truncate mt-0.5">{su.bio}</p>}
                </div>
              </button>
            ))}
            {searchValue.trim() && searchResults.length === 0 && (
              <p className="text-center text-xs text-slate-500 py-8">
                {language === 'ru' ? 'Ничего не найдено' : 'No coders found'}
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
