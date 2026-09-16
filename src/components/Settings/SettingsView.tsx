import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONFIGS } from '../../lib/theme';
import { Post, UserProfile, Conversation } from '../../types';
import { ModerationPanelModal } from './ModerationPanelModal';
import { PWAInstallButton } from '../Common/PWAInstallButton';
import { AppearanceCustomizer } from './AppearanceCustomizer';
import { triggerHaptic } from '../../utils/haptics';
import { getCleanAvatarUrl } from '../../lib/avatar';
import { CreatorBadge } from '../Common/CreatorBadge';
import { isCreatorAccount } from '../../lib/creator';
import { getAudioMuted, setAudioMuted } from '../../lib/audioEffects';
import {
  ArrowLeft,
  ChevronRight,
  Palette,
  Lock,
  Bell,
  Globe,
  Smartphone,
  ShieldAlert,
  LogOut,
  Check,
  ShieldCheck,
  Volume2,
  VolumeX,
  Vibrate,
  User,
  Radio,
  Eye,
  MessageSquare,
} from 'lucide-react';

interface SettingsViewProps {
  userPosts: Post[];
  allUsers?: UserProfile[];
  posts?: Post[];
  conversations?: Conversation[];
  onDeletePost?: (postId: string) => void;
}

type SettingsSubScreen =
  | 'home'
  | 'appearance'
  | 'privacy'
  | 'notifications'
  | 'language'
  | 'devices';

