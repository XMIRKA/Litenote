import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LiteNoteLogo } from './LiteNoteLogo';
import { CyberNetworkBackground } from './CyberNetworkBackground';
import {
  Shield,
  Terminal,
  Zap,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Globe,
  Radio
} from 'lucide-react';

interface AppEntrySplashProps {
  onComplete: () => void;
  userName?: string;
}

const BOOT_LOGS = [
  'INITIALIZING LITENOTE KERNEL v3.0...',
  'CONNECTING TO THE CODER\'S NETWORK...',
  'ESTABLISHING ENCRYPTED SOCKET HANDSHAKE [TCP/IP]...',
  'FIREBASE REAL-TIME CLOUD REPLICA: SYNCED',
  'GEMINI AI REASONING CORE: ONLINE',
  'AUTHENTICATION & PERMISSION MATRIX: GRANTED',
  'ACCESSING CODER NEXUS WORKSPACE...',
];

export const AppEntrySplash: React.FC<AppEntrySplashProps> = ({ onComplete, userName }) => {
  const [logIndex, setLogIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Play subtle futuristic chime using Web Audio API
  const playBootChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before gesture
    }
  };

  useEffect(() => {
    playBootChime();

    // Log stepper interval
    const logInterval = setInterval(() => {
      setLogIndex((prev) => {
        if (prev < BOOT_LOGS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 180);

    // Progress bar ticker
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsCompleted(true);
          setTimeout(() => {
            onComplete();
          }, 350);
          return 100;
        }
        return prev + 15;
      });
    }, 140);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#05080E] text-white select-none overflow-hidden"
    >
      {/* Background Cyber Web Canvas */}
      <CyberNetworkBackground opacity={0.65} nodeCount={60} />

      {/* Radial Neon Glows */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[150px] pointer-events-none -top-40 -left-20 animate-pulse" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none -bottom-40 -right-20 animate-pulse" />

      {/* Top Protocol Status Bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-[11px] font-mono text-emerald-400/80 z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="tracking-widest">NETWORK: ACTIVE // 192.168.0.1</span>
        </div>
        <button
          onClick={onComplete}
          className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-white hover:border-emerald-400 transition-colors cursor-pointer text-[10px]"
        >
          [ПРОПУСТИТЬ / SKIP]
        </button>
      </div>

      {/* Main Center Console */}
      <div className="relative flex flex-col items-center max-w-lg w-full px-6 space-y-7 text-center z-10">
        {/* Animated LiteNote Emblem */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <LiteNoteLogo size="hero" showText={true} showSubtitle={true} animated={true} />
        </motion.div>

        {/* Coder Welcome Greeting */}
        {userName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="px-4 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs shadow-sm"
          >
            👋 Авторизован: <span className="font-bold text-white">{userName}</span>
          </motion.div>
        )}

        {/* Live Terminal Diagnostic Stream */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="w-full bg-[#08101C]/90 border border-[#142938] rounded-2xl p-4 shadow-2xl backdrop-blur-md text-left font-mono space-y-2.5"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>TERMINAL STREAM // BOOT_SEQUENCE</span>
            </div>
            <span className="text-emerald-400">{progress}%</span>
          </div>

          {/* Active Log Display */}
          <div className="space-y-1.5 h-16 overflow-hidden flex flex-col justify-end text-[11px]">
            {BOOT_LOGS.slice(0, logIndex + 1).slice(-3).map((log, idx) => (
              <motion.div
                key={log}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 truncate"
              >
                <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className={idx === 2 || logIndex <= 2 ? 'text-emerald-300 font-semibold' : 'text-slate-500'}>
                  {log}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Glowing Progress Track */}
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.25">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.8)]"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.15 }}
            />
          </div>
        </motion.div>

        {/* Micro Specs Footer */}
        <div className="flex items-center justify-center gap-6 text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>ECC-256</span>
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>GLOBAL P2P</span>
          </span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-teal-400" />
            <span>AI CORE READY</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};
