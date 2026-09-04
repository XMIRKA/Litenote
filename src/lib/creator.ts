import { UserProfile } from '../types';

export const CREATOR_EMAIL = 'mirkamolaliserov87@gmail.com';
export const CREATOR_HANDLES = [
  'mirkamol',
  'mirkamolaliserov87',
  'admin',
  'creator',
  'founder',
  'developer',
  'dexter',
  'dexter @developer',
  'dexter developer',
];

export const COFOUNDER_HANDLES = [
  'patrick_jane',
  'patrick',
  'jane',
  'patrickjane',
  'patrick jane',
];

export function isCreatorAccount(user?: { email?: string; handle?: string; uid?: string; authorHandle?: string; displayName?: string; role?: string } | null): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const handle = (user.handle || (user as any).authorHandle || '').toLowerCase().trim().replace(/^@/, '');
  const displayName = ((user as any).displayName || (user as any).authorName || '').toLowerCase().trim();
  
  if (email === CREATOR_EMAIL.toLowerCase()) return true;
  if (CREATOR_HANDLES.some((h) => handle === h.toLowerCase() || displayName === h.toLowerCase() || handle.includes(h.toLowerCase()))) return true;
  if (user.role === 'creator') return true;
  return false;
}

export function isCoFounderAccount(user?: { email?: string; handle?: string; uid?: string; authorHandle?: string; displayName?: string; role?: string } | null): boolean {
  if (!user) return false;
  const handle = (user.handle || (user as any).authorHandle || '').toLowerCase().trim().replace(/^@/, '');
  const displayName = ((user as any).displayName || (user as any).authorName || '').toLowerCase().trim();

  if (COFOUNDER_HANDLES.some((h) => handle === h.toLowerCase() || displayName === h.toLowerCase())) return true;
  if ((user as any).isCoFounder || (user as any).roleTitle === 'Co-Founder') return true;
  return false;
}