export const SettingsView: React.FC<SettingsViewProps> = ({
  userPosts,
  allUsers = [],
  posts = [],
  conversations = [],
  onDeletePost,
}) => {
  const {
    user,
    accentColor,
    language,
    setLanguage,
    updateProfileData,
    logout,
    themeSettings,
  } = useAuth();

  const isRu = language === 'ru';
  const theme = THEME_CONFIGS[accentColor] || THEME_CONFIGS.emerald;

  const [currentScreen, setCurrentScreen] = useState<SettingsSubScreen>('home');
  const [allowDMs, setAllowDMs] = useState(user?.privacy?.allowDMs || 'all');
  const [profileVis, setProfileVis] = useState(user?.privacy?.profileVisibility || 'all');
  const [showOnline, setShowOnline] = useState(user?.privacy?.showOnlineStatus ?? true);
  const [isModPanelOpen, setIsModPanelOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(!getAudioMuted());
  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
    try {
      return localStorage.getItem('litenote_haptics_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const handleSavePrivacy = (
    newAllowDMs: 'all' | 'friends',
    newVis: 'all' | 'friends' | 'private',
    newOnline: boolean
  ) => {
    triggerHaptic('selection');
    setAllowDMs(newAllowDMs);
    setProfileVis(newVis);
    setShowOnline(newOnline);
    updateProfileData({
      privacy: {
        allowDMs: newAllowDMs,
        profileVisibility: newVis,
        showOnlineStatus: newOnline,
      },
    });
  };

  const handleToggleSound = (enabled: boolean) => {
    triggerHaptic('selection');
    setSoundEnabled(enabled);
    setAudioMuted(!enabled);
  };

  const handleToggleHaptics = (enabled: boolean) => {
    triggerHaptic('medium');
    setHapticsEnabled(enabled);
    try {
      localStorage.setItem('litenote_haptics_enabled', enabled ? 'true' : 'false');
    } catch {}
  };

  const navigateTo = (screen: SettingsSubScreen) => {
    triggerHaptic('light');
    setCurrentScreen(screen);
    // Scroll to top of view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // -------------------------------------------------------------
  // SUB-SCREEN: APPEARANCE (Telegram Chat Settings)
  // -------------------------------------------------------------
  if (currentScreen === 'appearance') {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full p-3 sm:p-6 space-y-5">
        {/* Telegram Sub-Header */}
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-[#0C1424] border border-slate-800/80 sticky top-2 z-10 backdrop-blur-md">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>{isRu ? 'Настройки' : 'Settings'}</span>
          </button>
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
            {isRu ? 'Настройки чатов и темы' : 'Chat Settings & Theme'}
          </h2>
          <div className="w-12" />
        </div>

        <AppearanceCustomizer />
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-SCREEN: PRIVACY & SECURITY
  // -------------------------------------------------------------
  if (currentScreen === 'privacy') {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full p-3 sm:p-6 space-y-5">
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-[#0C1424] border border-slate-800/80 sticky top-2 z-10 backdrop-blur-md">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>{isRu ? 'Настройки' : 'Settings'}</span>
          </button>
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
            {isRu ? 'Конфиденциальность' : 'Privacy & Security'}
          </h2>
          <div className="w-12" />
        </div>

        {/* Telegram Inset Group: Privacy Settings */}
        <div className="rounded-2xl bg-[#0C1424] border border-slate-800/90 divide-y divide-slate-800/70 overflow-hidden shadow-xl">
          {/* Direct Messages */}
          <div className="p-4 sm:p-5 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                {isRu ? 'Кто может отправлять вам сообщения' : 'Who can send you direct messages'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isRu
                  ? 'Ограничение входящих диалогов в мессенджере'
                  : 'Restrict incoming direct messages to contacts'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => handleSavePrivacy('all', profileVis, showOnline)}
                style={
                  allowDMs === 'all'
                    ? {
                        borderColor: theme.hex,
                        backgroundColor: `${theme.hex}18`,
                        color: '#FFFFFF',
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border text-xs text-left font-medium flex items-center justify-between transition-all cursor-pointer ${
                  allowDMs === 'all'
                    ? 'font-semibold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{isRu ? 'Все пользователи' : 'Everybody'}</span>
                {allowDMs === 'all' && <Check className="w-4 h-4" style={{ color: theme.hex }} />}
              </button>

              <button
                onClick={() => handleSavePrivacy('friends', profileVis, showOnline)}
                style={
                  allowDMs === 'friends'
                    ? {
                        borderColor: theme.hex,
                        backgroundColor: `${theme.hex}18`,
                        color: '#FFFFFF',
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border text-xs text-left font-medium flex items-center justify-between transition-all cursor-pointer ${
                  allowDMs === 'friends'
                    ? 'font-semibold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{isRu ? 'Только друзья' : 'My Contacts'}</span>
                {allowDMs === 'friends' && <Check className="w-4 h-4" style={{ color: theme.hex }} />}
              </button>
            </div>
          </div>

          {/* Profile Visibility */}
          <div className="p-4 sm:p-5 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                {isRu ? 'Видимость профиля и стены' : 'Profile Visibility'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isRu
                  ? 'Отображение ваших постов в глобальной ленте и поиске'
                  : 'Public visibility of your wall posts and bio'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => handleSavePrivacy(allowDMs, 'all', showOnline)}
                style={
                  profileVis === 'all'
                    ? {
                        borderColor: theme.hex,
                        backgroundColor: `${theme.hex}18`,
                        color: '#FFFFFF',
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border text-xs text-left font-medium flex items-center justify-between transition-all cursor-pointer ${
                  profileVis === 'all'
                    ? 'font-semibold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{isRu ? 'Все (Публичный)' : 'Public'}</span>
                {profileVis === 'all' && <Check className="w-4 h-4" style={{ color: theme.hex }} />}
              </button>

              <button
                onClick={() => handleSavePrivacy(allowDMs, 'friends', showOnline)}
                style={
                  profileVis === 'friends'
                    ? {
                        borderColor: theme.hex,
                        backgroundColor: `${theme.hex}18`,
                        color: '#FFFFFF',
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border text-xs text-left font-medium flex items-center justify-between transition-all cursor-pointer ${
                  profileVis === 'friends'
                    ? 'font-semibold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{isRu ? 'Только друзья' : 'Friends Only'}</span>
                {profileVis === 'friends' && <Check className="w-4 h-4" style={{ color: theme.hex }} />}
              </button>
            </div>
          </div>

          {/* Online Presence Status */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                {isRu ? 'Статус "В сети"' : 'Online Status'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isRu
                  ? 'Показывать зеленый индикатор присутствия в чатах'
                  : 'Broadcast real-time active pulse indicator'}
              </span>
            </div>

            <button
              onClick={() => handleSavePrivacy(allowDMs, profileVis, !showOnline)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                showOnline ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showOnline ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Security Info Card */}
        <div className="p-4 rounded-xl bg-[#080D1A] border border-slate-800/80 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              {isRu ? 'Шифрование данных' : 'Cloud Security'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isRu
                ? 'Все сессии и переписки защищены протоколом Firebase Firestore Rules'
                : 'All documents and messages secured with isolated security rules'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-SCREEN: NOTIFICATIONS & SOUNDS
  // -------------------------------------------------------------
  if (currentScreen === 'notifications') {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full p-3 sm:p-6 space-y-5">
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-[#0C1424] border border-slate-800/80 sticky top-2 z-10 backdrop-blur-md">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>{isRu ? 'Настройки' : 'Settings'}</span>
          </button>
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
            {isRu ? 'Уведомления и звуки' : 'Notifications & Sounds'}
          </h2>
          <div className="w-12" />
        </div>

        <div className="rounded-2xl bg-[#0C1424] border border-slate-800/90 divide-y divide-slate-800/70 overflow-hidden shadow-xl">
          {/* Sounds Toggle */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  {isRu ? 'Звуковые эффекты в приложении' : 'In-App Sound Effects'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isRu
                    ? 'Синтезированные микро-клики при отправке и получении сообщений'
                    : 'Crisp synthesized audio chimes on sending and receiving messages'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleToggleSound(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                soundEnabled ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Haptics Toggle */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Vibrate className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  {isRu ? 'Тактильный виброотклик (Haptics)' : 'Vibration & Haptic Feedback'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isRu
                    ? 'Вибрация при переключении табов, меню и отправке реакций'
                    : 'Tactile pulses on navigation, buttons, and emoji reactions'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleToggleHaptics(!hapticsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                hapticsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hapticsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-SCREEN: LANGUAGE
  // -------------------------------------------------------------
  if (currentScreen === 'language') {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full p-3 sm:p-6 space-y-5">
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-[#0C1424] border border-slate-800/80 sticky top-2 z-10 backdrop-blur-md">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>{isRu ? 'Настройки' : 'Settings'}</span>
          </button>
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
            {isRu ? 'Язык' : 'Language'}
          </h2>
          <div className="w-12" />
        </div>

        <div className="rounded-2xl bg-[#0C1424] border border-slate-800/90 divide-y divide-slate-800/70 overflow-hidden shadow-xl">
          {/* Russian */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              setLanguage('ru');
            }}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl">🇷🇺</span>
              <div>
                <span className="text-sm font-bold text-slate-100 block">Русский</span>
                <span className="text-xs text-slate-400">Russian</span>
              </div>
            </div>
            {language === 'ru' && <Check className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* English */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              setLanguage('en');
            }}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl">🇺🇸</span>
              <div>
                <span className="text-sm font-bold text-slate-100 block">English</span>
                <span className="text-xs text-slate-400">Английский</span>
              </div>
            </div>
            {language === 'en' && <Check className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-SCREEN: DEVICES & PWA
  // -------------------------------------------------------------
  if (currentScreen === 'devices') {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full p-3 sm:p-6 space-y-5">
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-[#0C1424] border border-slate-800/80 sticky top-2 z-10 backdrop-blur-md">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>{isRu ? 'Настройки' : 'Settings'}</span>
          </button>
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
            {isRu ? 'Устройства и приложение' : 'Devices & PWA Client'}
          </h2>
          <div className="w-12" />
        </div>

        <PWAInstallButton variant="settings" />

        <div className="rounded-2xl bg-[#0C1424] border border-slate-800/90 p-5 space-y-3 shadow-xl">
          <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider block">
            {isRu ? 'Технические характеристики клиента' : 'Client Environment'}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#080D1A] border border-slate-800 flex justify-between">
              <span className="text-slate-500">Service Worker:</span>
              <span className="text-emerald-400 font-bold">Active v2.8</span>
            </div>
            <div className="p-3 rounded-xl bg-[#080D1A] border border-slate-800 flex justify-between">
              <span className="text-slate-500">Offline DB:</span>
              <span className="text-slate-200">IndexedDB Synced</span>
            </div>
            <div className="p-3 rounded-xl bg-[#080D1A] border border-slate-800 flex justify-between">
              <span className="text-slate-500">Display Mode:</span>
              <span className="text-slate-200">
                {typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
                  ? 'Standalone PWA'
                  : 'Web Browser'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#080D1A] border border-slate-800 flex justify-between">
              <span className="text-slate-500">WebRTC Engine:</span>
              <span className="text-cyan-400">Ready</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN TELEGRAM SETTINGS HUB (Compact, zero bloat, instant access)
  // -------------------------------------------------------------
  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-3 sm:p-6 space-y-4">
      {/* 1. Telegram Profile Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0C1424] border border-slate-800/90 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={getCleanAvatarUrl(user?.handle || user?.displayName, user?.avatarUrl)}
              alt={user?.displayName || 'User'}
              className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-slate-900"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.handle || user?.displayName || 'developer')}&backgroundColor=0f172a,1e293b,1e1b4b,022c22,172554`;
              }}
            />
            <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0C1424]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base font-bold text-white truncate">
                {user?.displayName || 'Developer'}
              </h2>
              {user && isCreatorAccount(user) && <CreatorBadge size="sm" />}
            </div>
            <p className="text-xs font-mono text-emerald-400 mt-0.5">
              @{user?.handle || 'user'}
            </p>
            {user?.bio && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Group 1: Core Telegram Settings */}
      <div className="rounded-2xl bg-[#0C1424] border border-slate-800/90 divide-y divide-slate-800/60 overflow-hidden shadow-lg">
        {/* Chat Settings & Theme */}
        <button
          onClick={() => navigateTo('appearance')}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-800/40 active:bg-slate-800/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${theme.hex}20`,
                color: theme.hex,
              }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 block truncate">
                {isRu ? 'Настройки чатов и тем' : 'Chat Settings & Theme'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {theme.name}, {themeSettings.fontSize.toUpperCase()}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
        </button>

        {/* Privacy & Security */}
        <button
          onClick={() => navigateTo('privacy')}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-800/40 active:bg-slate-800/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 block truncate">
                {isRu ? 'Конфиденциальность' : 'Privacy and Security'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {allowDMs === 'all'
                  ? isRu
                    ? 'ЛС: Все пользователи'
                    : 'DMs: Everybody'
                  : isRu
                  ? 'ЛС: Только контакты'
                  : 'DMs: Contacts only'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
        </button>

        {/* Notifications & Sounds */}
        <button
          onClick={() => navigateTo('notifications')}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-800/40 active:bg-slate-800/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 block truncate">
                {isRu ? 'Уведомления и звуки' : 'Notifications and Sounds'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {soundEnabled
                  ? isRu
                    ? 'Звук: Вкл • Вибрация: Вкл'
                    : 'Sound: On • Haptics: On'
                  : isRu
                  ? 'Звук: Выкл'
                  : 'Sound: Off'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
        </button>

        {/* Language */}
        <button
          onClick={() => navigateTo('language')}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-800/40 active:bg-slate-800/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 block truncate">
                {isRu ? 'Язык' : 'Language'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {language === 'ru' ? 'Русский (RU)' : 'English (EN)'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
        </button>
      </div>

      {/* 3. Group 2: Devices, PWA & Admin */}
      <div className="rounded-2xl bg-[#0C1424] border border-slate-800/90 divide-y divide-slate-800/60 overflow-hidden shadow-lg">
        {/* Devices / PWA */}
        <button
          onClick={() => navigateTo('devices')}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-800/40 active:bg-slate-800/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 block truncate">
                {isRu ? 'Устройства и приложение' : 'Devices & PWA Client'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                LiteNote Web v2.8 (Standalone)
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
        </button>

        {/* Moderation Panel */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            setIsModPanelOpen(true);
          }}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-800/40 active:bg-slate-800/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 block truncate">
                {isRu ? 'Панель модерации' : 'Moderation Console'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {isRu ? 'Доступ по паролю администратора' : 'Password protected administration'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
        </button>
      </div>

      {/* 4. Group 3: Log Out */}
      <div className="rounded-2xl bg-[#0C1424] border border-slate-800/90 overflow-hidden shadow-lg">
        {confirmLogout ? (
          <div className="p-4 flex items-center justify-between bg-rose-950/30">
            <span className="text-xs font-bold text-rose-300">
              {isRu ? 'Вы уверены, что хотите выйти?' : 'Log out from LiteNote?'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800"
              >
                {isRu ? 'Отмена' : 'Cancel'}
              </button>
              <button
                onClick={logout}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95 cursor-pointer"
              >
                {isRu ? 'Выйти' : 'Log Out'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full p-3.5 sm:p-4 flex items-center gap-3.5 hover:bg-rose-950/20 transition-colors text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-rose-400">
              {isRu ? 'Выйти из аккаунта' : 'Log Out'}
            </span>
          </button>
        )}
      </div>

      {/* Footer Branding (Telegram Style) */}
      <div className="text-center pt-2 pb-6 space-y-1">
        <p className="text-[11px] font-mono text-slate-500">
          LiteNote for Web v2.8 (Build 2026.09)
        </p>
        <p className="text-[10px] text-slate-600">
          {isRu ? 'Сверхбыстрая социальная сеть и мессенджер' : 'Ultra-fast Developer Network & Messenger'}
        </p>
      </div>

      {/* Moderation Modal */}
      <ModerationPanelModal
        isOpen={isModPanelOpen}
        onClose={() => setIsModPanelOpen(false)}
        allUsers={allUsers}
        posts={posts}
        conversations={conversations}
        onDeletePost={onDeletePost}
      />
    </div>
  );
};
