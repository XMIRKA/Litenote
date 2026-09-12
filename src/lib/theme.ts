import {
  AccentColor,
  FontFamily,
  FontSize,
  ThemeBackground,
  BorderRadiusStyle,
  ChatWallpaper,
  GlowIntensity,
  UIThemeSettings,
} from '../types';

export interface ThemeConfig {
  name: string;
  hex: string;
  rgb: string;
  textClass: string;
  bgClass: string;
  bgLightClass: string;
  borderClass: string;
  borderHoverClass: string;
  glowClass: string;
  badgeClass: string;
  accentBgActive: string;
  ringClass: string;
}

export const THEME_CONFIGS: Record<AccentColor, ThemeConfig> = {
  emerald: {
    name: 'Obsidian Emerald',
    hex: '#10B981',
    rgb: '16, 185, 129',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500',
    bgLightClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/40',
    borderHoverClass: 'hover:border-emerald-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    accentBgActive: 'bg-emerald-500/20 text-emerald-300',
    ringClass: 'focus:ring-emerald-500/40 focus:border-emerald-500',
  },
  cyan: {
    name: 'Titanium Cyan',
    hex: '#38BDF8',
    rgb: '56, 189, 248',
    textClass: 'text-sky-400',
    bgClass: 'bg-sky-500',
    bgLightClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/40',
    borderHoverClass: 'hover:border-sky-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(56,189,248,0.35)]',
    badgeClass: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    accentBgActive: 'bg-sky-500/20 text-sky-300',
    ringClass: 'focus:ring-sky-500/40 focus:border-sky-500',
  },
  amber: {
    name: 'Amber Carbon',
    hex: '#F59E0B',
    rgb: '245, 158, 11',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500',
    bgLightClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/40',
    borderHoverClass: 'hover:border-amber-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    accentBgActive: 'bg-amber-500/20 text-amber-300',
    ringClass: 'focus:ring-amber-500/40 focus:border-amber-500',
  },
  violet: {
    name: 'Indigo Studio',
    hex: '#6366F1',
    rgb: '99, 102, 241',
    textClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500',
    bgLightClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/40',
    borderHoverClass: 'hover:border-indigo-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(99,102,241,0.35)]',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    accentBgActive: 'bg-indigo-500/20 text-indigo-300',
    ringClass: 'focus:ring-indigo-500/40 focus:border-indigo-500',
  },
  lime: {
    name: 'Sage Modern',
    hex: '#22C55E',
    rgb: '34, 197, 94',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500',
    bgLightClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/40',
    borderHoverClass: 'hover:border-emerald-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(34,197,94,0.35)]',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    accentBgActive: 'bg-emerald-500/20 text-emerald-300',
    ringClass: 'focus:ring-emerald-500/40 focus:border-emerald-500',
  },
  rose: {
    name: 'Crimson Slate',
    hex: '#F43F5E',
    rgb: '244, 63, 94',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-500',
    bgLightClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/40',
    borderHoverClass: 'hover:border-rose-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(244,63,94,0.35)]',
    badgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    accentBgActive: 'bg-rose-500/20 text-rose-300',
    ringClass: 'focus:ring-rose-500/40 focus:border-rose-500',
  },
  indigo: {
    name: 'Deep Cobalt',
    hex: '#4F46E5',
    rgb: '79, 70, 229',
    textClass: 'text-indigo-400',
    bgClass: 'bg-indigo-600',
    bgLightClass: 'bg-indigo-600/10',
    borderClass: 'border-indigo-600/40',
    borderHoverClass: 'hover:border-indigo-600/70',
    glowClass: 'shadow-[0_0_20px_rgba(79,70,229,0.35)]',
    badgeClass: 'bg-indigo-600/15 text-indigo-300 border border-indigo-600/30',
    accentBgActive: 'bg-indigo-600/20 text-indigo-300',
    ringClass: 'focus:ring-indigo-600/40 focus:border-indigo-600',
  },
  gold: {
    name: 'Platinum Gold',
    hex: '#EAB308',
    rgb: '234, 179, 8',
    textClass: 'text-amber-300',
    bgClass: 'bg-amber-500',
    bgLightClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/40',
    borderHoverClass: 'hover:border-amber-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(234,179,8,0.35)]',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    accentBgActive: 'bg-amber-500/20 text-amber-200',
    ringClass: 'focus:ring-amber-500/40 focus:border-amber-500',
  },
  neon_purple: {
    name: 'Neon Violet',
    hex: '#A855F7',
    rgb: '168, 85, 247',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-500',
    bgLightClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/40',
    borderHoverClass: 'hover:border-purple-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(168,85,247,0.35)]',
    badgeClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    accentBgActive: 'bg-purple-500/20 text-purple-300',
    ringClass: 'focus:ring-purple-500/40 focus:border-purple-500',
  },
  sunset: {
    name: 'Sunset Coral',
    hex: '#FB923C',
    rgb: '251, 146, 60',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-500',
    bgLightClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/40',
    borderHoverClass: 'hover:border-orange-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(251,146,60,0.35)]',
    badgeClass: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    accentBgActive: 'bg-orange-500/20 text-orange-200',
    ringClass: 'focus:ring-orange-500/40 focus:border-orange-500',
  },
  silver: {
    name: 'Titanium Silver',
    hex: '#94A3B8',
    rgb: '148, 163, 184',
    textClass: 'text-slate-300',
    bgClass: 'bg-slate-500',
    bgLightClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/40',
    borderHoverClass: 'hover:border-slate-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(148,163,184,0.35)]',
    badgeClass: 'bg-slate-500/15 text-slate-200 border border-slate-500/30',
    accentBgActive: 'bg-slate-500/20 text-slate-200',
    ringClass: 'focus:ring-slate-500/40 focus:border-slate-400',
  },
  mint: {
    name: 'Mint Frost',
    hex: '#2DD4BF',
    rgb: '45, 212, 191',
    textClass: 'text-teal-300',
    bgClass: 'bg-teal-400',
    bgLightClass: 'bg-teal-400/10',
    borderClass: 'border-teal-400/40',
    borderHoverClass: 'hover:border-teal-400/70',
    glowClass: 'shadow-[0_0_20px_rgba(45,212,191,0.35)]',
    badgeClass: 'bg-teal-400/15 text-teal-200 border border-teal-400/30',
    accentBgActive: 'bg-teal-400/20 text-teal-200',
    ringClass: 'focus:ring-teal-400/40 focus:border-teal-400',
  },
};

