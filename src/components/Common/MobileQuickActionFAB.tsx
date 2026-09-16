import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  X,
  PenSquare,
  Sparkles,
  MessageSquare,
  Search,
  ArrowUp,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONFIGS } from '../../lib/theme';

interface MobileQuickActionFABProps {
  onNewPost: () => void;
  onOpenAI: () => void;
  onOpenMessenger: () => void;
  onOpenSearch: () => void;
  onScrollToTop: () => void;
  showScrollToTop?: boolean;
  isVisible?: boolean;
}

export const MobileQuickActionFAB: React.FC<MobileQuickActionFABProps> = ({
  onNewPost,
  onOpenAI,
  onOpenMessenger,
  onOpenSearch,
  onScrollToTop,
  showScrollToTop = false,
  isVisible = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { accentColor } = useAuth();
  const theme = THEME_CONFIGS[accentColor] || THEME_CONFIGS['cyber-green'];
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  if (!isVisible) return null;

  const toggleFAB = () => {
    triggerHaptic('medium');
    setIsOpen((prev) => !prev);
  };

  const handleAction = (callback: () => void) => {
    triggerHaptic('light');
    setIsOpen(false);
    callback();
  };

  return (
    <div
      ref={fabRef}
      className="md:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-2.5 pointer-events-auto select-none"
    >
      {/* Expanded Speed Dial Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="flex flex-col items-end gap-2 mb-1"
          >
            {/* Action 1: New Post */}
            <button
              onClick={() => handleAction(onNewPost)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#081524]/95 backdrop-blur-xl border border-emerald-500/40 text-emerald-300 shadow-[0_6px_20px_rgba(0,0,0,0.6)] active:scale-95 transition-transform"
            >
              <span className="text-xs font-semibold tracking-wide">Новый пост</span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                <PenSquare className="w-4 h-4" />
              </div>
            </button>

            {/* Action 2: Ask Litenote AI */}
            <button
              onClick={() => handleAction(onOpenAI)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#081524]/95 backdrop-blur-xl border border-cyan-500/40 text-cyan-300 shadow-[0_6px_20px_rgba(0,0,0,0.6)] active:scale-95 transition-transform"
            >
              <span className="text-xs font-semibold tracking-wide">Litenote AI</span>
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </button>

            {/* Action 3: New Chat */}
            <button
              onClick={() => handleAction(onOpenMessenger)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#081524]/95 backdrop-blur-xl border border-indigo-500/40 text-indigo-300 shadow-[0_6px_20px_rgba(0,0,0,0.6)] active:scale-95 transition-transform"
            >
              <span className="text-xs font-semibold tracking-wide">Чаты</span>
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
                <MessageSquare className="w-4 h-4" />
              </div>
            </button>

            {/* Action 4: Search */}
            <button
              onClick={() => handleAction(onOpenSearch)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#081524]/95 backdrop-blur-xl border border-slate-700 text-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.6)] active:scale-95 transition-transform"
            >
              <span className="text-xs font-semibold tracking-wide">Поиск</span>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300">
                <Search className="w-4 h-4" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Scroll To Top Pill if scrolled down */}
      <AnimatePresence>
        {showScrollToTop && !isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => {
              triggerHaptic('light');
              onScrollToTop();
            }}
            className="w-10 h-10 rounded-full bg-[#081524]/90 backdrop-blur-lg border border-slate-700 text-slate-300 flex items-center justify-center shadow-lg active:scale-90 transition-transform mb-1"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Trigger Floating Action Button */}
      <motion.button
        onClick={toggleFAB}
        whileTap={{ scale: 0.92 }}
        style={{
          background: `linear-gradient(135deg, ${theme.hex}, #00F0FF)`,
          boxShadow: `0 8px 25px rgba(${theme.rgb}, 0.45)`,
        }}
        className="w-13 h-13 rounded-full text-slate-950 font-bold flex items-center justify-center relative cursor-pointer group"
      >
        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-25 pointer-events-none" />
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {isOpen ? <X className="w-6 h-6 stroke-[2.5]" /> : <Plus className="w-6 h-6 stroke-[2.5]" />}
        </motion.div>
      </motion.button>
    </div>
  );
};
