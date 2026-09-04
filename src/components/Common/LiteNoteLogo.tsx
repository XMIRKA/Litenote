import React from 'react';
import { motion } from 'motion/react';

interface LiteNoteLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' | number;
  showText?: boolean;
  showSubtitle?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LiteNoteLogo: React.FC<LiteNoteLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  animated = true,
  className = '',
  onClick,
}) => {
  // Dimension map for icon & typography
  const sizeMap: Record<string, { icon: number; text: string; sub: string; gap: string }> = {
    xs: {
      icon: 24,
      text: 'text-sm',
      sub: 'text-[8px]',
      gap: 'gap-1.5',
    },
    sm: {
      icon: 32,
      text: 'text-base',
      sub: 'text-[9px]',
      gap: 'gap-2',
    },
    md: {
      icon: 42,
      text: 'text-xl',
      sub: 'text-[10px]',
      gap: 'gap-2.5',
    },
    lg: {
      icon: 56,
      text: 'text-2xl',
      sub: 'text-xs',
      gap: 'gap-3',
    },
    xl: {
      icon: 80,
      text: 'text-4xl',
      sub: 'text-sm',
      gap: 'gap-4',
    },
    hero: {
      icon: 120,
      text: 'text-5xl sm:text-6xl',
      sub: 'text-xs sm:text-sm tracking-[0.3em]',
      gap: 'gap-5',
    },
  };

  const config = typeof size === 'number'
    ? { icon: size, text: 'text-sm', sub: 'text-[8px]', gap: 'gap-1.5' }
    : (sizeMap[size] || sizeMap.md);

  const { icon: iconSize, text: textSize, sub: subSize, gap } = config;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${gap} select-none ${
        onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
      } ${className}`}
    >
      {/* Official LiteNote SVG Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Outer Cyan/Emerald Glow Aura */}
        {animated && (
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.7, 0.35],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -inset-1 rounded-full bg-emerald-500/20 blur-md pointer-events-none"
          />
        )}

        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
        >
          <defs>
            {/* Emerald to Cyan Neon Gradients */}
            <linearGradient id="ln-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            <linearGradient id="ln-doc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0E2F38" />
              <stop offset="100%" stopColor="#061B24" />
            </linearGradient>

            <linearGradient id="ln-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            <filter id="ln-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Concentric Cyber Rings */}
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="url(#ln-ring-grad)"
            strokeWidth="2.5"
            strokeDasharray="14 6"
            className={animated ? 'animate-[spin_20s_linear_infinite]' : ''}
            style={{ transformOrigin: 'center' }}
            opacity="0.85"
          />

          <circle
            cx="50"
            cy="50"
            r="41"
            stroke="#06B6D4"
            strokeWidth="1.2"
            opacity="0.4"
          />

          {/* Center Circular Badge Body */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="url(#ln-doc-grad)"
            stroke="url(#ln-ring-grad)"
            strokeWidth="3"
          />

          {/* Code Document Contour */}
          <path
            d="M32 26C32 23.7909 33.7909 22 36 22H56L68 34V74C68 76.2091 66.2091 78 64 78H36C33.7909 78 32 76.2091 32 74V26Z"
            fill="#081E26"
            stroke="url(#ln-accent-grad)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Document Fold Corner */}
          <path
            d="M56 22V34H68"
            stroke="url(#ln-accent-grad)"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="#062832"
          />

          {/* Code Text Details: { let code = new User; { connection.open(); } */}
          <g fill="#34D399" className="font-mono" style={{ fontSize: '5.2px', fontWeight: 'bold' }}>
            <text x="36" y="40">{'{ let code ='}</text>
            <text x="38" y="47">{'new User;'}</text>
            <text x="36" y="55">{'{ connect.'}</text>
            <text x="38" y="62">{'open();'}</text>
            <text x="36" y="69">{'}'}</text>
          </g>

          {/* Spark Star in Top Right */}
          <path
            d="M59 28L60.5 31.5L64 33L60.5 34.5L59 38L57.5 34.5L54 33L57.5 31.5L59 28Z"
            fill="#22D3EE"
            filter="url(#ln-glow)"
          />

          {/* Neon Stylus / Pen drawing connection in bottom right */}
          <g transform="translate(48, 48) rotate(-45)">
            <rect
              x="0"
              y="0"
              width="8"
              height="20"
              rx="2"
              fill="url(#ln-accent-grad)"
              stroke="#042F2E"
              strokeWidth="1"
            />
            <polygon points="0,20 8,20 4,26" fill="#22D3EE" />
            <circle cx="4" cy="27" r="1" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {/* Official Typography (LITENOTE • THE CODER'S NETWORK) */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight leading-none ${textSize} text-white flex items-center`}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-300 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">
              LITE
            </span>
            <span className="text-white">NOTE</span>
          </div>

          {showSubtitle && (
            <span
              className={`font-mono font-bold text-emerald-400 uppercase tracking-widest leading-tight mt-0.5 opacity-90 ${subSize}`}
            >
              THE CODER&apos;S NETWORK
            </span>
          )}
        </div>
      )}
    </div>
  );
};
