import React from 'react';
import { Crown, Sparkles, CheckCircle2, ShieldCheck, Gem } from 'lucide-react';
import { isCreatorAccount, isCoFounderAccount } from '../../lib/creator';

interface CreatorBadgeProps {
  user?: { email?: string; handle?: string; uid?: string; authorHandle?: string; displayName?: string; role?: string } | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const CreatorBadge: React.FC<CreatorBadgeProps> = ({
  user,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  if (!isCreatorAccount(user)) return null;

  const badgeStyles = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-2.5 py-0.5 text-[10px]',
    lg: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)] select-none shrink-0 tracking-wider font-mono ${badgeStyles[size]} ${className}`}
      title="Официальный создатель Litenote (Creator & Lead Architect)"
    >
      <Crown className="w-3 h-3 text-amber-400 fill-amber-400/40" />
      <span>CREATOR</span>
    </span>
  );
};

export const CoFounderBadge: React.FC<CreatorBadgeProps> = ({
  user,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  if (!isCoFounderAccount(user)) return null;

  const badgeStyles = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-2.5 py-0.5 text-[10px]',
    lg: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)] select-none shrink-0 tracking-wider font-mono ${badgeStyles[size]} ${className}`}
      title="Сооснователь Litenote (Co-Founder)"
    >
      <Gem className="w-3 h-3 text-cyan-400 fill-cyan-400/40" />
      <span>CO-FOUNDER</span>
    </span>
  );
};

export const VerifiedCheck: React.FC<{
  user?: { email?: string; handle?: string; uid?: string; authorHandle?: string; displayName?: string; role?: string } | null;
  className?: string;
}> = ({ user, className = '' }) => {
  const isCreator = isCreatorAccount(user);
  const isCoFounder = isCoFounderAccount(user);

  if (isCreator) {
    return (
      <span
        title="Официальный создатель Litenote (Founder)"
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
      >
        <span className="relative flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-amber-400 fill-amber-400/30" />
          <Sparkles className="w-2.5 h-2.5 text-yellow-300 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '4s' }} />
        </span>
      </span>
    );
  }

  if (isCoFounder) {
    return (
      <span
        title="Сооснователь Litenote (Co-Founder)"
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
      >
        <span className="relative flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 fill-cyan-400/30" />
          <Sparkles className="w-2.5 h-2.5 text-cyan-200 absolute -top-1 -right-1 animate-pulse" />
        </span>
      </span>
    );
  }

  return (
    <span
      title="Верифицированный профиль"
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
    </span>
  );
};