export const FONTS_CONFIG: Record<
  FontFamily,
  { name: string; fontCss: string; categoryRu: string; categoryEn: string; sample: string; badge: string }
> = {
  jakarta: {
    name: 'Plus Jakarta Sans',
    fontCss: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    categoryRu: 'Премиум Гротеск (Stripe/Linear)',
    categoryEn: 'Premium Geometric Sans',
    sample: 'Aa Bb 123 • Чистый UI',
    badge: 'Рекомендуемый',
  },
  inter: {
    name: 'Inter Display',
    fontCss: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    categoryRu: 'Универсальный стандарт (Vercel)',
    categoryEn: 'Precision Clean Sans',
    sample: 'Aa Bb 123 • Высокая читаемость',
    badge: 'Стандарт',
  },
  outfit: {
    name: 'Outfit Modern',
    fontCss: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    categoryRu: 'Футуристичный нео-гротеск',
    categoryEn: 'Futuristic Neo-Grotesk',
    sample: 'Aa Bb 123 • Мягкие акценты',
    badge: 'Футуризм',
  },
  space: {
    name: 'Space Grotesk',
    fontCss: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    categoryRu: 'Киберпанк & Техно-дизайн',
    categoryEn: 'Cyberpunk Editorial Tech',
    sample: 'Aa Bb 123 • Cyber Vibe',
    badge: 'Киберпанк',
  },
  jetbrains: {
    name: 'JetBrains Mono',
    fontCss: "'JetBrains Mono', 'Fira Code', monospace",
    categoryRu: 'Терминальный IDE моноширинный',
    categoryEn: 'Developer IDE Monospace',
    sample: 'const token = "cyber_01";',
    badge: 'DevHub',
  },
  fira: {
    name: 'Fira Code',
    fontCss: "'Fira Code', 'JetBrains Mono', monospace",
    categoryRu: 'Программистский моно с лигатурами',
    categoryEn: 'Hacker Code Monospace',
    sample: 'fn connect() => Ok(res)',
    badge: 'Code',
  },
  syne: {
    name: 'Syne Avant-Garde',
    fontCss: "'Syne', -apple-system, BlinkMacSystemFont, sans-serif",
    categoryRu: 'Авангардный выразительный дисплей',
    categoryEn: 'Avant-Garde Expressive Display',
    sample: 'Aa Bb 123 • Авторский стиль',
    badge: 'Дизайн',
  },
  montserrat: {
    name: 'Montserrat Swiss',
    fontCss: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
    categoryRu: 'Плотный швейцарский гротеск',
    categoryEn: 'Swiss Bold Geometric',
    sample: 'Aa Bb 123 • Четкие контуры',
    badge: 'Bold',
  },
  urbanist: {
    name: 'Urbanist Geometric',
    fontCss: "'Urbanist', -apple-system, BlinkMacSystemFont, sans-serif",
    categoryRu: 'Минималистичная геометрия',
    categoryEn: 'Sleek Minimalist Geometric',
    sample: 'Aa Bb 123 • Баланс и легкость',
    badge: 'Минимализм',
  },
  spectral: {
    name: 'Spectral Editorial',
    fontCss: "'Spectral', Georgia, 'Times New Roman', serif",
    categoryRu: 'Элегантный журнальный антиква-сериф',
    categoryEn: 'Editorial Classic Serif',
    sample: 'Aa Bb 123 • Литературный слог',
    badge: 'Сериф',
  },
  cinzel: {
    name: 'Cinzel Luxury',
    fontCss: "'Cinzel', Georgia, serif",
    categoryRu: 'Монументальный римский дисплей',
    categoryEn: 'Monumental Roman Luxury',
    sample: 'LITENOTE • SOVEREIGN',
    badge: 'Премиум',
  },
  system: {
    name: 'Native System UI',
    fontCss: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    categoryRu: 'Нативный системный шрифт ОС',
    categoryEn: 'OS Native System UI',
    sample: 'Aa Bb 123 • Нативный вид',
    badge: 'Нативный',
  },
};

