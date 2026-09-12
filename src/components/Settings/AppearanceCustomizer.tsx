import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  THEME_CONFIGS,
  FONTS_CONFIG,
  FONT_SIZES_CONFIG,
  BACKGROUNDS_CONFIG,
  BORDER_RADIUS_CONFIG,
  CHAT_WALLPAPER_CONFIG,
  THEME_PRESETS,
  DEFAULT_UI_THEME,
} from '../../lib/theme';
import {
  AccentColor,
  FontFamily,
  FontSize,
  ThemeBackground,
  BorderRadiusStyle,
  ChatWallpaper,
  GlowIntensity,
} from '../../types';
import {
  Palette,
  Type,
  Maximize2,
  Sparkles,
  Layers,
  Wallpaper,
  Check,
  RotateCcw,
  Sliders,
  Terminal,
  Moon,
  Flame,
  Zap,
  Activity,
  Heart,
  Send,
  MessageSquare,
  Feather,
  Crown,
  Compass,
} from 'lucide-react';

const PRESET_ICONS: Record<string, React.ReactNode> = {
  cyber_matrix: <Terminal className="w-4 h-4 text-emerald-400" />,
  oled_stealth: <Moon className="w-4 h-4 text-slate-300" />,
  indigo_linear: <Layers className="w-4 h-4 text-indigo-400" />,
  neon_tokyo: <Sparkles className="w-4 h-4 text-purple-400" />,
  amber_carbon: <Flame className="w-4 h-4 text-amber-400" />,
  mint_frost: <Compass className="w-4 h-4 text-teal-400" />,
  editorial_roman: <Crown className="w-4 h-4 text-amber-300" />,
  crimson_syne: <Feather className="w-4 h-4 text-rose-400" />,
};

