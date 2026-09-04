import { AccentColor } from '../types';

export interface ThemeConfig {
  name: string;
  hex: string;
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
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500',
    bgLightClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/25',
    borderHoverClass: 'hover:border-emerald-500/50',
    glowClass: 'shadow-sm',
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25',
    accentBgActive: 'bg-emerald-500/15 text-emerald-300',
    ringClass: 'focus:ring-emerald-500/30 focus:border-emerald-500/80',
  },
  cyan: {
    name: 'Titanium Slate',
    hex: '#38BDF8',
    textClass: 'text-sky-400',
    bgClass: 'bg-sky-500',
    bgLightClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/25',
    borderHoverClass: 'hover:border-sky-500/50',
    glowClass: 'shadow-sm',
    badgeClass: 'bg-sky-500/10 text-sky-300 border border-sky-500/25',
    accentBgActive: 'bg-sky-500/15 text-sky-300',
    ringClass: 'focus:ring-sky-500/30 focus:border-sky-500/80',
  },
  amber: {
    name: 'Amber Carbon',
    hex: '#F59E0B',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500',
    bgLightClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/25',
    borderHoverClass: 'hover:border-amber-500/50',
    glowClass: 'shadow-sm',
    badgeClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/25',
    accentBgActive: 'bg-amber-500/15 text-amber-300',
    ringClass: 'focus:ring-amber-500/30 focus:border-amber-500/80',
  },
  violet: {
    name: 'Indigo Studio',
    hex: '#6366F1',
    textClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500',
    bgLightClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/25',
    borderHoverClass: 'hover:border-indigo-500/50',
    glowClass: 'shadow-sm',
    badgeClass: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/25',
    accentBgActive: 'bg-indigo-500/15 text-indigo-300',
    ringClass: 'focus:ring-indigo-500/30 focus:border-indigo-500/80',
  },
  lime: {
    name: 'Sage Modern',
    hex: '#22C55E',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500',
    bgLightClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/25',
    borderHoverClass: 'hover:border-emerald-500/50',
    glowClass: 'shadow-sm',
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25',
    accentBgActive: 'bg-emerald-500/15 text-emerald-300',
    ringClass: 'focus:ring-emerald-500/30 focus:border-emerald-500/80',
  },
  rose: {
    name: 'Crimson Slate',
    hex: '#F43F5E',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-500',
    bgLightClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/25',
    borderHoverClass: 'hover:border-rose-500/50',
    glowClass: 'shadow-sm',
    badgeClass: 'bg-rose-500/10 text-rose-300 border border-rose-500/25',
    accentBgActive: 'bg-rose-500/15 text-rose-300',
    ringClass: 'focus:ring-rose-500/30 focus:border-rose-500/80',
  },
  indigo: {
    name: 'Deep Cobalt',
    hex: '#4F46E5',
    textClass: 'text-indigo-400',
    bgClass: 'bg-indigo-600',
    bgLightClass: 'bg-indigo-600/10',
    borderClass: 'border-indigo-600/25',
    borderHoverClass: 'hover:border-indigo-600/50',
    glowClass: 'shadow-sm',
    badgeClass: 'bg-indigo-600/10 text-indigo-300 border border-indigo-600/25',
    accentBgActive: 'bg-indigo-600/15 text-indigo-300',
    ringClass: 'focus:ring-indigo-600/30 focus:border-indigo-600/80',
  },
  gold: {
    name: 'Platinum Gold',
    hex: '#F59E0B',
    textClass: 'text-amber-300',
    bgClass: 'bg-amber-500',
    bgLightClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    borderHoverClass: 'hover:border-amber-500/60',
    glowClass: 'shadow-sm',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    accentBgActive: 'bg-amber-500/20 text-amber-200',
    ringClass: 'focus:ring-amber-500/40 focus:border-amber-500',
  },
};

