import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { AccentColor, Language, Post, UserProfile, Conversation } from '../../types';
import { ModerationPanelModal } from './ModerationPanelModal';
import {
  Settings,
  Globe,
  Palette,
  Shield,
  Trash2,
  Check,
  Lock,
  Eye,
  Key,
  ShieldAlert,
  Server,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SettingsViewProps {
  userPosts: Post[];
  allUsers?: UserProfile[];
  posts?: Post[];
  conversations?: Conversation[];
  onDeletePost?: (postId: string) => void;
}

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
    setAccentColor,
    language,
    setLanguage,
    updateProfileData,
    logout,
  } = useAuth();

  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [allowDMs, setAllowDMs] = useState(user?.privacy?.allowDMs || 'all');
  const [profileVis, setProfileVis] = useState(user?.privacy?.profileVisibility || 'all');
  const [showOnline, setShowOnline] = useState(user?.privacy?.showOnlineStatus ?? true);
  const [isModPanelOpen, setIsModPanelOpen] = useState(false);

  const handleSavePrivacy = (newAllowDMs: 'all' | 'friends', newVis: 'all' | 'friends' | 'private', newOnline: boolean) => {
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

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
      {/* Title Header */}
      <div className="p-5 rounded-2xl bg-[#0C121E] border border-[#1E293B] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-base text-white">
              {language === 'ru' ? 'Настройки профиля и системы' : 'Settings & Preferences'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ru'
                ? 'Персонализация, язык, приватность и панель модерации'
                : 'Customization, language, privacy and administration'}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Moderation Panel Card (PASSWORD PROTECTED) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#131E33] border border-indigo-500/30 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-sm text-white">
                  {language === 'ru' ? 'Панель модерации' : 'Moderation & Admin Panel'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-semibold">
                  {language === 'ru' ? 'Доступ по паролю' : 'Password Protected'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ru'
                  ? 'Контроль трафика, удаление нарушений, управление базой Firebase'
                  : 'Traffic analytics, post moderation, and Firebase database management'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModPanelOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'ru' ? 'Открыть панель модерации' : 'Open Moderation Panel'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Interface Language */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Globe className="w-4 h-4" style={{ color: theme.hex }} />
          <span>{language === 'ru' ? 'Язык интерфейса' : 'Interface Language'}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => setLanguage('ru')}
            style={
              language === 'ru'
                ? {
                    borderColor: theme.hex,
                    backgroundColor: `${theme.hex}18`,
                    color: '#FFFFFF',
                  }
                : undefined
            }
            className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
              language === 'ru'
                ? 'font-semibold shadow-xs'
                : 'border-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span>Русский (RU)</span>
            {language === 'ru' && <Check className="w-4 h-4" style={{ color: theme.hex }} />}
          </button>

          <button
            onClick={() => setLanguage('en')}
            style={
              language === 'en'
                ? {
                    borderColor: theme.hex,
                    backgroundColor: `${theme.hex}18`,
                    color: '#FFFFFF',
                  }
                : undefined
            }
            className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
              language === 'en'
                ? 'font-semibold shadow-xs'
                : 'border-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span>English (EN)</span>
            {language === 'en' && <Check className="w-4 h-4" style={{ color: theme.hex }} />}
          </button>
        </div>
      </div>

      {/* 3. Accent Theme */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Palette className="w-4 h-4" style={{ color: theme.hex }} />
            <span>{language === 'ru' ? 'Цветовой акцент' : 'Color Theme Accent'}</span>
          </div>
          <span
            className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 transition-colors"
            style={{
              borderColor: `${theme.hex}50`,
              backgroundColor: `${theme.hex}15`,
              color: theme.hex,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.hex }} />
            {theme.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {(['emerald', 'cyan', 'amber', 'violet', 'lime'] as AccentColor[]).map((col) => {
            const conf = THEME_CONFIGS[col];
            const isSelected = accentColor === col;
            return (
              <button
                key={col}
                type="button"
                onClick={() => setAccentColor(col)}
                style={
                  isSelected
                    ? {
                        borderColor: conf.hex,
                        backgroundColor: `${conf.hex}1a`,
                        boxShadow: `0 0 20px rgba(${conf.rgb}, 0.35)`,
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer relative group active:scale-95 ${
                  isSelected
                    ? 'ring-1 border-current'
                    : 'border-[#1E293B] hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full shadow-md flex items-center justify-center relative transition-transform group-hover:scale-110"
                  style={{ backgroundColor: conf.hex }}
                >
                  {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                </div>
                <span
                  className={`text-xs transition-colors ${
                    isSelected ? 'text-white font-bold' : 'text-slate-400 group-hover:text-slate-200 font-medium'
                  }`}
                >
                  {conf.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Privacy & Messages */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Shield className="w-4 h-4" style={{ color: theme.hex }} />
          <span>{language === 'ru' ? 'Приватность и сообщения' : 'Privacy & Security'}</span>
        </div>

        <div className="space-y-3 max-w-lg">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              {language === 'ru' ? 'Кто может отправлять вам личные сообщения:' : 'Who can send you direct messages:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  allowDMs === 'all'
                    ? 'font-semibold'
                    : 'border-[#1E293B] text-slate-400 hover:text-white'
                }`}
              >
                {language === 'ru' ? 'Все пользователи' : 'Everyone'}
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
                className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  allowDMs === 'friends'
                    ? 'font-semibold'
                    : 'border-[#1E293B] text-slate-400 hover:text-white'
                }`}
              >
                {language === 'ru' ? 'Только друзья' : 'Friends only'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              {language === 'ru' ? 'Видимость профиля:' : 'Profile visibility:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  profileVis === 'all'
                    ? 'font-semibold'
                    : 'border-[#1E293B] text-slate-400 hover:text-white'
                }`}
              >
                {language === 'ru' ? 'Открытый профиль' : 'Public'}
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
                className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  profileVis === 'friends'
                    ? 'font-semibold'
                    : 'border-[#1E293B] text-slate-400 hover:text-white'
                }`}
              >
                {language === 'ru' ? 'Только для друзей' : 'Friends only'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Logout */}
      <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/30 space-y-3">
        <h3 className="text-xs font-bold text-rose-400 flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          {language === 'ru' ? 'Выход из аккаунта' : 'Sign Out'}
        </h3>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700/40 transition-colors cursor-pointer"
        >
          {language === 'ru' ? 'Выйти из системы' : 'Log Out'}
        </button>
      </div>

      {/* Password-Protected Moderation Modal */}
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