export const AppearanceCustomizer: React.FC = () => {
  const { themeSettings, setThemeSettings, applyPreset, resetThemeSettings, language } = useAuth();

  const isRu = language === 'ru';
  const currentAccent = THEME_CONFIGS[themeSettings.accentColor] || THEME_CONFIGS.emerald;

  const accentKeys: AccentColor[] = [
    'emerald',
    'cyan',
    'mint',
    'amber',
    'gold',
    'sunset',
    'rose',
    'neon_purple',
    'violet',
    'indigo',
    'lime',
    'silver',
  ];

  const fontKeys: FontFamily[] = [
    'jakarta',
    'inter',
    'outfit',
    'space',
    'jetbrains',
    'fira',
    'syne',
    'montserrat',
    'urbanist',
    'spectral',
    'cinzel',
    'system',
  ];

  const fontSizeKeys: FontSize[] = ['sm', 'md', 'lg', 'xl'];

  const backgroundKeys: ThemeBackground[] = [
    'obsidian',
    'oled',
    'emerald_dark',
    'sapphire',
    'graphite',
    'twilight',
  ];

  const radiusKeys: BorderRadiusStyle[] = ['sharp', 'balanced', 'soft', 'pill'];

  const wallpaperKeys: ChatWallpaper[] = ['dots', 'grid', 'circuit', 'scanlines', 'mesh', 'clean'];

  const glowKeys: GlowIntensity[] = ['none', 'subtle', 'vibrant'];

  return (
    <div className="space-y-6">
      {/* 1. Interactive Real-time Preview Banner */}
      <div className="p-5 rounded-2xl bg-[#080D1A]/90 border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{
                backgroundColor: `${currentAccent.hex}18`,
                color: currentAccent.hex,
                boxShadow: `0 0 12px ${currentAccent.hex}30`,
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                {isRu ? 'Интерактивный предпросмотр темы' : 'Real-Time Theme Preview'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isRu
                  ? 'Все изменения применяются ко всему интерфейсу мгновенно'
                  : 'All changes are applied across the entire platform instantly'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetThemeSettings}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
            title={isRu ? 'Сбросить все настройки на базовые' : 'Reset to defaults'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isRu ? 'Сброс' : 'Reset'}</span>
          </button>
        </div>

        {/* Live Mini Components Simulation */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card Mockup */}
          <div className="p-3.5 rounded-xl bg-[#0F172A]/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                  style={{ backgroundColor: currentAccent.hex }}
                >
                  LN
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block leading-tight">
                    LiteNote System
                  </span>
                  <span className="text-[10px] text-slate-400">@litenote</span>
                </div>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                style={{
                  backgroundColor: `${currentAccent.hex}18`,
                  borderColor: `${currentAccent.hex}40`,
                  color: currentAccent.hex,
                }}
              >
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isRu
                ? 'Свободный обмен мыслями, чистый код и суверенное общение.'
                : 'Free thoughts, clean code, and sovereign communications.'}
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" /> 142
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> 28
              </span>
            </div>
          </div>

          {/* Chat Bubble Mockup */}
          <div className="p-3.5 rounded-xl bg-[#0B101D] border border-white/10 space-y-2 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-start">
                <div className="p-2 rounded-lg bg-[#162032] border border-white/5 text-slate-200 text-xs max-w-[85%]">
                  {isRu ? 'Привет! Как тебе новый стиль?' : 'Hey! How do you like the new style?'}
                </div>
              </div>
              <div className="flex justify-end">
                <div
                  className="p-2 rounded-lg text-xs max-w-[85%] text-white font-medium"
                  style={{
                    backgroundColor: currentAccent.hex,
                    boxShadow: `0 2px 10px ${currentAccent.hex}40`,
                  }}
                >
                  {isRu ? 'Выглядит потрясающе и очень плавно!' : 'Looks crisp and ultra smooth!'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <input
                type="text"
                disabled
                placeholder={isRu ? 'Написать сообщение...' : 'Write message...'}
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-400"
              />
              <button
                type="button"
                className="p-1.5 rounded-lg text-white"
                style={{ backgroundColor: currentAccent.hex }}
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Control Elements Mockup */}
          <div className="p-3.5 rounded-xl bg-[#0F172A]/80 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {isRu ? 'Элементы управления' : 'Interactive Controls'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-transform active:scale-95 shadow-md"
                  style={{
                    backgroundColor: currentAccent.hex,
                    boxShadow: `0 0 14px ${currentAccent.hex}40`,
                  }}
                >
                  {isRu ? 'Основная кнопка' : 'Primary Button'}
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                  style={{
                    borderColor: `${currentAccent.hex}50`,
                    color: currentAccent.hex,
                    backgroundColor: `${currentAccent.hex}10`,
                  }}
                >
                  {isRu ? 'Контур' : 'Outlined'}
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>{isRu ? 'Шрифт:' : 'Font:'}</span>
              <span className="font-mono text-white text-[10px] font-semibold">
                {FONTS_CONFIG[themeSettings.fontFamily]?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ready-to-Use 1-Click Theme Presets */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Sparkles className="w-4 h-4" style={{ color: currentAccent.hex }} />
            <span>{isRu ? 'Готовые дизайнерские пресеты (1 клик)' : 'Curated Theme Presets'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {isRu ? 'Быстрая смена стиля' : 'Instant style switch'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {THEME_PRESETS.map((preset) => {
            const isPresetActive =
              themeSettings.accentColor === preset.settings.accentColor &&
              themeSettings.themeBackground === preset.settings.themeBackground &&
              themeSettings.fontFamily === preset.settings.fontFamily;

            const pAccent = THEME_CONFIGS[preset.settings.accentColor];

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                style={
                  isPresetActive
                    ? {
                        borderColor: pAccent.hex,
                        backgroundColor: `${pAccent.hex}12`,
                        boxShadow: `0 0 16px ${pAccent.hex}25`,
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer group relative active:scale-[0.98] ${
                  isPresetActive
                    ? 'border-current'
                    : 'border-[#1E293B] bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                      {PRESET_ICONS[preset.id] || (
                        <Sparkles className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-white transition-colors">
                      {preset.name}
                    </span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-semibold border"
                    style={{
                      borderColor: `${pAccent.hex}40`,
                      color: pAccent.hex,
                      backgroundColor: `${pAccent.hex}15`,
                    }}
                  >
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {isRu ? preset.descRu : preset.descEn}
                </p>
                <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: pAccent.hex }}
                  />
                  <span className="text-[10px] text-slate-400 font-mono">{pAccent.name}</span>
                  {isPresetActive && (
                    <span className="ml-auto text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> {isRu ? 'Активен' : 'Active'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Accent Color Palette */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Palette className="w-4 h-4" style={{ color: currentAccent.hex }} />
            <span>{isRu ? 'Цветовой акцент интерфейса' : 'Color Palette & Accent'}</span>
          </div>
          <span
            className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5"
            style={{
              borderColor: `${currentAccent.hex}50`,
              backgroundColor: `${currentAccent.hex}15`,
              color: currentAccent.hex,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentAccent.hex }} />
            {currentAccent.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {accentKeys.map((col) => {
            const conf = THEME_CONFIGS[col];
            const isSelected = themeSettings.accentColor === col;
            return (
              <button
                key={col}
                type="button"
                onClick={() => setThemeSettings({ accentColor: col })}
                style={
                  isSelected
                    ? {
                        borderColor: conf.hex,
                        backgroundColor: `${conf.hex}18`,
                        boxShadow: `0 0 16px rgba(${conf.rgb}, 0.35)`,
                      }
                    : undefined
                }
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer group active:scale-95 ${
                  isSelected
                    ? 'border-current'
                    : 'border-[#1E293B] hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full shadow-md flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: conf.hex }}
                >
                  {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                </div>
                <span
                  className={`text-[11px] text-center truncate w-full transition-colors ${
                    isSelected
                      ? 'text-white font-bold'
                      : 'text-slate-400 group-hover:text-slate-200 font-medium'
                  }`}
                >
                  {conf.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Typography & Font Family Selection */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Type className="w-4 h-4" style={{ color: currentAccent.hex }} />
            <span>{isRu ? 'Гарнитура шрифта (Шрифты)' : 'Typography & Font Family'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {FONTS_CONFIG[themeSettings.fontFamily]?.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {fontKeys.map((fKey) => {
            const fontObj = FONTS_CONFIG[fKey];
            const isSelected = themeSettings.fontFamily === fKey;
            return (
              <button
                key={fKey}
                type="button"
                onClick={() => setThemeSettings({ fontFamily: fKey })}
                style={
                  isSelected
                    ? {
                        borderColor: currentAccent.hex,
                        backgroundColor: `${currentAccent.hex}12`,
                        boxShadow: `0 0 14px ${currentAccent.hex}20`,
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer group active:scale-[0.98] ${
                  isSelected
                    ? 'border-current'
                    : 'border-[#1E293B] bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className="text-xs font-bold text-white group-hover:text-white"
                    style={{ fontFamily: fontObj.fontCss }}
                  >
                    {fontObj.name}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-semibold border"
                    style={{
                      borderColor: isSelected ? `${currentAccent.hex}40` : 'rgba(255,255,255,0.06)',
                      backgroundColor: isSelected ? `${currentAccent.hex}18` : 'rgba(255,255,255,0.04)',
                      color: isSelected ? currentAccent.hex : '#94A3B8',
                    }}
                  >
                    {fontObj.badge}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {isRu ? fontObj.categoryRu : fontObj.categoryEn}
                </div>
                <div
                  className="text-sm text-slate-200 py-1.5 px-2 rounded-lg bg-black/30 border border-white/5 font-normal tracking-wide"
                  style={{ fontFamily: fontObj.fontCss }}
                >
                  {fontObj.sample}
                </div>
                {isSelected && (
                  <div
                    className="flex items-center gap-1 text-[10px] font-semibold pt-1 border-t border-white/5"
                    style={{ color: currentAccent.hex }}
                  >
                    <Check className="w-3 h-3" /> {isRu ? 'Текущий шрифт системы' : 'Active System Font'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Font Scaling & Interface Size */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Maximize2 className="w-4 h-4" style={{ color: currentAccent.hex }} />
            <span>{isRu ? 'Масштаб шрифта и плотность интерфейса' : 'Text & Interface Scale'}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {FONT_SIZES_CONFIG[themeSettings.fontSize]?.scale === '1'
              ? '100% (Default)'
              : `${Math.round(Number(FONT_SIZES_CONFIG[themeSettings.fontSize]?.scale) * 100)}%`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {fontSizeKeys.map((sKey) => {
            const sizeObj = FONT_SIZES_CONFIG[sKey];
            const isSelected = themeSettings.fontSize === sKey;
            return (
              <button
                key={sKey}
                type="button"
                onClick={() => setThemeSettings({ fontSize: sKey })}
                style={
                  isSelected
                    ? {
                        borderColor: currentAccent.hex,
                        backgroundColor: `${currentAccent.hex}15`,
                        color: '#FFFFFF',
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'font-bold border-current shadow-sm'
                    : 'border-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <span className="text-xs font-semibold">{isRu ? sizeObj.labelRu : sizeObj.labelEn}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {Math.round(Number(sizeObj.scale) * 100)}% ({sizeObj.px})
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">{sizeObj.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Background Atmosphere & Surface Tones */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Layers className="w-4 h-4" style={{ color: currentAccent.hex }} />
            <span>{isRu ? 'Фоновая атмосфера и подложки' : 'Background Canvas & Surfaces'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {BACKGROUNDS_CONFIG[themeSettings.themeBackground]?.nameEn}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {backgroundKeys.map((bKey) => {
            const bgObj = BACKGROUNDS_CONFIG[bKey];
            const isSelected = themeSettings.themeBackground === bKey;
            return (
              <button
                key={bKey}
                type="button"
                onClick={() => setThemeSettings({ themeBackground: bKey })}
                style={
                  isSelected
                    ? {
                        borderColor: currentAccent.hex,
                        boxShadow: `0 0 14px ${currentAccent.hex}25`,
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group active:scale-[0.98] ${
                  isSelected
                    ? 'border-current'
                    : 'border-[#1E293B] bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">
                    {isRu ? bgObj.nameRu : bgObj.nameEn}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="w-5 h-5 rounded border border-white/10"
                    style={{ backgroundColor: bgObj.rootBg }}
                    title="Root Background"
                  />
                  <div
                    className="w-5 h-5 rounded border border-white/10"
                    style={{ backgroundColor: bgObj.surfaceBg }}
                    title="Surface Card"
                  />
                  <div
                    className="w-5 h-5 rounded border border-white/10"
                    style={{ backgroundColor: bgObj.elevatedBg }}
                    title="Elevated Modal"
                  />
                  <span className="text-[10px] font-mono text-slate-500 ml-1">{bgObj.rootBg}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight line-clamp-2">
                  {bgObj.descRu}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Corner Radius / Geometry Styles */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Sliders className="w-4 h-4" style={{ color: currentAccent.hex }} />
            <span>{isRu ? 'Геометрия и скругление углов' : 'Border Radius & Geometry'}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {BORDER_RADIUS_CONFIG[themeSettings.borderRadius]?.radiusPx}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {radiusKeys.map((rKey) => {
            const rObj = BORDER_RADIUS_CONFIG[rKey];
            const isSelected = themeSettings.borderRadius === rKey;
            return (
              <button
                key={rKey}
                type="button"
                onClick={() => setThemeSettings({ borderRadius: rKey })}
                style={
                  isSelected
                    ? {
                        borderColor: currentAccent.hex,
                        backgroundColor: `${currentAccent.hex}14`,
                        color: '#FFFFFF',
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'font-bold border-current'
                    : 'border-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div
                  className="w-8 h-8 border-2 border-dashed border-current flex items-center justify-center"
                  style={{ borderRadius: rObj.radiusPx }}
                />
                <span className="text-xs font-semibold">{isRu ? rObj.labelRu : rObj.labelEn}</span>
                <span className="text-[10px] text-slate-500 line-clamp-1">{rObj.descRu}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. Chat Wallpaper Pattern & Glow / Motion Extras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chat Wallpaper */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Wallpaper className="w-4 h-4" style={{ color: currentAccent.hex }} />
            <span>{isRu ? 'Фоновый узор чатов' : 'Chat Wallpaper Pattern'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {wallpaperKeys.map((wKey) => {
              const wObj = CHAT_WALLPAPER_CONFIG[wKey];
              const isSelected = themeSettings.chatWallpaper === wKey;
              return (
                <button
                  key={wKey}
                  type="button"
                  onClick={() => setThemeSettings({ chatWallpaper: wKey })}
                  style={
                    isSelected
                      ? {
                          borderColor: currentAccent.hex,
                          backgroundColor: `${currentAccent.hex}14`,
                          color: '#FFFFFF',
                        }
                      : undefined
                  }
                  className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'font-semibold border-current'
                      : 'border-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <span>{isRu ? wObj.nameRu : wObj.nameEn}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Glow Intensity & Motion Mode */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Zap className="w-4 h-4" style={{ color: currentAccent.hex }} />
            <span>{isRu ? 'Свечение акцентов и анимации' : 'Accent Glow & Performance'}</span>
          </div>

          <div className="space-y-2.5">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">
                {isRu ? 'Интенсивность неонового свечения:' : 'Accent Glow Intensity:'}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {glowKeys.map((gKey) => {
                  const isSelected = themeSettings.glowIntensity === gKey;
                  const label =
                    gKey === 'none'
                      ? isRu
                        ? 'Выкл'
                        : 'Off'
                      : gKey === 'subtle'
                      ? isRu
                        ? 'Мягкий'
                        : 'Subtle'
                      : isRu
                      ? 'Яркий'
                      : 'Vibrant';
                  return (
                    <button
                      key={gKey}
                      type="button"
                      onClick={() => setThemeSettings({ glowIntensity: gKey })}
                      style={
                        isSelected
                          ? {
                              borderColor: currentAccent.hex,
                              backgroundColor: `${currentAccent.hex}14`,
                              color: '#FFFFFF',
                            }
                          : undefined
                      }
                      className={`p-2 rounded-lg border text-xs text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'font-semibold border-current'
                          : 'border-[#1E293B] text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reduce Motion Toggle */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  {isRu ? 'Режим экономии (Без анимаций)' : 'Reduce Motion Mode'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isRu ? 'Отключает плавные переходы для экономии ресурсов' : 'Disables transitions for speed'}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setThemeSettings({ reduceMotion: !themeSettings.reduceMotion })
                }
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  themeSettings.reduceMotion ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    themeSettings.reduceMotion ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
