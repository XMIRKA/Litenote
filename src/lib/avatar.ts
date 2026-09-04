/**
 * Professional, sleek avatar generator for Litenote.
 * Provides custom avatar presets, dynamic generative avatars, and custom profile frames.
 */

export interface AvatarPreset {
  id: string;
  category: 'cyber' | 'tech3d' | 'portraits' | 'anime' | 'gradients';
  name: string;
  url: string;
}

export const AVATAR_PRESET_CATEGORIES = [
  { id: 'all', labelRu: 'Все', labelEn: 'All' },
  { id: 'cyber', labelRu: '⚡ Киберпанк & Matrix', labelEn: '⚡ Cyberpunk & Matrix' },
  { id: 'tech3d', labelRu: '🧑‍💻 3D Разработчики', labelEn: '🧑‍💻 3D Developers' },
  { id: 'portraits', labelRu: '📸 Портреты', labelEn: '📸 Tech Portraits' },
  { id: 'anime', labelRu: '👾 Пиксель & Аниме', labelEn: '👾 Pixel & Anime' },
  { id: 'gradients', labelRu: '🎨 Градиенты', labelEn: '🎨 Abstract Gradients' },
] as const;

export const CUSTOM_AVATAR_PRESETS: AvatarPreset[] = [
  // Cyber & Matrix
  {
    id: 'cyber_neo',
    category: 'cyber',
    name: 'Neo Operator',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cyber_glitch',
    category: 'cyber',
    name: 'Glitch Runner',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cyber_synth',
    category: 'cyber',
    name: 'Synthwave Pilot',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cyber_samurai',
    category: 'cyber',
    name: 'Cyber Samurai',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cyber_hacker',
    category: 'cyber',
    name: 'Zero Day',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
  },

  // Tech 3D & Notionist
  {
    id: 'dev_3d_1',
    category: 'tech3d',
    name: 'Cloud Architect',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=0284c7,0f172a,1e1b4b',
  },
  {
    id: 'dev_3d_2',
    category: 'tech3d',
    name: 'Fullstack Dev',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver&backgroundColor=059669,0f172a,1e1b4b',
  },
  {
    id: 'dev_3d_3',
    category: 'tech3d',
    name: 'UI/UX Creator',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sophia&backgroundColor=7c3aed,0f172a,1e1b4b',
  },
  {
    id: 'dev_3d_4',
    category: 'tech3d',
    name: 'AI Researcher',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=d97706,0f172a,1e1b4b',
  },
  {
    id: 'dev_3d_5',
    category: 'tech3d',
    name: 'Security Ops',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus&backgroundColor=dc2626,0f172a,1e1b4b',
  },
  {
    id: 'dev_3d_6',
    category: 'tech3d',
    name: 'DevOps Guru',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Elena&backgroundColor=0d9488,0f172a,1e1b4b',
  },

  // Realistic Tech Portraits
  {
    id: 'portrait_1',
    category: 'portraits',
    name: 'Tech Lead',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'portrait_2',
    category: 'portraits',
    name: 'Senior Engineer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'portrait_3',
    category: 'portraits',
    name: 'Product Designer',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'portrait_4',
    category: 'portraits',
    name: 'Backend Dev',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'portrait_5',
    category: 'portraits',
    name: 'Mobile Creator',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  },

  // Anime & Pixel
  {
    id: 'anime_1',
    category: 'anime',
    name: 'Cyber Blade',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Shadow&backgroundColor=0f172a,1e1b4b',
  },
  {
    id: 'anime_2',
    category: 'anime',
    name: 'Neo Runner',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kira&backgroundColor=022c22,0f172a',
  },
  {
    id: 'anime_3',
    category: 'anime',
    name: 'Pixel Hacker',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=MatrixHacker',
  },
  {
    id: 'anime_4',
    category: 'anime',
    name: 'Retro Coder',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=CyberGhost',
  },

  // Gradients & Abstract
  {
    id: 'grad_1',
    category: 'gradients',
    name: 'Emerald Core',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'grad_2',
    category: 'gradients',
    name: 'Tokyo Violet',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'grad_3',
    category: 'gradients',
    name: 'Solar Flare',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&auto=format&fit=crop&q=80',
  },
];

export const PROFILE_BANNER_PRESETS = [
  {
    id: 'matrix_code',
    name: 'Matrix Code',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'cyber_grid',
    name: 'Cyberpunk Grid',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'deep_space',
    name: 'Deep Cosmos',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'synth_wave',
    name: 'Synthwave Horizon',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'tech_hardware',
    name: 'Quantum Circuit',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'minimal_dark',
    name: 'Dark Studio',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80',
  },
];

export const AVATAR_FRAMES = [
  { id: 'none', labelRu: 'Без рамки', labelEn: 'Default', className: 'border border-slate-700/60' },
  { id: 'cyber_glow', labelRu: '⚡ Неоновое сияние', labelEn: '⚡ Cyber Glow', className: 'border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]' },
  { id: 'hologram', labelRu: '💎 Голограмма', labelEn: '💎 Hologram', className: 'border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.45)] ring-2 ring-cyan-500/20' },
  { id: 'tokyo_violet', labelRu: '🔮 Токио Неон', labelEn: '🔮 Tokyo Violet', className: 'border-2 border-violet-500 shadow-[0_0_15px_rgba(167,139,250,0.45)]' },
  { id: 'matrix_green', labelRu: '📟 Matrix Terminal', labelEn: '📟 Matrix Hex', className: 'border-2 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.4)] ring-1 ring-lime-500/30' },
  { id: 'gold_elite', labelRu: '👑 Gold Master', labelEn: '👑 Gold Master', className: 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.45)] ring-2 ring-amber-500/20' },
  { id: 'rose_flare', labelRu: '🔥 Cyber Rose', labelEn: '🔥 Cyber Rose', className: 'border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.45)]' },
] as const;

export const POPULAR_TECH_STACK = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust', 'Docker',
  'PostgreSQL', 'TailwindCSS', 'Next.js', 'Kubernetes', 'AI/LLMs', 'Linux', 'Solidity', 'GraphQL'
];

/**
 * Returns a high-definition clean avatar URL for any user without falling back to ugly text-only initials.
 */
export function getCleanAvatarUrl(seed?: string, photoUrl?: string | null): string {
  // If photoUrl is set, valid, and not broken initials/bottts:
  if (
    photoUrl &&
    photoUrl.trim() !== '' &&
    !photoUrl.includes('dicebear.com/7.x/bottts') &&
    !photoUrl.includes('dicebear.com/7.x/initials')
  ) {
    return photoUrl;
  }

  const cleanSeed = (seed || 'user').trim().toLowerCase().replace(/^@/, '') || 'operator';
  
  // Use high-end modern notionists developer illustration instead of text initials
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(cleanSeed)}&backgroundColor=0f172a,1e293b,1e1b4b,022c22,172554`;
}

export function getUserInitials(name?: string, handle?: string): string {
  const source = (name || handle || 'User').trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