export const FONT_SIZES_CONFIG: Record<
  FontSize,
  { labelRu: string; labelEn: string; scale: string; px: string; desc: string }
> = {
  sm: {
    labelRu: 'Компактный',
    labelEn: 'Compact',
    scale: '0.92',
    px: '14.5px',
    desc: 'Больше контента на экране',
  },
  md: {
    labelRu: 'Стандартный',
    labelEn: 'Standard',
    scale: '1',
    px: '16px',
    desc: 'Оптимальный баланс',
  },
  lg: {
    labelRu: 'Увеличенный',
    labelEn: 'Comfortable',
    scale: '1.08',
    px: '17.5px',
    desc: 'Комфортное чтение',
  },
  xl: {
    labelRu: 'Крупный',
    labelEn: 'Large',
    scale: '1.16',
    px: '19px',
    desc: 'Максимальная четкость',
  },
};

export const BACKGROUNDS_CONFIG: Record<
  ThemeBackground,
  {
    nameRu: string;
    nameEn: string;
    descRu: string;
    rootBg: string;
    surfaceBg: string;
    elevatedBg: string;
    borderColor: string;
  }
> = {
  obsidian: {
    nameRu: 'Глубокий Обсидиан',
    nameEn: 'Midnight Obsidian',
    descRu: 'Оригинальный темный стиль LiteNote',
    rootBg: '#07090E',
    surfaceBg: '#0C121E',
    elevatedBg: '#111728',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  oled: {
    nameRu: 'Истинный OLED Черный',
    nameEn: 'Pure OLED Black',
    descRu: 'Абсолютный #000000 для OLED дисплеев',
    rootBg: '#000000',
    surfaceBg: '#080808',
    elevatedBg: '#101010',
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  sapphire: {
    nameRu: 'Кибер Сапфир',
    nameEn: 'Cyber Sapphire',
    descRu: 'Глубокие темно-синие полуночные оттенки',
    rootBg: '#060E1A',
    surfaceBg: '#0A1628',
    elevatedBg: '#0E1F38',
    borderColor: 'rgba(56, 189, 248, 0.12)',
  },
  graphite: {
    nameRu: 'Углеродный Графит',
    nameEn: 'Carbon Graphite',
    descRu: 'Сдержанный матовый графит (стиль GitHub/Linear)',
    rootBg: '#0D1117',
    surfaceBg: '#161B22',
    elevatedBg: '#21262D',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  twilight: {
    nameRu: 'Ночной Сумрак',
    nameEn: 'Dark Twilight',
    descRu: 'Мягкий темно-серый с глубоким синим отливом',
    rootBg: '#0F172A',
    surfaceBg: '#1E293B',
    elevatedBg: '#334155',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emerald_dark: {
    nameRu: 'Матричная Бездна',
    nameEn: 'Matrix Abyss',
    descRu: 'Глубокий темный хвойно-изумрудный фон',
    rootBg: '#040906',
    surfaceBg: '#08140D',
    elevatedBg: '#0D2015',
    borderColor: 'rgba(16, 185, 129, 0.14)',
  },
};

export const BORDER_RADIUS_CONFIG: Record<
  BorderRadiusStyle,
  { labelRu: string; labelEn: string; radiusPx: string; descRu: string }
> = {
  sharp: {
    labelRu: 'Строгий (6px)',
    labelEn: 'Sharp (6px)',
    radiusPx: '6px',
    descRu: 'Четкие контуры в терминальном стиле',
  },
  balanced: {
    labelRu: 'Элегантный (12px)',
    labelEn: 'Balanced (12px)',
    radiusPx: '12px',
    descRu: 'Идеальный баланс формы и эстетики',
  },
  soft: {
    labelRu: 'Мягкий (18px)',
    labelEn: 'Soft (18px)',
    radiusPx: '18px',
    descRu: 'Плавные закругления в современном стиле',
  },
  pill: {
    labelRu: 'Капсульный (24px)',
    labelEn: 'Pill / Bubble (24px)',
    radiusPx: '24px',
    descRu: 'Ультра-округлые формы в стиле мобильных ОС',
  },
};

export const CHAT_WALLPAPER_CONFIG: Record<
  ChatWallpaper,
  { nameRu: string; nameEn: string; patternClass: string }
> = {
  dots: {
    nameRu: 'Точечная матрица',
    nameEn: 'Matrix Dots',
    patternClass: 'chat-pattern-dots',
  },
  grid: {
    nameRu: 'Кибер сетка',
    nameEn: 'Cyber Grid',
    patternClass: 'chat-pattern-grid',
  },
  mesh: {
    nameRu: 'Аврора Градиент',
    nameEn: 'Aurora Mesh',
    patternClass: 'chat-pattern-mesh',
  },
  circuit: {
    nameRu: 'Микросхема',
    nameEn: 'Cyber Circuit',
    patternClass: 'chat-pattern-circuit',
  },
  scanlines: {
    nameRu: 'Сканлайн ЭЛТ',
    nameEn: 'CRT Scanlines',
    patternClass: 'chat-pattern-scanlines',
  },
  clean: {
    nameRu: 'Чистый монолит',
    nameEn: 'Clean Minimal',
    patternClass: 'chat-pattern-clean',
  },
};

export const THEME_PRESETS: {
  id: string;
  name: string;
  descRu: string;
  descEn: string;
  badge: string;
  settings: UIThemeSettings;
}[] = [
  {
    id: 'cyber_matrix',
    name: 'Cyber Matrix',
    descRu: 'Изумрудный неон, терминальный JetBrains Mono и кибер-сетка',
    descEn: 'Emerald neon with terminal code typography and cyber grid',
    badge: 'Matrix',
    settings: {
      accentColor: 'emerald',
      fontFamily: 'jetbrains',
      fontSize: 'md',
      themeBackground: 'emerald_dark',
      borderRadius: 'sharp',
      chatWallpaper: 'grid',
      glowIntensity: 'vibrant',
      reduceMotion: false,
    },
  },
  {
    id: 'oled_stealth',
    name: 'OLED Stealth',
    descRu: 'Истинный черный #000000, титановый акцент и чистые контуры',
    descEn: 'Pure OLED black #000000 with titanium silver for battery saving',
    badge: 'OLED',
    settings: {
      accentColor: 'silver',
      fontFamily: 'inter',
      fontSize: 'md',
      themeBackground: 'oled',
      borderRadius: 'balanced',
      chatWallpaper: 'clean',
      glowIntensity: 'none',
      reduceMotion: false,
    },
  },
  {
    id: 'indigo_linear',
    name: 'Indigo Linear',
    descRu: 'Эстетика ведущих IT-студий: Plus Jakarta Sans и глубокий индиго',
    descEn: 'Modern tech studio aesthetics with crisp indigo accents',
    badge: 'Linear',
    settings: {
      accentColor: 'violet',
      fontFamily: 'jakarta',
      fontSize: 'md',
      themeBackground: 'obsidian',
      borderRadius: 'balanced',
      chatWallpaper: 'dots',
      glowIntensity: 'subtle',
      reduceMotion: false,
    },
  },
  {
    id: 'neon_tokyo',
    name: 'Neon Tokyo',
    descRu: 'Футуристичный пурпур, шрифт Outfit и градиентная аврора',
    descEn: 'Vibrant neon purple futuristic styling with aurora pattern',
    badge: 'Tokyo',
    settings: {
      accentColor: 'neon_purple',
      fontFamily: 'outfit',
      fontSize: 'md',
      themeBackground: 'sapphire',
      borderRadius: 'soft',
      chatWallpaper: 'mesh',
      glowIntensity: 'vibrant',
      reduceMotion: false,
    },
  },
  {
    id: 'amber_carbon',
    name: 'Amber Carbon',
    descRu: 'Благородный теплый янтарь на матовом графитовом фоне',
    descEn: 'Warm amber glow on carbon graphite background',
    badge: 'Warm',
    settings: {
      accentColor: 'amber',
      fontFamily: 'space',
      fontSize: 'md',
      themeBackground: 'graphite',
      borderRadius: 'balanced',
      chatWallpaper: 'dots',
      glowIntensity: 'subtle',
      reduceMotion: false,
    },
  },
  {
    id: 'mint_frost',
    name: 'Mint Frost',
    descRu: 'Свежий мятный акцент, Urbanist геометрия и точечный паттерн',
    descEn: 'Fresh teal mint accent with sleek geometric typography',
    badge: 'Fresh',
    settings: {
      accentColor: 'mint',
      fontFamily: 'urbanist',
      fontSize: 'md',
      themeBackground: 'obsidian',
      borderRadius: 'soft',
      chatWallpaper: 'dots',
      glowIntensity: 'subtle',
      reduceMotion: false,
    },
  },
  {
    id: 'editorial_roman',
    name: 'Roman Empire',
    descRu: 'Монументальный Cinzel с золотыми акцентами и роскошным стилем',
    descEn: 'Monumental Cinzel typography with gold accent luxury',
    badge: 'Luxury',
    settings: {
      accentColor: 'gold',
      fontFamily: 'cinzel',
      fontSize: 'md',
      themeBackground: 'oled',
      borderRadius: 'sharp',
      chatWallpaper: 'circuit',
      glowIntensity: 'vibrant',
      reduceMotion: false,
    },
  },
  {
    id: 'crimson_syne',
    name: 'Avant Crimson',
    descRu: 'Выразительный Syne, пламенный алый акцент и неоновая динамика',
    descEn: 'Expressive Syne avant-garde font with crimson flare',
    badge: 'Avant',
    settings: {
      accentColor: 'rose',
      fontFamily: 'syne',
      fontSize: 'md',
      themeBackground: 'twilight',
      borderRadius: 'pill',
      chatWallpaper: 'scanlines',
      glowIntensity: 'vibrant',
      reduceMotion: false,
    },
  },
];

export const DEFAULT_UI_THEME: UIThemeSettings = {
  accentColor: 'emerald',
  fontFamily: 'jakarta',
  fontSize: 'md',
  themeBackground: 'obsidian',
  borderRadius: 'balanced',
  chatWallpaper: 'dots',
  glowIntensity: 'subtle',
  reduceMotion: false,
};

/**
 * Injects dynamic CSS variables into document.documentElement
 * allowing the entire DOM, Tailwind variables, typography and custom styling to adapt immediately.
 */
export function applyThemeToDocument(
  color: AccentColor,
  settings?: Partial<UIThemeSettings>
) {
  if (typeof document === 'undefined') return;

  const activeColor = color || settings?.accentColor || 'emerald';
  const conf = THEME_CONFIGS[activeColor] || THEME_CONFIGS.emerald;

  const fontKey = settings?.fontFamily || 'jakarta';
  const fontObj = FONTS_CONFIG[fontKey] || FONTS_CONFIG.jakarta;

  const sizeKey = settings?.fontSize || 'md';
  const sizeObj = FONT_SIZES_CONFIG[sizeKey] || FONT_SIZES_CONFIG.md;

  const bgKey = settings?.themeBackground || 'obsidian';
  const bgObj = BACKGROUNDS_CONFIG[bgKey] || BACKGROUNDS_CONFIG.obsidian;

  const radiusKey = settings?.borderRadius || 'balanced';
  const radiusObj = BORDER_RADIUS_CONFIG[radiusKey] || BORDER_RADIUS_CONFIG.balanced;

  const glowKey = settings?.glowIntensity || 'subtle';

  const root = document.documentElement;

  // Set data attributes for easy CSS styling
  root.setAttribute('data-theme', activeColor);
  root.setAttribute('data-font', fontKey);
  root.setAttribute('data-font-size', sizeKey);
  root.setAttribute('data-bg', bgKey);
  root.setAttribute('data-radius', radiusKey);
  root.setAttribute('data-glow', glowKey);
  root.setAttribute('data-chat-pattern', settings?.chatWallpaper || 'dots');

  if (settings?.reduceMotion) {
    root.setAttribute('data-reduce-motion', 'true');
  } else {
    root.removeAttribute('data-reduce-motion');
  }

  // Inject CSS custom properties
  root.style.setProperty('--font-sans', fontObj.fontCss);
  root.style.setProperty('--ui-scale', sizeObj.scale);
  root.style.setProperty('--ui-radius-base', radiusObj.radiusPx);

  root.style.setProperty('--theme-accent', conf.hex);
  root.style.setProperty('--theme-accent-rgb', conf.rgb);

  if (glowKey === 'none') {
    root.style.setProperty('--theme-accent-glow', 'none');
  } else if (glowKey === 'vibrant') {
    root.style.setProperty('--theme-accent-glow', `0 0 28px rgba(${conf.rgb}, 0.65)`);
  } else {
    root.style.setProperty('--theme-accent-glow', `0 0 20px rgba(${conf.rgb}, 0.38)`);
  }

  root.style.setProperty('--theme-accent-subtle', `rgba(${conf.rgb}, 0.12)`);
  root.style.setProperty('--theme-accent-border', `rgba(${conf.rgb}, 0.40)`);

  // Background and surface colors
  root.style.setProperty('--theme-bg-root', bgObj.rootBg);
  root.style.setProperty('--theme-bg-surface', bgObj.surfaceBg);
  root.style.setProperty('--theme-bg-elevated', bgObj.elevatedBg);
  root.style.setProperty('--theme-border-color', bgObj.borderColor);

  // Apply root background and font family directly
  if (document.body) {
    document.body.style.backgroundColor = bgObj.rootBg;
    document.body.style.fontFamily = fontObj.fontCss;
  }
}


