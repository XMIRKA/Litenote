import { UserProfile } from '../types';

export const DEXTER_UID = 'n6aZieUx5GWjq9HZMWxCNWaB4pD2';
export const CREATOR_EMAIL = 'mirkamolaliserov87@gmail.com';
export const CREATOR_HANDLES = [
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
  'detective',
];

export function isCreatorAccount(user?: { email?: string; handle?: string; uid?: string; authorHandle?: string; displayName?: string; role?: string } | null): boolean {
  if (!user) return false;
  if (user.uid && user.uid === DEXTER_UID) return true;
  const handle = (user.handle || (user as any).authorHandle || '').toLowerCase().trim().replace(/^@/, '');
  const displayName = ((user as any).displayName || (user as any).authorName || '').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();
  
  if (handle === 'developer' || handle === 'dexter' || displayName === 'dexter') return true;
  if (email === CREATOR_EMAIL.toLowerCase() && (handle === 'developer' || handle === 'dexter' || displayName === 'dexter' || user.role === 'creator')) return true;
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
