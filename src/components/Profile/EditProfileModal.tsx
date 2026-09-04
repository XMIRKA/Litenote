import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { AccentColor, UserProfile } from '../../types';
import {
  CUSTOM_AVATAR_PRESETS,
  AVATAR_PRESET_CATEGORIES,
  PROFILE_BANNER_PRESETS,
  AVATAR_FRAMES,
  POPULAR_TECH_STACK,
  getCleanAvatarUrl,
} from '../../lib/avatar';
import { compressImage } from '../../lib/imageUtils';
import {
  X,
  User,
  Image as ImageIcon,
  MapPin,
  Globe,
  Github,
  Save,
  Sparkles,
  Check,
  Upload,
  Camera,
  Loader2,
  Shield,
  Activity,
  Zap,
  Layers,
  Palette,
  Share2,
  Code,
  Send,
  MessageSquare,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: TabType;
}

export type TabType = 'visuals' | 'identity' | 'style' | 'social';

const AVAILABLE_BADGES = [
  { id: 'cyber_pioneer', label: 'CYBER PIONEER', desc: 'Первопроходец Litenote' },
  { id: 'root_access', label: 'ROOT ACCESS', desc: 'Полный доступ разработчика' },
  { id: 'matrix_architect', label: 'MATRIX ARCHITECT', desc: 'Архитектор систем и интерфейсов' },
  { id: 'crypto_sage', label: 'CRYPTO SAGE', desc: 'Мастер криптографии и безопасности' },
  { id: 'exploit_hunter', label: 'EXPLOIT HUNTER', desc: 'Исследователь уязвимостей и багов' },
  { id: 'fullstack_ninja', label: 'FULLSTACK NINJA', desc: 'Эксперт Frontend & Backend' },
  { id: 'ai_explorer', label: 'AI EXPLORER', desc: 'Нейросети и искусственный интеллект' },
  { id: 'ui_crafter', label: 'UI CRAFTER', desc: 'Создатель безупречного дизайна' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'visuals',
}) => {
  const { user, accentColor, setAccentColor, language, updateProfileData } = useAuth();
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [avatarCategory, setAvatarCategory] = useState<string>('all');

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [status, setStatus] = useState<'online' | 'idle' | 'busy' | 'offline'>('online');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFrame, setAvatarFrame] = useState('none');
  const [bannerUrl, setBannerUrl] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [github, setGithub] = useState('');
  const [telegram, setTelegram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [discord, setDiscord] = useState('');
  const [selectedAccent, setSelectedAccent] = useState<AccentColor>('emerald');
  const [badges, setBadges] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens
  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.displayName || '');
      setHandle(user.handle || '');
      setBio(user.bio || '');
      setCustomStatus(user.customStatus || '');
      setStatus(user.status || 'online');
      setAvatarUrl(user.avatarUrl || '');
      setAvatarFrame(user.customization?.avatarFrame || 'none');
      setBannerUrl(user.bannerUrl || PROFILE_BANNER_PRESETS[0].url);
      setLocation(user.location || '');
      setWebsite(user.website || user.customization?.socialLinks?.website || '');
      setGithub(user.github || user.customization?.socialLinks?.github || '');
      setTelegram(user.customization?.socialLinks?.telegram || '');
      setTwitter(user.customization?.socialLinks?.twitter || '');
      setDiscord(user.customization?.socialLinks?.discord || '');
      setSelectedAccent(user.accentColor || accentColor || 'emerald');
      setBadges(user.badges || ['cyber_pioneer']);
      setTechStack(user.customization?.techStack || ['React', 'TypeScript']);
      setSaveSuccess(false);
      setErrorMessage(null);
      setActiveTab(defaultTab);
    }
  }, [user, isOpen, accentColor, defaultTab]);

  if (!isOpen || !user) return null;

  const currentTheme = THEME_CONFIGS[selectedAccent] || THEME_CONFIGS.emerald;
  const currentFrameObj = AVATAR_FRAMES.find((f) => f.id === avatarFrame) || AVATAR_FRAMES[0];

  const filteredAvatarPresets = avatarCategory === 'all'
    ? CUSTOM_AVATAR_PRESETS
    : CUSTOM_AVATAR_PRESETS.filter((p) => p.category === avatarCategory);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    setErrorMessage(null);
    try {
      // Compress to optimal max 400x400 for super fast load and no Firestore size limits
      const compressedDataUrl = await compressImage(file, 400, 400, 0.88);
      setAvatarUrl(compressedDataUrl);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setErrorMessage(language === 'ru' ? 'Не удалось загрузить изображение' : 'Failed to upload photo');
    } finally {
      setIsProcessingImage(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    setErrorMessage(null);
    try {
      const compressedDataUrl = await compressImage(file, 1200, 500, 0.82);
      setBannerUrl(compressedDataUrl);
    } catch (err) {
      console.error('Error uploading banner:', err);
      setErrorMessage(language === 'ru' ? 'Не удалось загрузить обложку' : 'Failed to upload banner');
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleGenerateRandomAvatar = () => {
    const seeds = ['CyberNova', 'GlitchViper', 'NeonPhantom', 'QuantumByte', 'ZenithCode', 'HyperPulse', 'ZeroDay', 'ApexMatrix', 'ShadowFox', 'Kira'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + '_' + Math.floor(Math.random() * 1000);
    const styles = [
      `https://api.dicebear.com/7.x/notionists/svg?seed=${randomSeed}&backgroundColor=0f172a,1e1b4b,022c22,172554,3b0764`,
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}&backgroundColor=0f172a,1e1b4b,022c22`,
      `https://api.dicebear.com/7.x/pixel-art/svg?seed=${randomSeed}`,
    ];
    const pickedStyle = styles[Math.floor(Math.random() * styles.length)];
    setAvatarUrl(pickedStyle);
  };

  const toggleBadge = (badgeId: string) => {
    if (badges.includes(badgeId)) {
      setBadges(badges.filter((b) => b !== badgeId));
    } else {
      setBadges([...badges, badgeId]);
    }
  };

  const toggleTech = (tech: string) => {
    if (techStack.includes(tech)) {
      setTechStack(techStack.filter((t) => t !== tech));
    } else {
      setTechStack([...techStack, tech]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');

    try {
      await updateProfileData({
        displayName: displayName.trim() || user.displayName || 'Operator',
        handle: cleanHandle || user.handle || 'user',
        bio: bio.trim(),
        customStatus: customStatus.trim(),
        status,
        avatarUrl: avatarUrl.trim(),
        bannerUrl: bannerUrl.trim() || user.bannerUrl,
        location: location.trim(),
        website: website.trim(),
        github: github.trim(),
        accentColor: selectedAccent,
        badges: badges.length > 0 ? badges : ['cyber_pioneer'],
        customization: {
          ...(user.customization || {}),
          avatarFrame,
          techStack,
          socialLinks: {
            telegram: telegram.trim(),
            github: github.trim(),
            website: website.trim(),
            twitter: twitter.trim(),
            discord: discord.trim(),
          },
        },
      });

      setAccentColor(selectedAccent);
      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 350);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMessage(err?.message || (language === 'ru' ? 'Ошибка сохранения профиля' : 'Failed to save profile changes'));
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in-20">
      <div className="w-full max-w-3xl bg-[#090E17] border border-[#172338] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#142033] bg-[#0C1320]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {language === 'ru' ? 'Кастомизация & Настройка Профиля' : 'Profile Customization'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'ru' ? 'Уникальный аватар, рамка, тема и специализация' : 'Custom avatar, frames, theme and tech stack'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#142033] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Interactive Profile Preview */}
        <div className="relative h-32 sm:h-40 w-full bg-[#080D17] overflow-hidden border-b border-[#142033]">
          <img
            src={bannerUrl || PROFILE_BANNER_PRESETS[0].url}
            alt="Banner Preview"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090E17] via-transparent to-black/30" />

          {/* Quick Banner Upload Button */}
          <button
            type="button"
            onClick={() => bannerFileInputRef.current?.click()}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer shadow-lg"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'ru' ? 'Сменить баннер' : 'Change Banner'}</span>
          </button>
          <input
            ref={bannerFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerFileChange}
            className="hidden"
          />

          {/* Interactive Live Avatar Box */}
          <div className="absolute left-5 -bottom-6 flex items-end gap-3.5">
            <div className="relative group/av">
              <img
                src={getCleanAvatarUrl(handle || displayName, avatarUrl)}
                alt="Avatar Preview"
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-slate-900 transition-all ${currentFrameObj.className}`}
              />
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="absolute inset-0 rounded-2xl bg-black/65 opacity-0 group-hover/av:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer gap-1"
                title={language === 'ru' ? 'Загрузить фото' : 'Upload photo'}
              >
                {isProcessingImage ? (
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] font-bold">{language === 'ru' ? 'Сменить' : 'Change'}</span>
                  </>
                )}
              </button>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#090E17] ${
                  status === 'online'
                    ? 'bg-emerald-400'
                    : status === 'busy'
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="mb-7">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white block truncate max-w-[200px]">
                  {displayName || 'Cyber Operator'}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: `${currentTheme.hex}25`,
                    color: currentTheme.hex,
                    border: `1px solid ${currentTheme.hex}50`,
                  }}
                >
                  @{handle || 'handle'}
                </span>
              </div>
              {customStatus && (
                <p className="text-[11px] text-slate-300 font-mono mt-0.5 truncate max-w-[280px]">
                  {customStatus}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#0B121E] border-b border-[#142033] overflow-x-auto">
          {[
            { id: 'visuals', labelRu: '🖼️ Аватар & Обложка', labelEn: '🖼️ Avatar & Banner', icon: ImageIcon },
            { id: 'style', labelRu: '🎨 Стиль & Рамки', labelEn: '🎨 Frames & Style', icon: Palette },
            { id: 'identity', labelRu: '👤 Основная инфо', labelEn: '👤 Identity & Bio', icon: User },
            { id: 'social', labelRu: '🔗 Стек & Контакты', labelEn: '🔗 Tech & Social', icon: Share2 },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#121B2B]'
                }`}
              >
                <span>{language === 'ru' ? tab.labelRu : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs font-mono text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Form Body with Tabs */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: VISUALS (Avatar Presets, Upload, Banner Presets) */}
          {activeTab === 'visuals' && (
            <div className="space-y-4">
              {/* Avatar Options & Generator Toolbar */}
              <div className="p-3 rounded-2xl bg-[#0B1220] border border-[#17243B] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'ru' ? 'Выбор и загрузка аватара' : 'Avatar Options'}</span>
                    </span>
                    {avatarUrl && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                        {language === 'ru' ? 'Кастомный аватар выбран ✓' : 'Custom Avatar Set ✓'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateRandomAvatar}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Сгенерировать случайный аватар"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{language === 'ru' ? '🎲 Сгенерировать' : '🎲 Randomize'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {isProcessingImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{language === 'ru' ? 'Загрузить фото' : 'Upload photo'}</span>
                    </button>
                  </div>
                </div>

                {/* Avatar Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {AVATAR_PRESET_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAvatarCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                        avatarCategory === cat.id
                          ? 'bg-slate-200 text-slate-950 font-bold'
                          : 'bg-[#070D18] text-slate-400 hover:text-slate-200 border border-[#162338]'
                      }`}
                    >
                      {language === 'ru' ? cat.labelRu : cat.labelEn}
                    </button>
                  ))}
                </div>

                {/* Avatar Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-[#142033]">
                  {filteredAvatarPresets.map((preset) => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                          isSelected
                            ? 'border-emerald-400 scale-105 shadow-[0_0_14px_rgba(52,211,153,0.5)] ring-2 ring-emerald-500/40 z-10'
                            : 'border-[#172338] opacity-75 hover:opacity-100 hover:border-slate-400'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-emerald-500/25 flex items-center justify-center backdrop-blur-[1px]">
                            <Check className="w-5 h-5 text-emerald-300 drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Direct URL input and Reset */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={avatarUrl.startsWith('data:') ? '📸 Загруженное фото (Base64 JPEG)' : avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Или прямая ссылка на аватар: https://..."
                    className="flex-1 px-3 py-1.5 text-xs bg-[#060B14] text-slate-200 border border-[#162338] rounded-xl focus:outline-none focus:border-emerald-400"
                  />
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-xl border border-rose-800/40 cursor-pointer flex items-center gap-1.5 transition-colors"
                      title="Сбросить на автоматический аватар"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'ru' ? 'Сброс' : 'Reset'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Banner Presets */}
              <div className="p-3 rounded-2xl bg-[#0B1220] border border-[#17243B] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    {language === 'ru' ? 'Галерея обложек профиля' : 'Banner Presets'}
                  </label>
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'ru' ? 'Загрузить свой баннер' : 'Upload banner'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PROFILE_BANNER_PRESETS.map((bp) => {
                    const isSelected = bannerUrl === bp.url;
                    return (
                      <div
                        key={bp.id}
                        onClick={() => setBannerUrl(bp.url)}
                        className={`h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative group ${
                          isSelected
                            ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/20 z-10'
                            : 'border-[#172338] opacity-70 hover:opacity-100 hover:border-slate-400'
                        }`}
                      >
                        <img src={bp.url} alt={bp.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] font-semibold text-white text-center py-0.5 truncate px-1">
                          {bp.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STYLE (Frames, Accent Themes, Badges) */}
          {activeTab === 'style' && (
            <div className="space-y-4">
              {/* Avatar Frames */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  {language === 'ru' ? 'Стиль рамки & Эффект аватара' : 'Avatar Frame & Neon Glow'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AVATAR_FRAMES.map((f) => {
                    const isSelected = avatarFrame === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setAvatarFrame(f.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-400 text-white shadow-md'
                            : 'bg-[#0A101C] border-[#18263D] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl overflow-hidden bg-slate-800 ${f.className}`}>
                          <img
                            src={getCleanAvatarUrl(handle || displayName, avatarUrl)}
                            alt="Frame Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-center">
                          {language === 'ru' ? f.labelRu : f.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Themes */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  {language === 'ru' ? 'Цветовой акцент профиля' : 'Profile Accent Theme'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['emerald', 'cyan', 'amber', 'violet', 'lime', 'rose'] as AccentColor[]).map((col) => {
                    const conf = THEME_CONFIGS[col];
                    const isSelected = selectedAccent === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedAccent(col)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? `${conf.borderClass} ${conf.textClass} bg-[#0E1726] shadow-md ring-1 ring-white/20`
                            : 'border-[#172338] bg-[#070C15] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: conf.hex }}
                        />
                        <span className="text-xs font-bold capitalize">{col}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile Badges & Honors */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  {language === 'ru' ? 'Бейджи и специализация' : 'Badges & Titles'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_BADGES.map((b) => {
                    const isSelected = badges.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBadge(b.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-400 text-emerald-300 shadow-sm'
                            : 'bg-[#070C15] border-[#172338] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <span className="text-xs font-bold font-mono block">{b.label}</span>
                            <span className="text-[10px] text-slate-400 block">{b.desc}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IDENTITY & BIO */}
          {activeTab === 'identity' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'ru' ? 'Отображаемое имя' : 'Display Name'}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Cyber Operator"
                    required
                    className="w-full px-3.5 py-2 text-xs bg-[#070C15] text-slate-100 border border-[#172338] rounded-xl focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'ru' ? 'Уникальный никнейм @handle' : 'Unique @handle'}
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="matrix_operator"
                    required
                    className="w-full px-3.5 py-2 text-xs font-mono bg-[#070C15] text-emerald-400 border border-[#172338] rounded-xl focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'ru' ? 'Статус сети' : 'Network Status'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#070C15] text-slate-200 border border-[#172338] rounded-xl focus:outline-none focus:border-emerald-400"
                  >
                    <option value="online">🟢 В сети (Online)</option>
                    <option value="idle">🟡 Отошел (Idle)</option>
                    <option value="busy">🔴 Занят (Busy)</option>
                    <option value="offline">⚪ Не в сети (Offline)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'ru' ? 'Кастомный статус / Девиз' : 'Custom Status'}
                  </label>
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder={language === 'ru' ? 'например: 💻 Кожу на Rust // 🚀 Деплою в облако' : 'e.g. 💻 Coding in Rust // 🚀 Deploying'}
                    className="w-full px-3.5 py-2 text-xs bg-[#070C15] text-slate-200 border border-[#172338] rounded-xl focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {language === 'ru' ? 'О себе / Биография' : 'Bio & About'}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder={language === 'ru' ? 'Расскажите о себе, ваших проектах, технологиях и интересах...' : 'Describe your role, projects and interests...'}
                  className="w-full p-3 text-xs bg-[#070C15] text-slate-200 border border-[#172338] rounded-xl focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {language === 'ru' ? 'Город / Локация' : 'Location'}
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Tokyo // Matrix"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-[#070C15] text-slate-200 border border-[#172338] rounded-xl focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECH STACK & SOCIAL LINKS */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              {/* Tech Stack Chips */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  {language === 'ru' ? 'Стек технологий и навыки' : 'Tech Stack & Skills'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_TECH_STACK.map((tech) => {
                    const isSelected = techStack.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => toggleTech(tech)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                            : 'bg-[#0C1320] text-slate-400 hover:text-white border border-[#18263D]'
                        }`}
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>{tech}</span>
                        {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  {language === 'ru' ? 'Контакты и социальные профили' : 'Social Profiles & Contacts'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">GitHub</label>
                    <div className="relative">
                      <Github className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="github.com/..."
                        className="w-full pl-8 pr-3 py-2 text-xs bg-[#070C15] text-slate-200 border border-[#172338] rounded-xl focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Telegram</label>
                    <div className="relative">
                      <Send className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        placeholder="t.me/username"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-[#070C15] text-slate-200 border border-[#172338] rounded-xl focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      {language === 'ru' ? 'Веб-сайт / Портфолио' : 'Website'}
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://myportfolio.dev"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-[#070C15] text-slate-200 border border-[#172338] rounded-xl focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Discord / Twitter</label>
                    <div className="relative">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        placeholder="username#0000"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-[#070C15] text-slate-200 border border-[#172338] rounded-xl focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#142033] bg-[#0C1320] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-[#142033] transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSaving || isProcessingImage}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{language === 'ru' ? 'Сохранение профиля...' : 'Saving Profile...'}</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>{language === 'ru' ? 'Профиль сохранен!' : 'Profile Saved!'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{language === 'ru' ? 'Сохранить изменения' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
