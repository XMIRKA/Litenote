import { AccentColor } from '../types';

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
    name: 'Titanium Slate',
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
    hex: '#F59E0B',
    rgb: '245, 158, 11',
    textClass: 'text-amber-300',
    bgClass: 'bg-amber-500',
    bgLightClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/40',
    borderHoverClass: 'hover:border-amber-500/70',
    glowClass: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    accentBgActive: 'bg-amber-500/20 text-amber-200',
    ringClass: 'focus:ring-amber-500/40 focus:border-amber-500',
  },
};

/**
 * Injects dynamic CSS variables into document.documentElement
 * allowing the entire DOM, Tailwind variables and custom styling to adapt immediately.
 */
export function applyThemeToDocument(color: AccentColor) {
  if (typeof document === 'undefined') return;
  const conf = THEME_CONFIGS[color] || THEME_CONFIGS.emerald;
  const root = document.documentElement;
  root.setAttribute('data-theme', color);
  root.style.setProperty('--theme-accent', conf.hex);
  root.style.setProperty('--theme-accent-rgb', conf.rgb);
  root.style.setProperty('--theme-accent-glow', `rgba(${conf.rgb}, 0.38)`);
  root.style.setProperty('--theme-accent-subtle', `rgba(${conf.rgb}, 0.12)`);
  root.style.setProperty('--theme-accent-border', `rgba(${conf.rgb}, 0.40)`);
}

